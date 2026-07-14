import { describe, expect, it } from "vitest";
import { addStudy, normalisePolish, similarity } from "./learning.js";

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
});
