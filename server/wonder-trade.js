const { WebhookClient } = require('discord.js');
const Mutex = require('async-mutex').Mutex;

const accounts = require('./accounts');
const pokemonUtil = require('./pokemon-util');
const { CloudDataSyncKeyIsValidForTrade, HasMatchingRandomizerSettings, IsSameClient } = require('./trade-util');

// TODO: Instead of cancelling the new Wonder Trade if the same user is trying to Wonder Trade twice, cancel the old one
// TODO: Allow the user to Wonder Trade up to 30 Pokemon at once, but only one at a time

// Wonder Trade constants
const WONDER_TRADE_NOT_IN_PROGRESS = 0;
const WONDER_TRADE_IN_PROGRESS = 1;
const WONDER_TRADE_TRADED = 2;

const WONDER_TRADE_SPECIES_COOLDOWN = 5 * 60 * 1000; // 5 Minutes
module.exports.WONDER_TRADE_SPECIES_COOLDOWN = WONDER_TRADE_SPECIES_COOLDOWN; // For testing

// Wonder Trade data
const gWonderTradeDiscordWebhook = (process.env["WONDER_TRADE_WEBHOOK"]) ? new WebhookClient({ url: process.env["WONDER_TRADE_WEBHOOK"] }) : null;
const gWonderTradeClients = {};
const gWonderTradeMutex = new Mutex();
let gWonderTradeSpecies = {};
let gLastWonderTradeAt = 0;


/**
 * Locks the Wonder Trade data and prevents it from being modified again until it's unlocked.
 * @returns {Promise<void>} A promise that resolves when the lock is acquired.
 */
async function LockWonderTrade()
{
    await gWonderTradeMutex.acquire();
}
module.exports.LockWonderTrade = LockWonderTrade;

/**
 * Unlocks the Wonder Trade data for modifying again.
 */
function UnlockWonderTrade()
{
    gWonderTradeMutex.release();
}
module.exports.UnlockWonderTrade = UnlockWonderTrade;

/**
 * Gets the Wonder Trade client data for a specific client ID.
 * @param {String} clientId - The ID of the client to retrieve data for.
 * @return {Object|null} The Wonder Trade client data or null if not found.
 */
function GetWonderTradeClientData(clientId)
{
    return gWonderTradeClients[clientId] || null;
}
module.exports.GetWonderTradeClientData = GetWonderTradeClientData; // For testing

/**
 * Sets the Wonder Trade client data for a specific client ID.
 * @param {String} clientId - The ID of the client to set data for.
 * @param {Object|null|undefined} data - The data to set for the client, or null/undefined to delete.
 */
function SetWonderTradeClientData(clientId, data)
{
    if (data == null)
        delete gWonderTradeClients[clientId];
    else
        gWonderTradeClients[clientId] = data;
}
module.exports.SetWonderTradeClientData = SetWonderTradeClientData; // For testing

/**
 * Gets the last time a Wonder Trade was made.
 * @return {Number} The timestamp of the last Wonder Trade.
 */
function GetLastWonderTradeAt()
{
    return gLastWonderTradeAt;
}
module.exports.GetLastWonderTradeAt = GetLastWonderTradeAt; // For testing

/**
 * Sets the last time a Wonder Trade was made to a specific timestamp.
 * @param {Number} timestamp - The timestamp to set as the last Wonder Trade time.
 */
function SetLastWonderTradeAt(timestamp)
{
    gLastWonderTradeAt = timestamp;
}
module.exports.SetLastWonderTradeAt = SetLastWonderTradeAt; // For testing

/**
 * Sets the last time a Wonder Trade was made to the current time.
 */
function SetLastWonderTradeNow()
{
    SetLastWonderTradeAt(Date.now());
}
module.exports.SetLastWonderTradeNow = SetLastWonderTradeNow; // For testing

/**
 * Checks if a client has already completed a trade.
 * @param {String} clientId - The current client id.
 * @returns {Boolean} Whether the client has already traded.
 */
function HasAlreadyTraded(clientId)
{
    const clientData = GetWonderTradeClientData(clientId);
    return clientData?.tradedWith != null && clientData?.tradedWith !== "";
}
module.exports.HasAlreadyTraded = HasAlreadyTraded; // For testing

/**
 * Checks if a client is banned from wonder trade.
 * @param {String} username - The username to check.
 * @returns {Boolean} Whether the user is banned.
 */
function IsClientBanned(username)
{
    return accounts.IsUserBannedFromWonderTrade(username);
}
module.exports.IsClientBanned = IsClientBanned; // For testing

