/*
    Pokemon data utility functions for the server.
*/

const md5 = require('md5');
const util = require('./util');
const gBaseFriendship = require('./src/data/BaseFriendship.json');
const gTradeEvolutions = require('./src/data/TradeEvolutions.json');


/**
 * Calculates the checksum hash for a Pokemon.
 * @param {Pokemon} pokemon - The Pokemon to calculate the checksum for.
 * @returns {String} The hash value of the Pokemon.
 */
function CalculateMonChecksum(pokemon)
{
    pokemon = Object.assign({}, pokemon); //Don't modify the original Pokemon

    delete pokemon.markings; //These can be changed on the site so shouldn't be included in the checksum
    delete pokemon.checksum; //Don't include an older calculated checksum
    delete pokemon.wonderTradeTimestamp; //Don't include an added-on Wonder Trade timestamp

    return md5(util.PythonJSONStringify(pokemon) + "TODO: Use env var"); //Add "TODO" on so people can't create their own checksums with the original data
}
module.exports.CalculateMonChecksum = CalculateMonChecksum;
 
 /**
  * Checks if a Pokemon object is a valid Pokemon.
  * @param {Pokemon} pokemon - The Pokemon to check.
  * @param {Boolean} canBeNull - Allows a null object to be considered valid if true.
  * @param {Boolean} canBeBlank - Allows a Pokemon where all fields are blank to be considered valid.
  * @returns {Boolean} true if the Pokemon is valid, false otherwise.
  */
function ValidatePokemon(pokemon, canBeNull=false, canBeBlank=false)
{
    if (pokemon == null)
        return canBeNull;

    if (canBeBlank)
    {
        var allBlank = true;

        for (let key of Object.keys(pokemon))
        {
            if (pokemon[key] !== ""
            &&  pokemon[key] !== 0
            &&  pokemon[key] != null)
            {
                allBlank = false;
                break;
            }
        }

        if (allBlank)
            return true;
    }

    return "checksum" in pokemon
        && pokemon.checksum == CalculateMonChecksum(pokemon);
}
module.exports.ValidatePokemon = ValidatePokemon;

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon is in an Egg. False if it's not.
 */
function IsEgg(pokemon)
{
    let dataMember = "isEgg";

    if (IsBadEgg(pokemon))
        return true;

    if (ValidatePokemon(pokemon) && dataMember in pokemon)
    {
        let isEgg = pokemon[dataMember];

        if (typeof(isEgg) === "boolean")
            return isEgg;
        else if (typeof(isEgg) === "number")
            return isEgg !== 0;
    }

    return IsBadEgg(pokemon);
}
module.exports.IsEgg = IsEgg;
 
 /**
  * @param {Pokemon} pokemon - The Pokemon to process.
  * @returns {Boolean} True if the Pokemon is a Bad Egg. False if it's not.
  */
function IsBadEgg(pokemon)
{
    let dataMember = "isBadEgg";

    if (ValidatePokemon(pokemon) && dataMember in pokemon)
    {
        let isBadEgg = pokemon[dataMember];

        if (typeof(isBadEgg) === "boolean")
            return isBadEgg;
        else if (typeof(isBadEgg) === "number")
            return isBadEgg !== 0;
    }

    return false;
}
module.exports.IsBadEgg = IsBadEgg;

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's species id.
 */
function GetSpecies(pokemon)
{
    let dataMember = "species";

    if (ValidatePokemon(pokemon, false) && dataMember in pokemon)
        return pokemon[dataMember];

    return "SPECIES_NONE";
}
module.exports.GetSpecies = GetSpecies;

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's item id.
 */
function GetItem(pokemon)
{
    let dataMember = "item";

    if (ValidatePokemon(pokemon) && dataMember in pokemon && typeof(pokemon[dataMember]) === "string")
        return pokemon[dataMember];

    return "ITEM_NONE";
}
module.exports.GetItem = GetItem;

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The base friendship value for Pokemon of the same species. 
 */
