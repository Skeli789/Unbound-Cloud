const express = require('express');
const app = express();

const Mutex = require('async-mutex').Mutex;
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const CryptoJS = require("crypto-js");
const {WebhookClient} = require('discord.js');
const fs = require('fs');
const http = require('http').Server(app);
const _ = require('lodash');
const randomstring = require("randomstring");
const {StatusCode} = require('status-code-enum');

const accounts = require('./accounts');
const pokemonUtil = require('./pokemon-util');
const util = require('./util');
require('dotenv').config({path: __dirname + '/.env'});

const gSecretKey = process.env["ENCRYPTION_KEY"] || "key";
const gWonderTradeDiscordWebhookURL = process.env["WONDER_TRADE_WEBHOOK"] || "";
const PORT = process.env.PORT || 3001;

const MAX_PAYLOAD_SIZE = 10; //10 MB
app.use(cors());
app.use(bodyParser.json({ limit: `${MAX_PAYLOAD_SIZE}mb` })); 
app.use(bodyParser.urlencoded({ limit: `${MAX_PAYLOAD_SIZE}mb`, extended: false }));

app.use(express.static('./images'));

var io = require('socket.io')(http, 
    {cors: {origin: PORT, methods: ["GET", "POST"], credentials: true}});


/*******************************************
            Web Socket Functions            
*******************************************/

const gWonderTradeDiscordWebhook = (gWonderTradeDiscordWebhookURL) ? new WebhookClient({url: gWonderTradeDiscordWebhookURL}) : null;
const gWonderTradeClients = {};
const gFriendTradeClients = {};
const gCodesInUse = {};
var gWonderTradeSpecies = {};
var gWonderTradeMutex = new Mutex();
var gLastWonderTradeAt = 0;

const WONDER_TRADE_NOT_IN_PROGRESS = 0;
const WONDER_TRADE_IN_PROGRESS = 1;
const WONDER_TRADE_TRADED = 2;

const FRIEND_TRADE_INITIAL = 0;
const FRIEND_TRADE_CONNECTED = 1;
const FRIEND_TRADE_NOTIFIED_CONNECTION = 2;
const FRIEND_TRADE_ACCEPTED_TRADE = 3;
const FRIEND_TRADE_ENDING_TRADE = 4;

const INVALID_CLOUD_DATA_SYNC_KEY_ERROR = "The Cloud data has already been opened in another tab!\nPlease reload the page to avoid data corruption.";
const WONDER_TRADE_SPECIES_COOLDOWN = 5 * 60 * 1000; //5 Minutes

/**
 * Creates a friend code to initiate trading.
 * @returns {String} - The code the user's friend has to submit in order to connect to them for a Friend Trade.
 */
function CreateFriendCode()
{
    var code;

    do
    {
        code = randomstring.generate({length: 8, charset: "alphanumeric", capitalization: "lowercase"});
    } while (code in gCodesInUse);

    return code;
}

/**
 * Locks the Wonder Trade data and prevents it from being modified again until it's unlocked.
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
 * @param {String} clientId - "The client's unique connection id."
 * @returns {Boolean} true if the trade is allowed to happen, false if the user already opened their Cloud Boxes in a new tab.
 */
async function CloudDataSyncKeyIsValidForTrade(username, cloudDataSyncKey, randomizer, socket, clientType, clientId)
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

async function SendWonderTradeDiscordMessage(title, color, messageId)
{
    var attempts = 0;

    if (!gWonderTradeDiscordWebhook)
    {
        console.error("Wonder Trade Discord webhook is not set up!");
        return 0;
    }

    var params =
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
        for (attempts = 0; attempts < 3; attempts++) //Try 3 times in case there is a connection issue
        {
            try
            {
                await gWonderTradeDiscordWebhook.editMessage(messageId, params);
                return messageId;
            }
            catch (err)
            {
                console.log(`An error occurred editing the last Wonder Trade Discord message:\n${err}`);
            }
        }
    }

    //Send a new message
    for (attempts = 0; attempts < 3; attempts++) //Try 3 times in case there is a connection issue
    {
        try
        {
            let res = await gWonderTradeDiscordWebhook.send(params);
            return res.id;
        }
        catch (err)
        {
            console.log(`An error occurred sending the Wonder Trade Discord message:\n${err}`);
        }
    }

    return 0;
}

