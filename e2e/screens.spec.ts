import path from "node:path";
import { expect, test } from "@playwright/test";
import { answer, answerToTheEnd, begin, buyCodes, enterCode, question, signInAsOwner } from "./helpers";

/**
 * Takes the screenshots used alongside the demo. Run against a deployment with
 * BASE_URL set; files go to SCREENS_DIR. One code is used on a phone and on a
 * desktop browser, so the desktop shots show the session the phone started.
 */
const out = process.env.SCREENS_DIR ?? path.join(process.cwd(), "test-results", "screens");
const shot = (name: string) => path.join(out, `guided-assessment-${name}.png`);

test("screenshots", async ({ browser }) => {
  test.setTimeout(240_000);
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const d = await desktop.newPage();
  const p = await phone.newPage();

  await d.goto("/");
  await d.evaluate(() => document.fonts.ready);
  await d.screenshot({ animations: "disabled", path: shot("home-desktop") });

  const [code] = await buyCodes(d, "two-pack");
  expect(code).toBeTruthy();

  await enterCode(p, code!);
  await expect(p).toHaveURL(/\/start$/);
  await p.getByLabel("Your first name").fill("Maren");
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ animations: "disabled", path: shot("start-phone"), fullPage: true });
  await begin(p, "Maren");

  await answer(p);
  await answer(p);
  await answer(p);
  await expect(p.getByTestId("progress-text")).toContainText("Part 2 of 5");
  await p.getByLabel("Your answer").fill("Mostly messages, and short meetings scattered through the day. When it happens I write one line about where I was");
  await p.screenshot({ animations: "disabled", path: shot("question-phone"), fullPage: true });

  // The same code on another device opens the same question.
  await enterCode(d, code!);
  await expect(d).toHaveURL(/\/session$/);
  await expect(question(d)).toHaveText((await question(p).textContent())!);
  await d.getByLabel("Your answer").fill("Mostly messages, and short meetings scattered through the day. When it happens I write one line about where I was, deal with the interruption, and come back to the line.");
  await d.screenshot({ animations: "disabled", path: shot("question-desktop") });

  await answerToTheEnd(p);
  await expect(p.getByRole("heading", { name: "Preparing your results" })).toBeVisible();
  await expect(p.locator('li[data-state="done"]').first()).toBeVisible({ timeout: 20_000 });
  await p.screenshot({ animations: "disabled", path: shot("preparing-phone"), fullPage: true });

  await expect(p).toHaveURL(/\/report$/, { timeout: 60_000 });
  await expect(p.getByRole("heading", { name: "Your Working Style Reflection" })).toBeVisible();
  await p.waitForLoadState("networkidle");
  await p.screenshot({ animations: "disabled", path: shot("report-phone"), fullPage: true });

  await d.goto("/report");
  await expect(d.getByRole("heading", { name: "Your Working Style Reflection" })).toBeVisible();
  await d.waitForLoadState("networkidle");
  await d.screenshot({ animations: "disabled", path: shot("report-desktop") });
  await d.screenshot({ animations: "disabled", path: shot("report-desktop-full"), fullPage: true });

  await signInAsOwner(d);
  await d.screenshot({ animations: "disabled", path: shot("admin-desktop") });

  await desktop.close();
  await phone.close();
});
