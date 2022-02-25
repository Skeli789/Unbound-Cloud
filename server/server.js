const express = require('express');
const app = express();
var http = require('http').Server(app);
var multer = require('multer');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const {exec} = require('child_process');
const path = require('path');
const fs = require('fs');
const CryptoJS = require("crypto-js");
const {StatusCode} = require('status-code-enum');

const gSecretKey = "TODO: Set a secret key for encryption in an env file.";
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(fileUpload());
app.use(express.static('./images'));

var io = require('socket.io')(http, 
    {cors: {origin: PORT, methods: ["GET", "POST"], credentials: true}});

const gClients = {};

// When a connection is made, loop forever sending randomly generated social 
// media post content...
io.on('connection', async function(socket)
{
    var id = 0;
    var clientId = socket.id;
    console.log(`Client ${clientId} connected`);

    socket.on("message", (data) =>
    {
        var pokemonToSend = data;
        var keys = Object.keys(gClients).filter((x) => x != clientId && gClients[x].tradedWith === 0);

        if (keys.length !== 0)
        {
            var pokemonToReceive = gClients[keys[0]].pokemon;
            gClients[keys[0]] =  {pokemon: pokemonToSend, tradedWith: clientId}; //Immediately lock the data
            gClients[clientId] = {pokemon: pokemonToReceive, tradedWith: keys[0]}; //Set this client as traded
        }
        else
        {
            if (!(clientId in gClients)) //Don't overwrite previously requested mon
                gClients[clientId] = {pokemon: pokemonToSend, tradedWith: 0};
        }
    });

    socket.on('disconnect', () =>
    {
        delete gClients[clientId]; //Remove data so no one trades with it
        console.log(`Client ${clientId} disconnected`);
    });

    while (true)
    {
        if (clientId in gClients && gClients[clientId].tradedWith !== 0)
        {
            socket.send(gClients[clientId].pokemon);
            console.log(`Client ${clientId} received Pokemon from ${gClients[clientId].tradedWith}`);
            //Data deleted when client disconnects in case they don't receive this transmission
        }

        var nextLoopTime = 1000; //1 Second
        await new Promise(r => setTimeout(r, nextLoopTime)).catch( error => console.error("error")); //Wait until checking again
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
        let boxes = data["boxes"];
        let titles = data["titles"];

        if (boxes.length == 0 || titles.length == 0) //Bad save file
            result = res.status(StatusCode.ClientErrorBadRequest).json("ERROR: The uploaded save file is not acceptable.");
        else
            result = res.status(StatusCode.SuccessOK).json({boxes: boxes, titles: titles, saveFileData: saveFileData, fileIdNumber: fileIdNumber});
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
        var bytes = CryptoJS.AES.decrypt(req.files.file.data.toString(), gSecretKey);
        var data = JSON.parse(JSON.parse(bytes.toString(CryptoJS.enc.Utf8))); //Decrypted
        console.log("The home file has been successfully decrypted.");
        return res.status(StatusCode.SuccessOK).json({boxes: data["boxes"], titles: data["titles"]});
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
        return res.status(StatusCode.SuccessOK).json({boxes: data["boxes"], titles: data["titles"]});
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
        let pythonOutput = await RunCommand(`python "${pythonFile}" UPDATE_SAVE ${newBoxesName} ${saveFileName}`);
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
        console.log(`Temp save file ${newBoxesName} deleted from server.`);
    }

    if (newSavePath != null && fs.existsSync(newSavePath))
    {
        fs.unlinkSync(newSavePath);
        console.log(`Temp save file ${newSavePath} deleted from server.`);
    }

    return result;
});
