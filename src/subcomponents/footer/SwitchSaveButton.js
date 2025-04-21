/**
 * This file defines the SwitchSaveButton component.
 * It is used to return to the home page and allow the user to select another save file.
 */

import React, {Component} from 'react';
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {MdLogout} from "react-icons/md"

const PopUp = withReactContent(Swal);


export class SwitchSaveButton extends Component
{
    /**
     * Represents the SwitchSaveButton component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     * @param {boolean} props.onSecondLine - Whether the button appears on the second row of footer buttons.
     * @param {boolean} props.invisible - Whether the button is hidden but still takes up space.
     * @param {Function} props.wasAnyChangeMade - The function to check if any changes were made that need saving.
     * @param {Function} props.trySaveAndExit - The function to save the changes.
     * @param {Function} props.leaveBoxView - The function to return to the choose save screen.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            onSecondLine: props.onSecondLine || false,
            invisible: props.invisible || false,
        }

        this.wasAnyChangeMade = props.wasAnyChangeMade;
        this.trySaveAndExit = props.trySaveAndExit;
        this.leaveBoxView = props.leaveBoxView;
    }

    /**
     * Returns to the choose save file screen.
     * @returns {Promise} A promise that resolves when the function is done executing.
     */
    async switchSaveFile()
    {
        //If a change was made, ask the user if they want to save it before switching
        if (this.wasAnyChangeMade())
        {
            let result = await PopUp.fire
            ({
                icon: 'warning',
                title: "Unsaved Changes",
                text: "Would you like to save your changes before leaving?",
                confirmButtonText: "OK, Save It",
                denyButtonText: "No, Don't Save",
                showCancelButton: true,
                showDenyButton: true,
                scrollbarPadding: false,
            });

            let saved = false;
            if (result.isConfirmed)
                saved = await this.trySaveAndExit(false);

            if (!saved && !result.isDenied)
                return;
        }
        //Else switch to the new file without prompting the user to save changes

        this.leaveBoxView();
    }

    /**
     * Renders the SwitchSaveButton component.
     * @returns {JSX.Element} The rendered SwitchSaveButton component.
     */
    render()
    {
        const size = 42;
        const iconClass = "switch-save-button";
        const hiddenStyle = {visibility: this.state.invisible ? "hidden" : "visible"}; //Hide but still take up space
        const tooltip = props => (<Tooltip {...props}>Change Save File</Tooltip>);

        return (
            <Button size="lg" style={hiddenStyle}
                    id="switch-save-button"
                    className="footer-button"
                    aria-label="Change Save File"
                    hidden={this.state.onSecondLine && this.state.invisible} //Hide entirely when in the second row
                    onClick={this.switchSaveFile.bind(this)}>
                <OverlayTrigger placement="top" overlay={tooltip}>
                    <div className={`footer-button-icon ${iconClass}`}>
                        <MdLogout size={size} />
                    </div>
                </OverlayTrigger>
            </Button>
        );
    }
}

export default SwitchSaveButton;
