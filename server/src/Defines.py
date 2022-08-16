from importlib.metadata import files
import json
import os
import sys
from typing import Dict, List

## Defines Files ##
SRC_DIR = os.path.dirname(os.path.realpath(__file__))
GAME_DATA_DIR = f"{SRC_DIR}/data"  # os.path.join(os.path.dirname(os.path.dirname(SRC_DIR)), "public", "data")
NatureDefines = f"{SRC_DIR}/data/Natures.json"
LanguageDefines = f"{SRC_DIR}/data/Languages.json"
DexNumDefines = f"{SRC_DIR}/data/DexNum.json"
SpeciesToDexNumDefines = f"{SRC_DIR}/data/SpeciesToDexNum.json"
ExperienceCurveDefines = f"{SRC_DIR}/data/ExperienceCurves.json"
CharMapDefines = f"{SRC_DIR}/data/charmap.tbl"
SpeciesDefines = "Species.json"
UnofficialSpeciesDefines = "UnofficialSpecies.json"
MovesDefines = "Moves.json"
ItemsDefines = "Items.json"
BaseStatsDefines = "BaseStats.json"
BallTypeDefines = "BallTypes.json"

## File Signatures ##
VANILLA_FILE_SIGNATURE = 0x08012025
CFRE_FILE_SIGNATURE = 0x29012004
UNBOUND_FILE_SIGNATURE = 0x01121999
WISH_FILE_SIGNATURE = 0x18190804
MAGM_FILE_SIGNATURE = 0xC7BBC1C7
IR_FILE_SIGNATURE = 0x14B66BBC

## Old File Signatures ##
UNBOUND_2_0_FILE_SIGNATURE = 0x01121998  # Unbound 2.0.0 - 2.0.3.2 

## Flags and Vars ##
FLAG_FR_GAME_CLEAR = 0x82C
FLAG_CFRU_SPECIES_RANDOMIZER = 0x940
FLAG_CFRU_LEARNSET_RANDOMIZER = 0x941
FLAG_UNBOUND_SPECIES_RANDOMIZER = 0x9FD
FLAG_UNBOUND_LEARNSET_RANDOMIZER = 0x9FE
FLAG_UNBOUND_NEW_GAME_PLUS = 0x16DB
FLAG_UNBOUND_SANDBOX_MODE = 0x16E4
VAR_UNBOUND_GAME_DIFFICULTY = 0x50DF
FLAG_MAGM_PC_ACCESSED = 0x215

## Other Constants ##
OLD_SHINY_ODDS = 8  # 1/8192
MODERN_SHINY_ODDS = 16  # 1/4096
INFLAMED_RED_SHINY_ODDS = 64 # 1/1024
INSANE_DIFFICULTY_UNBOUND = 3

# Game Versions
VERSION_SAPPHIRE = 1
VERSION_RUBY = 2
VERSION_EMERALD = 3
VERSION_FIRERED = 4
VERSION_LEAFGREEN = 5
VERSION_WISH = 13
VERSION_MAGM = 14
VERSION_UNBOUND = 15

# Regions
REGION_KANTO = 0
REGION_HOENN = 1
REGION_BORRIUS = 2
REGION_MAGM = 3
REGION_WISH = 4


