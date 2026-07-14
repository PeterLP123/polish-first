import { describe, expect, it } from "vitest";
import {
  PROGRESS_VERSION,
  SESSION_BUDGETS,
  addDays,
  addStudy,
  buildDailySession,
  buildReviewDeck,
  diagnosticsSummary,
  effectiveStreak,
  getDuePhrases,
  intervalForRating,
  localDate,
  masterySummary,
  migrateProgress,
  normalisePolish,
  parseProgressImport,
  ratePhrase,
  serializeProgress,
  similarity,
  todayMinutes,
  weekActivity,
} from "./learning.js";
import { allPhrases, units } from "../data/course.js";

const NOW = new Date(2026, 6, 14, 12);

describe("learning helpers", () => {
  it("normalises punctuation and spacing without removing Polish characters", () => {
    expect(normalisePolish("  Dziękuję,  bardzo! ")).toBe("dziękuję bardzo");
  });

  it("scores exact and near speech matches", () => {
    expect(similarity("Dzień dobry", "dzień dobry")).toBe(1);
    expect(similarity("Dzień dobry", "dzien dobry")).toBeGreaterThan(0.8);
    expect(similarity("Dzień dobry", "rachunek proszę")).toBeLessThan(0.4);
  });

  it("uses local calendar dates and rolls dates safely", () => {
    expect(localDate(NOW)).toBe("2026-07-14");
    expect(addDays("2026-03-31", 1)).toBe("2026-04-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("awards progress without duplicating mastered content", () => {
    const progress = { ...baseProgress(), xp: 10, streak: 2, lastStudyDate: "2026-07-14", learnedPhrases: [allPhrases[0].id], todayMinutes: 3 };
    const updated = addStudy(progress, { xp: 5, minutes: 2, phraseId: allPhrases[0].id, unitId: units[0].id }, NOW);
    expect(updated.xp).toBe(15);
    expect(updated.todayMinutes).toBe(5);
    expect(updated.learnedPhrases).toEqual([allPhrases[0].id]);
    expect(updated.completedUnits).toEqual([units[0].id]);
  });

  it("migrates positional v1 ids through the v4 scheduler schema", () => {
    const migrated = migrateProgress({ xp: 50, completedUnits: ["unit-1"], learnedPhrases: ["u1-p1"] }, NOW);
    expect(migrated.version).toBe(PROGRESS_VERSION);
    expect(migrated.completedUnits).toEqual([units[0].id]);
    expect(migrated.learnedPhrases).toEqual([units[0].phrases[0].id]);
    expect(migrated.phraseStats[units[0].phrases[0].id].dueDate).toBe("2026-07-14");
    expect(migrated.xp).toBe(50);
  });

  it("maps legacy mastery boxes onto due-date intervals", () => {
    const id = allPhrases[0].id;
    const migrated = migrateProgress({ version: 3, learnedPhrases: [id], phraseStats: { [id]: { box: 4, last: "2026-07-01" } } }, NOW);
    expect(migrated.phraseStats[id]).toMatchObject({ intervalDays: 14, dueDate: "2026-07-15", lastReviewed: "2026-07-01" });
  });

  it("leaves current-version progress untouched", () => {
    const current = { version: PROGRESS_VERSION, completedUnits: [], learnedPhrases: [] };
    expect(migrateProgress(current, NOW)).toBe(current);
  });

  it("applies every spaced-repetition rating and caps long intervals", () => {
    expect(intervalForRating(12, "again")).toBe(0);
    expect(intervalForRating(0, "hard")).toBe(1);
    expect(intervalForRating(0, "good")).toBe(2);
    expect(intervalForRating(0, "easy")).toBe(4);
    expect(intervalForRating(10, "hard")).toBe(12);
    expect(intervalForRating(10, "good")).toBe(20);
    expect(intervalForRating(10, "easy")).toBe(30);
    expect(intervalForRating(60, "easy")).toBe(90);
  });

  it("records ratings, reviews, lapses, and learned status", () => {
    const id = allPhrases[0].id;
    let progress = ratePhrase(baseProgress(), id, "good", NOW);
    expect(progress.phraseStats[id]).toMatchObject({ intervalDays: 2, dueDate: "2026-07-16", reviews: 1, lapses: 0, lastRating: "good" });
    progress = ratePhrase(progress, id, "again", NOW);
    expect(progress.phraseStats[id]).toMatchObject({ intervalDays: 0, dueDate: "2026-07-14", reviews: 2, lapses: 1, lastRating: "again" });
    expect(progress.learnedPhrases).toContain(id);
  });

  it("orders overdue phrases before newly due phrases", () => {
    const [first, second, third] = allPhrases;
    const progress = {
      ...baseProgress(),
      learnedPhrases: [first.id, second.id, third.id],
      phraseStats: {
        [first.id]: stat("2026-07-14", 1),
        [second.id]: stat("2026-07-10", 5),
        [third.id]: stat("2026-07-13", 2),
      },
    };
    expect(getDuePhrases(progress, NOW).map((phrase) => phrase.id)).toEqual([second.id, third.id, first.id]);
    expect(buildReviewDeck(progress, 2, NOW).map((phrase) => phrase.id)).toEqual([second.id, third.id]);
  });

  it("reports due, learning, and mastered phrases", () => {
    const [due, learning, mastered] = allPhrases;
    const progress = {
      ...baseProgress(),
      learnedPhrases: [due.id, learning.id, mastered.id],
      phraseStats: {
        [due.id]: stat("2026-07-14", 1),
        [learning.id]: stat("2026-07-20", 8),
        [mastered.id]: stat("2026-08-20", 30),
      },
    };
    expect(masterySummary(progress, NOW)).toEqual({ due: 1, learning: 2, mastered: 1 });
  });

  it.each(Object.entries(SESSION_BUDGETS))("builds the %s-minute session budget deterministically", (goal, budget) => {
    const progress = { ...baseProgress(), dailyGoal: Number(goal) };
    const left = buildDailySession(progress, NOW);
    const right = buildDailySession(progress, NOW);
    expect(left.tasks.filter((task) => task.type === "learn")).toHaveLength(budget.newCount);
    expect(left.tasks.filter((task) => task.type === "review")).toHaveLength(budget.reviewCount);
    expect(left.tasks.filter((task) => task.type === "dialogue")).toHaveLength(1);
    expect(left.tasks).toEqual(right.tasks);
  });

  it("fills review shortages and handles an exhausted course", () => {
    const phraseStats = Object.fromEntries(allPhrases.map((phrase) => [phrase.id, stat("2027-01-01", 30)]));
    const session = buildDailySession({ ...baseProgress(), dailyGoal: 10, learnedPhrases: allPhrases.map((phrase) => phrase.id), phraseStats }, NOW);
    expect(session.tasks.filter((task) => task.type === "learn")).toHaveLength(0);
    expect(session.tasks.filter((task) => task.type === "review")).toHaveLength(4);
  });

  it("resets displayed daily minutes on a new day while preserving stored history", () => {
    const progress = { ...baseProgress(), lastStudyDate: "2026-07-13", todayMinutes: 12, streak: 3 };
    expect(todayMinutes(progress, NOW)).toBe(0);
    expect(effectiveStreak(progress, NOW)).toBe(3);
    const updated = addStudy(progress, { minutes: 2 }, NOW);
    expect(updated.todayMinutes).toBe(2);
    expect(updated.streak).toBe(4);
  });

  it("maps study dates onto the local current week", () => {
    const week = weekActivity(["2026-07-13"], NOW);
    expect(week.map((day) => day.done)).toEqual([true, false, false, false, false, false, false]);
    expect(week[1].today).toBe(true);
  });

  it("round-trips progress exports and migrates older exports", () => {
    const progress = { ...baseProgress(), xp: 42, learnedPhrases: [allPhrases[0].id] };
    const exported = serializeProgress(progress, NOW);
    expect(parseProgressImport(exported, NOW)).toMatchObject({ version: 4, xp: 42, learnedPhrases: [allPhrases[0].id] });
    const old = JSON.stringify({ app: "polish-first", schemaVersion: 3, progress: { version: 3, completedUnits: [], learnedPhrases: [allPhrases[0].id], phraseStats: {} } });
    expect(parseProgressImport(old, NOW).phraseStats[allPhrases[0].id].dueDate).toBe("2026-07-14");
  });

  it("rejects invalid, future, and unknown-content imports", () => {
    expect(() => parseProgressImport("not json", NOW)).toThrow("valid JSON");
    expect(() => parseProgressImport({ app: "other", progress: {} }, NOW)).toThrow("not a Polish First");
    expect(() => parseProgressImport({ app: "polish-first", schemaVersion: 99, progress: {} }, NOW)).toThrow("newer app version");
    expect(() => parseProgressImport({ app: "polish-first", schemaVersion: 4, progress: { ...baseProgress(), learnedPhrases: ["missing"] } }, NOW)).toThrow("does not recognise");
    expect(() => parseProgressImport({ app: "polish-first", schemaVersion: 4, progress: { ...baseProgress(), activeSession: { tasks: [{ type: "dialogue", dialogueId: "missing" }] } } }, NOW)).toThrow("does not recognise");
  });

  it("creates a privacy-safe diagnostics summary", () => {
    const summary = diagnosticsSummary({ ...baseProgress(), xp: 12 }, { speechSynthesis: true, speechRecognition: false }, NOW);
    expect(summary).toContain("XP: 12");
    expect(summary).toContain("Speech synthesis: yes");
    expect(summary).not.toContain(allPhrases[0].polish);
  });
});

function stat(dueDate, intervalDays) {
  return { intervalDays, dueDate, lastReviewed: "2026-07-01", reviews: 1, lapses: 0, lastRating: "good" };
}

function baseProgress() {
  return {
    version: PROGRESS_VERSION,
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    completedUnits: [],
    learnedPhrases: [],
    studyDates: [],
    phraseStats: {},
    dialogueStats: {},
    activeSession: null,
    dailyGoal: 15,
    todayMinutes: 0,
    totalReviews: 0,
  };
}
