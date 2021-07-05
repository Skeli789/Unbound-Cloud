import copy
from Globals import *
from PokemonUtil import *
from Utils import *


def CalculateChecksum(saveblock, saveblockId):
    if saveblockId == 0:
        size = 0xF24
    elif saveblockId == 4:
        size = 0xD98
    elif saveblockId == 13:
        size = 0x450
    else:
        size = BlockDataSize

    checksum = 0
    for i in range(0, size, 4):
        word = ExtractPointer(saveblock[i:i + 4])
        checksum += word

        while checksum > 0xFFFFFFFF:  # Overflow
            checksum -= 0x100000000

    upperBits = (checksum >> 16) & 0xFFFF
    lowerBits = checksum & 0xFFFF
    checksum = upperBits + lowerBits
    while checksum > 0xFFFF:  # Overflow
        checksum -= 0x10000

    return checksum


def ConvertPokemonToCompressedMon(pokemonData):
    species = pokemonData["species"]
    finalData = [0] * CompressedPokemonSize
    if species == 0 or species == "SPECIES_NONE":
        return finalData  # No point in wasting time

    if "ability" in pokemonData:
        properAbility = GetMonAbility(pokemonData)
        currAbility = pokemonData["ability"]
        if properAbility != currAbility:  # Came from game with different Ability
            print(pokemonData["nickname"] + "'s Ability doesn't match.")
            # Try to match Ability to correct one
            if currAbility == BaseStatsDict[species]["hiddenAbility"]:
                pokemonData["hiddenAbility"] = 1
            elif currAbility == BaseStatsDict[species]["ability1"]:
                pokemonData["personality"] &= ~1  # Clear lowest bit
            elif currAbility == BaseStatsDict[species]["ability2"]:
                pokemonData["personality"] |= 1  # Add lowest bit

    for key in pokemonData:
        reverse = True

        if key == "species":
            data = species
            if species in ReverseSpeciesDict:
                finalSpecies = ReverseSpeciesDict[species]
                data = finalSpecies
            offset = CompressedPokemon[key][0]
        elif key == "moves":
            moves = 0
            for i, move in enumerate(pokemonData["moves"]):
                if move in ReverseMovesDict:
                    move = ReverseMovesDict[move]
                moves |= (move << (10 * i))
            data = moves
            offset = CompressedPokemon[key][0]
        elif key == "ivs":
            ivs = 0
            for i, iv in enumerate(pokemonData[key]):
                ivs |= (iv << (5 * i))
            data = ivs
            offset = CompressedPokemon[key][0]
        elif key == "isEgg":
            if pokemonData["isEgg"] != 0:
                finalData[57] |= 0x40
            continue
        elif key == "hiddenAbility":
            if pokemonData["hiddenAbility"] != 0:
                finalData[57] |= 0x80
            continue
        elif key == "item":
            item = pokemonData[key]
            if pokemonData["item"] in ReverseItemsDict:
                item = ReverseItemsDict[item]
            data = item
            offset = CompressedPokemon[key][0]
        elif key == "nickname" or key == "otName":
            charList = []
            name = pokemonData[key]
            for char in name:
                if char in ReverseChapMap:
                    char = hex(ReverseChapMap[char])[2:].zfill(2)  # Make it look like "03" or "57"
                charList.append(char)

            while (len(charList)) < CompressedPokemon[key][1]:
                charList.append("FF")  # EOS

            data = charList
            offset = CompressedPokemon[key][0]
            reverse = False
        else:
            if key in CompressedPokemon:
                data = pokemonData[key]
                offset = CompressedPokemon[key][0]
            else:
                continue

        if reverse:
            data = ConvertToReverseByteList(hex(data))

        for i, byte in enumerate(data):
            finalData[offset + i] |= int(byte, 16)

    return finalData


def GetAllCompressedMons(allPokemonData):
    allCompressedMons = []
    for pokemonData in allPokemonData:
        allCompressedMons += ConvertPokemonToCompressedMon(pokemonData)
    return allCompressedMons


