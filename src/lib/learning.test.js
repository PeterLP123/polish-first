import { describe, expect, it } from "vitest";
import { PROGRESS_VERSION, addStudy, buildReviewDeck, effectiveStreak, migrateProgress, normalisePolish, similarity, weekActivity } from "./learning.js";
import { allPhrases, units } from "../data/course.js";

describe("learning helpers", () => {
  it("normalises punctuation and spacing without removing Polish characters", () => {
    expect(normalisePolish("  Dziękuję,  bardzo! ")).toBe("dziękuję bardzo");
  });

  it("scores exact and near speech matches", () => {
    expect(similarity("Dzień dobry", "dzień dobry")).toBe(1);
    expect(similarity("Dzień dobry", "dzien dobry")).toBeGreaterThan(0.8);
    expect(similarity("Dzień dobry", "rachunek proszę")).toBeLessThan(0.4);
  });

  it("awards progress without duplicating mastered content", () => {
    const today = new Date().toISOString().slice(0, 10);
    const progress = {
      xp: 10,
      streak: 2,
      lastStudyDate: today,
      completedUnits: [],
      learnedPhrases: ["p1"],
      dailyGoal: 15,
      todayMinutes: 3,
      totalReviews: 0,
    };
    const updated = addStudy(progress, { xp: 5, minutes: 2, phraseId: "p1", unitId: "u1" });
    expect(updated.xp).toBe(15);
    expect(updated.todayMinutes).toBe(5);
    expect(updated.learnedPhrases).toEqual(["p1"]);
    expect(updated.completedUnits).toEqual(["u1"]);
  });

  it("migrates positional v1 ids to slug ids", () => {
    const migrated = migrateProgress({
      xp: 50,
      completedUnits: ["unit-1", "unit-3"],
      learnedPhrases: ["u1-p1", "u3-p2", "already-slugged"],
    });
    expect(migrated.version).toBe(PROGRESS_VERSION);
    expect(migrated.completedUnits).toEqual([units[0].id, units[2].id]);
    expect(migrated.learnedPhrases).toEqual([units[0].phrases[0].id, units[2].phrases[1].id, "already-slugged"]);
    expect(migrated.xp).toBe(50);
  });

  it("leaves current-version progress untouched", () => {
    const current = { version: PROGRESS_VERSION, completedUnits: ["cafe"], learnedPhrases: ["cafe-poprosze-kawe"] };
    expect(migrateProgress(current)).toBe(current);
  });

  it("seeds study history when upgrading v2 progress", () => {
    const migrated = migrateProgress({ version: 2, lastStudyDate: "2026-07-10", completedUnits: [], learnedPhrases: [] });
    expect(migrated.version).toBe(PROGRESS_VERSION);
    expect(migrated.studyDates).toEqual(["2026-07-10"]);
    expect(migrated.phraseStats).toEqual({});
  });

  it("records study dates and phrase results", () => {
    const today = new Date().toISOString().slice(0, 10);
    let progress = addStudy({ ...baseProgress() }, { phraseId: "p1", phraseResult: true });
    expect(progress.studyDates).toEqual([today]);
    expect(progress.phraseStats.p1).toEqual({ box: 1, last: today });

    progress = addStudy(progress, { phraseId: "p1", phraseResult: true });
    expect(progress.studyDates).toEqual([today]);
    expect(progress.phraseStats.p1.box).toBe(2);

    progress = addStudy(progress, { phraseId: "p1", phraseResult: false });
    expect(progress.phraseStats.p1.box).toBe(1);
  });

  it("shows the streak only while it is alive", () => {
    const now = new Date("2026-07-14T12:00:00Z");
    expect(effectiveStreak({ streak: 4, lastStudyDate: "2026-07-14" }, now)).toBe(4);
    expect(effectiveStreak({ streak: 4, lastStudyDate: "2026-07-13" }, now)).toBe(4);
    expect(effectiveStreak({ streak: 4, lastStudyDate: "2026-07-11" }, now)).toBe(0);
  });

  it("maps study dates onto the current week", () => {
    const now = new Date("2026-07-14T12:00:00Z");
    const week = weekActivity(["2026-07-13", "2026-07-06"], now);
    expect(week.map((day) => day.done)).toEqual([true, false, false, false, false, false, false]);
    expect(week[1].today).toBe(true);
  });

  it("puts the weakest phrases first in the review deck", () => {
    const learned = allPhrases.slice(0, 6);
    const stats = Object.fromEntries(learned.map((phrase, index) => [phrase.id, { box: [5, 5, 5, 1, 0, 2][index], last: "2026-07-01" }]));
    const deck = buildReviewDeck({ learnedPhrases: learned.map((p) => p.id), phraseStats: stats }, 3);
    expect(deck.map((p) => p.id).sort()).toEqual([learned[3].id, learned[4].id, learned[5].id].sort());
  });
});

function baseProgress() {
  return {
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    completedUnits: [],
    learnedPhrases: [],
    studyDates: [],
    phraseStats: {},
    dailyGoal: 15,
    todayMinutes: 0,
    totalReviews: 0,
  };
}