/**
 * Prevents a user from Wonder Trading twice at the same time.
 * @param {String} clientId - The current client id.
 * @param {String} username - The user who's trying to trade.
 * @returns {String} The client ID of the previous trade to cancel, or empty string if none.
 */
function ShouldPreventUserFromWonderTradingTwice(clientId, username)
{
    if (!username) return ""; // Can't check without username

    for (const [otherClientId, clientData] of Object.entries(gWonderTradeClients))
    {
        if (IsSameClient(clientId, otherClientId, username, clientData?.username)
            && !HasAlreadyTraded(otherClientId)) // User is already in a Wonder Trade and hasn't traded yet
            return otherClientId; // Cancel the trade
    }

    return ""; // No previous trade to cancel
}
module.exports.ShouldPreventUserFromWonderTradingTwice = ShouldPreventUserFromWonderTradingTwice; // For testing

/**
 * Adds an entry in the table that says which Pokemon this user has received from a specific user recently.
 * @param {String} username - The user to add the entry for.
 * @param {String} receivedFromUser - The user the Pokemon was received from.
 * @param {String} species - The species received from the user.
 */
function AddUserToWonderTradeSpeciesTable(username, receivedFromUser, species)
{
    TryWipeWonderTradeSpeciesData();

    username = username?.toLowerCase();
    receivedFromUser = receivedFromUser?.toLowerCase();
    species = species?.toUpperCase();

    if (!username || !receivedFromUser || !species)
        return; // No point in adding an entry for a user that doesn't exist

    if (!(username in gWonderTradeSpecies))
        gWonderTradeSpecies[username] = {};

    if (!(receivedFromUser in gWonderTradeSpecies[username]))
        gWonderTradeSpecies[username][receivedFromUser] = {};

    gWonderTradeSpecies[username][receivedFromUser][species] = Date.now();
}
module.exports.AddUserToWonderTradeSpeciesTable = AddUserToWonderTradeSpeciesTable; // For testing

/**
 * Tries to wipe the gWonderTradeSpecies table to preserve space in memory.
 */
function TryWipeWonderTradeSpeciesData()
{
    if (GetLastWonderTradeAt() !== 0) // There has been a Wonder Trade since the server started or the data was last wiped
    {
        let timeSince = Date.now() - gLastWonderTradeAt;
        if (timeSince >= WONDER_TRADE_SPECIES_COOLDOWN)
        {
            gWonderTradeSpecies = {}; // No point in keeping data in memory when it's all expired anyway
            SetLastWonderTradeAt(0); // Reset the last Wonder Trade time
        }
    }
}
module.exports.TryWipeWonderTradeSpeciesData = TryWipeWonderTradeSpeciesData; // For testing

/**
 * Checks if two users have recently traded the same species.
 * @param {String} username - Current user's username.
 * @param {String} otherUsername - Other user's username.
 * @param {String} otherSpecies - The species the other user is offering.
 * @returns {Boolean} Whether they recently traded this species.
 */
function HasRecentSpeciesTrade(username, otherUsername, otherSpecies)
{
    username = username?.toLowerCase();
    otherUsername = otherUsername?.toLowerCase();
    otherSpecies = otherSpecies?.toUpperCase();

    // Check if the current user has not traded before
    if (!username || !(username in gWonderTradeSpecies))
        return false;

    // Check if the other user has not traded before
    if (!otherUsername || !(otherUsername in gWonderTradeSpecies[username]))
        return false;

    // Check if this species has not been traded from this user to the other user
    if (!otherSpecies || !(otherSpecies in gWonderTradeSpecies[username][otherUsername]))
        return false;

    // Get the time since the last trade of this species
    let lastReceivedAt = gWonderTradeSpecies[username][otherUsername][otherSpecies];
    let timeSince = Date.now() - lastReceivedAt;

    // Wait for the cooldown to expire before allowing another trade of this species
    if (timeSince < WONDER_TRADE_SPECIES_COOLDOWN)
        return true;

    // This species can be traded again, clean up the entry
    delete gWonderTradeSpecies[username][otherUsername][otherSpecies];
    return false;
}
module.exports.HasRecentSpeciesTrade = HasRecentSpeciesTrade; // For testing

/**
 * Checks if a wonder trade client is valid for trading.
 * @param {String} clientId - Current client id.
 * @param {String} otherClientId - Other client id to check.
 * @param {String} username - Current username.
 * @param {Boolean} randomizer - Current randomizer setting.
 * @returns {Boolean} Whether the client is valid for trading.
 */
