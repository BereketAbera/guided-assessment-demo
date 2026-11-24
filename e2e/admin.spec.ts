import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_ANSWERS } from "../lib/assessment/script";
import { begin, enterCode, expectAccessible, question, signInAsOwner } from "./helpers";

const PRIVATE_WORDS = ["notebook", "Dana", "Maren", "Tobias", "Ines"];

/** Reads one of the ready-made codes from the demo inbox. */
async function readyMadeCode(page: Page, label: RegExp): Promise<string> {
  await page.getByRole("button", { name: /Demo inbox/ }).click();
  const row = page.getByRole("dialog").getByTestId("inbox-code-row").filter({ hasText: label });
  const code = (await row.getByTestId("inbox-code").textContent())!.trim();
  await page.getByRole("button", { name: "Close" }).click();
  return code;
}

test("the admin list shows no transcript until the owner opens one, and opening is logged", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expectAccessible(page);
  await signInAsOwner(page);
  await expectAccessible(page);

  // Status, last activity, tokens and an estimated cost; the model name comes from the settings file.
  await expect(page.getByTestId("model-name")).toHaveText("claude-opus-5-5");
  const rows = page.getByTestId("session-row");
  await expect(rows).toHaveCount(5);
  await expect(rows.filter({ hasText: "Report ready" })).toContainText("248,300");
  await expect(rows.filter({ hasText: "Report ready" })).toContainText("$1.18");
  await expect(rows.filter({ hasText: "In progress · part 3 of 5" })).toHaveCount(1);
  await expect(rows.filter({ hasText: "Expired · part 2 of 5" })).toHaveCount(1);
  await expect(rows.filter({ hasText: "Not started" })).toHaveCount(1);
  await expect(page.getByText("Cost is an estimate")).toBeVisible();

  // Nothing anyone wrote is on the list page, in the visible text or in the markup.
  const listHtml = await page.content();
  for (const word of PRIVATE_WORDS) expect(listHtml).not.toContain(word);
  await expect(page.getByTestId("access-log")).not.toContainText("Transcript opened");

  // The session page is closed too, until a reason is given.
  await rows.filter({ hasText: "Report ready" }).getByRole("link").click();
  await expect(page.getByRole("heading", { name: /^Session S-/ })).toBeVisible();
  await expect(page.getByTestId("transcript-closed")).toBeVisible();
  await expect(page.getByTestId("open-count")).toHaveText("Opened 0 times");
  const closedHtml = await page.content();
  for (const word of PRIVATE_WORDS) expect(closedHtml).not.toContain(word);
  await expectAccessible(page);

  await page.getByLabel("Reason for opening").selectOption("Checking a problem the customer reported");
  await page.getByRole("button", { name: "Open transcript" }).click();
  await expect(page.getByTestId("transcript")).toContainText(SAMPLE_ANSWERS["begin-1"]!);
  await expect(page.getByTestId("transcript")).toContainText("First name given: Maren");
  await expect(page.getByTestId("open-count")).toHaveText("Opened 1 time");
  await expectAccessible(page);

  // Reloading closes it again.
  await page.reload();
  await expect(page.getByTestId("transcript-closed")).toBeVisible();

  await page.goto("/admin");
  const log = page.getByTestId("access-log").locator("li").first();
  await expect(log).toContainText("Transcript opened");
  await expect(log).toContainText("Reason: Checking a problem the customer reported");
});

test("an expired code explains itself, the owner reopens it, and the code resumes", async ({ page }) => {
  await signInAsOwner(page);
  const expired = await readyMadeCode(page, /Expired/);
  const used = await readyMadeCode(page, /Used/);

  await enterCode(page, expired);
  await expect(page.getByRole("alert").filter({ hasText: "This code has expired" })).toContainText("Nothing is lost");
  await expect(page).toHaveURL(/\/code$/);
  await enterCode(page, used);
  await expect(page.getByRole("alert").filter({ hasText: "This code has already been used" })).toBeVisible();

  await page.goto("/admin");
  await page.getByTestId("session-row").filter({ hasText: "Expired" }).getByRole("link").click();
  await page.getByRole("button", { name: "Reopen for 7 days" }).click();
  await expect(page.getByTestId("reopened-note")).toBeVisible();
  await expect(page.getByText("In progress · part 2 of 5")).toBeVisible();

  await enterCode(page, expired);
  await expect(page).toHaveURL(/\/session$/);
  await expect(page.getByTestId("progress-text")).toContainText("Part 2 of 5");
  await expect(question(page)).toContainText("fully absorbed");
  await expect(page.getByRole("button", { name: "Your answers so far (2)" })).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByTestId("access-log").locator("li").first()).toContainText("Session reopened");
});

test("the owner creates a code by hand and it opens a new assessment", async ({ page }) => {
  await signInAsOwner(page);
  await page.getByLabel("Note (optional)").fill("Beta tester, wave one");
  await page.getByRole("button", { name: "Create code" }).click();
  const created = page.getByTestId("created-code");
  await expect(created).toContainText("shown once");
  const code = (await created.locator("p.font-mono").textContent())!.trim();
  expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  await expect(page.getByTestId("session-row")).toHaveCount(6);
  await expect(page.getByTestId("session-row").filter({ hasText: "Beta tester, wave one" })).toContainText("Not started");
  // Only the first four characters are kept for display.
  expect(await page.getByTestId("session-row").filter({ hasText: "Beta tester" }).textContent()).not.toContain(code.slice(5));

  await enterCode(page, code);
  await begin(page, "Noor");
  await page.goto("/admin");
  await expect(page.getByTestId("session-row").filter({ hasText: "Beta tester, wave one" })).toContainText("In progress · part 1 of 5");
});

test("the admin area is closed without the owner sign-in", async ({ page, request }) => {
  await page.goto("/admin/sessions/S-1038");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  expect((await request.post("/api/admin/codes", { data: { note: "x" } })).status()).toBe(401);
  expect((await request.post("/api/admin/sessions/S-1038/transcript", { data: { reason: "x" } })).status()).toBe(401);
  expect((await request.post("/api/admin/sessions/S-1038/reopen")).status()).toBe(401);
  expect((await request.get("/api/cron/purge")).status()).toBe(401);
});
