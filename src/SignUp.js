import React, {Component} from 'react';
import {Button, Form, OverlayTrigger, Tooltip} from "react-bootstrap";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {BLANK_PROGRESS_BAR, STATE_ENTER_ACTIVATION_CODE, STATE_LOGIN, UNOFFICIAL_RELEASE} from "./MainPage";
import {NO_SERVER_CONNECTION_ERROR, ErrorPopUp, ProcessTextInput, RequiredTooltip, SendFormToServer,
        ValidateEmail, ValidatePassword, ValidateUsername} from "./FormUtil";

import {AiOutlineCheckCircle, AiOutlineEye, AiOutlineEyeInvisible} from "react-icons/ai";

import "./stylesheets/Form.css";

const ERROR_MESSAGES =
{
    "": "",
    INVALID_USERNAME: <div>Username must:
                          <ul style={{textAlign: "left"}}>
                              <li>Be between 3 and 20 characters</li>
                              <li>Only contain basic letters, numbers, and symbols</li>
                              <li>Be free of profanity</li>
                          </ul>
                      </div>,
    INVALID_EMAIL: "Invalid email!",
    INVALID_PASSWORD: "Password must be between 6 and 20 characters!",
    MISMATCHED_PASSWORDS: "Passwords don't match!",
    NULL_ACCOUNT: "The details were wiped before reaching the server!",
    BLANK_INPUT: "Missing required (*) field!",
    USER_EXISTS: "An account with that username already exists!",
    EMAIL_EXISTS: "An account with that email already exists!",
    UNKNOWN_ERROR: "An internal server error occurred! Please try again later.",
    NO_SERVER_CONNECTION: NO_SERVER_CONNECTION_ERROR,
};
const PopUp = withReactContent(Swal);


