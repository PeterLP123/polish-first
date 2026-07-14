import { describe, expect, it } from "vitest";
import { allPhrases, legacyIdMap, units } from "./course.js";

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
});
