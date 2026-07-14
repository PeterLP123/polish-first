import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/#home");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("starts and resumes a guided daily session", async ({ page }) => {
  await page.getByRole("button", { name: /start 15-minute session/i }).click();
  await expect(page.getByText(/step 1 of 11/i)).toBeVisible();
  await page.getByRole("button", { name: /reveal meaning/i }).click();
  await page.getByRole("button", { name: /i said it aloud/i }).click();
  await expect(page.getByText(/step 2 of 11/i)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/step 2 of 11/i)).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /daily session progress/i })).toHaveAttribute("aria-valuenow", "2");
});

test("keeps core pages within the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const hash of ["#home", "#practice", "#practice?mode=reading&topic=Travel", "#dialogues", "#data"]) {
    await page.goto(`/${hash}`);
    await expect(page.locator("main.content")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  }
});

test("opens the new practice modes from validated deep links", async ({ page }) => {
  await page.goto("/#practice?mode=reading&topic=Travel");
  await expect(page.getByRole("tab", { name: /reading/i })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("READ A PRACTICAL TEXT")).toBeVisible();
  await page.getByRole("tab", { name: /^write/i }).click();
  await expect(page.getByText("CONTROLLED WRITING")).toBeVisible();
  await page.getByRole("tab", { name: /grammar/i }).click();
  await expect(page.getByText("COMPLETE THE GAP", { exact: true })).toBeVisible();
});

test("migrates v4 progress and unlocks a completed-stage milestone", async ({ page }) => {
  const completedUnits = ["first-words", "meet-someone", "cafe", "directions", "shopping", "time-plans"];
  await page.goto("/#data");
  await page.evaluate((units) => localStorage.setItem("polish-first-progress", JSON.stringify({ version: 4, xp: 50, streak: 0, lastStudyDate: null, completedUnits: units, learnedPhrases: [], studyDates: [], phraseStats: {}, dialogueStats: {}, activeSession: null, dailyGoal: 15, todayMinutes: 0, totalReviews: 0 })), completedUnits);
  await page.reload();
  await expect(page.getByText(/Detailed insights tracked since/i)).toBeVisible();
  const starter = page.locator(".milestone-card").filter({ hasText: "Starter scenario check" });
  await expect(starter).toContainText("Ready");
  await starter.getByRole("button", { name: /start check/i }).click();
  await expect(page.getByText(/Task 1 of 10/i)).toBeVisible();
  await expect(page.getByRole("dialog", { name: /Starter scenario check milestone/i })).toBeVisible();
});

test("rejects an invalid progress import without changing XP", async ({ page }) => {
  await page.goto("/#data");
  await page.locator('input[type="file"]').setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from("not-json") });
  await expect(page.getByRole("alert")).toContainText("not valid JSON");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("polish-first-progress")).xp)).toBe(0);
});

test("exports progress and confirms a valid replacement", async ({ page }) => {
  await page.goto("/#data");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export progress/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^polish-first-progress-\d{4}-\d{2}-\d{2}\.json$/);

  const payload = {
    app: "polish-first",
    schemaVersion: 4,
    exportedAt: new Date().toISOString(),
    progress: { version: 4, xp: 77, streak: 0, lastStudyDate: null, completedUnits: [], learnedPhrases: [], studyDates: [], phraseStats: {}, dialogueStats: {}, activeSession: null, dailyGoal: 15, todayMinutes: 0, totalReviews: 0 },
  };
  await page.locator('input[type="file"]').setInputFiles({ name: "progress.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(payload)) });
  await expect(page.getByRole("heading", { name: /replace current progress/i })).toBeVisible();
  await page.getByRole("button", { name: /confirm import/i }).click();
  await expect(page.getByRole("status")).toContainText("imported successfully");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("polish-first-progress")).xp)).toBe(77);
});

test("opens every primary navigation destination without console errors", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  for (const hash of ["#home", "#course", "#practice", "#sounds", "#dialogues", "#grammar", "#data"]) {
    await page.goto(`/${hash}`);
    await expect(page.locator("main.content")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
