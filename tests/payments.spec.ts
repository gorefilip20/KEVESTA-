import { test, expect } from "@playwright/test";

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

test("Column sandbox payment initiation works when sandbox credentials are configured", async ({ request }) => {
  test.skip(!process.env.COLUMN_API_KEY || !process.env.COLUMN_RECEIVING_ACCOUNT_ID || !process.env.COLUMN_WEBHOOK_SECRET, "Set Column sandbox credentials to run this external test");
  const response = await request.post("/api/payments", {
    headers: { "Content-Type": "application/json", "Idempotency-Key": `column-sandbox-${Date.now()}` },
    data: { amount: Number(process.env.COLUMN_E2E_AMOUNT || 1), customerName: "Kevesta Sandbox", customerEmail: "sandbox@example.com", description: "Kevesta automated Column sandbox payment" },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.payment.mode).toBe("column");
  expect(body.payment.paymentId).toBeTruthy();
});
