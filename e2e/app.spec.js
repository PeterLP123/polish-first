import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function revealPracticeModes(page) {
  const chooser = page.getByRole("button", { name: /choose another drill/i });
  const mobileChooser = await page.evaluate(() => window.matchMedia("(max-width: 900px)").matches);
  if (!mobileChooser) return;
  await expect(chooser).toBeVisible();
  if (await chooser.getAttribute("aria-expanded") !== "true") await chooser.click();
  await expect(page.getByRole("button", { name: /hide drill choices/i })).toHaveAttribute("aria-expanded", "true");
}

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

test("finishes a bounded Focus Review and repairs tough phrases once", async ({ page }) => {
  await page.getByRole("button", { name: /explore sample progress/i }).click();
  await page.evaluate(() => { window.location.hash = "#practice"; });
  await expect(page.getByRole("heading", { name: /make it stick/i })).toBeVisible();
  await page.getByRole("button", { name: /start Focus review/i }).click();

  for (let index = 0; index < 10; index += 1) {
    await page.getByRole("button", { name: /reveal Polish/i }).click();
    const rating = index === 0 ? /^Again/i : index === 1 ? /^Hard/i : /^Good/i;
    await page.getByRole("button", { name: rating }).click();
  }

  await expect(page.getByRole("heading", { name: /weak spots identified/i })).toBeVisible();
  const summary = page.locator(".focus-summary-grid article");
  await expect(summary.nth(0)).toContainText("8Recalled");
  await expect(summary.nth(1)).toContainText("1Hard");
  await expect(summary.nth(2)).toContainText("1Missed");
  await page.getByRole("button", { name: /review 2 tough phrases/i }).click();

  await page.getByRole("button", { name: /reveal Polish/i }).click();
  await page.getByRole("button", { name: /next tough phrase/i }).click();
  await page.getByRole("button", { name: /reveal Polish/i }).click();
  await page.getByRole("button", { name: /finish repair/i }).click();

  await expect(page.getByRole("heading", { name: /repair pass complete/i })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("polish-first-progress")));
  expect(saved).toMatchObject({ version: 7, xp: 0, totalReviews: 0 });
});

