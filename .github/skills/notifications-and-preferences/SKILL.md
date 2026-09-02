---
name: notifications-and-preferences
description: 'Implement browser notifications and user preferences in Unbound Cloud. Use for toast or system notifications, SweetAlert options, error and trade sounds, Wonder Trade availability alerts, dark mode, music, sound muting, footer controls, localStorage preference keys, or browser permission and autoplay behavior.'
argument-hint: 'Describe the notification, sound, theme, or preference change'
---

# Notifications and Preferences

## Owners

- `src/Notifications.jsx`: system notifications, toasts, popup defaults, sounds, and Wonder Trade notification throttling.
- `src/Theme.jsx`: MUI theme.
- `src/subcomponents/footer/DarkModeButton.jsx`: Dark Reader state.
- `src/subcomponents/footer/MusicButton.jsx`: background music control.
- `src/subcomponents/footer/SoundsButton.jsx`: global effect muting.
- `src/MainPage.jsx`: footer integration and notification polling.
- `src/audio/`: imported audio assets.

## Browser Boundaries

- Request Notification API permission only from an appropriate user interaction.
- `SendSystemNotification()` intentionally skips focused visible pages.
- Audio playback can reject before user interaction. Handle rejected play promises where a new call path can trigger autoplay restrictions.
- Dark mode is implemented with Dark Reader, while toast and popup themes query its current state.
- Preferences and Wonder Trade cooldowns live in `localStorage`; preserve existing keys unless migration is included.

## Change Procedure

1. Put reusable delivery behavior in `Notifications.jsx`; keep feature-specific message text close to the triggering feature when practical.
2. Respect `AreSoundsMuted()` for every new effect.
3. Keep toast, system-notification, title-change, and audio side effects independently testable.
4. For a new preference, define the absent-value default, serialized representation, update path, and migration from any replaced key.
5. Clean up intervals, event listeners, and long-lived audio when components unmount.
6. Check dark and light presentation for MUI, Bootstrap, Toastify, and SweetAlert surfaces affected by the change.

## Tests

Create `src/tests/Notifications.test.jsx` for this coverage and mock browser globals before importing modules that construct `Audio` objects:

- Mock `Notification`, `Audio`, `document.hidden`, `document.hasFocus`, Dark Reader, and `localStorage` as needed.
- Use fake timers for five-minute notification throttling and the 24-hour suppression preference.
- Verify muted sounds do not call `play()`.
- Clear storage and restore globals after each test.

Once the test file exists:

```powershell
yarn test src/tests/Notifications.test.jsx --run
yarn test-all
```

Finish with a manual browser check for permission prompts and actual audio, because jsdom cannot validate browser policy behavior.