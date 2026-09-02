---
name: wonder-trade
description: 'Implement and debug Wonder Trade matchmaking in Unbound Cloud. Use for the WonderTrade UI, queueing, random partner selection, Socket.IO message events, trade availability polling, cooldowns, same-user prevention, species-repeat protection, bans, randomizer separation, trade completion updates, notifications, Discord webhook logging, or disconnect cleanup.'
argument-hint: 'Describe the Wonder Trade queue, cooldown, match, or notification issue'
---

# Wonder Trade

## Owners

- `src/WonderTrade.jsx`: client cooldown, Pokemon selection, socket connection, send/receive flow, and `CheckForNewWonderTrade()`.
- `src/MainPage.jsx`: periodic availability checks and trade-screen integration.
- `src/Notifications.jsx`: waiting and completion notifications.
- `server/wonder-trade.js`: queue state, eligibility, species cooldown, matching, post-trade mutation, webhook logging, and cleanup.
- `server/sockets.js`: `WONDER_TRADE` registration and shared lifecycle.
- `server/server.js`: `GET /api/wonderTrade/available`.
- `server/jstests/wonder-trade.test.js`: queue, state, cooldown, and cleanup coverage.

## Protocol

The client emits `tradeType` with `WONDER_TRADE`, then uses Socket.IO's `message` channel: `socket.send(pokemon, randomizer)`. The server receives `message` and sends the matched Pokemon and sender metadata through `safeSend`. Error events include `invalidPokemon` and `invalidCloudDataSyncKey`.

Keep this vocabulary and argument order synchronized. Do not replace `send`/`message` with a named event on only one side.

## Cooldowns

There are separate policies:

- `src/WonderTrade.jsx` has a client trade cooldown.
- `server/wonder-trade.js` has `WONDER_TRADE_SPECIES_COOLDOWN` for repeat-species matching.
- `src/Notifications.jsx` separately throttles availability notifications.

Do not assume these durations serve the same purpose. Server enforcement remains authoritative.

## Change Procedure

1. Define queue eligibility for both candidates: valid checksum, active sync key, different client/user, compatible randomizer mode, bans, prior-trade state, and species-repeat policy.
2. Protect queue/client/species-table mutations with the Wonder Trade lock.
3. Revalidate clients at match time because sockets and account keys can change while queued.
4. Update received Pokemon through `UpdatePokemonAfterNonFriendTrade()` and use the resulting checksum.
5. On success, move both clients through the server states exactly once and emit one Pokemon to each.
6. On disconnect or failure, remove queue state without consuming the other user's Pokemon.
7. Keep optional Discord webhook failures nonfatal and free of secrets or full private data.
8. Keep `/api/wonderTrade/available` consistent with actual matching eligibility.

## Tests

Cover no candidates, eligible candidates, same user on two clients, regular/randomizer mismatch, invalid checksum, stale sync key, bans, exact cooldown boundaries, disconnect before/after match, duplicate submissions, post-trade evolution/friendship, webhook failure, and cleanup.

Add `src/tests/WonderTrade.test.jsx` for changed client behavior. Run its command only after the test file exists.

```powershell
yarn --cwd server test-js jstests/wonder-trade.test.js
yarn --cwd server test-js jstests/sockets.test.js
yarn test src/tests/WonderTrade.test.jsx --run
```

Finish protocol changes with two live browser sessions and verify waiting notification, successful swap, title/audio behavior, cooldown display, and reconnect cleanup.