export class SignUp extends Component
{
    /**
     * Sets up the sign-up page.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            emailInput: "",
            usernameInput: "",
            passwordInput: "",
            confirmPasswordInput: "",
            errorMsg: "",
            invalidUsername: "",
            invalidEmail: "",
            showPassword: false,
            isTester: UNOFFICIAL_RELEASE ? true : false,
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
     * Gets the state of MainPage.
     * @returns {Object} The this.state object of MainPage.js.
     */
    getGlobalState()
    {
        return this.getMainPage().state;
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
     * Checks if all necessary fields in the form are filled.
     * @returns {Boolean} true if all required fields are filled, false if they're not.
     */
    allRequiredFieldsFilled()
    {
        return this.state.emailInput !== ""
            && this.state.usernameInput !== ""
            && this.bothPasswordsFilled();
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
     * Checks if the username entered in the form is a valid username.
     * @returns {Boolean} true if the entered username is valid, false if it's not.
     */
    validUsername()
    {
        return ValidateUsername(this.state.usernameInput);
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
     * Gets the correct error message to display in a pop-up.
     * @returns {String} - The error message symbol.
     */
    getErrorMessage()
    {
        var errorMsg = "";

        if (!this.allRequiredFieldsFilled())
            errorMsg = "BLANK_INPUT";
        else if (!this.validEmail())
            errorMsg = "INVALID_EMAIL";
        else if (!this.validUsername())
            errorMsg = "INVALID_USERNAME";
        else if (!this.validPassword())
            errorMsg = "INVALID_PASSWORD";
        else if (!this.passwordsMatch())
            errorMsg = "MISMATCHED_PASSWORDS";

        return errorMsg;
    }

    /**
     * Confirms if the currently entered username is already in use.
     * @returns {Boolean} true if the entered username is already in use, false if it's available.
     */
    usernameAlreadyInUse()
    {
        return this.state.invalidUsername !== ""
            && this.state.invalidUsername === this.state.usernameInput;
    }
 
    /**
     * Confirms if the currently entered email is already in use.
     * @returns {Boolean} true if the entered email is already in use, false if it's available.
     */
    emailAlreadyInUse()
    {
        return this.state.invalidEmail !== ""
            && this.state.invalidEmail === this.state.emailInput;
    }

    /**
     * Adds all of the Cloud data to form data for sending to the server.
     * @param {Array} totalCloudData - All of the data to send to the server.
     * @param {Object} formData - The object used to send them to the server.
     */
    addCloudDataToFormData(totalCloudData, formData)
    {
        var parts = 8;
        var len = totalCloudData.length;

        //The data is split into four parts to guarantee it'll all be sent
        for (let i = 0; i < parts; ++i)
        {
            if (i + 1 >= parts)
                formData.append(`cloudDataP${i + 1}`, totalCloudData.slice((len / 4) * i, len));
            else
                formData.append(`cloudDataP${i + 1}`, totalCloudData.slice((len / 4) * i, (len / 4) * (i + 1)));
        }
    }

    /**
     * Finalizes the user's registration.
     * @param {Object} e - The form submission event.
     */
    async submitRegistration(e)
    {
        e.preventDefault(); //Prevent page reload
        var errorMsg = this.getErrorMessage();

        if (errorMsg === "") //No error
        {
            const formData = new FormData();
            formData.append("email", this.state.emailInput);
            formData.append("username", this.state.usernameInput);
            formData.append("password", this.state.passwordInput);

            var totalCloudData = JSON.stringify
            ({
                cloudBoxes: this.getGlobalState().homeBoxes,
                cloudTitles: this.getGlobalState().homeTitles,
                cloudRandomizerData: this.getGlobalState().randomizedHomeBoxes ? this.getGlobalState().randomizedHomeBoxes : [], //Don't waste space unless the user actually saves a randomized file
                cloudRandomizerTitles: this.getGlobalState().randomizedHomeTitles ? this.getGlobalState().randomizedHomeTitles : [],
            });

            this.addCloudDataToFormData(totalCloudData, formData);

            await SendFormToServer(formData, this, this.mainPage, "/createuser", CompletedRegistrationPopUp);
        }
        else
        {
            this.setState({errorMsg: errorMsg});
            this.errorPopUp(errorMsg);
        }
    }

    /**
     * Displays an error pop-up based on the current error message.
     * @param {String} errorSymbol - The symbol of the error message to display.
     */
    errorPopUp(errorSymbol)
    {
        var text = (errorSymbol in ERROR_MESSAGES) ?  ERROR_MESSAGES[errorSymbol] : errorSymbol;

        if (errorSymbol === "UNKNOWN_ERROR" && this.state.errorText !== "")
            text = this.state.errorText;

        ErrorPopUp(text);
    }

    /**
     * Prints the sign-up page.
     */
    render()
    {
        var required = RequiredTooltip();
        const cloudFileUploadError = "Make sure it was a proper Cloud data file and is not corrupted.";
        const showPasswordFunc = () => this.setState({showPassword: !this.state.showPassword});

        return (
            <div className="form-page">
                <h1 className="form-title">Unbound Cloud Sign-Up</h1>
                {/*Redirect to Login Page Button*/}
                <div className="already-have-account-button"
                     onClick={() => this.getMainPage().setState({editState: STATE_LOGIN})}>
                    I already have an account
                </div>

                <Form onSubmit={(e) => this.submitRegistration(e)}>
                    {/*Username Input*/}
                    <Form.Group className="mb-3" controlId="formBasicUsername">
                        <Form.Label>Username{required}</Form.Label>
                        <Form.Control
                            required
                            name="username"
                            autoComplete='username'
                            //placeholder="billybob"
                            value={this.state.usernameInput}
                            className={`form-control ${this.state.usernameInput !== ""
                                                   && (!this.validUsername() || this.usernameAlreadyInUse()) ? 'is-invalid' : ''}`}
                            onChange={(e) => this.setState({usernameInput: ProcessTextInput(e, "USERNAME", true),
                                                            isTester: this.state.isTester || ProcessTextInput(e, "USERNAME", true).toLowerCase() === "iamatester"})}
                        />
                    </Form.Group>

                    {/*Email Input*/}
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Email Address{required}</Form.Label>
                        <Form.Control
                            required
                            name="email"
                            autoComplete='email'
                            //placeholder="example@gmail.com"
                            value={this.state.emailInput}
                            className={`form-control ${this.state.emailInput !== ""
                                                   && (!this.validEmail() || this.emailAlreadyInUse()) ? 'is-invalid' : ''}`}
                            onChange={(e) => this.setState({emailInput: ProcessTextInput(e, "EMAIL", true)})}
                        />
                    </Form.Group>

                    {/*Password Input*/}
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Password{required} {ShowPasswordSymbol(this.state.showPassword, showPasswordFunc)}</Form.Label>
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

                    {/*Tester Cloud Data Upload Button*/}
                    {
                        this.state.isTester ?
                            this.getGlobalState().uploadProgress === BLANK_PROGRESS_BAR ?
                                <div>
                                    <label className="btn btn-success btn-lg tester-upload-button">
                                        Upload Cloud Data
                                        <input type="file" hidden onChange={(e) => this.getMainPage().chooseHomeFile(e, cloudFileUploadError)}
                                            accept=".dat" />
                                    </label>
                                </div>
                            :
                                this.getGlobalState().uploadProgress
                        :
                            ""
                    }

                    {/*Tester Show Cloud Data Was Uploaded*/}
                    {
                        this.state.isTester ?
                            <div>
                                <h4>{this.getGlobalState().uploadedTesterHomeFile ? "Uploaded Cloud Data" : ""}</h4>
                                <h4>{this.getGlobalState().uploadedTesterRandomizedHomeFile ? "Uploaded Randomized Cloud Data" : ""}</h4>
                            </div>
                        :
                            ""
                    }
    
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

/**
 * Processes the response from the server after signing up.
 * @param {Object} mainPageObj - The this object from MainPage.js.
 * @param {Objecy} response - The response object from the server.
 */
function CompletedRegistrationPopUp(mainPageObj, response)
{
    PopUp.fire(
    {
        icon: "success",
        title: "Registration complete!",
    }).then(() =>
    {
        mainPageObj.setState
        ({
            editState: STATE_ENTER_ACTIVATION_CODE,
            username: response.data.username,
            accountCode: response.data.accountCode, //Used later when requesting the Cloud Boxes from the server
        });
    });
}

/**
 * Gets a button that can be clicked to either show or hide a password.
 * @param {Boolean} shouldShowPassword - Whether the password is currently shown or hidden.
 * @param {Function} showPasswordFunc - A function that changes the current state to either show or hide the password.
 * @returns {JSX} The symbol that can be clicked to show or hide the password.
 */
export function ShowPasswordSymbol(shouldShowPassword, showPasswordFunc)
{
    const showPasswordTooltip = props => (<Tooltip {...props}>Show Password</Tooltip>);
    const hidePasswordTooltip = props => (<Tooltip {...props}>Hide Password</Tooltip>);

    return (
        <OverlayTrigger placement="right" overlay={shouldShowPassword ? hidePasswordTooltip : showPasswordTooltip}>    
            <div className="show-password-symbol">
                {
                    shouldShowPassword ?
                        <AiOutlineEyeInvisible size={20} onClick={showPasswordFunc}/>
                    :
                        <AiOutlineEye size={20} onClick={showPasswordFunc}/>
                }
            </div>
        </OverlayTrigger>
    );
}
