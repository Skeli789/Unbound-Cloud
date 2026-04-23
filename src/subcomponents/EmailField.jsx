/**
 * This file defines the EmailField component.
 * It is used to input an email address.
 */

import React, {Component} from 'react';
import {FormControl, FormHelperText, InputLabel, OutlinedInput} from '@mui/material';

import {ProcessTextInput} from '../FormUtil';

import "../stylesheets/Form.css";


export class EmailField extends Component
{
    /**
     * Represents the EmailField component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     * @param {string} props.email - The default email input value.
     * @param {string} props.fieldDesc - The description to show under the field.
     * @param {boolean} props.disabled - Whether the field is disabled or not.
     * @param {Function} props.setParentEmail - The function to set the parent component's email.
     * @param {Function} props.showError - The function to check if there is a problem with the field.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            emailInput: props.email,
            fieldDesc: props.fieldDesc || "",
            disabled: props.disabled || false,
        }

        this.setParentEmail = props.setParentEmail;
        this.showError = props.showError;

        if (this.showError == null)
            this.showError = () => false; //No error by default
    }

    /**
     * Sets the email and also updates the parent component.
     * @param {Object} e - The event object to get the input from.
     */
    setEmail(e)
    {
        let email = ProcessTextInput(e, "EMAIL", true);
        this.setState({emailInput: email});
        this.setParentEmail(email);
    }

    /**
     * Renders the EmailField component.
     * @returns {JSX.Element} The rendered EmailField component.
     */
    render()
    {
        const id = "email";
        const label = "Email Address";

        return (
            <FormControl className="form-field" variant="outlined">
                {/* Title */}
                <InputLabel htmlFor={id} required>
                    {label}
                </InputLabel>

                {/* Input */}
                <OutlinedInput
                    required
                    disabled={this.state.disabled}
                    label={label}
                    name={id}
                    autoComplete={id}
                    id={id}
                    data-testid={id + "Input"}
                    error={this.showError()}
                    value={this.state.emailInput}
                    onChange={(e) => this.setEmail(e)}
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

export default EmailField;
