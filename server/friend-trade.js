const randomstring = require("randomstring");
const Mutex = require('async-mutex').Mutex;

const pokemonUtil = require('./pokemon-util');
const { CloudDataSyncKeyIsValidForTrade, HasMatchingRandomizerSettings, IsSameClient } = require('./trade-util');

//Friend Trade data
const gFriendTradeClients = {};
const gCodesInUse = {};
const gFriendTradeMutex = new Mutex();

const FRIEND_TRADE_INITIAL = 0;
const FRIEND_TRADE_CONNECTED = 1;
const FRIEND_TRADE_NOTIFIED_CONNECTION = 2;
const FRIEND_TRADE_ACCEPTED_TRADE = 3;
const FRIEND_TRADE_ENDING_TRADE = 4;


/**
 * Locks the Friend Trade data and prevents it from being modified again until it's unlocked.
 * @returns {Promise<void>} A promise that resolves when the lock is acquired.
 */
async function LockFriendTrade()
{
    await gFriendTradeMutex.acquire();
}
module.exports.LockFriendTrade = LockFriendTrade; // For testing

/**
 * Unlocks the Friend Trade data for modifying again.
 */
function UnlockFriendTrade()
{
    gFriendTradeMutex.release();
}
module.exports.UnlockFriendTrade = UnlockFriendTrade; // For testing

/**
 * Creates a friend code to initiate trading.
 * @returns {String} The code the user's friend has to submit in order to connect to them for a Friend Trade.
 */
function CreateFriendCode()
{
    let code;

    do
    {
        code = randomstring.generate({ length: 8, charset: "alphanumeric", capitalization: "lowercase" });
    } while (code in gCodesInUse);

    return code;
}
module.exports.CreateFriendCode = CreateFriendCode; // For testing

/**
 * Sets up Friend Trade event handlers for a socket.
 * @param {Object} socket - The socket instance.
 * @param {Object} socketUtils - Socket utility functions.
 * @param {String} clientId - The client ID.
 * @param {String} username - The username.
 * @param {String} cloudDataSyncKey - The cloud data sync key.
 * @param {String} clientName - The client name for logging.
 */
function SetupFriendTradeHandlers(socket, socketUtils, clientId, username, cloudDataSyncKey, clientName)
{
    socket.on("createCode", async (randomizer) =>
    {
        await HandleCreateFriendCode(socketUtils, clientId, username, cloudDataSyncKey, randomizer, clientName);
    });

    socket.on("checkCode", async (code, randomizer) =>
    {
        await HandleCheckFriendCode(socketUtils, clientId, username, cloudDataSyncKey, code, randomizer, clientName);
    });

    socket.on('tradeOffer', async (pokemon) =>
    {
        await HandleFriendTradeOffer(socketUtils, clientId, pokemon, clientName);
    });

    socket.on('acceptedTrade', async () =>
    {
        try
        {
            await LockFriendTrade();
            if (clientId in gFriendTradeClients)
                gFriendTradeClients[clientId].acceptedTrade = true;
        }
        catch (error)
        {
            console.error(`[FT] Error in acceptedTrade handler for ${clientName}:`, error);
        }

        UnlockFriendTrade();
    });

    socket.on('cancelledTradeAcceptance', async () =>
    {
        try
        {
            await LockFriendTrade();
            if (clientId in gFriendTradeClients)
                gFriendTradeClients[clientId].acceptedTrade = false;
        }
        catch (error)
        {
            console.error(`[FT] Error in cancelledTradeAcceptance handler for ${clientName}:`, error);
        }

        UnlockFriendTrade();
    });

    socket.on('tradeAgain', async () =>
    {
        await HandleTradeAgain(clientId, clientName);
    });

    socket.on('disconnect', async () =>
    {
        await HandleFriendTradeDisconnect(clientId, clientName);
    });
}
module.exports.SetupFriendTradeHandlers = SetupFriendTradeHandlers; // For testing

/**
 * Handles creating a friend code
 * @param {Object} socketUtils - Socket utility functions.
 * @param {String} clientId - The client ID.
 * @param {String} username - The username.
 * @param {String} cloudDataSyncKey - The cloud data sync key.
 * @param {Boolean} randomizer - Whether randomizer is enabled.
 * @param {String} clientName - The client name for logging.
 * @returns {Promise<void>} A promise that resolves when the handler completes.
 */
