---
name: save-cloud-workflows
description: 'Implement and debug the user-facing save and Cloud persistence workflow in Unbound Cloud. Use for save upload or download, cloud.dat encryption/decryption, File System Access API handles, fallback file inputs/downloads, account-backed Cloud boxes, randomizer separation, cloud sync-key conflicts, temporary server files, or save-file API errors.'
argument-hint: 'Describe the upload, download, file-handle, or Cloud synchronization issue'
---

# Save and Cloud Workflows

## End-to-End Path

1. `src/MainPage.jsx` reads a `.sav` as bytes or a Cloud `.dat` as text.
2. Save upload calls `POST /api/savefile/read`; local Cloud upload calls `POST /api/cloudfile/decrypt`.
3. `server/server.js` writes save bytes to `temp/` and calls FastAPI `/uploadsave` on port 3005.
4. A successful save response sets game ID, box count, save boxes, titles, randomizer state, original bytes, and a temporary file ID.
5. Account mode also returns Home boxes, titles, and `cloudDataSyncKey`.
6. Saving calls `/api/cloudfile/encrypt` and `/api/savefile/update`, then writes through file handles or browser downloads.

## Owners

- `src/MainPage.jsx`: page state machine and all upload/download orchestration.
- `src/BrowserDB.js`: persisted browser file/directory handles.
- `src/config.js`: backend base URL.
- `server/server.js`: `/api/savefile/*`, `/api/cloudfile/*`, temp-file cleanup, encryption, and Python bridge.
- `server/src/Interface.py`: FastAPI adapter for parsing, rewriting, and old Cloud conversion.
- `server/accounts.js`: account-backed Home data and sync-key lifecycle.

## Two Browser Modes

The modern path uses `showOpenFilePicker`, `showDirectoryPicker`, and `FileSystemFileHandle.createWritable()`. The fallback path uses file inputs and generated downloads. `VITE_USE_ORIGINAL_UPLOAD_DOWNLOAD=true` forces the fallback and is required for browsers without File System Access API support.

Keep both paths equivalent. A change is incomplete if Chrome file handles work but Firefox/Safari fallback does not, or vice versa.

## Change Procedure

1. Identify the failing state transition in `MainPage` before changing API behavior.
2. Keep save files and Cloud files distinct: save files are 128 KiB or flashcart-sized binary data; Cloud files are encrypted JSON.
3. Preserve regular and randomized Home storage separation, including filenames and account fields.
4. In account mode, send `username`, `accountCode`, and the current `cloudDataSyncKey` wherever the existing endpoint requires them.
5. Treat a sync-key rejection as stale-session protection. Do not bypass it to resolve multi-tab failures.
6. Ensure every server branch removes temporary save, JSON, converted Cloud, and rewritten save files.
7. Map HTTP errors back to the correct page state and user-facing condition: invalid file, unsupported/old version, inaccessible save, randomizer mismatch, stale sync key, or server failure.
8. Add tests for both file modes when touching shared orchestration.

## Invariants

- Never overwrite the selected local save before the server has returned a valid rewritten buffer.
- If using a file handle, verify the file has not changed unexpectedly before writing.
- Preserve the original save bytes and `fileIdNumber` from read through update.
- Account Home writes must be serialized by the account layer and guarded by the sync key.
- Local Cloud encryption depends on `ENCRYPTION_KEY`; Pokemon trade checksums depend on `CHECKSUM_KEY`. Do not interchange them.

## Validation

Add `src/tests/SaveCloudWorkflow.test.jsx` with mocked `FileReader`, Axios, file handles, IndexedDB helpers, and downloads. Once it exists:

```powershell
yarn test src/tests/SaveCloudWorkflow.test.jsx --run
yarn test-all
```

Run Python round-trip tests for changes that reach `/api/savefile/update`:

```powershell
Push-Location server; python -m pytest pytests/test_Integrated.py -v; Pop-Location
```

For complete browser behavior, start client and backend, then run account and box Selenium flows. Test at least one file-handle browser and one fallback browser mode.
