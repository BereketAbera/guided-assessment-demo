import { expect, test } from "@playwright/test";
import { answer, answerToTheEnd, begin, buyCodes, enterCode, question, readyMadeCode, signInAsOwner } from "./helpers";

/**
 * Runs against a deployment (BASE_URL). Two separate browser contexts stand in
 * for two devices: they share no cookies and no storage, so anything the
 * second one shows came from the server by way of the access code.
 */
test("live: resume on another device, a job that outlives the page, deletion, and a closed admin", async ({ browser }) => {
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const laptop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const a = await phone.newPage();
  const b = await laptop.newPage();

  const [code] = await buyCodes(a);

  await test.step("the ready-made \"Partway through\" code resumes on a device that never saw it", async () => {
    const partway = await readyMadeCode(a, /Partway through/);
    await enterCode(b, partway);
    await expect(b).toHaveURL(/\/session$/);
    await expect(b.getByTestId("progress-text")).toContainText("Part 3 of 5");
    await expect(b.getByTestId("welcome-back")).toContainText("Welcome back, Tobias. Your 4 answers are saved.");
    await b.getByRole("button", { name: "Take a break" }).click();
    await b.getByRole("button", { name: "Leave for now" }).click();
    await expect(b).toHaveURL(/\/code\?left=1$/);
    // Back does not bring the conversation back from the browser's memory.
    await b.goBack();
    await expect(b.locator("#question")).toHaveCount(0);
  });

  await enterCode(a, code!);
  await begin(a, "Noor");
  await answer(a);
  await answer(a);
  const third = (await question(a).textContent())!;
  expect(third).toContain("fully absorbed");

  await test.step("the same code on another device opens the same question", async () => {
    await enterCode(b, code!);
    await expect(b).toHaveURL(/\/session$/);
    await expect(question(b)).toHaveText(third);
    await expect(b.getByRole("button", { name: "Your answers so far (2)" })).toBeVisible();
    await expect(b.getByTestId("progress-text")).toContainText("Part 2 of 5");
  });

  await test.step("an answer given on the second device is there on the first", async () => {
    await answer(b);
    await a.reload();
    await expect(a.getByRole("button", { name: "Your answers so far (3)" })).toBeVisible();
    await expect(question(a)).toHaveText((await question(b).textContent())!);
  });

  await test.step("the report job survives a refresh and is the same job on both devices", async () => {
    await answerToTheEnd(a);
    await a.reload();
    await expect(a).toHaveURL(/\/preparing$/);
    await expect(a.getByTestId("job-status")).toContainText(/second/);
    await b.goto("/preparing");
    await expect(b.getByRole("heading", { name: "Preparing your results" })).toBeVisible();
    await a.close();
    await expect(b).toHaveURL(/\/report$/, { timeout: 60_000 });
    await expect(b.getByText("Prepared for Noor")).toBeVisible();
  });

  const again = await phone.newPage();
  await test.step("the code opens the finished report after the page was closed", async () => {
    await enterCode(again, code!);
    await expect(again).toHaveURL(/\/report$/);
    await expect(again.getByRole("heading", { level: 1, name: "Your Working Style Reflection" })).toBeVisible();
  });

  await test.step("the admin list shows the session without any answer text", async () => {
    await signInAsOwner(again);
    const row = again.getByTestId("session-row").filter({ hasText: code!.slice(0, 4) });
    await expect(row).toContainText("Report ready");
    const html = await again.content();
    for (const word of ["notebook", "Dana", "Noor"]) expect(html).not.toContain(word);
  });

  await test.step("the second device, holding only the code, cannot act as the owner", async () => {
    const sealed = (await laptop.cookies()).find((c) => c.name === "ga_sess")!.value;
    const buyerRef = (await phone.cookies()).find((c) => c.name === "ga_sb")!.value;
    expect(sealed).not.toContain(buyerRef);
    expect((await b.request.post("/api/admin/codes", { data: { note: "x" } })).status()).toBe(401);
    expect((await b.request.post("/api/admin/sessions/S-1043/transcript", { data: { reason: "curious" } })).status()).toBe(401);
    // The owner's own request without a reason is refused too.
    expect((await again.request.post("/api/admin/sessions/S-1043/transcript", { data: {} })).status()).toBe(400);
  });

  await test.step("delete my answers removes them for every device", async () => {
    await again.goto("/report");
    await again.getByRole("button", { name: "Delete my answers" }).click();
    await again.getByRole("button", { name: "Delete everything" }).click();
    await expect(again).toHaveURL(/\/code\?deleted=1$/);
    // Back does not show the deleted report again.
    await again.goBack();
    await expect(again.getByText("Prepared for")).toHaveCount(0);
    await expect(again.getByText("Your key statement")).toHaveCount(0);
    await b.reload();
    await expect(b).toHaveURL(/\/code$/);
    await enterCode(b, code!);
    await expect(b.getByRole("alert").filter({ hasText: "This code has already been used" })).toBeVisible();
  });

  await test.step("reset removes the sample space", async () => {
    await again.goto("/");
    await again.getByRole("button", { name: "Reset demo" }).click();
    await again.getByRole("button", { name: "Delete and start again" }).click();
    await expect(again.getByRole("button", { name: /Demo inbox/ })).toContainText("0");
    await enterCode(b, code!);
    await expect(b.getByRole("alert").filter({ hasText: "We can't find that code" })).toBeVisible();
  });

  await phone.close();
  await laptop.close();
});
