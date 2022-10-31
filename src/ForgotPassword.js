
import React, {Component} from 'react';
import {Button, Form, OverlayTrigger, Tooltip} from "react-bootstrap";
import {isMobile} from 'react-device-detect';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {PasteCodeButton} from "./ActivateAccount";
import {STATE_LOGIN} from "./MainPage";
import {NO_SERVER_CONNECTION_ERROR, ErrorPopUp, ProcessTextInput, RequiredTooltip, SendFormToServer,
        ValidateEmail, ValidatePassword} from "./FormUtil";
import {ShowPasswordSymbol} from "./SignUp";

import {AiOutlineCheckCircle, AiOutlineMail} from "react-icons/ai";

import "./stylesheets/Form.css";

const FP_STATE_ENTER_EMAIL = 1;
const FP_STATE_ENTER_NEW_PASSWORD = 2;

const ERROR_MESSAGES =
{
    "": "",
    INVALID_EMAIL: "No account for that email was found!",
    INVALID_RESET_CODE: "Incorrect password reset code!\nCheck your email and try again.",
    INVALID_PASSWORD: "Password must be between 6 and 20 characters!",
    MISMATCHED_PASSWORDS: "Passwords don't match!",
    RESET_CODE_TOO_OLD: "The password reset code has expired!\nPlease reload the page and try again.",
    PASSWORD_RESET_COOLDOWN: "Please wait at least an hour before trying to reset your password again.",
    NULL_ACCOUNT: "The details were wiped before reaching the server!",
    BLANK_INPUT: "Missing required (*) field!",
    UNKNOWN_ERROR: "An unknown server error occurred! Please try again later.",
    NO_SERVER_CONNECTION: NO_SERVER_CONNECTION_ERROR,
};
const CODE_LENGTH = 6;
const SEND_CODE_COOLDOWN = 2 * 60 * 1000; //2 Minutes
const PopUp = withReactContent(Swal);


export class ForgotPassword extends Component
{
    /**
     * Sets up the forgot password page.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            forgotPasswordState: FP_STATE_ENTER_EMAIL,
            emailInput: "",
            codeInput: "",
            passwordInput: "",
            confirmPasswordInput: "",
            showPassword: false,
            showedErrorPopUp: false,
            errorMsg: "",
        }

        this.mainPage = props.mainPage;
    }

    /**
     * Gets the main page component.
     * @returns {Component} The main page component.
     */
    getMainPage()
    {
        return this.mainPage;
    }
 
    /**
     * Checks if both password fields in the form are filled.
     * @returns {Boolean} true if both password fields are filled, false if they're not.
     */
    bothPasswordsFilled()
    {
        return this.state.passwordInput !== ""
            && this.state.confirmPasswordInput !== "";
    }

    /**
     * Ensures all necessary fields in the form are filled.
     * @returns {Boolean} true if all required fields are filled, false otherwise.
     */
    allRequiredFieldsFilled()
    {
        return this.state.codeInput !== ""
            && this.state.emailInput !== ""
            && this.bothPasswordsFilled();
    }

    /**
     * Checks if the code entered in the form could be a valid activation code.
     * @returns {Boolean} true if the entered code is valid, false if it's not.
     */
    validCode()
    {
        return this.state.codeInput.length === CODE_LENGTH;
    }

    /**
     * Checks if the email entered in the form is a valid email.
     * @returns {Boolean} true if the entered email is valid, false if it's not.
     */
    validEmail()
    {
        return ValidateEmail(this.state.emailInput);
    }

    /**
     * Checks if the password entered in the form is a valid password.
     * @returns {Boolean} true if the entered password is valid, false if it's not.
     */
    validPassword()
    {
        return ValidatePassword(this.state.passwordInput);
    }
 
    /**
     * Checks if the two passwords entered into the form are identical.
     * @returns {Boolean} true if the entered passwords are identical, false if they're not.
     */
    passwordsMatch()
    {
        return this.state.passwordInput === this.state.confirmPasswordInput;
    }
 
