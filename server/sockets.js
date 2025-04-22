const {WebhookClient} = require('discord.js');
const Mutex = require('async-mutex').Mutex;
const randomstring = require("randomstring");
require('dotenv').config({path: __dirname + '/.env'});

const accounts = require('./accounts');
const pokemonUtil = require('./pokemon-util');

//Friend Trade data
const gFriendTradeClients = {};
const gCodesInUse = {};

const FRIEND_TRADE_INITIAL = 0;
const FRIEND_TRADE_CONNECTED = 1;
const FRIEND_TRADE_NOTIFIED_CONNECTION = 2;
const FRIEND_TRADE_ACCEPTED_TRADE = 3;
const FRIEND_TRADE_ENDING_TRADE = 4;

//Wonder Trade data
const gWonderTradeDiscordWebhook = (process.env["WONDER_TRADE_WEBHOOK"]) ? new WebhookClient({url: process.env["WONDER_TRADE_WEBHOOK"]}) : null;
const gWonderTradeClients = {};
const gWonderTradeMutex = new Mutex();
let gWonderTradeSpecies = {};
let gLastWonderTradeAt = 0;

const WONDER_TRADE_NOT_IN_PROGRESS = 0;
const WONDER_TRADE_IN_PROGRESS = 1;
const WONDER_TRADE_TRADED = 2;

const WONDER_TRADE_SPECIES_COOLDOWN = 5 * 60 * 1000; //5 Minutes

//General data
const INVALID_CLOUD_DATA_SYNC_KEY_ERROR = "The Cloud data has already been opened in another tab!\nPlease reload the page to avoid data corruption.";


/**
 * Creates a friend code to initiate trading.
 * @returns {String} - The code the user's friend has to submit in order to connect to them for a Friend Trade.
 */
function CreateFriendCode()
{
    let code;

    do
    {
        code = randomstring.generate({length: 8, charset: "alphanumeric", capitalization: "lowercase"});
    } while (code in gCodesInUse);

    return code;
}

/**
 * Locks the Wonder Trade data and prevents it from being modified again until it's unlocked.
 * @returns {Promise<void>} - A promise that resolves when the lock is acquired.
 */
async function LockWonderTrade()
{
    await gWonderTradeMutex.acquire();
}

/**
 * Unlocks the Wonder Trade data for modifying again.
 */
function UnlockWonderTrade()
{
    gWonderTradeMutex.release();
}

/**
 * Validates that the client trying to trade didn't already open the Cloud data in a new tab.
 * @param {String} username - The user who's trying to trade.
 * @param {String} cloudDataSyncKey - The cloud data sync key sent from the client to verify.
 * @param {Boolean} randomizer - Whether or not the Cloud Boxes are for a randomized save.
 * @param {WebSocket} socket - The web socket used to connect to the client.
 * @param {String} clientType - Either "FT" for "Friend Trade", or "WT" for "Wonder Trade".
 * @returns {Promise<Boolean>} Whether the trade is allowed to happen. False if the user already opened their Cloud Boxes in a new tab.
 */
async function CloudDataSyncKeyIsValidForTrade(username, cloudDataSyncKey, randomizer, socket, clientType)
{
    if (username !== "")
    {
        let userKey = await accounts.GetCloudDataSyncKey(username, randomizer);
        
        if (userKey === "")
        {
            console.log(`${clientType}-Client ${username} sent no cloud data sync key`);
            socket.emit("invalidCloudDataSyncKey", "The cloud data sync key was missing!");
            return false;
        }
        else if (cloudDataSyncKey !== userKey)
        {
            console.log(`${clientType}-Client ${username} sent an old cloud data sync key`);
            socket.emit("invalidCloudDataSyncKey", INVALID_CLOUD_DATA_SYNC_KEY_ERROR);
            return false;
        }
    }

    return true;
}

/**
 * Gets the list of clients connected to Wonder Trade that can trade their Pokemon to the current user.
 * @param {String} clientId - The current client id to check the user's that can trade to it.
 * @param {String} username - The username of the current client.
 * @param {Boolean} randomizer - Whether or not the current client is using a randomized save.
 * @returns {Array<String>} - A list of client ids that can trade with the current user.
 */
