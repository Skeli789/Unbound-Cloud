/**
 * Various utility functions related to Pokemon data.
 */

import {BASE_GFX_LINK, GetSpeciesName} from "./Util";

//General Data
import ItemNames from "./data/ItemNames.json";
import MoveData from "./data/MoveData.json";
import SpeciesNames from "./data/SpeciesNames.json";
import SpeciesToDexNum from "./data/SpeciesToDexNum.json";
import ExperienceCurves from "./data/ExperienceCurves.json";
import ImpossibleNicknameCharacters from "./data/ImpossibleNicknameChars.json";

//CFRU Data
import CFRUBaseStats from "./data/cfru/BaseStats.json";
import CFRUMoves from "./data/cfru/Moves.json";
import CFRUItems from "./data/cfru/Items.json";
import CFRUBallTypes from "./data/cfru/BallTypes.json";

//Unbound Data
import UnboundBaseStats from "./data/unbound/BaseStats.json";
import UnboundMoves from "./data/unbound/Moves.json";
import UnboundItems from "./data/unbound/Items.json";
import UnboundBallTypes from "./data/unbound/BallTypes.json";
import UnboundShinies from "./data/UnboundShinies.json";

//Unbound 2.1 Data
import Unbound21BaseStats from "./data/unbound_2_1/BaseStats.json";
import Unbound21Moves from "./data/unbound_2_1/Moves.json";
import Unbound21Items from "./data/unbound_2_1/Items.json";
import Unbound21BallTypes from "./data/unbound_2_1/BallTypes.json";

//MAGM Data
import MAGMBaseStats from "./data/magm/BaseStats.json";
import MAGMMoves from "./data/magm/Moves.json";
import MAGMItems from "./data/magm/Items.json";
import MAGMBallTypes from "./data/magm/BallTypes.json";

//Inflamed Red Data
import InflamedRedBaseStats from "./data/inflamedred/BaseStats.json";
import InflamedRedMoves from "./data/inflamedred/Moves.json";
import InflamedRedItems from "./data/inflamedred/Items.json";
import InflamedRedBallTypes from "./data/inflamedred/BallTypes.json";

//GS Chronicles Data
import GSChroniclesBaseStats from "./data/gschronicles/BaseStats.json";
import GSChroniclesMoves from "./data/gschronicles/Moves.json";
import GSChroniclesItems from "./data/gschronicles/Items.json";
import GSChroniclesBallTypes from "./data/gschronicles/BallTypes.json";


const SPECIES_FORMS_ICON_NAMES =
{
    "SPECIES_PIKACHU_A": "pikachu",
    "SPECIES_PIKACHU_CAP_ORIGINAL": "pikachu-original-cap",
    "SPECIES_PIKACHU_CAP_HOENN": "pikachu-hoenn-cap",
    "SPECIES_PIKACHU_CAP_SINNOH": "pikachu-sinnoh-cap",
    "SPECIES_PIKACHU_CAP_UNOVA": "pikachu-unova-cap",
    "SPECIES_PIKACHU_CAP_KALOS": "pikachu-kalos-cap",
    "SPECIES_PIKACHU_CAP_ALOLA": "pikachu-alola-cap",
    "SPECIES_PIKACHU_CAP_PARTNER": "pikachu-partner-cap",
    "SPECIES_PIKACHU_CAP_WORLD": "pikachu-world-cap",
    "SPECIES_PIKACHU_STARTER": "pikachu-starter",
    "SPECIES_PIKACHU_F": "female/pikachu",
    "SPECIES_PIKACHU_A_F": "female/pikachu",
    "SPECIES_PIKACHU_CAP_ORIGINAL_F": "female/pikachu-original-cap",
    "SPECIES_PIKACHU_CAP_HOENN_F": "female/pikachu-hoenn-cap",
    "SPECIES_PIKACHU_CAP_SINNOH_F": "female/pikachu-sinnoh-cap",
    "SPECIES_PIKACHU_CAP_UNOVA_F": "female/pikachu-unova-cap",
    "SPECIES_PIKACHU_CAP_KALOS_F": "female/pikachu-kalos-cap",
    "SPECIES_PIKACHU_CAP_ALOLA_F": "female/pikachu-alola-cap",
    "SPECIES_PIKACHU_CAP_PARTNER_F": "female/pikachu-partner-cap",
    "SPECIES_PIKACHU_CAP_WORLD_F": "female/pikachu-world-cap",
    "SPECIES_PIKACHU_STARTER_F": "female/pikachu-starter",
    "SPECIES_EEVEE_STARTER": "eevee-starter",
    "SPECIES_EXEGGCUTE_A": "exeggcute",
    "SPECIES_CUBONE_A": "cubone",
    "SPECIES_KOFFING_G": "koffing",
    "SPECIES_MIME_JR_G": "mime-jr",
    "SPECIES_PICHU_SPIKY": "pichu-spiky-eared",
    "SPECIES_WOBBUFFET_F": "female/wobbuffet",
    "SPECIES_HIPPOPOTAS_F": "female/hippopotas",
    "SPECIES_HIPPOWDON_F": "female/hippowdon",
    "SPECIES_ARCEUS_FIGHT": "arceus-fighting",
    "SPECIES_UNFEZANT_F": "female/unfezant",
    "SPECIES_BASCULIN_RED": "basculin",
    "SPECIES_BASCULIN_BLUE": "basculin-blue-striped",
    "SPECIES_BASCULIN_H": "basculin-white-striped",
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
    "SPECIES_ALCREMIE_STRAWBERRY": "alcremie", //These Alcremie forms are mainly for the living dex icons
    "SPECIES_ALCREMIE_BERRY": "alcremie-vanilla-cream-berry",
    "SPECIES_ALCREMIE_CLOVER": "alcremie-vanilla-cream-clover",
    "SPECIES_ALCREMIE_FLOWER": "alcremie-vanilla-cream-flower",
    "SPECIES_ALCREMIE_LOVE": "alcremie-vanilla-cream-love",
    "SPECIES_ALCREMIE_RIBBON": "alcremie-vanilla-cream-ribbon",
    "SPECIES_ALCREMIE_STAR": "alcremie-vanilla-cream-star",
    "SPECIES_INDEEDEE_FEMALE": "female/indeedee",
    "SPECIES_URSHIFU_SINGLE": "urshifu",
    "SPECIES_URSHIFU_RAPID": "urshifu",
    "SPECIES_BASCULEGION_M": "basculegion",
    "SPECIES_BASCULEGION_F": "female/basculegion",
    "SPECIES_EGG_MANAPHY": "egg-manaphy",
};

