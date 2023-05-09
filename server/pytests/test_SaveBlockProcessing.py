import os, sys, json
from pytest import raises
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "src"))  # Needed for sub-imports

from src.Defines import *
from src.SaveBlocks import *
from src.SaveBlockProcessing import *
from pytests.data import *

DATA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "data")
SAVE_DIR = os.path.join(DATA_DIR, "saves")

FLAG_UNBOUND_EASY_PUZZLES = 0x16E3
VAR_UNBOUND_MAIN_STORY = 0x500C
VAR_UNBOUND_KEYSTONE = 0x5010
VAR_UNBOUND_HEALING_MAP = 0x405A

# Less tests can be found here because most are already handled in test_integrated.py


class TestLoadPCPokemon:
    def testFlex(self):
        Defines.LoadAll(UNBOUND_2_1_FILE_SIGNATURE)
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            allPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
            with open(f"{DATA_DIR}/flex.json", "r", encoding="utf-8") as file:
                correctPokemon = json.load(file)
                assert allPokemon == correctPokemon


class TestLoadCFRUBoxTitles:
    def testFlex(self):
        Defines.LoadAll(UNBOUND_2_1_FILE_SIGNATURE)
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            boxTitles = SaveBlockProcessing.LoadCFRUBoxTitles(saveBlocks)
            with open(f"{DATA_DIR}/flex_titles.json", "r") as titleFile:
                correctTitles = json.load(titleFile)
                assert boxTitles == correctTitles