    /**
     * Gets the error message (if present) at the time of submitting an email to receive a code.
     * @returns {String} The error message symbol.
     */
    getErrorMessageForSendingCode()
    {
        var errorMsg = "";
    
        if (!this.validEmail())
            errorMsg = "INVALID_EMAIL";
        else if ("lastTimeSentPasswordResetCode" in localStorage) //Prevent spamming code
        {
            var timeSince = Date.now() - localStorage.lastTimeSentPasswordResetCode;
            if (timeSince < SEND_CODE_COOLDOWN)
            {
                var timeRemaining = Math.ceil((SEND_CODE_COOLDOWN - timeSince) / 1000);
                errorMsg = `Please wait ${timeRemaining} seconds before sending another code.`;
            }
        }

        return errorMsg;
    }

    /**
     * Gets the error message (if present) at the time of the changing password form submission.
     * @returns {String} The error message symbol.
     */
    getErrorMessageForChangingPassword()
    {
        var errorMsg = "";

        if (!this.allRequiredFieldsFilled())
            errorMsg = "BLANK_INPUT";
        else if (!this.validEmail())
            errorMsg = "INVALID_EMAIL";
        else if (!this.validCode())
            errorMsg = "INVALID_RESET_CODE";
        else if (!this.validPassword())
            errorMsg = "INVALID_PASSWORD";
        else if (!this.passwordsMatch())
            errorMsg = "MISMATCHED_PASSWORDS";

        return errorMsg;
    }

    /**
     * Sends the user an email with a code that can be used to reset their password.
     * @param {Object} e - The default event for submitting a form.
     */
    async sendForgotPasswordCode(e)
    {
        e.preventDefault(); //Prevent page reload
        var errorMsg = this.getErrorMessageForSendingCode();

        if (errorMsg === "") //No error
        {
            const formData = new FormData();
            formData.append("email", this.state.emailInput);

            await SendFormToServer(formData, this, this.mainPage, "/sendPasswordResetCode", this.passwordResetCodeSentPopUp.bind(this));
        }
        else
        {
            this.setState({errorMsg: errorMsg});
            this.errorPopUp(errorMsg);
        }
    }

    /**
     * Displays a pop-up that a code was sent to the user's email and then advances the state.
     */
    passwordResetCodeSentPopUp(mainPageObj, response) //Args unused
    {
        localStorage.lastTimeSentPasswordResetCode = Date.now();
        PopUp.fire
        ({
            icon: "success",
            title: "Check your email for the code needed to reset your password!",
            confirmButtonText: "Continue",
            scrollbarPadding: false,
        }).then(() =>
        {
            this.setState({forgotPasswordState: FP_STATE_ENTER_NEW_PASSWORD});
        });
    }

    /**
     * Pastes the text on the clipboard into the submission field and automatically
     * submits it if it could be a valid code.
     */
    pasteCode()
    {
        navigator.clipboard.readText().then((text) =>
        {
            this.setState({codeInput: text});
        });
    }

    /**
     * Submits the reset password.
     * @param {Object} e - The default event for submitting a form.
     */
    async submitPasswordReset(e)
    {
        if (e != null)
            e.preventDefault(); //Prevent page reload

        var errorMsg = this.getErrorMessageForChangingPassword();

        if (errorMsg === "") //No error
        {
            const formData = new FormData();
            formData.append("email", this.state.emailInput);
            formData.append("resetCode", this.state.codeInput);
            formData.append("newPassword", this.state.passwordInput);

            await SendFormToServer(formData, this, this.mainPage, "/resetPassword", this.completedPasswordResetPopUp.bind(this));
        }
        else
        {
            this.setState({errorMsg: errorMsg});
            this.errorPopUp(errorMsg);
        }
    }
 
    /**
     * Processes the response from the server after logging in.
     * @param {Object} mainPageObj - The this object from MainPage.js.
     * @param {Objecy} response - The response object from the server.
     */
    completedPasswordResetPopUp(mainPageObj, response) //Second arg unused
    {
        PopUp.fire
        ({
            icon: "success",
            title: "Password reset successfully!",
            scrollbarPadding: false,
        }).then(() =>
        {
            mainPageObj.setState
            ({
                editState: STATE_LOGIN,
            });
        });
    }

    /**
     * Displays an error pop-up.
     * @param {String} errorSymbol - The error symbol for the message to be shown on the pop-up.
     */
    errorPopUp(errorSymbol)
    {
        var text = (errorSymbol in ERROR_MESSAGES) ?  ERROR_MESSAGES[errorSymbol] : errorSymbol;
        ErrorPopUp(text);
    }

