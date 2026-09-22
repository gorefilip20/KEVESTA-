/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const byText = (text) => `//*[@text="${text}"]`;
const clickText = async (text) => { const el = await $(byText(text)); await el.waitForDisplayed(); await el.click(); return el; };
const fill = async (selector, value) => { const el = await $(selector); await el.waitForDisplayed(); await el.setValue(value); return el; };
describe("KEVESTA mobile authentication and checkout", function () {
  it("shows login validation for empty credentials", async function () {
    const submit = await $("~login-submit"); await submit.waitForDisplayed(); await submit.click();
    const error = await $("~login-error"); await error.waitForDisplayed(); assert.match(await error.getText(), /email and password/i);
  });
  it("authenticates and reaches the flight checkout flow", async function () {
    if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) this.skip();
    await fill("~login-email", process.env.E2E_EMAIL); await fill("~login-password", process.env.E2E_PASSWORD); await $("~login-submit").click();
    await clickText("Find a flight");
    await fill("~flight-origin", process.env.E2E_ORIGIN || "JFK"); await fill("~flight-destination", process.env.E2E_DESTINATION || "LHR"); await $("~flight-search-submit").click();
    const firstFlight = await $("//*[@text[contains(., 'Nonstop') or contains(., 'stop')]]"); await firstFlight.waitForDisplayed(); await firstFlight.click();
    await clickText("Continue to passenger details"); await fill("~passenger-first-name", "Alex"); await fill("~passenger-last-name", "Morgan"); await fill("~passenger-email", process.env.E2E_EMAIL); await clickText("Review and pay");
    const checkout = await $("//*[@text='Continue to bank payment']"); await checkout.waitForDisplayed(); assert.equal(await checkout.isDisplayed(), true);
  });
});
