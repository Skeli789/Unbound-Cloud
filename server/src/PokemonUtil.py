from Utils import *


def GetMonAbility(pokemon):
    if pokemon["hiddenAbility"] != 0 and BaseStatsDict[pokemon["species"]]["hiddenAbility"] != "ABILITY_NONE":
        return BaseStatsDict[pokemon["species"]]["hiddenAbility"]
    elif (pokemon["personality"] & 1) == 0 or BaseStatsDict[pokemon["species"]]["ability2"] == "ABILITY_NONE":
        return BaseStatsDict[pokemon["species"]]["ability1"]
    else:
        return BaseStatsDict[pokemon["species"]]["ability2"]


def GetGenderLetterFromSpeciesAndPersonality(species, personality):
    if species in BaseStatsDict:
        ratio = BaseStatsDict[species]["genderRatio"]

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
                return "F";
            else:
                return "M";

    return "U"  # Couldn't determine gender


def CalculateLevel(species, experience):
    if species in BaseStatsDict:
        expRate = BaseStatsDict[species]["growthRate"]
        if expRate in ExperienceCurves:
            level = 1
            while level <= MaxLevel and ExperienceCurves[expRate][level] <= experience:
                level += 1
            return level - 1

    return 1
