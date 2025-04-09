/**
 * The main page of the application.
 */

import React, {useEffect} from "react";

//This CSS must go above the module imports!
import "bootstrap/dist/css/bootstrap.min.css";

import MainPage from "./MainPage";

//This CSS must go below the module imports!
import "./stylesheets/App.css";

function App()
{
    //Automatically zoom out on page load if viewport width is less than 428 px
    useEffect(() =>
    {
        if (window.innerWidth < 428)
        {
            // Calculate the new zoom ratio based on the window width
            let zoom = Math.min(window.innerWidth / 428, 1);
            document.body.style.zoom = zoom.toString();
            console.log("Zooming out to " + Math.round(zoom * 100) + "%");
        }
    }, []);

    return (
        <div className="app">
            <MainPage />
        </div>
    );
}

export default App;