def SaveCertainBoxes(boxes: [int], endOfMemory: int, saveBlocks: {int: [int]}, startingSaveBlockNum: int):
    saveBlockNum = startingSaveBlockNum
    saveBlockOffset = StartingMemoryOffsets[saveBlockNum]
    memOffset = 0
    while memOffset < endOfMemory:
        saveBlocks[saveBlockNum][saveBlockOffset] = boxes[memOffset]
        memOffset += 1
        saveBlockOffset += 1
        if saveBlockOffset >= BlockDataSize:  # Loop around to next save block
            saveBlockNum += 1
            saveBlockOffset = StartingMemoryOffsets[saveBlockNum]


def UpdateSaveBlocks(allPokemonData: [{}], saveBlocks: {int: [int]}):
    allCompressedMons = GetAllCompressedMons(allPokemonData)

    endOfBox19Memory = VanillaMemoryBoxCount * MonsPerBox * CompressedPokemonSize
    box1to19 = allCompressedMons[:endOfBox19Memory]
    endOfBox22Memory = endOfBox19Memory + 3 * MonsPerBox * CompressedPokemonSize
    box20to22 = allCompressedMons[endOfBox19Memory:endOfBox22Memory]
    endOfBox24Memory = endOfBox22Memory + 2 * MonsPerBox * CompressedPokemonSize
    box23to24 = allCompressedMons[endOfBox22Memory:endOfBox24Memory]
    endOfBox25Memory = endOfBox24Memory + 1 * MonsPerBox * CompressedPokemonSize
    box25 = allCompressedMons[endOfBox24Memory:endOfBox25Memory]

    SaveCertainBoxes(box1to19, endOfBox19Memory, saveBlocks, 5)
    SaveCertainBoxes(box20to22, endOfBox22Memory - endOfBox19Memory, saveBlocks, 30)
    SaveCertainBoxes(box23to24, endOfBox24Memory - endOfBox22Memory, saveBlocks, 2)
    SaveCertainBoxes(box25, endOfBox25Memory - endOfBox24Memory, saveBlocks, 0)

    assert (box1to19 + box20to22 + box23to24 + box25 == allCompressedMons)
    assert (box25 == allCompressedMons[endOfBox24Memory:])
    return saveBlocks


def ReplaceSaveBlock(binaryFile, offset, saveblockData, blockId):
    # Update Data
    binaryFile.seek(offset)
    binaryFile.write(bytes(saveblockData))

    # Update Checksum
    binaryFile.seek(offset)
    newData = binaryFile.read(BlockDataSize)
    checksum = CalculateChecksum(list(newData), blockId)
    checksum = ConvertToReverseByteList(hex(checksum))
    checksum = list(int(x, 16) for x in checksum)
    binaryFile.seek(offset + ChecksumOffset)
    binaryFile.write(bytes(checksum))


def UpdateSaveFile(saveFile: str, allPokemonData: [{}], saveBlocks: {int: [int]}):
    with open(saveFile, "rb+") as binaryFile:  # Read and write
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

        # Update Save Blocks
        saveBlocks = UpdateSaveBlocks(allPokemonData, copy.deepcopy(saveBlocks))

        # Replace Relevant Saveblocks
        for blockOffset in range(0, SaveSize, BlockSize):
            offset = saveOffset + blockOffset
            binaryFile.seek(offset + BlockIdOffset)
            blockId = ExtractPointer(binaryFile.read(2))

            if blockId in saveBlocks:
                ReplaceSaveBlock(binaryFile, offset, saveBlocks[blockId], blockId)

        # Replace Saveblocks 30 & 31
        ReplaceSaveBlock(binaryFile, 30 * 0x1000, saveBlocks[30], 30)
        ReplaceSaveBlock(binaryFile, 31 * 0x1000, saveBlocks[31], 31)
