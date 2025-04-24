const express = require('express');
const app = express();

const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const CryptoJS = require("crypto-js");
const fs = require('fs');
const http = require('http').Server(app);
const _ = require('lodash');
const {StatusCode} = require('status-code-enum');
require('dotenv').config({path: __dirname + '/.env'});

const accounts = require('./accounts');
const sockets = require('./sockets');
const util = require('./util');

const gSecretKey = process.env["ENCRYPTION_KEY"] || "key";
const PORT = process.env.PORT || 3001;

const MAX_PAYLOAD_SIZE = 10; //10 MB
app.use(cors());
app.use(bodyParser.json({ limit: `${MAX_PAYLOAD_SIZE}mb` })); 
app.use(bodyParser.urlencoded({ limit: `${MAX_PAYLOAD_SIZE}mb`, extended: false }));

app.use(express.static('./images'));

var io = require('socket.io')(http, 
    {cors: {origin: PORT, methods: ["GET", "POST"], credentials: true}});

//Initialize web sockets
sockets.InitSockets(io);

//Start the server
http.listen(PORT, function()
{
    console.log(`Node server listening on ${PORT}`);
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
                else
                    throw(`The account code is not valid for ${username}!`);
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


/*******************************************
               Trade Functions               
*******************************************/

/**
 * Endpoint: /checkWonderTrade - Checks if a Wonder Trade is available.
 * @param {string} req.body.username - The user checking.
 * @param {boolean} req.body.randomizer - Whether the user is using a randomized save.
 * @returns {StatusCode} SuccessOK with an object of format:
 *                       {
 *                           waiting: Whether someone is waiting for a Wonder Trade.
 *                       }
 */
app.post('/checkWonderTrade', async (req, res) =>
{
    try
    {
        //Parse the request body
        let username = req.body.username;
        let randomizer = req.body.randomizer;
        if (username == null)
            throw("Username arg was not found!");
        else if (randomizer == null)
            throw("Randomizer arg was not found!");

        //Check if a trade is available
        //console.log("----------------------------------------------");
        //console.log(`[${new Date().toLocaleString()}] Checking if a Wonder Trade is available for "${username}"...`);
        let waiting = sockets.IsWonderTradeAvailable(username, randomizer);
        //console.log(`Wonder Trade is ${!waiting ? "not " : ""}available for ${username}`);
        return res.status(StatusCode.SuccessOK).json({waiting: waiting});
    }
    catch (err)
    {
        console.error(`An error occurred checking if a Wonder Trade is available for ${username}:\n${err}`);
        return res.status(StatusCode.ServerErrorInternal).json(err);
    }
});
