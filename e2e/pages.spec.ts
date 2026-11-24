import { expect, test } from "@playwright/test";
import { buyCodes, enterCode, expectAccessible, expectNoSidewaysScroll, signInAsOwner } from "./helpers";

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
  // "Another" is said only on the pack that was bought, and the other card keeps its own height.
  await expect(page.getByRole("button", { name: "Buy another two-pack" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buy single", exact: true })).toBeVisible();
  const single = await page.getByRole("heading", { name: "Single" }).locator("..").boundingBox();
  expect(single!.height).toBeLessThan(330);
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

test("the Demo inbox count is shown only once it is known", async ({ page }) => {
  type Seen = { inboxCounts: string[]; sawEmptyInbox: boolean };
  // Record every number the badge shows, and whether the panel ever says it is empty, from the first paint on.
  await page.addInitScript(() => {
    const seen = window as unknown as Seen;
    seen.inboxCounts = [];
    seen.sawEmptyInbox = false;
    const note = () => {
      if (document.querySelector('[role="dialog"]')?.textContent?.includes("No messages yet")) seen.sawEmptyInbox = true;
      const badge = document.querySelector('[data-testid="inbox-count"]');
      if (!badge || getComputedStyle(badge).visibility === "hidden") return;
      const text = (badge.textContent ?? "").trim();
      if (text && seen.inboxCounts[seen.inboxCounts.length - 1] !== text) seen.inboxCounts.push(text);
    };
    new MutationObserver(note).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
  });
  const seen = () =>
    page.evaluate(() => {
      const w = window as unknown as Seen;
      return { counts: w.inboxCounts, empty: w.sawEmptyInbox };
    });
  const badge = page.getByTestId("inbox-count");

  // A new visitor has a known zero. A purchase moves it to 1 together with the confirmation.
  await buyCodes(page);
  await expect(badge).toHaveText("1");
  expect((await seen()).counts).toEqual(["0", "1"]);

  // After a full page load the count is unknown until the inbox has been read: no 0 on the way to 1.
  await page.reload();
  await expect(badge).toHaveText("1");
  expect((await seen()).counts).toEqual(["1"]);

  // Opened straight after a load, the panel waits for the messages and never says it is empty.
  await page.reload();
  await page.getByRole("button", { name: /Demo inbox/ }).click();
  await expect(page.getByRole("dialog").getByTestId("inbox-code").first()).toBeVisible();
  expect((await seen()).empty).toBe(false);
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
  await expect(page.getByText("three plain files")).toBeVisible();
  await expect(page.locator("pre").first()).toContainText('"inputPricePerMillionTokens": 4');
  await expect(page.locator("pre").nth(1)).toContainText("Ask one question at a time.");
  // The sales page's own text is one of the files, and the home page really reads it.
  await expect(page.getByRole("heading", { name: "settings/sales-page.json" })).toBeVisible();
  await expect(page.locator("pre").nth(2)).toContainText('"headline": "An unhurried hour with the way you work."');
  await expect(page.getByRole("rowheader", { name: "Sales page text" })).toBeVisible();
  await expectAccessible(page);

  await page.goto("/how-it-works");
  for (const heading of [
    "What is simulated, and what production would use",
    "How the conversation is stored between messages",
    "Why the report runs as a background job",
    "Two ways to lay out the report",
    "Privacy, shown in running code",
    "The owner admin: what is here, and what the real build adds",
    "What you would own",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Try it in five minutes" })).toBeVisible();
  await expect(page.getByText("My recommendation is (b).")).toBeVisible();
  await expect(page.getByText("Running cost, estimated")).toBeVisible();
  // The drawing of the report job is named for screen readers, no label runs past its edge, and none is under 12 px.
  const diagram = page.getByRole("img", { name: /when the phone drops out/ });
  await expect(diagram).toBeVisible();
  const labels = await diagram.evaluate((svg: SVGSVGElement) => {
    const width = svg.viewBox.baseVal.width;
    const scale = svg.getBoundingClientRect().width / width;
    const texts = [...svg.querySelectorAll("text")];
    return {
      count: texts.length,
      outside: texts.filter((t) => t.getBBox().x < 0 || t.getBBox().x + t.getBBox().width > width).map((t) => t.textContent),
      smallest: Math.min(...texts.map((t) => parseFloat(getComputedStyle(t).fontSize) * scale)),
    };
  });
  expect(labels.count).toBeGreaterThan(10);
  expect(labels.outside).toEqual([]);
  expect(labels.smallest).toBeGreaterThanOrEqual(11.95);
  await expectAccessible(page);

  await page.goto("/this-page-does-not-exist");
  await expect(page).toHaveTitle(/^Page not found · /);

  // The footer says what is fictional on every page.
  await expect(page.getByText("Sample by Bereket A. · fictional data")).toBeVisible();
});

test("no page scrolls sideways, on a phone or a desktop", async ({ page }) => {
  for (const path of ["/", "/code", "/sample-report", "/how-it-works", "/settings", "/admin", "/this-page-does-not-exist"]) {
    await page.goto(path);
    await expectNoSidewaysScroll(page);
  }
  await signInAsOwner(page);
  await expectNoSidewaysScroll(page);
  await page.goto("/admin/sessions/S-1038");
  await expect(page.getByRole("heading", { name: "Session S-1038" })).toBeVisible();
  await expectNoSidewaysScroll(page);
  // The reason for opening a transcript can be read in full, on a phone too.
  const reason = await page.getByLabel("Reason for opening").boundingBox();
  expect(reason!.width).toBeGreaterThan(280);

  const [code] = await buyCodes(page);
  await expectNoSidewaysScroll(page);
  await enterCode(page, code!);
  await expect(page).toHaveURL(/\/start$/);
  await expectNoSidewaysScroll(page);
  await page.getByLabel("Your first name").fill("Noor");
  await page.getByRole("button", { name: "Begin" }).click();
  await expect(page).toHaveURL(/\/session$/);
  await expectNoSidewaysScroll(page);
});

test("the API says plainly what it will not accept", async ({ page }) => {
  const [code] = await buyCodes(page);
  const post = async (url: string, data: unknown) => (await page.request.post(url, { data })).status();

  // An unknown pack is refused, and issues nothing.
  expect(await post("/api/purchase", { pack: "hundredPack" })).toBe(400);
  expect(await post("/api/purchase", {})).toBe(400);

  await enterCode(page, code!);
  await expect(page).toHaveURL(/\/start$/);
  expect(await post("/api/session/start", { firstName: "   " })).toBe(400);
  // A name made only of control characters and marks that reorder text is no name.
  expect(await post("/api/session/start", { firstName: "\u202E\u0000" })).toBe(400);
  expect(await post("/api/session/start", { firstName: "\u202ENoor\u0000" })).toBe(200);
  expect(await post("/api/session/answer", { questionId: "begin-1", text: "  " })).toBe(400);
  expect(await post("/api/session/answer", { questionId: "begin-1", text: "x".repeat(4001) })).toBe(400);
  expect(await post("/api/session/answer", { questionId: "focus-1", text: "Not the open question." })).toBe(409);

  await page.goto("/session");
  await expect(page.getByText("Welcome, Noor. Let's begin where your day begins.")).toBeVisible();
});
