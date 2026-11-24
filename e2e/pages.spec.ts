import { expect, test } from "@playwright/test";
import { buyCodes, enterCode, expectAccessible } from "./helpers";

test("code entry is forgiving about format and clear about problems", async ({ page }) => {
  await page.goto("/code");
  const field = page.getByLabel("Access code");

  await field.fill("k7qm2xhd");
  await expect(field).toHaveValue("K7QM-2XHD");
  await field.fill("  k7qm - 2x hd ");
  await expect(field).toHaveValue("K7QM-2XHD");

  await field.fill("K7QM");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "That is 4 of 8 characters" })).toBeVisible();

  await field.fill("K7QM-2XH0");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "never the letters I, L, O or U" })).toBeVisible();

  await field.fill("ZZZZ-ZZZZ");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "We can't find that code" })).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("button", { name: "Lost your code?" }).click();
  await expect(page.getByText("Search your email for")).toBeVisible();
  await expect(page.getByRole("link", { name: "See a sample report" })).toHaveAttribute("href", "/sample-report");
});

test("a two-pack gives two working codes", async ({ page }) => {
  const codes = await buyCodes(page, "two-pack");
  expect(codes).toHaveLength(2);
  expect(codes[0]).not.toBe(codes[1]);
  for (const code of codes) {
    await enterCode(page, code);
    await expect(page).toHaveURL(/\/start$/);
  }
});

test("each visitor's codes and sessions are private to them", async ({ page, browser }) => {
  await buyCodes(page);
  await page.getByRole("button", { name: /Demo inbox/ }).click();
  await expect(page.getByRole("dialog").getByText("Your access code", { exact: true })).toBeVisible();

  const other = await browser.newContext();
  const visitor = await other.newPage();
  await visitor.goto("/admin");
  await visitor.getByRole("button", { name: "Sign in as the demo owner" }).click();
  // Another visitor sees their own five example rows and none of the first visitor's purchases.
  await expect(visitor.getByTestId("session-row")).toHaveCount(5);
  await expect(visitor.getByTestId("session-row").filter({ hasText: "Purchase" })).toHaveCount(0);
  await visitor.getByRole("button", { name: /Demo inbox/ }).click();
  await expect(visitor.getByRole("dialog").getByText("Your access code", { exact: true })).toHaveCount(0);
  await other.close();
});

test("reset demo clears this visitor's sample space", async ({ page }) => {
  const [code] = await buyCodes(page);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("button", { name: "Delete and start again" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /Demo inbox/ })).toContainText("0");
  await enterCode(page, code!);
  await expect(page.getByRole("alert").filter({ hasText: "We can't find that code" })).toBeVisible();
});

test("the sample report, settings and how-it-works pages", async ({ page }) => {
  await page.goto("/sample-report");
  await expect(page.getByRole("heading", { level: 1, name: "Your Working Style Reflection" })).toBeVisible();
  await expect(page.getByText("The Deliberate Starter")).toBeVisible();
  await expectAccessible(page);

  await page.goto("/settings");
  await expect(page.getByTestId("settings-model")).toHaveText("claude-opus-5-5");
  await expect(page.getByText("How you would change one")).toBeVisible();
  await expect(page.locator("pre").first()).toContainText('"inputPricePerMillionTokens": 4');
  await expect(page.locator("pre").nth(1)).toContainText("Ask one question at a time.");
  await expectAccessible(page);

  await page.goto("/how-it-works");
  for (const heading of [
    "What is simulated, and what production would use",
    "How the conversation is stored between messages",
    "Why the report runs as a background job",
    "Two ways to lay out the report",
    "Privacy, shown in running code",
    "What you would own",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expectAccessible(page);

  // The footer says what is fictional on every page.
  await expect(page.getByText("Sample by Bereket A. · fictional data")).toBeVisible();
});
