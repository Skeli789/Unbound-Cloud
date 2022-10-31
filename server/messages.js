/*
    Functions for sending emails to people.
*/

const nodemailer = require("nodemailer");
require('dotenv').config({path: __dirname + '/.env'});

const gUnboundEmail = process.env["UNBOUND_EMAIL"];
const gUnboundEmailPassword = process.env["UNBOUND_EMAIL_PASSWORD"];

/**
 * Sends an email.
 * @param {String} email - The destination email address.
 * @param {String} subject - The subject of the email to be sent.
 * @param {String} body - The actual text of the email sent.
 * @returns {Boolean} true if the email is sent successfully, false if any errors occurred.
 */
async function SendEmail(email, subject, body)
{
    try
    {
        let transporter = nodemailer.createTransport
        ({
            service: "gmail",
            auth:
            {
                user: gUnboundEmail,
                pass: gUnboundEmailPassword,
            }
        });
    
        let mailOption =
        {
            from: gUnboundEmail,
            to: email,
            subject: subject,
            text: body
        };
    
        let error, info = await transporter.sendMail(mailOption);

        if (error)
            throw(error);
        else
        {
            if (email !== gUnboundEmail) //Don't print messages when a dev email is sent
                console.log(`Email sent to ${info.accepted}`);
            return true;
        }
    }
    catch (error)
    {
        console.log(`Error sending email to ${email}:`);
        console.log(error);
        return false;
    }
}
module.exports.SendEmail = SendEmail;

/**
 * Sends an email to a user with the activation code they need to enter to activate their account.
 * @param {String} email - The email to send the activation code to.
 * @param {String} username - The username on the account.
 * @param {String} activationCode - The activation code needed to activate the account.
 * @returns {Boolean} true if the email is sent successfully, false if any errors occurred.
 */
async function SendActivationEmail(email, username, activationCode)
{
    var text = `${username},\n\n`
             + "On behalf of the Pokémon Unbound team, welcome to Unbound Cloud!\n\n"
             + "Please enter this code into the website to activate your account:\n\n"
             + `${activationCode}`;

    return await SendEmail(email, "Welcome to Unbound Cloud!", text);
}
module.exports.SendActivationEmail = SendActivationEmail;

/**
 * 
 * @param {String} email - The email to send the password reset code to.
 * @param {String} username - The username on the account.
 * @param {String} resetCode - The password reset code.
 * @returns {Boolean} true if the email is sent successfully, false if any errors occurred.
 */
async function SendPasswordResetEmail(email, username, resetCode)
{
    var text = `${username},\n\n`
             + "Please enter this code into Unbound Cloud to continue resetting your password:\n\n"
             + `${resetCode}\n\n`
             + `This code will expire in one hour.`;

    return await SendEmail(email, "Password Reset Code", text);
}
module.exports.SendPasswordResetEmail = SendPasswordResetEmail;
