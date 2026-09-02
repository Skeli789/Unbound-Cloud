---
name: pokemon-search-filters
description: 'Implement and test Pokemon box search in Unbound Cloud. Use when adding or changing species, move, ability, item, nature, ball, type, level, gender, shiny, Pokerus, egg, or save-warning filters; changing tri-state controls; fixing search matching; or changing filter dropdowns and adornments.'
argument-hint: 'Describe the search criterion or matching bug'
---

# Pokemon Search Filters

## Owners

- `src/Search.jsx`: form state, criteria normalization, tri-state controls, and exported `MatchesSearchCriteria()`.
- `src/BoxView.jsx` and `src/BoxList.jsx`: apply criteria to box cells and box-level results.
- `src/Util.jsx`: option builders and display-name conversion.
- `src/PokemonUtil.jsx`: canonical getters used by matching.
- `src/subcomponents/FilterAutocomplete.jsx`: reusable single/multi autocomplete behavior.
- `src/subcomponents/InputAdornments.jsx`: filter field icons.

## Criteria Contract

`Search.updateSearchCriteria()` converts UI arrays to lookup objects for constant-time membership tests. Preserve these keys unless all consumers migrate together:

`species`, `move`, `ability`, `item`, `nature`, `ballType`, `type`, `levelStart`, `levelEnd`, `gender`, `shiny`, `pokerus`, and `warning`.

- Empty criteria become `null`.
- Gender values are `M`, `F`, and `U`; UI state indexes are male, female, unknown.
- Shiny, Pokerus, and warning controls use `either`, `only`, and `exclude`, but normalized criteria store booleans or omit the key.
- The save-warning filter appears only for save boxes and delegates to `MonWillLoseDataInSave()`.
- Eggs may match species-as-Egg, then fail criteria that are not applicable to eggs.

## Add or Change a Filter

1. Add the UI state with an unambiguous empty value.
2. Reuse an existing option builder or add one beside related builders in `src/Util.jsx`.
3. Add the field through `FilterAutocomplete` or `MultiFilterAutocomplete` and use an existing adornment pattern.
4. Normalize the UI value in `updateSearchCriteria()`. Do not make `MatchesSearchCriteria()` understand component-specific state.
5. Add matching logic to `MatchesSearchCriteria()` using canonical getters from `src/PokemonUtil.jsx`.
6. Decide explicitly how the criterion behaves for eggs, blank slots, missing base stats, alternate visible natures, and different game IDs.
7. Verify both `BoxView` and `BoxList` consumers if return semantics change.

## Focused Tests

Test `MatchesSearchCriteria()` as a table of positive, negative, omitted, and boundary cases. At minimum cover:

- One and multiple selected values.
- Minimum and maximum level boundaries.
- `only` and `exclude` normalization.
- Eggs and missing game data.
- Save-only warning behavior.
- A form submission producing the expected normalized object.

Create or update `src/tests/Search.test.jsx`, then run these commands once the file exists:

```powershell
yarn test src/tests/Search.test.jsx --run
yarn test-all
```

Avoid a Selenium test for pure matching logic. Use browser coverage only when the MUI control interaction itself is the bug.
