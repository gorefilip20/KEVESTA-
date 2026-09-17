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

Crypto checkout is available beside bank payment for flights, apartments, and other checkout links. It currently supports ETH, USDC, and USDT on Ethereum mainnet through a connected EVM wallet. Configure `NEXT_PUBLIC_MERCHANT_WALLET` with a valid receiving address. A crypto booking is only treated as confirmed after the wallet transaction receives an on-chain receipt; KEVESTA never asks users for seed phrases or private keys. Testnet support should be added before offering a public crypto beta.

## Automated payment testing

Install the browser used by Playwright once, then run the local suite:

```bash
npx playwright install chromium
npm run test:e2e
```

The suite covers the dual-method checkout, safe behavior when Column is not configured, webhook signature rejection, and an optional Column sandbox initiation test. To enable the external sandbox case, copy `.env.test.example`, export the sandbox values in CI or locally, and use sandbox-only credentials. Never run the test with production credentials because it intentionally creates a payment request.

## Cofounder launch priorities

The next growth milestone should connect confirmed payment events to a durable database record, booking inventory, receipts, refunds, and customer notifications. Before public launch, add authentication and authorization around customer bookings, rate limiting on payment and support routes, structured audit logs, observability, privacy and terms pages, and end-to-end tests covering duplicate requests, failed transfers, returns, and webhook replay. Instrument the funnel from destination search to payment initiation and confirmed booking so product decisions are based on conversion and settlement data.