function GetBaseFriendship(pokemon)
{
    var species = GetSpecies(pokemon);
    if (species in gBaseFriendship)
        return gBaseFriendship[species];

    return 50; //Default value
}
module.exports.GetBaseFriendship = GetBaseFriendship;

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @param {Number} newFriendship - The new friendship value to set for the Pokemon.
 */
function SetFriendship(pokemon, newFriendship)
{
    if (ValidatePokemon(pokemon) && typeof(newFriendship) === "number")
    {
        pokemon.friendship = Math.min(newFriendship, 0xFF);
        pokemon.checksum = CalculateMonChecksum(pokemon);
    }
}
module.exports.SetFriendship = SetFriendship;

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @param {Boolean} useAltName - Whether to use the alternate Showdown name or not.
 * @returns {String} The Pokemon's species name.
 */
function GetMonSpeciesName(pokemon, useAltName=false)
{
    return util.GetSpeciesName(GetSpecies(pokemon), useAltName);
}
module.exports.GetMonSpeciesName = GetMonSpeciesName;

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's nickname.
 */
function GetNickname(pokemon)
{
    let dataMember = "nickname";

    if (ValidatePokemon(pokemon) && dataMember in pokemon)
    {
        let nickname = pokemon[dataMember];

        if (typeof(nickname) === "string")
            return nickname.substring(0, 10);
    }

    return util.GetSpeciesName(GetSpecies(pokemon));
}
module.exports.GetNickname = GetNickname;

/**
 * Changes a Pokemon's nickname
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @param {String} newNickname - The new nickname to give the Pokemon.
 */
function SetPokemonNickname(pokemon, newNickname)
{
    if (ValidatePokemon(pokemon, false) && typeof(newNickname) === "string")
    {
        pokemon.nickname = newNickname.substring(0, 10); //Max 10 characters
        pokemon.checksum = CalculateMonChecksum(pokemon);
    }
}
module.exports.SetPokemonNickname = SetPokemonNickname;

/**
 * Changes a Pokemon's nickname to match its species name.
 * @param {Pokemon} pokemon - The Pokemon to process.
 */
function GivePokemonSpeciesName(pokemon)
{
    SetPokemonNickname(pokemon, util.GetSpeciesName(GetSpecies(pokemon)))
}
module.exports.GivePokemonSpeciesName = GivePokemonSpeciesName;

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's original Trainer's name.
 */
function GetOTName(pokemon)
{
    let dataMember = "otName";

    if (ValidatePokemon(pokemon) && dataMember in pokemon)
    {
        let otName = pokemon[dataMember];

        if (typeof(otName) === "string")
            return otName;
    }

    return "Unknown";
}
module.exports.GetOTName = GetOTName;

/**
 * Changes a Pokemon's original Trainer name.
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @param {String} newOTName - The new name to give for the original Trainer.
 */
function SetOTName(pokemon, newOTName)
{
    if (ValidatePokemon(pokemon)  && typeof(newOTName) === "string")
    {
        pokemon.otName = newOTName.substring(0, 7); //Max 7 characters
        pokemon.checksum = CalculateMonChecksum(pokemon);
    }
}
module.exports.SetOTName = SetOTName;

/**
 * Gives a Pokemon its species name as a nickname if its current nickname has a bad word in it.
 * @param {Pokemon} newPokemon - The Pokemmon to check.
 */
function ReplaceNicknameWithSpeciesNameIfNeeded(pokemon)
{
    if (util.BadWordInText(GetNickname(pokemon))
    || util.HasNonNicknameCharacter(GetNickname(pokemon)))
        GivePokemonSpeciesName(pokemon);
}
module.exports.ReplaceNicknameWithSpeciesNameIfNeeded = ReplaceNicknameWithSpeciesNameIfNeeded;
 
/**
 * Gives a Pokemon a generic OT name as a nickname if its current OT name has a bad word in it.
 * @param {Pokemon} pokemon - The Pokemmon to check.
 */
