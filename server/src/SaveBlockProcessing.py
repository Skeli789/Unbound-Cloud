from PokemonProcessing import PokemonProcessing, CFRUCompressedPokemonSize
from SaveBlocks import BlockDataSize
from Util import BytesToString

VanillaBoxSaveSections = list(range(5, 13 + 1))
VanillaMemoryBoxCount = 19
BoxNamesSaveBlock = 13
BoxNamesOffset = 0x361
BoxNamesEndOffset = 0x442

PokedexFlagsSaveBlock = 1
SeenFlagsOffset = 0x310
CaughtFlagsOffset = 0x38D
CaughtFlagsEndOffset = 0x40A

BoxNameLength = 9
MonsPerBox = 30

StartingBoxMemoryOffsets = {
    0: 0xB0,
    2: 0xF18,
    3: 0x0,
    5: 0x4,
    6: 0x0,
    7: 0x0,
    8: 0x0,
    9: 0x0,
    10: 0x0,
    11: 0x0,
    12: 0x0,
    13: 0x0,
    30: 0xB0C,
    31: 0x0
}


class SaveBlockProcessing:
    @staticmethod
    def LoadPCPokemon(saveBlocks: {int: [int]}) -> [{}]:
        allPokemon = []

        # TODO: Change method of loading based on game in Defines
        allBoxes = SaveBlockProcessing.GetAllCFRUBoxesData(saveBlocks)
        for monOffset in range(0, len(allBoxes), CFRUCompressedPokemonSize):
            pokemonData = PokemonProcessing.LoadCFRUCompressedMonAtBoxOffset(allBoxes, monOffset)
            PokemonProcessing.AssignConstantsToCFRUData(pokemonData)
            allPokemon.append(pokemonData)

        return allPokemon

    @staticmethod
    def GetAllCFRUBoxesData(saveBlocks: {int: [int]}) -> [int]:
        # Get from vanilla box memory: Boxes 1 - 19
        res = saveBlocks[5][4:]  # First four bytes are current box
        for i in VanillaBoxSaveSections[1:]:
            res += saveBlocks[i]
        res = res[:VanillaMemoryBoxCount * MonsPerBox * CFRUCompressedPokemonSize]  # Only get mon data

        # Get from expanded box memory: Boxes 20 - 22
        res += saveBlocks[30][StartingBoxMemoryOffsets[30]:BlockDataSize]
        res += saveBlocks[31][StartingBoxMemoryOffsets[31]:0xF80]

        # Get from expanded box memory: Boxes 23 - 24
        res += saveBlocks[2][StartingBoxMemoryOffsets[2]:BlockDataSize]
        res += saveBlocks[3][StartingBoxMemoryOffsets[3]:0xCC0]

        # Get from expanded box memory: Box 25
        res += saveBlocks[0][
               StartingBoxMemoryOffsets[0]:StartingBoxMemoryOffsets[0] + CFRUCompressedPokemonSize * MonsPerBox]

        return res

    @staticmethod
    def LoadCFRUBoxTitles(saveBlocks: {int: [int]}) -> [str]:
        titles = []
        titleData = saveBlocks[BoxNamesSaveBlock][BoxNamesOffset:BoxNamesEndOffset]
        for i in range(0, len(titleData), BoxNameLength):
            title = titleData[i:i + BoxNameLength]
            title = BytesToString(title)
            if title.lower().startswith("box") and len(title) >= 4 and title[3].isdigit():
                title = title[:3] + " " + title[3:]  # Change titles like "Box24" to change to "Box 24"
            titles.append(title)

        titles = titles[11:len(titles)] + titles[10:0:-1] + [titles[0]]  # Get the correct order
        return titles

    @staticmethod
    def LoadCFRUPokedexFlags(saveBlocks: {int: [int]}) -> [[int], [int]]:
        seenFlags = saveBlocks[PokedexFlagsSaveBlock][SeenFlagsOffset:CaughtFlagsOffset]
        caughtFlags = saveBlocks[PokedexFlagsSaveBlock][CaughtFlagsOffset:CaughtFlagsEndOffset]
        return seenFlags, caughtFlags


    ### Code for updating save files ###
    @staticmethod
    def UpdateCFRUBoxData(saveBlocks: {int: [int]}, allPokemonData: [{}]) -> {int: [int]}:
        allCompressedMons = PokemonProcessing.GetAllCFRUCompressedMons(allPokemonData)

        endOfBox19Memory = VanillaMemoryBoxCount * MonsPerBox * CFRUCompressedPokemonSize
        box1to19 = allCompressedMons[:endOfBox19Memory]
        endOfBox22Memory = endOfBox19Memory + 3 * MonsPerBox * CFRUCompressedPokemonSize
        box20to22 = allCompressedMons[endOfBox19Memory:endOfBox22Memory]
        endOfBox24Memory = endOfBox22Memory + 2 * MonsPerBox * CFRUCompressedPokemonSize
        box23to24 = allCompressedMons[endOfBox22Memory:endOfBox24Memory]
        endOfBox25Memory = endOfBox24Memory + 1 * MonsPerBox * CFRUCompressedPokemonSize
        box25 = allCompressedMons[endOfBox24Memory:endOfBox25Memory]

        SaveBlockProcessing.SaveBoxMemory(box1to19, endOfBox19Memory, saveBlocks, 5)
        SaveBlockProcessing.SaveBoxMemory(box20to22, endOfBox22Memory - endOfBox19Memory, saveBlocks, 30)
        SaveBlockProcessing.SaveBoxMemory(box23to24, endOfBox24Memory - endOfBox22Memory, saveBlocks, 2)
        SaveBlockProcessing.SaveBoxMemory(box25, endOfBox25Memory - endOfBox24Memory, saveBlocks, 0)

        assert (box1to19 + box20to22 + box23to24 + box25 == allCompressedMons)
        assert (box25 == allCompressedMons[endOfBox24Memory:])
        return saveBlocks

    @staticmethod
    def SaveBoxMemory(memToSave: [int], endOfMemory: int, saveBlocks: {int: [int]}, startingSaveBlockNum: int):
        SaveBlockProcessing.SaveMemorySubset(saveBlocks, startingSaveBlockNum, memToSave,
                                             StartingBoxMemoryOffsets[startingSaveBlockNum], endOfMemory)

    @staticmethod
    def SaveMemorySubset(saveBlocks: {int: [int]}, startingSaveBlockNum: int, memToSave: [int], memOffsetStart: int,
                         endOfMemory: int):
        saveBlockNum = startingSaveBlockNum
        saveBlockOffset = memOffsetStart
        memOffset = 0
        while memOffset < endOfMemory:
            saveBlocks[saveBlockNum][saveBlockOffset] = memToSave[memOffset]
            memOffset += 1
            saveBlockOffset += 1
            if saveBlockOffset >= BlockDataSize:  # Loop around to next save block
                saveBlockNum += 1
                saveBlockOffset = StartingBoxMemoryOffsets[saveBlockNum]

    @staticmethod
    def UpdateCFRUPokedexFlags(saveBlocks: {int: [int]}, seenFlags: [int], caughtFlags: [int]) -> {int: [int]}:
        SaveBlockProcessing.SaveMemorySubset(saveBlocks, PokedexFlagsSaveBlock, seenFlags, SeenFlagsOffset,
                                             len(seenFlags))
        SaveBlockProcessing.SaveMemorySubset(saveBlocks, PokedexFlagsSaveBlock, caughtFlags, CaughtFlagsOffset,
                                             len(caughtFlags))
        return saveBlocks
