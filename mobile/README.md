# KEVESTA Mobile

Expo SDK 54 / React Native client for KEVESTA. The app focuses on destination guidance, stay discovery, the AI travel assistant, an authenticated trip hub, and secure mobile checkout.

## Run locally

From this directory:

```bash
npm install
EXPO_PUBLIC_API_URL=http://localhost:3000 npm run start
```

For a physical device, set `EXPO_PUBLIC_API_URL` to the reachable URL of the running Next.js app. The client uses the existing API routes under `/api/travel`, `/api/apartments`, `/api/chat`, `/api/auth/me`, `/api/bookings`, `/api/bookings/intents`, and `/api/payments`.

## Authentication and security

Mobile sign-in uses `POST /api/auth/mobile/login`. The server creates a 256-bit opaque token, stores only its SHA-256 hash in `mobile_sessions`, and returns the token once. The app stores it in iOS Keychain / Android Keystore through `expo-secure-store` and sends it as a bearer token. Logout revokes the token server-side. Tokens expire after 30 days and are never logged or placed in URL parameters.

## Booking and checkout

Authenticated mobile users can load their bookings, create an account-owned booking intent, and start the configured bank-payment flow with an idempotency key. Booking ownership is rechecked server-side for every intent and payment request. A provider setup response remains visibly pending; the app never presents it as paid.

## Native builds

```bash
npm run android
npm run ios
npm run web
npm run check
```

Crypto wallet checkout remains on the existing web experience until a native wallet-connection flow is added.
