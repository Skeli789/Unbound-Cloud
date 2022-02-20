/**
 * Various utility functions related to Pokemon data.
 */

import ItemNames from "./data/ItemNames.json";
import MoveData from "./data/MoveData.json";
import NatureNames from "./data/NatureNames.json";
import SpeciesDefines from "./data/UnboundSpecies.json";
import {BASE_GFX_LINK, GetSpeciesName} from "./Util";

const SPECIES_FORMS_ICON_NAMES =
{
    "SPECIES_PIKACHU_CAP_ORIGINAL": "pikachu-original-cap",
    "SPECIES_PIKACHU_CAP_HOENN": "pikachu-hoenn-cap",
    "SPECIES_PIKACHU_CAP_SINNOH": "pikachu-sinnoh-cap",
    "SPECIES_PIKACHU_CAP_UNOVA": "pikachu-unova-cap",
    "SPECIES_PIKACHU_CAP_KALOS": "pikachu-kalos-cap",
    "SPECIES_PIKACHU_CAP_ALOLA": "pikachu-alola-cap",
    "SPECIES_PIKACHU_CAP_PARTNER": "pikachu-partner-cap",
    "SPECIES_PICHU_SPIKY": "pichu-spiky-eared",
    "SPECIES_HIPPOPOTAS_F": "female/hippopotas",
    "SPECIES_HIPPOWDON_F": "female/hippowdon",
    "SPECIES_ARCEUS_FIGHT": "arceus-fighting",
    "SPECIES_UNFEZANT_F": "female/unfezant",
    "SPECIES_BASCULIN_RED": "basculin",
    "SPECIES_BASCULIN_BLUE": "basculin-blue-striped",
    "SPECIES_FRILLISH_F": "female/frillish",
    "SPECIES_JELLICENT_F": "female/jellicent",
    "SPECIES_PYROAR_FEMALE": "female/pyroar",
    "SPECIES_FURFROU_PHAROAH": "furfrou-pharaoh",
    "SPECIES_MEOWSTIC_FEMALE": "female/meowstic",
    "SPECIES_PUMPKABOO": "pumpkaboo-small",
    "SPECIES_PUMPKABOO_XL": "pumpkaboo-super",
    "SPECIES_PUMPKABOO_L": "pumpkaboo-large",
    "SPECIES_PUMPKABOO_M": "pumpkaboo",
    "SPECIES_GOURGEIST": "gourgeist-small",
    "SPECIES_GOURGEIST_XL": "gourgeist-super",
    "SPECIES_GOURGEIST_L": "gourgeist-large",
    "SPECIES_GOURGEIST_M": "gourgeist",
    "SPECIES_VIVILLON_POKEBALL": "vivillon-poke-ball",
    "SPECIES_ORICORIO_Y": "oricorio-pom-pom",
    "SPECIES_ORICORIO_P": "oricorio-pau",
    "SPECIES_ORICORIO_S": "oricorio-sensu",
    "SPECIES_LYCANROC_N": "lycanroc-midnight",
    "SPECIES_SILVALLY_FIGHT": "silvally-fighting",
    "SPECIES_NECROZMA_DUSK_MANE": "necrozma-dusk",
    "SPECIES_NECROZMA_DAWN_WINGS": "necrozma-dawn",
    "SPECIES_MAGEARNA_P": "magearna-original",
    "SPECIES_SINISTEA_CHIPPED": "sinistea",
    "SPECIES_POLTEAGEIST_CHIPPED": "polteageist",
    "SPECIES_ALCREMIE_STRAWBERRY": "alcremie",
    "SPECIES_ALCREMIE_BERRY": "alcremie-vanilla-cream-berry",
    "SPECIES_ALCREMIE_CLOVER": "alcremie-vanilla-cream-clover",
    "SPECIES_ALCREMIE_FLOWER": "alcremie-vanilla-cream-flower",
    "SPECIES_ALCREMIE_LOVE": "alcremie-vanilla-cream-love",
    "SPECIES_ALCREMIE_RIBBON": "alcremie-vanilla-cream-ribbon",
    "SPECIES_ALCREMIE_STAR": "alcremie-vanilla-cream-star",
    "SPECIES_INDEEDEE_FEMALE": "female/indeedee",
    "SPECIES_URSHIFU_SINGLE": "urshifu",
    "SPECIES_URSHIFU_RAPID": "urshifu",
};