// When a connection is made, loop forever until a Wonder Trade is made
io.on("connection", async function(socket)
{
    var clientId = socket.id;
    console.log(`Client ${clientId} connected`);

    socket.on("tradeType", async (tradeType, username) =>
    {
        if (tradeType === "WONDER_TRADE")
        {
            console.log(`[WT] ${clientId} (${username}) wants a Wonder Trade`);

            socket.on("message", async (pokemonToSend, randomizer, username, cloudDataSyncKey) =>
            {
                if (!(await CloudDataSyncKeyIsValidForTrade(username, cloudDataSyncKey, randomizer, socket, "WT", clientId)))
                    return;

                await LockWonderTrade(); //So no other threads can access it right now

                var keys = GetValidWonderTradeClientsFor(clientId, username, randomizer);

                if (!pokemonUtil.ValidatePokemon(pokemonToSend, false))
                {
                    console.log(`[WT] ${username} sent an invalid Pokemon for a Wonder Trade`);
                    socket.emit("invalidPokemon");
                }
                else
                {
                    if (keys.length !== 0)
                    {
                        var otherUsername = gWonderTradeClients[keys[0]].username;
                        var pokemonToReceive = gWonderTradeClients[keys[0]].pokemon;
                        var discordMessageId = gWonderTradeClients[keys[0]].discordMessageId;
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
                if (!(await CloudDataSyncKeyIsValidForTrade(username, cloudDataSyncKey, randomizer, socket, "FT", clientId)))
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

                if (!(await CloudDataSyncKeyIsValidForTrade(username, cloudDataSyncKey, randomizer, socket, "FT", clientId)))
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

        var nextLoopTime = 1000; //1 Second
        await new Promise(r => setTimeout(r, nextLoopTime)).catch(error => console.error(`Timeout error: ${error}`)); //Wait until checking again
    }
});

http.listen(PORT, function()
{
  console.log(`Listening on ${PORT}`);
});


/*******************************************
           Axios Request Functions          
*******************************************/

/**
 * Sends a request to the Python server.
 * @param {String} route - The route to send the request to.
 * @param {Object} params - The parameters to send with the request.
 * @returns {Promise} The response from the Python server.
 * @throws {Error} If the request fails.
 */
async function SendRequestToPythonServer(route, params)
{
    const url = `http://localhost:3005/${route}`;
    const keyPairs = Object.keys(params).map(key => `${key}=${params[key]}`).join("&");
    return await axios.get(`${url}?${keyPairs}`, { timeout: 10000 }); //10 second timeout);
}

/**
 * Creates a directory "temp/" if it doesn't already exist.
 */
function TryMakeTempFolder()
{
    var dir = "temp/"

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);
}

/**
 * Endpoint: /uploadSaveFile - Uploads a save file and extracts the Boxes from it.
 * @param {String} username - The username of the account the file is for (if using an account system).
 * @param {String} accountCode - The account code of the account the file is for (if using an account system).
 * @returns {StatusCode} SuccessOK with an object of format:
 *                       {
 *                           gameId: The game code of the save file that was uploaded.
                             boxCount: The number of Boxes in the save file.
                             boxes: The actual Box data.
                             titles: The names of each of the save Boxes.
                             randomizer: Whether or not the save file was for a randomizer.
                             saveFileData: A complete list of all of the save file's bytes.
                             fileIdNumber: The file id number the temp file was saved at.
                             cloudBoxes: The user's Cloud Boxes (if using an account system).
                             cloudTitles: The names of the user's Cloud Boxes (if using an account system).
                             cloudDataSyncKey: The key needed to be sent later on when saving the Cloud data.
 *                       }
 *                       If the Boxes were extracted successfully, error codes if not.
 */
app.post('/uploadSaveFile', async (req, res) =>
{
    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Handling save file upload...`);
    let username, accountCode, fileBytes, isAccountSystem;
    const funcStartTime = Date.now();
    let startTime = funcStartTime;

    //Get the params from the request
    try
    {
        if (req.body == null)
            throw("Request body was not found!");

        //username and accountCode can be null
        //if (req.body.username == null || req.body.accountCode == null)
        //    throw("Username or account code was not found!");

        if (req.body.file == null)
            throw("Save file was null!");

        if (_.isEmpty(req.body.file))
            throw("Save file was empty!");

        username = req.body.username;
        accountCode = req.body.accountCode;
        fileBytes = Object.values(req.body.file); //File is sent as a Uint8Array so it gets converted to a map in the request
    }
    catch (e)
    {
        console.error(`An error occurred trying to load the request params from the save file upload:\n${e}`);
        return res.status(StatusCode.ClientErrorBadRequest).json(`Request body was not found!`);
    }

    isAccountSystem = username && accountCode;

    //Set a placeholder username if the account system isn't in use
    if (!isAccountSystem)
        username = "cloud user";

    //Write the save file to a temp file
    let saveFileName, fileIdNumber;
    let saveFileData = Buffer.from(fileBytes);

    do
    {
        //Get a temp name that's not already in use
        fileIdNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        saveFileName = `temp/savefile_${fileIdNumber}.sav`;
    } while(fs.existsSync(saveFileName));

    TryMakeTempFolder();
    fs.writeFileSync(saveFileName, saveFileData);
    console.log(`Temp save file for ${username} saved to server as ${saveFileName} in ${Date.now() - startTime}ms.`);

    //Run the Python script
    startTime = Date.now();
    let result;
    try
    {
        pythonOutput = await SendRequestToPythonServer("uploadsave", {saveFilePath: saveFileName});
        let data = pythonOutput.data;
        let gameId = data["gameId"];
        let boxCount = data["boxCount"];
        let boxes = data["boxes"];
        let titles = data["titles"];
        let randomizer = data["randomizer"];
        let inaccessibleReason = data["inaccessibleReason"];
        let oldVersion = data["oldVersion"];
        let accessible = inaccessibleReason === "";

        if (!gameId || !boxCount || !boxes || boxes.length === 0 || !titles || !titles.length === 0)
        {
            //Bad save file
            if (oldVersion !== "")
                result = res.status(StatusCode.ClientErrorUpgradeRequired).json(`ERROR: The uploaded save file is from an old version (${oldVersion}).`);
            else
                result = res.status(StatusCode.ClientErrorBadRequest).json("ERROR: The uploaded save file is corrupt or not supported.");
        }
        else if (!accessible)
            result = res.status(StatusCode.ClientErrorForbidden).json(inaccessibleReason);
        else
        {
            let retData = 
            {
                gameId: gameId,
                boxCount: boxCount,
                boxes: boxes,
                titles: titles,
                randomizer: randomizer,
                saveFileData: saveFileData,
                fileIdNumber: fileIdNumber
            };
            console.log(`Save data for ${username} extracted in ${Date.now() - startTime}ms.`)

            //Try to send back Cloud boxes too if there's an account system
            startTime = Date.now();
            if (isAccountSystem)
            {
                if (accounts.GetUserAccountCode(username) === accountCode)
                {
                    await accounts.UpdateUserLastAccessed(username);
                    retData["cloudDataSyncKey"] = await accounts.CreateCloudDataSyncKey(username, randomizer);
                    retData["cloudBoxes"] = await accounts.GetUserCloudBoxes(username, randomizer);
                    retData["cloudTitles"] = await accounts.GetUserCloudTitles(username, randomizer);
                    console.log(`Cloud data for ${username} loaded in ${Date.now() - startTime}ms.`);
                }
            }

            //Send the data back
            startTime = Date.now();
            result = res.status(StatusCode.SuccessOK).json(retData);
        }
    }
    catch (err)
    {
        console.error(`An error occurred processing the save file:\n${err}`);
        result = res.status(StatusCode.ServerErrorInternal).json(`${err}`);
    }

    //Delete the temp file
    if (fs.existsSync(saveFileName))
    {
        fs.unlinkSync(saveFileName);
        console.log(`Temp save file ${saveFileName} deleted from server in ${Date.now() - startTime}ms.`);
    }

    console.log(`Save file upload for ${username} completed in ${Date.now() - funcStartTime}ms.`);
    return result;
});

/**
 * Endpoint: /uploadCloudData - Uploads an encrypted Cloud data file.
 * @returns {StatusCode} SuccessOK with an object of format
 *                       {
 *                            boxes: The Cloud Boxes.
 *                            titles: The titles of the Cloud Boxes.
 *                            randomizer: Whether or not the Boxes were for a randomized save file.
 *                       }
 *                       If the Boxes were extracted successfully, error codes if not.
 */
app.post('/uploadCloudData', async (req, res) =>
{
    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Processing uploaded cloud data...`);
    const funcStartTime = Date.now();
    let startTime = funcStartTime;

    try
    {
        //Decrypt the data
        const cloudData = req.body.file;
        let bytes = CryptoJS.AES.decrypt(cloudData, gSecretKey);
        let data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)); //Decrypted
        console.log(`Cloud file decrypted in ${Date.now() - startTime}ms.`);

        //Try to update the data if it's from an old version
        data = await TryUpdateOldCloudData(data, res);
        if (data != null)
        {
            console.log(`Cloud data processed in ${Date.now() - funcStartTime}ms.`);
            return res.status(StatusCode.SuccessOK).json({boxes: data["boxes"], titles: data["titles"],
                                                          randomizer: data["randomizer"] ? true : false});
        }

        throw("Cloud data could not be processed.");
    }
    catch (err)
    {
        console.error(`An error occurred processing the cloud data file:\n${err}`);
        return res.status(StatusCode.ClientErrorBadRequest).json(`${err}`);
    }
});

/**
 * Endpoint: /encryptCloudData - Encrypts Cloud data and sends back the encrypted version.
 * @param {String} homeData - The Cloud Boxes and Box names that were uploaded.
 * @returns {StatusCode} SuccessOK with an object of format {newHomeData}.
 */
app.post('/encryptCloudData', (req, res) =>
{
    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Encrypting cloud data...`);
    const funcStartTime = Date.now();

    //Get the data for the encrypted cloud data
    let cloudData = req.body.homeData;
    cloudData = CryptoJS.AES.encrypt(JSON.stringify(cloudData), gSecretKey).toString();

    //Send the encrypted data back
    console.log(`Cloud data encrypted in ${Date.now() - funcStartTime}ms.`);
    return res.status(StatusCode.SuccessOK).json({newHomeData: cloudData});
});

/**
 * Endpoint: /getUpdatedSaveFile
 * @returns {StatusCode} SuccessOK with an object of format
 *                       {
 *                            newSaveFileData: The new save file buffer.
 *                       }
 *                       If the Boxes were saved successfully, error codes if not.
 */
app.post('/getUpdatedSaveFile', async (req, res) =>
{
    console.log("----------------------------------------------");
    let result, error;
    const funcStartTime = Date.now();
    let startTime = funcStartTime;
    let saveFileData = Object.values(req.body.saveFileData);
    let newBoxes = req.body.newBoxes;
    let fileIdNumber = req.body.fileIdNumber;
    let saveFileName = `temp/savefile_${fileIdNumber}.sav`;
    let newBoxesName = `temp/newBoxes_${fileIdNumber}.json`;
    let newSavePath = null;
    console.log(`[${new Date().toLocaleString()}] Updating save file with fileIdNumber "${fileIdNumber}"`);

    //Check if the save file data came back intact
    if (saveFileData.length == 0)
    {
        error = "Save file data was empty.";
        console.error(error);
        return res.status(StatusCode.ClientErrorBadRequest).json(error);
    }

    //Save the original save file back to the server
    TryMakeTempFolder();
    fs.writeFileSync(saveFileName, Buffer.from(saveFileData));
    console.log(`Temp save file saved to server as ${saveFileName} in ${Date.now() - startTime}ms.`);

    //Save the updated boxes to the server
    startTime = Date.now();
    TryMakeTempFolder();
    fs.writeFileSync(newBoxesName, JSON.stringify(newBoxes));
    console.log(`New boxes saved to server in ${Date.now() - startTime}ms.`);

    //Create the updated save file
    try
    {
        //Update the save file
        let pythonOutput = await SendRequestToPythonServer("updatesave", {updatedDataJSON: newBoxesName, originalSaveFilePath: saveFileName});

        newSavePath = pythonOutput.data;
        if (!newSavePath)
        {
            console.error("An error occurred in Python while trying to create an updated save file.");
            result = res.status(StatusCode.ServerErrorInternal).json({err: "Unknown error."});
        }
        else
        {
            //Read the new file generated by python
            const newSaveDataBuffer = fs.readFileSync(newSavePath);

            //Return both
            result = res.status(StatusCode.SuccessOK).json({newSaveFileData: newSaveDataBuffer});
        }
    }
    catch (err)
    {
        console.error(`An error occurred trying to create an updated save file:\n${err}`);
        result = res.status(StatusCode.ServerErrorInternal).json(`${err}`);
    }

    //Delete the temp files
    if (fs.existsSync(saveFileName))
    {
        fs.unlinkSync(saveFileName);
        console.log(`Temp save file ${saveFileName} deleted from server.`);
    }

    if (fs.existsSync(newBoxesName))
    {
        fs.unlinkSync(newBoxesName);
        console.log(`Temp save boxes ${newBoxesName} deleted from server.`);
    }

    if (newSavePath != null && fs.existsSync(newSavePath))
    {
        fs.unlinkSync(newSavePath);
        console.log(`Temp save file ${newSavePath} deleted from server.`);
    }

    console.log(`Save file updated in ${Date.now() - funcStartTime}ms.`);
    return result;
});

/**
 * Tries to convert cloudData from version 1 to version 2.
 * @param {Array<Object>} cloudData - The list of version 1 Pokemon to convert.
 * @param {Object} res - The response object to send the response in.
 * @returns {Array<Object>} The converted Cloud data (if different than what was passed in).
 */
async function TryUpdateOldCloudData(cloudData, res)
{
    if (!("version" in cloudData) || cloudData["version"] < 2)
    {
        //Write the cloud file to a temp file

        do //Get a temp name that's not already in use
        {
            fileIdNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            cloudFileName = `temp/clouddata_${fileIdNumber}.json`;
        } while(fs.existsSync(cloudFileName));

        TryMakeTempFolder();
        fs.writeFileSync(cloudFileName, JSON.stringify(cloudData));
        console.log(`Temp cloud file saved to server as ${cloudFileName}.`);

        //Run the Python script
        var result;
        try
        {
            let pythonOutput = await SendRequestToPythonServer("convertoldcloudfile", {cloudFilePath: cloudFileName});
            let data = pythonOutput.data;
            if (!data.completed) //Bad cloud file
            {
                console.error(`An error occurred converting the cloud file:\n${data.errorMsg}`);
                result = res.status(StatusCode.ClientErrorBadRequest).json(`ERROR: The uploaded cloud file could not be converted:\n${data.errorMsg}`);
                cloudData = null;
            }
            else
            {
                cloudData = fs.readFileSync(cloudFileName);
                cloudData = JSON.parse(cloudData);
            }
        }
        catch (err)
        {
            console.error(`An error occurred converting the cloud file:\n${err}`);
            res.status(StatusCode.ServerErrorInternal).json(err);
            cloudData = null;
        }

        //Delete the temp file
        if (fs.existsSync(cloudFileName))
        {
            fs.unlinkSync(cloudFileName);
            console.log(`Temp cloud file ${cloudFileName} deleted from server.`);
        }
    }

    return cloudData;
}


/*******************************************
              Account Functions             
*******************************************/

/**
 * Endpoint: /createUser - Creates a user account.
 * @param {String} email - The email of the account being created.
 * @param {String} username - The username to register the account under.
 * @param {String} password - The password of the account being created.
 * @param {String} cloudDataPX - 8 chunks of strings when combined together form the Cloud Boxes to save with the account.
 * @returns {StatusCode} SuccessOK if the account was created successfullty, error responses if it was not.
 */
app.post('/createUser', async (req, res) =>
{
    var email, username, password, cloudBoxes, cloudTitles, cloudRandomizerData, cloudRandomizerTitles;
    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Trying to create user account...`);

    //Get the data sent from the client
    try
    {
        email = req.body.email;
        username = req.body.username;
        password = req.body.password;
        cloudBoxes = req.body.cloudBoxes;
        cloudTitles = req.body.cloudTitles;
        cloudRandomizerData = req.body.cloudRandomizerData;
        cloudRandomizerTitles = req.body.cloudRandomizerTitles;
    }
    catch (e)
    {
        console.error(`Could not process data sent from the client:\n${e}`);
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "UNKNOWN_ERROR"});
    }

    //Process the data received
    if (username == null || email == null || password == null)
    {
        console.error(`Email/username/password is null`);
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "NULL_ACCOUNT"});
    }

    if (email == "" || username == "" || password == "")
    {
        console.error(`Email/username/password is blank`);
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "BLANK_INPUT"});
    }

    if (accounts.EmailExists(email))
    {
        console.error(`Account for ${email} already exists`);
        return res.status(StatusCode.ClientErrorConflict).send({errorMsg: "EMAIL_EXISTS"});
    }

    if (accounts.UserExists(username))
    {
        console.error(`Account for ${username} already exists`);
        return res.status(StatusCode.ClientErrorConflict).send({errorMsg: "USER_EXISTS"});
    }

    let [success, error] = await accounts.CreateUser(email, username, password,
                                                     cloudBoxes, cloudTitles,
                                                     cloudRandomizerData, cloudRandomizerTitles);

    if (success)
    {
        console.log(`Account "${username}" for ${email} was created successfully!`);
        return res.status(StatusCode.SuccessOK).json
        ({
            username: username,
            accountCode: accounts.GetUserAccountCode(username), //Used to ensure a secure connection
        });
    }
    else
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "UNKNOWN_ERROR", errorText: `${error}`});
});
 