function GetValidWonderTradeClientsFor(clientId, username, randomizer)
{
    let clients = [];

    if (accounts.IsUserBannedFromWonderTrade(username))
        return clients; //Can't trade at all if you've been banned, but still allow the user to connect so they don't just create a second account to keep trading

    for (let x of Object.keys(gWonderTradeClients))
    {
        let otherWonderTradeData = gWonderTradeClients[x];

        if (x === clientId //Can't trade with yourself
        || otherWonderTradeData.tradedWith !== 0 //Can't trade with someone who's already traded
        || otherWonderTradeData.randomizer !== randomizer //Can't trade with someone who's randomizer setting doesn't match
        || accounts.IsUserBannedFromWonderTrade(otherWonderTradeData.username)) //Can't trade with someone who's been banned
            continue;

        if (username in gWonderTradeSpecies)
        {
            let otherUser = otherWonderTradeData.username;
            let otherSpecies = pokemonUtil.GetSpecies(otherWonderTradeData.pokemon);

            if (otherUser in gWonderTradeSpecies[username] //Traded with this user before
            && otherSpecies in gWonderTradeSpecies[username][otherUser]) //Traded this species with this user before
            {
                let lastReceivedAt = gWonderTradeSpecies[username][otherUser][otherSpecies];
                let timeSince = Date.now() - lastReceivedAt;

                if (timeSince < WONDER_TRADE_SPECIES_COOLDOWN)
                    continue; //Prevent receiving dupes from the same person very quickly
                else
                    delete gWonderTradeSpecies[username][otherUser][otherSpecies]; //This species can be traded again
            }
        }

        clients.push(x);
    }

    return clients;
}

/**
 * Adds an entry in the table that says which Pokemon this user has received from a specific user recently.
 * @param {String} username - The user to add the entry for.
 * @param {String} receivedFromUser - The user the Pokemon was received from.
 * @param {String} species - The species received from the user.
 */
function AddUserToWonderTradeSpeciesTable(username, receivedFromUser, species)
{
    TryWipeWonderTradeSpeciesData();

    if (!(username in gWonderTradeSpecies))
        gWonderTradeSpecies[username] = {};

    if (!(receivedFromUser in gWonderTradeSpecies[username]))
        gWonderTradeSpecies[username][receivedFromUser] = {};

    gWonderTradeSpecies[username][receivedFromUser][species] = Date.now();
}

/**
 * Tries to wipe the gWonderTradeSpecies table to preserve space in memory.
 */
function TryWipeWonderTradeSpeciesData()
{
    if (gLastWonderTradeAt !== 0) //There has been a Wonder Trade since the server started or the data was last wiped
    {
        let timeSince = Date.now() - gLastWonderTradeAt;
        if (timeSince >= WONDER_TRADE_SPECIES_COOLDOWN)
        {
            gWonderTradeSpecies = {}; //No point in keeping data in memory when it's all expired anyway
            gLastWonderTradeAt = 0;
        }
    }
}

/**
 * Sends a message to the Wonder Trade Discord channel.
 * @param {String} title - The title of the message.
 * @param {Number} color - The color of the message.
 * @param {Number} messageId - The ID of the message to edit, or 0 to send a new message.
 * @returns {Promise<Number>} - The ID of the message sent or edited.
 */
async function SendWonderTradeDiscordMessage(title, color, messageId)
{
    let attempts = 0;

    if (!gWonderTradeDiscordWebhook)
    {
        console.error("Wonder Trade Discord webhook is not set up!");
        return 0;
    }

    const params =
    {
        username: "Unbound Cloud",
        content: "",
        embeds: [
            {
                "title": title,
                "color": color,
            }
        ]
    };

    //Try to edit a previously sent message
    if (messageId !== 0) //A message was previously sent
    {
        for (attempts = 0; attempts < 3; ++attempts) //Try 3 times in case there is a connection issue
        {
            try
            {
                await gWonderTradeDiscordWebhook.editMessage(messageId, params);
                return messageId;
            }
            catch (err)
            {
                console.error(`An error occurred editing the last Wonder Trade Discord message:\n${err}`);
            }
        }
    }

    //Send a new message
    for (attempts = 0; attempts < 3; ++attempts) //Try 3 times in case there is a connection issue
    {
        try
        {
            let res = await gWonderTradeDiscordWebhook.send(params);
            return res.id;
        }
        catch (err)
        {
            console.error(`An error occurred sending the Wonder Trade Discord message:\n${err}`);
        }
    }

    return 0;
}

