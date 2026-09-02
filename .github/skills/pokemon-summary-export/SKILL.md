---
name: pokemon-summary-export
description: 'Develop Pokemon detail presentation and export in Unbound Cloud. Use for PokemonSummary fields, stats, IV/EV views, markings, nickname or OT display, moves, held-item and ball icons, warnings, shiny or gender indicators, GTS summary cards, or Pokemon Showdown export formatting.'
argument-hint: 'Describe the summary field or export-format change'
---

# Pokemon Summary and Export

## Owners

- `src/PokemonSummary.jsx`: visual summary and markings.
- `src/ShowdownExport.jsx`: `getMonShowdownText()` and combined export text.
- `src/PokemonUtil.jsx`: canonical interpretation of a Pokemon object.
- `src/Util.jsx`: localized/display names and asset helpers.
- `src/subcomponents/`: shared icons used by summary and GTS views.

## Procedure

1. Determine whether the change is data interpretation or presentation. Put interpretation in `PokemonUtil`, not in JSX.
2. Use existing getters for species, form, level, gender, nature, ability, moves, IVs, EVs, item, ball, friendship, OT, shiny state, and warnings.
3. Preserve the summary's Home-versus-save behavior and compact GTS rendering path.
4. When adding a visual field, define its behavior for eggs, blank/invalid Pokemon, unknown custom species, and unavailable game data.
5. For markings, preserve all six positions and their empty/filled transitions; update the owning Pokemon state through the established callback.
6. For Showdown export, follow Pokemon Showdown syntax exactly and omit default or zero-valued lines consistently with existing output.
7. If an export rule changes because a getter is wrong, fix and test the getter first, then test formatting separately.

## Data-Loss Boundary

Warnings from `MonWillLoseDataInSave()` are user protection, not decoration. Changes to warning conditions belong with Pokemon compatibility logic and need save-game-specific tests. Do not suppress a warning merely to simplify the summary UI.

## Tests

Add focused Vitest coverage under `src/tests/`:

- `PokemonSummary.test.jsx` for conditional fields, stat mode, and marking callbacks.
- `ShowdownExport.test.jsx` for exact multiline output, including edge cases such as eggs, shinies, forms, zero EVs, non-31 IVs, items, abilities, natures, and moves.

After creating the applicable test file, run the narrow test first:

```powershell
yarn test src/tests/ShowdownExport.test.jsx --run
yarn test src/tests/PokemonSummary.test.jsx --run
yarn test-all
```

Use exact string assertions for Showdown output; snapshots alone make whitespace and protocol errors too easy to miss.
