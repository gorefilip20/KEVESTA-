import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import { simpleParser } from "mailparser";

const checkoutUrl = "/checkout?type=flight&id=FL-LHRJFK-0-1";

test("checkout requires a server session before showing payment methods", async ({ page }) => {
  await page.goto(checkoutUrl);
  await expect(page.getByText(/Sign in to secure your booking|Secure checkout is unavailable/)).toBeVisible();
});

test("unconfigured bank payment never reports success", async ({ request }) => {
  const response = await request.post("/api/payments", {
    headers: { "Content-Type": "application/json", "Idempotency-Key": `test-${Date.now()}` },
    data: { amount: 249, customerName: "Sandbox Customer", customerEmail: "sandbox@example.com", description: "E2E booking" },
  });
  expect(response.status()).toBe(401);
});

test("webhook rejects unsigned provider events", async ({ request }) => {
  const response = await request.post("/api/payments/webhook", { data: { id: "evt_test", type: "payment.confirmed" } });
  expect(response.status()).toBe(401);
});

test("payment monitoring endpoint rejects unauthenticated access", async ({ request }) => {
  const response = await request.get("/api/monitoring/health");
  expect(response.status()).toBe(401);
});

test("crypto settlement confirmation rejects unauthenticated access", async ({ request }) => {
  const response = await request.post("/api/payments/crypto/confirm", { data: { quoteId: "invalid", txHash: `0x${"0".repeat(64)}` } });
  expect(response.status()).toBe(401);
});

test("My Trips API rejects unauthenticated access", async ({ request }) => {
  const response = await request.get("/api/bookings");
  expect(response.status()).toBe(401);
});

test("booking cancellation rejects unauthenticated access", async ({ request }) => {
  const response = await request.post("/api/bookings/00000000-0000-0000-0000-000000000000/cancel", { data: {} });
  expect(response.status()).toBe(401);
});

test("Column sandbox payment initiation works when sandbox credentials are configured", async ({ request }) => {
  test.skip(!process.env.COLUMN_API_KEY || !process.env.COLUMN_RECEIVING_ACCOUNT_ID || !process.env.COLUMN_WEBHOOK_SECRET || !process.env.E2E_SESSION_COOKIE || !process.env.E2E_BOOKING_INTENT_ID, "Set sandbox credentials, an authenticated test cookie, and a fresh booking intent");
  const response = await request.post("/api/payments", {
    headers: { "Content-Type": "application/json", "Idempotency-Key": `column-sandbox-${Date.now()}`, Cookie: process.env.E2E_SESSION_COOKIE! },
    data: { intentId: process.env.E2E_BOOKING_INTENT_ID, customerName: "Kevesta Sandbox", customerEmail: "sandbox@example.com" },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.payment.mode).toBe("column");
  expect(body.payment.paymentId).toBeTruthy();
});

test("live crypto quote endpoint returns a bounded quote", async ({ request }) => {
  const response = await request.get("/api/payments/crypto/quote?amount=25&currency=USDC");
  test.skip(response.status() === 502, "Coinbase spot quote provider unavailable in this environment");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.quote.currency).toBe("USDC");
  expect(body.quote.cryptoAmount).toBeGreaterThan(0);
  expect(Date.parse(body.quote.expiresAt)).toBeGreaterThan(Date.now());
});

test("crypto settlement verification rejects an invalid transaction even with a session", async ({ request }) => {
  test.skip(!process.env.E2E_SESSION_COOKIE || !process.env.E2E_BOOKING_INTENT_ID, "Set an authenticated test cookie and fresh booking intent");
  const response = await request.post("/api/payments/crypto/confirm", {
    headers: { "Content-Type": "application/json", Cookie: process.env.E2E_SESSION_COOKIE! },
    data: { quoteId: "invalid-signed-quote", txHash: `0x${"0".repeat(64)}`, walletAddress: "0x0000000000000000000000000000000000000001", intentId: process.env.E2E_BOOKING_INTENT_ID },
  });
  expect([400, 409]).toContain(response.status());
});

test("optional crypto mainnet receipt verification accepts only configured test evidence", async ({ request }) => {
  test.skip(!process.env.E2E_SESSION_COOKIE || !process.env.E2E_BOOKING_INTENT_ID || !process.env.CRYPTO_E2E_QUOTE_ID || !process.env.CRYPTO_E2E_TX_HASH || !process.env.CRYPTO_E2E_WALLET, "Provide a fresh quote, authenticated cookie, booking intent, and an already-mined test transaction");
  const response = await request.post("/api/payments/crypto/confirm", {
    headers: { "Content-Type": "application/json", Cookie: process.env.E2E_SESSION_COOKIE! },
    data: { quoteId: process.env.CRYPTO_E2E_QUOTE_ID, txHash: process.env.CRYPTO_E2E_TX_HASH, walletAddress: process.env.CRYPTO_E2E_WALLET, intentId: process.env.E2E_BOOKING_INTENT_ID },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.status).toBe("paid");
});

test("local mock stack runs the authenticated ACH lifecycle end to end", async ({ request }) => {
  test.skip(!process.env.LOCAL_INTEGRATION, "Run through the local mock stack command");
  const email = `local-${Date.now()}@kevesta.test`;
  const signup = await request.post("/api/auth/signup", { data: { name: "Local Traveler", email, password: "local-password-123" } });
  expect(signup.status()).toBe(201);
  const signupCookie = signup.headers()["set-cookie"];
  expect(signupCookie).toBeUndefined();
  const emailResponse = await request.get("http://127.0.0.1:4011/__test/emails");
  const emailBody = await emailResponse.json();
  expect(emailBody.messages.length).toBeGreaterThan(0);
  const parsedEmail = await simpleParser(emailBody.messages.at(-1) || "");
  const verificationToken = /verify-email\?token=([^&\s"<]+)/.exec(typeof parsedEmail.html === "string" ? parsedEmail.html : "")?.[1];
  expect(verificationToken).toBeTruthy();
  const verified = await request.post("/api/auth/verify-email", { data: { token: decodeURIComponent(verificationToken!) } });
  expect(verified.status()).toBe(200);
  const login = await request.post("/api/auth/login", { data: { email, password: "local-password-123" } });
  expect(login.status()).toBe(200);
  const cookie = login.headers()["set-cookie"];
  expect(cookie).toContain("kevesta_session=");
  const intent = await request.post("/api/bookings/intents", { headers: { Cookie: cookie }, data: { itemType: "apartment", itemId: "APT-0000" } });
  expect(intent.status()).toBe(201);
  const intentBody = await intent.json();
  const payment = await request.post("/api/payments", { headers: { Cookie: cookie, "Idempotency-Key": `local-${Date.now()}` }, data: { intentId: intentBody.intent.id, customerName: "Local Traveler", customerEmail: email } });
  expect(payment.status()).toBe(200);
  const paymentBody = await payment.json();
  expect(paymentBody.payment.mode).toBe("column");
  const event = { id: `evt_local_${Date.now()}`, type: "ach.outgoing_transfer.completed", data: { id: paymentBody.payment.paymentId, status: "completed" } };
  const raw = JSON.stringify(event);
  const signature = crypto.createHmac("sha256", "local-column-secret").update(raw).digest("hex");
  const webhook = await request.post("/api/payments/webhook", { headers: { "Column-Signature": signature }, data: event });
  expect(webhook.status()).toBe(200);
  expect((await webhook.json()).status).toBe("paid");
  const duplicate = await request.post("/api/payments/webhook", { headers: { "Column-Signature": signature }, data: event });
  expect((await duplicate.json()).duplicate).toBe(true);
});