async function HandleCreateFriendCode(socketUtils, clientId, username, cloudDataSyncKey, randomizer, clientName)
{
    try
    {
        if (!(await CloudDataSyncKeyIsValidForTrade(username, clientId, cloudDataSyncKey, randomizer, socketUtils, "FT")))
            return;

        // Create a new code and send it
        await LockFriendTrade();
        const code = CreateFriendCode();
        await socketUtils.safeEmit("createCode", code);
        console.log(`[FT] ${clientName} has created code "${code}"`);

        // Save the code and client data
        gFriendTradeClients[clientId] =
        {
            username: username,
            code: code,
            friend: "",
            randomizer: randomizer,
            state: FRIEND_TRADE_INITIAL,
        };
        gCodesInUse[code] = true;
    }
    catch (error)
    {
        console.error(`[FT] Error in createCode handler for ${clientName}:`, error);
    }

    UnlockFriendTrade();
}
module.exports.HandleCreateFriendCode = HandleCreateFriendCode; // For testing

/**
 * Handles checking a friend code
 * @param {Object} socketUtils - Socket utility functions.
 * @param {String} clientId - The client ID.
 * @param {String} username - The username.
 * @param {String} cloudDataSyncKey - The cloud data sync key.
 * @param {String} code - The friend code to check.
 * @param {Boolean} randomizer - Whether randomizer is enabled.
 * @param {String} clientName - The client name for logging.
 * @returns {Promise<void>} A promise that resolves when the handler completes.
 */
async function HandleCheckFriendCode(socketUtils, clientId, username, cloudDataSyncKey, code, randomizer, clientName)
{
    try
    {
        let partnerFound = false;
        console.log(`[FT] ${clientName} is looking for code "${code}"`);

        if (!(await CloudDataSyncKeyIsValidForTrade(username, clientId, cloudDataSyncKey, randomizer, socketUtils, "FT")))
            return;

        await LockFriendTrade();
        for (let otherClientId of Object.keys(gFriendTradeClients))
        {
            const otherClient = gFriendTradeClients[otherClientId];
            if (!otherClient) continue;

            const otherUserName = otherClient.username;

            if (otherClient.friend === "" && otherClient.code === code)
            {
                if (IsSameClient(clientId, otherClientId, username, otherUserName))
                {
                    console.log(`[FT] ${clientName} tried to trade with themself`);
                    await socketUtils.safeEmit("tradeWithSelf");
                    UnlockFriendTrade();
                    return;
                }

                partnerFound = true;
                console.log(`[FT] ${clientName} has matched with ${otherUserName}`);

                if (HasMatchingRandomizerSettings(randomizer, otherClient.randomizer))
                {
                    gFriendTradeClients[clientId] =
                    {
                        username: username,
                        code: code,
                        friend: otherClientId,
                        randomizer: randomizer,
                        state: FRIEND_TRADE_CONNECTED,
                    };
                    gFriendTradeClients[otherClientId] =
                    {
                        username: otherUserName,
                        code: code,
                        friend: clientId,
                        randomizer: otherClient.randomizer,
                        state: FRIEND_TRADE_CONNECTED,
                    };
                }
                else
                {
                    console.log(`[FT] But ${clientName} and ${otherUserName} don't match randomizer statuses`);
                    await socketUtils.safeEmit("mismatchedRandomizer");
                }

                break; // Exit loop once a partner is found
            }
        }

        if (!partnerFound)
        {
            console.log(`[FT] ${clientName} could not find partner`);
            await socketUtils.safeEmit("friendNotFound");
        }
    }
    catch (error)
    {
        console.error(`[FT] Error in checkCode handler for ${clientName}:`, error);
    }

    UnlockFriendTrade();
}
module.exports.HandleCheckFriendCode = HandleCheckFriendCode; // For testing

/**
 * Handles a friend trade offer
 * @param {Object} socketUtils - Socket utility functions.
 * @param {String} clientId - The client ID.
 * @param {Object|null} pokemon - The Pokemon being offered or null to cancel.
 * @param {String} clientName - The client name for logging.
 * @returns {Promise<void>} A promise that resolves when the handler completes.
 */
async function HandleFriendTradeOffer(socketUtils, clientId, pokemon, clientName)
{
    try
    {
        if (!pokemonUtil.ValidatePokemon(pokemon, true))
        {
            console.log(`[FT] ${clientName} sent an invalid Pokemon for a Friend Trade`);
            await socketUtils.safeEmit("invalidPokemon");
            return;
        }

        await LockFriendTrade();
        if (!(clientId in gFriendTradeClients))
            throw new Error(`${clientName} not found in Friend Trade clients when handling offer`);

        if (pokemon != null && "species" in pokemon)
            console.log(`[FT] ${clientName} is offering ${pokemonUtil.GetSpecies(pokemon)}`);
        else
            console.log(`[FT] ${clientName} cancelled the trade offer`);

        gFriendTradeClients[clientId].offeringPokemon = pokemon;
        gFriendTradeClients[clientId].notifiedFriendOfOffer = false;
    }
    catch (error)
    {
        console.error(`[FT] Error in tradeOffer handler for ${clientName}:`, error);
    }

    UnlockFriendTrade();
}
module.exports.HandleFriendTradeOffer = HandleFriendTradeOffer; // For testing

