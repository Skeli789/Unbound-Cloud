const accounts = require('./accounts');
require('dotenv').config({ path: __dirname + '/.env' });

//General data
const ENFORCE_USERNAMES = (process.env["ACCOUNT_SYSTEM"] === "true") ? true : false;
const INVALID_CLOUD_DATA_SYNC_KEY_ERROR = "The Cloud data has already been opened in another tab!\nPlease reload the page to avoid data corruption.";
module.exports.INVALID_CLOUD_DATA_SYNC_KEY_ERROR = INVALID_CLOUD_DATA_SYNC_KEY_ERROR;

/**
 * Validates that the client trying to trade didn't already open the Cloud data in a new tab.
 * @param {String} username - The user who's trying to trade.
 * @param {String} clientId - The client id of the user trying to trade.
 * @param {String} cloudDataSyncKey - The cloud data sync key sent from the client to verify.
 * @param {Boolean} randomizer - Whether or not the Cloud Boxes are for a randomized save.
 * @param {Object} socketUtils - Utility functions for the socket connection.
 * @param {String} clientType - Either "FT" for "Friend Trade", or "WT" for "Wonder Trade".
 * @returns {Promise<Boolean>} Whether the trade is allowed to happen. False if the user already opened their Cloud Boxes in a new tab.
 */
async function CloudDataSyncKeyIsValidForTrade(username, clientId, cloudDataSyncKey, randomizer, socketUtils, clientType)
{
    const routeWhenInvalid = "invalidCloudDataSyncKey";

    // Check if username is provided when required
    if (ENFORCE_USERNAMES && (!username || username.trim() === ''))
    {
        console.log(`[${clientType}] ${clientId} sent no username`);
        socketUtils.safeEmit(routeWhenInvalid, "A username must be provided to trade!");
        return false;
    }

    if (username)
    {
        try
        {
            let userKey = await accounts.GetCloudDataSyncKey(username, randomizer);

            if (!cloudDataSyncKey)
            {
                console.log(`[${clientType}] ${username} sent no cloud data sync key`);
                socketUtils.safeEmit(routeWhenInvalid, "The cloud data sync key was missing!");
                return false;
            }
            else if (cloudDataSyncKey !== userKey)
            {
                console.log(`[${clientType}] ${username} sent an old cloud data sync key`);
                socketUtils.safeEmit(routeWhenInvalid, INVALID_CLOUD_DATA_SYNC_KEY_ERROR);
                return false;
            }
        }
        catch (error)
        {
            console.error(`[${clientType}] Error validating cloud data sync key for ${username}:`, error);
            socketUtils.safeEmit(routeWhenInvalid, "Error validating cloud data sync key!");
            return false;
        }
    }

    return true;
}
module.exports.CloudDataSyncKeyIsValidForTrade = CloudDataSyncKeyIsValidForTrade;

/**
 * Checks if two clients are from the same user.
 * @param {String} clientId - The current client id.
 * @param {String} otherClientId - The other client id to check.
 * @param {String} username - The current username.
 * @param {String} otherUsername - The other username to check.
 * @returns {Boolean} Whether the two clients are from the same user.
 */
function IsSameClient(clientId, otherClientId, username, otherUsername)
{
    return (clientId != null && clientId === otherClientId)
        || (username != null && username?.toLowerCase() === otherUsername?.toLowerCase());
}
module.exports.IsSameClient = IsSameClient;

/**
 * Checks if two clients have matching randomizer settings.
 * @param {Boolean} currentRandomizer - Current client's randomizer setting.
 * @param {Boolean} otherRandomizer - Other client's randomizer setting.
 * @returns {Boolean} Whether randomizer settings match.
 */
function HasMatchingRandomizerSettings(currentRandomizer, otherRandomizer)
{
    return currentRandomizer === otherRandomizer;
}
module.exports.HasMatchingRandomizerSettings = HasMatchingRandomizerSettings;
