const express = require('express');
const app = express();
var http = require('http').Server(app);
var multer = require('multer');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const {exec} = require('child_process');
const path = require('path');
const fs = require('fs');
const randomstring = require("randomstring");
const CryptoJS = require("crypto-js");
const pokemonUtil = require('./pokemon-util');
const {StatusCode} = require('status-code-enum');

const gSecretKey = "blah blah blacksheep";
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(fileUpload());
app.use(express.static('./images'));

var io = require('socket.io')(http, 
    {cors: {origin: PORT, methods: ["GET", "POST"], credentials: true}});

const gWonderTradeClients = {};
const gFriendTradeClients = {};
const gCodesInUse = {};

const FRIEND_TRADE_INITIAL = 0;
const FRIEND_TRADE_CONNECTED = 1;
const FRIEND_TRADE_NOTIFIED_CONNECTION = 2;
const FRIEND_TRADE_ACCEPTED_TRADE = 3;
const FRIEND_TRADE_ENDING_TRADE = 4;

//TODO: Timeout if connection has gone on too long

function CreateFriendCode()
{
    var code;

    do
    {
        code = randomstring.generate({length: 8, charset: "alphanumeric", capitalization: "lowercase"});
    } while (code in gCodesInUse);

    return code;
}

// When a connection is made, loop forever until a Wonder Trade is made
io.on("connection", async function(socket)
{
    var clientId = socket.id;
    console.log(`Client ${clientId} connected`);

    socket.on("tradeType", (data) =>
    {
        if (data == "WONDER_TRADE")
        {
            console.log(`WT-Client ${clientId} wants a Wonder Trade`);

            socket.on("message", (pokemonToSend, randomizer) =>
            {
                var keys = Object.keys(gWonderTradeClients).filter((x) =>
                                       x != clientId
                                    && gWonderTradeClients[x].tradedWith === 0
                                    && gWonderTradeClients[x].randomizer == randomizer);

                if (!pokemonUtil.ValidatePokemon(pokemonToSend, false))
                {
                    console.log(`WT-Client ${clientId} sent an invalid Pokemon for a Wonder Trade`);
                    socket.emit("invalidPokemon");
                }
                else
                {
                    if (keys.length !== 0)
                    {
                        var pokemonToReceive = gWonderTradeClients[keys[0]].pokemon;
                        gWonderTradeClients[keys[0]] =  {pokemon: pokemonToSend, originalPokemon: pokemonToReceive, tradedWith: clientId}; //Immediately lock the data
                        gWonderTradeClients[clientId] = {pokemon: pokemonToReceive, originalPokemon: pokemonToSend, tradedWith: keys[0]}; //Set this client as traded
                        //Note that the randomizer key isn't needed anymore
                    }
                    else
                    {
                        if (!(clientId in gWonderTradeClients)) //Don't overwrite previously requested mon
                            gWonderTradeClients[clientId] = {pokemon: pokemonToSend, tradedWith: 0, randomizer: randomizer};
                    }
                }
            });

            socket.on('disconnect', () =>
            {
                delete gWonderTradeClients[clientId]; //Remove data so no one trades with it
                console.log(`WT-Client ${clientId} disconnected`);
            });
        }
        else if (data == "FRIEND_TRADE")
        {
            console.log(`FT-Client ${clientId} wants a Friend Trade`);

            socket.on("createCode", (randomizer) =>
            {
                let code = CreateFriendCode();
                socket.emit("createCode", code);
                console.log(`FT-Client ${clientId} has created code "${code}"`);
                gFriendTradeClients[clientId] = {code: code, friend: "", randomizer: randomizer, state: FRIEND_TRADE_INITIAL};
                gCodesInUse[code] = true;
            });

            socket.on("checkCode", (code, randomizer) =>
            {
                let partnerFound = false;
                console.log(`FT-Client ${clientId} is looking for code "${code}"`);
        
                for (let otherClientId of Object.keys(gFriendTradeClients))
                {
                    if (gFriendTradeClients[otherClientId].friend === "" //Hasn't found a partner yet
                    && gFriendTradeClients[otherClientId].code === code) //Code matches so this will be the partner
                    {
                        partnerFound = true;
                        console.log(`FT-Client ${clientId} has matched with ${otherClientId}`);

                        if ((!randomizer && !gFriendTradeClients[otherClientId].randomizer)
                        || (randomizer && gFriendTradeClients[otherClientId].randomizer)) //Randomizer status matches
                        {
                            gFriendTradeClients[clientId] = {code: code, friend: otherClientId, state: FRIEND_TRADE_CONNECTED};
                            gFriendTradeClients[otherClientId] = {code: code, friend: clientId, state: FRIEND_TRADE_CONNECTED};
                            //Randomizer keys no longer matter
                        }
                        else
                        {
                            console.log(`But FT-Clients ${clientId} and ${otherClientId} don't match randomizer statuses`);
                            socket.emit("mismatchedRandomizer");
                        }
                    }
                }

                if (!partnerFound)
                {
                    console.log(`FT-Client ${clientId} could not find partner`);
                    socket.emit("friendNotFound");
                }
            });

            socket.on('tradeOffer', (pokemon) =>
            {
                if (!pokemonUtil.ValidatePokemon(pokemon, true))
                {
                    console.log(`FT-Client ${clientId} sent an invalid Pokemon for a Friend Trade`);
                    socket.emit("invalidPokemon");
                }
                else if (clientId in gFriendTradeClients)
                {
                    if (pokemon != null && "species" in pokemon)
                        console.log(`FT-Client ${clientId} is offering ${pokemonUtil.GetSpecies(pokemon)}`);
                    else
                        console.log(`FT-Client ${clientId} cancelled the trade offer`);

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
                console.log(`FT-Client ${clientId} wants to trade again`);
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
                console.log(`FT-Client ${clientId} disconnected`);
            });
        }
    });

    while (true)
    {
        let friend, friendPokemon, originalPokemon;

        if (clientId in gWonderTradeClients && gWonderTradeClients[clientId].tradedWith !== 0)
        {
            originalPokemon = gWonderTradeClients[clientId].originalPokemon;
            friendPokemon = Object.assign({}, gWonderTradeClients[clientId].pokemon);
            pokemonUtil.UpdatePokemonAfterNonFriendTrade(friendPokemon, originalPokemon);
            socket.send(friendPokemon);
            console.log(`WT-Client ${clientId} received Pokemon from ${gWonderTradeClients[clientId].tradedWith}`);
            //Data deleted when client disconnects in case they don't receive this transmission
        }
        else if (clientId in gFriendTradeClients
        && gFriendTradeClients[clientId].friend !== "")
        {
            switch (gFriendTradeClients[clientId].state)
            {
                case FRIEND_TRADE_CONNECTED:
                    console.log(`FT-Client ${clientId} has been notified of the friend connection`);
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
                                    console.log(`FT-Client ${clientId} has been notified of the the trade offer cancellation`);
                                else
                                    console.log(`FT-Client ${clientId} received offer for ${pokemonUtil.GetSpecies(friendPokemon)}`);

                                socket.emit("tradeOffer", friendPokemon); //Can be sent null (means partner cancelled offer)
                                gFriendTradeClients[friend].notifiedFriendOfOffer = true;
                            }
                            else if ("acceptedTrade" in gFriendTradeClients[clientId]
                            && gFriendTradeClients[clientId].acceptedTrade
                            && "acceptedTrade" in gFriendTradeClients[friend]
                            && gFriendTradeClients[friend].acceptedTrade)
                            {
                                gFriendTradeClients[clientId].state = FRIEND_TRADE_ACCEPTED_TRADE;
                                gFriendTradeClients[friend].state = FRIEND_TRADE_ACCEPTED_TRADE;
                            }
                        }
                    }
                    break;
                case FRIEND_TRADE_ACCEPTED_TRADE:
                    friend = gFriendTradeClients[clientId].friend;
                    friendPokemon = Object.assign({}, gFriendTradeClients[friend].offeringPokemon);
                    pokemonUtil.UpdatePokemonAfterFriendTrade(friendPokemon, gFriendTradeClients[clientId].offeringPokemon);
                    socket.emit("acceptedTrade", friendPokemon);
                    gFriendTradeClients[clientId].state = FRIEND_TRADE_ENDING_TRADE;
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


//Functions
/*
    Variables for facilitating file upload to the server.
*/
var storage = multer.diskStorage
({
    destination: function (req, file, cb)
    {
        cb(null, 'public')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

var upload = multer({storage: storage}).single('file');


/*
    Runs some server command.
    param command: The command to run on the server.
    returns: A promise with the command line output. Resolved if the command is run successfully.
*/
function RunCommand(command) {
    return new Promise((resolve, reject) =>
    {
        exec(command, (err, stdout, stderr) =>
        {
            if (err)
            {
                console.log(err);
                reject("Can't run this command.");
            }
            else
            {
                resolve(stdout);
            }
        });
    });
}

/*
    Creates a directory "temp/" if it doesn't already exist.
*/
function MakeTempFolder()
{
    var dir = "temp/"

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);
}

/*
    Endpoint: /uploadSaveFile
    returns as the response: the boxes
*/
app.post('/uploadSaveFile', async (req, res) =>
{
    //Finish the upload of the save file
    upload(req, res, function (err)
    {
        if (err instanceof multer.MulterError)
            return res.status(StatusCode.ServerErrorInternal).json(err)
        else if (err)
            return res.status(StatusCode.ServerErrorInternal).json(err)
    })

    //Write the save file to a temp file
    var saveFileData = req.files.file.data;
    var saveFileName, fileIdNumber;

    do //Get a temp name that's not already in use
    {
        fileIdNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        saveFileName = `temp/savefile_${fileIdNumber}.sav`;
    } while(fs.existsSync(saveFileName));

    MakeTempFolder();
    fs.writeFileSync(saveFileName, saveFileData);
    console.log(`Temp save file saved to server as ${saveFileName}.`);

    //Run the Python script
    var result;
    try
    {
        var pythonFile = path.resolve('src/Interface.py');
        let pythonOutput = await RunCommand(`python "${pythonFile}" UPLOAD_SAVE "${saveFileName}"`);
        let data = JSON.parse(pythonOutput).data;
        let gameId = data["gameId"];
        let boxCount = data["boxCount"];
        let boxes = data["boxes"];
        let titles = data["titles"];
        let randomizer = data["randomizer"]

        if (gameId == "" || boxCount == 0 || boxes.length == 0 || titles.length == 0) //Bad save file
            result = res.status(StatusCode.ClientErrorBadRequest).json("ERROR: The uploaded save file is corrupt or not supported.");
        else
            result = res.status(StatusCode.SuccessOK).json({gameId: gameId, boxCount: boxCount, boxes: boxes, titles: titles, randomizer: randomizer,
                                                            saveFileData: saveFileData, fileIdNumber: fileIdNumber});
    }
    catch (err)
    {
        console.log("An error occurred processing the save file.");
        console.log(err);
        result = res.status(StatusCode.ServerErrorInternal).json(err);
    }

    //Delete the temp file
    if (fs.existsSync(saveFileName))
    {
        fs.unlinkSync(saveFileName);
        console.log(`Temp save file ${saveFileName} deleted from server.`);
    }

    return result;
});

/*
    Endpoint: /uploadHomeData
    returns as the response: the boxes and titles
*/
app.post('/uploadHomeData', async (req, res) =>
{
    //Finish the upload of the home data file
    upload(req, res, function (err)
    {
        if (err instanceof multer.MulterError)
            return res.status(StatusCode.ServerErrorInternal).json(err);
        else if (err)
            return res.status(StatusCode.ServerErrorInternal).json(err);
    })

    //Decrypt the data
    try
    {
        var homeData = req.files.file.data.toString()
        var bytes = CryptoJS.AES.decrypt(homeData, gSecretKey);
        var data = JSON.parse(JSON.parse(bytes.toString(CryptoJS.enc.Utf8))); //Decrypted
        console.log("The home file has been successfully decrypted.");
        data = await TryUpdateOldHomeData(data, res)
        if (data != null)
            return res.status(StatusCode.SuccessOK).json({boxes: data["boxes"], titles: data["titles"],
                                                          randomizer: data["randomizer"] ? true : false});
    }
    catch (err)
    {
        console.log("An error occurred processing the home data file.");
        console.log(err);
        return res.status(StatusCode.ClientErrorBadRequest).json(err);
    }
});

app.post("/uploadLastHomeData", async (req, res) =>
{
    //Finish the upload of the home data file
    var homeData = req.body.homeDataP1 + req.body.homeDataP2 + req.body.homeDataP3 + req.body.homeDataP4; //Split into 4 parts so it can will be sent over guaranteed

    //Decrypt the data
    try
    {
        var bytes = CryptoJS.AES.decrypt(homeData, gSecretKey);
        var data = JSON.parse(JSON.parse(bytes.toString(CryptoJS.enc.Utf8))); //Decrypted
        console.log("The home file has been successfully decrypted.");
        data = await TryUpdateOldHomeData(data, res)
        if (data != null)
            return res.status(StatusCode.SuccessOK).json({boxes: data["boxes"], titles: data["titles"],
                                                          randomizer: data["randomizer"] ? true : false});
    }
    catch (err)
    {
        console.log("An error occurred processing the last saved home data file.");
        console.log(err);
        return res.status(StatusCode.ClientErrorBadRequest).json(err);
    }
});

app.post('/encryptHomeData', (req, res) =>
{
    console.log("Encrypting home data...");
    var homeData = req.body.homeDataP1 + req.body.homeDataP2 + req.body.homeDataP3 + req.body.homeDataP4; //Split into 4 parts so it can will be sent over guaranteed

    //Get the data for the encrypted home data
    homeData = CryptoJS.AES.encrypt(JSON.stringify(homeData), gSecretKey).toString();

    result = res.status(StatusCode.SuccessOK).json({newHomeData: homeData});
});

/*
    Endpoint: /getUpdatedSaveFile
    returns as the response: the path to the updated save file
*/
app.post('/getUpdatedSaveFile', async (req, res) =>
{
    var result;
    var saveFileData = JSON.parse(req.body.saveFileData);
    var newBoxes = req.body.newBoxes;
    var fileIdNumber = req.body.fileIdNumber;
    var saveFileName = `temp/savefile_${fileIdNumber}.sav`;
    var newBoxesName = `temp/newBoxes_${fileIdNumber}.json`;
    var newSavePath = null;

    //Check if the save file data came back intact
    if (saveFileData.length == 0)
    {
        var error = "Save file data was empty.";
        console.log(error);
        return res.status(StatusCode.ClientErrorBadRequest).json(error);
    }

    //Save the original save file back to the server
    MakeTempFolder();
    fs.writeFileSync(saveFileName, Buffer.from(saveFileData));
    console.log(`Temp save file saved to server as ${saveFileName}.`);

    //Save the updated boxes to the server
    MakeTempFolder();
    fs.writeFileSync(newBoxesName, newBoxes);
    console.log("New boxes saved to server.");

    //Create the updated save file
    try
    {
        //Update the save file
        var pythonFile = path.resolve('src/Interface.py');
        var pythonOutput = await RunCommand(`python "${pythonFile}" UPDATE_SAVE ${newBoxesName} ${saveFileName}`);
        newSavePath = JSON.parse(pythonOutput).data;

        if (newSavePath === "")
        {
            console.log("An error occurred in Python while trying to create an updated save file.");
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
        console.log("An error occurred trying to create an updated save file.");
        console.log(err);
        result = res.status(StatusCode.ServerErrorInternal).json(err);
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

    return result;
});

async function TryUpdateOldHomeData(homeData, res)
{
    if (!("version" in homeData) || homeData["version"] < 2)
    {
        //Write the cloud file to a temp file

        do //Get a temp name that's not already in use
        {
            fileIdNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            homeFileName = `temp/homedata_${fileIdNumber}.json`;
        } while(fs.existsSync(homeFileName));

        MakeTempFolder();
        fs.writeFileSync(homeFileName, JSON.stringify(homeData));
        console.log(`Temp home file saved to server as ${homeFileName}.`);

        //Run the Python script
        var result;
        try
        {
            var pythonFile = path.resolve('src/Interface.py');
            let pythonOutput = await RunCommand(`python "${pythonFile}" CONVERT_OLD_CLOUD_FILE "${homeFileName}"`);
            let data = JSON.parse(pythonOutput).data;

            if (!data["completed"]) //Bad home file
            {
                console.log("An error occurred converting the home file.");
                console.log(data["errorMsg"]);
                result = res.status(StatusCode.ClientErrorBadRequest).json(`ERROR: The uploaded home file could not be converted:\n${data["errorMsg"]}`);
                homeData = null;
            }
            else
            {
                homeData = fs.readFileSync(homeFileName);
                homeData = JSON.parse(homeData);
            }
        }
        catch (err)
        {
            console.log("An error occurred converting the home file.");
            console.log(err);
            res.status(StatusCode.ServerErrorInternal).json(err);
            homeData = null;
        }

        //Delete the temp file
        if (fs.existsSync(homeFileName))
        {
            fs.unlinkSync(homeFileName);
            console.log(`Temp home file ${homeFileName} deleted from server.`);
        }
    }

    return homeData;
}
