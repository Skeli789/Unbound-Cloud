/**
 * The main page of the application.
 */

import React, {useEffect, useState} from "react";
import {enable as enableDarkMode, disable as disableDarkMode,
        auto as followSystemColorScheme, setFetchMethod as darkModeSetFetchMethod} from "darkreader";

//This CSS must go above the module imports!
import "bootstrap/dist/css/bootstrap.min.css";

import MainPage from "./MainPage";

//This CSS must go below the module imports!
import "./stylesheets/App.css";

function App()
{
    let [loaded, setLoaded] = useState(false); //State to track if the app is loaded

    //Run when the component mounts
    useEffect(() =>
    {
        //Automatically zoom out on page load if viewport width is less than 428 px
        if (window.innerWidth < 428)
        {
            // Calculate the new zoom ratio based on the window width
            let zoom = Math.min(window.innerWidth / 428, 1);
            document.body.style.zoom = zoom.toString();
            console.log("Zooming out to " + Math.round(zoom * 100) + "%");
        }

        //Enable or disable dark mode if it was set explicitly
        darkModeSetFetchMethod(window.fetch);
        if (localStorage.getItem("darkMode") === "true")
            enableDarkMode();
        else if (localStorage.getItem("darkMode") === "false")
            disableDarkMode();
        else //Otherwise, follow the system color scheme
            followSystemColorScheme();
        
        //Ready to load the app
        setLoaded(true);
    }, []);

    return (
        <div className="app">
        {
            loaded &&
                <MainPage />
        }
        </div>
    );
}

export default App;
