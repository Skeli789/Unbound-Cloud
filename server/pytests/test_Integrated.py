import os, sys, json, shutil
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "src"))  # Needed for sub-imports

from src.PokemonUtil import *
from src.SaveBlocks import *
from src.SaveBlockProcessing import *

DATA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "data")
SAVE_DIR = os.path.join(DATA_DIR, "saves")


class TestIntegrated:
    def testSanity(self):
        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/all_pokemon.sav")
        Defines.LoadAll(fileSignature)
        allPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)

        saveBlocks, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flex.sav")
        Defines.LoadAll(fileSignature)
        newPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)

        assert allPokemon != newPokemon

    def testLoadAllPokemon(self):
        LoadAllTest("all_pokemon")

    def testLoadAllPokemonFlex(self):
        LoadAllTest("flex")

    def testLoadAllPokemonNGPlus(self):
        LoadAllTest("ng+")

    def testLoadAllPokemonMAGM(self):
        LoadAllTest("magm")

    def testLoadAllPokemonInflamedRed(self):
        LoadAllTest("inflamed_red")

    def testCorruptsSaveBlocks30And31(self):
        LoadAllTest("corrupt_blocks_30_31")

    def testReplaceAllPokemon(self):
        LoadAndReplaceTest("all_pokemon")

    def testReplaceAllPokemonFlex(self):
        LoadAndReplaceTest("flex")

    def testReplaceAllPokemonNGPlus(self):
        LoadAndReplaceTest("ng+")

    def testReplaceAllPokemonMAGM(self):
        LoadAndReplaceTest("magm")

    def testReplaceAllPokemonMAGM(self):
        LoadAndReplaceTest("inflamed_red")

    def testReplaceAllPokemonEmptySave(self):
        LoadAndReplaceTest("single_save")

    def testReplaceAllPokemonSingleSaveRandomizer(self):
        LoadAndReplaceTest("single_save_randomizer")

    def testReplaceCorruptBlocks30And31(self):
        LoadAndReplaceTest("corrupt_blocks_30_31")

    def testFlashcartDifferentSizedSave(self):
        LoadAndReplaceTest("flashcart")

    def testReplaceUnofficialPokemon(self):
        LoadAndReplaceTest("missingno", shouldFail=True)
        def func():
            Defines.unofficialSpecies[253] = True
        LoadAndReplaceTest("missingno", func)
    
    def testReplaceHoopaShayminPresetBox(self):
        LoadAndReplaceTest("test_hoopa_shaymin_preset_box")

    def testTransferPokemonFromCFREToUnbound(self):
        TransferTest("all_pokemon", "cfre", "firered", "unbound")

    def testTransferPokemonFromMAGMToUnbound(self):
        TransferTest("all_pokemon", "magm", "magm", "unbound")
    
    def testTransferPokemonFromMAGMToUnboundSingleSave(self):
        TransferTest("single_save_randomizer", "magm", "magm", "unbound")

    def testTransferPokemonFromUnboundToInflamedRed(self):
        TransferTest("inflamed_red", "unbound", "unbound", "inflamedred")

    def testTransferPokemonFromInflamedRedToUnbound(self):
        TransferTest("all_pokemon", "inflamedred", "firered", "unbound")


def LoadAllTest(saveName: str):
    saveFilePath = f"{SAVE_DIR}/{saveName}.sav"

    saveBlocks, fileSignature = SaveBlocks.LoadAll(saveFilePath)
    Defines.LoadAll(fileSignature)

    assert SaveBlockProcessing.IsAccessibleCurrently(saveBlocks)
    allPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
    boxTitles = SaveBlockProcessing.LoadCFRUBoxTitles(saveBlocks)

    # with open(f"{DATA_DIR}/{saveName}.json", "w") as file:
    #     file.write(json.dumps(allPokemon, indent=4) + "\n")

    # with open(f"{DATA_DIR}/{saveName}_titles.json", "w") as file:
    #     file.write(json.dumps(boxTitles, indent=4) + "\n")

    with open(f"{DATA_DIR}/{saveName}.json", "r", encoding="utf-8") as file:
        correctPokemon = json.load(file)

    with open(f"{DATA_DIR}/{saveName}_titles.json", "r", encoding="utf-8") as file:
        correctTitles = json.load(file)

    assert allPokemon == correctPokemon
    assert boxTitles == correctTitles


