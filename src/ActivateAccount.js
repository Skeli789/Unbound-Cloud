
import React, {Component} from 'react';
import {Button, Form, OverlayTrigger, Tooltip} from "react-bootstrap";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {STATE_CHOOSE_SAVE_HANDLE, STATE_UPLOAD_SAVE_FILE, CanUseFileHandleAPI} from "./MainPage";
import {NO_SERVER_CONNECTION_ERROR, ErrorPopUp, SendFormToServer} from "./FormUtil";
import {CodeField} from "./subcomponents/CodeField";

import {AiOutlineCheckCircle, AiOutlineMail} from "react-icons/ai";

import "./stylesheets/Form.css";
import "./stylesheets/FriendTrade.css";

const ERROR_MESSAGES =
{
    "": "",
    INVALID_USER: "No account for that username was found!",
    INVALID_ACCOUNT_CODE: "Incorrect account code!",
    INVALID_ACTIVATION_CODE: "Incorrect activation code!",
    NO_ACCOUNT_FOUND: "No account for that username was found!",
    NULL_ACCOUNT: "The details were wiped before reaching the server!",
    BLANK_INPUT: "Missing required (*) field!",
    UNKNOWN_ERROR: "An unknown server error occurred! Please try again later.",
    NO_SERVER_CONNECTION: NO_SERVER_CONNECTION_ERROR,
};
const CODE_LENGTH = 6;
const RESEND_CODE_COOLDOWN = 120 * 1000; //2 Minutes
const PopUp = withReactContent(Swal);


export class ActivateAccount extends Component
{
   /**
    * Sets up the account activation page.
    */
    constructor(props)
    {
        super(props);

        this.state =
        {
            codeInput: "",
            showedErrorPopUp: false,
            errorMsg: "",
            lastTimeClickedResendCode: "lastTimeClickedResendCode" in localStorage ? localStorage.lastTimeClickedResendCode : 0,
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
     * Ensures all necessary fields in the form are filled.
     * @returns {Boolean} true if all required fields are filled, false otherwise.
     */
    allRequiredFieldsFilled()
    {
        return this.state.codeInput !== "";
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
     * Gets the error message (if present) at the time of form submission.
     * @returns {String} The error message symbol.
     */
    getErrorMessage()
    {
        var errorMsg = "";

        if (!this.allRequiredFieldsFilled())
            errorMsg = "BLANK_INPUT";
        else if (!this.validCode())
            errorMsg = "INVALID_ACTIVATION_CODE";

        return errorMsg;
    }

    /**
     * Submits the activation code.
     * @param {Object} e - The default event for submitting a form.
     */
    async submitCode(e)
    {
        if (e != null)
            e.preventDefault(); //Prevent page reload

        var errorMsg = this.getErrorMessage();
        if (errorMsg === "") //No error
        {
            const requestData =
            {
                username: this.getGlobalState().username,
                activationCode: this.state.codeInput,
            }

            await SendFormToServer(requestData, this, this.mainPage, "/activateUser", CompletedActivationPopUp);
        }
        else
        {
            this.setState({errorMsg: errorMsg});
            this.errorPopUp(errorMsg);
        }
    }

    /**
     * Resends the user's activation code.
     */
    async resendActivationCode()
    {
        var timeSince = Date.now() - this.state.lastTimeClickedResendCode;

        if (timeSince >= RESEND_CODE_COOLDOWN)
        {
            //Can resend code again
            const requestData =
            {
                username: this.getGlobalState().username,
                accountCode: this.getGlobalState().accountCode,
            }
    
            await SendFormToServer(requestData, this, this.mainPage, "/resendActivationCode", this.checkEmailForNewCodePopUp.bind(this));
        }
        else
        {
            var timeRemaining = Math.ceil((RESEND_CODE_COOLDOWN - timeSince) / 1000);
            this.errorPopUp(`Please wait ${timeRemaining} seconds before sending another code.`);
        }
    }

    /**
     * Displays a pop-up telling the user to check their email for the new activation code.
     */
    checkEmailForNewCodePopUp()
    {
        localStorage.lastTimeClickedResendCode = Date.now(); //So if the page is reloaded the timer remains intact
        this.setState({lastTimeClickedResendCode: localStorage.lastTimeClickedResendCode});
        PopUp.fire(
        {
            icon: "success",
            title: "Check your email for the new code!",
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
    * Prints the account activation page. 
    */
    render()
    {
        const submitTooltip = props => (<Tooltip {...props}>Submit</Tooltip>);
        const resendCodeTooltip = props => (<Tooltip {...props}>Resend Code</Tooltip>);
        var confirmButtonSize = 42;

        return (
            <div className="form-page" id="activation-form">
                <Form onSubmit={(e) => this.submitCode(e)}>
                    <h1 className="form-title mb-3">Enter the code sent to your email!</h1>
                    <CodeField
                        code={this.state.codeInput}
                        codeLength={CODE_LENGTH}
                        fieldPrefix="Activation"
                        setParentCode={(code) => this.setState({codeInput: code})}
                        postPasteFunc={this.submitCode.bind(this)}
                    />

                    <div className="activate-account-buttons">
                        {/* Submit Button */}
                        <div className="friend-trade-code-input-button">
                            <OverlayTrigger placement="bottom" overlay={submitTooltip}>
                                <Button size="lg" className="friend-trade-offer-button"
                                        id="submit-code-button"
                                        aria-label="Submit Code"
                                        type="submit">
                                    <AiOutlineCheckCircle size={confirmButtonSize}/>
                                </Button>
                            </OverlayTrigger>
                        </div>

                        {/* Resend Code Button */}
                        <div className="friend-trade-code-input-button">
                            <OverlayTrigger placement="bottom" overlay={resendCodeTooltip}>
                                <Button size="lg" className="friend-trade-offer-button"
                                        id="resend-code-button"
                                        aria-label="Resend Code"
                                        onClick={this.resendActivationCode.bind(this)}>
                                    <AiOutlineMail size={confirmButtonSize}/>
                                </Button>
                            </OverlayTrigger>
                        </div>
                    </div>
                </Form>
            </div>
        );
    }
}

/**
 * Processes the response from the server after logging in.
 * @param {Object} mainPageObj - The this object from MainPage.js.
 * @param {Objecy} response - The response object from the server.
 */
function CompletedActivationPopUp(mainPageObj, response)
{
    var newEditState = CanUseFileHandleAPI() ? STATE_CHOOSE_SAVE_HANDLE : STATE_UPLOAD_SAVE_FILE;

    PopUp.fire(
    {
        icon: "success",
        title: "Account activated successfully!",
    }).then(() =>
    {
        mainPageObj.setState
        ({
            editState: newEditState,
        });

        localStorage.activated = true;
    });
}
