/**
 * A class for a timer display that counts down.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {AreSoundsMuted} from "./subcomponents/SoundsButton";

import SfxCountdown from './audio/Countdown.mp3';
import SfxTimerDone from './audio/TimerDone.mp3';

import "./stylesheets/Timer.css";

const countdownSound = new Audio(SfxCountdown);
const timerDoneSound = new Audio(SfxTimerDone);


export class Timer extends Component
{
    /**
     * Sets up the data fields needed for the search menu.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            hourDisplay: "00",
            minuteDisplay: "00",
            secondDisplay: "00",
            seconds: props.parent.state.timerSeconds,
            timerStarted: false,
        };

        this.timer = null;
        this.countDown = this.countDown.bind(this);
        this.onCompletionFunc = props.onCompletionFunc;
        this.parent = props.parent;
    }

    /**
     * Starts the timer when it appears.
     */
    componentDidMount()
    {   
        if (this.timer == null && this.state.seconds > 0) //Haven't set timer yet and one can be set
        {
            let timeLeft = this.secondsToTime(this.state.seconds);

            this.setState
            ({
                hourDisplay: timeLeft.hours,
                minuteDisplay: timeLeft.minutes,
                secondDisplay: timeLeft.seconds,
                timerStarted: true,
            });

            this.timer = setInterval(this.countDown, 1000);
        }
    }

    /**
     * Stops the timer when its hidden.
     */
    componentWillUnmount()
    {
        if (this.timer != null)
            clearInterval(this.timer);
    }

    /**
     * Converts a number of seconds to the corresponding hours, minutes, and seconds.
     * @param {Number} convertSeconds - The number of seconds to convert.
     * @returns {Object} An object with the keys {hours, minutes, seconds}, with each value being a minimum two character string.
     */
    secondsToTime(convertSeconds)
    {
        //Calc hours left
        let hours = Math.floor(convertSeconds / (60 * 60));
    
        //Calc minutes left
        let divisorForMinutes = convertSeconds % (60 * 60);
        let minutes = Math.floor(divisorForMinutes / 60);
    
        //Calc seconds left
        let divisorForSeconds = divisorForMinutes % 60;
        let seconds = Math.ceil(divisorForSeconds);

        return (
        {
            hours: hours.toString().padStart(2, "0"),
            minutes: minutes.toString().padStart(2, "0"),
            seconds: seconds.toString().padStart(2, "0"),
        });
    }

    /**
     * Decrements the timer.
     */
    countDown()
    {
        //Remove one second, set state so a re-render happens
        let seconds = this.state.seconds - 1;
        let timeLeft = this.secondsToTime(seconds);

        this.setState
        ({
            seconds: seconds,
            hourDisplay: timeLeft.hours,
            minuteDisplay: timeLeft.minutes,
            secondDisplay: timeLeft.seconds,
        });
        this.parent.setState({timerSeconds: seconds});

        if (seconds <= 10 && seconds > 0)
        {
            if (!AreSoundsMuted())
                countdownSound.play();
        }

        //Check if timer's done
        if (seconds === 0)
        {
            clearInterval(this.timer);

            if (!AreSoundsMuted())
                timerDoneSound.play();

            if (this.onCompletionFunc != null)
                this.onCompletionFunc();
        }
    }

    /**
     * Prints the timer box.
     */
    render()
    {
        var colour = (this.state.seconds <= 10) ? "red" : "";

        if (!this.state.timerStarted)
            return "";

        return (
            <div className={"timer " + this.props.classNames} style={{color: colour}}>
                {/*this.state.hourDisplay}:*/}{this.state.minuteDisplay}:{this.state.secondDisplay}
            </div>
        );
    }
}

Timer.propTypes =
{
    classNames: PropTypes.string,
    seconds: PropTypes.number,
    onCompletionFunc: PropTypes.func,
};

Timer.defaultProps =
{
    classNames: "",
    seconds: 1,
    onCompletionFunc: null,
};
