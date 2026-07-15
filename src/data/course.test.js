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
    expect(units).toHaveLength(81);
    expect(allPhrases).toHaveLength(938);
    expect(dialogues).toHaveLength(42);
    expect(soundLessons).toHaveLength(24);
    expect(grammarGuides).toHaveLength(66);
    expect(readings).toHaveLength(36);
    expect(writingItems).toHaveLength(36);
    expect(clozeItems).toHaveLength(66);
    expect(milestones).toHaveLength(10);
    expect(courseTopics).toContain("All");
    units.forEach((unit) => {
      expect(unit.topic).toBeTruthy();
      expect(unit.stage).toBeTruthy();
      expect(unit.grammar).toBeTruthy();
      expect(unit.phrases.length).toBeGreaterThanOrEqual(9);
    });
  });

  it("builds one validated production catalogue with globally unique ids", () => {
    expect(ContentCatalog.byId.size).toBe(81 + 938 + 42 + 24 + 66 + 36 + 36 + 66 + 10);
    expect(() => validateCourseContent({ units: 81, phrases: 938, dialogues: 42, soundLessons: 24, grammarGuides: 66, readings: 36, writingItems: 36, milestones: 10 })).not.toThrow();
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
    for (const stage of ["B1 foundations", "B1 in action", "B1 confidence", "B2 bridge"]) {
      expect(readings.filter((item) => item.stage === stage)).toHaveLength(3);
      expect(writingItems.filter((item) => item.stage === stage)).toHaveLength(3);
    }
  });

  it("adds authored B1 texts, writing tasks, and grammar links", () => {
    const b1Units = units.filter((unit) => ["B1 foundations", "B1 in action"].includes(unit.stage));
    expect(b1Units).toHaveLength(12);
    expect(b1Units.every((unit) => unit.activity?.content)).toBe(true);
    expect(readings.find((item) => item.unitId === "explaining-decisions").text.split(/\s+/).length).toBeGreaterThan(40);
    expect(writingItems.find((item) => item.unitId === "formal-correspondence").requiredTokens).toContain("proszę");
    expect(b1Units.flatMap((unit) => unit.phrases).every((phrase) => phrase.grammarIds.length === 1)).toBe(true);
    expect(readings.filter((item) => item.stage.startsWith("B1")).every((item) => item.grammarIds.length === 1)).toBe(true);
    expect(milestones.find((item) => item.stage === "B1 foundations").tasks.filter((task) => task.kind === "grammar").every((task) => task.itemId.includes("grammar-b1"))).toBe(true);
  });

  it("extends the course with connected fluency practice", () => {
    const fluencyUnits = units.filter((unit) => ["B1 confidence", "B2 bridge"].includes(unit.stage));
    expect(fluencyUnits).toHaveLength(12);
    expect(fluencyUnits.flatMap((unit) => unit.phrases)).toHaveLength(144);
    expect(fluencyUnits.every((unit) => unit.activity?.content && unit.grammarIds.length === 1)).toBe(true);
    expect(readings.find((item) => item.unitId === "society-policy").questions).toHaveLength(3);
    expect(writingItems.find((item) => item.unitId === "persuasive-proposals").requiredTokens).toContain("żeby");
    expect(milestones.find((item) => item.stage === "B2 bridge").tasks.some((task) => task.itemId === "dialogue:negotiating-compromise")).toBe(true);
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
