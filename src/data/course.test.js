import { describe, expect, it } from "vitest";
import { ContentCatalog, allPhrases, clozeItems, courseTopics, dialogues, grammarGuides, legacyIdMap, milestones, readings, soundLessons, units, validateCourseContent, writingItems } from "./course.js";

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
    expect(Object.keys(legacyIdMap)).toHaveLength(395);
    Object.entries(legacyIdMap).forEach(([legacy, id]) => {
      expect(legacy).toMatch(/^(unit-\d+|u\d+-p\d+)$/);
      expect(unitIds.has(id) || phraseIds.has(id)).toBe(true);
    });
  });

  it("ships a substantial, consistently tagged curriculum", () => {
    expect(units).toHaveLength(57);
    expect(allPhrases).toHaveLength(650);
    expect(dialogues).toHaveLength(30);
    expect(soundLessons).toHaveLength(24);
    expect(grammarGuides).toHaveLength(42);
    expect(readings).toHaveLength(24);
    expect(writingItems).toHaveLength(24);
    expect(clozeItems).toHaveLength(42);
    expect(milestones).toHaveLength(6);
    expect(courseTopics).toContain("All");
    units.forEach((unit) => {
      expect(unit.topic).toBeTruthy();
      expect(unit.stage).toBeTruthy();
      expect(unit.grammar).toBeTruthy();
      expect(unit.phrases.length).toBeGreaterThanOrEqual(9);
    });
  });

  it("builds one validated production catalogue with globally unique ids", () => {
    expect(ContentCatalog.byId.size).toBe(57 + 650 + 30 + 24 + 42 + 24 + 24 + 42 + 6);
    expect(() => validateCourseContent({ units: 57, phrases: 650, dialogues: 30, soundLessons: 24, grammarGuides: 42, readings: 24, writingItems: 24, milestones: 6 })).not.toThrow();
  });

  it("gives every expansion unit exactly one reading or writing activity", () => {
    for (const unit of units.slice(33)) {
      const activities = readings.filter((item) => item.unitId === unit.id).length + writingItems.filter((item) => item.unitId === unit.id).length;
      expect(activities).toBe(1);
    }
    for (const stage of ["Independent", "A2 bridge"]) {
      expect(readings.filter((item) => item.stage === stage)).toHaveLength(6);
      expect(writingItems.filter((item) => item.stage === stage)).toHaveLength(6);
    }
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
