import path from "node:path";
import { expect, test } from "@playwright/test";
import { answer, answerToTheEnd, begin, buyCodes, enterCode, question, signInAsOwner } from "./helpers";

/**
 * Takes the screenshots used alongside the demo. Run against a deployment with
 * BASE_URL set; files go to SCREENS_DIR. One code is used on a phone and on a
 * desktop browser, so the desktop shots show the session the phone started.
 * The question is the first screen of a phone, not the whole page, so the picture
 * is what the customer sees without scrolling. The waiting screen runs a little
 * further, to the end of "You can close this page".
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
  // The phone's clock reads 4:21 PM, so the "Saved" time in the question picture is the same on every retake.
  const today = new Date();
  await p.clock.setFixedTime(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 21));

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

  // Seven answers in: a short question in part 4, so the first screen of a phone holds everything down to the saved mark.
  for (let i = 0; i < 7; i++) await answer(p);
  await expect(p.getByTestId("progress-text")).toContainText("Part 4 of 5");
  await p.getByLabel("Your answer").fill("Clear priorities and a bit of quiet. I need someone to tell me what matters most and then");
  await expect(p.getByTestId("save-state")).toBeInViewport({ ratio: 1 });
  await p.screenshot({ animations: "disabled", path: shot("question-phone") });

  // The same code on another device opens the same question.
  await enterCode(d, code!);
  await expect(d).toHaveURL(/\/session$/);
  await expect(question(d)).toHaveText((await question(p).textContent())!);
  await d.getByLabel("Your answer").fill("Clear priorities and a bit of quiet. I need someone to tell me what matters most and then leave me to it. Check in once a day, not once an hour.");
  await d.screenshot({ animations: "disabled", path: shot("question-desktop") });

  await answerToTheEnd(p);
  await expect(p.getByRole("heading", { name: "Preparing your results" })).toBeVisible();
  await expect(p.locator('li[data-state="done"]').first()).toBeVisible({ timeout: 20_000 });
  // The waiting screen is a little longer than a phone's first screen. The picture runs from the top of the page
  // to just under "You can close this page", so the status box and that line are whole and the edge falls between paragraphs.
  const closeLine = p.getByText("You can close this page.").locator("xpath=..");
  const closeBox = (await closeLine.boundingBox())!;
  const waitHeight = Math.ceil(closeBox.y + closeBox.height + 6);
  await p.setViewportSize({ width: 390, height: waitHeight });
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.screenshot({ animations: "disabled", path: shot("preparing-phone") });
  await p.setViewportSize({ width: 390, height: 844 });

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