const BASE_FORMS_OF_BANNED_SPECIES = //All forms that can't exist outside of battle
{
    "SPECIES_CHERRIM_SUN": "SPECIES_CHERRIM",
    "SPECIES_DARMANITANZEN": "SPECIES_DARMANITAN",
    "SPECIES_DARMANITAN_G_ZEN": "SPECIES_DARMANITAN_G",
    "SPECIES_MELOETTA_PIROUETTE": "SPECIES_MELOETTA",
    "SPECIES_ASHGRENINJA": "SPECIES_GRENINJA",
    "SPECIES_AEGISLASH_BLADE": "SPECIES_AEGISLASH",
    "SPECIES_XERNEAS_NATURAL": "SPECIES_XERNEAS", //Just an aesthetic species, should be SPECIES_XERNEAS always
    "SPECIES_ZYGARDE_COMPLETE": "SPECIES_ZYGARDE",
    "SPECIES_WISHIWASHI_S": "SPECIES_WISHIWASHI",
    "SPECIES_MIMIKYU_BUSTED": "SPECIES_MIMIKYU",
    "SPECIES_NECROZMA_ULTRA": "SPECIES_NECROZMA",
    "SPECIES_CRAMORANT_GULPING": "SPECIES_CRAMORANT",
    "SPECIES_CRAMORANT_GORGING": "SPECIES_CRAMORANT",
    "SPECIES_EISCUE_NOICE": "SPECIES_EISCUE",
    "SPECIES_MORPEKO_HANGRY": "SPECIES_MORPEKO",
    "SPECIES_ZACIAN_CROWNED": "SPECIES_ZACIAN",
    "SPECIES_ZAMAZENTA_CROWNED": "SPECIES_ZAMAZENTA",
    "SPECIES_ETERNATUS_ETERNAMAX": "SPECIES_ETERNATUS",
};

const ALCREMIE_COLOURS =
[
    "VANILLA_CREAM",
    "CARAMEL_SWIRL",
    "LEMON_CREAM",
    "MATCHA_CREAM",
    "MINT_CREAM",
    "RAINBOW_SWIRL",
    "RUBY_CREAM",
    "RUBY_SWIRL",
    "SALTED_CREAM",
];

export const NATURE_STAT_TABLE =
{
                       // Atk Def Spd Sp.Atk Sp.Def
    "NATURE_HARDY":   [    0,  0,  0,     0,     0], // Hardy
    "NATURE_LONELY":  [   +1, -1,  0,     0,     0], // Lonely
    "NATURE_BRAVE":   [   +1,  0, -1,     0,     0], // Brave
    "NATURE_ADAMANT": [   +1,  0,  0,    -1,     0], // Adamant
    "NATURE_NAUGHTY": [   +1,  0,  0,     0,    -1], // Naughty
    "NATURE_BOLD":    [   -1, +1,  0,     0,     0], // Bold
    "NATURE_DOCILE":  [    0,  0,  0,     0,     0], // Docile
    "NATURE_RELAXED": [    0, +1, -1,     0,     0], // Relaxed
    "NATURE_IMPISH":  [    0, +1,  0,    -1,     0], // Impish
    "NATURE_LAX":     [    0, +1,  0,     0,    -1], // Lax
    "NATURE_TIMID":   [   -1,  0, +1,     0,     0], // Timid
    "NATURE_HASTY":   [    0, -1, +1,     0,     0], // Hasty
    "NATURE_SERIOUS": [    0,  0,  0,     0,     0], // Serious
    "NATURE_JOLLY":   [    0,  0, +1,    -1,     0], // Jolly
    "NATURE_NAIVE":   [    0,  0, +1,     0,    -1], // Naive
    "NATURE_MODEST":  [   -1,  0,  0,    +1,     0], // Modest
    "NATURE_MILD":    [    0, -1,  0,    +1,     0], // Mild
    "NATURE_QUIET":   [    0,  0, -1,    +1,     0], // Quiet
    "NATURE_BASHFUL": [    0,  0,  0,     0,     0], // Bashful
    "NATURE_RASH":    [    0,  0,  0,    +1,    -1], // Rash
    "NATURE_CALM":    [   -1,  0,  0,     0,    +1], // Calm
    "NATURE_GENTLE":  [    0, -1,  0,     0,    +1], // Gentle
    "NATURE_SASSY":   [    0,  0, -1,     0,    +1], // Sassy
    "NATURE_CAREFUL": [    0,  0,  0,    -1,    +1], // Careful
    "NATURE_QUIRKY":  [    0,  0,  0,     0,     0], // Quirky
};

