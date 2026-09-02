---
name: global-trade-station
description: 'Develop and debug the Unbound Cloud Global Trade Station. Use for GTS landing/recent lists, stats, deposits, wanted species/type criteria, search and reverse search, offers, matching, withdrawal, matched-Pokemon recovery, history, email opt-in, GTS API payloads, deposit persistence, or dummy development data.'
argument-hint: 'Describe the GTS page, route, matching rule, or deposit lifecycle issue'
---

# Global Trade Station

## Owners

- `src/GlobalTradeStation.jsx`: top-level GTS state machine and box integration.
- `src/GTSApi.js`: all client calls under `/api/gts` and the shared auth payload.
- `src/subcomponents/gts/`: page components, cards, filters, constants, and icons.
- `server/endpoints/gts.js`: request authentication, canonical Cloud-slot reads, and HTTP responses.
- `server/gts.js`: deposits, wanted normalization/matching, locking, persistence, stats, and history.
- `server/messages.js`: matched-deposit and manual-cleanup email.
- `server/jstests/gts.test.js`: lifecycle, matching, locking, limits, and persistence coverage.

## Client State Contract

`src/subcomponents/gts/GTSConstants.js` defines the states used by `GlobalTradeStation`: landing, choose deposit Pokemon, deposit form, search, choose offer Pokemon, history, and reverse-search selection. Add a new state only with navigation, back behavior, loading/error handling, and a render branch.

## API Contract

Keep `src/GTSApi.js` paired with these server routes:

- `GET /recent` and `GET /stats`
- `POST /search` and `POST /search/reverse`
- `GET /history`
- `POST /deposits` and `GET /deposits/mine`
- `DELETE /deposits/:id`
- `POST /deposits/:id/withdraw-matched`
- `POST /deposits/:id/offer`
- `PUT /deposits/:id/notify`

Development-only dummy routes are registered only when the server enables them. Do not expose them as production UI without the existing development gate.

Authenticated payloads carry `username`, `accountCode`, `cloudDataSyncKey`, and `randomizer`. Pokemon actions also carry source box coordinates and a checksum. The endpoint must read the canonical Pokemon from the user's current Cloud slot; do not trust a client object as ownership proof.

## Deposit Lifecycle Procedure

1. Normalize and validate wanted criteria on the server. Species and type modes are distinct, and level matching depends on a game ID/experience curve.
2. Acquire the GTS/account locks in the established order before mutating deposits and Cloud slots.
3. Validate the source slot and checksum while the relevant state is protected.
4. Persist every deposit-state, per-user active-deposit, stats, and history mutation as one logical operation.
5. Return only sanitized public summaries from public routes.
6. On offer, update the traded Pokemon through server Pokemon utilities, refresh checksums, and preserve both users' recoverability.
7. Keep withdraw, matched-withdraw/recovery, acknowledgment, and email-notify semantics distinct.
8. Make retries idempotent where possible; network failures must not duplicate Pokemon or consume the same deposit twice.

## Matching Tests

Cover wanted mode, species/type, gender, ability, level boundaries, game-specific levels, malformed filters, randomizer mismatch, self-trade, stale sync keys, changed source slots, deposit limits, concurrent offer/withdraw, persistence reload, and sanitized public data.

## Validation

Add `src/tests/GlobalTradeStation.test.jsx` for changed client behavior. Run that command only after the test file exists.

```powershell
yarn --cwd server test-js jstests/gts.test.js
yarn test src/tests/GlobalTradeStation.test.jsx --run
yarn --cwd server test-all-js
yarn test-all
```

For UI workflow changes, manually exercise deposit, public search, reverse search, offer, history, withdrawal, and matched recovery against a local backend with isolated test storage.
