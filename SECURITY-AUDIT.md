# KEVESTA security audit

**Scope.** This review covers the authentication boundary, booking flow, payment initiation, crypto quotes, Column ACH webhook reconciliation, browser security headers, and dependency posture in the current repository.

## Executive summary

The payment perimeter is improving, but KEVESTA is not yet safe for production bookings because the application does not currently implement server-backed authentication, durable booking ownership, or server-authoritative booking pricing. The client-side Zustand store is UI state, not an identity system. Checkout values are still derived from URL parameters, which means a user can alter an amount or title before initiating a payment. These are the two highest-priority findings because they affect authorization and revenue integrity.

## Findings

| ID | Severity | Finding | Current impact | Required action |
|---|---|---|---|---|
| AUTH-01 | Critical | No server authentication or session enforcement was found. | Any future booking or account endpoint could be called without proving identity. | Add a managed identity provider or secure server session layer before private bookings, saved trips, refunds, or profile data ship. Use httpOnly, Secure, SameSite cookies and server-side authorization checks. |
| BOOK-01 | Critical | Checkout trusts `amount`, `type`, `id`, and `title` from the browser URL. | A user can modify the amount or item identity before payment initiation. | Replace query-derived checkout with a server-created booking intent. Recalculate price from a server-owned inventory/quote record and bind it to the authenticated user. |
| BOOK-02 | High | Booking confirmation is not persisted as a durable state machine. | Payment and inventory can diverge after retries, restarts, or webhook reordering. | **Partially addressed:** booking/payment/provider-event tables and monotonic Column reconciliation are now implemented. Inventory reservation and refund transitions remain. |
| PAY-01 | High | Crypto quote confirmation validates the signed quote and transaction shape, but does not yet verify the transaction receipt on a server RPC or reconcile token transfer logs. | A client could submit a real-looking hash unless server-side chain verification is added. | Verify receipt status, chain ID, recipient, token contract, token amount, sender, and quote expiry server-side before confirmation. |
| PAY-02 | Medium | Webhook duplicate protection is process-local. | Duplicates can reappear across restarts or multiple instances. | **Addressed:** `provider_events` stores a unique provider/event ID before mutation. |
| PAY-03 | Medium | Webhook events can arrive out of order. | A stale event could regress a booking if transitions are not monotonic. | **Addressed for Column:** booking/payment status ranks reject stale regressions. |
| AUTH-02 | High | No CSRF/session protection is currently needed because there is no server session, but adding cookie auth without CSRF controls would create a new risk. | Future authenticated POST routes could be cross-site abused. | Use SameSite cookies plus Origin checks and CSRF tokens for state-changing browser requests. |
| API-01 | High | Payment and support routes do not yet have durable rate limiting. | Attackers can abuse provider calls, AI calls, or monitoring endpoints. | Add an edge/WAF or shared rate-limit store keyed by IP, account, and idempotency key. |
| DATA-01 | Medium | PII is accepted by payment initiation but no retention, deletion, or access policy is implemented in this repository. | Privacy obligations and breach impact are unclear. | Add privacy/retention policies, redact logs, encrypt durable PII, and restrict operational access. |
| DEP-01 | Low | Current production dependency audit reports zero known vulnerabilities. | This is a point-in-time result, not a substitute for continuous scanning. | Run dependency scanning in CI and keep lockfile updates reviewed. |

## Implemented in this pass

The application now emits structured monitoring events for crypto quote provider failures, expired quote confirmations, invalid Column signatures, received Column events, and duplicate Column event IDs. A protected health endpoint is available at `GET /api/monitoring/health`. Baseline browser security headers were also added. A scheduled GitHub Actions workflow checks the endpoint every 15 minutes when `KEVESTA_MONITOR_URL` and `KEVESTA_MONITORING_SECRET` repository secrets are configured.

The Column handler uses the official `Column-Signature` header and raw-body HMAC verification. It requires the stable event ID supplied by Column and stores it in a unique provider-event ledger before changing payment or booking state. Booking and payment updates run transactionally and reject stale status ranks. Durable inventory reservation, refunds, and crypto receipt verification remain separate work.

## Recommended security sequence

First, introduce a server-owned booking intent and price record. Second, add authentication and authorize every booking, payment, support, and profile operation against that identity. Third, add a database-backed payment/booking state machine and unique constraints for provider IDs, webhook event IDs, wallet transaction hashes, and booking inventory. Fourth, verify crypto receipts server-side and add rate limits, audit logs, monitoring retention, alert routing, and recovery runbooks. Finally, perform a penetration test against the deployed environment with production-like configuration and redacted test data.

## Product features worth building after the security foundation

KEVESTA can differentiate itself through a **single trip workspace** that combines flights, stays, relocation tasks, local services, documents, and payment status rather than treating each booking as a separate search. High-leverage additions include price-drop and fare-change alerts, flexible-date and nearby-airport optimization, transparent total-cost breakdowns, verified local providers with service-level guarantees, AI-generated day-by-day relocation plans, destination-specific arrival checklists, a shared trip mode for families or teams, multilingual support, loyalty credits, and post-booking disruption recovery.

The strongest growth loop is likely **personalized relocation intelligence**: users answer a short arrival questionnaire, KEVESTA builds a practical plan, recommends bookable services, and keeps the plan updated after purchase. This creates repeat usage beyond a single flight or apartment transaction. Build it only after the identity, pricing, and booking state foundations are durable.