const ID_TO_HIDDEN_POWER_TYPE =
{
    1: "TYPE_FIGHTING",
    2: "TYPE_FLYING",
    3: "TYPE_POISON",
    4: "TYPE_GROUND",
    5: "TYPE_ROCK",
    6: "TYPE_BUG",
    7: "TYPE_GHOST",
    8: "TYPE_STEEL",
    9: "TYPE_FIRE",
    10: "TYPE_WATER",
    11: "TYPE_GRASS",
    12: "TYPE_ELECTRIC",
    13: "TYPE_PSYCHIC",
    14: "TYPE_ICE",
    15: "TYPE_DRAGON",
    16: "TYPE_DARK",
};

const PLATES_TO_TYPES =
{
    "ITEM_FIST_PLATE": "TYPE_FIGHTING",
    "ITEM_SKY_PLATE": "TYPE_FLYING",
    "ITEM_TOXIC_PLATE": "TYPE_POISON",
    "ITEM_EARTH_PLATE": "TYPE_GROUND",
    "ITEM_STONE_PLATE": "TYPE_ROCK",
    "ITEM_INSECT_PLATE": "TYPE_BUG",
    "ITEM_SPOOKY_PLATE": "TYPE_GHOST",
    "ITEM_IRON_PLATE": "TYPE_STEEL",
    "ITEM_FLAME_PLATE": "TYPE_FIRE",
    "ITEM_SPLASH_PLATE": "TYPE_WATER",
    "ITEM_MEADOW_PLATE": "TYPE_GRASS",
    "ITEM_ZAP_PLATE": "TYPE_ELECTRIC",
    "ITEM_MIND_PLATE": "TYPE_PSYCHIC",
    "ITEM_ICICLE_PLATE": "TYPE_ICE",
    "ITEM_DRACO_PLATE": "TYPE_DRAGON",
    "ITEM_DREAD_PLATE": "TYPE_DARK",
    "ITEM_PIXIE_PLATE": "TYPE_FAIRY",
};

const DRIVES_TO_TYPES =
{
    "ITEM_BURN_DRIVE": "TYPE_FIRE",
    "ITEM_DOUSE_DRIVE": "TYPE_WATER",
    "ITEM_SHOCK_DRIVE": "TYPE_ELECTRIC",
    "ITEM_CHILL_DRIVE": "TYPE_ICE",
}

const GAME_IDS_TO_DATA =
{
    "cfru":
    {
        "baseStats": CFRUBaseStats,
        "moves": CFRUMoves,
        "items": CFRUItems,
        "ballTypes": CFRUBallTypes,
    },
    "unbound":
    {
        "baseStats": UnboundBaseStats,
        "moves": UnboundMoves,
        "items": UnboundItems,
        "ballTypes": UnboundBallTypes,
    },
    "unbound_2_1":
    {
        "baseStats": Unbound21BaseStats,
        "moves": Unbound21Moves,
        "items": Unbound21Items,
        "ballTypes": Unbound21BallTypes,
    },
    "magm":
    {
        "baseStats": MAGMBaseStats,
        "moves": MAGMMoves,
        "items": MAGMItems,
        "ballTypes": MAGMBallTypes,
    },
    "inflamedred":
    {
        "baseStats": InflamedRedBaseStats,
        "moves": InflamedRedMoves,
        "items": InflamedRedItems,
        "ballTypes": InflamedRedBallTypes,
    },
    "gschronicles":
    {
        "baseStats": GSChroniclesBaseStats,
        "moves": GSChroniclesMoves,
        "items": GSChroniclesItems,
        "ballTypes": GSChroniclesBallTypes,
    }
}

export const MAX_LEVEL = 100;
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
  * Gets whether or not a variable contains a valid nature id.
  * @param {String} nature - The nature id to check.
  * @returns {Boolean} True if the nature id is valid. False otherwise.
  */
function IsValidNature(nature)
{
    return nature in NATURE_STAT_TABLE;
}

/**
 * Checks if a species was introduced in Gen 8.
 * @param {String} species - The species to check.
 * @returns {Boolean} True if the species was introduced in Gen 8. False for any other Gen.
 */
function IsSpeciesGen8(species)
{
    var speciesIndex = 0;
    let speciesIds = Object.keys(SpeciesNames);

    if (typeof(species) === "number")
    {
        speciesIndex = species;
    }
    else if (typeof(species) === "string")
    {
        if (species.includes("PIKACHU") || species.includes("ALCREMIE"))
            return true; //Get all the Pikachu and Alcremie forms from the Gen 8 repo

        if (species in SpeciesNames)
            speciesIndex = speciesIds.indexOf(species);
    }

    if (speciesIndex > 0)
    {
        return speciesIndex >= speciesIds.indexOf("SPECIES_GROOKEY")
            && speciesIndex < speciesIds.indexOf("SPECIES_SPRIGATITO");
    }

    return false;
}

/**
 * Checks if a species was introduced in Gen 9.
 * @param {String} species - The species to check.
 * @returns {Boolean} True if the species was introduced in Gen 9. False for any other Gen.
 */
function IsSpeciesGen9(species)
{
    var speciesIndex = 0;
    let speciesIds = Object.keys(SpeciesNames);

    if (typeof(species) === "number")
    {
        speciesIndex = species;
    }
    else if (typeof(species) === "string")
    {
        if (species in SpeciesNames)
            speciesIndex = speciesIds.indexOf(species);
    }

    if (speciesIndex > 0)
    {
        return speciesIndex >= speciesIds.indexOf("SPECIES_SPRIGATITO")
            && speciesIndex < speciesIds.indexOf("SPECIES_WOOPER_P");
    }

    return false;
}

