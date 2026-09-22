# KEVESTA platform status

## Current surfaces

| Surface | Status | Purpose |
| --- | --- | --- |
| Next.js web app | Existing and retained | Full workspace: dashboard, flight and apartment discovery, checkout, support, auth, calendar, and payments. |
| Expo mobile app | Added in `mobile/` | Native companion for destination guidance, featured stays, AI assistance, and a trip hub. |
| Shared backend | Existing and reused | Mobile calls the same public Next.js API contracts rather than duplicating business logic. |

## Product decision

The mobile client is a focused companion instead of a second copy of every web screen. This keeps the native app useful in the highest-frequency travel moments and reduces divergence while the payment and account foundations mature.

## Next implementation priorities

1. Add a mobile token/session flow with secure device storage and explicit authorization for bookings.
2. Add authenticated booking list and booking detail endpoints to power the trip hub.
3. Add push notification registration and server-side trip alerts.
4. Add native checkout handoff or a dedicated mobile payment experience after the booking state machine is fully inventory-aware.
5. Add device and browser end-to-end coverage in CI.
