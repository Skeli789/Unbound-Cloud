/*
    Various utility functions for the server.
*/

const md5 = require('md5');


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
 * Calculates the checksum hash for a Pokemon.
 * @param {Pokemon} pokemon - The Pokemon to calculate the checksum for.
 * @returns {String} The hash value of the Pokemon.
 */
function CalculateMonChecksum(pokemon)
{
    pokemon = Object.assign({}, pokemon); //Don't modify the original Pokemon

    delete pokemon.markings //These can be changed on the site so shouldn't be included in the checksum
    delete pokemon.checksum //Don't include an older calculated checksum

    return md5(PythonJSONStringify(pokemon) + "TODO: Use env var"); //Add "TODO" on so people can't create their own checksums with the original data
}
module.exports.CalculateMonChecksum = CalculateMonChecksum;

/**
 * Checks if a Pokemon object is a valid Pokemon.
 * @param {Pokemon} pokemon - The Pokemon to check.
 * @param {Boolean} canBeNull - Allows a null object to be considered valid if true.
 * @returns {Boolean} true if the Pokemon is valid, false otherwise.
 */
function ValidatePokemon(pokemon, canBeNull)
{
    if (pokemon == null)
        return canBeNull;

    return "checksum" in pokemon
        && pokemon.checksum == CalculateMonChecksum(pokemon);
}
module.exports.ValidatePokemon = ValidatePokemon;