class TestLoadPokedexFlags:
    def testAllPokemon(self):
        with open(f"{DATA_DIR}/all_pokemon_iron_leaves_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            seenFlags, caughtFlags = SaveBlockProcessing.LoadPokedexFlags(saveBlocks)
            assert CalcFlagCount(seenFlags) == 1010
            assert CalcFlagCount(caughtFlags) == 1010

    def testFlex(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadAll(UNBOUND_2_1_FILE_SIGNATURE)
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            seenFlags, caughtFlags = SaveBlockProcessing.LoadPokedexFlags(saveBlocks)
            assert CalcFlagCount(seenFlags) == 809
            assert CalcFlagCount(caughtFlags) == 809

    def testNGPlus(self):
        with open(f"{DATA_DIR}/ngplus_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadAll(UNBOUND_2_1_FILE_SIGNATURE)
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            seenFlags, caughtFlags = SaveBlockProcessing.LoadPokedexFlags(saveBlocks)
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

    def testSpeciesAndLearnsetRandomizers(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flag_test/unbound_randomizers.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.IsRandomizedSave(saveBlocks)


class TestFlagGet:
    def testMemoryOffsets(self):
        assert CFRUFlagsASize == 0xCC
        assert CFRUFlagsBSize == 0x134
        assert CFRUFlagsAEndOffset == 0xFF0
        assert CFRUFlagsBEndOffset == 0xECC

    def testFakeFlag(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/magm.sav")
        Defines.LoadAll(fileSignature)
        with raises(ValueError): 
            SaveBlockProcessing.FlagGet(0xFFFF, saveBlocks)

    def testGameClearFlex(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadAll(UNBOUND_2_1_FILE_SIGNATURE)
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            assert SaveBlockProcessing.FlagGet(FLAG_FR_GAME_CLEAR, saveBlocks)

    def testNoGameClearSingleSave(self):
        with open(f"{DATA_DIR}/single_save_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadAll(UNBOUND_2_1_FILE_SIGNATURE)
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            assert not SaveBlockProcessing.FlagGet(FLAG_FR_GAME_CLEAR, saveBlocks)

    def testMAGMAccessedPC(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/magm.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.FlagGet(FLAG_MAGM_PC_ACCESSED, saveBlocks)

    def testMAGMBeforeAccessedPC(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flag_test/magm_before_pc.sav")
        Defines.LoadAll(fileSignature)
        assert not SaveBlockProcessing.FlagGet(FLAG_MAGM_PC_ACCESSED, saveBlocks)

    def testEasyPuzzles(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flag_test/unbound_easy_puzzles.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.FlagGet(FLAG_UNBOUND_EASY_PUZZLES, saveBlocks)

    def testHardPuzzles(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flag_test/unbound_hard_puzzles.sav")
        Defines.LoadAll(fileSignature)
        assert not SaveBlockProcessing.FlagGet(FLAG_UNBOUND_EASY_PUZZLES, saveBlocks)

    def testNewGamePlus(self):
        with open(f"{DATA_DIR}/ngplus_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadAll(UNBOUND_2_1_FILE_SIGNATURE)
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            assert SaveBlockProcessing.FlagGet(FLAG_UNBOUND_NEW_GAME_PLUS, saveBlocks)

    def testNoNewGamePlus(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as saveBlockFile:
            Defines.LoadAll(UNBOUND_2_1_FILE_SIGNATURE)
            saveBlocks = json.load(saveBlockFile)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            assert not SaveBlockProcessing.FlagGet(FLAG_UNBOUND_NEW_GAME_PLUS, saveBlocks)

    def testRandomizers(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flag_test/unbound_randomizers.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.FlagGet(FLAG_UNBOUND_SPECIES_RANDOMIZER, saveBlocks)
        assert SaveBlockProcessing.FlagGet(FLAG_UNBOUND_LEARNSET_RANDOMIZER, saveBlocks)

    def testNoRandomizers(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flag_test/unbound_easy_puzzles.sav")
        Defines.LoadAll(fileSignature)
        assert not SaveBlockProcessing.FlagGet(FLAG_UNBOUND_SPECIES_RANDOMIZER, saveBlocks)
        assert not SaveBlockProcessing.FlagGet(FLAG_UNBOUND_LEARNSET_RANDOMIZER, saveBlocks)


class TestVarGet:
    def testMemoryOffsets(self):
        assert CFRUVarsASize == 0x124
        assert CFRUVarsAEndOffset == 0xFF0
        assert CFRUVarsBSize == 0xDC
        assert CFRUVarsBEndOffset == 0x52C

    def testFakeVar(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/magm.sav")
        Defines.LoadAll(fileSignature)
        with raises(ValueError): 
            SaveBlockProcessing.VarGet(0xFFFF, saveBlocks)

    def testVanillaDifficulty(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/var_test/vanilla_difficulty.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.VarGet(VAR_UNBOUND_GAME_DIFFICULTY, saveBlocks) == 1

    def testDifficultDifficulty(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/var_test/difficult_difficulty.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.VarGet(VAR_UNBOUND_GAME_DIFFICULTY, saveBlocks) == 0

    def testExpertDifficulty(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/var_test/expert_difficulty.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.VarGet(VAR_UNBOUND_GAME_DIFFICULTY, saveBlocks) == 2

    def testInsaneDifficulty(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/var_test/insane_difficulty.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.VarGet(VAR_UNBOUND_GAME_DIFFICULTY, saveBlocks) == 3

    def testHealingMap_Var0x4000Range(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flex.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.VarGet(VAR_UNBOUND_HEALING_MAP, saveBlocks) == 0x21

    def testMainStory_Var0x5000Range(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flex.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.VarGet(VAR_UNBOUND_MAIN_STORY, saveBlocks) == 0x56

    def testKeystone_TwoByteVar(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flex.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.VarGet(VAR_UNBOUND_KEYSTONE, saveBlocks) == 0x161


class TestIsAccessibleCurrently:
    def testEmptySaveBlocks(self):
        assert not SaveBlockProcessing.IsAccessibleCurrently(dict())

    def testMAGMNormally(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/magm.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.IsAccessibleCurrently(saveBlocks)

    def testMAGMBeforePC(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flag_test/magm_before_pc.sav")
        Defines.LoadAll(fileSignature)
        assert not SaveBlockProcessing.IsAccessibleCurrently(saveBlocks)

    def testInsaneMainGame(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/var_test/insane_main_game.sav")
        Defines.LoadAll(fileSignature)
        assert not SaveBlockProcessing.IsAccessibleCurrently(saveBlocks)

    def testInsanePostGame(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/var_test/insane_difficulty.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.IsAccessibleCurrently(saveBlocks)

    def testInsaneNewGamePlus(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/var_test/insane_ng+.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.IsAccessibleCurrently(saveBlocks)

    def testSandboxMainGame(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/var_test/expert_sandbox.sav")
        Defines.LoadAll(fileSignature)
        assert not SaveBlockProcessing.IsAccessibleCurrently(saveBlocks)

    def testSandboxPostGame(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/var_test/expert_sandbox_post_game.sav")
        Defines.LoadAll(fileSignature)
        assert SaveBlockProcessing.IsAccessibleCurrently(saveBlocks)


def CalcFlagCount(flagList):
    counter = 0
    flags = [False] * 9999

    for byte in flagList:
        for shift in range(0, 8):
            if byte & (1 << shift):
                flags[counter] = True
            counter += 1

    return len(list(filter(lambda x: x, flags)))
