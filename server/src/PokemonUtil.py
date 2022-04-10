import hashlib
import json
import random
from Defines import Defines

MAX_LEVEL = 100
NUM_STATS = 6

StatIdsToBaseAndEVs = {
    0: ("baseHP", "hpEv"),
    1: ("baseAttack", "atkEv"),
    2: ("baseDefense", "defEv"),
    3: ("baseSpeed", "spdEv"),
    4: ("baseSpAttack", "spAtkEv"),
    5: ("baseSpDefense", "spDefEv"),
}

NatureStatTable = {
                    # Atk Def Spd Sp.Atk Sp.Def
    "NATURE_HARDY":   ( 0,  0,  0,  0,  0),  # Hardy
    "NATURE_LONELY":  (+1, -1,  0,  0,  0),  # Lonely
    "NATURE_BRAVE":   (+1,  0, -1,  0,  0),  # Brave
    "NATURE_ADAMANT": (+1,  0,  0, -1,  0),  # Adamant
    "NATURE_NAUGHTY": (+1,  0,  0,  0, -1),  # Naughty
    "NATURE_BOLD":    (-1, +1,  0,  0,  0),  # Bold
    "NATURE_DOCILE":  ( 0,  0,  0,  0,  0),  # Docile
    "NATURE_RELAXED": ( 0, +1, -1,  0,  0),  # Relaxed
    "NATURE_IMPISH":  ( 0, +1,  0, -1,  0),  # Impish
    "NATURE_LAX":     ( 0, +1,  0,  0, -1),  # Lax
    "NATURE_TIMID":   (-1,  0, +1,  0,  0),  # Timid
    "NATURE_HASTY":   ( 0, -1, +1,  0,  0),  # Hasty
    "NATURE_SERIOUS": ( 0,  0,  0,  0,  0),  # Serious
    "NATURE_JOLLY":   ( 0,  0, +1, -1,  0),  # Jolly
    "NATURE_NAIVE":   ( 0,  0, +1,  0, -1),  # Naive
    "NATURE_MODEST":  (-1,  0,  0, +1,  0),  # Modest
    "NATURE_MILD":    ( 0, -1,  0, +1,  0),  # Mild
    "NATURE_QUIET":   ( 0,  0, -1, +1,  0),  # Quiet
    "NATURE_BASHFUL": ( 0,  0,  0,  0,  0),  # Bashful
    "NATURE_RASH":    ( 0,  0,  0, +1, -1),  # Rash
    "NATURE_CALM":    (-1,  0,  0,  0, +1),  # Calm
    "NATURE_GENTLE":  ( 0, -1,  0,  0, +1),  # Gentle
    "NATURE_SASSY":   ( 0,  0, -1,  0, +1),  # Sassy
    "NATURE_CAREFUL": ( 0,  0,  0, -1, +1),  # Careful
    "NATURE_QUIRKY":  ( 0,  0,  0,  0,  0),  # Quirky
}

CloneAbilities = [
    ("ABILITY_AIRLOCK", "ABILITY_CLOUDNINE"),
    ("ABILITY_BATTLEARMOR", "ABILITY_SHELLARMOR"),
    ("ABILITY_CLEARBODY", "ABILITY_WHITESMOKE"),
    ("ABILITY_DAZZLING", "ABILITY_QUEENLYMAJESTY"),
    ("ABILITY_SOLIDROCK", "ABILITY_FILTER", "ABILITY_PRISMARMOR"),
    ("ABILITY_GOOEY", "ABILITY_TANGLINGHAIR"),
    ("ABILITY_HUGEPOWER", "ABILITY_PUREPOWER"),
    ("ABILITY_INSOMNIA", "ABILITY_VITALSPIRIT"),
    ("ABILITY_MOLDBREAKER", "ABILITY_TERAVOLT", "ABILITY_TURBOBLAZE"),
    ("ABILITY_MOXIE", "ABILITY_CHILLINGNEIGH"),
    ("ABILITY_STALWART", "ABILITY_PROPELLERTAIL"),
    ("ABILITY_PROTEAN", "ABILITY_LIBERO"),
    ("ABILITY_RECEIVER", "ABILITY_POWEROFALCHEMY"),
    ("ABILITY_ROUGHSKIN", "ABILITY_IRONBARBS"),
    ("ABILITY_WIMPOUT", "ABILITY_EMERGENCYEXIT"),
]

MiniorCores = [
    "SPECIES_MINIOR_RED",
    "SPECIES_MINIOR_BLUE",
    "SPECIES_MINIOR_ORANGE",
    "SPECIES_MINIOR_YELLOW",
    "SPECIES_MINIOR_INDIGO",
    "SPECIES_MINIOR_GREEN",
    "SPECIES_MINIOR_VIOLET",
]


