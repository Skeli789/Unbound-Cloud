/**
 * The main page of the application.
 */

import React from "react";

//This CSS must go above the module imports!
import "bootstrap/dist/css/bootstrap.min.css";

import MainPage from "./MainPage";

//This CSS must go below the module imports!
import "./stylesheets/App.css";

function App()
{
    return (
        <div className="app">
            <MainPage />
        </div>
    );
}

export default App;
