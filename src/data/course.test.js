import { describe, expect, it } from "vitest";
import { allPhrases, courseTopics, dialogues, grammarGuides, legacyIdMap, soundLessons, units } from "./course.js";

describe("course data integrity", () => {
  it("gives every unit a unique slug id", () => {
    const ids = units.map((unit) => unit.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9-]+$/));
  });

  it("gives every phrase a unique slug id", () => {
    const ids = allPhrases.map((phrase) => phrase.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9-]+$/));
  });

  it("maps every v1 positional id to a real slug id", () => {
    const unitIds = new Set(units.map((unit) => unit.id));
    const phraseIds = new Set(allPhrases.map((phrase) => phrase.id));
    expect(Object.keys(legacyIdMap)).toHaveLength(units.length + allPhrases.length);
    Object.entries(legacyIdMap).forEach(([legacy, id]) => {
      expect(legacy).toMatch(/^(unit-\d+|u\d+-p\d+)$/);
      expect(unitIds.has(id) || phraseIds.has(id)).toBe(true);
    });
  });

  it("ships a substantial, consistently tagged curriculum", () => {
    expect(units.length).toBeGreaterThanOrEqual(27);
    expect(allPhrases.length).toBeGreaterThanOrEqual(290);
    expect(dialogues.length).toBeGreaterThanOrEqual(12);
    expect(soundLessons.length).toBeGreaterThanOrEqual(22);
    expect(grammarGuides.length).toBeGreaterThanOrEqual(24);
    expect(courseTopics).toContain("All");
    units.forEach((unit) => {
      expect(unit.topic).toBeTruthy();
      expect(unit.stage).toBeTruthy();
      expect(unit.grammar).toBeTruthy();
      expect(unit.phrases.length).toBeGreaterThanOrEqual(9);
    });
  });

  it("gives each dialogue a useful correct and incorrect choice", () => {
    expect(new Set(dialogues.map((dialogue) => dialogue.id)).size).toBe(dialogues.length);
    dialogues.forEach((dialogue) => {
      expect(dialogue.lines.length).toBeGreaterThanOrEqual(3);
      dialogue.lines.forEach((line) => {
        expect(line.choices.some((choice) => choice.good)).toBe(true);
        expect(line.choices.some((choice) => !choice.good)).toBe(true);
      });
    });
  });
});