    /**
     * Prints the page where the user can enter their email to receive a code that can be used to reset their password.
     * @returns {JSX} The enter email and send code page.
     */
    renderSendForgotPasswordCode()
    {
        const sendCodeTooltip = props => (<Tooltip {...props}>Send Code</Tooltip>);

        return (
            <div className="friend-trade-page"
                 style={!isMobile ? {paddingLeft: "var(--scrollbar-width)"} : {}}>
                <div className="friend-trade-code-input-page">
                    <Form onSubmit={(e) => this.sendForgotPasswordCode(e)}>
                        <Form.Label><h2>I forgot my password!</h2></Form.Label>

                        {/*Email Input*/}
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Control
                                required
                                name="email"
                                autoComplete="email"
                                placeholder="Email"
                                value={this.state.emailInput}
                                onChange={(e) => this.setState({emailInput: ProcessTextInput(e, "EMAIL", true)})}
                            />
                        </Form.Group>

                        <div className="friend-trade-code-input-button">
                            <OverlayTrigger placement="bottom" overlay={sendCodeTooltip}>
                                <Button size="lg" className="friend-trade-offer-button friend-trade-code-button"
                                        aria-label="Send Code"
                                        type="submit">
                                    <AiOutlineMail size={42}/>
                                </Button>
                            </OverlayTrigger>
                        </div>
                    </Form>
                </div>
            </div>
        );
    }

    /**
     * Prints the page where the user can submit a form to actually change their password.
     * @returns {JSX} The enter new password page.
     */
    renderChangePassword()
    {
        const required = RequiredTooltip();
        const showPasswordFunc = () => this.setState({showPassword: !this.state.showPassword});
        const pasteButtonSize = 24;

        return (
            <div className="form-page">
                <h1 className="form-title mb-3">I forgot my password!</h1>

                <Form onSubmit={(e) => this.submitPasswordReset(e)}>
                    {/*Email Input*/}
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Email{required}</Form.Label>
                        <Form.Control
                            required
                            disabled={true} //Should have been set earlier
                            name="email"
                            value={this.state.emailInput}
                        />
                    </Form.Group>

                    {/*Code Input*/}
                    <Form.Group className="mb-3" controlId="code">
                        <Form.Label>Code Sent to Your Email{required}</Form.Label>
                        <div className="friend-trade-code-input-container">
                            <Form.Control
                                required
                                name="one-time-code"
                                autoComplete="one-time-code"
                                value={this.state.codeInput}
                                onChange={(e) => this.setState({codeInput: e.target.value.substring(0, CODE_LENGTH)})}/>

                            {PasteCodeButton(pasteButtonSize, this.pasteCode.bind(this))}
                        </div>
                    </Form.Group>

                    {/*New Password Input*/}
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>New Password{required} {ShowPasswordSymbol(this.state.showPassword, showPasswordFunc)}</Form.Label>
                        <Form.Control
                            required
                            type={this.state.showPassword ? "text" : "password"}
                            name="password"
                            autoComplete='new-password'
                            //placeholder="Password"
                            value={this.state.passwordInput}
                            className={`form-control ${this.state.passwordInput !== "" && !this.validPassword() ? 'is-invalid' : ''}`}
                            onChange={(e) => this.setState({passwordInput: ProcessTextInput(e, "PASSWORD", false)})}
                        />
                    </Form.Group>

                    {/*Confirm Password Input*/}
                    <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
                        <Form.Label>Confirm Password{required}</Form.Label>
                        <Form.Control
                            required
                            type={this.state.showPassword ? "text" : "password"}
                            name="confirmPassword"
                            autoComplete='new-password'
                            //placeholder="Password"
                            className={`form-control ${this.bothPasswordsFilled() && !this.passwordsMatch() ? 'is-invalid' : ''}`}
                            value={this.state.confirmPasswordInput}
                            onChange={(e) => this.setState({confirmPasswordInput: ProcessTextInput(e, "PASSWORD", true)})}
                        />
                    </Form.Group>

                    {/* Submit Button */}
                    <div className="submit-form-button-container mt-2">
                        <Button size="lg" className="submit-form-button" type="submit">
                            <AiOutlineCheckCircle size={42}/>
                        </Button>
                    </div>
                </Form>
            </div>
        );
    }

   /**
    * Prints the forgot password page. 
    */
    render()
    {
        if (this.state.forgotPasswordState === FP_STATE_ENTER_EMAIL)
            return this.renderSendForgotPasswordCode();

        return this.renderChangePassword();
    }
}
