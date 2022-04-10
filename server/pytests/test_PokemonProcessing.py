import os, shutil, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "src"))  # Needed for sub-imports

from src.Defines import *
from src.PokemonProcessing import *
from pytests.data import *

DATA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "data")
DEX_FLAGS_SIZE = (999 // 8) + 1


class TestLoadCFRUCompressedMonAtBoxOffset:
    def testSingleBlankRawPokemon(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonProcessing.LoadCFRUCompressedMonAtBoxOffset([0] * CFRUCompressedPokemonSize, 0) == BLANK_TEST_POKEMON_RAW

    def testSingleBlankRawPokemonAtOffset(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonProcessing.LoadCFRUCompressedMonAtBoxOffset([1] * CFRUCompressedPokemonSize + [0] * CFRUCompressedPokemonSize,
                                                                  CFRUCompressedPokemonSize) == BLANK_TEST_POKEMON_RAW


class TestAssignConstantsToCFRUData:
    def testNormalData(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = OLD_TEST_POKEMON_RAW.copy()
        PokemonProcessing.AssignConstantsToCFRUData(pokemon)
        assert OLD_TEST_POKEMON_CONVERTED == pokemon

    def testBlankData(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = BLANK_TEST_POKEMON_RAW.copy()
        PokemonProcessing.AssignConstantsToCFRUData(pokemon)
        assert BLANK_TEST_POKEMON_CONVERTED == pokemon

    def testMissingData(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = OLD_TEST_POKEMON_RAW.copy()
        pokemon["language"] = 0xFF
        pokemon["moves"] = 0
        pokemon["item"] = 0xFFFF
        pokemon["pokeBall"] = 0xFF
        correctPokemon = OLD_TEST_POKEMON_CONVERTED.copy()
        correctPokemon["language"] = "LANGUAGE_ENGLISH"
        correctPokemon["moves"] = ["MOVE_POUND", "MOVE_NONE", "MOVE_NONE", "MOVE_NONE"]
        correctPokemon["item"] = "ITEM_NONE"
        correctPokemon["pokeBall"] = "BALL_TYPE_POKE_BALL"
        correctPokemon["checksum"] = PokemonUtil.CalculateChecksum(correctPokemon)
        PokemonProcessing.AssignConstantsToCFRUData(pokemon)
        assert pokemon == correctPokemon

    def testBadEgg(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = OLD_TEST_POKEMON_RAW.copy()
        pokemon["sanity"] |= SANITY_IS_BAD_EGG
        PokemonProcessing.AssignConstantsToCFRUData(pokemon)
        assert pokemon == BLANK_TEST_POKEMON_CONVERTED


class TestGetAllCFRUCompressedMons:
    def testBlankPokemon(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert PokemonProcessing.GetAllCFRUCompressedMons([BLANK_TEST_POKEMON_CONVERTED]) == [0] * CFRUCompressedPokemonSize

    def testBlankPokemonAndRealPokemon(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert PokemonProcessing.GetAllCFRUCompressedMons([BLANK_TEST_POKEMON_CONVERTED, TEST_POKEMON_NON_UNBOUND_DATA]) == \
                                                          [0] * CFRUCompressedPokemonSize + TESTING_POKEMON_NON_UNBOUND_DATA_BYTE_LIST


class TestConvertPokemonToCFRUCompressedMon:
    def testNormalPokemon(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert PokemonProcessing.ConvertPokemonToCFRUCompressedMon(TEST_POKEMON) == TEST_POKEMON_BYTE_LIST

    def testBlankPokemon(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        convertedData = PokemonProcessing.ConvertPokemonToCFRUCompressedMon(BLANK_TEST_POKEMON_CONVERTED)
        assert convertedData == [0] * CFRUCompressedPokemonSize

    def testBadChecksum(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON.copy()
        pokemon["hiddenAbility"] = True
        assert PokemonProcessing.ConvertPokemonToCFRUCompressedMon(pokemon) == [0] * CFRUCompressedPokemonSize

    def testMissingChecksum(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON.copy()
        del pokemon["checksum"]
        assert PokemonProcessing.ConvertPokemonToCFRUCompressedMon(pokemon) == [0] * CFRUCompressedPokemonSize

    def testFakeSpecies(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON.copy()
        pokemon["species"] = "SPECIES_FAKE"
        pokemon["checksum"] = PokemonUtil.CalculateChecksum(pokemon)
        assert PokemonProcessing.ConvertPokemonToCFRUCompressedMon(pokemon) == [0] * CFRUCompressedPokemonSize

    def testMovesThatsANumber(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON.copy()
        pokemon["moves"] = 1
        pokemon["checksum"] = PokemonUtil.CalculateChecksum(pokemon)
        assert PokemonProcessing.ConvertPokemonToCFRUCompressedMon(pokemon) == [0] * CFRUCompressedPokemonSize

    def testPokemonWithNonUnboundData(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        convertedData = PokemonProcessing.ConvertPokemonToCFRUCompressedMon(TEST_POKEMON_NON_UNBOUND_DATA)
        assert convertedData == TESTING_POKEMON_NON_UNBOUND_DATA_BYTE_LIST

    def testPokemonWithNoRealMoves(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON_NON_UNBOUND_DATA.copy()
        pokemon["moves"] = ["MOVE_FAKE"] * 4
        pokemon["checksum"] = PokemonUtil.CalculateChecksum(pokemon)
        convertedData = PokemonProcessing.ConvertPokemonToCFRUCompressedMon(pokemon)
        assert convertedData == TESTING_POKEMON_NO_REAL_MOVES_BYTE_LIST

    def testUnofficialSpecies(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        Defines.unofficialSpecies[253] = True
        pokemon = TEST_MISSINGNO.copy()
        pokemon["checksum"] = PokemonUtil.CalculateChecksum(pokemon)
        convertedData = PokemonProcessing.ConvertPokemonToCFRUCompressedMon(pokemon)
        assert convertedData == MISSINGNO_BYTE_LIST



class TestUpdatePokedexFlags:
    def testVenusaur(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        seenFlags = [0] * DEX_FLAGS_SIZE
        caughtFlags = [0] * DEX_FLAGS_SIZE
        seenFlags, caughtFlags = PokemonProcessing.UpdatePokedexFlags(seenFlags, caughtFlags, [TEST_POKEMON])
        assert seenFlags == [4] + [0] * (DEX_FLAGS_SIZE - 1)
        assert caughtFlags == [4] + [0] * (DEX_FLAGS_SIZE - 1)

    def testMightyena(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        seenFlags = [0] * DEX_FLAGS_SIZE
        caughtFlags = [0] * DEX_FLAGS_SIZE
        seenFlags, caughtFlags = PokemonProcessing.UpdatePokedexFlags(seenFlags, caughtFlags, [TEST_POKEMON_2])
        assert seenFlags == [0] * 32 + [1 << 5] + [0] * (DEX_FLAGS_SIZE - 33)
        assert caughtFlags == [0] * 32 + [1 << 5] + [0] * (DEX_FLAGS_SIZE - 33)

    def testFakeSpecies(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        seenFlags = [0] * DEX_FLAGS_SIZE
        caughtFlags = [0] * DEX_FLAGS_SIZE
        pokemon = TEST_POKEMON.copy()
        pokemon["species"] = "SPECIES_FAKE"
        seenFlags, caughtFlags = PokemonProcessing.UpdatePokedexFlags(seenFlags, caughtFlags, [pokemon])
        assert seenFlags == [0] * DEX_FLAGS_SIZE
        assert caughtFlags == [0] * DEX_FLAGS_SIZE

    def testPokemonTwiceDoesntUnsetFlag(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        seenFlags = [0] * DEX_FLAGS_SIZE
        caughtFlags = [0] * DEX_FLAGS_SIZE
        seenFlags, caughtFlags = PokemonProcessing.UpdatePokedexFlags(seenFlags, caughtFlags, [TEST_POKEMON, TEST_POKEMON])
        assert seenFlags == [4] + [0] * (DEX_FLAGS_SIZE - 1)
        assert caughtFlags == [4] + [0] * (DEX_FLAGS_SIZE - 1)

    def testFlagAlreadySet(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        seenFlags = [4] + [0] * (DEX_FLAGS_SIZE - 1)
        caughtFlags = [4] + [0] * (DEX_FLAGS_SIZE - 1)
        seenFlags, caughtFlags = PokemonProcessing.UpdatePokedexFlags(seenFlags, caughtFlags, [TEST_POKEMON])
        assert seenFlags == [4] + [0] * (DEX_FLAGS_SIZE - 1)
        assert caughtFlags == [4] + [0] * (DEX_FLAGS_SIZE - 1)


class TestConvertOldDataStructToNew:
    def testConvertOldTestPokemon(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = OLD_TEST_POKEMON.copy()
        pokemon = PokemonProcessing.ConvertOldDataStructToNew(pokemon)
        assert pokemon == OLD_TEST_POKEMON_CONVERTED

    def testConvertBlankPokemon(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = OLD_BLANK_TEST_POKEMON.copy()
        pokemon = PokemonProcessing.ConvertOldDataStructToNew(pokemon)
        assert pokemon == BLANK_TEST_POKEMON_CONVERTED


class TestConvertOldCloudFileToNew:
    def testConvertOldTestOutput(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        shutil.copyfile(f"{DATA_DIR}/cloud_old_format.json", f"{DATA_DIR}/cloud_converted.json")
        completed, error = PokemonProcessing.ConvertOldCloudFileToNew(f"{DATA_DIR}/cloud_converted.json")
        assert error == ""
        assert completed

    def testConvertOldCloudData(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        shutil.copyfile(f"{DATA_DIR}/cloud_2_old_format.json", f"{DATA_DIR}/cloud_converted.json")
        completed, error = PokemonProcessing.ConvertOldCloudFileToNew(f"{DATA_DIR}/cloud_converted.json")
        assert error == ""
        assert completed
