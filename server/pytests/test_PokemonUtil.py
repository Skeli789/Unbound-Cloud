import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "src"))  # Needed for sub-imports

from src.Defines import *
from src.PokemonUtil import *
from pytests.data import *


class TestGetBaseStats:
    def testCorrectlyLoadsBaseStats(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetBaseStats(TEST_POKEMON) == \
        {
            "baseHP": 80,
            "baseAttack": 82,
            "baseDefense": 83,
            "baseSpAttack": 100,
            "baseSpDefense": 100,
            "baseSpeed": 80,
            "type1": "TYPE_GRASS",
            "type2": "TYPE_POISON",
            "genderRatio": "PERCENT_FEMALE(12.5)",
            "growthRate": "GROWTH_MEDIUM_SLOW",
            "ability1": "ABILITY_OVERGROW",
            "ability2": "ABILITY_NONE",
            "hiddenAbility": "ABILITY_CHLOROPHYLL"
        }


class TestGetAbility:
    def testCorrectlyLoadsAbility(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetAbilitySlot(TEST_POKEMON) == TEST_POKEMON["abilitySlot"]

    def testCorrectyLoadsAbility1(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_MACHAMP", "personality": 0, "hiddenAbility": False}
        assert PokemonUtil.GetAbility(pokemon) == "ABILITY_GUTS"
        pokemon["personality"] = 984651512  # Some other even number
        assert PokemonUtil.GetAbility(pokemon) == "ABILITY_GUTS"

    def testCorrectyLoadsAbility2(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_MACHAMP", "personality": 1, "hiddenAbility": False}
        assert PokemonUtil.GetAbility(pokemon) == "ABILITY_NOGUARD"
        pokemon["personality"] = 984651511  # Some other odd number
        assert PokemonUtil.GetAbility(pokemon) == "ABILITY_NOGUARD"

    def testCorrectyLoadsHiddenAbility(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_MACHAMP", "personality": 0, "hiddenAbility": True}
        assert PokemonUtil.GetAbility(pokemon) == "ABILITY_STEADFAST"
        pokemon["personality"] = 1  # Odd number
        assert PokemonUtil.GetAbility(pokemon) == "ABILITY_STEADFAST"


class TestGetGender:
    def testCorrectlyLoadsGender(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetGender(TEST_POKEMON) == TEST_POKEMON["gender"]

    def testCorrectlyLoadsMaleOnlyGender(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_TAUROS", "personality": 0x0}  # Personality would normally almost guarantee a female mon
        assert PokemonUtil.GetGender(pokemon) == "M"

    def testCorrectlyLoadsFemaleOnlyGender(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_MILTANK", "personality": 0xFFFFFFFF}  # Personality would normally almost guarantee a male mon
        assert PokemonUtil.GetGender(pokemon) == "F"

    def testCorrectlyLoadsUnownGender(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_MEWTWO", "personality": 0}
        assert PokemonUtil.GetGender(pokemon) == "U"


class TestGetGenderFromSpeciesAndPersonality:
    def testCorrectlyLoadsGender(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetGenderFromSpeciesAndPersonality(TEST_POKEMON["species"], TEST_POKEMON["personality"]) == TEST_POKEMON["gender"]

    def testCorrectlyLoadsMaleOnlyGender(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetGenderFromSpeciesAndPersonality("SPECIES_HITMONCHAN", 0) == "M"

    def testCorrectlyLoadsFemaleOnlyGender(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetGenderFromSpeciesAndPersonality("SPECIES_JYNX", 0xFFFFFFFF) == "F"

    def testCorrectlyLoadsUnownGender(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetGenderFromSpeciesAndPersonality("SPECIES_GROUDON", 0) == "U"

    def testInvalidSpecies(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetGenderFromSpeciesAndPersonality("SPECIES_FAKE", 0) == "U"


class TestGetNature:
    def testCorrectlyLoadsNature(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetNature(TEST_POKEMON) == TEST_POKEMON["nature"]


class TestGetNatureFromPersonality:
    def testHardy(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetNatureFromPersonality(0) == "NATURE_HARDY"
    
    def testAdamant(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.GetNatureFromPersonality(0x734F868C) == "NATURE_ADAMANT"


class TestIsShiny:
    def testIsNotShiny(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.IsShiny(TEST_POKEMON) == TEST_POKEMON["shiny"]

    def testIsShiny(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert PokemonUtil.IsShiny(TEST_POKEMON_2) == TEST_POKEMON_2["shiny"]

    def testNullSpecies(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert not PokemonUtil.IsShiny({"species": "SPECIES_NONE"})


class TestIsShinyOtIdPersonality:
    def testNotShinyOldOdds(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert not PokemonUtil.IsShinyOtIdPersonality(TEST_POKEMON_2["otId"], TEST_POKEMON_2["personality"])

    def testisShinyNewOdds(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert PokemonUtil.IsShinyOtIdPersonality(TEST_POKEMON_2["otId"], TEST_POKEMON_2["personality"])


class TestGetUnownLetterFromPersonality:
    def testUnownE(self):
        assert PokemonUtil.GetUnownLetterFromPersonality(1685746700) == 4
    
    def testUnownY(self):
        assert PokemonUtil.GetUnownLetterFromPersonality(0x734F868C) == 24
    
    def testUnownQuestion(self):
        assert PokemonUtil.GetUnownLetterFromPersonality(0x10203) == 27


class TestGetMiniorCoreFromPersonality:
    def testRedCore(self):
        assert PokemonUtil.GetMiniorCoreFromPersonality(0x511C3E15) == "SPECIES_MINIOR_RED"

    def testBlueCore(self):
        assert PokemonUtil.GetMiniorCoreFromPersonality(0x2CF285D0) == "SPECIES_MINIOR_BLUE"

    def testOrangeCore(self):
        assert PokemonUtil.GetMiniorCoreFromPersonality(0x2CF285D1) == "SPECIES_MINIOR_ORANGE"

    def testYellowCore(self):
        assert PokemonUtil.GetMiniorCoreFromPersonality(0x1D21C2FC) == "SPECIES_MINIOR_YELLOW"

    def testIndigoCore(self):
        assert PokemonUtil.GetMiniorCoreFromPersonality(0x7EAB3DA7) == "SPECIES_MINIOR_INDIGO"
    
    def testGreenCore(self):
        assert PokemonUtil.GetMiniorCoreFromPersonality(0xFF366356) == "SPECIES_MINIOR_GREEN"

    def testVioletCore(self):
        assert PokemonUtil.GetMiniorCoreFromPersonality(0x9933D73C) == "SPECIES_MINIOR_VIOLET"


class TestCalculateLevel:
    def testLevel100(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.CalculateLevel(TEST_POKEMON) == TEST_POKEMON["level"]

    def testInvalidSpecies(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_FAKE", "experience": 0xFFFFFFFF}
        assert PokemonUtil.CalculateLevel(pokemon) == 1

    def testOverflowingExperience(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_BULBASAUR", "experience": 0xFFFFFFFF}
        assert PokemonUtil.CalculateLevel(pokemon) == MAX_LEVEL

    def testFast(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_LEDIAN", "experience": 100000}
        assert PokemonUtil.CalculateLevel(pokemon) == 50

    def testFast2(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_LEDIAN", "experience": 100001}
        assert PokemonUtil.CalculateLevel(pokemon) == 50

    def testMediumFast(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_MIMIKYU", "experience": 125000}
        assert PokemonUtil.CalculateLevel(pokemon) == 50

    def testMediumFast2(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_DUCKLETT", "experience": 136881}
        assert PokemonUtil.CalculateLevel(pokemon) == 51

    def testMediumSlow(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_CHARMELEON", "experience": 11734}
        assert PokemonUtil.CalculateLevel(pokemon) == 25

    def testMediumSlow2(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_CHARMELEON", "experience": 11735}
        assert PokemonUtil.CalculateLevel(pokemon) == 25

    def testSlow(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_BLACEPHALON", "experience": 156250}
        assert PokemonUtil.CalculateLevel(pokemon) == 50

    def testSlow2(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_BLACEPHALON", "experience": 156251}
        assert PokemonUtil.CalculateLevel(pokemon) == 50

    def testErratic(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_ARMALDO", "experience": 257834}
        assert PokemonUtil.CalculateLevel(pokemon) == 68

    def testErratic2(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_ARMALDO", "experience": 257838}
        assert PokemonUtil.CalculateLevel(pokemon) == 68

    def testFluctuating(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_WAILORD", "experience": 142500}
        assert PokemonUtil.CalculateLevel(pokemon) == 50

    def testFluctuating2(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_WAILORD", "experience": 142501}
        assert PokemonUtil.CalculateLevel(pokemon) == 50


class TestCalculateStat:
    pokemon = {"species": "SPECIES_PHEROMOSA", "level": 100, "nature": "NATURE_MODEST", "ivs": [21, 12, 18, 5, 24, 19], "evs": [4, 184, 16, 184, 74, 48]}
    altPokemon = {"species": "SPECIES_PHEROMOSA", "level": 100, "nature": "NATURE_MODEST", "ivs": [21, 12, 18, 5, 24, 19], "hpEv": 4, "atkEv": 184, "defEv": 16, "spAtkEv": 74, "spDefEv": 48, "spdEv": 184}

    def testCalculateHP(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.CalculateStat(TestCalculateStat.pokemon, 0) == 274
        assert PokemonUtil.CalculateStat(TestCalculateStat.altPokemon, 0) == 274

    def testCalculateAtk(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.CalculateStat(TestCalculateStat.pokemon, 1) == 303
        assert PokemonUtil.CalculateStat(TestCalculateStat.altPokemon, 1) == 303

    def testCalculateDef(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.CalculateStat(TestCalculateStat.pokemon, 2) == 101
        assert PokemonUtil.CalculateStat(TestCalculateStat.altPokemon, 2) == 101

    def testCalculateSpAtk(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.CalculateStat(TestCalculateStat.pokemon, 4) == 353
        assert PokemonUtil.CalculateStat(TestCalculateStat.altPokemon, 4) == 353

    def testCalculateSpDef(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.CalculateStat(TestCalculateStat.pokemon, 5) == 110
        assert PokemonUtil.CalculateStat(TestCalculateStat.altPokemon, 5) == 110

    def testCalculateSpeed(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert PokemonUtil.CalculateStat(TestCalculateStat.pokemon, 3) == 358
        assert PokemonUtil.CalculateStat(TestCalculateStat.altPokemon, 3) == 358

    def testCalculateHPShedinja(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = {"species": "SPECIES_SHEDINJA", "level": 100, "nature": 0, "ivs": [31, 31, 31, 31, 31, 31], "evs": [252, 0, 0, 0, 0, 0]}
        assert PokemonUtil.CalculateStat(pokemon, 0) == 1


class TestUpdateStat:
    def testSamplePokemon(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        pokemon = TEST_POKEMON.copy()
        del pokemon["rawStats"]
        PokemonUtil.UpdateStats(pokemon)
        assert pokemon["rawStats"] == TEST_POKEMON["rawStats"]


class TestModifyStatByNature:
    def testNoChange(self):
        rawStat = 100
        for statId in range(NUM_STATS):
            assert PokemonUtil.ModifyStatByNature("NATURE_HARDY", rawStat, statId) == rawStat  # No change

    def testNoEffectOnHP(self):
        rawStat = 100
        for nature in NatureStatTable.keys():
            assert PokemonUtil.ModifyStatByNature(nature, rawStat, 0) == rawStat  # No change

    def testModified(self):
        rawStat = 100
        assert PokemonUtil.ModifyStatByNature("NATURE_LONELY", rawStat, 1) == int(rawStat * 1.1) # Buffed Attack
        assert PokemonUtil.ModifyStatByNature("NATURE_LONELY", rawStat, 2) == int(rawStat * 0.9) # Lowered Defense

        for statId in range(NUM_STATS):
            if statId == 1 or statId == 2: continue
            assert PokemonUtil.ModifyStatByNature("NATURE_LONELY", rawStat, statId) == rawStat  # No change in other stats


class TestCalculateChecksum:
    def testCorrectValue(self):
        assert PokemonUtil.CalculateChecksum(TEST_POKEMON) == "07ce0f2b5455508a03ac9aee947b2760"

    def testOriginalPokemonUnmodified(self):
        pokemon = TEST_POKEMON.copy()
        PokemonUtil.CalculateChecksum(TEST_POKEMON)
        assert pokemon == TEST_POKEMON

    def testChecksumNotIncludedInChecksum(self):
        pokemon = TEST_POKEMON.copy()
        pokemon["checksum"] = PokemonUtil.CalculateChecksum(pokemon)
        assert PokemonUtil.CalculateChecksum(TEST_POKEMON) == pokemon["checksum"]

    def testMarkingsNotIncludedInChecksum(self):
        pokemon = TEST_POKEMON.copy()
        checksum = PokemonUtil.CalculateChecksum(pokemon)
        pokemon["markings"] = 25
        assert PokemonUtil.CalculateChecksum(pokemon) == checksum
    
    def testWonderTradeTimestampNotIncludedInChecksum(self):
        pokemon = TEST_POKEMON.copy()
        checksum = PokemonUtil.CalculateChecksum(pokemon)
        pokemon["wonderTradeTimestamp"] = 25
        assert PokemonUtil.CalculateChecksum(pokemon) == checksum

    def testSimilarDicts(self):
        pokemon1 = {"species": "SPECIES_BULBASAUR", "personality": 12345678}
        pokemon2 = {"personality": 12345678, "species": "SPECIES_BULBASAUR"}
        assert PokemonUtil.CalculateChecksum(pokemon1) == PokemonUtil.CalculateChecksum(pokemon2)


class TestIsUpdatedDataVersion:
    def testUpdatedVersion(self):
        assert PokemonUtil.IsUpdatedDataVersion(TEST_POKEMON)
    
    def testOldVersion(self):
        assert not PokemonUtil.IsUpdatedDataVersion(OLD_TEST_POKEMON)


class TestIsCloneAbility:
    def testIsCloneAbility(self):
        assert PokemonUtil.IsCloneAbility("ABILITY_AIRLOCK", "ABILITY_CLOUDNINE")
        assert PokemonUtil.IsCloneAbility("ABILITY_WIMPOUT", "ABILITY_EMERGENCYEXIT")

    def testIsntCloneAbility(self):
        assert not PokemonUtil.IsCloneAbility("ABILITY_AIRLOCK", "ABILITY_EMERGENCYEXIT")
        assert not PokemonUtil.IsCloneAbility("ABILITY_WIMPOUT", "ABILITY_CLOUDNINE")


class TestChangeAbility:
    def testChangeToSameAbility1(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON_2.copy()
        PokemonUtil.ChangeAbility(pokemon, 0)
        assert pokemon == TEST_POKEMON_2

    def testChangeToSameAbilityBitFromHiddenAbility(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON_2.copy()
        pokemon["hiddenAbility"] = True
        PokemonUtil.ChangeAbility(pokemon, 0)
        assert pokemon == TEST_POKEMON_2

    def testChangeToAbility1(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON_3.copy()
        PokemonUtil.ChangeAbility(pokemon, 0)
        assert PokemonUtil.GetAbility(pokemon) == "ABILITY_GUTS"
        assert PokemonUtil.GetGender(pokemon) == TEST_POKEMON_3["gender"]  # Hasn't changed
        assert PokemonUtil.IsShiny(pokemon) == TEST_POKEMON_3["shiny"]  # Hasn't changed
        assert PokemonUtil.GetNature(pokemon) == TEST_POKEMON_3["nature"]  # Hasn't changed

    def testChangeToAbility2(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON_2.copy()
        PokemonUtil.ChangeAbility(pokemon, 1)
        assert PokemonUtil.GetAbility(pokemon) == "ABILITY_STRONGJAW"
        assert PokemonUtil.GetGender(pokemon) == TEST_POKEMON_2["gender"]  # Hasn't changed
        assert PokemonUtil.IsShiny(pokemon) == TEST_POKEMON_2["shiny"]  # Hasn't changed
        assert PokemonUtil.GetNature(pokemon) == TEST_POKEMON_2["nature"]  # Hasn't changed

    def testChangeToHiddenAbility(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON_2.copy()
        PokemonUtil.ChangeAbility(pokemon, 2)
        assert PokemonUtil.GetAbility(pokemon) == "ABILITY_MOXIE"
        pokemon["hiddenAbility"] = False
        assert pokemon == TEST_POKEMON_2  # Shouldn't have changed otherwise

    def testChangeUnownAbilityBit(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON_UNOWN.copy()
        PokemonUtil.ChangeAbility(pokemon, 1)
        assert pokemon == TEST_POKEMON_UNOWN  # Shouldn't actually change

    def testChangeMiniorAbilityBit(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        pokemon = TEST_POKEMON_MINIOR.copy()
        PokemonUtil.ChangeAbility(pokemon, 1)
        assert pokemon == TEST_POKEMON_MINIOR  # Shouldn't actually change
