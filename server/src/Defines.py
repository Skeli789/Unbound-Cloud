import json
import os
import sys

SpeciesDefines = "src/data/UnboundSpecies.json"
SpeciesToDexNumDefines = "src/data/SpeciesToDexNum.json"
DexNumDefines = "src/data/DexNum.json"
MovesDefines = "src/data/UnboundMoves.json"
ItemsDefines = "src/data/UnboundItems.json"
CharMapDefines = "src/data/charmap.tbl"
ExperienceCurveDefines = "src/data/ExperienceCurves.json"
BaseStatsDefines = "src/data/VanillaBaseStats.c"
BallTypeDefines = "src/data/BallTypes.json"

OLD_SHINY_ODDS = 8
MODERN_SHINY_ODDS = 16

# Before adding to this, make sure the game has a special case for randomizers!
FileSignaturesToGame = {
    0x08012025: ("vanilla", False),
    0x01121998: ("unbound", True),
    0x18190804: ("wish", True),
}


class Defines:
    species = dict()
    reverseSpecies = dict()
    dexNum = dict()
    speciesToDexNum = dict()
    reverseDexNum = dict()
    moves = dict()
    reverseMoves = dict()
    abilities = dict()
    reverseAbilities = dict()
    items = dict()
    reverseItems = dict()
    ballTypes = dict()
    reverseBallTypes = dict()
    experienceCurves = dict()
    baseStats = dict()
    charMap = dict()
    reverseCharMap = dict()
    shinyOdds = MODERN_SHINY_ODDS
    fileSignature = 0x08012025

    @staticmethod
    def GetGameName():
        if Defines.fileSignature in FileSignaturesToGame:
            return FileSignaturesToGame[Defines.fileSignature][0]
        return "unknown"

    @staticmethod
    def IsValidFileSignature(fileSignature: int) -> bool:
        return fileSignature in FileSignaturesToGame

    @staticmethod
    def IsCFRUHack() -> bool:
        return FileSignaturesToGame[Defines.fileSignature][1]

    @staticmethod
    def GetSpeciesDexNum(species: str) -> int:
        if species in Defines.speciesToDexNum:
            dexTag = Defines.speciesToDexNum[species]
            if dexTag in Defines.reverseDexNum:
                return Defines.reverseDexNum[dexTag]
        return 0

    @staticmethod
    def LoadAll(fileSignature: int):
        # TODO - Change based on File Signature
        speciesDefines = SpeciesDefines
        speciesToDexNumDefines = SpeciesToDexNumDefines
        dexNumDefines = DexNumDefines
        movesDefines = MovesDefines
        itemDefines = ItemsDefines
        ballTypeDefines = BallTypeDefines
        experienceCurveDefines = ExperienceCurveDefines
        baseStatsDefines = BaseStatsDefines
        charMapDefines = CharMapDefines

        if fileSignature in FileSignaturesToGame:
            Defines.fileSignature = fileSignature
        Defines.species = Defines.DictMakerFromJSON(speciesDefines, True)
        Defines.reverseSpecies = Defines.Reverse(Defines.species)
        Defines.speciesToDexNum = Defines.DictMakerFromJSON(speciesToDexNumDefines)
        Defines.dexNum = Defines.DictMakerFromJSON(dexNumDefines, True)
        Defines.reverseDexNum = Defines.Reverse(Defines.dexNum)
        Defines.moves = Defines.DictMakerFromJSON(movesDefines, True)
        Defines.reverseMoves = Defines.Reverse(Defines.moves)
        Defines.items = Defines.DictMakerFromJSON(itemDefines, True)
        Defines.reverseItems = Defines.Reverse(Defines.items)
        Defines.ballTypes = Defines.BallTypesDictMaker(ballTypeDefines)
        Defines.reverseBallTypes = Defines.Reverse(Defines.ballTypes)
        Defines.experienceCurves = Defines.DictMakerFromJSON(experienceCurveDefines, False)
        Defines.baseStats = Defines.CStructArrayToDict(baseStatsDefines, "gBaseStats", {})
        Defines.charMap = Defines.PokeByteTableMaker(charMapDefines)
        Defines.reverseCharMap = Defines.Reverse(Defines.charMap)

    @staticmethod
    def DictMaker(definesFile: str) -> {}:
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

        return definesDict

    @staticmethod
    def DictMakerFromJSON(definesFile: str, keysShouldBeInts=False) -> {}:
        data = {}

        if os.path.isfile(definesFile):
            with open(definesFile, "r") as file:
                data = json.load(file)
                if keysShouldBeInts:  # Each key is like "0" or "1" so change to 0 and 1
                    data = {int(key): value for key, value in data.items()}

        return data

    @staticmethod
    def BallTypesDictMaker(definesFile) -> {int: str}:
        if os.path.isfile(definesFile):
            with open(definesFile, "r") as file:
                ballTypeNames = json.load(file)
                ballTypeIds = list(range(len(ballTypeNames)))
                return dict(zip(ballTypeIds, ballTypeNames))

        return {}

    @staticmethod
    def PokeByteTableMaker(definesFile) -> {int: str}:
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
    def CStructArrayToDict(inputFile: str, arrayName: str, baseDict: {}):
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
