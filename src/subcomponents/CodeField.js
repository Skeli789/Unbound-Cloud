/**
 * This file defines the CodeField component.
 * It is used to input a one-time code.
 */

import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, OutlinedInput} from '@mui/material';

import {ErrorPopUp, ProcessTextInput} from '../FormUtil';

import {ImPaste} from "react-icons/im";

import "../stylesheets/Form.css";


export class CodeField extends Component
{
    /**
     * Represents the CodeField component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     * @param {string} props.code - The default code input value.
     * @param {number} props.codeLength - The length of the code input.
     * @param {string} props.fieldPrefix - The prefix for the field name.
     * @param {string} props.fieldDesc - The description to show under the field.
     * @param {Function} props.setParentCode - The function to set the parent component's code.
     * @param {Function} props.postPasteFunc - The function to call after the paste button is clicked.
     * @param {Function} props.showError - The function to check if there is a problem with the field.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            codeInput: props.code,
            codeLength: props.codeLength || 1,
            fieldPrefix: props.fieldPrefix || "",
            fieldDesc: props.fieldDesc || "",
        }

        this.setParentCode = props.setParentCode;
        this.postPasteFunc = props.postPasteFunc;
        this.showError = props.showError;

        if (this.showError == null)
            this.showError = () => false; //No error by default
    }

    /**
     * Sets the code and also updates the parent component.
     * @param {Object} e - The event object to get the input from.
     * @param {Function} func - The function to call after updating the state.
     */
    setCodeAndRunFunc(e, func)
    {
        let code = ProcessTextInput(e, `CODE_${this.state.codeLength}`, true);
        this.setParentCode(code);
        this.setState({codeInput: code}, () =>
        {
            //Code entered is the same length as the specified code length
            if (code.length === this.state.codeLength && func != null)
                func(); //Run a function for user convenience
        });
    }

    /**
     * Pastes the code from the clipboard into the input field.
     */
    pasteCode()
    {
        navigator.clipboard.readText().then((text) =>
        {
            this.setCodeAndRunFunc({target: {value: text}}, this.postPasteFunc);
        }).catch((err) =>
        {
            console.log("Failed to read clipboard contents: ", err);
            ErrorPopUp("Failed to read clipboard contents! Please paste manually.");
        });
    }

    /**
     * Renders the CodeField component.
     * @returns {JSX.Element} The rendered CodeField component.
     */
    render()
    {
        const id = "one-time-code";
        const label = this.state.fieldPrefix + " Code";

        return (
            <FormControl className="form-field" variant="outlined">
                {/* Title */}
                <InputLabel htmlFor={id} required>
                    {label}
                </InputLabel>

                {/* Input */}
                <OutlinedInput
                    required
                    fullWidth
                    label={label}
                    name={id}
                    autoComplete={id}
                    id={id}
                    data-testid={"oneTimeCodeInput"}
                    error={this.showError()}
                    value={this.state.codeInput}
                    onChange={(e) => this.setCodeAndRunFunc(e, null)}
                    endAdornment={<PasteCodeButton pasteFunc={this.pasteCode.bind(this)}/>}
                />

                {/* Description */}
                {
                    this.state.fieldDesc &&
                        <FormHelperText>{this.state.fieldDesc}</FormHelperText>
                }
            </FormControl>
        );
    }
}

/**
 * Gets a button that can be clicked to paste a code.
 * @param {Object} props - The properties for the button.
 * @param {Function} props.pasteFunc - The function to call when the button is clicked.
 * @returns {JSX.Element} The paste button component.
 */
export function PasteCodeButton(props)
{
    const pasteButtonSize = 24;
    const pasteTooltip = props => (<Tooltip {...props}>Paste Code</Tooltip>);
    const pasteFunc = props.pasteFunc;

    return (
        //Stick it at the end of the input field
        <InputAdornment position="end">
            <OverlayTrigger placement="bottom" overlay={pasteTooltip}>
                <IconButton
                    id="paste-button"
                    aria-label="Paste Code"
                    onClick={pasteFunc}
                    onMouseDown={(e) => e.preventDefault()} // Prevents focusing the input field
                    onMouseUp={(e) => e.preventDefault()} // Prevents focusing the input field
                    edge="end"
                >
                    <ImPaste size={pasteButtonSize}/>
                </IconButton>
            </OverlayTrigger>
        </InputAdornment>
    );
}


export default CodeField;
