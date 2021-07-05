/*
    Various utility functions related to Pokemon data.
*/

import AbilityNames from "./data/AbilityNames.json";
import MoveNames from "./data/MoveNames.json";
import NatureNames from "./data/NatureNames.json";
import SpeciesNames from "./data/SpeciesNames.json";
import SpeciesDefines from "./data/UnboundSpecies.json";

const SHINY_ODDS = 16; //Actual probability is SHINY_ODDS/65536

const SPECIES_FORMS_ICON_NAMES = {
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
    "SPECIES_UNFEZANT_F": "female/unfezant",
    "SPECIES_BASCULIN_RED": "basculin",
    "SPECIES_BASCULIN_BLUE": "basculin-blue-striped",
    "SPECIES_FRILLISH_F": "female/frillish",
    "SPECIES_JELLICENT_F": "female/jellicent",
    "SPECIES_PYROAR_F": "female/pyroar",
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

const BASE_FORMS_OF_BANNED_SPECIES = { //All forms that can't exist outside of battle
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

function Getu32HighHalf(num)
{
    return (num & 0xFFFF0000) >> 16;
}

function Getu32LowHalf(num)
{
    return num & 0xFFFF;
}

export function IsMonShiny(pokemon)
{
    var shinyValue = new Uint32Array([0]); //Must be done this way to be unsigned
    shinyValue[0] = Getu32HighHalf(pokemon["otId"]) ^ Getu32LowHalf(pokemon["otId"])
                  ^ Getu32HighHalf(pokemon["personality"]) ^ Getu32LowHalf(pokemon["personality"]);

    return shinyValue[0] < SHINY_ODDS;
}

export function IsBlankMon(pokemon)
{
    if (!("species" in pokemon))
        return true;
    
    if (pokemon["species"] === ""
    || pokemon["species"] === 0
    || pokemon["species"] === "SPECIES_NONE")
        return true;

    return false;
}

export function IsSpeciesGen8(species)
{
    if (species in SpeciesDefines)
    return SpeciesDefines[species] >= SpeciesDefines["SPECIES_GROOKEY"];

    return species > SpeciesDefines["SPECIES_GROOKEY"]; 
}

export function IsMonGen8(pokemon)
{
    return IsSpeciesGen8(pokemon["species"]);
}

export function IsMonFemale(pokemon)
{
    //TODO
    return false;
}

export function IsMonEgg(pokemon)
{
    return pokemon["isEgg"] !== 0;
}

export function GetUnownLetter(pokemon)
{
    return (((pokemon["personality"] & 0x3000000) >> 18)
          | ((pokemon["personality"] & 0x30000) >> 12)
          | ((pokemon["personality"] & 0x300) >> 6)
          | (pokemon["personality"] & 0x3)) % 0x1C;
}

export function GetMonVisibleSpecies(pokemon)
{
    var species = pokemon["species"];
    if (IsMonEgg(pokemon))
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
                var unownLetter = GetUnownLetter(pokemon)
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
                if (IsMonFemale(pokemon))
                    species = "SPECIES_HIPPOPOTAS_F";
                break;
            case "SPECIES_HIPPOWDON":
                if (IsMonFemale(pokemon))
                    species = "SPECIES_HIPPOWDON_F";
                break;
            case "SPECIES_UNFEZANT":
                if (IsMonFemale(pokemon))
                    species = "SPECIES_UNFEZANT_F";
                break;
            case "SPECIES_FRILLISH":
                if (IsMonFemale(pokemon))
                    species = "SPECIES_FRILLISH_F";
                break;
            case "SPECIES_JELLICENT":
                if (IsMonFemale(pokemon))
                    species = "SPECIES_JELLICENT_F";
                break;
            case "SPECIES_PYROAR":
                if (IsMonFemale(pokemon))
                    species = "SPECIES_PYROAR_FEMALE";
                break;
            default:
                break;
        }
    }

    if (species in BASE_FORMS_OF_BANNED_SPECIES) //Forms that can't exist outside of battle
        species = BASE_FORMS_OF_BANNED_SPECIES[species]

    return species;
}

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

export function GetIconSpeciesName(pokemon)
{
    return GetIconSpeciesNameBySpecies(GetMonVisibleSpecies(pokemon));
}

export function GetIconSpeciesLinkByIconSpeciesName(iconSpeciesName, isShiny, isGen8)
{
    var baseLink = "https://raw.githubusercontent.com/msikma/pokesprite/master/";
    var colouration = iconSpeciesName === "unknown" || iconSpeciesName === "egg" || iconSpeciesName === "egg-manaphy" ? "" : isShiny ? "shiny/" : "regular/";
    var gen = isGen8 ? "pokemon-gen8/" : "pokemon-gen7x/";

    return baseLink + gen + colouration + iconSpeciesName + ".png";
}

export function GetIconSpeciesLinkBySpecies(species)
{
    var iconSpeciesName = GetIconSpeciesNameBySpecies(species);
    return GetIconSpeciesLinkByIconSpeciesName(iconSpeciesName, false, IsSpeciesGen8(species))
}

export function GetIconSpeciesLink(pokemon)
{
    var iconSpeciesName = GetIconSpeciesName(pokemon);
    return GetIconSpeciesLinkByIconSpeciesName(iconSpeciesName, IsMonShiny(pokemon), IsMonGen8(pokemon))
}

export function GetMonLevel(pokemon)
{
    return pokemon["level"];
}

export function GetMonAbility(pokemon)
{
    return pokemon["ability"];
}

export function GetMonGender(pokemon)
{
    return pokemon["gender"];
}

export function GetMonNature(pokemon)
{
    return pokemon["personality"] % 25;
}

export function GetVisibleStats(pokemon)
{
    //TODO
    return [0, 0, 0, 0, 0, 0];
}

export function GetVisibleEVs(pokemon)
{
    if (pokemon === null)
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

export function GetVisibleIVs(pokemon)
{
    if (pokemon === null || pokemon["ivs"] === null || pokemon["ivs"].length === 0)
        return [0, 0, 0, 0, 0, 0];

    return ([
        pokemon["ivs"][0], //HP
        pokemon["ivs"][1], //Attack
        pokemon["ivs"][2], //Defense
        pokemon["ivs"][4], //Sp. Atk
        pokemon["ivs"][5], //Sp. Def
        pokemon["ivs"][3], //Speed
    ]);
}

export function GetSpeciesName(species)
{
    if (typeof(species) == "string")
    {
        if (species in SpeciesNames)
            return SpeciesNames[species];
    }

    return "Unknown Species";
}

export function GetMoveName(move)
{
    if (move in MoveNames)
        return MoveNames[move];

    return "Unknown Move";
}

export function GetAbilityName(ability)
{
    if (ability in AbilityNames)
        return AbilityNames[ability]

    return "Unknown Ability";
}

export function GetNatureName(nature)
{
    if (nature in NatureNames)
        return NatureNames[nature];

    return "Unknown Nature";
}

export function GetItemName(item)
{
    //TODO

    if (typeof(item) === "string")
        return item.split("ITEM_")[1].replace("_", " ").replace(/(?:^|\s)\S/g, function(a) {return a.toUpperCase();}); //Capitalize first words
}
