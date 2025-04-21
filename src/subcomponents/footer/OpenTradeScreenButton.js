/**
 * This file defines the OpenTradeScreenButton component.
 * It is used to open or close a screen for trading Pokemon.
 */

import React, {Component} from 'react';
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {MdSwapVert} from "react-icons/md"

const GTS_ICON = <svg width="56px" height="56px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M254.777 93.275c-58.482 0-105.695 47.21-105.695 105.696 0 58.487 47.213 105.698 105.695 105.698 58.482 0 105.696-47.21 105.696-105.697 0-58.48-47.214-105.695-105.696-105.695zm-140.714 63.59C-40.9 155.67-21.26 276.118 227.043 357.748c225.954 74.28 319.04 10.624 239.48-69.973-.413-.55-.84-1.097-1.277-1.64-4.755 3.954-9.71 7.915-14.95 11.88 4.487 5.513 7.138 11.084 7.704 16.01.713 6.2-.9 11.8-6.986 17.977-5.84 5.927-16.25 11.98-32.307 16.49-24.074 5.698-58.427 5.6-102.287-2.656l.105-.04c-2.153-.38-4.3-.787-6.445-1.198-21.875-4.418-46.004-10.805-72.318-19.455-69.962-23-118.054-49.706-146.063-74.936.246-.19.48-.38.728-.568-.27.166-.532.333-.8.5-53.315-48.08-33.682-90.78 46.558-92.2-8.46-.665-16.502-1.016-24.124-1.075zm281.425 0c-7.62.06-15.663.41-24.123 1.076 80.24 1.42 99.86 44.115 46.537 92.193-.264-.165-.513-.33-.78-.494.244.184.472.368.712.553-26.017 23.434-69.357 48.144-131.455 69.973 21.19 5.413 42.82 9.363 64.815 11.64 34.83-15.125 63.025-30.916 84.91-46.554.01.007.02.014.032.02.522-.386 1.03-.773 1.547-1.16 90.502-65.565 69.686-128.11-42.196-127.247zM44.54 286.27c-74.364 73.55-5.467 133.668 176.683 89.125-22.844-7.563-44.89-15.83-65.84-24.194-25.396 2.316-46.41 1.29-62.842-2.346-16.802-4.544-27.613-10.765-33.61-16.852-6.086-6.176-7.697-11.776-6.985-17.977.56-4.88 3.17-10.395 7.582-15.86-5.253-3.968-10.22-7.935-14.986-11.894z"/></svg>;
const PopUp = withReactContent(Swal);


export class OpenTradeScreenButton extends Component
{
    /**
     * Represents the OpenTradeScreenButton component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     * @param {boolean} props.onScreenAlready - Indicates whether the user is currently on the trade screen.
     * @param {string} props.idPrefix - The prefix for the button's ID and class.
     * @param {string} props.tooltipText - The text to display in the tooltip.
     * @param {string} props.ariaLabel - The aria-label for the button.
     * @param {Function} props.tryResetTradeState - Function to reset the trade state in the global state.
     * @param {Function} props.wasAnyChangeMade - Function to check if there are any unsaved changes.
     * @param {Function} props.trySaveAndExit - Function to save any unsaved changes.
     * @param {Function} props.openTradeScreen - Function to open the trade screen.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            onScreenAlready: props.onScreenAlready || false,
            idPrefix: props.idPrefix || "",
            tooltipText: props.tooltipText || "Trade",
            ariaLabel: props.ariaLabel || "Start Trade",
        }

        this.tryResetTradeState = props.tryResetTradeState;
        this.wasAnyChangeMade = props.wasAnyChangeMade;
        this.trySaveAndExit = props.trySaveAndExit;
        this.openTradeScreen = props.openTradeScreen;
    }

    /**
     * Either opens or closes the trade screen.
     * @returns {Promise} A promise that resolves when the function is done executing.
     */
    async tryOpenTradeScreen()
    {
        if (this.state.onScreenAlready)
        {
            this.tryResetTradeState();
            return; //Just return to the box view
        }
        else if (this.wasAnyChangeMade()) //Some boxes aren't saved
        {
            //Force a save
            let result = await PopUp.fire
            ({
                icon: "warning",
                title: "Unsaved Changes",
                text: "Your data must be saved before starting a trade.",
                confirmButtonText: "OK, Save It",
                showCancelButton: true,
                scrollbarPadding: false,
            });

            if (!result.isConfirmed)
                return; //User cancelled

            let saved = await this.trySaveAndExit(false);
            if (!saved)
                return; //Save didn't succeed
        }

        this.openTradeScreen(); //Open the trade screen
    }

    /**
     * Renders the OpenTradeScreenButton component.
     * @returns {JSX.Element} The rendered OpenTradeScreenButton component.
     */
    render()
    {
        const size = 42;
        const iconClass = `${this.state.idPrefix}-trade-button`;
        const icon = (this.state.idPrefix !== "friend") ? GTS_ICON : <MdSwapVert size={size} />;
        const tooltip = props => (<Tooltip {...props}>{this.state.tooltipText}</Tooltip>);

        return (
            <Button size="lg" id={`${this.state.idPrefix}-trade-button`}
                    className="footer-button"
                    aria-label={this.state.ariaLabel}
                    onClick={this.tryOpenTradeScreen.bind(this)}>
                <OverlayTrigger placement="top" overlay={tooltip}>
                    <div className={`footer-button-icon ${iconClass}`}>
                        {icon}
                    </div>
                </OverlayTrigger>
            </Button>
        );
    }
}

export default OpenTradeScreenButton;
