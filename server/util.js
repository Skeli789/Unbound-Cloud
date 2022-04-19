/*
    Various utility functions for the server.
*/

const gBannedWords = require('./src/data/BannedWords.json');
const gSpeciesNames = require('./src/data/SpeciesNames.json');


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
