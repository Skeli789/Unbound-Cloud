import React from 'react';
import {isMobile} from "react-device-detect";
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './stylesheets/Index.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

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