function IsValidWonderTradeClient(clientId, otherClientId, username, randomizer)
{
    // Check if data exists
    const otherWonderTradeData = GetWonderTradeClientData(otherClientId);
    if (!otherWonderTradeData)
        return false;

    // Can't trade with someone who's already traded
    if (HasAlreadyTraded(otherClientId))
        return false;

    // Can't trade with someone who's randomizer setting doesn't match
    if (!HasMatchingRandomizerSettings(randomizer, otherWonderTradeData.randomizer))
        return false;

    // Can't trade with yourself
    if (IsSameClient(clientId, otherClientId, username, otherWonderTradeData.username))
        return false;

    // Can't trade with someone who's been banned
    if (IsClientBanned(otherWonderTradeData.username))
        return false;

    // Check for recent species trades
    let otherSpecies = pokemonUtil.GetSpecies(otherWonderTradeData.pokemon);
    if (HasRecentSpeciesTrade(username, otherWonderTradeData.username, otherSpecies))
        return false;

    return true;
}
module.exports.IsValidWonderTradeClient = IsValidWonderTradeClient; // For testing

/**
 * Gets the list of clients connected to Wonder Trade that can trade their Pokemon to the current user.
 * @param {String} clientId - The current client id to check the user's that can trade to it.
 * @param {String} username - The username of the current client.
 * @param {Boolean} randomizer - Whether or not the current client is using a randomized save.
 * @returns {Array<String>} A list of client ids that can trade with the current user.
 */
function GetValidWonderTradeClientsFor(clientId, username, randomizer)
{
    let clients = [];

    if (accounts.IsUserBannedFromWonderTrade(username))
        return clients; // Can't trade at all if you've been banned, but still allow the user to connect so they don't just create a second account to keep trading

    for (let x of Object.keys(gWonderTradeClients))
    {
        if (IsValidWonderTradeClient(clientId, x, username, randomizer))
            clients.push(x);
    }

    return clients;
}
module.exports.GetValidWonderTradeClientsFor = GetValidWonderTradeClientsFor; // For testing

/**
 * Checks if a user would have a Wonder Trade partner.
 * @param {string} clientId - The current client's ID.
 * @param {string} username - The user wanting to Wonder Trade.
 * @param {boolean} randomizer - Whether the user is using a randomized save file.
 * @returns {boolean} Whether the user will have a Wonder Trade partner.
 */
function IsWonderTradeAvailable(clientId, username, randomizer)
{
    return GetValidWonderTradeClientsFor(clientId, username, randomizer).length > 0;
}
module.exports.IsWonderTradeAvailable = IsWonderTradeAvailable;

/**
 * Sends a message to the Wonder Trade Discord channel.
 * @param {String} title - The title of the message.
 * @param {Number} color - The color of the message.
 * @param {Number} messageId - The ID of the message to edit, or 0 to send a new message.
 * @returns {Promise<Number>} The ID of the message sent or edited.
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

    // Try to edit a previously sent message
    if (messageId !== 0) // A message was previously sent
    {
        for (attempts = 0; attempts < 3; ++attempts) // Try 3 times in case there is a connection issue
        {
            try
            {
                await gWonderTradeDiscordWebhook.editMessage(messageId, params);
                return messageId;
            }
            catch (err)
            {
                console.error(`An error occurred editing the last Wonder Trade Discord message:\n${err}`);
                await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
                // If all attempts fail, a new message will be sent instead
            }
        }
    }

    // Send a new message
    for (attempts = 0; attempts < 3; ++attempts) // Try 3 times in case there is a connection issue
    {
        try
        {
            let res = await gWonderTradeDiscordWebhook.send(params);
            return res.id;
        }
        catch (err)
        {
            console.error(`An error occurred sending the Wonder Trade Discord message:\n${err}`);
            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
        }
    }

    return 0;
}
module.exports.SendWonderTradeDiscordMessage = SendWonderTradeDiscordMessage; // For testing

/**
 * Sets up Wonder Trade event handlers for a socket.
 * @param {Object} socket - The socket instance.
 * @param {Object} socketUtils - Socket utility functions.
 * @param {String} clientId - The client ID.
 * @param {String} username - The username.
 * @param {String} cloudDataSyncKey - The cloud data sync key.
 * @param {String} clientName - The client name for logging.
 * @param {Function} updateActivity - Function to update last activity timestamp.
 * @param {Function} setInactive - Function to mark socket as inactive.
 */
