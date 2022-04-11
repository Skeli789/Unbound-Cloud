import {MONS_PER_BOX, MONS_PER_ROW} from "./BoxView";
import {BOX_HOME, BOX_SAVE} from "./MainPage";

import AbilityNames from "./data/AbilityNames.json";
import BallTypeNames from "./data/BallTypeNames.json";
import ItemNames from "./data/ItemNames.json";
import MoveNames from "./data/MoveNames.json";
import NatureNames from "./data/NatureNames.json";
import SpeciesNames from "./data/SpeciesNames.json";
import TypeNames from "./data/TypeNames.json";

export const BASE_GFX_LINK = "images/";


/**
 * Creates an array to indicate selected positions in a box.
 * @returns {Array <Boolean>} An array of MONS_PER_BOX Falses.
 */
export function CreateSingleBlankSelectedPos()
{
    return Array.apply(null, Array(MONS_PER_BOX)).map(function () {return false});
}

/**
 * Gets the starting index a list of all Pokemon based on a box's id.
 * @param {Number} boxId - The id of the box to start from.
 * @returns {Number} The index in the list.
 */
export function GetBoxStartIndex(boxId)
{
    return boxId * MONS_PER_BOX;
}

/**
 * Gets the index a list of all Pokemon based on a Pokemon's box id and box position.
 * @param {Number} boxId - The id of the box to start from.
 * @param {Number} boxPos - The position in the box.
 * @returns {Number} The index in the list.
 */
export function GetOffsetFromBoxNumAndPos(boxId, boxPos)
{
    return GetBoxStartIndex(boxId) + boxPos;
}

/**
 * Gets the box number of a Pokemon in the big list of boxes.
 * @param {Number} offset - The position in the list of boxes of the Pokemon.
 * @returns {Number} The box number for the Pokemon.
 */
export function GetBoxNumFromBoxOffset(offset)
{
    return Math.floor(offset / MONS_PER_BOX);
}

/**
 * Gets the local position of a Pokemon in the big list of boxes.
 * @param {Number} offset - The position in the list of boxes of the Pokemon.
 * @returns {Number} A number from 0 to MONS_PER_BOX - 1.
 */
export function GetLocalBoxPosFromBoxOffset(offset)
{
    return offset % MONS_PER_BOX;
}

/**
 * Gets the row in a box a local box position is at.
 * @param {Number} pos - A local box positon from 0 to MONS_PER_BOX - 1.
 * @returns {Number} The row in the box.
 */
export function GetBoxPosBoxRow(pos)
{
    return Math.floor(pos / MONS_PER_ROW);
}

/**
 * Gets the column in a box a local box position is at.
 * @param {Number} pos - A local box positon from 0 to MONS_PER_BOX - 1.
 * @returns {Number} The column in the box.
 */
export function GetBoxPosBoxColumn(pos)
{
    return pos % MONS_PER_ROW;
}

/**
 * Gets whether or not the given box type is for a Home box.
 * @param {Number} boxType - The type of box to check.
 * @returns {Boolean} True if the box is a Home box, False otherwise.
 */
export function IsHomeBox(boxType)
{
    return boxType === BOX_HOME;
}

/**
 * Gets whether or not the given box type is for a saved game box.
 * @param {Number} boxType - The type of box to check.
 * @returns {Boolean} True if the box is a saved game box, False otherwise.
 */
export function IsSaveBox(boxType)
{
    return boxType === BOX_SAVE;
}

/**
 * Gets whether or not a species name represents a blank/non-existent species.
 * @param {String} speciesName - The species name to check.
 * @returns {Boolean} True if the species name is for a null species, False otherwise.
 */
export function IsNullSpeciesName(speciesName)
{
    return speciesName === "none" || speciesName === "unknown";
}

/**
 * Gets the name of an item from its id.
 * @param {String} item - The item's STRING_BASED id.
 * @returns {String} The name of the item.
 */
export function GetItemName(item)
{
    if (item in ItemNames)
        return ItemNames[item]["name"];

    return "None";
}

/**
 * Gets the image link of an item.
 * @param {String} item - The item's STRING_BASED id.
 * @returns {String} The link to the item's image.
 */
export function GetItemIconLink(item)
{
    if (item in ItemNames && item !== "ITEM_NONE")
    {
        if ("link" in ItemNames[item])
            return `https://raw.githubusercontent.com/msikma/pokesprite/master/items/${ItemNames[item]["link"]}.png`;

        return BASE_GFX_LINK + item + ".png";
    }
    
    return "";
}
 
/**
 * Gets the pretty name like "Venusaur" for a species id.
 * @param {String} species - The species' STRING_BASED id.
 * @returns {String} The name of the item.
 */
export function GetSpeciesName(species)
{
    if (typeof(species) == "string")
    {
        if (species in SpeciesNames)
            return SpeciesNames[species];
    }

    return "Unknown Species";
}
 
/**
 * Gets the pretty name like "Thunder Punch" for a move id.
 * @param {String} species - The move's STRING_BASED id.
 * @returns {String} The name of the move.
 */
export function GetMoveName(move)
{
    if (move in MoveNames)
        return MoveNames[move];

    return "Unknown Move";
}

/**
 * Gets the pretty name like "Lightning Rod" for an Ability id.
 * @param {String} species - The Ability's STRING_BASED id.
 * @returns {String} The name of the Ability.
 */
export function GetAbilityName(ability)
{
    if (ability in AbilityNames)
        return AbilityNames[ability]

    return "Unknown Ability";
}

/**
 * Gets the pretty name like "Serious" for an Ability id.
 * @param {Number} nature - The Nature's STRING_BASED id.
 * @returns {String} The name of the Nature.
 */
export function GetNatureName(nature)
{
    if (nature in NatureNames)
        return NatureNames[nature];

    return "Unknown Nature";
}

/**
 * Gets the pretty name like "Master Ball" for a ball type id.
 * @param {Number} ballType - The Balls's STRING_BASED id.
 * @returns {String} The name of the Poke Ball.
 */
export function GetBallName(ballType)
{
    if (ballType in BallTypeNames)
        return BallTypeNames[ballType];

    return "Unknown Ball Type";
}

/**
 * Gets the pretty name like "Fire" for a Pokemon type id.
 * @param {Number} ballType - The type's STRING_BASED id.
 * @returns {String} The name of the type
 */
export function GetTypeName(type)
{
    if (type in TypeNames)
        return TypeNames[type];

    return "Unknown Type";
}