/**
 * Endpoint: /checkUser - Checks an username and password combination for logging into an account.
 * @param {String} username - The username of the account being logged into.
 * @param {String} password - The password of the account being logged into.
 * @returns {StatusCode} SuccessOK if the username and password matched, error codes if not.
 */
app.post('/checkUser', async (req, res) =>
{
    try
    {
        username = req.body.username;
        password = req.body.password;
    }
    catch (e)
    {
        console.error(`Could not process login data sent from the client:\n${e}`);
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "UNKNOWN_ERROR"});
    }

    if (username == null || password == null)
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "NULL_ACCOUNT"});
    else if (username === "" || password === "")
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "BLANK_INPUT"});
    else if (!accounts.UserExists(username))
    {
        username = accounts.EmailToUsername(username); //See if the user entered their email
        if (username === "" || !accounts.UserExists(username))
            return res.status(StatusCode.ClientErrorNotFound).send({errorMsg: "NO_ACCOUNT_FOUND"});
    }

    if (!(await accounts.VerifyCorrectPassword(username, password)))
        return res.status(StatusCode.ClientErrorForbidden).send({errorMsg: "INVALID_PASSWORD"});

    await accounts.UpdateUserLastAccessed(username);
    return res.status(StatusCode.SuccessOK).json
    ({
        username: username,
        accountCode: accounts.GetUserAccountCode(username), //Used to ensure a secure connection
        activated: accounts.AccountIsActivated(username),
    });
});

