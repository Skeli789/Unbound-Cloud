import os, sys, json, shutil
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "src"))  # Needed for sub-imports

from src.Defines import *
from src.SaveBlocks import *
from pytests.data import *

DATA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "data")
SAVE_DIR = os.path.join(DATA_DIR, "saves")


class TestValidate:
    def testFakePath(self):
        assert not SaveBlocks.Validate("fake_path")

    def testNonSaveFile(self):
        assert not SaveBlocks.Validate(f"{SAVE_DIR}/all_pokemon.json")

    def testValidSaveFile(self):
        assert SaveBlocks.Validate(f"{SAVE_DIR}/all_pokemon.sav")

    def testFlashcartSaveFile(self):
        assert SaveBlocks.Validate(f"{SAVE_DIR}/flashcart.sav")

    def testSingleTimeSavedFile(self):
        assert SaveBlocks.Validate(f"{SAVE_DIR}/single_save.sav")

    def testSingleTimeSavedFile2(self):
        assert SaveBlocks.Validate(f"{SAVE_DIR}/single_save_2.sav")

    def testSingleTimeSavedFileCorruptedSave1(self):
        assert not SaveBlocks.Validate(f"{SAVE_DIR}/single_save_corrupt_save_1.sav")

    def testSingleTimeSavedFileCorruptedSave2(self):
        assert not SaveBlocks.Validate(f"{SAVE_DIR}/single_save_corrupt_save_2.sav")


class TestValidateSave:
    def testValidSave1(self):
        with open(f"{SAVE_DIR}/all_pokemon.sav", "rb") as binaryFile:
            assert SaveBlocks.ValidateSave(binaryFile, 0, SaveSize)

    def testValidSave2(self):
        with open(f"{SAVE_DIR}/all_pokemon.sav", "rb") as binaryFile:
            assert SaveBlocks.ValidateSave(binaryFile, SaveSize, SaveSize * 2)

    def testInvalidBlockId(self):
        with open(f"{SAVE_DIR}/invalid_block_id.sav", "rb") as binaryFile:
            assert not SaveBlocks.ValidateSave(binaryFile, 0, SaveSize)
            assert SaveBlocks.ValidateSave(binaryFile, SaveSize, SaveSize * 2)  # Save 2 should still be valid

    def testDuplicateBlockId(self):
        with open(f"{SAVE_DIR}/duplicate_block_id.sav", "rb") as binaryFile:
            assert not SaveBlocks.ValidateSave(binaryFile, 0, SaveSize)
            assert SaveBlocks.ValidateSave(binaryFile, SaveSize, SaveSize * 2)  # Save 2 should still be valid

    def testMismatchedFileSignature(self):
        with open(f"{SAVE_DIR}/mismatched_file_signature.sav", "rb") as binaryFile:
            assert not SaveBlocks.ValidateSave(binaryFile, 0, SaveSize)
            assert SaveBlocks.ValidateSave(binaryFile, SaveSize, SaveSize * 2)  # Save 2 should still be valid

    def testInvalidFileSignature(self):
        with open(f"{SAVE_DIR}/invalid_file_signature.sav", "rb") as binaryFile:
            assert not SaveBlocks.ValidateSave(binaryFile, 0, SaveSize)
            assert SaveBlocks.ValidateSave(binaryFile, SaveSize, SaveSize * 2)  # Save 2 should still be valid

    def testMismatchedSavedIndex(self):
        with open(f"{SAVE_DIR}/mismatched_save_index.sav", "rb") as binaryFile:
            assert not SaveBlocks.ValidateSave(binaryFile, 0, SaveSize)
            assert SaveBlocks.ValidateSave(binaryFile, SaveSize, SaveSize * 2)  # Save 2 should still be valid

    def testInvalidChecksum(self):
        with open(f"{SAVE_DIR}/invalid_checksum.sav", "rb") as binaryFile:
            assert not SaveBlocks.ValidateSave(binaryFile, 0, SaveSize)
            assert SaveBlocks.ValidateSave(binaryFile, SaveSize, SaveSize * 2)  # Save 2 should still be valid


class TestValidateChecksum:
    def testCFRUBlock0(self):
        with open(f"{SAVE_DIR}/flex.sav", "rb") as binaryFile:
            saveBlockData = list(binaryFile.read(BlockDataSize))
            assert SaveBlocks.CalculateChecksum(saveBlockData, 0) == 0xBC86

    def testCFRUBlock1(self):
        with open(f"{SAVE_DIR}/flex.sav", "rb") as binaryFile:
            binaryFile.seek(BlockSize * 1)
            saveBlockData = list(binaryFile.read(BlockDataSize))
            assert SaveBlocks.CalculateChecksum(saveBlockData, 1) == 0xA848

    def testCFRUBlock4(self):
        with open(f"{SAVE_DIR}/flex.sav", "rb") as binaryFile:
            binaryFile.seek(BlockSize * 4)
            saveBlockData = list(binaryFile.read(BlockDataSize))
            assert SaveBlocks.CalculateChecksum(saveBlockData, 4) == 0x5120

    def testCFRUBlock13(self):
        with open(f"{SAVE_DIR}/flex.sav", "rb") as binaryFile:
            binaryFile.seek(BlockSize * 13)
            saveBlockData = list(binaryFile.read(BlockDataSize))
            assert SaveBlocks.CalculateChecksum(saveBlockData, 13) == 0x807A

    def testEmptyBlock(self):
        saveBlockData = [0] * BlockDataSize
        assert SaveBlocks.CalculateChecksum(saveBlockData, 2) == 0


