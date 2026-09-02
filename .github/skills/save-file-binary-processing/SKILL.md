---
name: save-file-binary-processing
description: 'Modify and verify the Python Pokemon save-file parser and writer. Use for SaveBlocks, SaveBlockProcessing, PokemonProcessing, binary offsets, file signatures, dual save slots, block IDs, checksums, CFRU compressed Pokemon, box titles, Pokedex flags, trainer data, randomizer flags, accessibility conditions, or load-rewrite round trips.'
argument-hint: 'Describe the save format, parser, checksum, or rewrite change'
---

# Save-File Binary Processing

## Owners

- `server/src/SaveBlocks.py`: file validation, active-slot selection, block extraction, replacement, and block checksums.
- `server/src/SaveBlockProcessing.py`: box memory, titles, flags, vars, Pokedex flags, trainer data, randomizer/access checks, and writes across blocks.
- `server/src/PokemonProcessing.py`: CFRU compressed Pokemon decoding/encoding and Cloud representation conversion.
- `server/src/Defines.py`: signature-to-layout/game metadata and loaded definition tables.
- `server/src/Interface.py`: `/uploadsave` and `/updatesave` orchestration.
- `server/pytests/`: authoritative parser and round-trip tests with real save fixtures.

## Binary Layout Invariants

- Accepted files are `0x20000` bytes or `0x20010` bytes for flashcart padding.
- Each paired save slot spans `0xE000`; blocks are `0x1000` bytes with `0xFF0` bytes of data.
- Metadata offsets are defined in `SaveBlocks.py`: block ID `0xFF4`, checksum `0xFF6`, file signature `0xFF8`, save index `0xFFC`.
- The active slot is selected by save index, with explicit handling for an empty slot.
- Every block in a slot must share its signature and save index, have a valid unique block ID, and pass checksum validation.
- Expanded box blocks 30 and 31 are handled separately from the paired 0-13 slot blocks.
- Box-memory placement changes at 20, 23, and 25 boxes. Use `Defines.BoxCount()` and `StartingBoxMemoryOffsets`.

## Parser Change Procedure

1. Add or identify a real fixture that demonstrates the format difference.
2. Load definitions from the file signature before interpreting game-specific bytes.
3. Make the smallest change at the lowest correct layer: block mechanics, save-memory layout, or Pokemon struct encoding.
4. Preserve a decode-encode round trip for unchanged data.
5. When writing Pokemon, update Pokedex flags through the existing processing functions.
6. Let `SaveBlocks.ReplaceOne()` recalculate checksums; do not patch checksum bytes independently.
7. Reload the generated save and compare Pokemon, titles where relevant, and seen/caught flags.
8. Cover corrupt, empty-slot, mismatched-signature, flashcart, randomizer, and expanded-box cases affected by the change.

## Safety Rules

- Work on a copied fixture; never rewrite the only user save.
- Do not guess offsets from neighboring versions.
- A new data layout requires a new file signature and game registration.
- Preserve unknown bytes by copying existing blocks and replacing only owned ranges.
- Keep battle-only form normalization and unofficial-species handling explicit; silent conversion can cause data loss.
- Do not edit generated Transcrypt output in `server/src/__target__/`.

## Focused Validation

From `server/`:

```powershell
python -m pytest pytests/test_Saveblocks.py -v
python -m pytest pytests/test_SaveBlockProcessing.py -v
python -m pytest pytests/test_PokemonProcessing.py -v
python -m pytest pytests/test_Integrated.py -v
```

Run the narrowest file first, then the complete Python suite:

```powershell
yarn test-py
```

For a new format fixture, add load and replace coverage to `server/pytests/test_Integrated.py`; a load-only test does not prove the writer is safe.
