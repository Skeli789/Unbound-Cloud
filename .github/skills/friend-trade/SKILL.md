---
name: friend-trade
description: 'Implement and debug code-based Friend Trades in Unbound Cloud. Use for friend-code creation or lookup, FriendTrade UI states, Socket.IO events, partner connection/disconnection, randomizer matching, Pokemon offers, acceptance/cancellation, trade-again behavior, invalid Pokemon or sync-key errors, and Friend Trade server state cleanup.'
argument-hint: 'Describe the Friend Trade state, event, or connection issue'
---

# Friend Trade

## Owners

- `src/FriendTrade.jsx`: code choice/input, Pokemon selection, confirmation, and client socket handlers.
- `server/friend-trade.js`: code registry, per-client state, socket handlers, pairing, relays, and cleanup.
- `server/sockets.js`: initial `tradeType` routing, activity timeout, and shared connection cleanup.
- `server/trade-util.js` and `server/pokemon-util.js`: sync-key, identity, randomizer, and Pokemon validation.
- `server/jstests/friend-trade.test.js` and `sockets.test.js`: protocol coverage.

## Protocol

The client first emits `tradeType` with `FRIEND_TRADE`, username, and Cloud sync key. Feature events include:

- Client to server: `createCode`, `checkCode`, `tradeOffer`, `acceptedTrade`, `cancelledTradeAcceptance`, and `tradeAgain`.
- Server to client: `createCode`, `friendFound`, `friendNotFound`, `tradeWithSelf`, `mismatchedRandomizer`, `partnerDisconnected`, `invalidPokemon`, `invalidCloudDataSyncKey`, `tradeOffer`, and `acceptedTrade`.

Do not rename, repurpose, or change an event payload on one side only.

## State Machines

The browser states cover choosing a code action, displaying a created code, entering a code, and choosing a Pokemon. The server independently progresses through initial, connected, connection-notified, accepted, and ending states. Treat these as protocol states, not interchangeable UI page numbers.

## Change Procedure

1. Draw the before/after transition for both participants, including disconnect at every state.
2. Update server listener registration, handler, emitted response, and client listener together.
3. Validate Cloud sync keys before admitting an account user to a trade.
4. Reject self-trades and regular/randomizer mismatches before connecting peers.
5. Validate offered Pokemon checksums on the server.
6. Preserve acceptance cancellation: dismissing or changing an offer must revoke readiness on both sides as the protocol expects.
7. Ensure `tradeAgain` resets both peers without leaking the prior offer or acceptance.
8. Release codes and client entries on disconnect, timeout, normal completion, and handler errors.

## Concurrency Invariants

- A code identifies at most one live pairing.
- A client belongs to at most one Friend Trade.
- Both peers must agree before completion.
- Code-registry and client-state changes remain inside the existing Friend Trade lock where required.
- A late event from an old socket must not mutate a new trade.

## Validation

Add `src/tests/FriendTrade.test.jsx` for changed client behavior. Run that command only after the test file exists.

```powershell
yarn --cwd server test-js jstests/friend-trade.test.js
yarn --cwd server test-js jstests/sockets.test.js
yarn test src/tests/FriendTrade.test.jsx --run
```

Test two real browser sessions for create/join, invalid code, self-trade, randomizer mismatch, offer replacement, cancel acceptance, disconnect, completion, and trade again.
