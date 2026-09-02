---
name: selenium-e2e
description: 'Run, extend, and debug Unbound Cloud Selenium end-to-end tests. Use for cross-browser UI workflows, Chrome/Firefox/Edge/Safari differences, file upload or File System Access fallback behavior, account-system browser tests, box drag and drop, pytest incremental classes, HTML reports, screenshots, recordings, or CI-only E2E failures.'
argument-hint: 'Name the browser, workflow, or failing Selenium test'
---

# Selenium End-to-End Testing

## Owners

- `seleniumtests/test_AccountSystem.py`, `test_BoxList.py`, and `test_BoxView.py`: active test flows.
- `seleniumtests/*Util.py` and `seleniumtests/TestUtils.py`: shared page interactions and assertions.
- `seleniumtests/conftest.py`: incremental-test behavior.
- `test-requirements.txt`: Selenium and pytest plugins.
- `.github/workflows/end_to_end_tests.yml`: browser/OS matrix, services, video, reports, and artifacts.

## Prerequisites

Install both JavaScript applications and Python test dependencies. Configure `server/.env` for account-backed flows, then start the Vite client and hybrid backend in separate terminals:

```powershell
yarn start
yarn --cwd server start
```

Set browser mode before starting Vite because `VITE_USE_ORIGINAL_UPLOAD_DOWNLOAD` is a build-time environment variable:

```powershell
$env:BROWSER = 'chrome'
$env:VITE_USE_ORIGINAL_UPLOAD_DOWNLOAD = 'false'
```

Use `true` for Firefox/Safari fallback-file tests. Ensure the selected browser and compatible WebDriver are installed.

## Run Tests

```powershell
# One workflow file
python -m pytest seleniumtests/test_BoxView.py -v

# One test
python -m pytest seleniumtests/test_BoxView.py::TestClass::test_name -v -s

# Repository script with HTML report and timeout
yarn test-selenium
```

Use the actual class and test names from the file; the placeholder node ID above illustrates pytest syntax.

## Incremental Classes

Classes marked `@pytest.mark.incremental` are ordered workflows. After one test fails, later tests in that class are reported as expected failures because their preconditions are no longer trustworthy. Debug the first real failure, not the downstream xfails.

## Writing E2E Coverage

1. Put reusable interactions in the nearest existing utility module.
2. Wait for a specific state or element instead of adding unconditional sleeps.
3. Keep selectors stable and user-observable; add a test ID only when no semantic selector is reliable.
4. Make test data and account state deterministic and isolated.
5. Capture a screenshot at the point of failure without hiding the original exception.
6. Cover both file-handle and fallback modes for upload/download changes.
7. Clean up accounts, file handles, downloads, dialogs, windows, and browser sessions.

## CI Parity

CI runs Chrome, Firefox, and Edge on Ubuntu plus Safari on macOS. It uses Python 3.13, Node 22, `xvfb` on Linux, a 10-minute Selenium step, and a 15-minute job limit. Reports, recordings, and `debug_screenshots_<browser>` are uploaded even on failure.

When local and CI results differ, compare browser mode, environment variables, viewport/display, timing, filesystem permissions, and File System Access support before changing assertions.
