---
name: realtime-trade-sockets
description: 'Maintain the shared Socket.IO connection lifecycle for Unbound Cloud trades. Use for sockets.js, connection setup, tradeType routing, safeEmit or safeSend, ping/health checks, activity timeouts, processing-loop behavior, disconnect cleanup, socket errors, CORS, or changes that affect both Friend Trade and Wonder Trade protocols.'
argument-hint: 'Describe the socket lifecycle, timeout, routing, or cleanup issue'
---

# Real-Time Trade Sockets

## Owners

- `server/server.js`: creates Socket.IO and initializes `server/sockets.js`.
- `server/sockets.js`: connection lifecycle, utility wrappers, `tradeType` routing, processing loop, timeout handling, and shared cleanup.
- `server/friend-trade.js` and `server/wonder-trade.js`: feature listeners and state processors.
- `src/FriendTrade.jsx` and `src/WonderTrade.jsx`: client connections and handlers.
- `server/jstests/sockets.test.js`: timeout, health, loop, and cleanup tests.

## Current Timing Contract

`server/sockets.js` defines a 5-second emit timeout, 10-second send timeout, 3-second health-check timeout, 2-minute activity timeout, and 1-second main-loop interval. Treat these constants as a coordinated policy; a longer feature operation can still be terminated by the shared activity timer.

## Lifecycle

1. `InitSockets()` receives a connection and creates per-socket activity state.
2. Basic ping and disconnect listeners are attached.
3. The client emits `tradeType` with mode, username, and Cloud sync key.
4. `setupTradeTypeHandler()` installs exactly one feature handler set.
5. `runMainProcessingLoop()` checks connectivity/activity and calls the selected feature processor.
6. Exit or failure calls cleanup for Friend and Wonder Trade state.

## Change Procedure

1. Reproduce at the shared layer before changing feature state.
2. Keep server outbound operations behind `safeEmit` or `safeSend` so disconnects and timeouts are handled consistently.
3. Ensure every inbound event that represents activity updates the activity timestamp through the established wrapper/path.
4. Make setup idempotent or explicitly reject repeated/changed `tradeType` registration.
5. Keep errors from one loop iteration observable without creating a tight retry loop.
6. Cleanup must tolerate partial initialization and repeated calls.
7. Coordinate timeout changes with browser UX and both feature state machines.
8. Remember that trade registries are process-local; do not introduce multi-process deployment assumptions without shared state and a Socket.IO adapter.

## Focused Tests

Use deterministic fake sockets and controlled timers. Cover connected/disconnected sends, emit/send timeout, health failure, idle timeout, activity refresh, invalid trade type, duplicate setup, processor exception, and idempotent cleanup.

```powershell
yarn --cwd server test-js jstests/sockets.test.js
yarn --cwd server test-js jstests/friend-trade.test.js
yarn --cwd server test-js jstests/wonder-trade.test.js
```

For protocol changes, also run two-client live checks for both trade modes; unit tests cannot reproduce every transport ordering issue.