import os, sys, json
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "src"))  # Needed for sub-imports

from src.Defines import *
from src.SaveBlockProcessing import *
from pytests.data import *

DATA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "data")
SAVE_DIR = os.path.join(DATA_DIR, "saves")

# Less tests can be found here because most are already handled in test_integrated.py


class TestLoadPCPokemon:
    def testFlex(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            allPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
            with open(f"{DATA_DIR}/flex.json", "r", encoding="utf-8") as file:
                correctPokemon = json.load(file)
                assert allPokemon == correctPokemon


class TestLoadCFRUBoxTitles:
    def testFlex(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            boxTitles = SaveBlockProcessing.LoadCFRUBoxTitles(saveBlocks)
            with open(f"{DATA_DIR}/flex_titles.json", "r") as titleFile:
                correctTitles = json.load(titleFile)
                assert boxTitles == correctTitles


class TestLoadCFRUPokedexFlags:
    def testFlex(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            seenFlags, caughtFlags = SaveBlockProcessing.LoadCFRUPokedexFlags(saveBlocks)
            assert CalcFlagCount(seenFlags) == 809
            assert CalcFlagCount(caughtFlags) == 809

    def testNGPlus(self):
        with open(f"{DATA_DIR}/ngplus_saveblocks.json", "r") as saveBlockFile:
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            seenFlags, caughtFlags = SaveBlockProcessing.LoadCFRUPokedexFlags(saveBlocks)
            assert CalcFlagCount(seenFlags) == 613
            assert CalcFlagCount(caughtFlags) == 33


class TestLoadCFRUTrainerDetails:
    def testFlex(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadCharMap()
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            trainerName, trainerId = SaveBlockProcessing.LoadCFRUTrainerDetails(saveBlocks)
            assert trainerName == "Deneb"
            assert trainerId == 0x55FCD528

    def testNGPlus(self):
        with open(f"{DATA_DIR}/ngplus_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadCharMap()
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            trainerName, trainerId = SaveBlockProcessing.LoadCFRUTrainerDetails(saveBlocks)
            assert trainerName == "Skeli"
            assert trainerId == 0x578BF8C4

    def testEgglocke(self):
        with open(f"{DATA_DIR}/egglocke_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadCharMap()
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            trainerName, trainerId = SaveBlockProcessing.LoadCFRUTrainerDetails(saveBlocks)
            assert trainerName == EgglockeTrainerName
            assert trainerId == EgglockeTrainerId


class TestIsGerbenFile:
    def testFlex(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadCharMap()
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            assert not SaveBlockProcessing.IsGerbenFile(saveBlocks)

    def testEgglockeFile(self):
        with open(f"{DATA_DIR}/egglocke_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadCharMap()
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            assert SaveBlockProcessing.IsGerbenFile(saveBlocks)  


class TestIsRandomizedSave:
    def testFlex(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadCharMap()
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            assert not SaveBlockProcessing.IsRandomizedSave(saveBlocks)

    def testEgglockeFile(self):
        with open(f"{DATA_DIR}/egglocke_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadCharMap()
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            assert SaveBlockProcessing.IsRandomizedSave(saveBlocks)  


def CalcFlagCount(flagList):
    counter = 0
    flags = [False] * 999

    for byte in flagList:
        for shift in range(0, 8):
            if byte & (1 << shift):
                flags[counter] = True
            counter += 1

    return len(list(filter(lambda x: x, flags)))
