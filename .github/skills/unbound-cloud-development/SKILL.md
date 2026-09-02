---
name: unbound-cloud-development
description: 'Develop and troubleshoot Unbound Cloud across its React/Vite client, Express/Socket.IO server, and FastAPI save-file service. Use when setting up the repository, tracing a request across processes, deciding which module owns a change, running the application locally, changing shared behavior, or choosing the correct focused test command.'
argument-hint: 'Describe the cross-stack change or local development problem'
---

# Unbound Cloud Development

Use this skill to orient cross-stack work. Load a feature-specific skill as soon as the owning domain is known.

## Architecture

| Layer | Source of truth | Runtime |
| --- | --- | --- |
| Browser client | `src/`, `public/` | Vite on port 3000 |
| HTTP API and real-time trades | `server/*.js`, `server/endpoints/` | Express and Socket.IO on `PORT`, default 3001 |
| Save parsing and rewriting | `server/src/*.py` | FastAPI on port 3005 |
| Game definitions | `server/src/data/` | Copied into `src/data/` by `DataCopy.py` |
| Account and GTS persistence | `server/accounts.js`, `server/gts.js` | JSON below `%APPDATA%/unboundcloud/` |

The Express server calls FastAPI through `SendRequestToPythonServer()` in `server/server.js`. Browser save-file requests enter through `/api/savefile/*`; account and GTS routes are mounted under `/api/user` and `/api/gts`. Friend and Wonder Trades use Socket.IO handlers registered from `server/sockets.js`.

## Route Work to an Owner

1. Start at the failing component, route, socket event, parser, or test.
2. Follow forwarding code to the nearest function that computes or mutates the behavior.
3. Read that function's focused test before editing.
4. Load the matching feature skill for its invariants and validation sequence.
5. Keep protocol or schema changes synchronized across client, Node, Python, fixtures, and tests.

Common owners:

- Page state and save upload UI: `src/MainPage.jsx`
- Box indexing and movement: `src/BoxView.jsx`, `src/BoxList.jsx`, `src/Util.jsx`
- Pokemon interpretation and legality: `src/PokemonUtil.jsx`, `server/pokemon-util.js`, `server/src/PokemonProcessing.py`
- Account lifecycle: `server/accounts.js`, `server/endpoints/user.js`
- Save-file HTTP bridge: `server/server.js`, `server/src/Interface.py`
- Socket lifecycle: `server/sockets.js`
- Feature trade state: `server/friend-trade.js`, `server/wonder-trade.js`, `server/gts.js`

## Local Setup

Install dependencies from the repository root:

```powershell
yarn install
python -m pip install -r requirements.txt -r test-requirements.txt
yarn --cwd server install
```

Create `server/.env` with the environment needed by the feature under test. Never commit credentials. Common variables are `CHECKSUM_KEY`, `ENCRYPTION_KEY`, `APPDATA`, `ACCOUNT_SYSTEM`, `UNBOUND_EMAIL`, `UNBOUND_EMAIL_PASSWORD`, `WONDER_TRADE_WEBHOOK`, and `PYTHON_SERVER_PORT`.

Run the client and hybrid backend in separate terminals:

```powershell
yarn start
yarn --cwd server start
```

The backend `start` script launches both `node server.js` and `python src/Interface.py`; either process exiting stops both.

## Validation Matrix

Choose the narrowest relevant check first:

```powershell
# One existing or newly added frontend test file
yarn test path/to/Feature.test.jsx --run

# All frontend tests
yarn test-all

# One Node backend test file
yarn --cwd server test-js jstests/module.test.js

# All Node backend tests
yarn --cwd server test-all-js

# One Python backend test file
Push-Location server; python -m pytest pytests/test_Module.py -v; Pop-Location

# All Python backend tests
yarn --cwd server test-py

# Production data synchronization and build
yarn build
```

Use `yarn test-selenium` only for completed browser workflows because it starts a long cross-process suite and expects the application services and browser prerequisites.

## Repository Rules

- Follow `.github/copilot-instructions.md`: four spaces, braces on their own lines, and no braces for single-line `if` statements.
- Add tests for every new component or feature.
- Treat `server/src/data/` as authoritative; do not hand-edit generated counterparts in `src/data/` when `DataCopy.py` owns them.
- Preserve account locks, GTS locks, cloud sync-key checks, Pokemon checksums, save-block checksums, and file signatures when touching their flows.
- Do not conflate the three test stacks: Vitest uses `src/tests/`, Mocha uses `server/jstests/`, and pytest uses `server/pytests/` or `seleniumtests/`.