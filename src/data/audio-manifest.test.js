import { describe, expect, it } from "vitest";
import { reviewedAudioForText, validateReviewedAudioManifest } from "./audio-manifest.js";
import { validateContentReviewManifest } from "./content-review-manifest.js";

describe("human review manifests", () => {
  it("keeps the unreviewed fallback explicit", () => {
    expect(reviewedAudioForText("Dzień dobry")).toBeNull();
    expect(validateReviewedAudioManifest()).toBe(true);
    expect(validateContentReviewManifest()).toBe(true);
  });

  it("rejects incomplete native-audio claims", () => {
    expect(() => validateReviewedAudioManifest([{ phraseId: "phrase", polish: "Cześć", src: "/audio/reviewed/phrase.mp3" }])).toThrow(/reviewer.*usage rights/i);
    expect(() => validateContentReviewManifest({ phrase: { textStatus: "reviewed", phoneticStatus: "pending" } })).toThrow(/both text and phonetic/i);
  });
});
