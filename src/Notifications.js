/**
 * Various functions to handle sending user notifications.
 */

import {Button} from "react-bootstrap";
import {toast} from "react-toastify";
import {isEnabled as isDarkReaderEnabled} from 'darkreader';

import {AreSoundsMuted} from "./subcomponents/footer/SoundsButton";

import Error from './audio/Error.mp3';
import SfxTradeComplete from './audio/TradeComplete.mp3';

import "./stylesheets/Notifications.css";

const errorSound = new Audio(Error);
const tradeCompleteSound = new Audio(SfxTradeComplete);

const NEW_WONDER_TRADE_NOTIFICATION_COOLDOWN = 5 * 60 * 1000; //Only allow notifications every 5 minutes
const LAST_NEW_WONDER_TRADE_NOTIFICATION = "lastNewWonderTradeNotification";
const NEW_WONDER_TRADE_NOTIFICATIONS_AGAIN = "newWonderTradeNotificationsAgain";

const GLOBAL_POPUP_OPTS =
{
    customClass: //Use the button style from the rest of the site
    {
        confirmButton: "btn btn-primary",
        denyButton: "btn btn-danger",
        cancelButton: "btn btn-secondary",
    },
    scrollbarPadding: false,
};

/* General Notification Functions */

/**
 * Requests permission from the user to send system notifications.
 */
export function RequestPermissionForSystemNotifications()
{
    if (("Notification" in window) && Notification.permission !== "granted")
        Notification.requestPermission();
}

/**
 * Sends a system notification to the user.
 * @param {string} title - The title of the notification.
 * @param {string} message - The message of the notification.
 * @param {string} icon - The icon to display on the notification.
 * @returns {Notification} The notification object.
 */
export function SendSystemNotification(title, message, icon="")
{
    //Check if notification permission is granted
    if (!("Notification" in window) || Notification.permission !== "granted")
        return;

    //Don't send a notification if the user is on the page
    if (!document.hidden && document.hasFocus())
        return;

    //Send the notification
    let notification = new Notification(title,
    {
        body: message,
        icon: icon,
    });

    return notification;
}

/**
 * Sends a toast notification to the user.
 * @param {string} text - The text to display on the notification.
 * @param {object} options - The options to pass to the toast notification.
 * @returns {string} The ID of the toast notification.
 */
export function SendToastNotification(text, options={})
{
    let toastId = toast(text,
    {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true, //Don't the user how much time is left
        closeOnClick: true,
        pauseOnHover: false, //Always decrese the timer
        pauseOnFocusLoss: false, //Always decrese the timer
        draggable: false,
        // transition: "slide", //Broken
        theme: isDarkReaderEnabled() ? "dark" : "colored",
        ...options,
    });

    return toastId;
}

/**
 * Sends an error toast notification to the user.
 * @param {string} text - The text to display on the notification. 
 * @param {object} options - The options to pass to the toast notification.
 * @returns {string} The ID of the toast notification.
 */
export function SendErrorToastNotification(text, options={})
{
    PlayErrorSound();
    return SendToastNotification(text,
    {
        type: "error",
        ...options,
    });
}

/**
 * Sends an error toast notification to the user based on the box slot the error is for.
 * @param {string} text - The text to display on the notification. 
 * @param {number} boxSlot - The box slot the error is for.
 * @param {object} options - The options to pass to the toast notification.
 * @returns {string} The ID of the toast notification.
 */
export function SendErrorToastNotificationByBoxSlot(text, boxSlot, options={})
{
    return SendErrorToastNotification(text,
    {
        position: (boxSlot === 0) ? "bottom-left" : "bottom-right",
        ...options,
    });
}

/**
 * Gets the default options that should apply to every pop-up.
 * @returns {object} The default options for the pop-up.
 */
export function GetDefaultPopUpOpts()
{
    return {
        ...GLOBAL_POPUP_OPTS,
        theme: isDarkReaderEnabled() ? "dark" : "light",
    };
}


/* Specific Notification Functions */