function SetupWonderTradeHandlers(socket, socketUtils, clientId, username, cloudDataSyncKey, clientName, updateActivity, setInactive)
{
    socket.on("message", async (pokemonToSend, randomizer) =>
    {
        try
        {
            // Update the last activity timestamp
            updateActivity();

            // Prevent Wonder Trade in multiple tabs at once
            if (!(await CloudDataSyncKeyIsValidForTrade(username, clientId, cloudDataSyncKey, randomizer, socketUtils, "WT")))
                return;

            // Lock the Wonder Trade data
            await LockWonderTrade();

            // If the user is already in a Wonder Trade, cancel it
            const activeTradeClientId = ShouldPreventUserFromWonderTradingTwice(clientId, username);
            if (activeTradeClientId)
            {
                console.log(`[WT] ${username} has active Wonder Trade elsewhere so cancelling this trade`);
                socketUtils.safeEmit("invalidCloudDataSyncKey", "Your account already has a Wonder Trade in progress!");
                UnlockWonderTrade();
                return; // Just return, don't terminate the connection
            }

            // Ensure the user is trying to trade a valid Pokemon
            if (!pokemonUtil.ValidatePokemon(pokemonToSend, false))
            {
                console.log(`[WT] ${clientName} sent an invalid Pokemon for a Wonder Trade`);
                socketUtils.safeEmit("invalidPokemon");
                UnlockWonderTrade();
                return;
            }

            // Check if this is the first Wonder Trade in progress
            const partners = GetValidWonderTradeClientsFor(clientId, username, randomizer);
            if (partners.length > 0) // Has a partner to trade with
                await ProcessWonderTradeMatch(clientId, username, pokemonToSend, partners[0]);
            else
                await AddToWonderTradeQueue(clientId, username, pokemonToSend, randomizer, clientName);

            // Release the lock after processing
            UnlockWonderTrade();
        }
        catch (error)
        {
            console.error(`[WT] Error in message handler for ${clientName}:`, error);
            UnlockWonderTrade();
        }
    });

    socket.on('disconnect', async () =>
    {
        await HandleWonderTradeDisconnect(clientId, clientName);
        setInactive(); // Mark the socket as inactive
    });
}
module.exports.SetupWonderTradeHandlers = SetupWonderTradeHandlers;

/**
 * Processes a Wonder Trade match between two clients.
 * @param {String} clientId - The current client ID.
 * @param {String} username - The current client's username.
 * @param {Object} pokemonToSend - The Pokemon being sent.
 * @param {String} partnerClientId - The partner's client ID.
 * @returns {Promise<Boolean>} Whether the match was processed successfully.
 */
async function ProcessWonderTradeMatch(clientId, username, pokemonToSend, partnerClientId)
{
    const partnerClient = GetWonderTradeClientData(partnerClientId);
    if (!partnerClient)
    {
        console.log(`[WT] No client data found for partner ${partnerClientId}`);
        return false; // Partner doesn't exist
    }

    // Update the partner's client data
    SetWonderTradeClientData(partnerClientId,
    {
        ...partnerClient, // Preserve existing data
        pokemon: pokemonToSend,
        tradedWith: clientId,
        receivedFrom: username,
    });

    // Create the current client's entry
    SetWonderTradeClientData(clientId,
    {
        username: username,
        pokemon: partnerClient.originalPokemon, // The Pokemon the partner is sending
        originalPokemon: pokemonToSend,
        tradedWith: partnerClientId,
        receivedFrom: partnerClient.username,
        discordMessageId: partnerClient.discordMessageId, // TODO: Maybe this shouldn't be here?
    });

    // Add the users to the Wonder Trade species table
    AddUserToWonderTradeSpeciesTable(username, partnerClient.username, pokemonUtil.GetSpecies(partnerClient.originalPokemon));
    AddUserToWonderTradeSpeciesTable(partnerClient.username, username, pokemonUtil.GetSpecies(pokemonToSend));
    SetLastWonderTradeNow();
    return true; // Successfully processed the match
}
module.exports.ProcessWonderTradeMatch = ProcessWonderTradeMatch;

/**
 * Adds a client to the Wonder Trade queue.
 * @param {String} clientId - The client ID.
 * @param {String} username - The username.
 * @param {Object} pokemon - The Pokemon being offered.
 * @param {Boolean} randomizer - Whether randomizer is enabled.
 * @param {String} clientName - The client name for logging.
 * @returns {Promise<Boolean>} Whether the client was successfully added to the queue.
 */