/**
 * Handles trade again request
 * @param {String} clientId - The client ID.
 * @param {String} clientName - The client name for logging.
 * @returns {Promise<void>} A promise that resolves when the handler completes.
 */
async function HandleTradeAgain(clientId, clientName)
{
    try
    {
        await LockFriendTrade();
        console.log(`[FT] ${clientName} wants to trade again`);
        if (!(clientId in gFriendTradeClients))
            throw new Error(`${clientName} not found in Friend Trade clients when handling tradeAgain`);

        gFriendTradeClients[clientId].state = FRIEND_TRADE_NOTIFIED_CONNECTION;

        // Delete any existing trade data for the client
        delete gFriendTradeClients[clientId].notifiedFriendOfOffer;
        delete gFriendTradeClients[clientId].acceptedTrade;
        delete gFriendTradeClients[clientId].offeringPokemon;
    }
    catch (error)
    {
        console.error(`[FT] Error in tradeAgain handler for ${clientName}:`, error);
    }

    UnlockFriendTrade();
}
module.exports.HandleTradeAgain = HandleTradeAgain; // For testing

/**
 * Handles friend trade disconnect
 * @param {String} clientId - The client ID.
 * @param {String} clientName - The client name for logging.
 * @returns {Promise<void>} A promise that resolves when the handler completes.
 */
async function HandleFriendTradeDisconnect(clientId, clientName)
{
    await CleanupFriendTradeClient(clientId, clientName);
}
module.exports.HandleFriendTradeDisconnect = HandleFriendTradeDisconnect; // For testing

/**
 * Processes Friend Trade state machine.
 * @param {String} clientId - The client ID.
 * @param {String} clientName - The client name for logging.
 * @param {Object} socketUtils - Socket utility functions.
 * @param {Function} updateActivity - Function to update last activity.
 * @param {Function} setInactive - Function to mark socket as inactive.
 * @returns {Promise<void>} A promise that resolves when processing completes.
 */
async function ProcessFriendTradeStates(clientId, clientName, socketUtils, updateActivity, setInactive)
{
    try
    {
        if (!gFriendTradeClients[clientId]?.friend)
            return;

        await LockFriendTrade();

        const clientData = gFriendTradeClients[clientId];
        switch (clientData.state)
        {
            case FRIEND_TRADE_CONNECTED:
                console.log(`[FT] ${clientName} has been notified of the friend connection`);
                gFriendTradeClients[clientId].state = FRIEND_TRADE_NOTIFIED_CONNECTION;

                try
                {
                    await socketUtils.safeEmit("friendFound");
                    updateActivity();
                }
                catch (emitError)
                {
                    console.error(`[FT] Socket emit failed for ${clientName}:`, emitError);
                    setInactive();
                }
                break;

            case FRIEND_TRADE_NOTIFIED_CONNECTION:
                await handleFriendTradeNotifiedState(clientId, clientData, clientName, socketUtils, updateActivity, setInactive);
                break;

            case FRIEND_TRADE_ACCEPTED_TRADE:
                await handleFriendTradeAcceptedState(clientId, clientData, clientName, socketUtils, updateActivity, setInactive);
                break;
        }
    }
    catch (error)
    {
        console.error(`[FT] Error processing Friend Trade states for ${clientName}:`, error);
        await CleanupFriendTradeClient(clientId, clientName);
        setInactive();
    }

    UnlockFriendTrade();
}
module.exports.ProcessFriendTradeStates = ProcessFriendTradeStates; // For testing

/**
 * Handles the notified connection state for friend trades
 * @param {String} clientId - The client ID.
 * @param {Object} clientData - The client's trade data.
 * @param {String} clientName - The client name for logging.
 * @param {Object} socketUtils - Socket utility functions.
 * @param {Function} updateActivity - Function to update last activity.
 * @param {Function} setInactive - Function to mark socket as inactive.
 * @returns {Promise<void>} A promise that resolves when processing completes.
 */