/**
 * Play an error sound effect.
 */
export function PlayErrorSound()
{
    if (!AreSoundsMuted())
        errorSound.play();
}

/**
 * Plays the sound effect for when a trade is completed.
 */
export function PlayTradeCompletedSound()
{
    if (!AreSoundsMuted()) //Play sound if not muted
        tradeCompleteSound.play();
}

/**
 * Sends a notification to the user when a Wonder Trade is completed.
 * @param {string} text - The text to display on the notification.
 * @param {string} imageUrl - The URL of the image to display on the notification.
 */
export function SendWonderTradeCompleteNotification(text, imageUrl)
{
    document.title = "Wonder Trade Complete!"; //Indicate to the user if they're in another tab
    PlayTradeCompletedSound();
    SendSystemNotification("Wonder Trade Complete!", text, imageUrl);
    ClearWonderTradeNotificationCooldown(); //Allow receiving "Someone is waiting for a Wonder Trade!" notifications immediately after a trade
}

/**
 * Sends a notification to the user when someone is waiting for a Wonder Trade.
 */
export function SendWonderTradeWaitingNotification()
{
    const text = "Someone is waiting for a Wonder Trade!";

    //Create the close button for the toast notification
    const CloseButton = ({closeToast}) => (
        <Button
          className="hide-wonder-trade-available-notification-button"
          variant="danger"
          onClick={() => {closeToast(); HideNewWonderTradeNotificationsFor24Hours();}}
        >
            Hide for 24 Hours
        </Button>
    );

    //Send the toast notification
    PlayTradeCompletedSound();
    SendToastNotification(text,
    {
        className: "toast-with-button",
        closeButton: <CloseButton />,
        autoClose: 8 * 1000, //Keep the notification open for 8 seconds
    });

    //Send a system notification (will only be sent if the user is not on the page)
    SendSystemNotification(text);

    //Set the last notification time to now
    localStorage.setItem(LAST_NEW_WONDER_TRADE_NOTIFICATION, Date.now());
}

/**
 * Checks if the user wants to receive notifications for new Wonder Trades.
 * @returns {boolean} Whether the user wants to receive notifications.
 */
export function UserWantsNewWonderTradeNotifications()
{
    //Check if the allowed notifications time has passed
    const allowedNotificationsTime = localStorage.getItem(NEW_WONDER_TRADE_NOTIFICATIONS_AGAIN);
    if (allowedNotificationsTime == null)
        return true; //If the user has never set the time, allow notifications

    //If the time has passed, allow notifications and remove the time
    if (Date.now() > allowedNotificationsTime)
    {
        localStorage.removeItem(NEW_WONDER_TRADE_NOTIFICATIONS_AGAIN);
        return true;
    }
}

/**
 * Prevents the user from receiving notifications for new Wonder Trades for 24 hours.
 */
function HideNewWonderTradeNotificationsFor24Hours()
{
    localStorage.setItem(NEW_WONDER_TRADE_NOTIFICATIONS_AGAIN, Date.now() + 24 * 60 * 60 * 1000); //Set the time to 24 hours from now
}

/**
 * Checks if the user has received a new Wonder Trade notification recently.
 * @returns {boolean} Whether the user has received a new Wonder Trade notification recently.
 */
export function TooSoonSinceLastNewWonderTradeNotification()
{
    const lastNotificationTime = localStorage.getItem(LAST_NEW_WONDER_TRADE_NOTIFICATION);
    if (lastNotificationTime == null)
        return false; //If the user has never set the time, allow notifications

    //Don't allow notifications if the time since the last notification is less than the cooldown
    return Date.now() - lastNotificationTime < NEW_WONDER_TRADE_NOTIFICATION_COOLDOWN;
}

/** 
 * Clears the Wonder Trade notification cooldown and allows notifications again.
 */
export function ClearWonderTradeNotificationCooldown()
{
    localStorage.removeItem(LAST_NEW_WONDER_TRADE_NOTIFICATION);
}