/**
 * Endpoint: /activateUser - Activates a user account.
 * @param {String} username - The username of the account being activated.
 * @param {String} activationCode - The confirmation code sent to the username being activated.
 * @returns {StatusCode} SuccessOK if the account was activated successfully, error codes if not.
 */
app.post('/activateUser', async (req, res) =>
{
    username = req.body.username;
    activationCode = req.body.activationCode;
    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Trying to activate account for "${username}"...`);

    if (!accounts.UserExists(username))
        return res.status(StatusCode.ClientErrorNotFound).send({errorMsg: "NO_ACCOUNT_FOUND"});
    else if (await accounts.ActivateUser(username, activationCode))
    {
        console.log(`Account for ${username} was activated successfully!`);
        return res.status(StatusCode.SuccessOK).json("");
    }
    else
    {
        console.error(`Account for ${username} could not be activated.`);
        return res.status(StatusCode.ClientErrorForbidden).send({errorMsg: "INVALID_ACTIVATION_CODE"});
    }
});

/**
 * Endpoint: /resendActivationCode - Sends another activation code to a user.
 * @param {String} username - The username of the account to send the email for.
 * @param {String} accountCode - The account code of the account to send the email for.
 * @returns {StatusCode} SuccessOK if the email was sent successfully, error codes if not.
 */
app.post('/resendActivationCode', async (req, res) =>
{
    username = req.body.username;
    accountCode = req.body.accountCode;
    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Resending activation code for "${username}"...`);

    if (!accounts.UserExists(username))
        return res.status(StatusCode.ClientErrorNotFound).send({errorMsg: "NO_ACCOUNT_FOUND"});
    else if (accounts.GetUserAccountCode(username) !== accountCode)
    {
        return res.status(StatusCode.ClientErrorForbidden).send({errorMsg: "INVALID_ACCOUNT_CODE"});  
    }
    else
    {
        var ret = await accounts.ResendActivationEmail(username);

        if (ret)
            return res.status(StatusCode.SuccessOK).json("");
        else
            return res.status(StatusCode.ServerErrorInternal).send({errorMsg: "UNKNOWN_ERROR"});  
    }
});

