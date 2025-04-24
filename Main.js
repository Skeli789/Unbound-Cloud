/**
 * A file to run the site using Electron.
 * It requires `yarn build` to be run first to create the production build.
 */

import {app, BrowserWindow, ipcMain, Notification, session} from "electron";
import path from "path"; //Module for file paths

const IS_PROD = app.isPackaged;
const SERVER = "https://unboundcloud.net"; //Where the server is hosted

/**
 * Creates the main window of the application.
 */
function CreateWindow()
{
    //Determine the working directory
    let currDir;
    if (IS_PROD)
        currDir = process.resourcesPath; //Use the packaged resources path
    else
        currDir = path.resolve(); //Get the current directory

    //Create the main window
    const window = new BrowserWindow
    ({
        width: 1200, //Wide enough so the boxes are side by side
        height: 825, //Tall enough so a selected summary doesn't require scrolling
        webPreferences:
        {
            nodeIntegration: false, //No node server in compiled app
            contextIsolation: true, //Run preload script in a separate context
            devTools: !IS_PROD, //Disable dev tools for production
            preload: path.join(currDir, "Preload.js"),
        },
    });

    //Load the React production build
    let indexPath = path.join(currDir, "build", "index.html"); //Path to the index.html file
    window.loadFile(indexPath); //Load the file into the window
}

/**
 * Modifies the request origin to match the server.
 * This is required for CORS to work properly.
 */
function ModifyRequestOrigin()
{
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) =>
    {
        if (IS_PROD)
            details.requestHeaders["Origin"] = SERVER; //Pretend the request came from the actual site
        callback({requestHeaders: details.requestHeaders});
    });
}

//Once app is running, create the window
app.whenReady().then(() =>
{
    app.setAppUserModelId('Unbound Cloud'); //Set the app user model ID for Windows notifications
    ModifyRequestOrigin(); //Modify the request origin to match the server
    CreateWindow(); //Create the main window
});

//Callback for when all windows are closed
app.on("window-all-closed", () =>
{
    //On Windows it’s common to quit the app when all windows are closed.
    if (process.platform !== "darwin")
        app.quit();
});

//Callback for when the app is activated (macOS)
app.on("activate", () =>
{
    //On macOS it is common to re-create a window when the dock icon is clicked.
    if (BrowserWindow.getAllWindows().length === 0)
        CreateWindow();
});

//Callback when trying to close the window
ipcMain.on("close", (event) =>
{
    const window = BrowserWindow.fromWebContents(event.sender);
    window.destroy();
});

//Callback when trying to show an OS notification
ipcMain.on("notify", (event, {title, body}) =>
{
    const notification = new Notification
    ({
        title: title,
        body: body,
    });

    notification.show();
});
