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
const wonderTrade = require('./wonder-trade');

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

//Register the /api/user/* endpoints
app.use('/api/user', require('./endpoints/user'));

//Start the server
if (require.main === module) //Only start the server if this file is being run directly, not imported by another file (like in the tests)
{
    http.listen(PORT, function()
    {
        console.log(`Node server listening on ${PORT}`);
    });
}

module.exports = { app, http };


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
 * Endpoint: /api/savefile/read - Uploads a save file and extracts the Boxes from it.
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
app.post('/api/savefile/read', async (req, res) =>
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
                    throw(`INVALID_ACCOUNT_CODE`);
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
 * Endpoint: /api/cloudfile/decrypt - Uploads an encrypted Cloud data file.
 * @returns {StatusCode} SuccessOK with an object of format
 *                       {
 *                            boxes: The Cloud Boxes.
 *                            titles: The titles of the Cloud Boxes.
 *                            randomizer: Whether or not the Boxes were for a randomized save file.
 *                       }
 *                       If the Boxes were extracted successfully, error codes if not.
 */
app.post('/api/cloudfile/decrypt', async (req, res) =>
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
 * Endpoint: /api/cloudfile/encrypt - Encrypts Cloud data and sends back the encrypted version.
 * @param {String} homeData - The Cloud Boxes and Box names that were uploaded.
 * @returns {StatusCode} SuccessOK with an object of format {newHomeData}.
 */
app.post('/api/cloudfile/encrypt', (req, res) =>
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
 * Endpoint: /api/savefile/update
 * @returns {StatusCode} SuccessOK with an object of format
 *                       {
 *                            newSaveFileData: The new save file buffer.
 *                       }
 *                       If the Boxes were saved successfully, error codes if not.
 */
app.post('/api/savefile/update', async (req, res) =>
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
               Trade Functions               
*******************************************/

/**
 * Endpoint: GET /api/wonderTrade/available - Checks if a Wonder Trade is available.
 * @param {string} req.query.username - The user checking.
 * @param {boolean} req.query.randomizer - Whether the user is using a randomized save.
 * @returns {StatusCode} SuccessOK with an object of format:
 *                       {
 *                           waiting: Whether someone is waiting for a Wonder Trade.
 *                       }
 */
app.get('/api/wonderTrade/available', async (req, res) =>
{
    try
    {
        //Parse the request query
        let username = req.query.username;
        let randomizer = req.query.randomizer;
        if (username == null)
            throw("Username arg was not found!");
        else if (randomizer == null)
            throw("Randomizer arg was not found!");

        //Check if a trade is available
        //console.log("----------------------------------------------");
        //console.log(`[${new Date().toLocaleString()}] Checking if a Wonder Trade is available for "${username}"...`);
        let waiting = wonderTrade.IsWonderTradeAvailable("isWonderTradeAvailable", username, randomizer);
        //console.log(`Wonder Trade is ${!waiting ? "not " : ""}available for ${username}`);
        return res.status(StatusCode.SuccessOK).json({waiting: waiting});
    }
    catch (err)
    {
        console.error(`An error occurred checking if a Wonder Trade is available for ${username}:\n${err}`);
        return res.status(StatusCode.ServerErrorInternal).json(err);
    }
});