/**
 * Endpoint: /sendPasswordResetCode - Sends a password reset code to a user.
 * @param {String} email - The email to send the password reset code to.
 * @returns {StatusCode} SuccessOK if the email was sent successfully, error codes if not.
 */
app.post('/sendPasswordResetCode', async (req, res) =>
{
    email = req.body.email;
    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Trying to send a password reset code to "${email}"...`);

    if (!accounts.EmailExists(email))
        return res.status(StatusCode.ClientErrorNotFound).send({errorMsg: "INVALID_EMAIL"});
    else if (accounts.ResetPasswordTooRecently(accounts.EmailToUsername(email)))
        return res.status(StatusCode.ClientErrorTooManyRequests).send({errorMsg: "PASSWORD_RESET_COOLDOWN"});
    else if (await accounts.SendPasswordResetCode(email))
        return res.status(StatusCode.SuccessOK).json("");
    else
        return res.status(StatusCode.ServerErrorInternal).send({errorMsg: "UNKNOWN_ERROR"});
});

/**
 * Endpoint: /resetPassword - Resets a user's password.
 * @param {String} email - The email on the account.
 * @param {String} newPassword - The new password to set for the account.
 * @param {String} resetCode - The reset password code sent to the user's email earlier.
 * @returns {StatusCode} SuccessOK if the password was reset, error codes if not.
 */
app.post('/resetPassword', async (req, res) =>
{
    email = req.body.email;
    newPassword = req.body.newPassword;
    resetCode = req.body.resetCode;
    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Trying to reset the password for "${email}"...`);

    if (email == null || newPassword == null || resetCode == null)
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "NULL_ACCOUNT"});
    else if (email === "" || newPassword === "" || resetCode === "")
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "BLANK_INPUT"});
    else if (!accounts.EmailExists(email))
        return res.status(StatusCode.ClientErrorNotFound).send({errorMsg: "INVALID_EMAIL"});

    var username = accounts.EmailToUsername(email);
    if (accounts.ResetPasswordTooRecently(username))
        return res.status(StatusCode.ClientErrorTooManyRequests).send({errorMsg: "PASSWORD_RESET_COOLDOWN"});
    else if (!util.IsValidPassword(newPassword))
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "INVALID_PASSWORD"});
    else if (accounts.HasPasswordResetCodeExpired(username))
        return res.status(StatusCode.ClientErrorLoginTimeOut).send({errorMsg: "RESET_CODE_TOO_OLD"});
    else if (resetCode !== accounts.GetPassswordResetCode(username))
        return res.status(StatusCode.ClientErrorBadRequest).send({errorMsg: "INVALID_RESET_CODE"});

    if (await accounts.ChangePassword(username, newPassword))
        return res.status(StatusCode.SuccessOK).json("");
    else
        return res.status(StatusCode.ServerErrorInternal).send({errorMsg: "UNKNOWN_ERROR"});
});

