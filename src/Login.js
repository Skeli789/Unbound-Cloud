
import React, {Component} from 'react';
import {Button, Form} from "react-bootstrap";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {CanUseFileHandleAPI, UNBOUND_LINK, PURPLE_CLOUD,
        STATE_SIGN_UP, STATE_FORGOT_PASSWORD, STATE_CHOOSE_SAVE_HANDLE, STATE_UPLOAD_SAVE_FILE,
        STATE_ENTER_ACTIVATION_CODE} from "./MainPage";
import {GetDefaultPopUpOpts} from "./Notifications";
import {NO_SERVER_CONNECTION_ERROR, ErrorPopUp, SendFormToServer,
        ValidateEmail, ValidatePassword, ValidateUsername} from "./FormUtil";
import {PasswordField, HandleRememberMe} from "./subcomponents/PasswordField";
import {UsernameEmailField} from "./subcomponents/UsernameEmailField";

import {AiOutlineCheckCircle} from "react-icons/ai";

import "./stylesheets/Form.css";

const ERROR_MESSAGES =
{
    "": "",
    INVALID_USERNAME: "No account for that username or email was found!",
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
    * @constructor
    * @param {Object} props - The props object containing the component's properties.
    * @param {Object} props.mainPage - The main page component.
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
            errorMsg = "INVALID_USERNAME";
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

        PopUp.fire({showConfirmButton: false, ...GetDefaultPopUpOpts()});
        PopUp.close(); //Close submitting pop-up
        mainPageObj.setState
        ({
            editState: newEditState,
            username: response.data.username,
            accountCode: response.data.accountCode, //Used later when requesting the Cloud Boxes from the server
        });

        //Set cookies so the user stays logged in
        HandleRememberMe(this.state.rememberUser, response.data.username, response.data.accountCode, response.data.activated);
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
    * @returns {JSX.Element} The login page.
    */
    render()
    {
        return (
            <div className="form-page" id="login-form">
                <h1 className="form-title">Log In to {UNBOUND_LINK} Cloud {PURPLE_CLOUD}</h1>
                <p className="form-desc">Welcome back! Please sign in to your account.</p>

                <Form onSubmit={(e) => this.submitLogin(e)}>
                    {/* Username or Email Input */}
                    <UsernameEmailField
                        input={this.state.usernameInput}
                        setParentUsernameEmail={(username) => this.setState({usernameInput: username})}
                    />

                    {/* Password Input */}
                    <PasswordField
                        password={this.state.passwordInput}
                        showForgotPasswordLink={true}
                        showRememberMe={true}
                        rememberMe={this.state.rememberUser}
                        setParentPassword={(password) => this.setState({passwordInput: password})}
                        setParentRememberMe={(remember) => this.setState({rememberUser: remember})}
                        forgotPasswordFunc={() => this.getMainPage().setState({editState: STATE_FORGOT_PASSWORD})}
                    />

                    {/* Submit Button */}
                    <div className="submit-form-button-container">
                        <Button size="lg" className="submit-form-button" id="login-button" type="submit">
                            <AiOutlineCheckCircle size={42}/>
                        </Button>
                    </div>
                </Form>

                {/*Redirect to Sign-Up Page Button*/}
                <p className="already-have-account-container">
                    {"Don't have an account? "}
                    <span className="already-have-account-button"
                          id="switch-to-sign-up-button"
                          onClick={() => this.getMainPage().setState({editState: STATE_SIGN_UP})} >
                        Create an account.
                    </span>
                </p>
            </div>
        )
    }
}
