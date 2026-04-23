import React from 'react';
import {createRoot} from 'react-dom/client';
import {isMobile} from "react-device-detect";
import App from './App';
import * as serviceWorker from './serviceWorker';
import './stylesheets/Index.css';

//Get the root element from the DOM
const container = document.getElementById('root');

//Create a root
const root = createRoot(container);

//Initial render
root.render(<App />);

const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css"; //For search dropdown
document.head.appendChild(styleLink);

if (!isMobile)
    document.body.style.overflow = "hidden";

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
