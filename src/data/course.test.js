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
    expect(units.length).toBeGreaterThanOrEqual(33);
    expect(allPhrases.length).toBeGreaterThanOrEqual(362);
    expect(dialogues.length).toBeGreaterThanOrEqual(16);
    expect(soundLessons.length).toBeGreaterThanOrEqual(24);
    expect(grammarGuides.length).toBeGreaterThanOrEqual(30);
    expect(courseTopics).toContain("All");
    units.forEach((unit) => {
      expect(unit.topic).toBeTruthy();
      expect(unit.stage).toBeTruthy();
      expect(unit.grammar).toBeTruthy();
      expect(unit.phrases.length).toBeGreaterThanOrEqual(9);
    });
  });

  it("gives every dialogue five turns with multiple natural options", () => {
    expect(new Set(dialogues.map((dialogue) => dialogue.id)).size).toBe(dialogues.length);
    dialogues.forEach((dialogue) => {
      expect(dialogue.lines.length).toBeGreaterThanOrEqual(5);
      dialogue.lines.forEach((line) => {
        expect([line.polish, line.phonetic, line.english].every(Boolean)).toBe(true);
        expect(line.choices.length).toBeGreaterThanOrEqual(3);
        line.choices.forEach((choice) => {
          expect([choice.polish, choice.phonetic, choice.english].every(Boolean)).toBe(true);
        });
        expect(line.choices.filter((choice) => choice.good).length).toBeGreaterThanOrEqual(2);
        expect(line.choices.some((choice) => !choice.good)).toBe(true);
      });
    });
  });
});