GameDetails = {
    VANILLA_FILE_SIGNATURE: {
        "name": "firered",
        "version": VERSION_FIRERED,
        "baseVersion": VERSION_FIRERED,
        "region": REGION_KANTO,
        "cfru": False,
        "definesDir": "cfru",
        "shinyOdds": OLD_SHINY_ODDS,
        "boxCount": 14,
    },
    CFRE_FILE_SIGNATURE: {
        "name": "cfre",
        "version": VERSION_FIRERED,
        "baseVersion": VERSION_FIRERED,
        "region": REGION_KANTO,
        "cfru": True,
        "definesDir": "cfru",
        "shinyOdds": OLD_SHINY_ODDS,
        "boxCount": 25,
        "randomizerFlags": [FLAG_CFRU_SPECIES_RANDOMIZER, FLAG_CFRU_LEARNSET_RANDOMIZER],
    },
    UNBOUND_FILE_SIGNATURE: {
        "name": "unbound",
        "version": VERSION_UNBOUND,
        "baseVersion": VERSION_FIRERED,
        "region": REGION_BORRIUS,
        "cfru": True,
        "definesDir": "unbound",
        "shinyOdds": MODERN_SHINY_ODDS,
        "boxCount": 25,
        "randomizerFlags": [FLAG_UNBOUND_SPECIES_RANDOMIZER, FLAG_UNBOUND_LEARNSET_RANDOMIZER],
        "inaccessible": [
            {   # Insane difficulty
                "varSetTo": (VAR_UNBOUND_GAME_DIFFICULTY, INSANE_DIFFICULTY_UNBOUND),
                "butNotIfFlagSet": [FLAG_FR_GAME_CLEAR, FLAG_UNBOUND_NEW_GAME_PLUS],
            },
            {   # Sandbox Mode before post-game
                "flagSet": FLAG_UNBOUND_SANDBOX_MODE,
                "butNotIfFlagSet": FLAG_FR_GAME_CLEAR,
            }
        ],
    },
    # WISH_FILE_SIGNATURE: {
    #     "name": "wish",
    #     "version": VERSION_WISH,
    #     "baseVersion": VERSION_FIRERED,
    #     "region": REGION_WISH,
    #     "cfru": True,
    #     "definesDir": "wish",
    #     "shinyOdds": MODERN_SHINY_ODDS,
    #     "boxCount": 25,
    #     "randomizerFlags": [FLAG_CFRU_SPECIES_RANDOMIZER, FLAG_CFRU_LEARNSET_RANDOMIZER],
    # }
    MAGM_FILE_SIGNATURE: {
        "name": "magm",
        "version": VERSION_MAGM,
        "baseVersion": VERSION_FIRERED,
        "region": REGION_MAGM,
        "cfru": True,
        "definesDir": "magm",
        "shinyOdds": OLD_SHINY_ODDS,
        "boxCount": 24,
        "inaccessible": [
            {   # PC has not been accessed
                "flagNotSet": FLAG_MAGM_PC_ACCESSED,
            }
        ]
    },
    IR_FILE_SIGNATURE: {
        "name": "inflamedred",
        "version": VERSION_FIRERED,
        "baseVersion": VERSION_FIRERED,
        "region": REGION_KANTO,
        "cfru": True,
        "definesDir": "inflamedred",
        "shinyOdds": INFLAMED_RED_SHINY_ODDS,
        "boxCount": 25,
        "randomizerFlags": [FLAG_CFRU_SPECIES_RANDOMIZER, FLAG_CFRU_LEARNSET_RANDOMIZER],
    },
}

BaseVersionNames = {
    VERSION_SAPPHIRE: "sapphire",
    VERSION_RUBY: "ruby",
    VERSION_EMERALD: "emerald",
    VERSION_FIRERED: "firered",
    VERSION_LEAFGREEN: "leafgreen",
}

CustomHackVersions = {  # GAME_NAME
    VERSION_WISH: "wish",
    VERSION_MAGM: "magm",
    VERSION_UNBOUND: "unbound",
}

OldVersionFileSignatures = {
    UNBOUND_2_0_FILE_SIGNATURE: "Unbound 2.0",
}


