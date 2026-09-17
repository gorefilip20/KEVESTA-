import { test, expect } from "@playwright/test";

const checkoutUrl = "/checkout?type=flight&amount=249&title=London%20flight";

 test("checkout exposes bank and crypto payment methods", async ({ page }) => {
  await page.goto(checkoutUrl);
  await expect(page.getByText("Pay by bank")).toBeVisible();
  await expect(page.getByText("Pay with crypto")).toBeVisible();
  await page.getByText("Pay with crypto").click();
  await expect(page.getByRole("button", { name: /^USDC/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^USDT/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^ETH/ })).toBeVisible();
});

test("unconfigured bank payment never reports success", async ({ request }) => {
  const response = await request.post("/api/payments", {
    headers: { "Content-Type": "application/json", "Idempotency-Key": `test-${Date.now()}` },
    data: { amount: 249, customerName: "Sandbox Customer", customerEmail: "sandbox@example.com", description: "E2E booking" },
  });
  if (process.env.COLUMN_API_KEY && process.env.COLUMN_RECEIVING_ACCOUNT_ID) {
    expect(response.status()).toBeLessThan(500);
  } else {
    expect(response.status()).toBe(503);
    const body = await response.json();
    expect(body.payment.mode).toBe("setup_required");
    expect(body.payment.status).toBe("pending");
  }
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