/**
 * Checks if an array contains only integers and is a certain size.
 * @param {Array} array - The array to check.
 * @param {Number} length - The expected length of the array.
 * @param {Number} lowerBound - The minimum number the integers can be.
 * @param {Number} upperBound - The maximum number the integers can be.
 * @returns {Boolean} True if the array is valid. False otherwise.
 */
function IsIntArrayWithSizeAndBounds(array, length, lowerBound, upperBound)
{
    if (!Array.isArray(array) || array.length !== length)
        return false;

    for (let elem of array)
    {
        if (typeof(elem) !== "number" || elem < lowerBound || elem > upperBound)
            return false;
    }

    return true;
}

/**
 * Checks if an array contains only booleans.
 * @param {Array} array - The array to check.
 * @param {Number} minSize - The minimum length of the array
 * @returns {Boolean} True if the array is valid. False otherwise.
 */
function IsBooleanArray(array, minSize)
{
    if (!Array.isArray(array) || array.length < minSize)
        return false;

    for (let elem of array)
    {
        if (typeof(elem) !== "boolean")
            return false;
    }

    return true;
}

/**
 * Gets the base stats of a specific Pokemon
 * @param {Pokemon} pokemon - The Pokemon to get the base stats for.
 * @param {String} gameId - The game to get the base stats from.
 * @returns {Object} The base stats of the requested Pokemon.
 */
export function GetBaseStats(pokemon, gameId)
{
    var baseStats = null;

    if (IsValidPokemon(pokemon))
    {
        let allBaseStats;
        let species = GetSpecies(pokemon);

        if (gameId in GAME_IDS_TO_DATA)
            allBaseStats = GAME_IDS_TO_DATA[gameId]["baseStats"];

        if (allBaseStats != null && species in allBaseStats)
            return allBaseStats[species];
    }

    return baseStats;
}

/**
 * Calculates the visible stat of a specific Pokemon.
 * @param {Pokemon} pokemon - The Pokemon to calculate the stat of.
 * @param {Number} statId - The id number of the visible stat to calculate (Speed should be last).
 * @param {String} gameId - The game id to get the base stats from.
 * @returns {Number} The requested visible stat of the Pokemon.
 */
function CalcStat(pokemon, statId, gameId)
{
    var val = 0;
    var baseStats = GetBaseStats(pokemon, gameId);
    const statIdsToBaseStatsName = //Uses visible order (Speed is last)
    {
        0: "baseHP",
        1: "baseAttack",
        2: "baseDefense",
        3: "baseSpAttack",
        4: "baseSpDefense",
        5: "baseSpeed",
    };

    if (baseStats != null)
    {
        var species = GetSpecies(pokemon);
        var level = GetLevel(pokemon, gameId);
        var iv = GetIVs(pokemon)[statId];
        var ev = GetEVs(pokemon)[statId];
        var base = baseStats[statIdsToBaseStatsName[statId]];
        const visibleStatIdToStatId = [0, 1, 2, 4, 5, 3]; //Needed for nature calc
    
        if (statId === 0) //HP
        {
            if (species === "SPECIES_SHEDINJA")
                val = 1;
            else
            {
                val = 2 * base + iv;
                val = Math.min(Math.floor((Math.floor(val + ev / 4) * level) / 100) + level + 10, 0xFFFF);
            }
        }
        else
        {
            val = (Math.floor((Math.floor(2 * base + iv + ev / 4) * level) / 100) + 5);
        }
    
        val = ModifyStatByNature(GetVisibleNature(pokemon), val, visibleStatIdToStatId[statId]);
    }

    return val;
}

/**
 * Modifies a visible stat number based on a Pokemon's nature.
 * @param {String} nature - The nature that modifies the stat.
 * @param {Number} rawStat - The current calculated stat to modify.
 * @param {Number} statId - The id number of the stat to check the nature's effect on (Speed is after Defense).
 * @returns {Number} - The new visible stat adjusted by a nature if necessary.
 */
function ModifyStatByNature(nature, rawStat, statId)
{
    if (statId < 1 || statId > 5)
        return rawStat;

    if (NATURE_STAT_TABLE[nature][statId - 1] === 1)
        rawStat = (rawStat * 110) / 100;
    else if (NATURE_STAT_TABLE[nature][statId - 1] === -1)
        rawStat = (rawStat * 90) / 100;

    return Math.floor(rawStat);
}


/**********************************
        Mon Getter Functions       
**********************************/

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @param {Boolean} adjustUnown - Whether or not to convert an Unown to it's proper letter species.
 * @returns {String} The Pokemon's species id.
 */
export function GetSpecies(pokemon, adjustUnown=false)
{
    let dataMember = "species";
    let species = "SPECIES_NONE";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        species = pokemon[dataMember]
        if (adjustUnown && species === "SPECIES_UNOWN")
        {
            var unownLetter = GetUnownLetter(pokemon);
            switch (unownLetter)
            {
                case 0:
                    break;
                default:
                    if (unownLetter < 0 || unownLetter >= NUM_UNOWN_FORMS)
                        break;

                    let speciesIds = Object.keys(SpeciesNames);
                    species = speciesIds[speciesIds.indexOf("SPECIES_UNOWN_B") + (unownLetter - 1)];
                    break;
            }
        }
    }

    return species;
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

        if (IsValidNature(nature))
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
 
         if (IsValidNature(nature))
             return nature;
     }
 
     return GetNature(pokemon);
 }

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The Pokemon's Ability id.
 */
