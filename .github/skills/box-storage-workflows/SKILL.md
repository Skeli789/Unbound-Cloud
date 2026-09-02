---
name: box-storage-workflows
description: 'Implement and debug Unbound Cloud storage boxes and Pokemon movement. Use for BoxView or BoxList changes, box navigation, title editing, box filtering or reordering, drag and drop, multi-select moves, swaps between Home and save boxes, mass release, duplicate checks, or Living Dex sorting.'
argument-hint: 'Describe the box, movement, release, or sorting behavior'
---

# Box Storage Workflows

## Owners

- `src/BoxView.jsx`: one box grid, selection, navigation, and display. It defines `HIGHEST_HOME_BOX_NUM`, `MONS_PER_BOX`, `MONS_PER_ROW`, and `MONS_PER_COL`.
- `src/BoxList.jsx`: all-box view, title filtering, box multi-selection, and `@dnd-kit` reordering.
- `src/MainPage.jsx`: authoritative Home/save arrays and cross-box mutation, including `swapBoxedPokemon()`, `swapDifferentBoxSlotPokemon()`, `swapDraggingBoxPokemon()`, `releaseSelectedPokemon()`, and `fixLivingDex()`.
- `src/Util.jsx`: conversions between flat offsets, box numbers, positions, rows, and columns.
- `src/PokemonUtil.jsx`: movement restrictions, duplicate detection, and save-data-loss checks.
- `seleniumtests/test_BoxView.py` and `seleniumtests/test_BoxList.py`: interaction coverage.

## Data Model

- A box has 30 slots in a 6-by-5 grid.
- Pokemon collections are flat arrays. Use the helpers in `src/Util.jsx`; do not duplicate offset arithmetic.
- Box numbers and positions cross both zero-based and one-based UI boundaries. Confirm the convention at every call site.
- `BoxList` distinguishes a display `spot` from the persistent box ID through `spotToBoxId()` and `findSpotOfBoxId()`.
- Home storage supports 100 boxes; a loaded save uses the game-specific count returned by the parser.

## Change Procedure

1. Identify whether the behavior is display-only (`BoxView`), list/reordering (`BoxList`), or authoritative mutation (`MainPage`).
2. For movement, trace both source and destination through box slot, box type, flat offset, and local position.
3. Reuse `trySetErrorForFailedMovement()` and Pokemon utility checks before mutating arrays. A UI-only guard is insufficient.
4. Copy arrays before React state updates where the nearby code does so. Keep Home and save arrays distinct.
5. For box reordering, update the spot-to-ID mapping and Pokemon groups together; each group contains exactly `MONS_PER_BOX` entries.
6. For mass release, preserve protected/trading Pokemon checks and clear the corresponding selection state.
7. For Living Dex changes, test duplicates, shinies, blank slots, insufficient capacity, and stable placement of unrelated Pokemon.
8. Add or update a focused test. Use Selenium only when pointer, keyboard sensor, or whole-page state transitions are essential.

## Invariants

- Never lose or duplicate a nonblank Pokemon during a swap, reorder, or sort.
- Do not move a Pokemon currently reserved by a trade.
- Run legality and destination-loss checks in both movement directions when swapping.
- A box title and its Pokemon group must remain attached to the same box ID after reorder.
- Search highlighting and selections must be cleared or remapped when positions change.
- Keep mouse and keyboard drag behavior functional; `BoxList` configures both pointer and keyboard sensors.

## Validation

Create `src/tests/BoxStorage.test.jsx` when adding this coverage. Once it exists, run:

```powershell
yarn test src/tests/BoxStorage.test.jsx --run
```

Run all frontend tests after shared offset or state changes:

```powershell
yarn test-all
```

For drag/drop, release, navigation, or persistence, start both application processes and run the relevant Selenium file:

```powershell
python -m pytest seleniumtests/test_BoxView.py -v
python -m pytest seleniumtests/test_BoxList.py -v
```
