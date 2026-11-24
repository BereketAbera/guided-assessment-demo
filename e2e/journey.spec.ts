import { expect, test } from "@playwright/test";
import { answer, answerToTheEnd, begin, buyCodes, enterCode, expectAccessible, question } from "./helpers";

test("the whole journey from a code to the report", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("unhurried hour");
  await expect(page.getByText(/No AI model is called/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Try it in five minutes" })).toBeVisible();
  await expectAccessible(page);

  const [code] = await buyCodes(page);
  expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  // The confirmation is on screen where the button was tapped, on a phone too, and the button no longer buys by accident.
  await expect(page.getByTestId("purchase-result")).toContainText("Payment simulated");
  await expect(page.getByTestId("purchase-result")).toBeInViewport({ ratio: 0.9 });
  await expect(page.getByTestId("purchase-result")).toBeFocused();
  await expect(page.getByRole("button", { name: "Buy another single" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buy single", exact: true })).toHaveCount(0);

  // The code "arrives by email": it is in the demo inbox.
  await page.getByRole("button", { name: /Demo inbox/ }).click();
  await expect(page.getByRole("dialog").getByTestId("inbox-code").first()).toHaveText(code!);
  await expectAccessible(page);
  await page.getByRole("dialog").getByRole("button", { name: "Use this code" }).first().click();

  await expect(page).toHaveURL(/\/code$/);
  await expect(page.getByLabel("Access code")).toHaveValue(code!);
  await expectAccessible(page);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByText("About 45 to 60 minutes.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What happens to your answers" })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Begin" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Enter your first name" })).toBeVisible();
  await begin(page, "Noor");

  // One question on the screen, progress by part, the right dictation hint for the device.
  await expect(question(page)).toContainText("first hour look like");
  await expect(page.getByTestId("progress-text")).toHaveText("Part 1 of 5 · about 50 minutes left");
  await expect(page.locator("#question")).toHaveCount(1);
  await expect(
    page.getByText(info.project.name === "phone" ? "Tap the microphone on your keyboard to speak." : "Type, or use your device's dictation."),
  ).toBeVisible();
  // The screen says, where the answer is written, that the guide here is rules and not a model.
  await expect(page.getByTestId("sample-note")).toContainText("picked by simple word rules, not written by a model");
  await expectAccessible(page);

  // An empty answer is not sent.
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Write an answer" })).toBeVisible();

  // A very short answer gets one follow-up; the guide reflects it back.
  await answer(page, "It was quiet.");
  await expect(question(page)).toContainText("one small thing in that first hour");
  await expect(page.getByTestId("save-state")).toContainText(/Saved \d/);
  await answer(page, "I wrote my plan in a notebook before opening my inbox, which I rarely manage to do.");
  await expect(page.getByTestId("reflection")).toHaveText("You like to see the shape of the day before you step into it.");
  await expect(page.getByTestId("sample-note")).toHaveText("Sample: this line is picked by word rules, not written by a model.");
  await expect(page.getByTestId("progress-text")).toHaveText("Part 1 of 5 · about 45 minutes left");

  // Answers so far are a drawer, not the main view.
  await page.getByRole("button", { name: "Your answers so far (2)" }).click();
  await expect(page.getByRole("dialog")).toContainText("It was quiet.");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Close" }).click();

  await answerToTheEnd(page);

  await expect(page.getByRole("heading", { name: "Preparing your results" })).toBeVisible();
  await expect(page.getByText("Reading your answers").first()).toBeVisible();
  await expect(page.getByText("You can close this page.")).toBeVisible();
  await expect(page.getByTestId("sample-note")).toContainText("assembled by simple rules");
  await expectAccessible(page);

  // Back from the waiting screen does not reopen the last question.
  await page.goBack();
  await expect(page).toHaveURL(/\/(preparing|report)$/);
  await expect(page.locator("#question")).toHaveCount(0);

  await expect(page).toHaveURL(/\/report$/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Your Working Style Reflection" })).toBeVisible();
  await expect(page.getByText("Prepared for Noor")).toBeVisible();
  await expect(page.locator("blockquote").first()).toContainText("You do your best work when");
  await expect(page.getByRole("img", { name: /Profile figure/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What to do next" })).toBeVisible();
  // The quote is the sentence that shows the pattern, not the throwaway first answer.
  await expect(page.getByText("“I wrote my plan in a notebook before opening my inbox, which I rarely manage to do.”")).toBeVisible();
  await expect(page.getByText("“It was quiet.”")).toHaveCount(0);
  await expect(page.getByTestId("sample-note")).toContainText("assembled by simple rules from words in your answers");
  await expectAccessible(page);

  // The PDF is this page printed: the screen chrome is gone, the report stays.
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Save as PDF" })).toBeHidden();
  await expect(page.getByTestId("sample-note")).toBeHidden();
  await expect(page.getByRole("button", { name: "Delete my answers" })).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Your Working Style Reflection" })).toBeVisible();
  await page.emulateMedia({ media: "screen" });

  await page.getByRole("button", { name: "Email me a copy" }).click();
  await expect(page.getByTestId("mail-state")).toContainText("Sent.");
  await page.getByRole("button", { name: /Demo inbox/ }).click();
  await expect(page.getByRole("dialog")).toContainText("A copy of your report");
  await expect(page.getByRole("dialog")).toContainText("Your report is ready");

  // The "report is ready" message opens the report, as the link in the real email would.
  await page.goto("/");
  await page.getByRole("button", { name: /Demo inbox/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Open your report" }).first().click();
  await expect(page).toHaveURL(/\/report$/);
  await expect(page.getByText("Prepared for Noor")).toBeVisible();
});

test("answers typed in the visitor's own words are not turned into their opposite", async ({ page }) => {
  const [code] = await buyCodes(page);
  await enterCode(page, code!);
  await begin(page, "Sam");
  await answer(page, "Honestly I never plan anything and I hate lists. I get going and see what the day brings me.");
  await expect(page.getByTestId("reflection")).toHaveText("Thank you. That gives a clear picture of how your day begins.");
  await answer(page, "I do not read the brief. I just start and fix it later, which works more often than people think.");
  await expect(page.getByTestId("reflection")).toHaveText("You find your way by starting, more than by planning.");
  // Parts two and three get throwaway answers (each short one draws a follow-up), which brings up the pressure question.
  for (let i = 0; i < 8; i++) await answer(page, "test");
  await expect(question(page)).toContainText("too much landed at once");
  await answer(page, "I am not calm and I do not make lists. I panic for a day, then work through the weekend.");
  await expect(page.getByTestId("reflection")).toHaveText("You found another gear when the deadline came close.");
  for (let i = 0; i < 20 && page.url().endsWith("/session"); i++) await answer(page, "asdf");
  await expect(page).toHaveURL(/\/report$/, { timeout: 60_000 });

  // Two parts leaned, and the report says so; the rest it leaves alone.
  await expect(page.getByText("Prepared for Sam")).toBeVisible();
  await expect(page.getByText("The Deliberate Starter")).toHaveCount(0);
  await expect(page.getByText("You begin by understanding.")).toHaveCount(0);
  await expect(page.getByText("Reaches for order when the week fills up.")).toHaveCount(0);
  await expect(page.getByText("Finds another gear near the deadline.")).toBeVisible();
  await expect(page.getByText("“I panic for a day, then work through the weekend.”")).toBeVisible();
  await expect(page.getByText("Your answers did not lean strongly either way here.")).toHaveCount(3);
  await expect(page.getByText("“test”")).toHaveCount(0);
  await expect(page.getByText("“asdf”")).toHaveCount(0);
});

test("resume in the middle: reload, take a break, and another device", async ({ page, browser }) => {
  const [code] = await buyCodes(page);
  await enterCode(page, code!);
  await begin(page, "Noor");
  await answer(page);
  await answer(page);
  await answer(page);
  const where = await question(page).textContent();
  expect(where).toContain("What pulls you out");

  // A draft survives a reload, and so does the place.
  await page.getByLabel("Your answer").fill("Half an answer that I have not sent yet");
  await page.reload();
  await expect(question(page)).toHaveText(where!);
  await expect(page.getByLabel("Your answer")).toHaveValue("Half an answer that I have not sent yet");
  await expect(page.getByRole("button", { name: "Your answers so far (3)" })).toBeVisible();
  await expect(page.getByTestId("progress-text")).toContainText("Part 2 of 5");

  // Take a break closes the session on this device; the code brings it back.
  await page.getByRole("button", { name: "Take a break" }).click();
  await expect(page.getByRole("dialog")).toContainText("Your place is kept");
  // A draft is still on this device: the dialog says so and offers to take it along.
  await expect(page.getByRole("dialog")).toContainText("stays in this browser only");
  await page.getByRole("button", { name: "Leave and remove what I was typing" }).click();
  await expect(page).toHaveURL(/\/code\?left=1$/);
  expect(await page.evaluate(() => Object.keys(window.localStorage).filter((k) => k.startsWith("ga:draft:")))).toEqual([]);
  // Back must not bring the conversation, or any answer, back from the browser's memory.
  await page.goBack();
  await expect(page).toHaveURL(/\/code$/);
  await expect(page.locator("#question")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Your answers so far/ })).toHaveCount(0);
  await page.goto("/session");
  await expect(page).toHaveURL(/\/code$/);
  await enterCode(page, code!.toLowerCase().replace("-", " "));
  await expect(page).toHaveURL(/\/session$/);
  await expect(question(page)).toHaveText(where!);
  // Coming back is acknowledged: by name, with the number of answers kept.
  await expect(page.getByTestId("welcome-back")).toContainText("Welcome back, Noor. Your 3 answers are saved. You stopped here today at");

  // Leave again from the resumed session, and press Back: still nothing.
  await page.getByRole("button", { name: "Take a break" }).click();
  await page.getByRole("button", { name: "Leave for now" }).click();
  await expect(page).toHaveURL(/\/code\?left=1$/);
  await page.goBack();
  await expect(page.locator("#question")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Your answers so far/ })).toHaveCount(0);
  await enterCode(page, code!);
  await expect(question(page)).toHaveText(where!);

  // A second browser with no shared cookies or storage: the code alone is enough.
  const other = await browser.newContext();
  const second = await other.newPage();
  await enterCode(second, code!);
  await expect(second).toHaveURL(/\/session$/);
  await expect(question(second)).toHaveText(where!);
  await expect(second.getByRole("button", { name: "Your answers so far (3)" })).toBeVisible();
  await expect(second.getByLabel("Your answer")).toHaveValue("");
  await answer(second);
  await other.close();

  // The first device still shows the question the second one answered. Different words sent from here are not
  // saved over the first answer, and the screen says so and keeps them in view.
  await page.getByLabel("Your answer").fill("A different answer, typed on the stale screen of the first device.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByTestId("superseded")).toContainText("already answered on another device");
  await expect(page.getByTestId("superseded")).toContainText("A different answer, typed on the stale screen of the first device.");
  await expect(page.getByTestId("save-state")).not.toContainText("Saved");
  await expect(question(page)).not.toHaveText(where!);

  // After a reload, the answer given on the second device is the one that was kept.
  await page.reload();
  await page.getByRole("button", { name: "Your answers so far (4)" }).click();
  await expect(page.getByRole("dialog")).not.toContainText("typed on the stale screen");
});

test("offline: the banner appears and the draft is kept", async ({ page, context }) => {
  const [code] = await buyCodes(page);
  await enterCode(page, code!);
  await begin(page, "Noor");
  await page.getByLabel("Your answer").fill("An answer typed just before the signal dropped, long enough to matter.");
  await context.setOffline(true);
  await expect(page.getByRole("status").filter({ hasText: "You're offline." })).toBeVisible();
  // Continue waits for the connection; the draft stays in the field and on the device.
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Your answer")).toHaveValue(/signal dropped/);
  expect(await page.evaluate(() => Object.values(window.localStorage).join(" "))).toContain("signal dropped");
  await expect(question(page)).toContainText("first hour look like");
  await context.setOffline(false);
  await expect(page.getByText("You're offline.")).toBeHidden();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeEnabled();
  await answer(page, "An answer typed just before the signal dropped, long enough to matter.");
  await expect(page.getByRole("button", { name: "Your answers so far (1)" })).toBeVisible();
});

test("preparing survives a refresh and a closed page; then delete my answers", async ({ page, context }) => {
  const [code] = await buyCodes(page);
  await enterCode(page, code!);
  await begin(page, "Noor");
  await answerToTheEnd(page);

  // Refresh during the wait: still preparing, with the stages.
  await page.reload();
  await expect(page).toHaveURL(/\/preparing$/);
  await expect(page.getByRole("heading", { name: "Preparing your results" })).toBeVisible();
  await expect(page.getByTestId("job-status")).toContainText(/second/);

  // Close the page mid-wait. Nothing in the browser is doing the work.
  await page.close();
  const later = await context.newPage();
  await later.waitForTimeout(9_000);
  await later.goto("/preparing");
  await expect(later.locator('li[data-state="done"]').first()).toBeVisible();
  await later.close();

  // Come back with the code after it has finished: straight to the report.
  const back = await context.newPage();
  await back.waitForTimeout(19_000);
  await enterCode(back, code!);
  await expect(back).toHaveURL(/\/report$/);
  await expect(back.getByText("Prepared for Noor")).toBeVisible();
  await expect(back.getByRole("heading", { name: "Your answers, and who can read them" })).toBeVisible();

  // Delete my answers really deletes them.
  await back.getByRole("button", { name: "Delete my answers" }).click();
  await expect(back.getByRole("dialog")).toContainText("can't be undone");
  await back.getByRole("button", { name: "Delete everything" }).click();
  await expect(back).toHaveURL(/\/code\?deleted=1$/);
  await expect(back.getByText("Your answers and report have been deleted.")).toBeVisible();
  // Back must not show the deleted report again from the browser's memory.
  await back.goBack();
  await expect(back).toHaveURL(/\/code$/);
  await expect(back.getByText("Prepared for")).toHaveCount(0);
  await expect(back.getByText("Your key statement")).toHaveCount(0);
  await back.goto("/report");
  await expect(back).toHaveURL(/\/code$/);
  await enterCode(back, code!);
  await expect(back.getByRole("alert").filter({ hasText: "This code has already been used" })).toBeVisible();
  await expect(back).toHaveURL(/\/code$/);

  // The owner sees that it happened, and there is nothing left to open.
  await back.goto("/admin");
  await back.getByRole("button", { name: "Sign in as the demo owner" }).click();
  const row = back.getByTestId("session-row").filter({ hasText: code!.slice(0, 4) });
  await expect(row).toContainText("Answers deleted");
  await expect(back.getByTestId("access-log")).toContainText("The customer deleted their answers and report.");
  await row.getByRole("link").click();
  await expect(back.getByText("There is nothing to open: this session holds no answers.")).toBeVisible();
});