export function GetAbility(pokemon, gameId)
{
    let ability = "ABILITY_NONE"
    let dataMember = "ability";

    if (IsValidPokemon(pokemon))
    {
        if (dataMember in pokemon)
            return pokemon[dataMember];

        dataMember = "abilitySlot";

        if (dataMember in pokemon)
        {
            let abilitySlot = pokemon[dataMember];
            let baseStats = GetBaseStats(pokemon, gameId);

            if (baseStats != null)
            {
                if ("ability1" in baseStats)
                    ability = baseStats["ability1"];

                switch (abilitySlot)
                {
                    case 1:
                        if ("ability2" in baseStats && baseStats["ability2"] !== "ABILITY_NONE")
                            ability = baseStats["ability2"];
                        break;
                    case 2:
                        if ("hiddenAbility" in baseStats && baseStats["hiddenAbility"] !== "ABILITY_NONE")
                            ability = baseStats["hiddenAbility"];
                        break;
                    default:
                        break;
                }
            }
        }
    }

    return ability;
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
export function IsHoldingItem(pokemon)
{
    return GetItem(pokemon) !== "ITEM_NONE";
}

/**
 * 
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon is holding an item that can't be placed in the Home boxes. False otherwise.
 */
export function IsHoldingBannedItem(pokemon)
{
    var item = GetItem(pokemon);

    return item === "ITEM_BOTTLE_CAP"
        || item === "ITEM_GOLD_BOTTLE_CAP"
        || item === "ITEM_DREAM_MIST"
        || item === "ITEM_ABILITY_CAPSULE"
        || item === "ITEM_ABILITY_PATCH"
        || item === "ITEM_MAX_POWDER"
        || item === "ITEM_WISHING_PIECE"
        || item === "ITEM_MASTER_BALL"
        || item === "ITEM_PARK_BALL";
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
        var ppBonuses, ppBonus;
        ppBonuses = GetPPBonuses(pokemon);

        if (Array.isArray(ppBonuses)) //Already processed into array of bonuses
            ppBonus = (moveIndex < PP_BONUS_MASK.length) ? ppBonuses[moveIndex] : 0;
        else
            ppBonus = (moveIndex < PP_BONUS_MASK.length) ? (PP_BONUS_MASK[moveIndex] & ppBonuses) >> (2 * moveIndex) : 0;

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

        if (typeof(ppBonuses) === "number")
        {
            if (ppBonuses >= 0)
                return ppBonuses;
        }
        else if (IsIntArrayWithSizeAndBounds(ppBonuses, 4, 0, 3))
            return ppBonuses;
    }

    return 0;
}

/**
 * Gets the type of a move when known by a specific Pokemon.
 * @param {String} move - The move to get the type of.
 * @param {Pokemon} pokemon - The Pokemon that knows the move.
 * @param {String} gameId - The id of the game that's currently loaded.
 * @returns {String} The type of move.
 */
export function GetMoveType(move, pokemon, gameId)
{
    var type = (move in MoveData) ? MoveData[move]["type"] : "TYPE_NORMAL";
    var species = GetSpecies(pokemon);

    switch (move)
    {
        case "MOVE_HIDDENPOWER":
            let ivs = GetIVs(pokemon);
            let typeId = ((ivs[0] & 1))       //HP
			       | ((ivs[1] & 1) << 1)  //Attack
			       | ((ivs[2] & 1) << 2)  //Defense
			       | ((ivs[5] & 1) << 3)  //Speed
			       | ((ivs[3] & 1) << 4)  //Sp. Atk
			       | ((ivs[4] & 1) << 5); //Sp. Def
            typeId = Math.floor((15 * typeId) / 63) + 1;
            if (typeId in ID_TO_HIDDEN_POWER_TYPE)
                type = ID_TO_HIDDEN_POWER_TYPE[typeId];
            break;
        case "MOVE_JUDGMENT":
            if (species in SpeciesToDexNum && SpeciesToDexNum[species] === "NATIONAL_DEX_ARCEUS")
            {
                let item = GetItem(pokemon);
                if (item in PLATES_TO_TYPES)
                    type = PLATES_TO_TYPES[item];
            }
            break;
        case "MOVE_MULTIATTACK":
            if (species in SpeciesToDexNum && SpeciesToDexNum[species] === "NATIONAL_DEX_SILVALLY")
            {
                let item = GetItem(pokemon);
                if (item.includes("_MEMORY"))
                    type = "TYPE_" + item.split("ITEM_")[1].split("_MEMORY")[0];
            }
            break;
        case "MOVE_TECHNOBLAST":
            if (species in SpeciesToDexNum && SpeciesToDexNum[species] === "NATIONAL_DEX_GENESECT")
            {
                let item = GetItem(pokemon);
                if (item in DRIVES_TO_TYPES)
                    type = DRIVES_TO_TYPES[item];
            }
            break;
        case "MOVE_REVELATIONDANCE":
            let baseStats = GetBaseStats(pokemon, gameId);
            if (baseStats != null)
                type =  baseStats["type1"];
            break;
        default:
            break;
    }

    return type;
}

/**
 * Checks if a Pokemon knows has same move more than once in its moveset.
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the Pokemon knows any of its moves more than once. False if not.
 */
