import os, sys
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "src"))  # Needed for sub-imports

from src.Defines import *

INVALID_FILE_SIGNATURE = 0xAAAAAAAA


class TestLoadAll:
    def testAllGameCodes(self):
        for gameCode in GameDetails:
            print(f"Testing game code {gameCode}")
            Defines.LoadAll(gameCode)
            assert Defines.fileSignature == gameCode

    def testSpecies(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.species[1] == "SPECIES_BULBASAUR"
        assert Defines.species[150] == "SPECIES_MEWTWO"
        assert Defines.reverseSpecies["SPECIES_BULBASAUR"] == 1
        assert Defines.reverseSpecies["SPECIES_MEWTWO"] == 150

    def testSpeciesUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        species = sorted(Defines.species.items(), reverse=True)
        assert Defines.species[1259] == "SPECIES_ENAMORUS_THERIAN"
        assert Defines.reverseSpecies["SPECIES_ENAMORUS_THERIAN"] == 1259

    def testMoves(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.moves[0] == "MOVE_NONE"
        assert Defines.moves[150] == "MOVE_SPLASH"
        assert Defines.reverseMoves["MOVE_NONE"] == 0
        assert Defines.reverseMoves["MOVE_SPLASH"] == 150
    
    def testMovesUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.moves[766] == "MOVE_TAKEHEART"
        assert Defines.reverseMoves["MOVE_TAKEHEART"] == 766

    def testItems(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.items[0] == "ITEM_NONE"
        assert Defines.items[50] == "ITEM_YELLOW_SHARD"
        assert Defines.reverseItems["ITEM_NONE"] == 0
        assert Defines.reverseItems["ITEM_YELLOW_SHARD"] == 50
        assert "ITEM_DREAM_MIST" not in Defines.items

    def testItemsUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.items[89] == "ITEM_DREAM_MIST"
        assert Defines.reverseItems["ITEM_DREAM_MIST"] == 89

    def testBallTypes(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.ballTypes[0] == "BALL_TYPE_MASTER_BALL"
        assert Defines.ballTypes[10] == "BALL_TYPE_LUXURY_BALL"
        assert Defines.reverseBallTypes["BALL_TYPE_MASTER_BALL"] == 0
        assert Defines.reverseBallTypes["BALL_TYPE_LUXURY_BALL"] == 10

    def testBallTypesUnbound(self):  # Not actually doing anything species right now
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.ballTypes[26] == "BALL_TYPE_DREAM_BALL"
        assert Defines.reverseBallTypes["BALL_TYPE_DREAM_BALL"] == 26

    def testBaseStats(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.baseStats["SPECIES_BULBASAUR"] == \
        {
            "baseHP": 45,
            "baseAttack": 49,
            "baseDefense": 49,
            "baseSpAttack": 65,
            "baseSpDefense": 65,
            "baseSpeed": 45,
            "type1": "TYPE_GRASS",
            "type2": "TYPE_POISON",
            "genderRatio": "PERCENT_FEMALE(12.5)",
            "growthRate": "GROWTH_MEDIUM_SLOW",
            "ability1": "ABILITY_OVERGROW",
            "ability2": "ABILITY_NONE",
            "hiddenAbility": "ABILITY_CHLOROPHYLL"
        }
        assert Defines.baseStats["SPECIES_PONYTA"] == \
        {
            "baseHP": 50,
            "baseAttack": 85,
            "baseDefense": 55,
            "baseSpAttack": 65,
            "baseSpDefense": 65,
            "baseSpeed": 90,
            "type1": "TYPE_FIRE",
            "type2": "TYPE_FIRE",
            "genderRatio": "PERCENT_FEMALE(50)",
            "growthRate": "GROWTH_MEDIUM_FAST",
            "ability1": "ABILITY_RUNAWAY",
            "ability2": "ABILITY_FLASHFIRE",
            "hiddenAbility": "ABILITY_FLAMEBODY"
        }

    def testBaseStatsUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.baseStats["SPECIES_PONYTA"] == \
        {
            "baseHP": 50,
            "baseAttack": 85,
            "baseDefense": 55,
            "baseSpAttack": 65,
            "baseSpDefense": 65,
            "baseSpeed": 90,
            "type1": "TYPE_FIRE",
            "type2": "TYPE_FIRE",
            "genderRatio": "PERCENT_FEMALE(50)",
            "growthRate": "GROWTH_MEDIUM_FAST",
            "ability1": "ABILITY_FLAMEBODY",
            "ability2": "ABILITY_FLASHFIRE",
            "hiddenAbility": "ABILITY_FIERYNEIGH"
        }
    
    def testShinyOdds(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.shinyOdds == OLD_SHINY_ODDS
    
    def testShinyOddsUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.shinyOdds == MODERN_SHINY_ODDS

    def testNatures(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.natures[10] == "NATURE_TIMID"
        assert Defines.reverseNatures["NATURE_TIMID"] == 10

    def testLanguages(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.languages[2] == "LANGUAGE_ENGLISH"
        assert Defines.reverseLanguages["LANGUAGE_ENGLISH"] == 2

    def testDexNum(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.dexNum[1] == "NATIONAL_DEX_BULBASAUR"
        assert Defines.dexNum[252] == "NATIONAL_DEX_TREECKO"
        assert Defines.reverseDexNum["NATIONAL_DEX_BULBASAUR"] == 1
        assert Defines.reverseDexNum["NATIONAL_DEX_TREECKO"] == 252

    def testSpeciesToDexNum(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.speciesToDexNum["SPECIES_BULBASAUR"] == "NATIONAL_DEX_BULBASAUR"
        assert Defines.speciesToDexNum["SPECIES_CHIMECHO"] == "NATIONAL_DEX_CHIMECHO"

    def testExperienceCurves(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert "GROWTH_MEDIUM_FAST" in Defines.experienceCurves
        assert "GROWTH_ERRATIC" in Defines.experienceCurves
        assert "GROWTH_FLUCTUATING" in Defines.experienceCurves
        assert "GROWTH_MEDIUM_SLOW" in Defines.experienceCurves
        assert "GROWTH_FAST" in Defines.experienceCurves
        assert "GROWTH_SLOW" in Defines.experienceCurves

        assert len(Defines.experienceCurves["GROWTH_MEDIUM_FAST"]) == 255
        assert len(Defines.experienceCurves["GROWTH_ERRATIC"]) == 255
        assert len(Defines.experienceCurves["GROWTH_FLUCTUATING"]) == 255
        assert len(Defines.experienceCurves["GROWTH_MEDIUM_SLOW"]) == 255
        assert len(Defines.experienceCurves["GROWTH_FAST"]) == 255
        assert len(Defines.experienceCurves["GROWTH_SLOW"]) == 255

    def testCharMap(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.charMap[0] == " "
        assert Defines.charMap[27] == "é"
        assert Defines.charMap[187] == "A"
        assert Defines.reverseCharMap[" "] == 0
        assert Defines.reverseCharMap["é"] == 27
        assert Defines.reverseCharMap["A"] == 187
    
    def testInvalidFileSignature(self):
        assert Defines.LoadAll(INVALID_FILE_SIGNATURE) is False


class TestGetCurrentGameName:
    def testCFRE(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.GetCurrentGameName() == "cfre"

    def testUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.GetCurrentGameName() == "unbound"

    def testMAGM(self):
        Defines.LoadAll(MAGM_FILE_SIGNATURE)
        assert Defines.GetCurrentGameName() == "magm"


class TestGetCurrentDefinesDir:
    def testCFRE(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.GetCurrentDefinesDir() == "cfru"

    def testUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.GetCurrentDefinesDir() == "unbound"

    def testMAGM(self):
        Defines.LoadAll(MAGM_FILE_SIGNATURE)
        assert Defines.GetCurrentDefinesDir() == "magm"



class TestGetOriginalGameName:
    def testCFRELoadedMonFromCFRE(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.GetMonOriginalGameName(VERSION_FIRERED) == "cfre"

    def testCFRELoadedMonFromUnbound(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.GetMonOriginalGameName(VERSION_UNBOUND) == "unbound"

    def testUnboundLoadedMonFromUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.GetMonOriginalGameName(VERSION_FIRERED) == "unbound"

    def testUnboundLoadedMonFromCFRE(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.GetMonOriginalGameName(VERSION_UNBOUND) == "firered"

    def testUnboundLoadedMonFromMAGM(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.GetMonOriginalGameName(VERSION_MAGM) == "magm"

    def testMAGMLoadedMonFromUnbound(self):
        Defines.LoadAll(MAGM_FILE_SIGNATURE)
        assert Defines.GetMonOriginalGameName(VERSION_UNBOUND) == "unbound"

    def testLoadedGame(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.GetMonOriginalGameName(0) == "unbound"


class TestGetMetIdToBeSaved:
    def testCFREToCFRE(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.GetMetIdToBeSaved("cfre") == VERSION_FIRERED

    def testFireRedToCFRE(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        assert Defines.GetMetIdToBeSaved("firered") == VERSION_FIRERED

    def testUnboundToUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.GetMetIdToBeSaved("unbound") == VERSION_FIRERED

    def testUnboundToCFRE(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)  # saveGame = CFRE
        assert Defines.GetMetIdToBeSaved("unbound") == VERSION_UNBOUND  # metGame = Unbound

    def testCFREToUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)  # saveGame = Unbound
        assert Defines.GetMetIdToBeSaved("cfre") == VERSION_UNBOUND  # metGame = CFRE

    def testUnboundToMAGM(self):
        Defines.LoadAll(MAGM_FILE_SIGNATURE)  # saveGame = MAGM
        assert Defines.GetMetIdToBeSaved("unbound") == VERSION_UNBOUND  # metGame = Unbound

    def testMAGMToUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)  # saveGame = Unbound
        assert Defines.GetMetIdToBeSaved("magm") == VERSION_MAGM  # metGame = MAGM

    def testUnknownMonHack(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.GetMetIdToBeSaved("unknown") == VERSION_FIRERED  # Base version for unknowns

    def testUnknownFileSignatureUnknownMonHack(self):
        Defines.fileSignature = 0
        assert Defines.GetMetIdToBeSaved("unknown") == VERSION_FIRERED  # Default for unknowns


class TestIsValidFileSignature:
    def testValidFileSignature(self):
        assert Defines.IsValidFileSignature(UNBOUND_FILE_SIGNATURE)

    def testInvalidFileSignature(self):
        assert not Defines.IsValidFileSignature(INVALID_FILE_SIGNATURE)

    def testOldFileSignature(self):
        assert Defines.IsValidFileSignature(UNBOUND_2_0_FILE_SIGNATURE)


class TestIsOldVersionFileSignature:
    def testValidOldFileSignature(self):
        assert Defines.IsOldVersionFileSignature(UNBOUND_2_0_FILE_SIGNATURE)

    def testLatestFileSignature(self):
        assert not Defines.IsOldVersionFileSignature(UNBOUND_FILE_SIGNATURE)


class TestGetOldVersionGameName:
    def testValidOldFileSignature(self):
        assert Defines.GetOldVersionGameName(UNBOUND_2_0_FILE_SIGNATURE) == "Unbound 2.0"

    def testLatestFileSignature(self):
        assert Defines.GetOldVersionGameName(UNBOUND_FILE_SIGNATURE) == ""


class TestIsCFRUHack:
    def testUnbound(self):
        Defines.LoadAll(UNBOUND_FILE_SIGNATURE)
        assert Defines.IsCFRUHack


class TestGetSpeciesDexNum:
    def testValidSpecies(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        Defines.GetSpeciesDexNum("SPECIES_BULBASAUR") == 1
        Defines.GetSpeciesDexNum("SPECIES_MEWTWO") == 150
    
    def testInvalidSpecies(self):
        Defines.LoadAll(CFRE_FILE_SIGNATURE)
        Defines.GetSpeciesDexNum("SPECIES_FAKE") == 0


class TestPokeByteTableMaker:
    def testWeirdCharacters(self):
        Defines.LoadCharMap()
        assert Defines.charMap[239] == "▶"
        assert Defines.reverseCharMap["▶"] == 239


class TestReverse:
    def testEmptyDict(self):
        testDict = {}
        assert Defines.Reverse(testDict) == {}

    def test1ElementDict(self):
        testDict = {0: "a"}
        assert Defines.Reverse(testDict) == {"a": 0}

    def test3ElementDict(self):
        testDict = {0: "a", 1: "b", 2: "c"}
        assert Defines.Reverse(testDict) == {"a": 0, "b": 1, "c": 2}
