import json
from Globals import *


def ExtractPointer(line):
    return sum(line[i] << (8 * i) for i in range(len(line)))


def PokeByteTableMaker() -> {int: str}:
    dictionary = dict()
    with open(CharMapDefines, 'r', encoding="utf-8") as file:
        dictionary[0] = " "
        for line in file:
            if line.strip() != "/FF" and line.strip() != "":
                if line[2] == '=' and line[3] != "":
                    try:
                        if line[3] == '\\':
                            dictionary[int(line.split('=')[0], 16)] = line[3] + line[4]
                        else:
                            dictionary[int(line.split('=')[0], 16)] = line[3]
                    except:
                        pass
    return dictionary


def ExtractString(byteString):
    string = ""
    for byte in byteString:
        if byte == 255:  # End of string
            break
        elif byte in CharMap:
            string += CharMap[byte]
        else:
            pass
            # print("Error: An unidentifiable character was encounter while attempting to extract a string. {}".format(
            #    hex(byte)))

    return string


def DefinesDictMaker(definesFile):
    definesDict = {}
    with open(definesFile, 'r') as file:
        for line in file:
            if '#define ' in line:
                linelist = line.split()
                try:
                    definesDict[int(linelist[2])] = linelist[1]
                except:
                    try:
                        definesDict[int(linelist[2], 16)] = linelist[1]
                    except:
                        pass
    return definesDict


def ItemDefinesDictMaker():
    definesDict = {}
    with open(ItemsDefines, 'r') as file:
        for line in file:
            if '#define ' in line:
                linelist = line.split()
                try:
                    definesDict[int(linelist[2])] = linelist[1]
                except:
                    try:
                        definesDict[int(linelist[2], 16)] = linelist[1]
                    except:
                        pass
            elif '// Emerald' in line:
                break

    return definesDict


def ConvertToReverseByteList(string):
    if string.startswith("0x"):
        string = string[2:]
    if len(string) & 1:  # Odd
        string = "0" + string
    byteList = []
    inter = ''
    counter = 0
    for a in string:
        if counter == 1:
            inter += a
            byteList = [inter] + byteList  # Append to the front
            inter = ''
            counter = 0
        else:
            inter += a
            counter += 1
    return byteList


def ReverseDict(dicty):
    reverseDict = {}
    for key in dicty:
        reverseDict[dicty[key]] = key

    return reverseDict


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
                    print("Too many closing braces and not enough opening braces. Exiting program.")
                    raise ValueError

                elif stackSize == 0 and oldStackSize > 0:  # Reached end of array
                    break

                elif stackSize == 1:
                    if '[' in word and ']' in word:  # Initialize specific array element
                        dataDict["idTag"] = word.split('[')[1].split(']')[0]

                    if '}' in word:
                        try:
                            totalDict[dataDict["idTag"]] = dataDict
                        except:
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

                    if '{' not in word and '}' not in word and not word.startswith('//') and not word.startswith('/*'):
                        memberData[subArrayIndex] = word.split()[0].split(',')[0].split('}')[0]
                        subArrayIndex += 1

    if totalDict != {}:
        return totalDict

    return totalList


SpeciesDict = DefinesDictMaker(SpeciesDefines)
ReverseSpeciesDict = ReverseDict(SpeciesDict)
MovesDict = DefinesDictMaker(MovesDefines)
ReverseMovesDict = ReverseDict(MovesDict)
AbilityDict = DefinesDictMaker(AbilityDefines)
ReverseAbilityDict = ReverseDict(AbilityDict)
ItemsDict = ItemDefinesDictMaker()
ReverseItemsDict = ReverseDict(ItemsDict)
CharMap = PokeByteTableMaker()
ReverseChapMap = ReverseDict(CharMap)
BaseStatsDict = CStructArrayToDict(BaseStatsDefines, "gBaseStats", {"species": "SPECIES_NONE"})
with open(ExperienceCurveDefines, "r") as file:
    ExperienceCurves = json.load(file)
