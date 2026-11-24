import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Simulated purchase on the sales page. Returns the code or codes shown on screen. */
export async function buyCodes(page: Page, pack: "single" | "two-pack" = "single"): Promise<string[]> {
  await page.goto("/#buy");
  await page.getByRole("button", { name: `Buy ${pack}` }).click();
  const issued = page.getByTestId("issued-code");
  await expect(issued.first()).toBeVisible();
  return issued.allTextContents();
}

export async function enterCode(page: Page, code: string): Promise<void> {
  await page.goto("/code");
  await page.getByLabel("Access code").fill(code);
  await page.getByRole("button", { name: "Continue" }).click();
}

export async function begin(page: Page, firstName: string): Promise<void> {
  await expect(page).toHaveURL(/\/start$/);
  await page.getByLabel("Your first name").fill(firstName);
  await page.getByRole("button", { name: "Begin" }).click();
  await expect(page).toHaveURL(/\/session$/);
}

export function question(page: Page) {
  return page.locator("#question");
}

/** Answers the question on screen and waits for the next one (or for the waiting screen). */
export async function answer(page: Page, text?: string): Promise<void> {
  const before = await question(page).textContent();
  if (text === undefined) await page.getByRole("button", { name: /Use an example answer/ }).click();
  else await page.getByLabel("Your answer").fill(text);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect
    .poll(async () => (page.url().endsWith("/session") ? await question(page).textContent() : "left"), { timeout: 15_000 })
    .not.toBe(before);
}

/** Answers with the sample shortcut until the conversation hands over to the waiting screen. */
export async function answerToTheEnd(page: Page): Promise<void> {
  for (let i = 0; i < 25 && page.url().endsWith("/session"); i++) await answer(page);
  await expect(page).toHaveURL(/\/preparing$/);
}

export async function expectAccessible(page: Page): Promise<void> {
  // After a client-side navigation the page title arrives a moment after the content.
  await expect(page).toHaveTitle(/\S/);
  // Let entrance animations finish first, so text is checked at its resting colour.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
    `accessibility violations on ${page.url()}`,
  ).toEqual([]);
}

/** Nothing on the page may be wider than the screen: a phone must never have to pan sideways. */
export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const size = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    screen: document.documentElement.clientWidth,
  }));
  expect(size.content, `sideways scroll on ${page.url()}`).toBeLessThanOrEqual(size.screen);
}

/** Reads one of the ready-made codes from the demo inbox. */
export async function readyMadeCode(page: Page, label: RegExp): Promise<string> {
  await page.getByRole("button", { name: /Demo inbox/ }).click();
  const row = page.getByRole("dialog").getByTestId("inbox-code-row").filter({ hasText: label });
  const code = (await row.getByTestId("inbox-code").textContent())!.trim();
  await page.getByRole("button", { name: "Close" }).click();
  return code;
}

export async function signInAsOwner(page: Page): Promise<void> {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Sign in as the demo owner" }).click();
  await expect(page.getByRole("heading", { name: "Codes and sessions" })).toBeVisible();
}
