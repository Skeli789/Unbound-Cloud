from Defines import Defines
from PokemonUtil import PokemonUtil, NumStats
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
    "SPECIES_CRAMORANT_GULPING": "SPECIES_CRAMORANT",
    "SPECIES_CRAMORANT_GORGING": "SPECIES_CRAMORANT",
    "SPECIES_EISCUE_NOICE": "SPECIES_EISCUE",
    "SPECIES_ZACIAN_CROWNED": "SPECIES_ZACIAN",
    "SPECIES_ZAMAZENTA_CROWNED": "SPECIES_ZAMAZENTA",
    "SPECIES_ETERNATUS_ETERNAMAX": "SPECIES_ETERNATUS",
}

SANITY_IS_BAD_EGG = 1


class PokemonProcessing:
    @staticmethod
    def LoadCFRUCompressedMonAtBoxOffset(allBoxes: [int], monOffset: int) -> {}:
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
    def AssignConstantsToCFRUData(pokemonData: {}):
        # Fix Move Names
        moves = []
        compressedMoves = pokemonData["moves"]

        for i in range(4):  # All four moves
            move = compressedMoves & 0x3FF  # 10 Bits
            if move in Defines.moves:
                move = Defines.moves[move]
                moves.append(move)
            compressedMoves >>= 10  # Shift 10 bits down

        if len(moves) == 0:  # Didn't know any valid moves
            moves = ["MOVE_POUND"] + ["MOVE_NONE"] * 3  # Give new moveset

        pokemonData["moves"] = moves

        # Fix Species Names
        if pokemonData["species"] in Defines.species:
            pokemonData["species"] = Defines.species[pokemonData["species"]]

            # Fix species that shouldn't exist
            if pokemonData["species"] in BASE_FORMS_OF_BANNED_SPECIES:
                pokemonData["species"] = BASE_FORMS_OF_BANNED_SPECIES[pokemonData["species"]]
            elif pokemonData["species"].endswith("_MEGA") \
                    or pokemonData["species"].endswith("_MEGA_X") \
                    or pokemonData["species"].endswith("_MEGA_Y"):
                pokemonData["species"] = pokemonData["species"].split("_MEGA")[0]
            elif pokemonData["species"].endswith("_PRIMAL"):
                pokemonData["species"] = pokemonData["species"].split("_PRIMAL")[0]
            elif pokemonData["species"].endswith("_GIGA"):
                pokemonData["species"] = pokemonData["species"].split("_GIGA")[0]
            elif pokemonData["species"].startswith("SPECIES_UNOWN"):
                pokemonData["species"] = "SPECIES_UNOWN"
        else:
            pokemonData["species"] = "SPECIES_NONE"  # Wipe the species - prevent garbage species

        # Fix Item Names
        if pokemonData["item"] in Defines.items:
            pokemonData["item"] = Defines.items[pokemonData["item"]]
        else:
            pokemonData["item"] = "ITEM_NONE"  # Item not defined then bye-bye item

        # Fix Ball Name
        if pokemonData["pokeBall"] in Defines.ballTypes:
            pokemonData["pokeBall"] = Defines.ballTypes[pokemonData["pokeBall"]]
        else:
            pokemonData["pokeBall"] = "BALL_TYPE_POKE_BALL"  # Ball not defined then set default ball

        # Fix IVs
        ivs = []
        compressedIVs = pokemonData["ivs"]
        for i in range(6):  # 6 Stats
            iv = compressedIVs & 0x1F  # 5 bits
            ivs.append(iv)
            compressedIVs >>= 5  # Shift 5 bits down
        pokemonData["ivs"] = ivs
        pokemonData["isEgg"] = compressedIVs & 1
        compressedIVs >>= 1  # Shift 1 bit down
        pokemonData["hiddenAbility"] = compressedIVs & 1

        # Fix Egg Nicknames
        if pokemonData["isEgg"] != 0:
            pokemonData["nickname"] = ""

        # Fix Gigantamax
        pokemonData["gigantamax"] = (pokemonData["metInfo"] & 0x800) != 0

        # Set Shiny
        pokemonData["shiny"] = PokemonUtil.IsShiny(pokemonData)

        if pokemonData["species"] in Defines.baseStats:
            # Assign Ability
            pokemonData["ability"] = PokemonUtil.GetAbility(pokemonData)

            # Assign Gender
            pokemonData["gender"] = PokemonUtil.GetGender(pokemonData)

            # Assign Level
            pokemonData["level"] = PokemonUtil.CalculateLevel(pokemonData)

            # Assign Nature
            pokemonData["nature"] = PokemonUtil.GetNature(pokemonData)

            # Assign Raw Stats
            PokemonUtil.UpdateStats(pokemonData)
        else:
            pokemonData["ability"] = "ABILITY_NONE"
            pokemonData["gender"] = "U"  # Unknown
            pokemonData["level"] = 1
            pokemonData["nature"] = 0
            pokemonData["rawStats"] = [0] * NumStats

        # Wipe Bad Eggs
        if pokemonData["sanity"] & SANITY_IS_BAD_EGG:
            pokemonData["species"] = "SPECIES_NONE"


    ### Code for updating save files ###
    @staticmethod
    def GetAllCFRUCompressedMons(allPokemonData: [{}]) -> [int]:
        allCompressedMons = []
        for pokemonData in allPokemonData:
            allCompressedMons += PokemonProcessing.ConvertPokemonToCFRUCompressedMon(pokemonData)
        return allCompressedMons

    @staticmethod
    def ConvertPokemonToCFRUCompressedMon(pokemonData: {}) -> [int]:
        species = pokemonData["species"]
        finalData = [0] * CFRUCompressedPokemonSize
        if species == 0 or species == "SPECIES_NONE":
            return finalData  # No point in wasting time

        # Fix Ability if changing between games
        if "ability" in pokemonData and species in Defines.baseStats:
            properAbility = PokemonUtil.GetAbility(pokemonData)
            currAbility = pokemonData["ability"]
            if properAbility != currAbility:  # Came from game with different Ability
                # print(pokemonData["nickname"] + "'s Ability doesn't match.")
                # Try to match Ability to correct one
                if currAbility == Defines.baseStats[species]["hiddenAbility"] \
                        or PokemonUtil.IsCloneAbility(currAbility, Defines.baseStats[species]["hiddenAbility"]):
                    PokemonUtil.ChangeAbility(pokemonData, 2)  # Hidden Ability
                elif currAbility == Defines.baseStats[species]["ability1"] \
                        or PokemonUtil.IsCloneAbility(currAbility, Defines.baseStats[species]["ability1"]):
                    PokemonUtil.ChangeAbility(pokemonData, 0)  # Ability 1
                elif currAbility == Defines.baseStats[species]["ability2"] \
                        or PokemonUtil.IsCloneAbility(currAbility, Defines.baseStats[species]["ability2"]):
                    PokemonUtil.ChangeAbility(pokemonData, 1)  # Ability 2

        # Dissect the actual data
        for key in pokemonData:
            reverse = True  # Data is stored in little endian

            if key == "species":
                if species in Defines.reverseSpecies:
                    finalSpecies = Defines.reverseSpecies[species]
                else:
                    finalSpecies = 0
                data = finalSpecies
                offset = CFRUCompressedPokemon[key][0]
            elif key == "moves":
                moves = 0
                if pokemonData["moves"] is not None:
                    for i, move in enumerate(pokemonData["moves"]):
                        if move in Defines.reverseMoves:
                            move = Defines.reverseMoves[move]
                        moves |= (move << (10 * i))
                data = moves
                offset = CFRUCompressedPokemon[key][0]
            elif key == "ivs":
                ivs = 0
                if pokemonData["ivs"] is not None:
                    for i, iv in enumerate(pokemonData["ivs"]):
                        ivs |= (iv << (5 * i))
                data = ivs
                offset = CFRUCompressedPokemon[key][0]
            elif key == "isEgg":
                if pokemonData["isEgg"] != 0:
                    finalData[57] |= 0x40
                continue
            elif key == "hiddenAbility":
                if pokemonData["hiddenAbility"] != 0:
                    finalData[57] |= 0x80
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
                data = pokemonData["pokeBall"]
                if data in Defines.reverseBallTypes:
                    data = Defines.reverseBallTypes[data]
                else:
                    data = Defines.reverseBallTypes["BALL_TYPE_POKE_BALL"]
                offset = CFRUCompressedPokemon[key][0]
            elif key == "gigantamax":
                if pokemonData["gigantamax"]:
                    finalData[53] |= 0x8
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
    def UpdatePokedexFlags(seenFlags: [int], caughtFlags: [int], allPokemonData: [{}]) -> [[int], [int]]:
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