const BASE_FORMS_OF_BANNED_SPECIES = //All forms that can't exist outside of battle
{
    "SPECIES_CHERRIM_SUN": "SPECIES_CHERRIM",
    "SPECIES_DARMANITANZEN": "SPECIES_DARMANITAN",
    "SPECIES_DARMANITAN_G_ZEN": "SPECIES_DARMANITAN_G",
    "SPECIES_MELOETTA_PIROUETTE": "SPECIES_MELOETTA",
    "SPECIES_AEGISLASH_BLADE": "SPECIES_AEGISLASH",
    "SPECIES_ASHGRENINJA": "SPECIES_GRENINJA",
    "SPECIES_CRAMORANT_GULPING": "SPECIES_CRAMORANT",
    "SPECIES_CRAMORANT_GORGING": "SPECIES_CRAMORANT",
    "SPECIES_EISCUE_NOICE": "SPECIES_EISCUE",
    "SPECIES_ZACIAN_CROWNED": "SPECIES_ZACIAN",
    "SPECIES_ZAMAZENTA_CROWNED": "SPECIES_ZAMAZENTA",
    "SPECIES_ETERNATUS_ETERNAMAX": "SPECIES_ETERNATUS",
};

export const MAX_LEVEL = 100;
export const HEART_FRIENDSHIP = 220;
export const MAX_FRIENDSHIP = 255;
const NUM_UNOWN_FORMS = 28;
const PP_BONUS_MASK = [0x03, 0x0C, 0x30, 0xC0];


/**********************************
          Helper Functions         
**********************************/

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the object could be a valid Pokemon object. False if it couldn't be.
 */
export function IsValidPokemon(pokemon)
{
    return pokemon != null
        && typeof(pokemon) === "object";
}

/**
 * Gets whether or not a variable contains an actual gender id.
 * @param {String} gender - The string to check.
 * @returns {Boolean} True if the gender id is valid. False if it's not.
 */
function IsValidGenderId(gender)
{
    return gender === "M"
        || gender === "F"
        || gender === "U"; //Unknown
}
 
 /**
  * Gets whether or not a variable contains a valid level number.
  * @param {Number} level - The number to check.
  * @returns {Boolean} True if the level is valid. False otherwise.
  */
function IsValidLevel(level)
{
    return typeof(level) === "number"
        && level >= 1
        && level <= MAX_LEVEL;
}

/**
 * Checks if an EV is valid.
 * @param {Number} ev - The EV to check.
 * @returns {Boolean} True if the EV is valid. False otherwise.
*/
function IsValidEV(ev)
{
    return typeof(ev) === "number" && ev >= 0 && ev <= 255;
}

/**
 * Gets whether or not a variable contains a valid item id.
 * @param {String} item - The item to check.
 * @returns {Boolean} True if the item is valid. False otherwise.
 */
function IsValidItemId(item)
{
    return item in ItemNames;
}
 
 /**
  * Gets whether or not a variable contains a valid nature number.
  * @param {Number} nature - The nature number to check.
  * @returns {Boolean} True if the nature number is valid. False otherwise.
  */
function IsValidNatureNumber(nature)
{
    return nature in NatureNames;
}

/**
 * Checks if a species was introduced in Gen 8.
 * @param {String} species - The species to check.
 * @returns {Boolean} True if the species was introduced in Gen 8. False for any other Gen.
 */
function IsSpeciesGen8(species)
{
    if (species in SpeciesDefines)
        return SpeciesDefines[species] >= SpeciesDefines["SPECIES_GROOKEY"];
    else if (typeof(species) === "number")
        return species >= SpeciesDefines["SPECIES_GROOKEY"];

    return false;
}

/**
 * Checks if an array contains only integers and is a certain size.
 * @param {Array} array - The array to check.
 * @param {Number} length - The expected length of the array.
 * @returns {Boolean} True if the array is valid. False otherwise.
 */
function IsIntArrayWithSizeAndBounds(array, length, lowerBound, upperBound)
{
    if (!Array.isArray(array) || array.length !== length)
        return false;

    for (let i of array)
    {
        if (typeof(i) !== "number" || i < lowerBound || i > upperBound)
            return false;
    }

    return true;
}


