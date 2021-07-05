SpeciesDefines = "D:\\Rom Hacking\\Roms\\Unbound\\Source_Code\\GBA Code\\Complete Fire Red Upgrade\\include\\constants\\species.h"
MovesDefines = "D:\\Rom Hacking\\Roms\\Unbound\\Source_Code\\GBA Code\\Complete Fire Red Upgrade\\include\\constants\\moves.h"
AbilityDefines = "D:\\Rom Hacking\\Roms\\Unbound\\Source_Code\\GBA Code\\Complete Fire Red Upgrade\\include\\constants\\abilities.h"
ItemsDefines = "D:\\Rom Hacking\\Roms\\Unbound\\Source_Code\\GBA Code\\Complete Fire Red Upgrade\\include\\constants\\items.h"
BaseStatsDefines = "src/data/VanillaBaseStats.c"
ExperienceCurveDefines = "server/src/data/ExperienceCurves.json"
CharMapDefines = "src/data/charmap.tbl"

VanillaBoxSaveSections = list(range(5, 13 + 1))
AllBoxSaveSections = VanillaBoxSaveSections + [0, 2, 3, 30, 31]  # Vanilla memory + expanded box blocks
SaveSize = 0xE000
BlockSize = 0x1000
BlockDataSize = 0xFF0
BlockIdOffset = 0xFF4
ChecksumOffset = 0xFF6
SaveIndexOffset = 0xFFC
BoxNamesSaveBlock = 13
BoxNamesOffset = 0x361
BoxNamesEndOffset = 0x442
BoxNameLength = 9
VanillaMemoryBoxCount = 19
BoxCount = 25
MonsPerBox = 30
MaxLevel = 100

StartingMemoryOffsets = {
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

CompressedPokemon = {
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

CompressedPokemonSize = 58

PokemonData = dict.fromkeys(CompressedPokemon.keys(), None)
