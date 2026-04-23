/**
 * This file defines the PasswordField component.
 * It is used to input a password.
 */

import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {Visibility, VisibilityOff} from '@mui/icons-material';
import {InputAdornment, IconButton, InputLabel, OutlinedInput, Checkbox,
        FormControl, FormControlLabel} from '@mui/material';

import {ProcessTextInput} from '../FormUtil';

import "../stylesheets/Form.css";


export class PasswordField extends Component
{
    /**
     * Represents the PasswordField component.
     * @constructor
     * @param {Object} props - The props object containing the component's properties.
     * @param {string} props.password - The default password input value.
     * @param {string} props.fieldPrefix - The prefix for the field title.
     * @param {boolean} props.isConfirmPassword - Whether the field is for confirming the password.
     * @param {boolean} props.showForgotPasswordLink - Whether to show the forgot password link under the field.
     * @param {boolean} props.showRememberMe - Whether to show the 'Remember me' checkbox and prefill the password field..
     * @param {boolean} props.rememberMe - Whether the 'Remember me' checkbox is checked by default.
     * @param {Function} props.setParentPassword - The function to set the parent component's password.
     * @param {Function} props.showParentPassword - The function to show password based on the parent component's state.
     * @param {Function} props.toggleShowParentPassword - The function to toggle the parent component's show password state.
     * @param {Function} props.setParentRememberMe - The function to set the 'Remember me' state in the parent component.
     * @param {Function} props.forgotPasswordFunc - The function to handle the forgot password action.
     * @param {Function} props.showError - The function to check if there is a problem with the field.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            passwordInput: props.password,
            isConfirmPassword: props.isConfirmPassword || false,
            showForgotPasswordLink: props.showForgotPasswordLink || false,
            showRememberMe: props.showRememberMe || false,
            rememberMe: props.rememberMe || false,
            fieldPrefix: props.fieldPrefix || "",
            showPassword: false,
        }

        this.setParentPassword = props.setParentPassword;
        this.showParentPassword = props.showParentPassword;
        this.toggleShowParentPassword = props.toggleShowParentPassword;
        this.setParentRememberMe = props.setParentRememberMe;
        this.forgotPasswordFunc = props.forgotPasswordFunc;
        this.showError = props.showError;

        if (this.showError == null)
            this.showError = () => false; //No error by default
    }

    /**
     * Returns the value indicating whether the password should be shown or not.
     * If `showParentPassword` is defined, it calls the `showParentPassword` function to determine the value.
     * @returns {boolean} Whether the password should be shown or not.
     */
    showingPassword()
    {
        if (this.showParentPassword != null)
            return this.showParentPassword(); //Show password based on parent component's state.

        return this.state.showPassword;
    }

    /**
     * Toggles the visibility of the password field.
     * If a `toggleShowParentPassword` function is provided, the show password state in the parent component will be toggled instead.
     */
    toggleView()
    {
        if (this.toggleShowParentPassword != null)
            this.toggleShowParentPassword(); //Toggle show password for the parent component's state.

        this.setState({showPassword: !this.state.showPassword});
    }

    /**
     * Sets the password and also updates the parent component.
     * @param {Object} e - The event object to get the input from.
     */
    setPassword(e)
    {
        let password = ProcessTextInput(e, "PASSWORD", true);
        this.setState({passwordInput: password});
        this.setParentPassword(password);
    }

    /**
     * Handles the change event for the 'Remember me' checkbox.
     * @param {Object} e - The event object to get the input from.
     */
    setRememberMe(e)
    {
        let rememberMe = e.target.checked;
        this.setState({rememberMe});
        this.setParentRememberMe(rememberMe);
    }

    /**
     * Renders the password view toggle button.
     * @returns {JSX.Element} The password view toggle button.
     */
    printPasswordViewToggle()
    {
        return (
            <ViewPasswordToggle
                showPassword={this.showPassword.bind(this)}
                toggleView={this.toggleView.bind(this)}
            />
        );
    }