class Defines:
    fileSignature = VANILLA_FILE_SIGNATURE
    shinyOdds = OLD_SHINY_ODDS
    species = dict()
    reverseSpecies = dict()
    unofficialSpecies = dict()
    dexNum = dict()
    reverseDexNum = dict()
    speciesToDexNum = dict()
    moves = dict()
    reverseMoves = dict()
    items = dict()
    reverseItems = dict()
    natures = dict()
    reverseNatures = dict()
    ballTypes = dict()
    reverseBallTypes = dict()
    experienceCurves = dict()
    baseStats = dict()
    charMap = dict()
    reverseCharMap = dict()

    @staticmethod
    def GetCurrentGameName() -> str:
        return GameDetails[Defines.fileSignature]["name"]

    @staticmethod
    def GetCurrentDefinesDir() -> str:
        return GameDetails[Defines.fileSignature]["definesDir"]

    @staticmethod
    def GetRandomizerFlags() -> List[int]:
        if "randomizerFlags" in GameDetails[Defines.fileSignature]:
            return GameDetails[Defines.fileSignature]["randomizerFlags"]

        return []

    @staticmethod
    def GetInaccessibleConditions() -> List[dict]:
        if "inaccessible" in GameDetails[Defines.fileSignature]:
            return GameDetails[Defines.fileSignature]["inaccessible"]

        return []

    @staticmethod
    def GetMonOriginalGameName(monGameId: str) -> str:
        gameName = "unknown"
        if Defines.fileSignature in GameDetails:
            gameName = Defines.GetCurrentGameName()

        if monGameId in CustomHackVersions:  # Mon is set to have come from a different registered hack
            ## Eg. saveFileGameName == "unbound", monGameId == VERSION_UNBOUND
            if gameName == CustomHackVersions[monGameId]:
                monGameId = GameDetails[Defines.fileSignature]["baseVersion"]
                gameName = BaseVersionNames[monGameId]  # A custom hack having a mon with it's own game id means it came from the base version
            else:
                ## Eg. saveFileGameName == "cfre", monGameId == VERSION_UNBOUND
                gameName = CustomHackVersions[monGameId]

        return gameName

    @staticmethod
    def GetFileSignatureByGameName(gameName: str) -> int:
        for signature in GameDetails:
            if GameDetails[signature]["name"] == gameName:
                return signature

        return 0
    
    @staticmethod
    def GetMetIdToBeSaved(monGameName: str) -> str:
        monGameSignature = Defines.GetFileSignatureByGameName(monGameName)
        if monGameSignature in GameDetails:
            # Check staying within same region
            if GameDetails[Defines.fileSignature]["region"] == GameDetails[monGameSignature]["region"]:
                return GameDetails[Defines.fileSignature]["baseVersion"]

            ## Moving to another game ##
            if GameDetails[monGameSignature]["version"] == GameDetails[Defines.fileSignature]["baseVersion"]:
                return GameDetails[Defines.fileSignature]["version"]
            else:
                return GameDetails[monGameSignature]["version"]
        elif Defines.fileSignature in GameDetails:  # Error handling
            return GameDetails[Defines.fileSignature]["baseVersion"]
        else:
            return VERSION_FIRERED  # Error handling

    @staticmethod
    def IsValidFileSignature(fileSignature: int) -> bool:
        return fileSignature in GameDetails \
            or Defines.IsOldVersionFileSignature(fileSignature)  # Valid so it can return the proper error

    @staticmethod
    def IsOldVersionFileSignature(fileSignature: int) -> bool:
        return fileSignature in OldVersionFileSignatures

    @staticmethod
    def GetOldVersionGameName(fileSignature: int) -> bool:
        if Defines.IsOldVersionFileSignature(fileSignature):
            return OldVersionFileSignatures[fileSignature]
        else:
            return ""

    @staticmethod
    def IsCFRUHack() -> bool:
        return GameDetails[Defines.fileSignature]["cfru"]

    @staticmethod
    def BoxCount() -> bool:
        return GameDetails[Defines.fileSignature]["boxCount"]

    @staticmethod
    def GetSpeciesDexNum(species: str) -> int:
        if species in Defines.speciesToDexNum:
            dexTag = Defines.speciesToDexNum[species]
            if dexTag in Defines.reverseDexNum:
                return Defines.reverseDexNum[dexTag]
        return 0

    @staticmethod
    def LoadAll(fileSignature: int) -> bool:
        if Defines.IsValidFileSignature(fileSignature):
            speciesDefines = f"{GAME_DATA_DIR}/{GameDetails[fileSignature]['definesDir']}/{SpeciesDefines}"
            unofficialSpeciesDefines = f"{GAME_DATA_DIR}/{GameDetails[fileSignature]['definesDir']}/{UnofficialSpeciesDefines}"
            movesDefines = f"{GAME_DATA_DIR}/{GameDetails[fileSignature]['definesDir']}/{MovesDefines}"
            itemDefines = f"{GAME_DATA_DIR}/{GameDetails[fileSignature]['definesDir']}/{ItemsDefines}"
            baseStatsDefines = f"{GAME_DATA_DIR}/{GameDetails[fileSignature]['definesDir']}/{BaseStatsDefines}"
            ballTypeDefines = f"{GAME_DATA_DIR}/{GameDetails[fileSignature]['definesDir']}/{BallTypeDefines}"
            shinyOdds = GameDetails[fileSignature]["shinyOdds"]
            natureDefines = NatureDefines
            languageDefines = LanguageDefines
            dexNumDefines = DexNumDefines
            speciesToDexNumDefines = SpeciesToDexNumDefines
            experienceCurveDefines = ExperienceCurveDefines

            Defines.fileSignature = fileSignature
            Defines.shinyOdds = shinyOdds
            Defines.species = Defines.DictMakerFromJSON(speciesDefines, True)
            Defines.reverseSpecies = Defines.Reverse(Defines.species)
            Defines.unofficialSpecies = Defines.DictMakerFromJSON(unofficialSpeciesDefines, True)
            Defines.speciesToDexNum = Defines.DictMakerFromJSON(speciesToDexNumDefines)
            Defines.dexNum = Defines.DictMakerFromJSON(dexNumDefines, True)
            Defines.reverseDexNum = Defines.Reverse(Defines.dexNum)
            Defines.moves = Defines.DictMakerFromJSON(movesDefines, True)
            Defines.reverseMoves = Defines.Reverse(Defines.moves)
            Defines.items = Defines.DictMakerFromJSON(itemDefines, True)
            Defines.reverseItems = Defines.Reverse(Defines.items)
            Defines.natures = Defines.JSONListDictMaker(natureDefines)
            Defines.reverseNatures = Defines.Reverse(Defines.natures)
            Defines.languages = Defines.JSONListDictMaker(languageDefines)
            Defines.reverseLanguages = Defines.Reverse(Defines.languages)
            Defines.ballTypes = Defines.JSONListDictMaker(ballTypeDefines)
            Defines.reverseBallTypes = Defines.Reverse(Defines.ballTypes)
            Defines.experienceCurves = Defines.DictMakerFromJSON(experienceCurveDefines, False)
            Defines.baseStats = Defines.DictMakerFromJSON(baseStatsDefines)
            Defines.LoadCharMap()
            return True
        else:
            return False

    @staticmethod
    def LoadCharMap():
        Defines.charMap = Defines.PokeByteTableMaker(CharMapDefines)
        Defines.reverseCharMap = Defines.Reverse(Defines.charMap)

    @staticmethod
    def DictMaker(definesFile: str) -> dict:
        definesDict = {}
        if os.path.isfile(definesFile):
            with open(definesFile, "r") as file:
                for line in file:
                    if line.startswith("#define "):
                        lineList = line.split()
                        try:
                            definesDict[int(lineList[2])] = lineList[1]  # Try read int
                        except ValueError:
                            try:
                                definesDict[int(lineList[2], 16)] = lineList[1]  # Try read hex
                            except ValueError:
                                pass
                        except IndexError:  # Trying to read a define that has no value
                            pass

        return definesDict

    @staticmethod
    def DictMakerFromJSON(definesFile: str, keysShouldBeInts=False) -> dict:
        data = {}

        if os.path.isfile(definesFile):
            with open(definesFile, "r") as file:
                data = json.load(file)
                if keysShouldBeInts:  # Each key is like "0" or "1" so change to 0 and 1
                    data = {int(key): value for key, value in data.items()}

        return data

    @staticmethod
    def JSONListDictMaker(definesFile: str) -> Dict[int, str]:
        if os.path.isfile(definesFile):
            with open(definesFile, "r") as file:
                names = json.load(file)
                numbers = list(range(len(names)))
                return dict(zip(numbers, names))

        return {}

    @staticmethod
    def PokeByteTableMaker(definesFile: str) -> Dict[int, str]:
        dictionary = dict()
        with open(definesFile, 'r', encoding='utf-8') as file:
            dictionary[0] = " "
            for line in file:
                if line.strip() != "/FF" and line.strip() != "":
                    if line[2] == '=' and line[3] != "":
                        try:
                            if line[3] == '\\':
                                key = int(line.split('=')[0], 16)
                                value = line[3] + line[4]
                            else:
                                key = int(line.split('=')[0], 16)
                                value = line[3]

                            dictionary[key] = value

                        except:
                            pass
        return dictionary

    @staticmethod
    def CStructArrayToDict(inputFile: str, arrayName: str, baseDict: dict):
        with open(inputFile, 'r') as file:
            fileData = file.read().split()
            reading = False
            stackSize = 0
            subArrayIndex = -1
            totalList = []
            totalDict = {}
            flagMember = False
            dataDict = baseDict.copy()
            if "moves" in dataDict:
                dataDict["moves"] = {0: "MOVE_NONE", 1: "MOVE_NONE", 2: "MOVE_NONE", 3: "MOVE_NONE"}

            for i, word in enumerate(fileData):
                if not reading:
                    if arrayName in word:
                        reading = True  # Start reading data

                else:  # Data is being read
                    oldStackSize = stackSize
                    stackSize += word.count('{')
                    stackSize -= word.count('}')

                    if stackSize < 0:
                        # print("Too many closing braces and not enough opening braces. Exiting program.")
                        sys.exit(1)

                    elif stackSize == 0 and oldStackSize > 0:  # Reached end of array
                        break

                    elif stackSize == 1:
                        if '[' in word and ']' in word:  # Initialize specific array element
                            dataDict["idTag"] = word.split('[')[1].split(']')[0]

                        if '}' in word:
                            try:
                                totalDict[dataDict["idTag"]] = dataDict
                            except IndexError:
                                pass

                            totalList.append(dataDict)
                            dataDict = baseDict.copy()
                            if "moves" in dataDict:
                                dataDict["moves"] = {0: "MOVE_NONE", 1: "MOVE_NONE", 2: "MOVE_NONE", 3: "MOVE_NONE"}

                    elif stackSize == 2:  # Within entry
                        if oldStackSize < 2:  # Started new entry
                            lookingForNewMember = True

                        elif oldStackSize == 3:  # Exited subarray
                            dataDict[memberName] = memberData
                            lookingForNewMember = True
                            subArrayIndex = -1

                        elif lookingForNewMember:
                            if '=' in word:
                                memberName = word.split('=')[0].split('.')[1]
                                lookingForNewMember = False
                            elif fileData[i + 1] == '=':
                                memberName = word.split('.')[1]
                                lookingForNewMember = False

                        else:
                            if ',' in word:
                                if flagMember:
                                    flagMember = False
                                    memberData += word.split(',')[0]
                                else:
                                    memberData = word.split(',')[0]

                                    if i + 1 < len(fileData) and fileData[i + 1].startswith("//-"):  # Commented out actual member value
                                        memberData = fileData[i + 1].split("//-")[1]

                                    try:
                                        memberData = int(memberData)
                                    except ValueError:
                                        try:
                                            memberData = int(memberData, 16)
                                        except ValueError:
                                            pass

                                dataDict[memberName] = memberData
                                lookingForNewMember = True
                            elif '|' in word:
                                if type(memberData) != str:
                                    memberData = ""
                                    flagMember = True
                                memberData += fileData[i - 1] + " | "

                    elif stackSize >= 3:  # Sub arrays - doesn't support sub structs
                        if subArrayIndex == -1:
                            subArrayIndex = 0
                            memberData = {}

                        if '{' not in word \
                                and '}' not in word \
                                and not word.startswith('//') \
                                and not word.startswith('/*'):
                            memberData[subArrayIndex] = word.split()[0].split(',')[0].split('}')[0]
                            subArrayIndex += 1

        if totalDict != {}:
            return totalDict

        return totalList

    @staticmethod
    def Reverse(originalDict):
        return {value: key for key, value in originalDict.items()}


