# KEVESTA product roadmap and next sprint

## Strategic position

KEVESTA should not compete as another generic flight-and-accommodation search engine. Its strongest position is a **relocation and travel operating system** that helps a person decide where to go, assemble the trip, prepare for arrival, and continue receiving useful support after payment.

The product should win on continuity. A traditional booking app often ends at confirmation. KEVESTA should begin its highest-value experience there: the user receives a personalized arrival plan, verified local services, disruption support, and reminders that make the move easier.

The current codebase already contains the foundation for that position. It has flight and apartment discovery, local services, an AI travel assistant, wallet and bank payment paths, server-backed authentication, server-owned booking intents, branded authentication emails, and operational payment monitoring. The next step is to make a confirmed booking durable and trustworthy before expanding the marketplace.

## Current product assessment

The application has made meaningful progress on its most serious risks. Authentication uses PostgreSQL-backed users and sessions. Signup includes email verification, password reset is available, and checkout requires a server-created booking intent. Payment initiation no longer accepts a browser-defined amount. Column webhook signatures are verified, crypto quotes are signed and time-limited, and local SMTP delivery is tested.

Several production gaps remain. Booking and payment state are not yet a complete durable state machine. Inventory reservation is not transactional. Crypto confirmation still needs server-side receipt and token-transfer verification. Column event deduplication is process-local rather than database-backed. Rate limiting, privacy controls, refunds, and operational staff access are also incomplete.

These gaps matter more than adding many new search filters. A larger catalog does not create a defensible advantage if a user cannot trust the price, payment status, or recovery path after a disruption.

## Next sprint objective

**Sprint objective:** deliver a trustworthy “book and prepare” loop for one flight and one accommodation path.

At the end of the sprint, an authenticated user should be able to select an item, receive a server-owned price, create a booking record, pay through a supported method, see an honest pending or confirmed state, and receive a useful next-step arrival checklist. The system must remain safe when a request is retried, a webhook is duplicated, or a payment fails.

A two-week sprint is an appropriate first scope. The plan below assumes one full-stack engineer with product support. If the team is larger, the work can be parallelized, but the database state model should remain owned by one person to avoid inconsistent transitions.

## Sprint plan

### Track A: Durable booking and payment state

Create `bookings`, `payments`, and `provider_events` tables. A booking should reference the authenticated user and booking intent, store the final server-calculated amount, and have an explicit status such as `intent_created`, `payment_pending`, `paid`, `failed`, `cancelled`, `refunded`, or `expired`. A payment should store its provider, provider reference, idempotency key, amount, currency, and current status. Provider event IDs should be unique in the database.

Define monotonic transition rules. A stale Column event must not move a booking from `paid` back to `payment_pending`. A duplicate event must be acknowledged without a second mutation. The same rule must apply to crypto confirmation and retrying a bank payment.

**Acceptance criteria:** a database transaction creates the booking and payment records together; duplicate provider references cannot create duplicates; duplicate webhook delivery leaves the booking unchanged after the first transition; the dashboard can display the current booking status from the database rather than from client memory; failed payment and expired intent paths are represented explicitly.

### Track B: Server-side crypto verification

Move crypto confirmation from client trust to server verification. After a wallet transaction is submitted, the server should fetch the receipt from the configured Ethereum RPC and verify that the receipt succeeded, the chain ID is expected, the recipient is the configured merchant wallet, and the transferred amount matches the signed quote within the supported token precision. For USDC and USDT, verify the token contract and `Transfer` event. Store the transaction hash under a unique constraint.

**Acceptance criteria:** a fabricated transaction hash cannot produce a paid booking; a transaction sent to another wallet remains pending or fails; an expired quote cannot settle at the old amount; ETH and token transfers are tested independently on a test network before mainnet enablement.

### Track C: Customer trust and recovery

Add a “My trips” area backed by the booking tables. Each booking should show the item, amount, payment method, current status, provider reference, and the next action. The UI should distinguish `payment pending` from `confirmed`, and it should never display a confirmation badge based only on a wallet callback.

Add transactional emails for booking created, payment confirmed, payment failed, and booking cancelled. Reuse the KEVESTA email shell already used for verification and password reset. Add a support link and a clear reference ID to every message.