test("completes a Conversation Mission while keeping drafts ephemeral and progress on v7", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#dialogues");
  await page.getByRole("button", { name: /start challenge/i }).click();
  await expect(page.getByRole("progressbar", { name: /conversation mission progress/i })).toHaveAttribute("aria-valuenow", "1");
  await expect(page.locator(".bottom-nav")).toBeHidden();
  await expect(page.locator(".mission-incoming h1")).toBeInViewport();
  const actionHeights = await page.locator(".mission-response-actions button").evaluateAll((buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().height)));
  expect(actionHeights.every((height) => height >= 44 && height <= 64), `mission actions should stay compact: ${actionHeights.join(", ")}`).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  const activeAxe = await new AxeBuilder({ page }).analyze();
  expect(activeAxe.violations.map((violation) => ({ id: violation.id, impact: violation.impact }))).toEqual([]);

  const privateDraft = "Mój prywatny szkic 7x";
  await page.getByRole("textbox", { name: /optional Polish draft/i }).fill(privateDraft);
  await page.getByRole("button", { name: /compare my Polish/i }).click();
  await page.getByRole("button", { name: /^I needed the model$/i }).click();

  await page.getByRole("button", { name: /give me a hint/i }).click();
  await page.getByRole("button", { name: /answered aloud/i }).click();
  await page.getByRole("button", { name: /my response worked/i }).click();

  for (let turn = 0; turn < 3; turn += 1) {
    await page.getByRole("button", { name: /answered aloud/i }).click();
    await page.getByRole("button", { name: /my response worked/i }).click();
  }

  await expect(page.getByRole("heading", { name: /I can order and pay in a Polish café/i })).toBeVisible();
  const summary = page.locator(".mission-summary-grid article");
  await expect(summary.nth(0)).toContainText("3Independent");
  await expect(summary.nth(1)).toContainText("1Supported");
  await expect(summary.nth(2)).toContainText("1Modelled");
  await expect(page.locator(".bottom-nav")).toBeHidden();

  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("polish-first-progress")))).toMatchObject({
    version: 7,
    xp: 60,
    totalReviews: 0,
    activeSession: null,
    dialogueStats: { cafe: { completions: 1, bestMistakes: 1 } },
  });
  const storageAudit = await page.evaluate((draft) => {
    const raw = localStorage.getItem("polish-first-progress");
    return { raw, keys: Object.keys(JSON.parse(raw)).sort(), containsDraft: raw.includes(draft) };
  }, privateDraft);
  expect(storageAudit.containsDraft).toBe(false);
  expect(storageAudit.keys).toEqual([
    "activeSession", "analyticsSince", "assessmentHistory", "completedUnits", "dailyGoal", "dailyStats", "dialogueStats",
    "lastStudyDate", "learnedPhrases", "learnerProfile", "milestoneStats", "phraseStats", "skillStats", "streak",
    "studyDates", "todayMinutes", "totalReviews", "version", "xp",
  ]);

  await page.getByRole("button", { name: /repair 1 turn/i }).click();
  await expect(page.locator(".bottom-nav")).toBeHidden();
  await page.getByRole("button", { name: /answered aloud/i }).click();
  await expect(page.locator(".mission-model-card.primary strong")).toHaveText("Poproszę kawę z mlekiem.");
  await page.getByRole("button", { name: /recalled it this time/i }).click();
  await expect(page.getByText(/retrieved 1 previously modelled turn/i)).toBeVisible();
  await expect(page.locator(".bottom-nav")).toBeHidden();

  const afterRepair = await page.evaluate(() => JSON.parse(localStorage.getItem("polish-first-progress")));
  expect(afterRepair).toMatchObject({ xp: 60, dialogueStats: { cafe: { completions: 1, bestMistakes: 1 } } });
  const summaryAxe = await new AxeBuilder({ page }).analyze();
  expect(summaryAxe.violations.map((violation) => ({ id: violation.id, impact: violation.impact }))).toEqual([]);
  await page.getByRole("button", { name: /choose another scene/i }).click();
  await expect(page.getByRole("dialog", { name: /choose a conversation scene/i })).toBeVisible();
  await expect(page.locator(".bottom-nav")).toBeVisible();
});

test("treats a fully modelled mission as study, not productive speaking evidence", async ({ page }) => {
  await page.goto("/#dialogues");
  await page.getByRole("button", { name: /start challenge/i }).click();
  for (let turn = 0; turn < 5; turn += 1) {
    await page.getByRole("button", { name: /show me a model/i }).click();
    await page.getByRole("button", { name: /studied the model/i }).click();
  }
  await expect(page.getByRole("heading", { level: 1, name: /I can order and pay in a Polish café/i })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("polish-first-progress")))).toMatchObject({
    version: 7,
    xp: 20,
    todayMinutes: 6,
    dialogueStats: { cafe: { completions: 1, bestMistakes: 5 } },
    skillStats: {},
  });
});

test("records productive typed mission work as writing rather than speaking", async ({ page }) => {
  await page.goto("/#dialogues");
  await page.getByRole("button", { name: /start challenge/i }).click();
  await page.getByRole("textbox", { name: /optional Polish draft/i }).fill("Poproszę kawę z mlekiem.");
  await page.getByRole("button", { name: /compare my Polish/i }).click();
  await page.getByRole("button", { name: /my response worked/i }).click();

  for (let turn = 0; turn < 4; turn += 1) {
    await page.getByRole("button", { name: /show me a model/i }).click();
    await page.getByRole("button", { name: /studied the model/i }).click();
  }

  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("polish-first-progress")))).toMatchObject({
    xp: 30,
    todayMinutes: 6,
    dialogueStats: { cafe: { completions: 1, bestMistakes: 4 } },
    skillStats: { "dialogue:cafe": { writing: { attempts: 1, points: 1, lastScore: 1 } } },
  });
  const dialogueEvidence = await page.evaluate(() => JSON.parse(localStorage.getItem("polish-first-progress")).skillStats["dialogue:cafe"]);
  expect(dialogueEvidence.speaking).toBeUndefined();
});

