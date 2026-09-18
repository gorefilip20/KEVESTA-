# KEVESTA

KEVESTA is an AI travel and relocation assistant for destination guidance, flights, curated stays, local services, and support.

See the [product roadmap and next-sprint plan](ROADMAP.md) for the recommended sequence toward durable bookings and a differentiated relocation workspace.

## Local development

Install dependencies and run the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Run the quality gates before shipping:

```bash
npm run lint
npm run build
```

## Authentication and booking integrity

Secure checkout now requires a server session. Configure `DATABASE_URL` with a PostgreSQL connection string, run `db/schema.sql`, and restart the app. Signup and login issue an httpOnly, Secure-in-production, SameSite session cookie. Booking intents are created server-side, tied to the authenticated user, recalculated from server-owned catalog data, and expire after 15 minutes. Payment initiation accepts an intent ID rather than trusting a browser-supplied amount or title.

The database layer is intentionally explicit and provider-neutral. It can run on managed PostgreSQL providers such as Neon, Supabase Postgres, Railway, Render, or an internal PostgreSQL cluster. Email verification and password reset use SHA-256 hashes of single-use database tokens. Verification links expire after 60 minutes; password reset links expire after 30 minutes. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`, and `EMAIL_FROM` for delivery. In development without SMTP, the server logs a local-only link instead of sending an email. Before production, add login rate limiting, MFA for staff, and persistent booking/payment state transitions.

Users can cancel unpaid bookings from the dashboard. Paid Column bookings can request a provider refund when `COLUMN_REFUND_PATH` is configured; KEVESTA marks them `refund_pending` only after the provider accepts the request and changes them to `refunded` only after a verified provider event. Crypto refund requests are recorded as `refund_pending` for manual review because KEVESTA must not send funds to an unverified destination automatically.

Refund requests now create durable `financial_receipts` records and send a branded notification containing the receipt reference. When a verified Column refund-completed event arrives, KEVESTA creates a completion receipt, updates the refund request to `succeeded`, and sends a second branded email with the provider reference. Email delivery failures are logged without rolling back the financial state transition; the receipt and status remain authoritative for retry tooling.

## SMS and push notifications

Booking and refund status changes can also be delivered through opt-in SMS and push notifications. Users manage their phone number, SMS consent, push consent, and event categories from the dashboard. SMS uses Twilio with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Push uses Firebase Cloud Messaging HTTP v1 with `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`; client applications register device tokens through `/api/notifications/devices`. Credentials remain server-only. Each attempt is recorded in `notification_deliveries` with an idempotency key, provider reference, and delivery status. If a provider is not configured, the application records a skipped delivery and never blocks booking or refund state transitions.

## Calendar syncing

Users can connect Google Calendar or Outlook from the dashboard. OAuth state is signed, access and refresh tokens are encrypted at rest with `CALENDAR_TOKEN_SECRET`, and a confirmed booking creates at most one event per provider through `calendar_sync_events`. Google uses the Calendar Events API; Outlook uses Microsoft Graph. If OAuth credentials are not configured, a confirmed booking can still be downloaded as a private `.ics` file from My Trips. Register these callback URLs with each provider: `/api/calendar/google/callback` and `/api/calendar/outlook/callback` under the configured `NEXT_PUBLIC_APP_URL`.

## Payments

Checkout uses a server-side Column adapter for bank payments. The browser never receives the Column API key and KEVESTA never treats a client-side response as proof of settlement. A booking remains pending until a signed provider event is received at:

```text
POST /api/payments/webhook
```

Copy `.env.example` to `.env.local` and configure `COLUMN_API_KEY`, `COLUMN_RECEIVING_ACCOUNT_ID`, `COLUMN_WEBHOOK_SECRET`, and the exact `COLUMN_ACH_TRANSFER_PATH` enabled for the Column tenant. Keep all `COLUMN_*` values server-only. Column onboarding, KYB/KYC, account setup, transfer permissions, and production enablement must be completed in the Column dashboard before accepting real money.

The checkout returns a clearly labelled setup state when Column is not configured; this is intentional and safer than a demo payment that looks settled.

Crypto checkout is available beside bank payment for flights, apartments, and other checkout links. It currently supports ETH, USDC, and USDT on Ethereum mainnet through a connected EVM wallet. Configure `NEXT_PUBLIC_MERCHANT_WALLET` with a valid receiving address. Crypto amounts come from a server-side Coinbase spot quote, signed by `CRYPTO_QUOTE_SECRET`, and expire after `CRYPTO_QUOTE_TTL_SECONDS` (120 seconds by default). The server now verifies the mainnet receipt through `CRYPTO_RPC_MAINNET` or the configured public RPC, checks receipt success, chain, sender, merchant recipient, token contract, and exact quoted amount, then writes the crypto payment and paid booking transactionally. A fabricated hash, wrong recipient, wrong token, wrong amount, failed receipt, or reused hash cannot mark a booking paid. KEVESTA never asks users for seed phrases or private keys. Testnet support should be added before offering a public crypto beta.

Column webhooks must send the official `Column-Signature` header. KEVESTA verifies the raw request body with HMAC-SHA256, requires Column’s stable event ID, and rejects unsigned or malformed events. Provider event IDs are stored under a database unique constraint before reconciliation. Booking and payment status updates run in a transaction and use monotonic status ranks, so duplicate or stale out-of-order events cannot regress a paid booking. Run `db/schema.sql` before enabling the production webhook.

## Automated payment testing

Install the browser used by Playwright once, then run the local suite:

```bash
npx playwright install chromium
npm run test:e2e
npm run test:email
npm run test:integration:local
```

`npm run test:email` starts an ephemeral local SMTP server, sends the verification and password-reset messages through the real Nodemailer delivery code, parses the captured MIME messages, and checks the KEVESTA branding, subjects, links, and tokens. It does not contact an external mail provider and does not require PostgreSQL.

The suite covers the dual-method checkout, safe behavior when Column is not configured, webhook signature rejection, and an optional Column sandbox initiation test. To enable the external sandbox case, copy `.env.test.example`, export the sandbox values in CI or locally, and use sandbox-only credentials. Never run the test with production credentials because it intentionally creates a payment request.

The payment integration suite also checks the live crypto quote endpoint, rejects unauthenticated crypto confirmation, and supports optional authenticated Column and mined Ethereum settlement checks. The external cases require `E2E_SESSION_COOKIE`, `E2E_BOOKING_INTENT_ID`, and sandbox-only provider evidence. Use `CRYPTO_E2E_QUOTE_ID`, `CRYPTO_E2E_TX_HASH`, and `CRYPTO_E2E_WALLET` only with an already-mined test transaction and a test database; never point this suite at production money or a production wallet.

`npm run test:integration:local` starts a pg-mem PostgreSQL-compatible database, local SMTP capture, a simulated Column ACH server, and the real Next.js application. It covers signup, email verification, login, server booking-intent creation, simulated Column payment initiation, signed webhook settlement, and duplicate webhook delivery without external credentials. Render staging can be created from [`render.yaml`](render.yaml); secret values are intentionally marked `sync: false` and must be entered in the Render dashboard or secret manager.

## Automated payment monitoring

The protected endpoint `GET /api/monitoring/health` reports recent crypto quote provider errors, expired quote confirmations, invalid Column signatures, and duplicate webhook deliveries. Configure `MONITORING_SECRET` on the app and add `KEVESTA_MONITOR_URL` plus `KEVESTA_MONITORING_SECRET` as GitHub Actions repository secrets. The scheduled workflow in `.github/workflows/payment-monitor.yml` checks the endpoint every 15 minutes and fails when the recent window is degraded. Current alert thresholds are five quote-provider errors, five invalid signatures, or twenty-five duplicate webhook deliveries within fifteen minutes.

## Cofounder launch priorities

The next growth milestone should connect confirmed payment events to a durable database record, booking inventory, receipts, refunds, and customer notifications. Before public launch, add authentication and authorization around customer bookings, rate limiting on payment and support routes, structured audit logs, observability, privacy and terms pages, and end-to-end tests covering duplicate requests, failed transfers, returns, and webhook replay. Instrument the funnel from destination search to payment initiation and confirmed booking so product decisions are based on conversion and settlement data.
