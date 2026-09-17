# KEVESTA

KEVESTA is an AI travel and relocation assistant for destination guidance, flights, curated stays, local services, and support.

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

## Payments

Checkout uses a server-side Column adapter for bank payments. The browser never receives the Column API key and KEVESTA never treats a client-side response as proof of settlement. A booking remains pending until a signed provider event is received at:

```text
POST /api/payments/webhook
```

Copy `.env.example` to `.env.local` and configure `COLUMN_API_KEY`, `COLUMN_RECEIVING_ACCOUNT_ID`, `COLUMN_WEBHOOK_SECRET`, and the exact `COLUMN_ACH_TRANSFER_PATH` enabled for the Column tenant. Keep all `COLUMN_*` values server-only. Column onboarding, KYB/KYC, account setup, transfer permissions, and production enablement must be completed in the Column dashboard before accepting real money.

The checkout returns a clearly labelled setup state when Column is not configured; this is intentional and safer than a demo payment that looks settled.

## Cofounder launch priorities

The next growth milestone should connect confirmed payment events to a durable database record, booking inventory, receipts, refunds, and customer notifications. Before public launch, add authentication and authorization around customer bookings, rate limiting on payment and support routes, structured audit logs, observability, privacy and terms pages, and end-to-end tests covering duplicate requests, failed transfers, returns, and webhook replay. Instrument the funnel from destination search to payment initiation and confirmed booking so product decisions are based on conversion and settlement data.
