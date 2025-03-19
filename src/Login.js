
import React, {Component} from 'react';
import {Button, Form} from "react-bootstrap";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {STATE_SIGN_UP, STATE_FORGOT_PASSWORD, STATE_CHOOSE_SAVE_HANDLE, STATE_UPLOAD_SAVE_FILE,
        STATE_ENTER_ACTIVATION_CODE, CanUseFileHandleAPI} from "./MainPage";
import {NO_SERVER_CONNECTION_ERROR, ErrorPopUp, ProcessTextInput, RequiredTooltip, SendFormToServer,
        ValidateEmail, ValidatePassword, ValidateUsername} from "./FormUtil";

import {AiOutlineCheckCircle} from "react-icons/ai";

import "./stylesheets/Form.css";

const ERROR_MESSAGES =
{
    "": "",
    INVALID_USER: "No account for that username or email was found!",
    INVALID_PASSWORD: "Incorrect password!",
    NO_ACCOUNT_FOUND: "No account for that username or email was found!",
    NULL_ACCOUNT: "The details were wiped before reaching the server!",
    BLANK_INPUT: "Missing required (*) field!",
    UNKNOWN_ERROR: "An unknown server error occurred! Please try again later.",
    NO_SERVER_CONNECTION: NO_SERVER_CONNECTION_ERROR,
};
const PopUp = withReactContent(Swal);


export class Login extends Component
{
   /**
    * Sets up the login page.
    */
    constructor(props)
    {
        super(props);

        this.state =
        {
            usernameInput: "",
            passwordInput: "",
            rememberUser: true,
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
     * Ensures all necessary fields in the form are filled.
     * @returns {Boolean} true if all required fields are filled, false otherwise.
     */
    allRequiredFieldsFilled()
    {
        return this.state.usernameInput !== ""
            && this.state.passwordInput !== "";
    }

    /**
     * Checks if the username entered in the form is a valid username.
     * @returns {Boolean} true if the entered username is valid, false if it's not.
     */
    validUsername()
    {
        return ValidateUsername(this.state.usernameInput)
            || ValidateEmail(this.state.usernameInput);
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
     * Gets the error message (if present) at the time of form submission.
     * @returns {String} The error message symbol.
     */
    getErrorMessage()
    {
        var errorMsg = "";

        if (!this.allRequiredFieldsFilled())
            errorMsg = "BLANK_INPUT";
        else if (!this.validUsername())
            errorMsg = "INVALID_USER";
        else if (!this.validPassword())
            errorMsg = "INVALID_PASSWORD";

        return errorMsg;
    }

    /**
     * Submits the login.
     * @param {Object} e - The default event for submitting a form.
     */
    async submitLogin(e)
    {
        e.preventDefault(); //Prevent page reload
        var errorMsg = this.getErrorMessage();

        if (errorMsg === "") //No error
        {
            const requestData =
            {
                username: this.state.usernameInput,
                password: this.state.passwordInput,
            };

            await SendFormToServer(requestData, this, this.mainPage, "/checkUser", this.completedLoginPopUp.bind(this));
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
    completedLoginPopUp(mainPageObj, response)
    {
        var newEditState = CanUseFileHandleAPI() ? STATE_CHOOSE_SAVE_HANDLE : STATE_UPLOAD_SAVE_FILE;
        var accountNotActivated = "activated" in response.data && !response.data.activated;
        if (accountNotActivated)
            newEditState = STATE_ENTER_ACTIVATION_CODE;

        PopUp.fire({showConfirmButton: false});
        PopUp.close(); //Close submitting pop-up
        mainPageObj.setState
        ({
            editState: newEditState,
            username: response.data.username,
            accountCode: response.data.accountCode, //Used later when requesting the Cloud Boxes from the server
        });

        //Set cookies so the user stays logged in
        if (this.state.rememberUser)
        {
            localStorage.username = response.data.username;
            localStorage.accountCode = response.data.accountCode;
            localStorage.activated = !accountNotActivated;
        }
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
    * Prints the login page. 
    */
    render()
    {
        var required = RequiredTooltip();

        return (
            <div className="form-page">
                <h1 className="form-title">Login to Unbound Cloud</h1>
                {/*Redirect to Sign-Up Page Button*/}
                <div className="already-have-account-button"
                     onClick={() => this.getMainPage().setState({editState: STATE_SIGN_UP})}>
                    I don't have an account
                </div>
    
                <Form onSubmit={(e) => this.submitLogin(e)}>
                    {/*Username or Email Input*/}
                    <Form.Group className="mb-3" controlId="formBasicUsername">
                        <Form.Label>Username or Email{required}</Form.Label>
                        <Form.Control
                            required
                            name="username"
                            autoComplete='username'
                            value={this.state.usernameInput}
                            onChange={(e) => this.setState({usernameInput: ProcessTextInput(e, "EMAIL", true)})} //Use EMAIL because it has a longer max length
                        />
                    </Form.Group>

                    {/*Password Input*/}
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Password{required}</Form.Label>
                        <Form.Control
                            required
                            type="password"
                            name="password"
                            autoComplete='password'
                            value={this.state.passwordInput}
                            onChange={(e) => this.setState({passwordInput: ProcessTextInput(e, "PASSWORD", true)})}
                        />
                        <div className="already-have-account-button forgot-password-button"
                            onClick={() => this.getMainPage().setState({editState: STATE_FORGOT_PASSWORD})}>
                            I forgot my password
                        </div>
                    </Form.Group>

                    {/* Remember User Input Input */}
                    <Form.Group>
                        <Form.Check
                            inline
                            type="checkbox"
                            label="Keep Me Logged In"
                            size="lg"
                            id="keep-me-logged-in-checkmark"
                            onChange={e => this.setState({rememberUser: e.target.checked})}
                            checked={this.state.rememberUser}
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
        )
    }
}
