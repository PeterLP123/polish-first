import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PROGRESS,
  PROGRESS_STORAGE_KEY,
  buildDailySession,
  loadProgressResult,
  parseProgressImport,
  saveProgress,
} from "./learning.js";
import { allPhrases } from "../data/course.js";

const NOW = new Date(2026, 6, 14, 12);

function validProgress(overrides = {}) {
  return {
    ...DEFAULT_PROGRESS,
    completedUnits: [],
    learnedPhrases: [],
    studyDates: [],
    phraseStats: {},
    dialogueStats: {},
    skillStats: {},
    dailyStats: [],
    milestoneStats: {},
    analyticsSince: "2026-07-14",
    ...overrides,
  };
}

function envelope(progress) {
  return { app: "polish-first", schemaVersion: 5, progress };
}

describe("local progress storage", () => {
  it.each([
    ["negative XP", { xp: -50 }],
    ["non-finite totals", { totalReviews: Number.POSITIVE_INFINITY }],
    ["unsupported daily goal", { dailyGoal: 0 }],
    ["minutes outside one day", { todayMinutes: 1441 }],
  ])("rejects current-version progress with %s", (_label, override) => {
    expect(() => parseProgressImport(envelope(validProgress(override)), NOW)).toThrow();
  });

  it.each([
    ["cursor", (session) => ({ ...session, cursor: session.tasks.length + 1 })],
    ["tasks", (session) => ({ ...session, tasks: "not a list" })],
    ["results", (session) => ({ ...session, results: "not a list" })],
    ["result rating", (session) => ({ ...session, cursor: 1, results: [{ kind: "review", rating: "perfect", xp: 1, minutes: 1 }] })],
  ])("rejects an invalid active-session %s", (_label, mutate) => {
    const session = buildDailySession(validProgress(), NOW);
    expect(() => parseProgressImport(envelope(validProgress({ activeSession: mutate(session) })), NOW)).toThrow();
  });

  it("reports recovery for corrupt data without replacing the raw value", () => {
    const raw = "{broken-json";
    const storage = { getItem: vi.fn(() => raw), setItem: vi.fn() };
    const result = loadProgressResult(NOW, storage);

    expect(result).toMatchObject({ status: "recovery", recoveryRequired: true });
    expect(result.progress.xp).toBe(0);
    expect(storage.getItem).toHaveBeenCalledWith(PROGRESS_STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.getItem()).toBe(raw);
  });

  it("validates current-version browser data instead of trusting its version", () => {
    const raw = JSON.stringify(validProgress({ dailyGoal: 0 }));
    const storage = { getItem: vi.fn(() => raw), setItem: vi.fn() };

    expect(loadProgressResult(NOW, storage)).toMatchObject({ status: "recovery", recoveryRequired: true });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("keeps the corrected bag phrase compatible with existing v5 progress", () => {
    const stableId = "shopping-czy-potrzebuje-pan-torbe";
    expect(allPhrases.find((phrase) => phrase.id === stableId)?.polish).toBe("Czy potrzebuje pan torby?");
    const progress = validProgress({
      learnedPhrases: [stableId],
      phraseStats: {
        [stableId]: { intervalDays: 2, dueDate: "2026-07-16", lastReviewed: "2026-07-14", reviews: 1, lapses: 0, lastRating: "good" },
      },
    });
    const storage = { getItem: vi.fn(() => JSON.stringify(progress)), setItem: vi.fn() };

    expect(loadProgressResult(NOW, storage)).toMatchObject({ status: "loaded", recoveryRequired: false });
    expect(loadProgressResult(NOW, storage).progress.learnedPhrases).toContain(stableId);
  });

  it("rejects inherited object keys used as ratings", () => {
    const phrase = allPhrases[0];
    const progress = validProgress({
      learnedPhrases: [phrase.id],
      phraseStats: {
        [phrase.id]: { intervalDays: 1, dueDate: "2026-07-15", lastReviewed: "2026-07-14", reviews: 1, lapses: 0, lastRating: "toString" },
      },
    });
    expect(() => parseProgressImport(envelope(progress), NOW)).toThrow(/rating/i);
  });

  it("reports unavailable storage without throwing", () => {
    const storage = { getItem: vi.fn(() => { throw new Error("Access denied"); }) };
    expect(loadProgressResult(NOW, storage)).toMatchObject({
      status: "unavailable",
      recoveryRequired: true,
      error: "Access denied",
    });
  });

  it("returns a safe result when storage rejects a save", () => {
    const storage = { setItem: vi.fn(() => { throw new Error("Quota exceeded"); }) };
    expect(saveProgress(validProgress(), storage)).toEqual({
      ok: false,
      reason: "storage",
      error: "Quota exceeded",
    });
  });

  it("does not write invalid progress and keeps the exact storage key", () => {
    const storage = { setItem: vi.fn() };
    expect(saveProgress(validProgress({ xp: -1 }), storage)).toMatchObject({ ok: false, reason: "validation" });
    expect(storage.setItem).not.toHaveBeenCalled();

    expect(saveProgress(validProgress({ xp: 12 }), storage)).toMatchObject({ ok: true });
    expect(storage.setItem).toHaveBeenCalledOnce();
    expect(storage.setItem).toHaveBeenCalledWith(PROGRESS_STORAGE_KEY, expect.any(String));
  });
});
