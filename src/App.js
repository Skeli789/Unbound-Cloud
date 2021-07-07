/*
    The main page of the application.
*/
import React from "react";
import {Route, BrowserRouter as Router, Switch} from "react-router-dom";

//This CSS must go above the module imports!
import "bootstrap/dist/css/bootstrap.min.css";

import MainPage from "./MainPage";

//This CSS must go below the module imports!
import "./stylesheets/App.css";

function App() {
    var router = 
        <Router>
            {/* Set up the routing */}
            <Switch>
                <Route path="/" component={MainPage} exact />

                <Route path="/main" component={MainPage} exact />
            </Switch>
        </Router>

    return (
        <div className="app">
            {router}
        </div>
    );
}

export default App;
