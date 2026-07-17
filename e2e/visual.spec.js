import { expect, test } from "@playwright/test";

const PRIMARY_VIEWS = ["home", "course", "practice", "dialogues", "sounds", "grammar", "data"];
const FIXED_TIME = new Date("2026-07-15T12:00:00+01:00");

async function settlePage(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }
  ` });
  await page.evaluate(async () => {
    // The sample text includes Polish diacritics so the latin-ext subsets load
    // now instead of reflowing the page after the screenshot baseline settles.
    const sample = "Cześć! Dzień dobry ąęśćżźółń AaBb123";
    await Promise.all([
      document.fonts.load('400 16px "Instrument Sans"', sample),
      document.fonts.load('600 16px "Instrument Sans"', sample),
      document.fonts.load('700 16px "Instrument Sans"', sample),
      document.fonts.load('600 42px "Bricolage Grotesque"', sample),
      document.fonts.load('700 42px "Bricolage Grotesque"', sample),
      document.fonts.load('800 42px "Bricolage Grotesque"', sample),
    ]);
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function resetAt(page, view) {
  await page.goto(`/#${view}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("main.content")).toBeVisible();
  await expect(page.locator("main.content h1")).toBeVisible();
  await settlePage(page);
}

test("keeps every primary view and learning shell visually stable", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === "webkit-mobile";
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  await page.clock.install({ time: FIXED_TIME });
  // Speech voices arrive asynchronously and differ per machine; pin them empty
  // so the sounds view's voice bar renders one deterministic state.
  await page.addInitScript(() => {
    try {
      if (window.SpeechSynthesis?.prototype) {
        Object.defineProperty(window.SpeechSynthesis.prototype, "getVoices", { value: () => [], configurable: true });
      } else if (window.speechSynthesis) {
        window.speechSynthesis.getVoices = () => [];
      }
    } catch { /* leave real voices in place */ }
  });

  for (const view of PRIMARY_VIEWS) {
    await resetAt(page, view);
    await expect(page).toHaveScreenshot(`${view}.png`, {
      animations: "disabled",
      scale: "css",
      maxDiffPixelRatio: 0.005,
    });
  }

  await resetAt(page, "home");
  await page.getByRole("button", { name: /start 15-minute session/i }).click();
  await expect(page.getByText(/step 1 of 11/i)).toBeVisible();
  await settlePage(page);
  await expect(page).toHaveScreenshot("guided-session.png", {
    animations: "disabled",
    scale: "css",
    maxDiffPixelRatio: 0.005,
  });

  await resetAt(page, "course");
  await page.getByRole("button", { name: /start unit/i }).first().click();
  await expect(page.getByRole("dialog", { name: /lesson/i })).toBeVisible();
  await settlePage(page);
  await expect(page).toHaveScreenshot("unit-lesson.png", {
    animations: "disabled",
    scale: "css",
    maxDiffPixelRatio: 0.005,
  });
});