/**
 * Endpoint: /getAccountCloudData - Uploads a save file and extracts the Boxes from it.
 * @param {String} username - The username of the account to get the data for.
 * @param {String} accountCode - The account code of the account to get the data for.
 * @param {Boolean} randomizer - Whether or not to get the randomizer Boxes or the regular Boxes.
 * @returns {StatusCode} SuccessOK with an object of format:
 *                       {
                             cloudBoxes: The user's Cloud Boxes.
                             cloudTitles: The names of the user's Cloud Boxes.
 *                       }
 *                       If the Boxes were extracted successfully, error codes if not.
 */
app.post('/getAccountCloudData', async (req, res) =>
{
    const funcStartTime = Date.now();
    var username = req.body.username;
    var accountCode = req.body.accountCode;
    var randomizer = req.body.randomizer;

    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Getting account Cloud data for ${username}...`);

    try
    {
        randomizer = (randomizer === "true"); //Convert to Boolean

        if (!accounts.UserExists(username))
            return res.status(StatusCode.ClientErrorNotFound).send("Username was not found!");
        else if (accounts.GetUserAccountCode(username) !== accountCode)
            return res.status(StatusCode.ClientErrorUnauthorized).json("Account code is incorrect!");
        else
        {
            await accounts.UpdateUserLastAccessed(username);
            let cloudDataSyncKey = await accounts.CreateCloudDataSyncKey(username, randomizer);
            const cloudData =
            {
                cloudBoxes: await accounts.GetUserCloudBoxes(username, randomizer),
                cloudTitles: await accounts.GetUserCloudTitles(username, randomizer),
                cloudDataSyncKey: cloudDataSyncKey,
            };
            console.log(`Cloud data for ${username} retrieved in ${Date.now() - funcStartTime}ms.`);
            return res.status(StatusCode.SuccessOK).json(cloudData);
        }   
    }
    catch (err)
    {
        console.error(`An error occurred trying to get ${username}'s Cloud data:\n${err}`);
        return res.status(StatusCode.ClientErrorBadRequest).json(err);
    }
});