# Helper code
def main():
    version = "inflamedred"

    ## Convert Defines File ##
    # dicty = Defines.DictMaker(f"{GAME_DATA_DIR}/{version}/species.h")
    # dict(sorted(dicty.items(), key=lambda item: item[1]))
    # file = open(f"{GAME_DATA_DIR}/{version}/Species.json", "w")
    # file.write(json.dumps(dicty, indent=4))
    # file.close()

    ## Convert Base Stats C File ##
    defines = Defines.CStructArrayToDict(f"{GAME_DATA_DIR}/{version}/Base_Stats.c", "gBaseStats", {})
    with open(f"{GAME_DATA_DIR}/{version}/BaseStats.json", "w") as file:
        file.write(json.dumps(defines, indent=4))

    ## Trim Base Stats JSON File ##
    with open(f"{GAME_DATA_DIR}/{version}/BaseStats.json", "r") as file:
        data = json.load(file)
        for key in data:
            try:
                del data[key]["idTag"]
                del data[key]["catchRate"]
                del data[key]["expYield"]
                del data[key]["evYield_HP"]
                del data[key]["evYield_Attack"]
                del data[key]["evYield_Defense"]
                del data[key]["evYield_SpAttack"]
                del data[key]["evYield_SpDefense"]
                del data[key]["evYield_Speed"]
                del data[key]["item1"]
                del data[key]["item2"]
                del data[key]["eggCycles"]
                del data[key]["friendship"]
                del data[key]["eggGroup1"]
                del data[key]["eggGroup2"]
                del data[key]["safariZoneFleeRate"]
                del data[key]["noFlip"]
            except KeyError:
                pass

    with open(f"{GAME_DATA_DIR}/{version}/BaseStats.json", "w") as file:
        file.write(json.dumps(data, indent=4))


if __name__ == '__main__':
    main()
