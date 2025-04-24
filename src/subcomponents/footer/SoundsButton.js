/**
 * This file defines the SoundsButton component.
 * It is used to either play or mute the sound effects.
 */

import React, {Component} from 'react';
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";

import {MdVolumeUp, MdVolumeOff} from "react-icons/md"


export class SoundsButton extends Component
{
    /**
     * Represents the SoundsButton component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            soundsMuted: AreSoundsMuted(),
        }
    }

    /**
     * Alternates between sound effects muted and unmuted.
     */
    changeSoundsMuteState()
    {
        this.setState({soundsMuted: !this.state.soundsMuted}, () =>
        {
            localStorage.muted = this.state.soundsMuted;
        });
    }

    /**
     * Renders the SoundsButton component.
     * @returns {JSX.Element} The rendered SoundsButton component.
     */
    render()
    {
        const size = 42;
        const iconClass = "sounds-button";
        const icon = (this.state.soundsMuted) ? <MdVolumeOff size={size} /> : <MdVolumeUp size={size} />;
        const tooltipText = (this.state.soundsMuted) ? "Sounds Are Off" : "Sounds Are On";
        const tooltip = props => (<Tooltip {...props}>{tooltipText}</Tooltip>);

        return (
            <Button size="lg" id="sounds-button"
                    className="footer-button"
                    aria-label={tooltipText}
                    onClick={this.changeSoundsMuteState.bind(this)}>
                <OverlayTrigger placement="top" overlay={tooltip}>
                    <div className={`footer-button-icon ${iconClass}`}>
                        {icon}
                    </div>
                </OverlayTrigger>
            </Button>
        );
    }
}

/**
 * Checks if the sound effects are muted.
 * @returns {boolean} - Whether the saved cookie says the sound effects are muted.
 */
export function AreSoundsMuted()
{
    return ("muted" in localStorage && localStorage.muted === "true") ? true : false;
}

export default SoundsButton;