**Acceptance criteria:** a user can refresh or sign in from another device and see the same booking state; a payment failure provides a retry or support path; confirmation email content matches the database status; a booking reference can be copied and searched by support staff.

### Track D: Relocation wedge

Build the first version of the **Arrival Plan**. After a confirmed flight or accommodation booking, ask for arrival date, destination area, household size, and priorities. Generate a checklist with practical tasks such as airport transfer, connectivity, local registration, temporary accommodation, banking, healthcare, and neighborhood orientation. Each task should have a status and an optional bookable service link.

Do not attempt a general-purpose marketplace in this sprint. Start with a curated set of five to ten high-confidence tasks for one launch corridor. The value comes from the continuity of the plan, not from the number of providers.

**Acceptance criteria:** a confirmed booking produces a useful checklist in under one minute; tasks are editable and persist to the user account; at least three tasks link to a real KEVESTA service or support action; the checklist can be revisited from the dashboard.

### Track E: Abuse prevention and operational visibility

Add rate limits for login, signup, verification resend, password reset, booking-intent creation, quote creation, and payment initiation. Use a shared store in production; an in-memory limiter is suitable only for local development. Add structured audit records for authentication events, intent creation, payment attempts, status changes, and staff actions.

Promote the current monitoring counters into durable operational events. Alert on quote-provider failures, webhook signature failures, duplicate-event spikes, payment failures, and unusually high intent-to-payment drop-off.

**Acceptance criteria:** abuse thresholds return `429` without exposing secrets; audit records omit passwords, SMTP credentials, full payment data, and raw reset tokens; each alert has an owner, threshold, and response playbook.

## What not to build next

Do not build loyalty points, a large provider marketplace, native mobile apps, broad multilingual expansion, complex referral programs, or many additional payment rails in this sprint. Those features can increase reach, but they will not compensate for unclear booking state or weak post-booking value.

Do not treat AI itinerary generation as the main differentiator by itself. Generic itinerary text is easy to copy. The defensible layer is the connection between the user’s actual booking, operational tasks, verified local services, payment status, and ongoing support.

## Success metrics

The sprint should be measured by behavior and reliability rather than feature count.

| Metric | Initial target | Why it matters |
|---|---:|---|
| Intent-to-payment initiation rate | Establish baseline, then improve by 15% | Measures checkout clarity and trust. |
| Payment-to-confirmed conversion | At least 95% of valid provider-settled payments | Measures reconciliation quality. |
| Duplicate provider events causing state changes | 0 | Protects revenue and booking integrity. |
| Fabricated or invalid crypto hashes marked paid | 0 | Confirms server-side verification. |
| Users opening the Arrival Plan after confirmation | At least 60% | Tests the relocation wedge. |
| Arrival Plan task completion within seven days | At least 30% | Tests repeat engagement. |
| Authentication email delivery success | At least 98% in configured SMTP environment | Protects account activation and recovery. |
| Support tickets caused by unclear payment status | Baseline during beta, then reduce | Measures trust and communication quality. |

## Suggested launch corridor

Choose one corridor where KEVESTA can make the experience specific rather than broad. A practical selection should have meaningful flight demand, accommodation supply, local service opportunities, and a clear relocation use case. The first corridor should have a small set of verified service partners and a manually reviewed arrival checklist. Quality and relevance will create stronger learning than a large but generic inventory.

## Post-sprint roadmap

The second sprint should add refunds, cancellation policies, provider operations, and a support dashboard. The third should add disruption recovery and price or schedule alerts. The fourth should expand the Arrival Plan into a shared household workspace with documents, deadlines, and collaboration. Only after these loops work should KEVESTA invest heavily in loyalty, referrals, additional payment rails, or a larger provider marketplace.

## Product thesis

KEVESTA can become meaningfully ahead by owning the period between **“I am planning a move”** and **“I am settled and supported.”** Search and payment are necessary entry points. The durable advantage is the trusted, personalized operating layer that connects decisions, bookings, arrival tasks, and ongoing local help.

## References

[1]: https://github.com/gorefilip20/KEVESTA- "KEVESTA source repository"
