import { test, expect, type APIRequestContext } from "@playwright/test";
import { simpleParser } from "mailparser";

async function createVerifiedUser(request: APIRequestContext) {
  const email = `trip-e2e-${Date.now()}@kevesta.test`;
  const password = "trip-password-123";
  const signup = await request.post("/api/auth/signup", { data: { name: "Trip E2E Traveler", email, password } });
  expect(signup.status()).toBe(201);
  const emailResponse = await request.get("http://127.0.0.1:4011/__test/emails");
  const emailBody = await emailResponse.json();
  const parsed = await simpleParser(emailBody.messages.at(-1) || "");
  const verificationToken = /verify-email\?token=([^&\s"<]+)/.exec(typeof parsed.html === "string" ? parsed.html : "")?.[1];
  expect(verificationToken).toBeTruthy();
  const verified = await request.post("/api/auth/verify-email", { data: { token: decodeURIComponent(verificationToken!) } });
  expect(verified.status()).toBe(200);
  const login = await request.post("/api/auth/login", { data: { email, password } });
  expect(login.status()).toBe(200);
  const cookie = login.headers()["set-cookie"];
  expect(cookie).toContain("kevesta_session=");
  return { email, cookie };
}

function cookieValue(setCookie: string) {
  return setCookie.split(";")[0].split("=").slice(1).join("=");
}

test.describe("trip workspace collaboration and shared expenses", () => {
  test.skip(!process.env.LOCAL_INTEGRATION, "Run through the local mock stack command");

  test("invites a traveler and records a shared expense through the real workspace UI", async ({ page, request }) => {
    const { cookie } = await createVerifiedUser(request);
    await page.context().addCookies([{ name: "kevesta_session", value: cookieValue(cookie), domain: "127.0.0.1", path: "/" }]);

    const trip = await request.post("/api/trips", { headers: { Cookie: cookie }, data: { name: "Lisbon group weekend", destination: "Lisbon", countryCode: "PT" } });
    expect(trip.status()).toBe(201);
    const tripBody = await trip.json();
    const tripId = tripBody.trip.id;

    await page.goto("/trip");
    await expect(page.getByRole("heading", { name: "Lisbon group weekend" })).toBeVisible();

    await page.getByRole("button", { name: "Travelers" }).click();
    await page.getByRole("button", { name: "Invite traveler" }).click();
    await page.getByLabel("Traveler email").fill("friend@kevesta.test");
    await page.getByRole("button", { name: "Create invite link" }).click();
    await expect(page.getByText(/Invite ready: \/trip\/invite\//)).toBeVisible();

    const detailAfterInvite = await request.get(`/api/trips/${tripId}`, { headers: { Cookie: cookie } });
    expect(detailAfterInvite.status()).toBe(200);
    const inviteBody = await detailAfterInvite.json();
    expect(inviteBody.members).toEqual(expect.arrayContaining([expect.objectContaining({ email: "friend@kevesta.test", status: "invited", role: "traveler" })]));

    await page.getByRole("button", { name: "Expenses" }).click();
    await page.getByRole("button", { name: "Log shared expense" }).click();
    await page.getByLabel("What was it for?").fill("Airport transfer");
    await page.getByLabel("Amount").fill("42.50");
    await page.getByLabel("Currency").selectOption("EUR");
    await page.getByLabel("Split method").selectOption("equal");
    await page.getByRole("button", { name: "Add expense" }).click();
    await expect(page.getByText("Expense added to the shared ledger.")).toBeVisible();
    await expect(page.getByText("Airport transfer")).toBeVisible();
    await expect(page.getByText("EUR 42.50 · paid by Trip E2E Traveler")).toBeVisible();

    const detailAfterExpense = await request.get(`/api/trips/${tripId}`, { headers: { Cookie: cookie } });
    expect(detailAfterExpense.status()).toBe(200);
    const expenseBody = await detailAfterExpense.json();
    expect(expenseBody.expenses).toEqual(expect.arrayContaining([expect.objectContaining({ description: "Airport transfer", amount_cents: 4250, currency: "EUR", paid_by_name: "Trip E2E Traveler" })]));
  });
});
