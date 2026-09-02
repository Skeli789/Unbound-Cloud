---
name: pokemon-data-integrity
description: 'Maintain the canonical Pokemon object and its legality across browser, Node, and Python code. Use for Pokemon fields or getters, checksum mismatches, JSON serialization, species/forms, moves, items, abilities, stats, levels, friendship, nicknames, OT names, banned items, trade evolutions, randomizer compatibility, or save data-loss rules.'
argument-hint: 'Describe the Pokemon field, legality rule, or checksum problem'
---

# Pokemon Data Integrity

## Implementations

- `src/PokemonUtil.jsx`: browser display, movement compatibility, game-specific lookups, levels, forms, legality, and data-loss warnings.
- `server/pokemon-util.js`: trusted trade validation, checksums, sanitization, friendship, and trade evolution updates.
- `server/util.js`: Python-compatible JSON serialization, text validation, and Cloud slot helpers.
- `server/trade-util.js`: sync-key, identity, and randomizer trade guards.
- `server/src/PokemonProcessing.py`: binary-to-Cloud object conversion and save encoding.
- `server/src/PokemonUtil.py`: Python-side Pokemon helpers.
- `server/src/data/` and generated `src/data/`: definition tables.

## Trust Boundaries

- Browser validation is user experience, not authority.
- The Node server validates traded Pokemon by recomputing `checksum` with `CHECKSUM_KEY`.
- `CalculateMonChecksum()` intentionally excludes `markings`, an existing `checksum`, and `wonderTradeTimestamp`.
- Hash input uses `PythonJSONStringify()` so Node serialization matches Python field ordering/format. Changing it can invalidate every existing checksum.
- Save encoding is authoritative for what a target game can represent; `MonWillLoseDataInSave()` must agree with that boundary.

## Change Procedure

1. Define the field's type, empty/default value, valid range, and whether it participates in checksums.
2. Trace the field through Python decode, API JSON, browser getters and mutations, Node validation, trade mutation, and Python encode.
3. Keep game-specific interpretation behind a `gameId` or loaded `Defines` context.
4. Recalculate the checksum after every trusted server-side mutation.
5. Validate species, moves, items, forms, and abilities against the correct game's data, not a global superset.
6. Preserve egg and blank-Pokemon behavior in every getter.
7. For trade evolutions, test held-item consumption, paired-species requirements, nickname updates, friendship reset, and the final checksum.
8. For nickname/OT sanitization, test lengths, unsupported characters, profanity replacement, and checksum renewal.

## High-Risk Changes

Treat these as migrations requiring broad tests:

- Adding, removing, renaming, or reordering serialized fields.
- Changing `PythonJSONStringify()` or checksum exclusions.
- Changing battle-only form normalization.
- Changing experience curves or game ID mapping.
- Changing banned Cloud items or save compatibility rules.

## Validation

Run Node utility tests:

```powershell
yarn --cwd server test-js jstests/pokemon-util.test.js
yarn --cwd server test-js jstests/util.test.js
yarn --cwd server test-js jstests/trade-util.test.js
```

Run Python conversion tests when the object or binary mapping changes:

```powershell
Push-Location server; python -m pytest pytests/test_PokemonProcessing.py pytests/test_PokemonUtil.py pytests/test_Integrated.py -v; Pop-Location
```

Add frontend Vitest coverage for changed browser getters or warnings, then run `yarn test-all`. Use identical known Pokemon fixtures across layers when testing checksum compatibility.