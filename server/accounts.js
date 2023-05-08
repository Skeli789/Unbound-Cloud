/*
    Functions relating to user accounts.
*/

const Mutex = require('async-mutex').Mutex;
const bcrypt = require('bcryptjs');
const fs = require('fs');
const _ = require('lodash'); 
const randomstring = require("randomstring");
const messages = require('./messages');
const util = require('./util');
require('dotenv').config({path: __dirname + '/.env'});

const BASE_STORAGE_DIR = `${process.env.APPDATA}/unboundcloud`;
const EMAIL_TO_USER_FILE = `${BASE_STORAGE_DIR}/EmailToUsername.json`;
const PASSWORD_RESET_CODE_EXPIRATION_TIME = 60 * 60 * 1000; //60 Minutes
const PASSWORD_RESET_COOLDOWN = 60 * 60 * 1000; //60 Minutes
const ACTIATION_EMAIL_COOLDOWN = 2 * 60 * 1000; //2 Minutes
const PASSWORD_RESET_EMAIL_COOLDOWN = 2 * 60 * 1000; //2 Minutes

var gDatabaseMutex = new Mutex();


/**
 * Locks the database files and prevents them from being modified until the current process unlocks them.
 */
async function LockDB()
{
    await gDatabaseMutex.acquire();
}
module.exports.LockDB = LockDB;

/**
 * Unlocks the database files for editing again.
 */
async function UnlockDB()
{
    await gDatabaseMutex.release();
}
module.exports.UnlockDB = UnlockDB;

/**
 * Checks if the Database is currently locked for editing.
 */
function IsDBLocked()
{
    return gDatabaseMutex.isLocked();
}
module.exports.IsDBLocked = IsDBLocked;

/**
 * Creates the Unbound Cloud directory in AppData if it doesn't alrady exist.
 */
function TryMakeUnboundCloudStorageDirectory()
{
    var dir = process.env.APPDATA + "/unboundcloud";

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);
}
 
 /**
  * Creates the accounts directory if it doesn't already exist.
  */
function TryMakeAccountsDirectory()
{
    var dir = process.env.APPDATA + "/unboundcloud/accounts/";

    TryMakeUnboundCloudStorageDirectory();

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);
}

/**
 * Gets the DB file name associated with a specific username.
 * @param {String} username - The username for the account.
 * @returns {String} - The path to the user's account details.
 */
function UserToAccountFile(username)
{
    return `${BASE_STORAGE_DIR}/accounts/user_${username.toLowerCase()}.json`;
}
module.exports.UserToAccountFile = UserToAccountFile;

/**
 * Checks if an username already has an account associated with it.
 * @param {String} username - The username for the account.
 * @returns {Boolean} - true if the account already exists, false if it doesn't.
 */
function UserExists(username)
{
    if (!util.IsValidUsername(username))
        return false;

    return fs.existsSync(UserToAccountFile(username));
}
module.exports.UserExists = UserExists;

/**
 * Gets a user's DB data.
 * @param {String} username - The user to get the data for.
 * @returns {Object} The user's DB data.
 */
function GetUserData(username)
{
    if (!UserExists(username))
        return {};

    return JSON.parse(fs.readFileSync(UserToAccountFile(username)));
}
module.exports.GetUserData = GetUserData;

/**
 * Stores a user's DB data.
 * @param {String} username - The user to store the data for.
 * @param {Object} data - The data to store.
 */
function StoreUserData(username, data)
{
    TryMakeAccountsDirectory();

    if (Object.keys(data).length === 0) //No data so just get rid of the file
        fs.rmSync(UserToAccountFile(username));
    else
        fs.writeFileSync(UserToAccountFile(username), JSON.stringify(data));
}
module.exports.StoreUserData = StoreUserData;

/**
 * Checks if an email already has an account associated with it.
 * @param {String} email - The email for the account.
 * @returns {Boolean} - true if the account already exists, false if it doesn't.
 */
function EmailExists(email)
{
    if (!util.IsValidEmail(email))
        return false;

    var data = GetContentsOfEmailToUsernameTable();
    return email in data;
}
module.exports.EmailExists = EmailExists;

/**
 * Gets an account's username from the account's email address.
 * @param {String} email - The email address registered with the account.
 * @returns {String} The username of the account if found, empty string if not.
 */
function EmailToUsername(email)
{
    if (EmailExists(email))
    {
        var data = GetContentsOfEmailToUsernameTable();
        return data[email];
    }

    return "";
}
module.exports.EmailToUsername = EmailToUsername;

