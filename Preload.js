/**
 * Preload script for Electron application.
 */

const {contextBridge, ipcRenderer} = require("electron"); //Must be require and not import, as this is a node module

//API to expose to the renderer process
contextBridge.exposeInMainWorld("electronAPI",
{
    //Close the window
    sendClose: () => ipcRenderer.send("close"),

    //Send and OS notification
    sendNotify: (message) => ipcRenderer.send("notify", message),
});
