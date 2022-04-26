import json
from typing import List, Tuple
from xmlrpc.client import Boolean
from Defines import Defines
from PokemonUtil import PokemonUtil  # , NUM_STATS
from Util import BytesToString, BytesToInt, ConvertToReverseByteList

CFRUCompressedPokemon = {
    "personality": (0, 4),
    "otId": (4, 4),
    "nickname": (8, 10),
    "language": (18, 1),
    "sanity": (19, 1),
    "otName": (20, 7),
    "markings": (27, 1),
    "species": (28, 2),
    "item": (30, 2),
    "experience": (32, 4),
    "ppBonuses": (36, 1),
    "friendship": (37, 1),
    "pokeBall": (38, 1),
    "moves": (39, 5),
    "hpEv": (44, 1),
    "atkEv": (45, 1),
    "defEv": (46, 1),
    "spdEv": (47, 1),
    "spAtkEv": (48, 1),
    "spDefEv": (49, 1),
    "pokerus": (50, 1),
    "metLocaton": (51, 1),
    "metInfo": (52, 2),
    "ivs": (54, 4),
}

CFRUCompressedPokemonSize = 58

PokemonData = dict.fromkeys(CFRUCompressedPokemon.keys(), None)

BASE_FORMS_OF_BANNED_SPECIES = {  # All forms that can't exist outside of battle
    "SPECIES_CHERRIM_SUN": "SPECIES_CHERRIM",
    "SPECIES_HIPPOPOTAS_F": "SPECIES_HIPPOPOTAS",
    "SPECIES_HIPPOWDON_F": "SPECIES_HIPPOWDON",
    "SPECIES_UNFEZANT_F": "SPECIES_UNFEZANT",
    "SPECIES_DARMANITANZEN": "SPECIES_DARMANITAN",
    "SPECIES_DARMANITAN_G_ZEN": "SPECIES_DARMANITAN_G",
    "SPECIES_FRILLISH_F": "SPECIES_FRILLISH",
    "SPECIES_JELLICENT_F": "SPECIES_JELLICENT",
    "SPECIES_MELOETTA_PIROUETTE": "SPECIES_MELOETTA",
    "SPECIES_AEGISLASH_BLADE": "SPECIES_AEGISLASH",
    "SPECIES_ASHGRENINJA": "SPECIES_GRENINJA",
    "SPECIES_PYROAR_FEMALE": "SPECIES_PYROAR",
    "SPECIES_XERNEAS_NATURAL": "SPECIES_XERNEAS", # Just an aesthetic species, should be SPECIES_XERNEAS always
    "SPECIES_ZYGARDE_COMPLETE": "SPECIES_ZYGARDE",
    "SPECIES_WISHIWASHI_S": "SPECIES_WISHIWASHI",
    "SPECIES_MIMIKYU_BUSTED": "SPECIES_MIMIKYU",
    "SPECIES_NECROZMA_ULTRA": "SPECIES_NECROZMA",
    "SPECIES_CRAMORANT_GULPING": "SPECIES_CRAMORANT",
    "SPECIES_CRAMORANT_GORGING": "SPECIES_CRAMORANT",
    "SPECIES_EISCUE_NOICE": "SPECIES_EISCUE",
    "SPECIES_MORPEKO_HANGRY": "SPECIES_MORPEKO",
    "SPECIES_ZACIAN_CROWNED": "SPECIES_ZACIAN",
    "SPECIES_ZAMAZENTA_CROWNED": "SPECIES_ZAMAZENTA",
    "SPECIES_ETERNATUS_ETERNAMAX": "SPECIES_ETERNATUS",
}

SANITY_IS_BAD_EGG = 1
SANITY_HAS_SPECIES = 2
SANITY_IS_EGG = 4

BLANK_CONVERTED_POKEMON = \
{
    "personality": 0,
    "otId": 0,
    "nickname": "          ",
    "language": "LANGUAGE_NONE",
    "otName": "       ",
    "markings": [False, False, False, False, False, False, False, False],
    "species": "SPECIES_NONE",
    "item": "ITEM_NONE",
    "experience": 0,
    "ppBonuses": [0, 0, 0, 0],
    "friendship": 0,
    "pokeBall": "BALL_TYPE_MASTER_BALL",
    "moves": ["MOVE_NONE", "MOVE_NONE", "MOVE_NONE", "MOVE_NONE"],
    "pokerus": 0,
    "metLocaton": 0,
    "ivs": [0, 0, 0, 0, 0, 0],
    "evs": [0, 0, 0, 0, 0, 0],
    "isEgg": False,
    "hiddenAbility": False,
    "shiny": False,
    "abilitySlot": 0,
    "gender": "U",
    "nature": 0,
    "metLevel": 0,
    "metGame": "unbound",
    "gigantamax": False,
    "otGender": "M",
    "checksum": "b32f654d6f18fe7df816e52dc99f0089"
}


