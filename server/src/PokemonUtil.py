import random

from Defines import Defines

MaxLevel = 100
NumStats = 6

StatIdsToBaseAndEVs = {
    0: ("baseHP", "hpEv"),
    1: ("baseAttack", "atkEv"),
    2: ("baseDefense", "defEv"),
    3: ("baseSpeed", "spdEv"),
    4: ("baseSpAttack", "spAtkEv"),
    5: ("baseSpDefense", "spDefEv"),
}

NatureStatTable = [
    # Atk Def Spd Sp.Atk Sp.Def
    (0, 0, 0, 0, 0),  # Hardy
    (+1, -1, 0, 0, 0),  # Lonely
    (+1, 0, -1, 0, 0),  # Brave
    (+1, 0, 0, -1, 0),  # Adamant
    (+1, 0, 0, 0, -1),  # Naughty
    (-1, +1, 0, 0, 0),  # Bold
    (0, 0, 0, 0, 0),  # Docile
    (0, +1, -1, 0, 0),  # Relaxed
    (0, +1, 0, -1, 0),  # Impish
    (0, +1, 0, 0, -1),  # Lax
    (-1, 0, +1, 0, 0),  # Timid
    (0, -1, +1, 0, 0),  # Hasty
    (0, 0, 0, 0, 0),  # Serious
    (0, 0, +1, -1, 0),  # Jolly
    (0, 0, +1, 0, -1),  # Naive
    (-1, 0, 0, +1, 0),  # Modest
    (0, -1, 0, +1, 0),  # Mild
    (0, 0, -1, +1, 0),  # Quiet
    (0, 0, 0, 0, 0),  # Bashful
    (0, 0, 0, +1, -1),  # Rash
    (-1, 0, 0, 0, +1),  # Calm
    (0, -1, 0, 0, +1),  # Gentle
    (0, 0, -1, 0, +1),  # Sassy
    (0, 0, 0, -1, +1),  # Careful
    (0, 0, 0, 0, 0),  # Quirky
]

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
    def GetAbility(pokemon: {}) -> str:
        if pokemon["hiddenAbility"] != 0 and Defines.baseStats[pokemon["species"]]["hiddenAbility"] != "ABILITY_NONE":
            return Defines.baseStats[pokemon["species"]]["hiddenAbility"]
        elif (pokemon["personality"] & 1) == 0 or Defines.baseStats[pokemon["species"]]["ability2"] == "ABILITY_NONE":
            return Defines.baseStats[pokemon["species"]]["ability1"]
        else:
            return Defines.baseStats[pokemon["species"]]["ability2"]

    @staticmethod
    def GetGender(pokemon: {}) -> str:
        return PokemonUtil.GetGenderFromSpeciesAndPersonality(pokemon["species"], pokemon["personality"])

    @staticmethod
    def GetGenderFromSpeciesAndPersonality(species: str, personality: int) -> str:
        if species in Defines.baseStats:
            ratio = Defines.baseStats[species]["genderRatio"]

            if ratio == "MON_MALE":
                return "M"
            elif ratio == "MON_FEMALE":
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
    def GetNature(pokemon: {}) -> int:
        return PokemonUtil.GetNatureFromPersonality(pokemon["personality"])

    @staticmethod
    def GetNatureFromPersonality(personality: int) -> int:
        return personality % 25

    @staticmethod
    def IsShiny(pokemon: {}) -> bool:
        if pokemon["species"] == "SPECIES_NONE":
            return False
        return PokemonUtil.IsShinyOtIdPersonality(pokemon["otId"], pokemon["personality"])

    @staticmethod
    def IsShinyOtIdPersonality(otId: int, personality: int) -> bool:
        shinyValue = ((otId >> 16) & 0xFFFF) ^ (otId & 0xFFFF) ^ ((personality >> 16) & 0xFFFF) ^ (personality & 0xFFFF)
        return shinyValue < Defines.shinyOdds

    @staticmethod
    def GetUnownLetterFromPersonality(personality: int):
        return (((personality & 0x3000000) >> 18)
                | ((personality & 0x0030000) >> 12)
                | ((personality & 0x0000300) >> 6)
                | ((personality & 0x0000003) >> 0)) % 28

    @staticmethod
    def GetMiniorCoreFromPersonality(personality: int):
        return MiniorCores[personality % (len(MiniorCores))]

    @staticmethod
    def CalculateLevel(pokemon: {}) -> int:
        species = pokemon["species"]
        experience = pokemon["experience"]

        if species in Defines.baseStats:
            expRate = Defines.baseStats[species]["growthRate"]
            if expRate in Defines.experienceCurves:
                level = 1
                while level <= MaxLevel and Defines.experienceCurves[expRate][level] <= experience:
                    level += 1
                return level - 1

        return 1

    @staticmethod
    def CalculateStat(pokemon: {}, statId: int) -> int:
        species = pokemon["species"]
        level = pokemon["level"]
        base = Defines.baseStats[species][StatIdsToBaseAndEVs[statId][0]]
        ev = pokemon[StatIdsToBaseAndEVs[statId][1]]
        iv = pokemon["ivs"][statId]

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
    def UpdateStats(pokemon: {}):
        stats = []
        for statId in range(NumStats):
            stats.append(PokemonUtil.CalculateStat(pokemon, statId))
        pokemon["rawStats"] = stats

    @staticmethod
    def ModifyStatByNature(nature: int, rawStat: int, statId: int) -> int:
        if statId < 1 or statId > 5:
            return rawStat

        if NatureStatTable[nature][statId - 1] == 1:
            return (rawStat * 110) // 100
        elif NatureStatTable[nature][statId - 1] == -1:
            return (rawStat * 90) // 100

        return rawStat

    @staticmethod
    def IsCloneAbility(ability1, ability2):
        for clones in CloneAbilities:
            if ability1 in clones and ability2 in clones:
                return True

        return False

    @staticmethod
    def ChangeAbility(pokemon: {}, abilityNum):
        if abilityNum == 0 or abilityNum == 1:
            species = pokemon["species"]
            personality = pokemon["personality"]
            otId = pokemon["otId"]
            sid = (otId >> 16) & 0xFFFF
            tid = otId & 0xFFFF

            gender = PokemonUtil.GetGender(pokemon)
            isShiny = PokemonUtil.IsShiny(pokemon)
            letter = PokemonUtil.GetUnownLetterFromPersonality(personality)
            nature = PokemonUtil.GetNatureFromPersonality(personality)
            isMinior = species.startswith("SPECIES_MINIOR")
            miniorCore = PokemonUtil.GetMiniorCoreFromPersonality(personality)
            loop = personality & 1 != abilityNum  # Doesn't already have Ability

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
                        or (species == "SPECIES_UNOWN" and PokemonUtil.GetUnownLetterFromPersonality(
                            personality) != letter)
                        or (isMinior and PokemonUtil.GetMiniorCoreFromPersonality(personality) != miniorCore))

            pokemon["hiddenAbility"] = 0
            pokemon["personality"] = personality
        else:  # Hidden Ability
            pokemon["hiddenAbility"] = 1