/**
 * Checks if the table of usernames by emails exists as a file yet.
 * @returns {Boolean} true if the file exists, false if it does not.
 */
function EmailToUsernameTableExists()
{
    return fs.existsSync(EMAIL_TO_USER_FILE);
}
module.exports.EmailToUsernameTableExists = EmailToUsernameTableExists;

/**
 * Gets the contents of the table that maps email addresses to usernames.
 * @returns {Object} A JSON object with emails as the keys and usernames as the values.
 */
function GetContentsOfEmailToUsernameTable()
{
    if (!EmailToUsernameTableExists())
        return {};

    return JSON.parse(fs.readFileSync(EMAIL_TO_USER_FILE));
}
module.exports.GetContentsOfEmailToUsernameTable = GetContentsOfEmailToUsernameTable;

/**
 * Adds a new email-username pair to the table.
 * @param {String} email - The email to be the key.
 * @param {String} username - The username to be the value.
 */
function AddEmailUsernamePairToTable(email, username)
{
    var data = GetContentsOfEmailToUsernameTable();
    data[email] = username
    SaveEmailToUsernameTable(data);
}
module.exports.AddEmailUsernamePairToTable = AddEmailUsernamePairToTable;

/**
 * Removes an email-username pair from the table.
 * @param {String} email - The email to remove.
 */
function RemoveEmailUsernamePairFromTable(email)
{
    if (email != null && EmailToUsernameTableExists())
    {
        var data = GetContentsOfEmailToUsernameTable();
        if (email in data)
        {
            delete data[email];
            SaveEmailToUsernameTable(data);
        }
    }
}
module.exports.RemoveEmailUsernamePairFromTable = RemoveEmailUsernamePairFromTable;

/**
 * Updates the table that maps email addresses to usernames.
 * @param {Object} data - The new table to store.
 */
function SaveEmailToUsernameTable(data)
{
    if (Object.keys(data).length === 0)
        fs.rmSync(EMAIL_TO_USER_FILE); //No data anyway so just remove the file
    else
        fs.writeFileSync(EMAIL_TO_USER_FILE, JSON.stringify(data));
}
module.exports.SaveEmailToUsernameTable = SaveEmailToUsernameTable;

/**
 * Encrypts a password for 10 rounds of hashing.
 * @param {String} password - The password to encrypt.
 * @returns {String} - The encrypted password.
 */