/**
 * Endpoint: /saveAccountCloudData - Saves a user's saved Cloud Boxes and Box names.
 * @param {String} homeData - 4 chunks of strings when combined together form the Cloud Boxes and titles that were uploaded.
 * @returns {StatusCode} SuccessOK if the data was saved successfully, error codes if not.
 */
app.post('/saveAccountCloudData', async (req, res) =>
{
    var username = req.body.username;
    var accountCode = req.body.accountCode;
    var cloudDataSyncKey = req.body.cloudDataSyncKey;
    var startTime = Date.now();
    console.log("----------------------------------------------");
    console.log(`[${new Date().toLocaleString()}] Saving account Cloud data for ${username}...`);

    try
    {
        var cloudData = req.body.homeData;
        var cloudBoxes = cloudData.boxes;
        var cloudTitles = cloudData.titles;

        if (!util.ValidateCloudBoxes(cloudBoxes))
            return res.status(StatusCode.ClientErrorBadRequest).json("A problematic Pokemon was found in the Cloud Boxes!");
        else if (!util.ValidateCloudTitles(cloudTitles))
            return res.status(StatusCode.ClientErrorBadRequest).json("A problematic name was found in the Cloud titles!");

        if (accounts.GetUserAccountCode(username) === accountCode) //Extra layer of security
        {
            let userKey = await accounts.GetCloudDataSyncKey(username, cloudData.randomizer);

            if (userKey === "")
            {
                return res.status(StatusCode.ServerErrorInternal).json("The data sync key could not be retrieved!");
            }
            else if (cloudDataSyncKey !== userKey)
            {
                return res.status(StatusCode.ClientErrorUnauthorized).json(INVALID_CLOUD_DATA_SYNC_KEY_ERROR);
            }
            else
            {
                if (await accounts.SaveAccountCloudData(username, cloudBoxes, cloudTitles, cloudData.randomizer))
                {
                    console.log(`Cloud data for ${username} saved in ${Date.now() - startTime}ms.`);
                    return res.status(StatusCode.SuccessOK).json({});
                }
                else
                    return res.status(StatusCode.ClientErrorNotFound).json("Username was not found!");
            } 
        }
        else
            return res.status(StatusCode.ClientErrorUnauthorized).json("Account code was incorrect!");
    }
    catch (err)
    {
        console.error(`An error occurred trying to save the Cloud data for ${username}:\n${err}`);
        return res.status(StatusCode.ClientErrorBadRequest).json(err);
    }
});
