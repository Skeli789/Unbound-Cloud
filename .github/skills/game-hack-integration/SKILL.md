---
name: game-hack-integration
description: 'Add or update a supported CFRU ROM hack and synchronize game definitions. Use for new hacks or game versions, file signatures, GameDetails, old-version handling, species/move/item/ball/base-stat JSON, custom names and sprites, supported-hack lists, DataCopy.py, save fixtures, or definition validation failures.'
argument-hint: 'Name the hack/version or game-data update'
---

# Game Hack Integration

The detailed product requirements live under **Adding Your Hack** and **Updating Your Hack** in `README.md`. Use this skill to execute them against the current code.

## Sources of Truth

- `server/src/Defines.py`: signatures, game versions, regions, flags/vars, `GameDetails`, `CustomHackVersions`, and `OldVersionFileSignatures`.
- `server/src/data/<definesDir>/`: authoritative numeric game definitions.
- `DataCopy.py`: transforms game-specific server data into client lookup sets and validates names, abilities, and types.
- `src/PokemonUtil.jsx`: imports generated game data and maps game IDs in `GAME_IDS_TO_DATA` and `GAME_DISPLAY_NAMES`.
- `src/MainPage.jsx`: user-visible supported-hack list.
- `server/pytests/data/saves/` and `server/pytests/test_Integrated.py`: real compatibility proof.

## Required Game Data

Create `server/src/data/<definesDir>/` using a nearby supported game as the schema reference:

- `Species.json`: numeric-string ID to species define.
- `Moves.json`: numeric-string ID to move define.
- `Items.json`: numeric-string ID to item define.
- `BallTypes.json`: ordered ball-define array.
- `BaseStats.json`: species-keyed stats, abilities, and types.
- `UnofficialSpecies.json`: unofficial IDs, or an empty object when none exist.

Exclude unsupported or battle-only content as documented in `README.md`. Do not infer numeric IDs from another hack.

## Integration Procedure

1. Assign a unique four-byte signature. For changes to deployed species, moves, items, or stats, preserve the old signature in `OldVersionFileSignatures` and issue a new one.
2. Add game version/region constants only when semantically needed.
3. Register `GameDetails` with the correct `name`, `definesDir`, version mapping, CFRU flag, shiny odds, box count, randomizer flags, accessibility conditions, and Pokedex format.
4. Add all required server definition files. Header conversion through the helper code in `Defines.py` is only a starting point; manually remove irrelevant defines.
5. Add custom display metadata to the client-owned shared files such as `AbilityNames.json`, `BallTypeNames.json`, `ItemNames.json`, `MoveData.json`, and `MoveNames.json`.
6. Add required transparent sprites at the dimensions documented in `README.md`.
7. Run `python DataCopy.py`. Treat `src/data/<definesDir>/` game-specific outputs as generated.
8. Import the generated files in `src/PokemonUtil.jsx`, update `GAME_IDS_TO_DATA` and display names, and update the supported-hack text in `src/MainPage.jsx`.
9. Add a representative `.sav` fixture and load, replace, and cross-game transfer tests.
10. Test an actual upload and rewrite through the running application.

## DataCopy Contract

`DataCopy.py` copies `BaseStats.json`, converts numeric maps/arrays into client-side define lookup objects for species, moves, items, and balls, reverses Dex numbers, generates `UnboundShinies.json`, copies selected shared data, and validates references.

Success must include both lines:

```text
Data copied successfully!
Data validated successfully!
```

If validation fails, fix the authoritative define or shared name entry. Do not edit the generated game-specific client file to hide the mismatch.

## Validation

```powershell
python DataCopy.py
Push-Location server; python -m pytest pytests/test_Defines.py -v; Pop-Location
Push-Location server; python -m pytest pytests/test_Integrated.py -v; Pop-Location
yarn test-all
yarn build
```

Before release, verify regular and randomized detection, accessibility gates, all box counts, custom assets, old-signature messaging, and load-rewrite equality.