/**
 * Initialize websocket functionality.
 * @param {Object} io - The socket.io instance.
 */
function InitSockets(io)
{
    //When a connection is made, loop forever until a Wonder Trade is made
    io.on("connection", async function(socket)
    {
        const clientId = socket.id;
        console.log(`Client ${clientId} connected`);

        socket.on("tradeType", async (tradeType, username) =>
        {
            if (tradeType === "WONDER_TRADE")
            {
                console.log(`[WT] ${clientId} (${username}) wants a Wonder Trade`);

                socket.on("message", async (pokemonToSend, randomizer, username, cloudDataSyncKey) =>
                {
                    if (!(await CloudDataSyncKeyIsValidForTrade(username, cloudDataSyncKey, randomizer, socket, "WT")))
                        return;

                    await LockWonderTrade(); //So no other threads can access it right now

                    const keys = GetValidWonderTradeClientsFor(clientId, username, randomizer);

                    if (!pokemonUtil.ValidatePokemon(pokemonToSend, false))
                    {
                        console.log(`[WT] ${username} sent an invalid Pokemon for a Wonder Trade`);
                        socket.emit("invalidPokemon");
                    }
                    else
                    {
                        if (keys.length !== 0)
                        {
                            let otherUsername = gWonderTradeClients[keys[0]].username;
                            let pokemonToReceive = gWonderTradeClients[keys[0]].pokemon;
                            let discordMessageId = gWonderTradeClients[keys[0]].discordMessageId;
                            gWonderTradeClients[keys[0]] =  {username: otherUsername, receivedFrom: username, pokemon: pokemonToSend, originalPokemon: pokemonToReceive, tradedWith: clientId, discordMessageId: discordMessageId}; //Immediately lock the data
                            gWonderTradeClients[clientId] = {username: username, receivedFrom: otherUsername, pokemon: pokemonToReceive, originalPokemon: pokemonToSend, tradedWith: keys[0]}; //Set this client as traded
                            AddUserToWonderTradeSpeciesTable(username, otherUsername, pokemonUtil.GetSpecies(pokemonToReceive));
                            AddUserToWonderTradeSpeciesTable(otherUsername, username, pokemonUtil.GetSpecies(pokemonToSend));
                            gLastWonderTradeAt = Date.now();
                            //Note that the randomizer key isn't needed anymore
                        }
                        else
                        {
                            if (!(clientId in gWonderTradeClients)) //Don't overwrite previously requested mon
                            {
                                let messageId = await SendWonderTradeDiscordMessage("Someone is waiting for a Wonder Trade!", 0x00FF00, 0); //Green
                                gWonderTradeClients[clientId] = {username: username, pokemon: pokemonToSend, tradedWith: 0, randomizer: randomizer, discordMessageId: messageId};
                            }
                        }
                    }

                    UnlockWonderTrade();
                });

                socket.on('disconnect', async () =>
                {
                    await LockWonderTrade();
                    console.log(`[WT] ${username} disconnected`);

                    if (clientId in gWonderTradeClients && gWonderTradeClients[clientId].tradedWith === 0)
                        await SendWonderTradeDiscordMessage("The Wonder Trade was cancelled...", 0xFF0000, gWonderTradeClients[clientId].discordMessageId); //Red

                    delete gWonderTradeClients[clientId]; //Remove data so no one trades with it
                    UnlockWonderTrade();
                });
            }
            else if (tradeType === "FRIEND_TRADE")
            {
                console.log(`[FT] ${clientId} (${username}) wants a Friend Trade`);

                socket.on("createCode", async (randomizer, username, cloudDataSyncKey) =>
                {                
                    if (!(await CloudDataSyncKeyIsValidForTrade(username, cloudDataSyncKey, randomizer, socket, "FT")))
                        return;

                    let code = CreateFriendCode();
                    socket.emit("createCode", code);
                    console.log(`[FT] ${username} has created code "${code}"`);
                    gFriendTradeClients[clientId] = {username: username, code: code, friend: "", randomizer: randomizer, state: FRIEND_TRADE_INITIAL};
                    gCodesInUse[code] = true;
                });

                socket.on("checkCode", async (code, randomizer, username, cloudDataSyncKey) =>
                {
                    let partnerFound = false;
                    console.log(`[FT] ${username} is looking for code "${code}"`);

                    if (!(await CloudDataSyncKeyIsValidForTrade(username, cloudDataSyncKey, randomizer, socket, "FT")))
                        return;

                    for (let otherClientId of Object.keys(gFriendTradeClients))
                    {
                        let otherUserName = gFriendTradeClients[otherClientId].username;

                        if (gFriendTradeClients[otherClientId].friend === "" //Hasn't found a partner yet
                        && gFriendTradeClients[otherClientId].code === code) //Code matches so this will be the partner
                        {
                            partnerFound = true;
                            console.log(`[FT] ${username} has matched with ${otherUserName}`);

                            if ((!randomizer && !gFriendTradeClients[otherClientId].randomizer)
                            || (randomizer && gFriendTradeClients[otherClientId].randomizer)) //Randomizer status matches
                            {
                                gFriendTradeClients[clientId] = {username: username, code: code, friend: otherClientId, state: FRIEND_TRADE_CONNECTED};
                                gFriendTradeClients[otherClientId] = {username: otherUserName, code: code, friend: clientId, state: FRIEND_TRADE_CONNECTED};
                                //Randomizer keys no longer matter
                            }
                            else
                            {
                                console.log(`But [FT]s ${username} and ${otherUserName} don't match randomizer statuses`);
                                socket.emit("mismatchedRandomizer");
                            }
                        }
                    }

                    if (!partnerFound)
                    {
                        console.log(`[FT] ${username} could not find partner`);
                        socket.emit("friendNotFound");
                    }
                });

                socket.on('tradeOffer', (pokemon) =>
                {
                    if (!pokemonUtil.ValidatePokemon(pokemon, true))
                    {
                        console.log(`[FT] ${username} sent an invalid Pokemon for a Friend Trade`);
                        socket.emit("invalidPokemon");
                    }
                    else if (clientId in gFriendTradeClients)
                    {
                        if (pokemon != null && "species" in pokemon)
                            console.log(`[FT] ${username} is offering ${pokemonUtil.GetSpecies(pokemon)}`);
                        else
                            console.log(`[FT] ${username} cancelled the trade offer`);

                        gFriendTradeClients[clientId].offeringPokemon = pokemon;
                        gFriendTradeClients[clientId].notifiedFriendOfOffer = false;
                    }
                });

                socket.on('acceptedTrade', () =>
                {
                    gFriendTradeClients[clientId].acceptedTrade = true;
                });

                socket.on('cancelledTradeAcceptance', () =>
                {
                    gFriendTradeClients[clientId].acceptedTrade = false;
                });

                socket.on('tradeAgain', () =>
                {
                    console.log(`[FT] ${username} wants to trade again`);
                    gFriendTradeClients[clientId].state = FRIEND_TRADE_NOTIFIED_CONNECTION;
                    gFriendTradeClients[clientId].offeringPokemon = null;
                    gFriendTradeClients[clientId].notifiedFriendOfOffer = false;
                    gFriendTradeClients[clientId].acceptedTrade = false;
                });

                socket.on('disconnect', () =>
                {
                    if (clientId in gFriendTradeClients)
                        delete gCodesInUse[gFriendTradeClients[clientId].code];
                    delete gFriendTradeClients[clientId]; //Remove data so no one trades with it
                    console.log(`[FT] ${username} disconnected`);
                });
            }
        });

        while (true)
        {
            let friend, friendPokemon, originalPokemon;

            await LockWonderTrade();
            if (clientId in gWonderTradeClients && gWonderTradeClients[clientId].tradedWith !== 0)
            {
                originalPokemon = gWonderTradeClients[clientId].originalPokemon;
                friendPokemon = Object.assign({}, gWonderTradeClients[clientId].pokemon);
                pokemonUtil.UpdatePokemonAfterNonFriendTrade(friendPokemon, originalPokemon);
                socket.send(friendPokemon, gWonderTradeClients[clientId].receivedFrom);

                if (clientId in gWonderTradeClients)
                {
                    let species1 = pokemonUtil.GetMonSpeciesName(originalPokemon, true);
                    let species2 = pokemonUtil.GetMonSpeciesName(friendPokemon, true);
                    console.log(`[WT] ${gWonderTradeClients[clientId].username} received ${species2} from ${gWonderTradeClients[clientId].receivedFrom}`);
                    if ("discordMessageId" in gWonderTradeClients[clientId])
                        await SendWonderTradeDiscordMessage(`${species1} and ${species2} were traded!`, 0x0000FF, gWonderTradeClients[clientId].discordMessageId); //Blue
                }
                //Data deleted when client disconnects in case they don't receive this transmission
            }
            UnlockWonderTrade();

            if (clientId in gFriendTradeClients
            && gFriendTradeClients[clientId].friend !== "")
            {
                let username = gFriendTradeClients[clientId].username;

                switch (gFriendTradeClients[clientId].state)
                {
                    case FRIEND_TRADE_CONNECTED:
                        console.log(`[FT] ${username} has been notified of the friend connection`);
                        gFriendTradeClients[clientId].state = FRIEND_TRADE_NOTIFIED_CONNECTION;
                        socket.emit("friendFound");
                        break;
                    case FRIEND_TRADE_NOTIFIED_CONNECTION:
                        if (!(gFriendTradeClients[clientId].code in gCodesInUse)) //Partner disconnected
                            socket.emit("partnerDisconnected");
                        else
                        {
                            friend = gFriendTradeClients[clientId].friend;

                            if (friend in gFriendTradeClients)
                            {
                                if ("offeringPokemon" in gFriendTradeClients[friend]
                                && !gFriendTradeClients[friend].notifiedFriendOfOffer)
                                {
                                    //Send the new offer
                                    friendPokemon = gFriendTradeClients[friend].offeringPokemon;

                                    if (friendPokemon == null || !("species" in friendPokemon))
                                        console.log(`[FT] ${username} has been notified of the the trade offer cancellation`);
                                    else
                                        console.log(`[FT] ${username} received offer for ${pokemonUtil.GetSpecies(friendPokemon)}`);

                                    socket.emit("tradeOffer", friendPokemon); //Can be sent null (means partner cancelled offer)
                                    gFriendTradeClients[friend].notifiedFriendOfOffer = true;
                                }
                                else if ("acceptedTrade" in gFriendTradeClients[clientId]
                                && gFriendTradeClients[clientId].acceptedTrade
                                && "acceptedTrade" in gFriendTradeClients[friend]
                                && gFriendTradeClients[friend].acceptedTrade)
                                {
                                    //Swap all necessary data now so in case one partner disconnects after they receive their Pokemon the trade will still complete
                                    gFriendTradeClients[clientId].state = FRIEND_TRADE_ACCEPTED_TRADE;
                                    gFriendTradeClients[clientId].friendPokemon = gFriendTradeClients[friend].offeringPokemon;
                                    gFriendTradeClients[clientId].friendUsername = gFriendTradeClients[friend].username;
                                    gFriendTradeClients[friend].state = FRIEND_TRADE_ACCEPTED_TRADE;
                                    gFriendTradeClients[friend].friendPokemon = gFriendTradeClients[clientId].offeringPokemon;
                                    gFriendTradeClients[friend].friendUsername = gFriendTradeClients[clientId].username;
                                }
                            }
                        }
                        break;
                    case FRIEND_TRADE_ACCEPTED_TRADE:
                        friend = gFriendTradeClients[clientId].friend;
                        friendPokemon = Object.assign({}, gFriendTradeClients[clientId].friendPokemon);
                        pokemonUtil.UpdatePokemonAfterFriendTrade(friendPokemon, gFriendTradeClients[clientId].offeringPokemon);
                        socket.emit("acceptedTrade", friendPokemon);
                        gFriendTradeClients[clientId].state = FRIEND_TRADE_ENDING_TRADE;
                        console.log(`[FT] ${username} received ${pokemonUtil.GetSpecies(friendPokemon)} from ${gFriendTradeClients[clientId].friendUsername}`);
                        break;
                    default:
                        break;
                }
            }

            const nextLoopTime = 1000; //1 Second
            await new Promise(r => setTimeout(r, nextLoopTime)).catch(error => console.error(`Timeout error: ${error}`)); //Wait until checking again
        }
    });
}

module.exports = {InitSockets};