test("keeps the 320px mission entry compact and clear of fixed navigation", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/#dialogues");
  const challenge = page.getByRole("button", { name: /challenge polish first/i });
  const supported = page.getByRole("button", { name: /supported choices visible/i });
  await expect(challenge).toBeVisible();
  const [challengeBox, supportedBox, navBox, startBox] = await Promise.all([
    challenge.boundingBox(),
    supported.boundingBox(),
    page.locator(".bottom-nav").boundingBox(),
    page.getByRole("button", { name: /start challenge/i }).boundingBox(),
  ]);
  expect(Math.abs(challengeBox.y - supportedBox.y)).toBeLessThanOrEqual(2);
  for (const control of [challengeBox, supportedBox]) {
    expect(control.y + control.height <= navBox.y || control.y >= navBox.y + navBox.height).toBe(true);
  }
  expect(startBox.y, "Start Challenge should not be buried more than 1.5 viewports down").toBeLessThan(1050);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("keeps the Supported walkthrough focused, keyboard-clean and modal-safe on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/#dialogues");
  await page.getByRole("button", { name: /supported choices visible/i }).click();

  const firstHeading = page.getByRole("heading", { name: /Dzień dobry. Co podać/i });
  await expect(firstHeading).toBeFocused();
  await expect(page.locator(".bottom-nav")).toBeHidden();
  await expect(page.getByRole("button", { name: /exit walkthrough/i })).toBeVisible();
  const initialAxe = await new AxeBuilder({ page }).analyze();
  expect(initialAxe.violations.map((violation) => ({ id: violation.id, impact: violation.impact }))).toEqual([]);

  const choices = page.locator(".response-options button");
  await choices.first().click();
  const continueButton = page.getByRole("button", { name: /continue/i });
  await expect(continueButton).toBeFocused();
  await expect(continueButton).toBeInViewport();
  for (let index = 0; index < await choices.count(); index += 1) await expect(choices.nth(index)).toBeDisabled();
  const feedbackAxe = await new AxeBuilder({ page }).analyze();
  expect(feedbackAxe.violations.map((violation) => ({ id: violation.id, impact: violation.impact }))).toEqual([]);

  await continueButton.click();
  await expect(page.getByRole("heading", { name: /Na miejscu czy na wynos/i })).toBeFocused();
  await page.getByRole("button", { name: /exit walkthrough/i }).click();
  await expect(page.locator(".bottom-nav")).toBeVisible();
  await expect(page.getByRole("button", { name: /supported choices visible/i })).toBeFocused();

  await page.getByRole("button", { name: /change scene/i }).click();
  const picker = page.getByRole("dialog", { name: /choose a conversation scene/i });
  await expect(picker).toBeVisible();
  expect(await picker.evaluate((element) => element.tagName)).toBe("SECTION");
  for (const locator of [page.locator(".skip-link"), page.locator(".mobile-header"), page.locator(".bottom-nav"), page.locator(".page-header"), page.locator(".dialogue-active")]) {
    await expect(locator).toHaveAttribute("inert", "");
  }
  const pickerAxe = await new AxeBuilder({ page }).analyze();
  expect(pickerAxe.violations.map((violation) => ({ id: violation.id, impact: violation.impact }))).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /change scene/i })).toBeFocused();
});

test("keeps core pages within the mobile viewport", async ({ page }) => {
  const sizes = [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 820, height: 1180 },
  ];
  const hashes = ["#home", "#course", "#practice", "#sounds", "#dialogues", "#grammar", "#data"];
  for (const size of sizes) {
    await page.setViewportSize(size);
    for (const hash of hashes) {
      await page.goto(`/${hash}`);
      await expect(page.locator("main.content")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        const offenders = [...document.body.querySelectorAll("*")]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { element: element.tagName.toLowerCase(), className: element.className?.toString() || "", left: Math.round(rect.left), right: Math.round(rect.right) };
          })
          .filter((rect) => rect.left < 0 || rect.right > root.clientWidth)
          .slice(0, 5);
        return { exists: root.scrollWidth > root.clientWidth, clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, offenders };
      });
      expect(overflow.exists, `${hash} should fit at ${size.width}px: ${JSON.stringify(overflow)}`).toBe(false);
    }
    const navTargets = await page.locator(".bottom-nav button").evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    expect(navTargets.every((height) => height >= 44), `bottom navigation targets should be at least 44px at ${size.width}px`).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#practice");
  await page.getByRole("button", { name: /choose another drill/i }).click();
  for (const label of ["Flashcards", "Listen", "Build it", "Speak", "Reading", "Write", "Grammar"]) {
    await expect(page.getByRole("tab", { name: label })).toBeVisible();
  }
});