    /**
     * Renders the 'Remember me' checkbox.
     * @returns {JSX.Element} The 'Remember me' checkbox.
     */
    printRememberMeCheckbox()
    {
        if (!this.state.showRememberMe)
            return null;

        return (
            <div className="d-flex justify-content-center">
                <FormControlLabel
                    control={
                        <Checkbox
                            id="remember-me-button"
                            className="mt-1"
                            checked={this.state.rememberMe}
                            onChange={(e) => this.setRememberMe(e)}
                        />
                    }  
                    label={<b>Stay Signed In</b>}
                />
            </div>
        );
    }

    /**
     * Renders the forgot password button.
     * @returns {JSX.Element} The forgot password button.
     */
    printForgotPasswordButton()
    {
        if (!this.state.showForgotPasswordLink)
            return null;

        return (
            <div className="forgot-password-button" id="forgot-password-button"
                 onClick={this.forgotPasswordFunc.bind(this)} >
                Forgot Password?
            </div>
        );
    }

    /**
     * Renders the PasswordField component.
     * @returns {JSX.Element} The rendered PasswordField component.
     */
    render()
    {
        const id = (this.state.isConfirmPassword) ? "confirmPassword" : "password";
        const label = this.state.fieldPrefix + " Password";

        return (
        <>
            {/* Password Field */}
            <FormControl className="form-field" variant="outlined">
                {/* Title */}
                <InputLabel htmlFor={id} required>
                    {this.state.fieldPrefix} Password
                </InputLabel>

                {/* Input */}
                <OutlinedInput
                    required
                    label={label}
                    name={id}
                    id={id}
                    data-testid={id + "Input"}
                    autoComplete={this.state.showForgotPasswordLink ? "current-password" : "new-password"}
                    type={this.showingPassword() ? "text" : "password"}
                    error={this.showError()}
                    value={this.state.passwordInput}
                    onChange={(e) => this.setPassword(e)}
                    endAdornment={<ViewPasswordToggle showPassword={this.showingPassword()} toggleView={this.toggleView.bind(this)} />}
                />
            </FormControl>

            {/* Remember Me Checkbox and Forgot Password Link */}
            <div className="d-flex justify-content-between align-items-center no-select">
                {/* Remember Me Checkbox */}
                {this.printRememberMeCheckbox()}

                {/* Forget Password Link */}
                {this.printForgotPasswordButton()}
            </div>
        </>
        );
    }
}

/**
 * Renders a button to toggle the visibility of the password.
 * @param {Object} props - The component props.
 * @param {boolean} props.showPassword - Whether the password is shown.
 * @param {Function} props.toggleView - The function to toggle the password visibility.
 * @returns {JSX.Element} The rendered component.
 */
export function ViewPasswordToggle(props)
{
    let showingPassword = props.showPassword;
    const showPasswordTooltip = props => (<Tooltip {...props}>Show Password</Tooltip>);
    const hidePasswordTooltip = props => (<Tooltip {...props}>Hide Password</Tooltip>);
    const tooltip = (showingPassword) ? hidePasswordTooltip : showPasswordTooltip;

    return (
        <InputAdornment position="end">
            <OverlayTrigger placement="top" overlay={tooltip}>        
                <IconButton
                    id="show-password-button"
                    aria-label={
                        (showingPassword) ? 'hide password' : 'display password'
                    }
                    onClick={props.toggleView}
                    onMouseDown={(e) => e.preventDefault()} // Prevents focusing the input field
                    onMouseUp={(e) => e.preventDefault()} // Prevents focusing the input field
                    edge="end"
                >
                {(showingPassword) ? <VisibilityOff /> : <Visibility />}
                </IconButton>
            </OverlayTrigger>
        </InputAdornment>
    );
}

/**
 * Handles saving the username and account code in local storage based on the 'Remember me' checkbox.
 * @param {boolean} rememberMe - Whether the 'Remember me' checkbox is checked or not.
 * @param {string} username - The username to be saved.
 * @param {string} accountCode - The account code to be saved.
 * @param {boolean} activated - The activation status to be saved.
 */
export function HandleRememberMe(rememberMe, username, accountCode, activated)
{
    if (rememberMe)
    {
        localStorage.setItem('username', username);
        localStorage.setItem('accountCode', accountCode);
        localStorage.setItem('activated', activated);
    }
    else
    {
        localStorage.removeItem('username');
        localStorage.removeItem('accountCode');
        localStorage.removeItem('activated');
    }
}

export default PasswordField;
