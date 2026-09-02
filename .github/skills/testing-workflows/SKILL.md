---
name: testing-workflows
description: 'Choose, write, and run the correct Unbound Cloud test suite. Use for test planning, regression tests, Vitest or React Testing Library, Mocha/Chai/Supertest, pytest, coverage, test isolation, mocks, flaky tests, focused validation commands, or deciding which tests a cross-stack change requires.'
argument-hint: 'Describe the changed behavior or failing test'
---

# Testing Workflows

## Select the Suite

| Changed behavior | Test location | Runner |
| --- | --- | --- |
| React components and browser utilities | `src/tests/*.test.jsx` | Vitest + Testing Library + jsdom |
| Node API, accounts, trades, sockets, persistence | `server/jstests/*.test.js` | Mocha + Chai + Supertest + nyc |
| Python save parsing and conversion | `server/pytests/test_*.py` | pytest + pytest-cov |
| Full browser workflows | `seleniumtests/test_*.py` | pytest + Selenium |

The root `jstests/` directory contains legacy Jest-style save tests but has no active root package script. Do not cite or run it as the primary validation suite unless the task explicitly restores that suite.

## Test-First Routing

1. Start with the narrowest existing test that exercises the owner function.
2. Reproduce the failure before changing production code when feasible.
3. Add a regression case at the lowest layer that can prove the behavior.
4. Add a higher-level test only when integration boundaries are part of the risk.
5. Run the focused test immediately after the first edit, then broaden based on blast radius.

## Frontend

`vite.config.js` configures jsdom, globals, and `src/tests/setupTests.js`. The setup imports jest-dom and mocks Dark Reader.

```powershell
# One existing or newly added file, non-watch mode
yarn test path/to/Feature.test.jsx --run

# All configured frontend tests
yarn test-all
```

Use Testing Library queries by role/name where practical, `user-event` for interactions, and `waitFor` only for real asynchronous state. Restore mocked globals, timers, storage, Axios, file handles, Audio, Notification, and sockets after each test.

New frontend test files must be directly under `src/tests/` with a `.test.jsx` suffix to be included by `yarn test-all`.

## Node Backend

```powershell
# One file
yarn --cwd server test-js jstests/accounts.test.js

# Entire active Node suite
yarn --cwd server test-all-js
```

Reuse `server/jstests/data.js` fixtures and `test-util.js` cleanup. Account/GTS tests touch file-backed state, so isolate `%APPDATA%/unboundcloud` and release mutexes even after failures. Restore module rewiring and require-cache changes between tests. Use Supertest for route contracts and direct unit tests for owning logic.

## Python Backend

`server/pytest.ini` adds `server/src` to `pythonpath`.

```powershell
Push-Location server
python -m pytest pytests/test_Saveblocks.py -v
yarn test-py
Pop-Location
```

Use real save fixtures for parser/writer compatibility. A format change requires a decode-encode-reload round trip, not only mocked bytes.

## Validation Scope

- Pure helper change: focused unit test, then its suite.
- Shared Pokemon schema/checksum: frontend, Node utility/trade, and Python conversion suites.
- API payload: route test plus client test.
- Socket event/state: feature test plus `sockets.test.js` and a two-client smoke test.
- Save layout or game data: focused Python tests, all Python tests, `DataCopy.py`, and build.
- User workflow spanning processes: lower-level suites first, Selenium last.

Do not repair unrelated failing tests. Record them separately with their command and failure.