class PokemonUtil:
    @staticmethod
    def GetBaseStats(pokemon: dict) -> dict:
        return Defines.baseStats[pokemon["species"]]  # Want error to be thrown here (if needed) and not farther up the stack

    @staticmethod
    def GetAbilitySlot(pokemon: dict) -> int:
        baseStats = PokemonUtil.GetBaseStats(pokemon)

        if pokemon["hiddenAbility"] and baseStats["hiddenAbility"] != "ABILITY_NONE":
            return 2  # Hidden Ability
        elif (pokemon["personality"] & 1) == 0 or baseStats["ability2"] == "ABILITY_NONE":
            return 0  # Ability 1
        else:
            return 1  # Ability 2

    @staticmethod
    def GetAbility(pokemon: dict) -> str:
        abilitySlot = PokemonUtil.GetAbilitySlot(pokemon)
        baseStats = PokemonUtil.GetBaseStats(pokemon)

        if abilitySlot == 0:
            return baseStats["ability1"]
        elif abilitySlot == 1:
            return baseStats["ability2"]
        else:
            return baseStats["hiddenAbility"]

    @staticmethod
    def GetGender(pokemon: dict) -> str:
        return PokemonUtil.GetGenderFromSpeciesAndPersonality(pokemon["species"], pokemon["personality"])

    @staticmethod
    def GetGenderFromSpeciesAndPersonality(species: str, personality: int) -> str:
        if species in Defines.baseStats:
            ratio = Defines.baseStats[species]["genderRatio"]

            if ratio == "MON_MALE" or ratio == "PERCENT_FEMALE(0)":
                return "M"
            elif ratio == "MON_FEMALE" or ratio == "PERCENT_FEMALE(100)":  # Normally leaving it up to the percent calc (below) wouldn't guarantee a 100% female
                return "F"
            elif ratio == "MON_GENDERLESS":
                return "U"
            elif ratio.startswith("PERCENT_FEMALE("):
                percent = float(ratio.split("(")[1].split(")")[0])
                ratio = min(254, ((percent * 255) // 100))

                if ratio > (personality & 0xFF):
                    return "F"
                else:
                    return "M"

        return "U"  # Couldn't determine gender

    @staticmethod
    def GetNature(pokemon: dict) -> int:
        return PokemonUtil.GetNatureFromPersonality(pokemon["personality"])

    @staticmethod
    def GetNatureFromPersonality(personality: int) -> int:
        return Defines.natures[personality % 25]

    @staticmethod
    def IsShiny(pokemon: dict) -> bool:
        if pokemon["species"] == "SPECIES_NONE":
            return False
        return PokemonUtil.IsShinyOtIdPersonality(pokemon["otId"], pokemon["personality"])

    @staticmethod
    def IsShinyOtIdPersonality(otId: int, personality: int) -> bool:
        shinyValue = ((otId >> 16) & 0xFFFF) ^ (otId & 0xFFFF) ^ ((personality >> 16) & 0xFFFF) ^ (personality & 0xFFFF)
        return shinyValue < Defines.shinyOdds

    @staticmethod
    def GetUnownLetterFromPersonality(personality: int) -> int:
        return (((personality & 0x3000000) >> 18)
              | ((personality & 0x0030000) >> 12)
              | ((personality & 0x0000300) >> 6)
              | ((personality & 0x0000003) >> 0)) % 28

    @staticmethod
    def GetMiniorCoreFromPersonality(personality: int) -> str:
        return MiniorCores[personality % (len(MiniorCores))]

    @staticmethod
    def CalculateLevel(pokemon: dict) -> int:
        species = pokemon["species"]
        experience = pokemon["experience"]

        if species in Defines.baseStats:
            expRate = Defines.baseStats[species]["growthRate"]
            if expRate in Defines.experienceCurves:
                lowLevel = 1
                highLevel = MAX_LEVEL
                expCurve = Defines.experienceCurves[expRate]

                while lowLevel < highLevel:
                    mid = (lowLevel + highLevel) // 2

                    if expCurve[mid] == experience:  # Check if experience matches at mid (probably won't)
                        return mid
                    elif expCurve[mid] < experience:  # If experience is greater, ignore lower half
                        lowLevel = mid + 1
                    else:  # If experience is smaller, ignore right half
                        highLevel = mid - 1

                if expCurve[highLevel] > experience:  # Not actually at the higher level yet
                    return highLevel - 1
                else:
                    return highLevel

        return 1

    @staticmethod
    def CalculateStat(pokemon: dict, statId: int) -> int:
        species = pokemon["species"]
        level = pokemon["level"]
        base = PokemonUtil.GetBaseStats(pokemon)[StatIdsToBaseAndEVs[statId][0]]
        iv = pokemon["ivs"][statId]

        if StatIdsToBaseAndEVs[statId][1] in pokemon:
            ev = pokemon[StatIdsToBaseAndEVs[statId][1]]
        else:
            ev = pokemon["evs"][statId]

        if statId == 0:  # HP
            if species == "SPECIES_SHEDINJA":
                val = 1
            else:
                val = 2 * base + iv
                val = min((((val + ev // 4) * level) // 100) + level + 10, 0xFFFF)
        else:
            val = ((((2 * base + iv + ev // 4) * level) // 100) + 5)

        val = PokemonUtil.ModifyStatByNature(pokemon["nature"], val, statId)
        return val

    @staticmethod
    def UpdateStats(pokemon: dict):
        stats = []
        for statId in range(NUM_STATS):
            stats.append(PokemonUtil.CalculateStat(pokemon, statId))
        pokemon["rawStats"] = stats

    @staticmethod
    def ModifyStatByNature(nature: str, rawStat: int, statId: int) -> int:
        if statId < 1 or statId > 5:
            return rawStat

        if NatureStatTable[nature][statId - 1] == 1:
            return (rawStat * 110) // 100
        elif NatureStatTable[nature][statId - 1] == -1:
            return (rawStat * 90) // 100

        return rawStat

    @staticmethod
    def CalculateChecksum(pokemon: dict):
        pokemon = pokemon.copy()  # Don't modify the original Pokemon
        if "markings" in pokemon:
            del pokemon["markings"]  # These can be changed on the site so shouldn't be included in the checksum
        if "checksum" in pokemon:
            del pokemon["checksum"]  # Don't include an older calculated checksum
        return hashlib.md5((json.dumps(pokemon, sort_keys=True) + "extra").encode("utf-8")).hexdigest()  # Add "extra" on so people can't create their own checksums with the original data

    @staticmethod
    def IsUpdatedDataVersion(pokemon: dict):
        return "metGame" in pokemon or "metGameId" in pokemon or "metLevel" in pokemon or "evs" in pokemon 

    @staticmethod
    def IsCloneAbility(ability1: str, ability2: str):
        for clones in CloneAbilities:
            if ability1 in clones and ability2 in clones:
                return True

        return False

    @staticmethod
    def ChangeAbility(pokemon: dict, abilityNum: int):
        if abilityNum == 0 or abilityNum == 1:
            species = pokemon["species"]
            personality = pokemon["personality"]
            otId = pokemon["otId"]
            sid = (otId >> 16) & 0xFFFF
            tid = otId & 0xFFFF
            pokemon["hiddenAbility"] = False

            gender = PokemonUtil.GetGender(pokemon)
            isShiny = PokemonUtil.IsShiny(pokemon)
            letter = PokemonUtil.GetUnownLetterFromPersonality(personality)
            nature = PokemonUtil.GetNatureFromPersonality(personality)
            isMinior = species.startswith("SPECIES_MINIOR")
            miniorCore = PokemonUtil.GetMiniorCoreFromPersonality(personality)
            loop = personality & 1 != abilityNum  # Doesn't already have Ability

            if abilityNum == 1 and PokemonUtil.GetBaseStats(pokemon)["ability2"] == "ABILITY_NONE":
                return  # No point in wasting time to change it

            while loop:
                personality = random.randint(0, 0xFFFFFFFF + 1)

                if isShiny:
                    shinyRange = random.randint(0, Defines.shinyOdds)
                    personality = (((shinyRange ^ (sid ^ tid)) ^ (personality & 0xFFFF)) << 16) | (personality & 0xFFFF)

                personality &= ~1
                personality |= abilityNum  # Either 0 or 1

                loop = (PokemonUtil.GetNatureFromPersonality(personality) != nature
                        or PokemonUtil.GetGenderFromSpeciesAndPersonality(species, personality) != gender
                        or (not isShiny and PokemonUtil.IsShinyOtIdPersonality(otId, personality))  # No free shinies
                        or (isShiny and not PokemonUtil.IsShinyOtIdPersonality(otId, personality))
                        or (species == "SPECIES_UNOWN" and PokemonUtil.GetUnownLetterFromPersonality(personality) != letter)
                        or (isMinior and PokemonUtil.GetMiniorCoreFromPersonality(personality) != miniorCore))

            pokemon["personality"] = personality
        else:  # Hidden Ability
            pokemon["hiddenAbility"] = True