test("keeps the desktop sidebar free of horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto("/#data");
  const navigation = page.locator(".sidebar nav");
  await expect(navigation).toBeVisible();
  const overflow = await navigation.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.clientWidth);
});

test("keeps all eight practice tabs readable on compact desktop widths", async ({ page }) => {
  for (const width of [1080, 1100]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/#practice");
    await expect(page.getByRole("button", { name: /start flashcards/i })).toBeVisible();
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(8);
    const cramped = await tabs.evaluateAll((items) => items
      .filter((tab) => tab.scrollWidth > tab.clientWidth)
      .map((tab) => ({ label: tab.textContent, clientWidth: tab.clientWidth, scrollWidth: tab.scrollWidth })));
    expect(cramped, `practice tabs should fit at ${width}px`).toEqual([]);
  }
});

test("opens the new practice modes from validated deep links", async ({ page }) => {
  await page.goto("/#practice?mode=reading&topic=Travel");
  await expect(page.getByText("READ A PRACTICAL TEXT")).toBeVisible();
  await revealPracticeModes(page);
  await expect(page.getByRole("tab", { name: /reading/i })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: /^write/i }).click();
  await expect(page.getByText("CONTROLLED WRITING")).toBeVisible();
  await page.getByRole("tab", { name: /grammar/i }).click();
  await expect(page.getByText("COMPLETE THE GAP", { exact: true })).toBeVisible();
});

test("uses responsive pickers for dialogues and sounds", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#dialogues");
  await page.getByRole("button", { name: /change scene/i }).click();
  await expect(page.getByRole("dialog", { name: /choose a conversation scene/i })).toBeVisible();
  await page.getByRole("searchbox", { name: /search conversation scenes/i }).fill("neighbour");
  await page.getByRole("button", { name: /meeting a neighbour/i }).click();
  await expect(page.locator(".active-scene-bar em")).toHaveText("You meet someone in your building.");

  await page.goto("/#sounds");
  await page.locator(".mobile-picker-trigger").click();
  await expect(page.getByRole("dialog", { name: /choose a Polish sound/i })).toBeVisible();
  await page.getByRole("button", { name: /sz sh in/i }).click();
  await expect(page.getByRole("heading", { name: /sh in/i })).toBeVisible();
});

test("keeps keyboard focus inside the desktop conversation picker", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/#dialogues");
  await page.getByRole("button", { name: /change scene/i }).click();
  const search = page.getByRole("searchbox", { name: /search conversation scenes/i });
  await expect(search).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: /finding the station/i })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(search).toBeFocused();
});

test("filters and expands grammar explainers", async ({ page }) => {
  await page.goto("/#grammar");
  await page.getByRole("searchbox", { name: /search grammar patterns/i }).fill("negative");
  const pattern = page.locator(".grammar-card").first();
  await expect(pattern).toContainText("Make it negative");
  await pattern.getByRole("button", { name: /make it negative/i }).click();
  await expect(pattern).toContainText(/Put nie immediately before the verb/i);
});

