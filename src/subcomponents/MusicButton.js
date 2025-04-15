/**
 * This file defines the MusicButton component.
 * It is used to either play or mute the music.
 */

import React, {Component} from 'react';
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";

import {MdMusicNote, MdMusicOff} from "react-icons/md"

import UnboundCloudTheme from '../audio/UnboundCloudTheme.mp3';

const mainTheme = new Audio(UnboundCloudTheme);


export class MusicButton extends Component
{
    /**
     * Represents the MusicButton component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            songMuted: IsSongMuted(),
        }
    }

    /**
     * Alternates between music muted and unmuted.
     */
    changeMusicMuteState()
    {
        this.setState({songMuted: !this.state.songMuted}, () =>
        {
            localStorage.songOff = this.state.songMuted; //Save cookie for PlayOrPauseMainMusicTheme and future visits to the site (not songMuted because of way cookie works)
            PlayOrPauseMainMusicTheme(); //Uses saved cookie
        });
    }

    /**
     * Renders the MusicButton component.
     * @returns {JSX.Element} The rendered MusicButton component.
     */
    render()
    {
        const size = 42;
        const iconClass = "music-button";
        const icon = (this.state.songMuted) ? <MdMusicOff size={size} /> : <MdMusicNote size={size} />;
        const tooltipText = (this.state.songMuted) ? "Music Is Off" : "Music Is On";
        const tooltip = props => (<Tooltip {...props}>{tooltipText}</Tooltip>);

        return (
            <Button size="lg" id="music-button"
                    className="footer-button"
                    aria-label={tooltipText}
                    onClick={this.changeMusicMuteState.bind(this)}>
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
 * Checks if the song is muted.
 * @returns {boolean} - Whether the saved cookie says the song is muted.
 */
function IsSongMuted()
{
    return ("songOff" in localStorage && localStorage.songOff === "true") ? true : false;
}

/**
 * Plays or pauses the main music theme that plays in the background.
 * It uses the saved cookie to determine whether to play or pause.
 */
export function PlayOrPauseMainMusicTheme()
{
    let muted = IsSongMuted();

    if (muted)
    {
        //Make sure it's not playing anymore
        mainTheme.pause();
    }
    else
    {
        //Make sure it's playing looped
        mainTheme.loop = true;
        mainTheme.play();
    }
}

/**
 * Stops the main music theme from playing but doesn't mute it.
 */
export function StopPlayingMusic()
{
    mainTheme.pause();
    mainTheme.currentTime = 0;
}

export default MusicButton;
