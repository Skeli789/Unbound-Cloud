from Globals import *
from PokemonUtil import *
from Utils import *


def SetupDataDict() -> {int: None}:
    dicty = dict((key, None) for key in AllBoxSaveSections)
    return dicty


def LoadSaveblocks(saveFile: str):
    dataDict = SetupDataDict()

    with open(saveFile, "rb") as binaryFile:
        # Get Save Index of Save A
        offset = 0
        binaryFile.seek(offset + SaveIndexOffset)
        saveIndexA = ExtractPointer(binaryFile.read(4))

        # Get Save Index of Save B
        offset = SaveSize
        binaryFile.seek(offset + SaveIndexOffset)
        saveIndexB = ExtractPointer(binaryFile.read(4))

        # Determine Correct Save Offset
        saveOffset = 0
        if saveIndexB > saveIndexA:  # Main save is one with higher save index
            saveOffset = SaveSize  # Main save is saved second

        # Extract Relevant Saveblocks
        for blockOffset in range(0, SaveSize, BlockSize):
            offset = saveOffset + blockOffset
            binaryFile.seek(offset + BlockIdOffset)
            blockId = ExtractPointer(binaryFile.read(2))

            if blockId in dataDict:
                binaryFile.seek(offset)
                data = binaryFile.read(BlockDataSize)
                dataDict[blockId] = list(data)

        # Extract Boxes 20 - 22
        binaryFile.seek(30 * BlockSize)
        dataDict[30] = list(binaryFile.read(BlockDataSize))
        binaryFile.seek(31 * BlockSize)
        dataDict[31] = list(binaryFile.read(BlockDataSize))

    return dataDict


def GetAllBoxesByteStrings(dataDict: [bytes]) -> bytes:
    # Get from vanilla box memory: Boxes 1 - 19
    res = dataDict[5][4:]  # First four bytes are current box
    for i in VanillaBoxSaveSections[1:]:
        res += dataDict[i]
    res = res[:VanillaMemoryBoxCount * MonsPerBox * CompressedPokemonSize]  # Only get mon data

    # Get from expanded box memory: Boxes 20 - 22
    res += dataDict[30][StartingMemoryOffsets[30]:BlockDataSize]
    res += dataDict[31][StartingMemoryOffsets[31]:0xF80]

    # Get from expanded box memory: Boxes 23 - 24
    res += dataDict[2][StartingMemoryOffsets[2]:BlockDataSize]
    res += dataDict[3][StartingMemoryOffsets[3]:0xCC0]

    # Get from expanded box memory: Box 25
    res += dataDict[0][StartingMemoryOffsets[0]:StartingMemoryOffsets[0] + CompressedPokemonSize * MonsPerBox]

    return res


def UpdatePokemonData(pokemonData: dict, allBoxes: [bytes], monOffset: int, tag: str):
    startOffset = monOffset + CompressedPokemon[tag][0]
    endOffset = startOffset + CompressedPokemon[tag][1]
    data = allBoxes[startOffset:endOffset]
    if tag == "nickname" or tag == "otName":
        pokemonData[tag] = ExtractString(data)
    # elif tag == "ivs":
    #    pokemonData[tag] = ExtractReversePointer(data)
    else:
        pokemonData[tag] = ExtractPointer(data)


def FixPokemonData(pokemonData):
    # Fix Move Names
    moves = []
    compressedMoves = pokemonData["moves"]
    for i in range(4):  # All four moves
        move = compressedMoves & 0x3FF  # 10 Bits
        if move in MovesDict:
            move = MovesDict[move]
        moves.append(move)
        compressedMoves >>= 10  # Shift 10 bits down
    pokemonData["moves"] = moves

    # Fix Species Names
    if pokemonData["species"] in SpeciesDict:
        pokemonData["species"] = SpeciesDict[pokemonData["species"]]

    # Fix Item Names
    if pokemonData["item"] in ItemsDict:
        pokemonData["item"] = ItemsDict[pokemonData["item"]]

    # Fix IVs
    ivs = []
    compressedIVs = pokemonData["ivs"]
    for i in range(6):  # 6 Stats
        iv = compressedIVs & 0x1F  # 5 bits
        ivs.append(iv)
        compressedIVs >>= 5  # Shift 5 bits down
    pokemonData["ivs"] = ivs
    pokemonData["isEgg"] = compressedIVs & 1
    compressedIVs >>= 1  # Shift 1 bit down
    pokemonData["hiddenAbility"] = compressedIVs & 1

    if pokemonData["species"] in BaseStatsDict:
        # Assign Ability
        pokemonData["ability"] = GetMonAbility(pokemonData)

        # Assign Gender
        pokemonData["gender"] = GetGenderLetterFromSpeciesAndPersonality(pokemonData["species"],
                                                                         pokemonData["personality"])

        # Assign Level
        pokemonData["level"] = CalculateLevel(pokemonData["species"], pokemonData["experience"])

    else:
        pokemonData["ability"] = "ABILITY_NONE"
        pokemonData["gender"] = "U"  # Unknown
        pokemonData["level"] = 1


def ParseData(dataDict: [bytes]):
    allPokemon = []
    allBoxes = GetAllBoxesByteStrings(dataDict)
    for monOffset in range(0, len(allBoxes), CompressedPokemonSize):
        pokemonData = PokemonData.copy()
        for key in CompressedPokemon:
            UpdatePokemonData(pokemonData, allBoxes, monOffset, key)
        FixPokemonData(pokemonData)
        allPokemon.append(pokemonData)

    return allPokemon


def LoadBoxTitles(dataDict: [bytes]) -> [str]:
    titles = []
    titleData = dataDict[BoxNamesSaveBlock][BoxNamesOffset:BoxNamesEndOffset]
    for i in range(0, len(titleData), BoxNameLength):
        title = titleData[i:i + BoxNameLength]
        title = ExtractString(title)
        if title.lower().startswith("box") and len(title) >= 4 and title[3].isdigit():
            title = title[:3] + " " + title[3:]  # Change titles like "Box24" to change to "Box 24"
        titles.append(title)

    titles = titles[11:len(titles)] + titles[10:0:-1] + [titles[0]]  # Get the correct order
    return titles
