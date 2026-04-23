const express = require('express');
const {StatusCode} = require('status-code-enum');

const accounts = require('../accounts');
const tradeUtil = require('../trade-util');
const util = require('../util');

const router = express.Router();

/**
 * Endpoint: POST /new - Creates a user account.
 * @param {String} email - The email of the account being created.
 * @param {String} username - The username to register the account under.
 * @param {String} password - The password of the account being created.
 * @param {String} cloudDataPX - 8 chunks of strings when combined together form the Cloud Boxes to save with the account.
 * @returns {StatusCode} SuccessOK if the account was created successfullty, error responses if it was not.
 */
router.post('/new', async (req, res) =>
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
 * Endpoint: POST /login - Checks an username and password combination for logging into an account.
 * @param {String} username - The username of the account being logged into.
 * @param {String} password - The password of the account being logged into.
 * @returns {StatusCode} SuccessOK if the username and password matched, error codes if not.
 */
router.post('/login', async (req, res) =>
{
    let username, password;
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
 * Endpoint: POST /activate - Activates a user account.
 * @param {String} username - The username of the account being activated.
 * @param {String} activationCode - The confirmation code sent to the username being activated.
 * @returns {StatusCode} SuccessOK if the account was activated successfully, error codes if not.
 */
router.post('/activate', async (req, res) =>
{
    const username = req.body.username;
    const activationCode = req.body.activationCode;
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
 * Endpoint: POST /sendActivationCode - Sends another activation code to a user.
 * @param {String} username - The username of the account to send the email for.
 * @param {String} accountCode - The account code of the account to send the email for.
 * @returns {StatusCode} SuccessOK if the email was sent successfully, error codes if not.
 */
router.post('/sendActivationCode', async (req, res) =>
{
    const username = req.body.username;
    const accountCode = req.body.accountCode;
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
 * Endpoint: POST /sendPasswordResetCode - Sends a password reset code to a user.
 * @param {String} email - The email to send the password reset code to.
 * @returns {StatusCode} SuccessOK if the email was sent successfully, error codes if not.
 */
router.post('/sendPasswordResetCode', async (req, res) =>
{
    const email = req.body.email;
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
 * Endpoint: POST /resetPassword - Resets a user's password.
 * @param {String} email - The email on the account.
 * @param {String} newPassword - The new password to set for the account.
 * @param {String} resetCode - The reset password code sent to the user's email earlier.
 * @returns {StatusCode} SuccessOK if the password was reset, error codes if not.
 */
router.post('/resetPassword', async (req, res) =>
{
    const email = req.body.email;
    const newPassword = req.body.newPassword;
    const resetCode = req.body.resetCode;
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
 * Endpoint: GET /getAccountCloudData - Gets the user's Cloud Boxes.
 * @param {String} username - The username of the account to get the data for.
 * @param {String} accountCode - The account code of the account to get the data for.
 * @param {Boolean} randomizer - Whether or not to get the randomizer Boxes or the regular Boxes.
 * @returns {StatusCode} SuccessOK with an object of format:
 *                       {
 *                           cloudBoxes: The user's Cloud Boxes.
 *                           cloudTitles: The names of the user's Cloud Boxes.
 *                       }
 *                       If the Boxes were extracted successfully, error codes if not.
 */
router.get('/getAccountCloudData', async (req, res) =>
{
    const funcStartTime = Date.now();
    var username = req.query.username;
    var accountCode = req.query.accountCode;
    var randomizer = req.query.randomizer;

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
 * Endpoint: PUT /saveAccountCloudData - Saves a user's saved Cloud Boxes and Box names.
 * @param {String} homeData - 4 chunks of strings when combined together form the Cloud Boxes and titles that were uploaded.
 * @returns {StatusCode} SuccessOK if the data was saved successfully, error codes if not.
 */
router.put('/saveAccountCloudData', async (req, res) =>
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
                return res.status(StatusCode.ClientErrorUnauthorized).json(tradeUtil.INVALID_CLOUD_DATA_SYNC_KEY_ERROR);
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

/**
 * Endpoint: GET /validateCloudDataSyncKey - Checks if a user's cloud data sync key is still valid.
 * @param {String} username - The username of the account to validate the key for.
 * @param {String} accountCode - The account code of the account (extra security layer).
 * @param {String} cloudDataSyncKey - The cloud data sync key to validate.
 * @param {Boolean} randomizer - Whether or not the key is for a randomized save.
 * @returns {StatusCode} SuccessOK if the key is valid, ClientErrorUnauthorized if not.
 */
router.get('/validateCloudDataSyncKey', async (req, res) =>
{
    var username = req.query.username;
    var accountCode = req.query.accountCode;
    var cloudDataSyncKey = req.query.cloudDataSyncKey;
    var randomizer = req.query.randomizer;

    try
    {
        randomizer = (randomizer === "true");

        if (!accounts.UserExists(username))
            return res.status(StatusCode.ClientErrorNotFound).send("Username was not found!");
        else if (accounts.GetUserAccountCode(username) !== accountCode)
            return res.status(StatusCode.ClientErrorUnauthorized).json("Account code is incorrect!");

        let userKey = await accounts.GetCloudDataSyncKey(username, randomizer);
        if (userKey === "" || cloudDataSyncKey !== userKey)
            return res.status(StatusCode.ClientErrorUnauthorized).json(tradeUtil.INVALID_CLOUD_DATA_SYNC_KEY_ERROR);

        return res.status(StatusCode.SuccessOK).json({});
    }
    catch (err)
    {
        console.error(`An error occurred validating the cloud data sync key for ${username}:\n${err}`);
        return res.status(StatusCode.ClientErrorBadRequest).json(`${err}`);
    }
});

module.exports = router;