def LoadAndReplaceTest(saveName: str, definesAdjustmentFunc=None, shouldFail=False):
    originalSaveFilePath = f"{SAVE_DIR}/{saveName}.sav"
    newFilePath = f"{SAVE_DIR}/{saveName}_new.sav"

    # Load from save
    saveBlocks, fileSignature = SaveBlocks.LoadAll(originalSaveFilePath)
    Defines.LoadAll(fileSignature)
    if definesAdjustmentFunc is not None:
        definesAdjustmentFunc()

    assert SaveBlockProcessing.IsAccessibleCurrently(saveBlocks)
    allPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
    seenFlags, caughtFlags = SaveBlockProcessing.LoadCFRUPokedexFlags(saveBlocks)

    if len(allPokemon) == 0:  # Sanity check
        assert len(allPokemon) != 0

    # Save back to save
    newSaveBlocks = SaveBlockProcessing.UpdateCFRUBoxData(saveBlocks, allPokemon)
    newSaveBlocks = SaveBlockProcessing.UpdateCFRUPokedexFlags(newSaveBlocks, seenFlags, caughtFlags)
    shutil.copyfile(originalSaveFilePath, newFilePath)
    SaveBlocks.ReplaceAll(newFilePath, newSaveBlocks)

    # Load new file and make sure matches original
    saveBlocks, fileSignature = SaveBlocks.LoadAll(newFilePath)
    newPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
    newSeenFlags, newCaughtFlags = SaveBlockProcessing.LoadCFRUPokedexFlags(saveBlocks)

    if shouldFail:
        assert allPokemon != newPokemon
    else:
        assert allPokemon == newPokemon

    assert seenFlags == newSeenFlags
    assert caughtFlags == newCaughtFlags

    # Compare two files match exactly
    # file1 = open(originalSaveFilePath, "rb")
    # file1Contents = file1.read(-1)
    # file1.close()
    # file2 = open(newFilePath, "rb")
    # file2Contents = file2.read(-1)
    # file2.close()
    # assert file1Contents == file2Contents


def TransferTest(saveName: str, setMetGame: str, metGameAfterLoad: str, originalMetGame: str):
    originalSaveFilePath = f"{SAVE_DIR}/{saveName}.sav"
    newFilePath = f"{SAVE_DIR}/{saveName}_new.sav"

    # Load from save
    saveBlocks, fileSignature = SaveBlocks.LoadAll(originalSaveFilePath)
    Defines.LoadAll(fileSignature)
    allPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
    seenFlags, caughtFlags = SaveBlockProcessing.LoadCFRUPokedexFlags(saveBlocks)

    # Pretend Pokemon came from other game
    allPokemon[0]["metGame"] = setMetGame
    allPokemon[0]["checksum"] = PokemonUtil.CalculateChecksum(allPokemon[0])

    # Save back to save
    newSaveBlocks = SaveBlockProcessing.UpdateCFRUBoxData(saveBlocks, allPokemon)
    newSaveBlocks = SaveBlockProcessing.UpdateCFRUPokedexFlags(newSaveBlocks, seenFlags, caughtFlags)
    shutil.copyfile(originalSaveFilePath, newFilePath)
    SaveBlocks.ReplaceAll(newFilePath, newSaveBlocks)

    # Load new file and make sure met game hasn't changed
    saveBlocks, fileSignature = SaveBlocks.LoadAll(newFilePath)
    newPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
    assert newPokemon[0]["metGame"] == metGameAfterLoad and newPokemon[1]["metGame"] == originalMetGame