async function EncryptPassword(password)
{
    var hashRounds = 10; //10 rounds of hashing

    const salt = await bcrypt.genSalt(hashRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}
module.exports.EncryptPassword = EncryptPassword;

/**
 * Compares an entered password with a password encrypted previously.
 * @param {String} password - The password just entered.
 * @param {String} encryptedPassword - The encrypted password the user originally entered when they signed up.
 * @returns true if the passwords match, false otherwise.
 */
async function ValidatePassword(password, encryptedPassword)
{
    if (password == null || encryptedPassword == null)
        return false;

    return await bcrypt.compare(password, encryptedPassword);
}
module.exports.ValidatePassword = ValidatePassword;

/**
 * Checks to make sure the user entered the correct password for their account.
 * @param {String} username - The username for the account.
 * @param {String} password - The password the user entered.
 * @returns {Boolean} - true if the user entered the correct password, false if not.
 */
async function VerifyCorrectPassword(username, password)
{
    if (!UserExists(username)
    || !util.IsValidUsername(username)
    || !util.IsValidPassword(password))
        return false;

    var data = GetUserData(username);
    return await ValidatePassword(password, data.password);
}
module.exports.VerifyCorrectPassword = VerifyCorrectPassword;

/**
 * Creates a user account.
 * @param {String} email - The email the account is for.
 * @param {String} username - The username on the account.
 * @param {String} password -  The password to login to the account.
 * @param {Array<Object>} cloudBoxes - Preset Cloud Pokemon if any.
 * @param {Array<String>} cloudTitles - Preset Cloud Box names if any.
 * @param {Array<Object>} cloudRandomizerBoxes - Preset Cloud Pokemon for randomized saves if any.
 * @param {Array<String>} cloudRandomizerTitles - Preset Cloud Box names for randomized saves if any.
 * @returns {Boolean} - true if the account was created successfully, false if not.
 */
async function CreateUser(email, username, password, cloudBoxes=[], cloudTitles=[], cloudRandomizerBoxes=[], cloudRandomizerTitles=[])
{
    await LockDB();

    try
    {
        if (EmailExists(email))
            throw(`Account with email "${email}" already exists!`);
        else if (UserExists(username))
            throw(`Account with username "${username}" already exists!`);
        else if (!util.IsValidEmail(email))
            throw(`"${email}" is not a valid email!`);
        else if (!util.IsValidUsername(username))
            throw(`"${username}" is not a valid username!`);
        else if (!util.IsValidPassword(password))
            throw(`"${password}" is not a valid password!`);
        else if (util.BadWordInText(username))
            throw(`"${username}" has profanity in it!`);

        var activationCode = randomstring.generate({length: 6, charset: "alphanumeric", capitalization: "lowercase"});
        var data =
        {
            email: email,
            password: await EncryptPassword(password),
            accountCode: randomstring.generate({length: 12, charset: "alphanumeric"}),
            activated: false,
            activationCode: activationCode,
            dataVersion: 2,
            cloudBoxes: cloudBoxes,
            cloudTitles: cloudTitles,
            cloudRandomizerBoxes: cloudRandomizerBoxes,
            cloudRandomizerTitles: cloudRandomizerTitles,
            lastAccessed: Date.now(),
            stats: {}, //For things like friend trades and wonder trades done
        }

        //Save data in file
        StoreUserData(username, data);

        //Update email to username table
        AddEmailUsernamePairToTable(email, username);

        //Send activation code
        if (!(await messages.SendActivationEmail(email, username, activationCode)))
        {
            await DeleteUser(username, password);
            throw(`Could not send email to ${email}`);
        }

        UnlockDB();
        return [true, ""];
    }
    catch (e)
    {
        UnlockDB();
        console.log(`An error occurred trying to create the user account for ${email}:\n${e}`);
        return [false, e];
    }
}
module.exports.CreateUser = CreateUser;

/**
 * Gets a user's emaila address.
 * @param {String} username - The user to get the email for.
 * @returns {String} The email address for the user.
 */
function UsernameToEmail(username)
{
    if (!UserExists(username))
        return "";

    var data = GetUserData(username);
    return data.email;
}
module.exports.UsernameToEmail = UsernameToEmail;

/**
 * Checks if a user's account has already been activated.
 * @param {String} username - The username for the account.
 * @returns {Boolean} - true if the account has already been activated, false if not.
 */
function AccountIsActivated(username)
{
    if (!UserExists(username))
        return false;

    var data = GetUserData(username);
    return data.activated;
}
module.exports.AccountIsActivated = AccountIsActivated;

/**
 * Gets the confirmation code a user needs to enter to activate their account.
 * @param {String} username - The username for the account.
 * @returns {String} - The confirmation code needed to activate the account.
 */
function GetUserActivationCode(username)
{
    if (!UserExists(username))
        return null;

    var data = GetUserData(username);
    return data.activationCode;
}
module.exports.GetUserActivationCode = GetUserActivationCode;

/**
 * Activate's a user's account and allows them to actually log in.
 * @param {String} username - The username the account is for.
 * @returns {Boolean} - true if the account was activated successfully, false if not.
 */
async function ActivateUser(username, activationCode)
{
    await LockDB();

    try
    {   
        if (!UserExists(username))
            throw(`Account for "${username}" doesn't exist`);

        var data = GetUserData(username);

        if (data.activationCode !== activationCode)
            throw(`"Confirmation code for ${username} is incorrect"`);

        data.activated = true;
        delete data.activationCode; //No longer needed in the object
        delete data.lastActivationEmailSentAt;
        StoreUserData(username, data);

        UnlockDB();
        return true;
    }
    catch (e)
    {
        UnlockDB();
        console.log(`An error occurred trying to activate the user account for ${username}:\n${e}`);
        return false;
    }
}
module.exports.ActivateUser = ActivateUser;
 
/**
 * Resends the activation code to a user's email.
 * @param {String} username - The user to resend the activation code to.
 * @returns {Boolean} true if the email was sent successfully, false if not.
 */
async function ResendActivationEmail(username)
{
    if (!UserExists(username))
        return false;

    await LockDB();

    var email = UsernameToEmail(username);
    var activationCode = GetUserActivationCode(username);
    var data = GetUserData(username);

    if ("lastActivationEmailSentAt" in data)
    {
        var timeSince = Date.now() - data.lastActivationEmailSentAt;
        if (timeSince < ACTIATION_EMAIL_COOLDOWN)
        {
            UnlockDB();
            return false;
        }
    }

    if (await messages.SendActivationEmail(email, username, activationCode))
    {
        data.lastActivationEmailSentAt = Date.now();
        StoreUserData(username, data);

        UnlockDB();
        return true;
    }

    UnlockDB();
    return false;
}
module.exports.ResendActivationEmail = ResendActivationEmail;

/**
 * Sends a code a user can use to reset their password.
 * @param {String} email - The email to send the code to.
 * @returns {Boolean} true if the email was sent successfully, false if it was not.
 */
async function SendPasswordResetCode(email)
{
    if (!EmailExists(email))
        return false;

    var username = EmailToUsername(email);
    var data = GetUserData(username);

    if ("passwordResetCodeCreatedAt" in data)
    {
        var timeSince = Date.now() - data.passwordResetCodeCreatedAt;
        if (timeSince < PASSWORD_RESET_EMAIL_COOLDOWN)
            return false;
    }

    var resetCode = await CreatePasswordResetCode(username);
    return await messages.SendPasswordResetEmail(email, username, resetCode);
}
module.exports.SendPasswordResetCode = SendPasswordResetCode;

/**
 * Creates a code a user can use to reset their password.
 * @param {String} username - The username of the account to create the code for.
 * @returns {String} The recently created password reset code. null if error.
 */
async function CreatePasswordResetCode(username)
{
    await LockDB();

    try
    {
        if (!UserExists(username))
            throw(`Account for "${username}" doesn't exist`);

        var data = GetUserData(username);
        data.passwordResetCode = randomstring.generate({length: 6, charset: "alphanumeric"});
        data.passwordResetCodeCreatedAt = Date.now();
        StoreUserData(username, data);
        UnlockDB();
        return data.passwordResetCode;
    }
    catch (e)
    {
        UnlockDB();
        console.log(`An error occurred trying to create a password reset code for ${username}:\n${e}`);
        return null;
    }
}
module.exports.CreatePasswordResetCode = CreatePasswordResetCode;

/**
 * Gets a user's password reset code.
 * @param {String} username - The username of the account to get the code for.
 * @returns {String} The password reset code saved in the user's account. null if one hasn't been created.
 */
function GetPassswordResetCode(username)
{
    if (!UserExists(username))
        return null;

    var data = GetUserData(username);
    return ("passwordResetCode" in data) ? data.passwordResetCode : null;
}
module.exports.GetPassswordResetCode = GetPassswordResetCode;

/**
 * Checks if a user's password reset code has expired.
 * @param {String} username - The username of the account to check the code for.
 * @returns {Boolean} true if the user's password reset code has expired and can no longer be used,
 *                    false if it still can be or one was never created.
 */
function HasPasswordResetCodeExpired(username)
{
    if (!UserExists(username))
        return false;

    var data = GetUserData(username);
    if ("passwordResetCodeCreatedAt" in data)
    {
        var timeSince = Date.now() - data.passwordResetCodeCreatedAt;
        return timeSince >= PASSWORD_RESET_CODE_EXPIRATION_TIME;
    }

    return false;
}
module.exports.HasPasswordResetCodeExpired = HasPasswordResetCodeExpired;

/**
 * Checks if a user reset their password too recently to change it again.
 * @param {String} username - The username of the account to check.
 * @returns {Boolean} true if the user needs to wait before resetting their password again, false if they don't.
 */
function ResetPasswordTooRecently(username)
{
    if (!UserExists(username))
        return false;

    var data = GetUserData(username);
    if ("lastResetPassword" in data)
    {
        var timeSince = Date.now() - data.lastResetPassword;
        return timeSince < PASSWORD_RESET_COOLDOWN;
    }

    return false; 
}
module.exports.ResetPasswordTooRecently = ResetPasswordTooRecently;

/**
 * Changes a user's account password.
 * @param {String} username - The user of the account to change the password for.
 * @param {String} newPassword - The new password for the user's account.
 * @returns {Boolean} true if the password was changed successfully, false if not.
 */
async function ChangePassword(username, newPassword)
{
    await LockDB();

    try
    {
        if (!UserExists(username))
            throw(`Account for "${username}" doesn't exist`);
        else if (!util.IsValidPassword(newPassword))
            throw(`"${newPassword}" is not a valid password`);

        var data = GetUserData(username);
        data.password = await EncryptPassword(newPassword);
        data.lastResetPassword = Date.now();
        delete data.passwordResetCode;
        delete data.passwordResetCodeCreatedAt;
        StoreUserData(username, data);
        UnlockDB();
        return true;
    }
    catch (e)
    {
        UnlockDB();
        console.log(`An error occurred trying to change the password for ${username}:\n${e}`);
        return false;
    }
}
module.exports.ChangePassword = ChangePassword;

/**
  * Delete's a user's account.
  * @param {String} username - The username of the account to delete.
  * @param {String} password - The user's password to confirm the deletion.
  * @returns {Boolean} - true if the account was deleted successfully, false if not.
  */
async function DeleteUser(username, password)
{
    await LockDB();

    try
    {
        if (!UserExists(username))
            throw(`Account for "${username}" doesn't exist`);
        else if (!(await VerifyCorrectPassword(username, password)))
            throw(`${username} needs the correct password in order to be deleted`);

        var email = GetUserData(username).email;
        StoreUserData(username, {}); //Deletes the file
        RemoveEmailUsernamePairFromTable(email);
        UnlockDB();
        return true;
    }
    catch (e)
    {
        UnlockDB();
        console.log(`An error occurred trying to delete the user account for ${username}:\n${e}`);
        return false;
    }
}
module.exports.DeleteUser = DeleteUser;

/**
 * Gets the last time a user logged into their account.
 * @param {String} username - The username for the account.
 * @returns {Number} - The timestamp (in milliseconds) the user last logged into their account.
 */
 function GetUserLastAccessed(username)
 {
    if (!UserExists(username))
        return 0;

    var data = GetUserData(username);
    return data.lastAccessed;
 }
 module.exports.GetUserLastAccessed = GetUserLastAccessed;
 
/**
 * Updates the timestamp the user last accessed their account.
 * @param {String} username - The username the account is for.
 * @returns {Boolean} - true if the timestamp was updated successfully, false if not.
 */
async function UpdateUserLastAccessed(username)
{
    await LockDB();

    try
    {
        if (!UserExists(username))
            throw(`Account for "${username}" doesn't exist`);

        var data = GetUserData(username);
        data.lastAccessed = Date.now();
        StoreUserData(username, data);
        UnlockDB();
        return true;
    }
    catch (e)
    {
        UnlockDB();
        console.log(`An error occurred trying to update the last accessed time for ${username}:\n${e}`);
        return false;
    }
}
module.exports.UpdateUserLastAccessed = UpdateUserLastAccessed;

/**
 * Gets the account code that's used as an extra layer of security for the user.
 * @param {String} username - The user to get the account code for.
 * @returns {String} The user's account code.
 */
function GetUserAccountCode(username)
{
    if (!UserExists(username))
        return null;

    var data = GetUserData(username);
    return data.accountCode;
}
module.exports.GetUserAccountCode = GetUserAccountCode;

/**
 * Creates a key a user must send when trying to save the Cloud data later on. This prevents issues from opening multiple tabs.
 * @param {String} username - The user to create the key for.
 * @param {Boolean} isRandomizer - Whether or not the Cloud data is for a randomized save file.
 * @returns {String} The key just created.
 */
async function CreateCloudDataSyncKey(username, isRandomizer)
{
    await LockDB();

    try
    {
        if (!UserExists(username))
            throw(`Account for "${username}" doesn't exist`);

        var data = GetUserData(username);
        var key = randomstring.generate({length: 12, charset: "alphanumeric"});

        if (!isRandomizer)
            data.cloudDataSyncKey = key;
        else
            data.cloudDataRandomizerSyncKey = key;

        StoreUserData(username, data);
        UnlockDB();
        return key;
    }
    catch (e)
    {
        UnlockDB();
        throw(`An error occurred trying to create a cloud sync key for ${username}:\n${e}`);
    }
}
module.exports.CreateCloudDataSyncKey = CreateCloudDataSyncKey;

/**
 * Gets the key a user must send when trying to save their Cloud data. This prevents issues from opening multiple tabs.
 * @param {String} username - The user to get the key for.
 * @param {Boolean} isRandomizer - Whether or not the Cloud data is for a randomized save file.
 * @returns {String} The user's key.
 */
async function GetCloudDataSyncKey(username, isRandomizer)
{
    await LockDB();

    try
    {
        if (!UserExists(username))
            throw(`Account for "${username}" doesn't exist`);

        var data = GetUserData(username);
        data = (!isRandomizer) ? data.cloudDataSyncKey : data.cloudDataRandomizerSyncKey;
        UnlockDB();
        return data;
    }
    catch (e)
    {
        UnlockDB();
        console.log(`An error occurred trying to retrieve the cloud sync key for ${username}:\n${e}`);
        return "";
    }
}
module.exports.GetCloudDataSyncKey = GetCloudDataSyncKey;

/**
 * Gets a user's stored Pokemon.
 * @param {String} username - The user to get the Pokemon for.
 * @param {Boolean} isRandomizer - Whether or not to load the randomizer Pokemon or the regular Pokemon.
 * @returns {Array<Object>} A list of Pokemon.
 */
function GetUserCloudBoxes(username, isRandomizer)
{
   if (!UserExists(username))
       return [];

   var data = GetUserData(username);
   return isRandomizer ? data.cloudRandomizerBoxes : data.cloudBoxes;
}
module.exports.GetUserCloudBoxes = GetUserCloudBoxes;

/**
 * Gets the names of the user's stored Boxes.
 * @param {String} username - The user to get the Box names for.
 * @param {Boolean} isRandomizer Whether or not to load the randomizer Box names or the regular Box names.
 * @returns {Array<String>} A list of Box names.
 */
function GetUserCloudTitles(username, isRandomizer)
{
   if (!UserExists(username))
       return [];

   var data = GetUserData(username);
   return isRandomizer ? data.cloudRandomizerTitles : data.cloudTitles;
}
module.exports.GetUserCloudTitles = GetUserCloudTitles;

/**
 * Updates a user's saved Pokemon.
 * @param {String} username - The user to update the Pokemon for.
 * @param {Array<Object>} cloudBoxes - The list of Pokemon to save.
 * @param {Array<String>} cloudTitles - The list of Box names to save.
 * @param {Boolean} isRandomizer - Whether or not the Pokemon saved are from a randomizer.
 * @returns {Boolean} True if the data was saved successfully, false otherwise.
 */
async function SaveAccountCloudData(username, cloudBoxes, cloudTitles, isRandomizer)
{
    if (!UserExists(username))
        return false;

    await LockDB();

    var data = GetUserData(username);
    if (isRandomizer)
    {
        data.cloudRandomizerBoxes = cloudBoxes;
        data.cloudRandomizerTitles = cloudTitles;
    }
    else
    {
        data.cloudBoxes = cloudBoxes;
        data.cloudTitles = cloudTitles;
    }

    StoreUserData(username, data);

    //Confirm data was saved successfully
    var retVal;
    data = GetUserData(username);
    var savedBoxes = isRandomizer ? data.cloudRandomizerBoxes : data.cloudBoxes;
    var savedTitles = isRandomizer ? data.cloudRandomizerTitles : data.cloudTitles;
    
    if (!_.isEqual(savedBoxes, cloudBoxes)
    || !_.isEqual(savedTitles, cloudTitles))
        retVal = false; //Data was not saved successfully
    else
        retVal = true;

    UnlockDB();
    return retVal;
}
module.exports.SaveAccountCloudData = SaveAccountCloudData;

/**
 * Checks if a user is allowed to Wonder Trade.
 * @param {String} username - The user to check is banned.
 * @returns {Boolean} true if the user has been banned, false if they can still trade.
 */
 function IsUserBannedFromWonderTrade(username)
 {
    if (!UserExists(username))
        return false;
 
    var data = GetUserData(username);
    return "wonderTradeBan" in data && data.wonderTradeBan;
 }
 module.exports.IsUserBannedFromWonderTrade = IsUserBannedFromWonderTrade;
 
/**
 * Bans a user from partaking in Wonder Trade.
 * @param {String} username - The user to ban.
 * @returns {Boolean} true if the user was successfully banned, false if there was a problem banning them.
 */
 async function BanUserFromFromWonderTrade(username)
 {
    await LockDB();

    try
    {
        if (!UserExists(username))
            throw(`Account for "${username}" doesn't exist`);

        var data = GetUserData(username);
        data.wonderTradeBan = true;
        StoreUserData(username, data);
        UnlockDB();
        return true;
    }
    catch (e)
    {
        UnlockDB();
        console.log(`An error occurred trying to ban the user ${username} from Wonder Trade:\n${e}`);
        return false;
    }
 }
 module.exports.BanUserFromFromWonderTrade = BanUserFromFromWonderTrade;
 