export function HasDuplicateMovesInMoveset(pokemon)
{
    var counts = {};

    for (let move of GetMoves(pokemon))
    {
        if (move !== "MOVE_NONE")
            counts[move] = (move in counts) ? counts[move] + 1 : 1;
    }

    counts = Object.values(counts);
    counts.sort();
    counts.reverse(); //Put largest numbers at the front
    return counts.length > 0 && counts[0] > 1;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The Pokemon's amount of experience.
 */
export function GetExperience(pokemon)
{
    let dataMember = "experience";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        if (typeof(pokemon[dataMember]) === "number")
            return pokemon[dataMember];
    }

    return 0;
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The Pokemon's level.
 */
export function GetLevel(pokemon, gameId)
{
    // let dataMember = "level";

    if (IsValidPokemon(pokemon))
    {
        /* From old data struct
        if (dataMember in pokemon)
        {
            let level = pokemon[dataMember];

            if (IsValidLevel(level))
                return level;
        }
        */

        let experience = GetExperience(pokemon);
        let baseStats = GetBaseStats(pokemon, gameId);

        if (baseStats != null)
        {
            let expRate = baseStats.growthRate;
            if (expRate in ExperienceCurves)
            {
                let lowLevel = 1;
                let highLevel = MAX_LEVEL;
                let expCurve = ExperienceCurves[expRate];

                while (lowLevel < highLevel)
                {
                    let mid = Math.floor((lowLevel + highLevel) / 2);

                    if (expCurve[mid] === experience) //Check if experience matches at mid (probably won't)
                        return mid;
                    else if (expCurve[mid] < experience) //If experience is greater, ignore lower half
                        lowLevel = mid + 1;
                    else //If experience is smaller, ignore right half
                        highLevel = mid - 1;
                }

                if (expCurve[highLevel] > experience) //Not actually at the higher level yet
                    return highLevel - 1;
                else
                    return highLevel;
            }
        }
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

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The game the Pokemon originally came from.
 */
export function GetMetGame(pokemon)
{
    let dataMember = "metGame";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let metGame = pokemon[dataMember];

        if (typeof(metGame) === "string")
            return metGame;
    }

    return "";
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Number} The current friendship level of the Pokemon
 */
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

    if (IsBadEgg(pokemon))
        return true;

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

    if (IsEgg(pokemon))
        return false;

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
 * Checks if a Pokemon has a blatantly hacked leter in either its nickname or OT name.
 * @param {Pokemon} pokemon  - The Pokemon to process.
 * @returns {Boolean} - true if the Pokemon has a hacked letter in it, false if not.
 */
export function HasHackedCharacterInNicknameOrOTName(pokemon)
{
    let nickname = GetNickname(pokemon);
    let otName = GetOTName(pokemon);

    return HasHackedCharacterInName(nickname)
        || HasHackedCharacterInName(otName);
}

/**
 * Checks if a name has a letter in it that can't be set normally ingame.
 * @param {String} name - The name to check.
 * @returns {Boolean} - true if the name has a hacked letter in it, false if not.
 */
function HasHackedCharacterInName(name)
{
    for (let letter of name)
    {
        if (letter in ImpossibleNicknameCharacters)
            return true; //Unlike the server-side check, this one checks specifically for characters that could never appear in a nickname regardless of language
    }

    return false;
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
 * @returns {Boolean} True if the Pokemon was generated with Gerban's EggLocke tool. False if it wasn't.
 */
export function HasEggLockeOT(pokemon)
{
    let dataMember = "otId";

    if (IsValidPokemon(pokemon) && dataMember in pokemon)
    {
        let otId = pokemon[dataMember];

        if (typeof(otId) === "number")
        {
            if (otId !== 0x3CEAB505)
                return false;
        }
    }

    return GetOTName(pokemon) === "Egglock";
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
        else if (IsBooleanArray(markings, 4))
            return markings.slice(0, 4)
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
 * @returns {String} The Alcremie colour.
 */
export function GetAlcremieColour(pokemon)
{
    if (IsValidPokemon(pokemon))
    {
        let dataMember = "personality";
        if (dataMember in pokemon)
        {
            let personality = pokemon[dataMember];

            if (typeof(personality) === "number")
                return ALCREMIE_COLOURS[personality % ALCREMIE_COLOURS.length];
        }
    }

    return ALCREMIE_COLOURS[0];
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
export function GetVisibleStats(pokemon, gameId)
{
    //let dataMember = "rawStats";

    if (IsValidPokemon(pokemon))
    {
        /*if (dataMember in pokemon //Old version
        && IsIntArrayWithSizeAndBounds(pokemon[dataMember], 6, 0, 0xFFFF))
        {
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
        else*/ //Calc based on the specific game
        //{
            return [
                CalcStat(pokemon, 0, gameId),
                CalcStat(pokemon, 1, gameId),
                CalcStat(pokemon, 2, gameId),
                CalcStat(pokemon, 3, gameId),
                CalcStat(pokemon, 4, gameId),
                CalcStat(pokemon, 5, gameId),
            ];
        //}
    }
}

/**
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Array <Number>} The list of the Pokemon's EVs in the order [HP, Atk, Def, Sp. Atk, Sp. Def, Spd].
 */
export function GetEVs(pokemon)
{
    var evs = [0, 0, 0, 0, 0, 0]; //Default if there's an error
    let dataMember = "evs";

    if (IsValidPokemon(pokemon))
    {
        if (dataMember in pokemon
        && IsIntArrayWithSizeAndBounds(pokemon[dataMember], 6, 0, 255)) //EVs are stored as array
        {
            evs = pokemon[dataMember];
            evs = [
                evs[0], //HP
                evs[1], //Attack
                evs[2], //Defense
                evs[4], //Sp. Atk
                evs[5], //Sp. Def
                evs[3], //Speed
            ];
        }
        else //EVs are stored as individual values (old version)
        {
            if ("hpEv" in pokemon
            && "atkEv" in pokemon
            && "defEv" in pokemon
            && "spAtkEv" in pokemon
            && "spDefEv" in pokemon
            && "spdEv" in pokemon
            && IsValidEV(pokemon["hpEv"])
            && IsValidEV(pokemon["atkEv"])
            && IsValidEV(pokemon["defEv"])
            && IsValidEV(pokemon["spAtkEv"])
            && IsValidEV(pokemon["spDefEv"])
            && IsValidEV(pokemon["spdEv"]))
            {
                evs = [
                    pokemon["hpEv"],
                    pokemon["atkEv"],
                    pokemon["defEv"],
                    pokemon["spAtkEv"],
                    pokemon["spDefEv"],
                    pokemon["spdEv"],
                ];
            }
        }
    }

    return evs;
}

/**
 * Checks if a Pokemon has an EV total greater than 510.
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {Boolean} True if the EVs are illegal. False if they're legal.
 */
export function HasIllegalEVs(pokemon)
{
    return GetEVs(pokemon).reduce((a, b) => a + b, 0) > 510; //Get sum and then check
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
 * Checks if a Pokemon's species is present in a certain game.
 * @param {Pokemon} pokemon - The Pokemon to check.
 * @param {String} gameId - The game to check if the Pokemon is in.
 * @returns {Boolean} True if the Pokemon is present in the game. False if it's not.
 */
export function DoesPokemonSpeciesExistInGame(pokemon, gameId)
{
    var species = GetSpecies(pokemon);

    return species === "" //Always allow blank slots to be transferred in
        || species === "SPECIES_NONE"
        || GetBaseStats(pokemon, gameId) != null;
}

/**
 * Checks if a Pokemon will lose a piece of data when saved in the current game.
 * @param {Pokemon} pokemonData - The data to check if exists (eg. move, item, etc.).
 * @param {String} gameId - The game the Pokemon will be saved in.
 * @param {String} gameDataName - The submember in GAME_IDS_TO_DATA to load the data from.
 * @returns {Boolean} True if the data will be lost. False if it won't.
 */
function DataWillBeLostInGame(pokemonData, gameId, gameDataName)
{
    var allData;

    if (gameId in GAME_IDS_TO_DATA)
        allData = GAME_IDS_TO_DATA[gameId][gameDataName];

    return allData != null && !(pokemonData in allData);
}

/**
 * Checks if a Pokemon will lose its held item when saved in the current game.
 * @param {Pokemon} pokemon - The Pokemon to check.
 * @param {String} gameId - The game the Pokemon will be saved in.
 * @returns {Boolean} True if the Pokemon will lose its held item. False if it won't.
 */
export function MonWillLoseItemInSave(pokemon, gameId)
{
    return DataWillBeLostInGame(GetItem(pokemon), gameId, "items");
}

/**
 * Checks if a Pokemon will lose its caught Ball when saved in the current game.
 * @param {Pokemon} pokemon - The Pokemon to check.
 * @param {String} gameId - The game the Pokemon will be saved in.
 * @returns {Boolean} True if the Pokemon will lose its caught Ball. False if it won't.
 */
export function MonWillLoseBallInSave(pokemon, gameId)
{
    return DataWillBeLostInGame(GetCaughtBall(pokemon), gameId, "ballTypes");
}

/**
 * Checks if a Pokemon will lose a certain move when saved in the current game.
 * @param {String} move - The move to check.
 * @param {String} gameId - The game the Pokemon will be saved in.
 * @returns {Boolean} True if the Pokemon will lose the move. False if it won't.
 */
export function MonWillLoseMoveInSave(move, gameId)
{
    return DataWillBeLostInGame(move, gameId, "moves");
}

/**
 * Checks if a Pokemon will lose a move when saved in the current game.
 * @param {Pokemon} pokemon - The Pokemon to check.
 * @param {String} gameId - The game the Pokemon will be saved in.
 * @returns {Boolean} True if the Pokemon will lose at least one move. False if it won't.
 */
export function MonWillLoseSomeMoveInSave(pokemon, gameId)
{
    for (let move of GetMoves(pokemon))
    {
        if (MonWillLoseMoveInSave(move, gameId))
            return true;
    }

    return false;
}

/**
 * Checks if a Pokemon will lose any of its data when saved in the current game.
 * @param {Pokemon} pokemon - The Pokemon to check.
 * @param {String} gameId - The game the Pokemon will be saved in.
 * @returns {Boolean} True if the Pokemon will lose some data. False if it won't.
 */
export function MonWillLoseDataInSave(pokemon, gameId)
{
    return MonWillLoseItemInSave(pokemon, gameId)
        || MonWillLoseBallInSave(pokemon, gameId)
        || MonWillLoseSomeMoveInSave(pokemon, gameId);
}

/**
 * Checks if any Pokemon will lose any of its data when saved in the current game.
 * @param {Array<Pokemon>} boxes - The list of Pokemon to check.
 * @param {String} gameId - The game the Pokemon will be saved in.
 * @returns {Boolean} True if any Pokemon will lose some data. False if none will.
 */
export function WillAtLeastOneMonLoseDataInSave(boxes, gameId)
{
    for (let pokemon of boxes)
    {
        if (MonWillLoseDataInSave(pokemon, gameId))
            return true;
    }

    return false;
}

/**
 * Gets the species id that a Pokemon would be visible as (factors in gender).
 * @param {Pokemon} pokemon - The Pokemon to process.
 * @returns {String} The species id used for the Pokemon's icon.
 */
function GetMonVisibleSpecies(pokemon)
{
    var species = GetSpecies(pokemon, true);

    if (IsEgg(pokemon))
    {
        if (species === "SPECIES_MANAPHY")
            species = "SPECIES_EGG_MANAPHY";
        else
            species = "SPECIES_EGG";
    }

    if (typeof(species) == "string")
    {
        if (species.endsWith("_MEGA")
         || species.endsWith("_MEGA_X")
         || species.endsWith("_MEGA_Y")) //Can't exist outside of battle
            species = species.split("_MEGA")[0];
        else if (species.endsWith("_GIGA")) //Can't exist outside of battle
            species = species.split("_GIGA")[0];
        else if (species.endsWith("_PRIMAL")) //Can't exist outside of battle
            species = species.split("_PRIMAL")[0];

        species = UpdateSpeciesBasedOnMonGender(species, pokemon);
        species = UpdateSpeciesBasedOnIdenticalRegionalForm(species);

        switch (species)
        {
            case "SPECIES_WOBBUFFET":
                if (IsFemale(pokemon))
                    species = "SPECIES_WOBBUFFET_F"; //Not an actual species, but needed to load the red lips
                break;
            case "SPECIES_ALCREMIE_STRAWBERRY":
            case "SPECIES_ALCREMIE_BERRY":
            case "SPECIES_ALCREMIE_CLOVER":
            case "SPECIES_ALCREMIE_FLOWER":
            case "SPECIES_ALCREMIE_LOVE":
            case "SPECIES_ALCREMIE_RIBBON":
            case "SPECIES_ALCREMIE_STAR":
                species = species.replaceAll("ALCREMIE", `ALCREMIE_${GetAlcremieColour(pokemon)}`);
                break;
            default: //Needed for the compiler
                if (IsFemale(pokemon) && species.includes("PIKACHU"))
                {
                    if (species + "_F" in SPECIES_FORMS_ICON_NAMES)
                        species += "_F"; //Not an actual species, but needed to load the heart tail
                }
                break;
        }
    }

    if (species in BASE_FORMS_OF_BANNED_SPECIES) //Forms that can't exist outside of battle
        species = BASE_FORMS_OF_BANNED_SPECIES[species];

    return species;
}

/**
 * Updates a species based on an aesthetic gender difference.
 * @param {String} species - The species to update.
 * @param {Pokemon} pokemon - The Pokemon the species is for.
 * @returns {String} The updated species.
 */
export function UpdateSpeciesBasedOnMonGender(species, pokemon)
{
    const femaleForms = {
        "SPECIES_HIPPOPOTAS": "SPECIES_HIPPOPOTAS_F",
        "SPECIES_HIPPOWDON": "SPECIES_HIPPOWDON_F",
        "SPECIES_UNFEZANT": "SPECIES_UNFEZANT_F",
        "SPECIES_FRILLISH": "SPECIES_FRILLISH_F",
        "SPECIES_JELLICENT": "SPECIES_JELLICENT_F",
        "SPECIES_PYROAR": "SPECIES_PYROAR_FEMALE",
    };

    if (species in femaleForms && IsFemale(pokemon))
        species = femaleForms[species];

    return species;
}

/**
 * Updates a species based on an identical regional form.
 * @param {String} species - The species to update.
 * @returns {String} The updated species.
*/
export function UpdateSpeciesBasedOnIdenticalRegionalForm(species)
{
    const identicalRegionalForms = {
        "SPECIES_EXEGGCUTE_A": "SPECIES_EXEGGCUTE",
        "SPECIES_CUBONE_A": "SPECIES_CUBONE",
        "SPECIES_KOFFING_G": "SPECIES_KOFFING",
        "SPECIES_MIME_JR_G": "SPECIES_MIME_JR",
    };

    if (species in identicalRegionalForms)
        species = identicalRegionalForms[species];

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
    else if (typeof(species) == "string" && species in SpeciesNames)
    {
        speciesName = species.split("SPECIES_")[1];

        if (speciesName.endsWith("_A"))
            speciesName = speciesName.replaceAll("_A", "_ALOLA");
        else if (speciesName.endsWith("_G") && speciesName !== "UNOWN_G")
            speciesName = speciesName.replaceAll("_G", "_GALAR");
        else if (speciesName.endsWith("_H") && speciesName !== "UNOWN_H")
            speciesName = speciesName.replaceAll("_H", "_HISUI");

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
 * Gets the icon image link for a species.
 * @param {String} species - The species id to get the link for.
 * @param {Boolean} isShiny - True if the Pokemon link should be for a shiny Pokemon. False if regular.
 * @param {Boolean} isFromUnbound - True if the Pokemon originated in Pokemon Unbound. False otherwise.
 * @returns {String} The link to the icon image.
 */
export function GetIconSpeciesLinkBySpecies(species, isShiny, isFromUnbound)
{    
    if (isShiny && isFromUnbound && species in UnboundShinies)
        return BASE_GFX_LINK + "unbound_shinies/" + species + ".png";
    else if (IsSpeciesGen9(species))
        return BASE_GFX_LINK + "gen_9/" + (isShiny ? "shiny/" : "") + species + ".png";
    else if (species === "SPECIES_PIKACHU_SURFING"
          || species === "SPECIES_PIKACHU_FLYING")
        return BASE_GFX_LINK + species + (isShiny ? "_SHINY" : "") + ".png";

    var iconSpeciesName = GetIconSpeciesNameBySpecies(species);
    var baseLink = "https://raw.githubusercontent.com/msikma/pokesprite/master/";
    var colouration = iconSpeciesName === "unknown" || iconSpeciesName === "egg" || iconSpeciesName === "egg-manaphy" ? "" : isShiny ? "shiny/" : "regular/";
    var gen = IsSpeciesGen8(species) ? "pokemon-gen8/" : "pokemon-gen7x/";

    return baseLink + gen + colouration + iconSpeciesName + ".png";
}

/**
 * Gets the icon image link for a Pokemon.
 * @param {Pokemon} pokemon - The Pokemon to get the link for.
 * @returns {String} The link to the icon image.
 */
export function GetIconSpeciesLink(pokemon)
{
    return GetIconSpeciesLinkBySpecies(GetMonVisibleSpecies(pokemon), IsShiny(pokemon), GetMetGame(pokemon) === "unbound");
}
