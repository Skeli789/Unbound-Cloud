import axios from "axios";
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {config} from "./config";

export const NO_SERVER_CONNECTION_ERROR = "Couldn't connect to the server! Please try again later."

const MAX_LENGTHS =
{
    "USERNAME": 30,
    "EMAIL": 50,
    "PASSWORD": 20,
};
const PopUp = withReactContent(Swal);


/**
 * Confirms a string matches what's allowed for a username.
 * @param {String} username - The username to check.
 * @returns {Boolean} true if the username is valid, false if it's not.
 */
export function ValidateUsername(username)
{
    const pattern = new RegExp(/^[!-~]*$/); //Only first 128 ascii characters

    return typeof(username) === "string"
        && username.length >= 3
        && username.length <= 20
        && !username.includes(`"`)
        && !username.includes(`'`)
        && !username.includes("`")
        && !username.includes("<")
        && !username.includes(">")
        && !username.includes("@") //Prevent people from entering their username accidentally
        && pattern.test(username)
        && username !== "iamatester";
}

/**
 * Confirms a string matches an actual email pattern.
 * @param {String} email - The email to check.
 * @returns {Boolean} true if the email is valid, false if it's not.
 */
export function ValidateEmail(email)
{
    const pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(email);
}

export function ValidatePassword(password)
{
    return typeof(password) === "string"
        && password.length >= 6
        && password.length <= 20;
}

export function RequiredTooltip()
{
    const requiredTooltip = props => (<Tooltip {...props}>Required</Tooltip>);

    return (
        <OverlayTrigger placement="top" overlay={requiredTooltip}>
            <span style={{color: "red"}}>*</span>
        </OverlayTrigger>
    );
}

export function GetMaxTextLength(symbol)
{
    if (symbol in MAX_LENGTHS)
        return MAX_LENGTHS[symbol];

    return Number.MAX_SAFE_INTEGER;
}

export function ProcessTextInput(e, symbol, trim)
{
    var maxLength = GetMaxTextLength(symbol);
    var text = e.target.value.substring(0, maxLength);

    if (trim)
        text = text.trim();

    return text;
}

export function ErrorPopUp(errorMsg)
{
    PopUp.fire(
    {
        icon: 'error',
        title: errorMsg,
        cancelButtonText: `OK`,
        showConfirmButton: false,
        showCancelButton: true,
        scrollbarPadding: false,
    });
}

export function ErrorHasResponse(error)
{
    if (error === null || error === undefined || error.response === null || error.response === undefined) //Must be checked before
        return false;

    return "data" in error.response && error.response.data != null && "errorMsg" in error.response.data;
}

export async function SendFormToServer(data, classObj, mainPageObj, axiosRoute, successPopUpFunc)
{
    classObj.setState({showedErrorPopUp: false}, () =>
    {
        PopUp.fire(
        {
            title: 'Submitting, please wait...',
            timer: 20000, //20 seconds
            timerProgressBar: true,
            allowOutsideClick: false,
            showConfirmButton: false,
            showCancelButton: false,
            scrollbarPadding: false,
            didOpen: async () =>
            {
                let res;

                try
                {
                    res = await axios.post(`${config.dev_server}${axiosRoute}`, data, {});
                    successPopUpFunc(mainPageObj, res);
                }
                catch (error)
                {
                    if (ErrorHasResponse(error))
                    {
                        classObj.setState({errorMsg: error.response.data.errorMsg});

                        if ("errorText" in error.response.data)
                            classObj.setState({errorText: error.response.data.errorText});
                        else
                            classObj.setState({errorText: ""});

                        if (error.response.data.errorMsg === "ACCOUNT_EXISTS")
                            classObj.setState({invalidEmail: classObj.state.emailInput});

                        if (!classObj.state.showedErrorPopUp)
                            classObj.errorPopUp(error.response.data.errorMsg);
                    }
                    else
                    {
                        classObj.setState({errorMsg: "NO_SERVER_CONNECTION"});
                        if (!classObj.state.showedErrorPopUp)
                            classObj.errorPopUp("NO_SERVER_CONNECTION");
                    }
                }
            },
        });
    });
}