/**********************************
        Mon Getter Functions       
**********************************/

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's species id.
 */
export function GetSpecies(pokemon)
{
    let dataMember = "species";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
        return pokemon[dataMember];

    return "SPECIES_NONE";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon is a dummy object. False if it's a real Pokemon.
 */
export function IsBlankMon(pokemon)
{
    var species = GetSpecies(pokemon);

    return species === ""
        || species === 0
        || species === "SPECIES_NONE";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's gender. Either M, F, or U.
 */
export function GetGender(pokemon)
{
    let dataMember = "gender";

    if (IsValidPokemon(pokemon) && "gender" in pokemon)
    {
        if (IsValidGenderId(pokemon[dataMember]))
            return pokemon[dataMember];
    }

    return "U";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon is Female. False if it's not.
 */
export function IsFemale(pokemon)
{
    return GetGender(pokemon) === "F";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The Pokemon's nature number.
 */
export function GetNature(pokemon)
{
    let dataMember = "nature";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let nature = pokemon[dataMember];

        if (IsValidNatureNumber(nature))
            return nature;
    }

    return 0;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The Pokemon's nature number that affects its stats (eg. after Nature Mint).
 */
 export function GetVisibleNature(pokemon)
 {
     let dataMember = "natureMint";
 
     if (IsValidPokemon(pokemon) && dataMember in pokemon)
     {
         let nature = pokemon[dataMember];
 
         if (IsValidNatureNumber(nature))
             return nature;
     }
 
     return GetNature(pokemon);
 }

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's Ability id.
 */
export function GetAbility(pokemon)
{
    let dataMember = "ability";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
        return pokemon[dataMember];

    return "ABILITY_NONE";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's item id.
 */
export function GetItem(pokemon)
{
    let dataMember = "item";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let item = pokemon[dataMember];

        if (IsValidItemId(item))
            return item;
    }

    return "ITEM_NONE";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon is holding an item. False otherwise.
 */
export function IsMonHoldingItem(pokemon)
{
    return GetItem(pokemon) !== "ITEM_NONE";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Array <String>} The list of move ids the Pokemon knows.
 */
export function GetMoves(pokemon)
{
    let dataMember = "moves";
    let returnMoves = [];

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let moves = pokemon[dataMember];

        if (Array.isArray(moves))
        {
            for (let move of moves)
            {
                if (move in MoveData)
                    returnMoves.push(move);
                else
                    returnMoves.push("MOVE_NONE");
            }
        }
    }

    return returnMoves;  
}

/**
 * Gets the PP number for a certain move.
 * @param {Pokemon} pokemon - The Pokemon that knows the move.
 * @param {String} move - The move id to get the PP for.
 * @param {Number} moveIndex - The index number of the move in the Pokemon's move list.
 * @returns {Number} The PP with bonuses for the requested move.
 */
export function GetMovePP(pokemon, move, moveIndex)
{
    var basePP = (move in MoveData) ? MoveData[move]["pp"] : 0;

    if (IsValidPokemon(pokemon))
    {
        var ppBonuses = GetPPBonuses(pokemon);
        var ppBonus = (moveIndex < PP_BONUS_MASK.length) ? (PP_BONUS_MASK[moveIndex] & ppBonuses) >> (2 * moveIndex) : 0;
        return Math.min(Math.floor(basePP + ((basePP * 20 * ppBonus) / 100), 99));
    }

    return basePP;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} A bitfield representing the Pokemon's PP bonuses.
 */
export function GetPPBonuses(pokemon)
{
    let dataMember = "ppBonuses";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let ppBonuses = pokemon[dataMember];

        if (typeof(ppBonuses) === "number" && ppBonuses >= 0)
            return ppBonuses;
    }

    return 0;   
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The Pokemon's level.
 */
export function GetLevel(pokemon)
{
    let dataMember = "level";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let level = pokemon[dataMember];

        if (IsValidLevel(level))
            return level;
    }

    return 1;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The level the Pokemon was obtained at.
 */
export function GetMetLevel(pokemon)
{
    let level = 0;

    if (IsValidPokemon(pokemon))
    {
        if ("metLevel" in pokemon)
            level = pokemon["metLevel"];
        else if ("metInfo" in pokemon) //Old data format
            level = pokemon["metInfo"] & 0x7F; //Bottom 7 bits
    }

    if (IsValidLevel(level) || level === 0) //0 means hatched
        return level;

    return 0;
}

export function GetFriendship(pokemon)
{
    let dataMember = "friendship";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let friendship = pokemon[dataMember];

        if (typeof(friendship) === "number" && friendship >= 0 && friendship <= MAX_FRIENDSHIP)
            return friendship;
    }

    return 0;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon is in an Egg. False if it's not.
 */
export function IsEgg(pokemon)
{
    let dataMember = "isEgg";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let isEgg = pokemon[dataMember];

        if (typeof(isEgg) === "boolean")
            return isEgg;
        else if (typeof(isEgg) === "number")
            return isEgg !== 0;
    }

    return IsBadEgg(pokemon);
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon is a Bad Egg. False if it's not.
 */
export function IsBadEgg(pokemon)
{
    let dataMember = "isBadEgg";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let isBadEgg = pokemon[dataMember];

        if (typeof(isBadEgg) === "boolean")
            return isBadEgg;
        else if (typeof(isBadEgg) === "number")
            return isBadEgg !== 0;
    }

    return false;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon is Shiny. False if it's not.
 */
export function IsShiny(pokemon)
{
    let dataMember = "shiny";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let shiny = pokemon[dataMember];

        if (typeof(shiny) === "boolean")
            return shiny;
    }

    return false;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The Pokemon's Pokerus strain id.
 */
function GetPokerusStrain(pokemon)
{
    let dataMember = "pokerus";

    if (IsValidPokemon(pokemon) &&dataMember in pokemon)
    {
        let pokerus = pokemon[dataMember];

        if (typeof(pokerus) === "number")
            return pokerus & 0xF0;
    }
    
    return 0;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The time left for the Pokemon's Pokerus.
 */
function GetPokerusTimer(pokemon)
{
    let dataMember = "pokerus";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let pokerus = pokemon[dataMember];

        if (typeof(pokerus) === "number")
            return pokerus & 0x0F;
    }

    return 0;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon has Pokerus currently. False if it never had or was cured.
 */
export function HasPokerus(pokemon)
{
    return GetPokerusStrain(pokemon) !== 0 //Valid strian
        && GetPokerusTimer(pokemon) !== 0; //Hasn't worn off yet
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon has had Pokerus in the past. False if it never had.
 */
export function WasCuredOfPokerus(pokemon)
{
    return GetPokerusStrain(pokemon) !== 0 //Valid strian
        && GetPokerusTimer(pokemon) === 0; //Has worn off
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's nickname.
 */
export function GetNickname(pokemon)
{
    let dataMember = "nickname";

    if (IsEgg(pokemon))
        return "Egg";

    if (IsBadEgg(pokemon))
        return "Bad Egg";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let nickname = pokemon[dataMember];

        if (typeof(nickname) === "string")
            return nickname;
    }

    return GetSpeciesName(GetSpecies(pokemon));
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's original Trainer's name.
 */
export function GetOTName(pokemon)
{
    let dataMember = "otName";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let otName = pokemon[dataMember];

        if (typeof(otName) === "string")
            return otName;
    }

    return "Unknown";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's original Trainer's gender. Should be M or F, can be U.
 */
export function GetOTGender(pokemon)
{
    if (IsValidPokemon(pokemon))
    {
        let dataMember = "otGender";
        if (dataMember in pokemon)
        {
            let otGender = pokemon[dataMember];

            if (IsValidGenderId(otGender))
                return otGender;
        }

        dataMember = "metInfo";
        if (dataMember in pokemon)
        {
            let metInfo = pokemon[dataMember];

            if (typeof(metInfo) === "number")
            {
                if ((metInfo & 0x8000) !== 0) //Top bit - old data format
                    return "F";
                else
                    return "M";
            }
        }
    }

    return "U";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The visible part of a Pokemon's Trainer Id (not including secret id).
 */
export function GetVisibleOTId(pokemon)
{
    let dataMember = "otId";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let otId = pokemon[dataMember];

        if (typeof(otId) === "number")
            return otId & 0xFFFF; //Lower half
    }

    return 0;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The ball type the Pokemon was caught in.
 */
export function GetCaughtBall(pokemon)
{
    let dataMember = "pokeBall";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let ball = pokemon[dataMember];

        if (typeof(ball) === "string" && ball.startsWith("BALL_TYPE_") && ball.endsWith("_BALL"))
            return ball;
    }

    return "BALL_TYPE_POKE_BALL";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Array <Boolean>} The shapes the Pokemon is marked with.
 */
export function GetMarkings(pokemon)
{
    let dataMember = "markings";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let markings = pokemon[dataMember];

        if (typeof(markings) === "number")
        {
            return [
                (markings & 1) !== 0,
                (markings & 2) !== 0,
                (markings & 4) !== 0,
                (markings & 8) !== 0,
            ];
        }
    }

    return [false, false, false, false];
}

/**
 * Marks or unmarks one of a Pokemon's markings.
 * @param {Pokemon} pokemon - The Pokemon to mark.
 * @param {Number} i - The symbole id to change the marking for.
 */
export function ChangeMarking(pokemon, i)
{
    let finalMarkings = 0;
    let markings = GetMarkings(pokemon);
    markings[i] = !markings[i];

    for (let i = 0; i < markings.length; ++i)
    {
        if (markings[i])
            finalMarkings |= (1 << i);
    }

    pokemon["markings"] = finalMarkings;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The letter id of the Pokemon's Unown letter.
 */
export function GetUnownLetter(pokemon)
{
    if (IsValidPokemon(pokemon))
    {
        let dataMember = "unownLetter";
        if (dataMember in pokemon)
        {
            let unownLetter = pokemon[dataMember];

            if (typeof(unownLetter) === "number")
                return unownLetter;
        }

        dataMember = "personality";
        if (dataMember in pokemon)
        {
            let personality = pokemon[dataMember];

            if (typeof(personality) === "number")
            {
                return (((personality & 0x3000000) >> 18)
                      | ((personality & 0x0030000) >> 12)
                      | ((personality & 0x0000300) >>  6)
                      | ((personality & 0x0000003) >>  0)) % NUM_UNOWN_FORMS;
            }
        }
    }

    return 0;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon has the Gigantamax factor. False otherwise.
 */
export function CanMonGigantamax(pokemon)
{
    let dataMember = "gigantamax";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let gigantamax = pokemon[dataMember];

        if (typeof(gigantamax) === "boolean")
            return gigantamax;
    }

    return false;
}

/**
 * @param {*} pokemon - The Pokemon to process.
 * @returns {Array <Number>} The list of the Pokemon's summary screen stats in the order [HP, Atk, Def, Sp. Atk, Sp. Def, Spd].
 */
export function GetVisibleStats(pokemon)
{
    let dataMember = "rawStats";

    if (!IsValidPokemon(pokemon)
    || !(dataMember in pokemon)
    || !IsIntArrayWithSizeAndBounds(pokemon[dataMember], 6, 0, 0xFFFF))
        return [0, 0, 0, 0, 0, 0];

    let stats = pokemon[dataMember];
    return ([
        stats[0], //HP
        stats[1], //Attack
        stats[2], //Defense
        stats[4], //Sp. Atk
        stats[5], //Sp. Def
        stats[3], //Speed
    ]);
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Array <Number>} The list of the Pokemon's EVs in the order [HP, Atk, Def, Sp. Atk, Sp. Def, Spd].
 */
export function GetEVs(pokemon)
{
    if (!IsValidPokemon(pokemon)
    || !("hpEv" in pokemon)
    || !("atkEv" in pokemon)
    || !("defEv" in pokemon)
    || !("spAtkEv" in pokemon)
    || !("spDefEv" in pokemon)
    || !("spdEv" in pokemon)
    || !IsValidEV(pokemon["hpEv"])
    || !IsValidEV(pokemon["atkEv"])
    || !IsValidEV(pokemon["defEv"])
    || !IsValidEV(pokemon["spAtkEv"])
    || !IsValidEV(pokemon["spDefEv"])
    || !IsValidEV(pokemon["spdEv"]))
        return [0, 0, 0, 0, 0, 0];

    return ([
        pokemon["hpEv"],
        pokemon["atkEv"],
        pokemon["defEv"],
        pokemon["spAtkEv"],
        pokemon["spDefEv"],
        pokemon["spdEv"],
    ]);
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Array <Number>} The list of the Pokemon's IVs in the order [HP, Atk, Def, Sp. Atk, Sp. Def, Spd].
 */
export function GetIVs(pokemon)
{
    let dataMember = "ivs";

    if (!IsValidPokemon(pokemon)
    || !(dataMember in pokemon)
    || !IsIntArrayWithSizeAndBounds(pokemon[dataMember], 6, 0, 31))
        return [0, 0, 0, 0, 0, 0];

    let ivs = pokemon[dataMember];
    return ([
        ivs[0], //HP
        ivs[1], //Attack
        ivs[2], //Defense
        ivs[4], //Sp. Atk
        ivs[5], //Sp. Def
        ivs[3], //Speed
    ]);
}

/**
 * Checks if a Pokemon has a species that was introduced in Gen 8.
 * @param {Pokemon} pokemon - The Pokemon to check.
 * @returns {Boolean} True if the Pokemon's species was introduced in Gen 8. False for any other Gen.
 */
export function IsMonGen8(pokemon)
{
    return IsSpeciesGen8(GetSpecies(pokemon));
}

/**
 * Checks if two Pokemon are duplicates of each other.
 * @param {Pokemon} pokemon1 - The first Pokemon to check.
 * @param {Pokemon} pokemon2 - The second Pokemon to check.
 * @returns {Boolean} True if the Pokemon are duplicates, False otherwise.
 */
export function PokemonAreDuplicates(pokemon1, pokemon2)
{
    //Arranged in order to do as few checks as posisble

    return IsValidPokemon(pokemon1)
        && IsValidPokemon(pokemon2)
        && GetSpecies(pokemon1) === GetSpecies(pokemon2)
        && pokemon1.personality === pokemon2.personality
        && pokemon1.otId === pokemon2.otId
        && pokemon1.metLocation === pokemon2.metLocation
        && GetMetLevel(pokemon1) === GetMetLevel(pokemon2)
        && GetOTName(pokemon1) === GetOTName(pokemon2) //Most likely matches if the original Trainer is the same
        && GetOTGender(pokemon1) === GetOTGender(pokemon2); //Most likely matches if the original Trainer is the same
}

/**
 * Gets the species id that a Pokemon would be visible as (factors in gender).
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The species id used for the Pokemon's icon.
 */
export function GetMonVisibleSpecies(pokemon)
{
    var species = GetSpecies(pokemon);

    if (IsEgg(pokemon))
    {
        if (species === "SPECIES_MANAPHY")
            species = "SPECIES_EGG_MANAPHY";
        else
            species = "SPECIES_EGG";
    }

    if (typeof(species) == "string")
    {
        if (species.endsWith("_MEGA")) //Can't exist outside of battle
            species = species.split("_MEGA")[0];
        else if (species.endsWith("GIGA")) //Can't exist outside of battle
            species = species.split("_GIGA")[0];

        switch (species)
        {
            case "SPECIES_UNOWN":
                var unownLetter = GetUnownLetter(pokemon);
                switch (unownLetter)
                {
                    case 0:
                        break;
                    case 26:
                        species = "SPECIES_UNOWN_EXCLAMATION";
                        break;
                    case 27:
                        species = "SPECIES_UNOWN_QUESTION";
                        break;
                    default:
                        if (unownLetter < 0 || unownLetter >= NUM_UNOWN_FORMS)
                            break;

                        species = SpeciesDefines["SPECIES_UNOWN_B"] + unownLetter - 1; //Convert to an int
                        for (let key of Object.keys(SpeciesDefines))
                        {
                            if (SpeciesDefines[key] === species) //This is the correct unown species
                                species = key; //Convert back to a string
                        }
                        break;
                }
                break;
            case "SPECIES_HIPPOPOTAS":
                if (IsFemale(pokemon))
                    species = "SPECIES_HIPPOPOTAS_F";
                break;
            case "SPECIES_HIPPOWDON":
                if (IsFemale(pokemon))
                    species = "SPECIES_HIPPOWDON_F";
                break;
            case "SPECIES_UNFEZANT":
                if (IsFemale(pokemon))
                    species = "SPECIES_UNFEZANT_F";
                break;
            case "SPECIES_FRILLISH":
                if (IsFemale(pokemon))
                    species = "SPECIES_FRILLISH_F";
                break;
            case "SPECIES_JELLICENT":
                if (IsFemale(pokemon))
                    species = "SPECIES_JELLICENT_F";
                break;
            case "SPECIES_PYROAR":
                if (IsFemale(pokemon))
                    species = "SPECIES_PYROAR_FEMALE";
                break;
            default: //Needed for the compiler
                break;
        }
    }

    if (species in BASE_FORMS_OF_BANNED_SPECIES) //Forms that can't exist outside of battle
        species = BASE_FORMS_OF_BANNED_SPECIES[species];

    return species;
}

/**
 * Gets the icon id used for a species.
 * @param {String} species - The species id to convert.
 * @returns {String} - The icon id used to represent the species.
 */
export function GetIconSpeciesNameBySpecies(species)
{
    var speciesName = "unknown";

    if (species in SPECIES_FORMS_ICON_NAMES)
        speciesName = SPECIES_FORMS_ICON_NAMES[species];
    else if (typeof(species) == "string" && species.startsWith("SPECIES_"))
    {
        speciesName = species.split("SPECIES_")[1];

        if (speciesName.endsWith("_A"))
            speciesName = speciesName.replaceAll("_A", "_ALOLA");
        else if (speciesName.endsWith("_G") && speciesName !== "UNOWN_G")
            speciesName = speciesName.replaceAll("_G", "_GALAR");

        speciesName = speciesName.toLowerCase().replaceAll("_", "-");
    }
    else if (species === "")
        speciesName = "none"

    return speciesName;
}

/**
 * Gets the icon id used for a Pokemon.
 * @param {String} Pokemon - The Pokemon to get the icon id for.
 * @returns {String} - The icon id used to represent the Pokemon.
 */
export function GetIconSpeciesName(pokemon)
{
    return GetIconSpeciesNameBySpecies(GetMonVisibleSpecies(pokemon));
}

/**
 * Gets the image link for an icon species id.
 * @param {String} iconSpeciesName - The icon species id to get the link for.
 * @param {Boolean} isShiny - True if it should be a Shiny icon. False otherwise.
 * @param {Boolean} isGen8 - True if the species is from Gen 8. False otherwise.
 * @returns {String} The link to the icon image.
 */
export function GetIconSpeciesLinkByIconSpeciesName(iconSpeciesName, isShiny, isGen8)
{
    if (iconSpeciesName === "pikachu-surfing")
        return BASE_GFX_LINK + "SPECIES_PIKACHU_SURFING.png";
    else if (iconSpeciesName === "pikachu-flying")
        return BASE_GFX_LINK + "SPECIES_PIKACHU_FLYING.png";
    else
    {
        var baseLink = "https://raw.githubusercontent.com/msikma/pokesprite/master/";
        var colouration = iconSpeciesName === "unknown" || iconSpeciesName === "egg" || iconSpeciesName === "egg-manaphy" ? "" : isShiny ? "shiny/" : "regular/";
        var gen = isGen8 ? "pokemon-gen8/" : "pokemon-gen7x/";
    }

    return baseLink + gen + colouration + iconSpeciesName + ".png";
}

/**
 * Gets the icon image link for a species.
 * @param {String} species - The species id to get the link for.
 * @returns {String} The link to the icon image.
 */
export function GetIconSpeciesLinkBySpecies(species)
{
    var iconSpeciesName = GetIconSpeciesNameBySpecies(species);
    return GetIconSpeciesLinkByIconSpeciesName(iconSpeciesName, false, IsSpeciesGen8(species))
}

/**
 * Gets the icon image link for a Pokemon.
 * @param {Pokemon} pokemon - The Pokemon to get the link for.
 * @returns {String} The link to the icon image.
 */
export function GetIconSpeciesLink(pokemon)
{
    var iconSpeciesName = GetIconSpeciesName(pokemon);
    return GetIconSpeciesLinkByIconSpeciesName(iconSpeciesName, IsShiny(pokemon), IsMonGen8(pokemon))
}