class PokemonProcessing:
    @staticmethod
    def LoadCFRUCompressedMonAtBoxOffset(allBoxes: List[int], monOffset: int) -> dict:
        pokemonData = PokemonData.copy()

        for tag in CFRUCompressedPokemon:
            startOffset = monOffset + CFRUCompressedPokemon[tag][0]
            endOffset = startOffset + CFRUCompressedPokemon[tag][1]
            data = allBoxes[startOffset:endOffset]
            if tag == "nickname" or tag == "otName":
                pokemonData[tag] = BytesToString(data)  # Read as proper string
            else:
                pokemonData[tag] = BytesToInt(data)

        return pokemonData

    @staticmethod
    def AssignConstantsToCFRUData(pokemonData: dict):
        # Fix Move Names
        moves = []
        compressedMoves = pokemonData["moves"]

        if compressedMoves is not None and type(compressedMoves) != list:  # Hasn't already been processed
            for _ in range(4):  # All four moves
                move = compressedMoves & 0x3FF  # 10 Bits
                if move in Defines.moves and move != 0:
                    move = Defines.moves[move]
                    moves.append(move)
                compressedMoves >>= 10  # Shift 10 bits down

            if (len(moves) == 0  # Didn't know any valid moves
                    and pokemonData["species"] != 0 and pokemonData["species"] != "SPECIES_NONE"):  # And is actual Pokemon
                moves = ["MOVE_POUND"] + ["MOVE_NONE"] * 3  # Give new moveset

            if len(moves) < 4:
                moves += ["MOVE_NONE"] * (4 - len(moves))

            pokemonData["moves"] = moves

        # Fix Species Names
        if pokemonData["species"] in Defines.species:
            pokemonData["species"] = Defines.species[pokemonData["species"]]

            # Fix species that shouldn't exist
            if pokemonData["species"] in BASE_FORMS_OF_BANNED_SPECIES:
                pokemonData["species"] = BASE_FORMS_OF_BANNED_SPECIES[pokemonData["species"]]
            elif pokemonData["species"].startswith("SPECIES_UNOWN"):
                pokemonData["species"] = "SPECIES_UNOWN"
        # elif pokemonData["species"] not in Defines.reverseSpecies:
            # Leave species as the number

        # Fix Item Names
        if pokemonData["item"] in Defines.items:
            pokemonData["item"] = Defines.items[pokemonData["item"]]
        elif pokemonData["item"] not in Defines.reverseItems:  # Hasn't already been processed
            pokemonData["item"] = "ITEM_NONE"  # Item not defined then bye-bye item

        # Fix Ball Names
        if pokemonData["pokeBall"] in Defines.ballTypes:
            pokemonData["pokeBall"] = Defines.ballTypes[pokemonData["pokeBall"]]
        elif pokemonData["pokeBall"] not in Defines.reverseBallTypes:  # Hasn't already been processed
            pokemonData["pokeBall"] = "BALL_TYPE_POKE_BALL"  # Ball not defined then set default ball

        # Fix IVs
        ivs = []
        compressedIVs = pokemonData["ivs"]

        if compressedIVs is not None and type(compressedIVs) != list:  # Hasn't already been processed
            for i in range(6):  # 6 Stats
                iv = compressedIVs & 0x1F  # 5 bits
                ivs.append(iv)
                compressedIVs >>= 5  # Shift 5 bits down
            pokemonData["ivs"] = ivs

        # Fix EVs
        evs = [pokemonData["hpEv"], pokemonData["atkEv"], pokemonData["defEv"], pokemonData["spdEv"], pokemonData["spAtkEv"], pokemonData["spDefEv"]]
        pokemonData["evs"] = evs

        # Fix Is Egg
        if "isEgg" in pokemonData:  # Already processed
            if type(pokemonData["isEgg"]) == int:
                pokemonData["isEgg"] = pokemonData["isEgg"] != 0  # Convert to bool
        else:
            pokemonData["isEgg"] = (compressedIVs & 1) != 0 or (pokemonData["sanity"] & SANITY_IS_EGG) != 0

        # Fix Hidden Ability
        if "hiddenAbility" in pokemonData:  # Already processed
            if type(pokemonData["hiddenAbility"]) == int:
                pokemonData["hiddenAbility"] = pokemonData["hiddenAbility"] != 0  # Convert to bool
        else:
            compressedIVs >>= 1  # Shift 1 bit down
            pokemonData["hiddenAbility"] = (compressedIVs & 1) != 0

        # Fix Egg Nicknames
        if pokemonData["isEgg"]:
            pokemonData["nickname"] = ""

        # Set Shiny
        pokemonData["shiny"] = PokemonUtil.IsShiny(pokemonData)

        if pokemonData["species"] in Defines.baseStats:
            # Assign Ability - Actual id now handled on client side based on loaded game
            # pokemonData["ability"] = PokemonUtil.GetAbility(pokemonData)
            if pokemonData["hiddenAbility"]:
                pokemonData["abilitySlot"] = 2
            else:
                 pokemonData["abilitySlot"] = pokemonData["personality"] & 1  # Doesn't matter if there's no Ability in that slot because that can change between games

            # Assign Gender
            pokemonData["gender"] = PokemonUtil.GetGender(pokemonData)

            # Assign Nature
            pokemonData["nature"] = PokemonUtil.GetNature(pokemonData)

            # Assign Level
            # pokemonData["level"] = PokemonUtil.CalculateLevel(pokemonData)

            # Assign Raw Stats
            # PokemonUtil.UpdateStats(pokemonData)
        else:
            # pokemonData["ability"] = 0
            pokemonData["abilitySlot"] = 0
            pokemonData["gender"] = "U"  # Unknown
            pokemonData["nature"] = 0
            # pokemonData["level"] = 1
            # pokemonData["rawStats"] = [0] * NUM_STATS

        # Wipe Bad Eggs
        if pokemonData["sanity"] & SANITY_IS_BAD_EGG:
            # Replace with blank mon
            keysToRemove = list(pokemonData.keys())
            for key in keysToRemove:
                pokemonData.pop(key)
            for key in BLANK_CONVERTED_POKEMON:
                pokemonData[key] = BLANK_CONVERTED_POKEMON[key]
            return

        # Fix PP Bonuses
        if pokemonData["ppBonuses"] is not None and type(pokemonData["ppBonuses"]) != list:  # Hasn't already been processed
            pokemonData["ppBonuses"] = [(pokemonData["ppBonuses"] & ((1 << (i * 2)) | (1 << (i * 2 + 1)))) >> (2 * i) for i in range(4)]

        # Fix Markings
        if pokemonData["markings"] is not None and type(pokemonData["markings"]) != list:  # Hasn't already been processed
            pokemonData["markings"] = [(pokemonData["markings"] & (1 << i)) != 0 for i in range(8)]

        # Set Language
        if pokemonData["language"] in Defines.languages:
            pokemonData["language"] = Defines.languages[pokemonData["language"]]
        elif pokemonData["language"] not in Defines.languages:  # Hasn't already been processed
            pokemonData["language"] = "LANGUAGE_ENGLISH"

        # Set Met Level
        pokemonData["metLevel"] = pokemonData["metInfo"] & 0x7F

        # Set Met Game
        metGameId = (pokemonData["metInfo"] & 0x780) >> 7
        pokemonData["metGame"] = Defines.GetMonOriginalGameName(metGameId)

        # Set Gigantamax
        pokemonData["gigantamax"] = (pokemonData["metInfo"] & 0x800) != 0

        # Set OT Gender
        if (pokemonData["metInfo"] & 0x8000) != 0:
            pokemonData["otGender"] = "F"
        else:
            pokemonData["otGender"] = "M"

        # Remove unneeded data members
        removeMembers = ["metInfo", "sanity", "hpEv", "atkEv", "defEv", "spdEv", "spAtkEv", "spDefEv"]
        for member in removeMembers:
            if member in pokemonData:
                del pokemonData[member]

        # Create checksum
        pokemonData["checksum"] = PokemonUtil.CalculateChecksum(pokemonData)


    ### Code for updating save files ###
    @staticmethod
    def GetAllCFRUCompressedMons(allPokemonData: List[dict]) -> List[int]:
        allCompressedMons = []
        for pokemonData in allPokemonData:
            allCompressedMons += PokemonProcessing.ConvertPokemonToCFRUCompressedMon(pokemonData)
        return allCompressedMons

    @staticmethod
    def ConvertPokemonToCFRUCompressedMon(pokemonData: dict) -> List[int]:
        species = pokemonData["species"]
        finalData = [0] * CFRUCompressedPokemonSize
        if species == 0 or species == "SPECIES_NONE":
            return finalData  # No point in wasting time

        if "checksum" not in pokemonData and PokemonUtil.IsUpdatedDataVersion(pokemonData):
            return finalData  # Checksum is missing

        if PokemonUtil.CalculateChecksum(pokemonData) != pokemonData["checksum"]:
            return finalData  # Data is corrupted

        # Fix Ability if changing between games
        # if "ability" in pokemonData and species in Defines.baseStats:
        #     properAbility = PokemonUtil.GetAbility(pokemonData)
        #     currAbility = pokemonData["ability"]
        #     if properAbility != currAbility:  # Came from game with different Ability
        #         # print(pokemonData["nickname"] + "'s Ability doesn't match.")
        #         # Try to match Ability to correct one
        #         if currAbility == Defines.baseStats[species]["hiddenAbility"] \
        #                 or PokemonUtil.IsCloneAbility(currAbility, Defines.baseStats[species]["hiddenAbility"]):
        #             PokemonUtil.ChangeAbility(pokemonData, 2)  # Hidden Ability
        #         elif currAbility == Defines.baseStats[species]["ability1"] \
        #                 or PokemonUtil.IsCloneAbility(currAbility, Defines.baseStats[species]["ability1"]):
        #             PokemonUtil.ChangeAbility(pokemonData, 0)  # Ability 1
        #         elif currAbility == Defines.baseStats[species]["ability2"] \
        #                 or PokemonUtil.IsCloneAbility(currAbility, Defines.baseStats[species]["ability2"]):
        #             PokemonUtil.ChangeAbility(pokemonData, 1)  # Ability 2

        # Filter out non-existant moves and update PP Bonuses accordingly
        if type(pokemonData["moves"]) == list:  # Don't check if it exists, because if it doesn't an error should be thrown
            actualMoves = []
            actualPPBonuses = []
            for i, move in enumerate(pokemonData["moves"]):
                if move in Defines.reverseMoves:
                    actualMoves.append(move)
                    if type(pokemonData["ppBonuses"]) == list:
                        actualPPBonuses.append(pokemonData["ppBonuses"][i])
                    else:
                        actualPPBonuses.append(pokemonData["ppBonuses"] & (3 << i))
        else:
            return finalData  # Can't sneak in moves that isn't a list

        # Dissect the actual data
        for key in pokemonData:
            reverse = True  # Data is stored in little endian

            if key == "species":
                if species in Defines.reverseSpecies:
                    finalSpecies = Defines.reverseSpecies[species]
                elif species in Defines.unofficialSpecies:
                    finalSpecies = int(species)  # Species in game, but not supported on the site
                else:
                    finalSpecies = 0  # Bye, bye, Pokemon!

                if finalSpecies != 0:
                    finalData[CFRUCompressedPokemon["sanity"][0]] |= 2  # hasSpecies
                else:
                    return [0] * CFRUCompressedPokemonSize  # Wipe Pokemon with fake species

                data = finalSpecies
                offset = CFRUCompressedPokemon[key][0]
            elif key == "moves":
                moves = 0
                for i, move in enumerate(actualMoves):
                    move = Defines.reverseMoves[move]
                    moves |= (min(move, 0x3FF) << (10 * i))

                if moves == 0:
                    moves = 1  # Pound

                data = moves
                offset = CFRUCompressedPokemon[key][0]
            elif key == "ppBonuses":
                data = 0
                for i, bonus in enumerate(actualPPBonuses):
                    data |= (min(bonus, 3) << (2 * i))
                offset = CFRUCompressedPokemon[key][0]
            elif key == "ivs":
                ivs = 0
                if pokemonData[key] is not None:
                    for i, iv in enumerate(pokemonData[key]):
                        ivs |= (min(iv, 31) << (5 * i))
                data = ivs
                offset = CFRUCompressedPokemon[key][0]
            elif key == "evs":
                evs = 0
                if pokemonData[key] is not None:
                    for i, ev in enumerate(pokemonData[key]):
                        evs |= (min(ev, 0xFF) << (8 * i))
                data = evs
                offset = CFRUCompressedPokemon["hpEv"][0]
            elif key == "isEgg":
                if pokemonData["isEgg"] != 0:
                    finalData[CFRUCompressedPokemon["sanity"][0]] |= 4
                    finalData[57] |= 0x40  # End of IVs
                continue
            elif key == "hiddenAbility":
                if pokemonData["hiddenAbility"]:
                    finalData[57] |= 0x80  # End of IVs
                continue
            elif key == "item":
                item = pokemonData[key]
                if pokemonData["item"] in Defines.reverseItems:
                    item = Defines.reverseItems[item]
                else:
                    item = 0
                data = item
                offset = CFRUCompressedPokemon[key][0]
            elif key == "pokeBall":
                data = pokemonData[key]
                if data in Defines.reverseBallTypes:
                    data = Defines.reverseBallTypes[data]
                else:
                    data = Defines.reverseBallTypes["BALL_TYPE_POKE_BALL"]
                offset = CFRUCompressedPokemon[key][0]
            elif key == "language":
                data = pokemonData[key]
                if data in Defines.reverseLanguages:
                    data = Defines.reverseLanguages[data]
                else:
                    data = Defines.reverseLanguages["LANGUAGE_ENGLISH"]
                offset = CFRUCompressedPokemon[key][0]
            elif key == "markings":
                markings = pokemonData[key]
                data = markings
                if type(data) == list:
                    data = sum([1 << i if markings[i] else 0 for i in range(len(markings))]) & 0xF  # Only 4 markings actually in base game
                offset = CFRUCompressedPokemon[key][0]
            elif key == "metLevel":
                data = min(pokemonData[key], 0x7F)  # 7 bits
                offset = CFRUCompressedPokemon["metInfo"][0]  # Part of Met Info
            elif key == "metGame":
                data = Defines.GetMetIdToBeSaved(pokemonData[key])
                data = (data & 0xF) << 7  # 4 bits
                offset = CFRUCompressedPokemon["metInfo"][0]  # Part of Met Info
            elif key == "gigantamax":
                if pokemonData[key]:
                    data = 1 << 11  # Gigantamax bit set
                    offset = CFRUCompressedPokemon["metInfo"][0]  # Part of Met Info
                else:
                    continue
            elif key == "otGender":
                if pokemonData[key] == "F":
                    data = 1 << 15  # Female OT
                    offset = CFRUCompressedPokemon["metInfo"][0]  # Part of Met Info
                else:
                    continue
            elif key == "nickname" or key == "otName":
                charList = []
                name = pokemonData[key]
                for char in name:
                    if char in Defines.reverseCharMap:
                        char = hex(Defines.reverseCharMap[char])[2:].zfill(2)  # Make it look like "03" or "57"
                    charList.append(char)

                while(len(charList)) < CFRUCompressedPokemon[key][1]:
                    charList.append("FF")  # EOS

                data = charList
                offset = CFRUCompressedPokemon[key][0]
                reverse = False  # Data is stored one byte at a time
            else:
                if key in CFRUCompressedPokemon:
                    data = pokemonData[key]
                    offset = CFRUCompressedPokemon[key][0]
                else:
                    continue

            if reverse:
                data = ConvertToReverseByteList(hex(data))

            for i, byte in enumerate(data):
                finalData[offset + i] |= int(byte, 16)

        return finalData

    @staticmethod
    def UpdatePokedexFlags(seenFlags: List[int], caughtFlags: List[int], allPokemonData: List[dict]) -> Tuple[List[int], List[int]]:
        newSeenFlags = seenFlags.copy()
        newCaughtFlags = caughtFlags.copy()

        for pokemonData in allPokemonData:
            species = pokemonData["species"]
            if species != "SPECIES_NONE" and species != "":
                dexNum = Defines.GetSpeciesDexNum(species)

                if dexNum >= 1:
                    dexNum -= 1
                    byteOffset = dexNum // 8
                    bitOffset = dexNum % 8
                    bitToSet = (1 << bitOffset)
                    newSeenFlags[byteOffset] |= bitToSet
                    newCaughtFlags[byteOffset] |= bitToSet

        return newSeenFlags, newCaughtFlags

    @staticmethod
    def ConvertOldDataStructToNew(pokemon: dict):
        PokemonProcessing.AssignConstantsToCFRUData(pokemon)
        del pokemon["ability"]
        del pokemon["level"]
        del pokemon["rawStats"]
        pokemon["metGame"] = "unbound"  # Assume unbound
        pokemon["checksum"] = PokemonUtil.CalculateChecksum(pokemon)
        return pokemon

    @staticmethod
    def ConvertOldCloudFileToNew(cloudFilePath: str) -> Tuple[bool, str]:
        # try:
            with open(cloudFilePath, "r") as file:
                cloudData = json.load(file)
                cloudData["boxes"] = [PokemonProcessing.ConvertOldDataStructToNew(x) for x in cloudData["boxes"]]
                cloudData["randomizer"] = False
            with open(cloudFilePath, "w") as file:
                file.write(json.dumps(cloudData, indent=4))
            return True, ""
        # except Exception as error:
        #     return False, str(error)