async function AddToWonderTradeQueue(clientId, username, pokemon, randomizer, clientName)
{
    if (clientId in gWonderTradeClients)
        return false; // Already in the queue, no need to add again

    // Add the client to the Wonder Trade queue
    console.log(`[WT] ${clientName} is offering ${pokemonUtil.GetSpecies(pokemon)}`);
    let messageId = await SendWonderTradeDiscordMessage("Someone is waiting for a Wonder Trade!", 0x00FF00, 0);
    SetWonderTradeClientData(clientId,
    {
        username: username,
        pokemon: pokemon,
        originalPokemon: pokemon,
        tradedWith: "",
        randomizer: randomizer,
        discordMessageId: messageId
    });

    return true; // Successfully added to the queue
}
module.exports.AddToWonderTradeQueue = AddToWonderTradeQueue; // For testing

/**
 * Handles Wonder Trade client disconnect.
 * @param {String} clientId - The client ID.
 * @param {String} clientName - The client name for logging.
 * @returns {Promise<void>} A promise that resolves when disconnect handling completes.
 */
async function HandleWonderTradeDisconnect(clientId, clientName)
{
    try
    {
        await LockWonderTrade();
        console.log(`[WT] ${clientName} disconnected`);

        // Send a cancellation message if the client to the Discord server if the user has not already traded
        const clientData = GetWonderTradeClientData(clientId);
        if (clientData && !HasAlreadyTraded(clientId))
            await SendWonderTradeDiscordMessage("The Wonder Trade was cancelled...", 0xFF0000, clientData.discordMessageId);

        // Remove the client from the Wonder Trade clients regardless of whether they have traded or not
        SetWonderTradeClientData(clientId, null); // Clear the client data
        UnlockWonderTrade();
    }
    catch (error)
    {
        console.error(`[WT] Error in disconnect handler for ${clientName}:`, error);
        UnlockWonderTrade();
    }
}
module.exports.HandleWonderTradeDisconnect = HandleWonderTradeDisconnect;

/**
 * Processes Wonder Trade transactions in the main loop.
 * @param {String} clientId - The client ID.
 * @param {String} clientName - The client name for logging.
 * @param {Object} socketUtils - Socket utility functions.
 * @param {Function} updateActivity - Function to update last activity.
 * @param {Function} setInactive - Function to mark socket as inactive.
 * @returns {Promise<Boolean>} Whether the transaction was processed successfully.
 */
async function ProcessWonderTradeTransactions(clientId, clientName, socketUtils, updateActivity, setInactive)
{
    try
    {
        await LockWonderTrade();

        const clientData = GetWonderTradeClientData(clientId);
        if (clientData && HasAlreadyTraded(clientId))
        {
            // The trade is complete, send the Pokemon to the client
            const sentPokemon = clientData.originalPokemon;
            const friendPokemon = { ...clientData.pokemon };

            // Handle things like trade evolutions, friendship changes, etc.
            pokemonUtil.UpdatePokemonAfterNonFriendTrade(friendPokemon, sentPokemon);

            // Send the Pokemon to the client
            try
            {
                await socketUtils.safeSend(friendPokemon, clientData.receivedFrom);
                updateActivity();
            }
            catch (sendError)
            {
                console.error(`[WT] Socket instance send failed for ${clientName}:`, sendError);
                setInactive();
                UnlockWonderTrade();
                return false;
            }

            // Print logging information
            const species1 = pokemonUtil.GetMonSpeciesName(sentPokemon, true);
            const species2 = pokemonUtil.GetMonSpeciesName(friendPokemon, true);
            const speciesNames = [species1, species2];
            speciesNames.sort(); // Sort the species names for consistency
            console.log(`[WT] ${clientData.username} received ${species2} from ${clientData.receivedFrom}`);
            if (clientData.discordMessageId)
                await SendWonderTradeDiscordMessage(`${speciesNames[0]} and ${speciesNames[1]} were traded!`, 0x0000FF, clientData.discordMessageId);
        }

        UnlockWonderTrade();
        return true;
    }
    catch (error)
    {
        console.error(`[WT] Error in ProcessWonderTradeTransactions for ${clientName}:`, error);
        UnlockWonderTrade();
        return false;
    }
}
module.exports.ProcessWonderTradeTransactions = ProcessWonderTradeTransactions;

/**
 * Cleans up Wonder Trade data for a client after they disconnect.
 * @param {String} clientId - The client ID.
 * @param {String} clientName - The client name for logging.
 * @returns {Promise<void>} A promise that resolves when cleanup completes.
 */
async function CleanupWonderTradeClient(clientId, clientName)
{
    try
    {
        await LockWonderTrade();
        SetWonderTradeClientData(clientId, undefined); // Clear the client data
    }
    catch (error)
    {
        console.error(`Error cleaning up Wonder Trade client ${clientName}:`, error);
    }

    UnlockWonderTrade();
}
module.exports.CleanupWonderTradeClient = CleanupWonderTradeClient;