class TestCreateBlankDict:
    def testCorrectOutput(self):
        assert SaveBlocks.CreateBlankDict() == {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [], 13: [], 30: [], 31: []}


class TestLoadAll:
    def testFakePath(self):
        assert SaveBlocks.LoadAll("fake_path") == [{}, 0]

    def testFlex(self):
        contents, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/flex.sav")
        assert fileSignature == UNBOUND_FILE_SIGNATURE
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as file:
            contentsJSON = json.dumps(contents)  # Convert the integer keys to strings like "0"
            contents = json.loads(contentsJSON)
            assert contents == json.load(file)

    def testSingleSave(self):
        contents, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/single_save.sav")
        assert fileSignature == UNBOUND_FILE_SIGNATURE
        with open(f"{DATA_DIR}/single_save_saveblocks.json", "r") as file:
            contentsJSON = json.dumps(contents)  # Convert the integer keys to strings like "0"
            contents = json.loads(contentsJSON)
            assert contents == json.load(file)

    def testSingleSave2(self):
        contents, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/single_save_2.sav")
        assert fileSignature == UNBOUND_FILE_SIGNATURE
        with open(f"{DATA_DIR}/single_save_saveblocks.json", "r") as file:
            contentsJSON = json.dumps(contents)  # Convert the integer keys to strings like "0"
            contents = json.loads(contentsJSON)
            assert contents == json.load(file)

    def testOldVersionSave(self):
        contents, fileSignature = SaveBlocks.LoadAll(f"{SAVE_DIR}/old_unbound_version.sav")
        assert fileSignature == UNBOUND_2_0_FILE_SIGNATURE
        assert len(contents) == 0


class TestLoadOne:
    def testLoadOneFlexSave1(self):
        with open(f"{SAVE_DIR}/flex.sav", "rb") as binaryFile: 
            blockId, contents = SaveBlocks.LoadOne(binaryFile, 0, BlockSize * 4)  # Block 4 in the Flex save
            with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as file:
                contentsJSON = json.dumps(contents)  # Convert the integer keys to strings like "0"
                contents = json.loads(contentsJSON)
                assert blockId == 4
                assert contents == json.load(file)["4"]

    def testLoadOneNGPlusSave2(self):
        with open(f"{SAVE_DIR}/ng+.sav", "rb") as binaryFile:
            blockId, contents = SaveBlocks.LoadOne(binaryFile, SaveSize, BlockSize * 7)  # Block 12 in the NG+ save
            with open(f"{DATA_DIR}/ngplus_saveblocks.json", "r") as file:
                contentsJSON = json.dumps(contents)  # Convert the integer keys to strings like "0"
                contents = json.loads(contentsJSON)
                assert blockId == 12
                assert contents == json.load(file)["12"]  # Save 2's block 12 is identical to Save 1's block 12


class TestReplaceAll:
    def testFakePath(self):
        assert not SaveBlocks.ReplaceAll("fake_path", [])

    def testPutFlexInNGPlus(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as file:
            saveBlocks = json.load(file)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            shutil.copyfile(f"{SAVE_DIR}/ng+.sav", f"{SAVE_DIR}/ng+_new.sav")
            assert SaveBlocks.ReplaceAll(f"{SAVE_DIR}/ng+_new.sav", saveBlocks)
            contents, _ = SaveBlocks.LoadAll(f"{SAVE_DIR}/ng+_new.sav")
            assert contents == saveBlocks  # Should be Flex saveblocks now

    def testPutFlexInSingleSave(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as file:
            saveBlocks = json.load(file)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            shutil.copyfile(f"{SAVE_DIR}/single_save.sav", f"{SAVE_DIR}/single_save_new.sav")
            assert SaveBlocks.ReplaceAll(f"{SAVE_DIR}/single_save_new.sav", saveBlocks)
            contents, _ = SaveBlocks.LoadAll(f"{SAVE_DIR}/single_save_new.sav")
            assert contents == saveBlocks  # Should be Flex saveblocks now

class TestReplaceOne:
    def testPutFlexBlock3InNGPlus(self):
        with open(f"{DATA_DIR}/flex_saveblocks.json", "r") as file:
            saveBlocks = json.load(file)
            saveBlocks = {int(blockId): saveBlocks[blockId] for blockId in saveBlocks}
            shutil.copyfile(f"{SAVE_DIR}/ng+.sav", f"{SAVE_DIR}/ng+_new.sav")
            with open(f"{SAVE_DIR}/ng+_new.sav", "rb+") as binaryFile:
                SaveBlocks.ReplaceOne(binaryFile, 13 * BlockSize, saveBlocks[3], 3)
            contents, _ = SaveBlocks.LoadAll(f"{SAVE_DIR}/ng+_new.sav")
            assert contents[3] == saveBlocks[3]  # Should be Flex saveblock now
