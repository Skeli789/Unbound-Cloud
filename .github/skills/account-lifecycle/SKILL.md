---
name: account-lifecycle
description: 'Implement and debug Unbound Cloud accounts and authentication. Use for signup, login by username or email, activation codes, resend cooldowns, password reset, credential validation, remember-me state, account JSON persistence, email mapping, account locks, account codes, regular/randomizer Cloud data, or cloudDataSyncKey creation and validation.'
argument-hint: 'Describe the account, authentication, email, or sync-key change'
---

# Account Lifecycle

## Owners

- `src/Login.jsx`, `src/SignUp.jsx`, `src/ActivateAccount.jsx`, and `src/ForgotPassword.jsx`: account UI state machines.
- `src/FormUtil.jsx`: shared client validation and form submission/error mapping.
- `src/subcomponents/UsernameField.jsx`, `EmailField.jsx`, and `PasswordField.jsx`: reusable fields.
- `server/endpoints/user.js`: `/api/user/*` HTTP contract.
- `server/endpoints/endpoint-util.js`: authenticated account and sync-key checks.
- `server/accounts.js`: account persistence, password hashing, codes, cooldowns, locks, and Cloud data.
- `server/messages.js` and `server/email-template.html`: activation, reset, and account-adjacent email delivery.
- `server/jstests/accounts.test.js`, `user.test.js`, and `messages.test.js`: backend coverage.
- `seleniumtests/test_AccountSystem.py`: browser lifecycle coverage.

## HTTP Contract

The active user routes include:

- `POST /api/user/new`
- `POST /api/user/login`
- `POST /api/user/activate`
- `POST /api/user/sendActivationCode`
- `POST /api/user/sendPasswordResetCode`
- `POST /api/user/resetPassword`
- `GET /api/user/getAccountCloudData`
- `PUT /api/user/saveAccountCloudData`
- `GET /api/user/validateCloudDataSyncKey`

Keep route payloads, response fields, status codes, and stable `errorMsg` identifiers synchronized with the UI.

## Identity and Session Rules

- Account files are JSON under `%APPDATA%/unboundcloud/accounts/`; usernames map to lowercase filenames.
- Email-to-username state is a separate shared table with its own lock.
- Passwords are hashed in `accounts.js`; never return or log plaintext credentials.
- `accountCode` identifies an account for existing flows but is not the stale-session guard.
- `cloudDataSyncKey` protects Cloud mutations and is separate for regular and randomized data.
- Opening/reloading Cloud data can issue a key; a newer session can invalidate an older tab.
- Account mutations must use existing mutex helpers and release locks on every success and error path.

## Change Procedure

1. Start with the route or UI state that owns the behavior.
2. Keep `ValidateUsername`, `ValidateEmail`, and `ValidatePassword` aligned with server validation in `server/util.js`. Check input `MAX_LENGTHS` as well as semantic validators.
3. Preserve login by either username or email.
4. For activation or reset changes, update code generation, expiry, resend cooldown, UI timers, endpoint errors, and email text together.
5. Escape all dynamic HTML inserted into email templates. Mock Nodemailer in tests; never send live email from unit tests.
6. For Cloud account changes, test both regular and randomizer fields and both valid and stale sync keys.
7. For persistence changes, test missing/corrupt files, case normalization, concurrent access, and cleanup.

## Environment

Local account/email behavior can require `APPDATA`, `ACCOUNT_SYSTEM`, `UNBOUND_EMAIL`, `UNBOUND_EMAIL_PASSWORD`, `ENCRYPTION_KEY`, and `CHECKSUM_KEY` in `server/.env`. Do not commit that file or expose secrets in diagnostics.

## Validation

Add `src/tests/AccountLifecycle.test.jsx` for changed client behavior. Run that command only after the test file exists.

```powershell
yarn --cwd server test-js jstests/accounts.test.js
yarn --cwd server test-js jstests/user.test.js
yarn --cwd server test-js jstests/messages.test.js
yarn test src/tests/AccountLifecycle.test.jsx --run
```

After focused tests, run `yarn --cwd server test-all-js` and `yarn test-all`. For a complete signup/login/activation/reset or Cloud-session change, start both services and run:

```powershell
python -m pytest seleniumtests/test_AccountSystem.py -v
```
