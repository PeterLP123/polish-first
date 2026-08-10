import { describe, expect, it } from "vitest";
import { dialogues } from "../data/course.js";
import { buildConversationMission, compareMissionDraft, summariseMissionResults } from "./conversation-mission.js";

describe("conversation mission compiler", () => {
  const dialogue = dialogues.find((item) => item.id === "cafe");

  it("builds five production turns and rotates the authored target on a repeat", () => {
    const first = buildConversationMission(dialogue, 0);
    const second = buildConversationMission(dialogue, 1);
    expect(first.turns).toHaveLength(5);
    expect(first.goal).toMatch(/order/i);
    expect(first.turns[0].target.polish).not.toBe(second.turns[0].target.polish);
    expect(first.turns[0].alternative.good).toBe(true);
  });

  it("compares a draft honestly against the target model", () => {
    const turn = buildConversationMission(dialogue).turns[0];
    expect(compareMissionDraft(turn, turn.target.polish)).toMatchObject({ percent: 100, missingWords: [] });
    expect(compareMissionDraft(turn, "coś zupełnie innego").percent).toBeLessThan(60);
  });

  it("keeps first-pass support visible in the summary", () => {
    expect(summariseMissionResults([
      { outcome: "independent", modality: "spoken" },
      { outcome: "independent", modality: "draft" },
      { outcome: "supported", modality: "spoken" },
      { outcome: "revealed", modality: "draft" },
      { outcome: "revealed", modality: "model" },
    ])).toEqual({
      total: 5,
      independent: 2,
      supported: 1,
      revealed: 2,
      mistakes: 2,
      score: 0.63,
      evidence: [
        { skill: "speaking", mode: "speak", score: 0.825 },
        { skill: "writing", mode: "writing", score: 1 },
      ],
    });
  });
});
