/**
 * This file defines the DarkModeButton component.
 * It is used to turn dark mode for the site on and off.
 */

import React, {Component} from 'react';
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";
import {enable as enableDarkMode, disable as disableDarkMode, isEnabled as isDarkReaderEnabled} from 'darkreader';

import {MdSunny, MdModeNight} from 'react-icons/md';


export class DarkModeButton extends Component
{
    /**
     * Represents the DarkModeButton component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     * @param {boolean} props.onSecondLine - Whether the button appears on the second row of footer buttons.
     * @param {boolean} props.invisible - Whether the button is hidden but still takes up space.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            darkMode: isDarkReaderEnabled(),
            onSecondLine: props.onSecondLine || false,
            invisible: props.invisible || false,
        }
    }

    /**
     * Toggles dark mode.
     */
    async toggleDarkMode()
    {
        let darkMode = this.state.darkMode;
        if (darkMode)
            disableDarkMode();
        else
            enableDarkMode();

        this.setState({darkMode: !darkMode});

        //Save in local storage
        localStorage.setItem("darkMode", !darkMode);
    }

    /**
     * Renders the DarkModeButton component.
     * @returns {JSX.Element} The rendered DarkModeButton component.
     */
    render()
    {
        const size = 42;
        const iconClass = "dark-mode-button";
        const hiddenStyle = {visibility: this.state.invisible ? "hidden" : "visible"}; //Hide but still take up space
        const tooltipText = (this.state.darkMode) ? "Light Mode" : "Dark Mode";
        const tooltip = props => (<Tooltip {...props}>{tooltipText}</Tooltip>);

        return (
            <Button size="lg"style={hiddenStyle}
                    id="dark-mode-button"
                    className="footer-button"
                    aria-label="Toggle Dark Mode"
                    onClick={this.toggleDarkMode.bind(this)}>
                <OverlayTrigger placement="top" overlay={tooltip}>
                    <div className={`footer-button-icon ${iconClass}`}>
                        {this.state.darkMode ? <MdSunny size={size} /> : <MdModeNight size={size} />}
                    </div>
                </OverlayTrigger>
            </Button>
        );
    }
}

export default DarkModeButton;
