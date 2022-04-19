import copy
from typing import List, Tuple, Dict
from Defines import Defines
from PokemonProcessing import PokemonProcessing, CFRUCompressedPokemonSize
from SaveBlocks import BlockDataSize
from Util import BytesToInt, BytesToString

VanillaBoxSaveSections = list(range(5, 13 + 1))
VanillaFRBoxCount = 14
VanillaMemoryBoxCount = 19
BoxNamesSaveBlock = 13
BoxNamesOffset = 0x361
BoxNamesEndOffset = 0x442

PokedexFlagsSaveBlock = 1
SeenFlagsOffset = 0x310
CaughtFlagsOffset = 0x38D
CaughtFlagsEndOffset = 0x40A

TrainerDetailsSaveBlock = 0
TrainerNameLength = 7
TrainerNameOffset = 0x0
TrainerNameEndOffset = TrainerNameOffset + TrainerNameLength
TrainerIdLength = 4
TrainerIdOffset = 0xA
TrainerIdEndOffset = TrainerIdOffset + TrainerIdLength

BoxNameLength = 9
MonsPerBox = 30

EgglockeTrainerId = 0x3CEAB505  # Set by Gerben's tool
EgglockeTrainerName = "Egglock"

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
    def LoadPCPokemon(saveBlocks: Dict[int, List[int]]) -> List[dict]:
        allPokemon = []

        if Defines.IsCFRUHack():
            allBoxes = SaveBlockProcessing.GetAllCFRUBoxesData(saveBlocks)
            for monOffset in range(0, len(allBoxes), CFRUCompressedPokemonSize):
                pokemonData = PokemonProcessing.LoadCFRUCompressedMonAtBoxOffset(allBoxes, monOffset)
                PokemonProcessing.AssignConstantsToCFRUData(pokemonData)
                allPokemon.append(pokemonData)

        return allPokemon

    @staticmethod
    def GetAllCFRUBoxesData(saveBlocks: Dict[int, List[int]]) -> List[int]:
        # Get from vanilla box memory: Boxes 1 - 19
        res = saveBlocks[5][4:]  # First four bytes are current box
        for i in VanillaBoxSaveSections[1:]:
            res += saveBlocks[i]
        res = res[:VanillaMemoryBoxCount * MonsPerBox * CFRUCompressedPokemonSize]  # Only get mon data

        # Get from expanded box memory: Boxes 20 - 22
        if Defines.BoxCount() >= 20:
            res += saveBlocks[30][StartingBoxMemoryOffsets[30]:BlockDataSize]
            res += saveBlocks[31][StartingBoxMemoryOffsets[31]:0xF80]

        # Get from expanded box memory: Boxes 23 - 24
        if Defines.BoxCount() >= 23:
            res += saveBlocks[2][StartingBoxMemoryOffsets[2]:BlockDataSize]
            res += saveBlocks[3][StartingBoxMemoryOffsets[3]:0xCC0]

        # Get from expanded box memory: Box 25
        if Defines.BoxCount() >= 25:
            res += saveBlocks[0][
                StartingBoxMemoryOffsets[0]:StartingBoxMemoryOffsets[0] + CFRUCompressedPokemonSize * MonsPerBox]

        return res

    @staticmethod
    def LoadCFRUBoxTitles(saveBlocks: Dict[int, List[int]]) -> List[str]:
        titles = []

        if Defines.IsCFRUHack():
            numBoxesAfterVanillaAmount = Defines.BoxCount() - VanillaFRBoxCount  # 11 for 25 boxes
            titleData = saveBlocks[BoxNamesSaveBlock][BoxNamesEndOffset - BoxNameLength * Defines.BoxCount():BoxNamesEndOffset]
            for i in range(0, len(titleData), BoxNameLength):
                title = titleData[i:i + BoxNameLength]
                title = BytesToString(title)
                if title.lower().startswith("box") and len(title) >= 4 and title[3].isdigit():
                    title = title[:3] + " " + title[3:]  # Change titles like "Box24" to change to "Box 24"
                titles.append(title)

            titles = titles[numBoxesAfterVanillaAmount:len(titles)] + titles[numBoxesAfterVanillaAmount - 1:0:-1] + [titles[0]]  # Get the correct order

        return titles

    @staticmethod
    def LoadCFRUPokedexFlags(saveBlocks: Dict[int, List[int]]) -> Tuple[List[int], List[int]]:
        seenFlags, caughtFlags = 0, 0

        if PokedexFlagsSaveBlock in saveBlocks:
            seenFlags = saveBlocks[PokedexFlagsSaveBlock][SeenFlagsOffset:CaughtFlagsOffset]
            caughtFlags = saveBlocks[PokedexFlagsSaveBlock][CaughtFlagsOffset:CaughtFlagsEndOffset]
  
        return seenFlags, caughtFlags

    @staticmethod
    def LoadCFRUTrainerDetails(saveBlocks: Dict[int, List[int]]) -> Tuple[str, int]:
        trainerName, trainerId = "None", 0

        if TrainerDetailsSaveBlock in saveBlocks:
            trainerName = BytesToString(saveBlocks[TrainerDetailsSaveBlock][TrainerNameOffset:TrainerNameEndOffset])
            trainerId = BytesToInt(saveBlocks[TrainerDetailsSaveBlock][TrainerIdOffset:TrainerIdEndOffset])

        return trainerName, trainerId

    @staticmethod
    def IsGerbenFile(saveBlocks: Dict[int, List[int]]) -> bool:
        trainerName, trainerId = SaveBlockProcessing.LoadCFRUTrainerDetails(saveBlocks)
        return trainerName == EgglockeTrainerName and trainerId == EgglockeTrainerId

    @staticmethod
    def IsRandomizedSave(saveBlocks: Dict[int, List[int]]) -> bool:
        return SaveBlockProcessing.IsGerbenFile(saveBlocks)

    ### Code for updating save files ###
    @staticmethod
    def UpdateCFRUBoxData(saveBlocks: Dict[int, List[int]], allPokemonData: List[dict]) -> Dict[int, List[int]]:
        saveBlocks = copy.deepcopy(saveBlocks)
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

        if Defines.BoxCount() >= 20:
            SaveBlockProcessing.SaveBoxMemory(box20to22, endOfBox22Memory - endOfBox19Memory, saveBlocks, 30)
        
        if Defines.BoxCount() >= 23:
            SaveBlockProcessing.SaveBoxMemory(box23to24, endOfBox24Memory - endOfBox22Memory, saveBlocks, 2)
        
        if Defines.BoxCount() >= 25:
            SaveBlockProcessing.SaveBoxMemory(box25, endOfBox25Memory - endOfBox24Memory, saveBlocks, 0)

        assert (box1to19 + box20to22 + box23to24 + box25 == allCompressedMons)
        assert (box25 == allCompressedMons[endOfBox24Memory:])
        return saveBlocks

    @staticmethod
    def SaveBoxMemory(memToSave: List[int], endOfMemory: int, saveBlocks: Dict[int, List[int]], startingSaveBlockNum: int):
        SaveBlockProcessing.SaveMemorySubset(saveBlocks, startingSaveBlockNum, memToSave,
                                             StartingBoxMemoryOffsets[startingSaveBlockNum], endOfMemory)

    @staticmethod
    def SaveMemorySubset(saveBlocks: Dict[int, List[int]], startingSaveBlockNum: int, memToSave: List[int], memOffsetStart: int,
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
    def UpdateCFRUPokedexFlags(saveBlocks: Dict[int, List[int]], seenFlags: List[int], caughtFlags: List[int]) -> Dict[int, List[int]]:
        saveBlocks = copy.deepcopy(saveBlocks)
        SaveBlockProcessing.SaveMemorySubset(saveBlocks, PokedexFlagsSaveBlock, seenFlags, SeenFlagsOffset,
                                             len(seenFlags))
        SaveBlockProcessing.SaveMemorySubset(saveBlocks, PokedexFlagsSaveBlock, caughtFlags, CaughtFlagsOffset,
                                             len(caughtFlags))
        return saveBlocks
