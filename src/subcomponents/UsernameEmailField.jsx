/**
 * This file defines the UsernameEmailField component.
 * It is used to input a username or email address.
 */

import React, {Component} from 'react';
import {InputLabel, OutlinedInput, FormControl, FormHelperText} from '@mui/material';

import {ProcessTextInput} from '../FormUtil';

import "../stylesheets/Form.css";


export class UsernameEmailField extends Component
{
    /**
     * Represents the UsernameEmailField component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     * @param {string} props.input - The default username or email input value.
     * @param {string} props.fieldDesc - The description to show under the field.
     * @param {Function} props.setParentUsernameEmail - The function to set the parent component's username or email.
     * @param {Function} props.showError - The function to check if there is a problem with the field.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            input: props.input,
            fieldDesc: props.fieldDesc || "",
        }

        this.setParentUsernameEmail = props.setParentUsernameEmail;
        this.showError = props.showError;

        if (this.showError == null)
            this.showError = () => false; //No error by default
    }

    /**
     * Sets the username or email and also updates the parent component.
     * @param {Object} e - The event object to get the input from.
     */
    setUsernameEmail(e)
    {
        let usernameEmail = ProcessTextInput(e, "EMAIL", true); //Process with EMAIL because it can be longer
        this.setState({input: usernameEmail});
        this.setParentUsernameEmail(usernameEmail);
    }

    /**
     * Renders the UsernameEmailField component.
     * @returns {JSX.Element} The rendered UsernameEmailField component.
     */
    render()
    {
        const id = "username"; //Prefer if the input is a username
        const label = "Username or Email"

        return (
            <FormControl className="form-field" variant="outlined">
                {/* Title */}
                <InputLabel htmlFor={id} required>
                    {label}
                </InputLabel>

                {/* Input */}
                <OutlinedInput
                    required
                    label={label}
                    name={id}
                    autoComplete={id}
                    id={id}
                    data-testid={id + "Input"}
                    error={this.showError()}
                    value={this.state.input}
                    onChange={(e) => this.setUsernameEmail(e)}
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

export default UsernameEmailField;
