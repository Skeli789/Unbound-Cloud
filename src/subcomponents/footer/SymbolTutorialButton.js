/**
 * This file defines the SymbolTutorialButton component.
 * It is used to view the explanation of the different symbols.
 */

import React, {Component} from 'react';
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";

import {ShowSymbolTutorial} from "../SymbolTutorial";

import {MdHelp} from 'react-icons/md';


export class SymbolTutorialButton extends Component
{
    /**
     * Represents the SymbolTutorialButton component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     * @param {boolean} props.onSecondLine - Whether the button appears on the second row of footer buttons.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            onSecondLine: props.onSecondLine || false,
        }
    }

    /**
     * Renders the SymbolTutorialButton component.
     * @returns {JSX.Element} The rendered SymbolTutorialButton component.
     */
    render()
    {
        const size = 42;
        const iconClass = "help-button";
        const tooltip = props => (<Tooltip {...props}>Help</Tooltip>);

        return (
            <Button size="lg" id="help-button"
                    className="footer-button"
                    aria-label="Get Help"
                    onClick={ShowSymbolTutorial}>
                <OverlayTrigger placement="top" overlay={tooltip}>
                    <div className={`footer-button-icon ${iconClass}`}>
                        <MdHelp size={size} />
                    </div>
                </OverlayTrigger>
            </Button>
        );
    }
}

export default SymbolTutorialButton;
