/*
    Various utility functions for the server.
*/

const pokemonUtil = require('./pokemon-util');
const gBannedWords = require('./src/data/BannedWords.json');
const gSpeciesNames = require('./src/data/SpeciesNames.json');

const MAX_TITLE_LENGTH = 16;
const HIGHEST_HOME_BOX_NUM = 100;
const MONS_PER_BOX = 30;


/**
 * Mimics the functionality of Python's json.dumps.
 * JSON.stringify does not add minimal pretty printing like Python's json.dumps, so this adds that functionality.
 * @param {Pokemon} pokemon - The Pokemon to convert to a string.
 * @returns {String} The json.dumps equivalent of the Pokemon.
 */
function PythonJSONStringify(pokemon)
{
    var finalText = ""
    pokemon = Object.keys(pokemon).sort().reduce( //Sort the keys alphabetically
        (obj, key) => { 
          obj[key] = pokemon[key]; 
          return obj;
        }, 
        {}
    );
    const text = JSON.stringify(pokemon, null, 1);

    for (let line of text.split("\n"))
        finalText += line.trim() + " ";
    
    return finalText.replaceAll("{ ", "{").replaceAll(" }", "}").replaceAll("[ ", "[").replaceAll(" ]", "]").trim();
}
module.exports.PythonJSONStringify = PythonJSONStringify;

/**
 * Checks if a piece of text has a bad word in it.
 * @param {String} textToCheck - The text to check for the bad word.
 * @returns {Boolean} True if the text contains a bad word. False otherwise.
 */
function BadWordInText(textToCheck)
{
    textToCheck = textToCheck.toUpperCase();
    var textToCheckWords = textToCheck.split(" ");

    for (let bannedWord of Object.keys(gBannedWords))
    {
        let checkContaining = gBannedWords[bannedWord];

        if (checkContaining) //The banned word cannot be present in the name at all
        {
            let allLetters = textToCheck.replace(" ", "").replace("-", "").replace(".", "");
            if (allLetters.includes(bannedWord))
                return true; //Includes a banned string
        }
        else //Entire word matches
        {
            for (let text of textToCheckWords)
            {
                if (text === bannedWord)
                    return true; //Has a bad word entirely in its name
            }
        }
    }

    return false;
}
module.exports.BadWordInText = BadWordInText;

/**
 * Gets the pretty name like "Venusaur" for a species id.
 * @param {String} species - The species' STRING_BASED id.
 * @returns {String} The name of the item.
 */
function GetSpeciesName(species)
{
    if (typeof(species) == "string")
    {
        if (species in gSpeciesNames)
            return gSpeciesNames[species];
    }

    return "Unknown Species";
}
module.exports.GetSpeciesName = GetSpeciesName;

/**
 * Checks if an entered email is considered a valid email.
 * @param {String} email - The email to check.
 * @returns {Boolean} true if the entered value is a valid email address, false if not.
 */
function IsValidEmail(email)
{
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return typeof(email) === "string"
        && re.test(String(email).toLowerCase());
}
module.exports.IsValidEmail = IsValidEmail;

/**
 * Checks if an entered username is considered a valid username.
 * @param {String} username - The username to check.
 * @returns {Boolean} true if the entered value is a valid username, false if not.
 */
function IsValidUsername(username)
{
    const pattern = new RegExp(/^[\x00-\x7F]*$/); //Only first 128 ascii characters

    return typeof(username) === "string"
        && username.length >= 3
        && username.length <= 20
        && !username.includes(`"`)
        && !username.includes(`'`)
        && !username.includes("`")
        && !username.includes("<")
        && !username.includes(">")
        && pattern.test(username);
}
module.exports.IsValidUsername = IsValidUsername;
 
/**
 * Checks if an entered password is considered a valid password.
 * @param {String} password - The password to check.
 * @returns {Boolean} true if the entered value is a valid password, false if not.
 */
function IsValidPassword(password)
{
    return typeof(password) === "string"
        && password.length >= 6
        && password.length <= 20;
}
module.exports.IsValidPassword = IsValidPassword;

/**
 * Checks a list of Pokemon to confirm they're all valid.
 * @param {Array<Object>} cloudBoxes - A list of Pokemon objects.
 * @returns {Boolean} - True if the Pokemon were all validated successfully, false if not.
 */
function ValidateCloudBoxes(cloudBoxes)
{
    try
    {
        if (cloudBoxes.length > MONS_PER_BOX * HIGHEST_HOME_BOX_NUM)
            throw(`Too many Pokemon in the Cloud boxes (${cloudBoxes.length})`);

        for (var pokemon of cloudBoxes)
        {
            if (!pokemonUtil.ValidatePokemon(pokemon, canBeNull=false, canBeBlank=true))
                return false;
        }

        return true;
    }
    catch (err)
    {
        console.log(`An error occurred trying to validate the Cloud Boxes:\n${err}`);
        return false;
    }
}
module.exports.ValidateCloudBoxes = ValidateCloudBoxes;

/**
 * Checks a list of Box names to confirm they're all valid.
 * @param {Array<Strings>} cloudTitles - A list of Box names.
 * @returns {Boolean} - True if the titles were all validated successfully, false if not.
 */
 function ValidateCloudTitles(cloudTitles)
 {
    try
    {
        if (typeof(cloudTitles) !== "object") //In this case Array<String>
            return false;

        for (var title of cloudTitles)
        {
            if (typeof(title) !== "string"
            || title === ""
            || title.length > MAX_TITLE_LENGTH)
                return false;
        }

        return true;
    }
    catch (err)
    {
        console.log(`An error occurred trying to validate the Cloud Titles:\n${err}`);
        return false;
    }
 }
 module.exports.ValidateCloudTitles = ValidateCloudTitles;
 