test("finds and opens the new B1 course content", async ({ page }) => {
  await page.goto("/#course");
  const search = page.getByRole("searchbox", { name: /search units or phrases/i });
  await search.fill("what-ifs");
  await expect(search).toHaveValue("what-ifs");
  await expect(page.locator(".course-grid > .unit-card")).toHaveCount(1);
  const unit = page.locator(".unit-card").filter({ hasText: "Plans, wishes, and what-ifs" });
  await expect(unit).toBeVisible();
  await expect(unit).toContainText("B1 in action");
  await unit.getByRole("button", { name: /start unit/i }).click();
  await expect(page.getByRole("dialog", { name: /Plans, wishes, and what-ifs lesson/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gdybym miał więcej czasu, częściej bym podróżował" })).toBeVisible();
});

test("finds and opens the fluency bridge content", async ({ page }) => {
  await page.goto("/#course");
  const search = page.getByRole("searchbox", { name: /search units or phrases/i });
  await search.fill("Predict with uncertainty");
  await expect(search).toHaveValue("Predict with uncertainty");
  await expect(page.locator(".course-grid > .unit-card")).toHaveCount(1);
  const unit = page.locator(".unit-card").filter({ hasText: "Predict with uncertainty" });
  await expect(unit).toBeVisible();
  await expect(unit).toContainText("B2 bridge");
  await unit.getByRole("button", { name: /start unit/i }).click();
  await expect(page.getByRole("dialog", { name: /Predict with uncertainty lesson/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wiele wskazuje na to, że ten trend się utrzyma" })).toBeVisible();
});

test("keeps Polish text and dictation inputs mobile-ready", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/#practice?mode=writing&topic=All");
  const writing = page.getByRole("textbox", { name: /your polish/i });
  await expect(writing).toHaveAttribute("lang", "pl");
  await expect(writing).toHaveAttribute("inputmode", "text");
  await expect(writing).toHaveAttribute("enterkeyhint", "done");
  expect(Number.parseFloat(await writing.evaluate((element) => getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);

  await revealPracticeModes(page);
  await page.getByRole("tab", { name: /^speak/i }).click();
  await page.getByRole("button", { name: /phone dictation/i }).click();
  const dictation = page.getByRole("textbox", { name: /what did your phone hear/i });
  await expect(dictation).toHaveAttribute("lang", "pl");
  await expect(dictation).toHaveAttribute("autocomplete", "off");
  await expect(dictation).toHaveAttribute("autocapitalize", "sentences");
  await dictation.fill("Dzień dobry");
  await expect(page.getByRole("button", { name: /check transcript/i })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("migrates v4 progress and unlocks a completed-stage milestone", async ({ page }) => {
  const completedUnits = ["first-words", "meet-someone", "cafe", "directions", "shopping", "time-plans"];
  await page.goto("/#data");
  await page.evaluate((units) => localStorage.setItem("polish-first-progress", JSON.stringify({ version: 4, xp: 50, streak: 0, lastStudyDate: null, completedUnits: units, learnedPhrases: [], studyDates: [], phraseStats: {}, dialogueStats: {}, activeSession: null, dailyGoal: 15, todayMinutes: 0, totalReviews: 0 })), completedUnits);
  await page.reload();
  await page.getByRole("tab", { name: /skills/i }).click();
  await expect(page.getByText(/Detailed insights tracked since/i)).toBeVisible();
  const starter = page.locator(".milestone-card").filter({ hasText: "Starter scenario check" });
  await expect(starter).toContainText("Ready");
  await starter.getByRole("button", { name: /start check/i }).click();
  await expect(page.getByText(/Task 1 of 10/i)).toBeVisible();
  await expect(page.getByRole("dialog", { name: /Starter scenario check milestone/i })).toBeVisible();
});

test("rejects an invalid progress import without changing XP", async ({ page }) => {
  await page.goto("/#data");
  await page.getByRole("tab", { name: /data tools/i }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from("not-json") });
  await expect(page.getByRole("alert")).toContainText("not valid JSON");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("polish-first-progress")).xp)).toBe(0);
});

test("exports progress and confirms a valid replacement", async ({ page }) => {
  await page.goto("/#data");
  await page.getByRole("tab", { name: /data tools/i }).click();
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

test("has no serious or critical Axe violations on primary views", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const hash of ["#home", "#course", "#practice", "#sounds", "#dialogues", "#grammar", "#data"]) {
    await page.goto(`/${hash}`);
    await expect(page.locator("main.content")).toBeVisible();
    await expect(page.locator(".route-loading")).toHaveCount(0);
    const results = await new AxeBuilder({ page }).analyze();
    const blockers = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
    const details = blockers.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(" ")}`));
    expect(blockers.map((violation) => ({ id: violation.id, nodes: violation.nodes.length })), `${hash}: ${details.join("; ")}`).toEqual([]);
  }
});
