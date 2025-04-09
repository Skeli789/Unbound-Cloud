/**
 * This file defines the UsernameField component.
 * It is used to input a username.
 */

import React, {Component} from 'react';
import {InputLabel, OutlinedInput, FormControl, FormHelperText} from '@mui/material';

import {ProcessTextInput} from '../FormUtil';

import "../stylesheets/Form.css";


export class UsernameField extends Component
{
    /**
     * Represents the UsernameField component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     * @param {string} props.username - The default username input value.
     * @param {string} props.fieldDesc - The description to show under the field.
     * @param {Function} props.setParentUsername - The function to set the parent component's username.
     * @param {Function} props.showError - The function to check if there is a problem with the field.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            usernameInput: props.username,
            fieldDesc: props.fieldDesc || "",
        }

        this.setParentUsername = props.setParentUsername;
        this.showError = props.showError;

        if (this.showError == null)
            this.showError = () => false; //No error by default
    }

    /**
     * Sets the username and also updates the parent component.
     * @param {Object} e - The event object to get the input from.
     */
    setUsername(e)
    {
        let username = ProcessTextInput(e, "USERNAME", true);
        this.setState({usernameInput: username});
        this.setParentUsername(username);
    }

    /**
     * Renders the UsernameField component.
     * @returns {JSX.Element} The rendered UsernameField component.
     */
    render()
    {
        const id = "username";
        const label = "Username";

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
                    value={this.state.usernameInput}
                    onChange={(e) => this.setUsername(e)}
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

export default UsernameField;