function ReplaceOTNameWithGenericNameIfNeeded(pokemon)
{
    if (util.BadWordInText(GetOTName(pokemon))
    || util.HasNonNicknameCharacter(GetOTName(pokemon)))
    {
        let replacementOTNames = ["Red", "Blue", "Green", "Yellow", "Gold", "Silver", "Crystal", "Ruby", "Emerald", "Diamond", "Pearl", "Black", "White"];
        SetOTName(pokemon, replacementOTNames[Math.floor(Math.random() * replacementOTNames.length)]);
    }
}
module.exports.ReplaceOTNameWithGenericNameIfNeeded = ReplaceOTNameWithGenericNameIfNeeded;

/**
 * Tries to evolve a Pokemon after it was traded.
 * @param {Pokemon} pokemon - The Pokemon to evolve.
 * @param {String} tradedWithSpecies - The original species it was traded with.
 */
function TryActivateTradeEvolution(pokemon, tradedWithSpecies)
{
    var newSpecies = "";
    var monSpecies = GetSpecies(pokemon);
    var removeItemPostEvo = false;

    if (IsEgg(pokemon) || GetItem(pokemon) === "ITEM_EVERSTONE")
        return;

    for (let species of Object.keys(gTradeEvolutions))
    {
        if (species === monSpecies)
        {
            for (let method of gTradeEvolutions[species])
            {
                if ("item" in method)
                {
                    if (GetItem(pokemon) !== method.item) //Not holding required item
                        continue;

                    removeItemPostEvo = true;
                }
                else if ("withSpecies" in method)
                {
                    if (tradedWithSpecies !== method.withSpecies) //Not traded with the correct species for evolution
                        continue;
                }

                newSpecies = method.toSpecies;
                break;
            }

            break;
        }
    }

    if (newSpecies !== "") //Pokemon evolves via trading it
    {
        pokemon.species = newSpecies;
        pokemon.checksum = CalculateMonChecksum(pokemon); //So GivePokemonSpeciesName works

        if (GetNickname(pokemon) === util.GetSpeciesName(monSpecies)) //Using default name
            GivePokemonSpeciesName(pokemon); //Give evolution's default name

        if (removeItemPostEvo)
            pokemon.item = "ITEM_NONE";

        pokemon.checksum = CalculateMonChecksum(pokemon);
    }
}
module.exports.TryActivateTradeEvolution = TryActivateTradeEvolution;

/**
 * Modifies a Pokemon after a Wonder Trade or GTS trade becuase of things like friendship and trade evolutions.
 * @param {Pokemon} pokemon - The Pokemmon to update.
 * @param {Pokemon} tradedWith - The Pokemmon it was traded with.
 */
function UpdatePokemonAfterNonFriendTrade(pokemon, tradedWith)
{
    SetFriendship(pokemon, GetBaseFriendship(pokemon)); //Reset after being traded
    TryActivateTradeEvolution(pokemon, GetSpecies(tradedWith));
    ReplaceNicknameWithSpeciesNameIfNeeded(pokemon);
    ReplaceOTNameWithGenericNameIfNeeded(pokemon);
}
module.exports.UpdatePokemonAfterNonFriendTrade = UpdatePokemonAfterNonFriendTrade;

/**
 * Modifies a Pokemon after a friend trade becuase of things like friendship and trade evolutions.
 * @param {Pokemon} pokemon - The Pokemmon to update.
 * @param {Pokemon} tradedWith - The Pokemmon it was traded with.
 */
function UpdatePokemonAfterFriendTrade(pokemon, tradedWith)
{
    SetFriendship(pokemon, GetBaseFriendship(pokemon)); //Reset after being traded
    TryActivateTradeEvolution(pokemon, GetSpecies(tradedWith));
}
module.exports.UpdatePokemonAfterFriendTrade = UpdatePokemonAfterFriendTrade;