async function handleFriendTradeNotifiedState(clientId, clientData, clientName, socketUtils, updateActivity, setInactive)
{
    const code = clientData.code;

    if (!(code in gCodesInUse))
    {
        try
        {
            await socketUtils.safeEmit("partnerDisconnected");
            updateActivity();
        }
        catch (emitError)
        {
            console.error(`[FT] Socket emit failed for ${clientName}:`, emitError);
            setInactive();
        }

        return;
    }

    const friend = clientData.friend;
    const friendData = gFriendTradeClients[friend];
    if (!friendData)
        return;

    if (clientData.acceptedTrade && friendData.acceptedTrade)
    {
        // Both accepted, prepare for trade completion
        gFriendTradeClients[clientId].state = FRIEND_TRADE_ACCEPTED_TRADE;
        gFriendTradeClients[clientId].friendPokemon = friendData.offeringPokemon;
        gFriendTradeClients[clientId].friendUsername = friendData.username;
        gFriendTradeClients[friend].state = FRIEND_TRADE_ACCEPTED_TRADE;
        gFriendTradeClients[friend].friendPokemon = clientData.offeringPokemon;
        gFriendTradeClients[friend].friendUsername = clientData.username;
    }
    else if ("offeringPokemon" in friendData && !friendData.notifiedFriendOfOffer)
    {
        const friendPokemon = friendData.offeringPokemon;

        if (friendPokemon == null || !("species" in friendPokemon))
            console.log(`[FT] ${clientName} has been notified of the trade offer cancellation`);
        else
            console.log(`[FT] ${clientName} received offer for ${pokemonUtil.GetSpecies(friendPokemon)}`);

        try
        {
            await socketUtils.safeEmit("tradeOffer", friendPokemon);
            gFriendTradeClients[friend].notifiedFriendOfOffer = true;
            updateActivity();
        }
        catch (emitError)
        {
            console.error(`[FT] Socket emit failed for ${clientName}:`, emitError);
            setInactive();
        }
    }
}

/**
 * Handles the accepted trade state for friend trades
 * @param {String} clientId - The client ID.
 * @param {Object} clientData - The client's trade data.
 * @param {String} clientName - The client name for logging.
 * @param {Object} socketUtils - Socket utility functions.
 * @param {Function} updateActivity - Function to update last activity.
 * @param {Function} setInactive - Function to mark socket as inactive.
 * @returns {Promise<void>} A promise that resolves when processing completes.
 */
async function handleFriendTradeAcceptedState(clientId, clientData, clientName, socketUtils, updateActivity, setInactive)
{
    const friendPokemon = Object.assign({}, clientData.friendPokemon);

    pokemonUtil.UpdatePokemonAfterFriendTrade(friendPokemon, clientData.offeringPokemon);

    try
    {
        await socketUtils.safeEmit("acceptedTrade", friendPokemon);
        gFriendTradeClients[clientId].state = FRIEND_TRADE_ENDING_TRADE;
        console.log(`[FT] ${clientName} received ${pokemonUtil.GetSpecies(friendPokemon)} from ${clientData.friendUsername}`);
        updateActivity();
    }
    catch (emitError)
    {
        console.error(`[FT] Socket emit failed for ${clientName}:`, emitError);
        setInactive();
    }
}

/**
 * Cleans up Friend Trade data for a client.
 * @param {String} clientId - The client ID.
 * @param {String} clientName - The client name for logging.
 * @returns {Promise<void>} A promise that resolves when cleanup completes.
 */
async function CleanupFriendTradeClient(clientId, clientName)
{
    if (!clientId || !(clientId in gFriendTradeClients))
        return;

    try
    {
        await LockFriendTrade();
        const code = gFriendTradeClients[clientId]?.code;
        if (code && gCodesInUse[code])
            delete gCodesInUse[code];
    }
    catch (error)
    {
        console.error(`[FT] Error removing ${clientName} entirely:`, error);
    }

    delete gFriendTradeClients[clientId];
    console.log(`[FT] ${clientName} disconnected`);
    UnlockFriendTrade();
}
module.exports.CleanupFriendTradeClient = CleanupFriendTradeClient; // For testing

// Export data access functions for testing
module.exports.GetFriendTradeClientData = function (clientId)
{
    return gFriendTradeClients[clientId];
}; // For testing

module.exports.SetFriendTradeClientData = function (clientId, data)
{
    gFriendTradeClients[clientId] = data;
}; // For testing

module.exports.ClearAllFriendTradeData = function ()
{
    Object.keys(gFriendTradeClients).forEach(key => delete gFriendTradeClients[key]);
    Object.keys(gCodesInUse).forEach(key => delete gCodesInUse[key]);
}; // For testing

module.exports.GetCodesInUse = function ()
{
    return { ...gCodesInUse };
}; // For testing

module.exports.SetCodeInUse = function (code, inUse)
{
    if (inUse)
        gCodesInUse[code] = true;
    else
        delete gCodesInUse[code];
}; // For testing

module.exports.GetAllFriendTradeClients = function ()
{
    return { ...gFriendTradeClients };
}; // For testing

// Export constants for testing
module.exports.FRIEND_TRADE_INITIAL = FRIEND_TRADE_INITIAL;
module.exports.FRIEND_TRADE_CONNECTED = FRIEND_TRADE_CONNECTED;
module.exports.FRIEND_TRADE_NOTIFIED_CONNECTION = FRIEND_TRADE_NOTIFIED_CONNECTION;
module.exports.FRIEND_TRADE_ACCEPTED_TRADE = FRIEND_TRADE_ACCEPTED_TRADE;
module.exports.FRIEND_TRADE_ENDING_TRADE = FRIEND_TRADE_ENDING_TRADE;
