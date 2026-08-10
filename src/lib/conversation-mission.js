import { diagnosePronunciation } from "./learning.js";

const roundThree = (value) => Math.round((value + Number.EPSILON) * 1000) / 1000;

export function buildConversationMission(dialogue, completionCount = 0) {
  if (!dialogue?.mission || !Array.isArray(dialogue.lines)) throw new Error("Dialogue is missing mission content.");
  return {
    id: dialogue.id,
    title: dialogue.title,
    setting: dialogue.setting,
    stage: dialogue.stage,
    goal: dialogue.mission.goal,
    canDo: dialogue.mission.canDo,
    turns: dialogue.lines.map((line, turnIndex) => {
      const natural = line.choices.filter((choice) => choice.good);
      if (natural.length < 2) throw new Error(`${dialogue.id} turn ${turnIndex + 1} needs two natural responses.`);
      const targetIndex = (completionCount + turnIndex) % natural.length;
      const target = natural[targetIndex];
      const alternative = natural.find((_, index) => index !== targetIndex);
      const words = target.polish.trim().split(/\s+/);
      const offset = words.length > 1 ? (turnIndex + completionCount + 1) % words.length : 0;
      return {
        id: `${dialogue.id}:turn:${turnIndex + 1}`,
        index: turnIndex,
        incoming: line,
        cue: target.english,
        target,
        alternative,
        accepted: [target.polish, ...(target.acceptedPolish ?? [])],
        firstWord: words[0],
        wordCount: words.length,
        tiles: [...words.slice(offset), ...words.slice(0, offset)].map((word, index) => ({ id: `${turnIndex}-${index}-${word}`, word })),
      };
    }),
  };
}

export function compareMissionDraft(turn, draft) {
  const candidates = turn.accepted.map((answer) => ({ answer, ...diagnosePronunciation(answer, draft) }));
  const closest = candidates.sort((left, right) => right.score - left.score)[0];
  return {
    ...closest,
    percent: Math.round(closest.score * 100),
  };
}

export function summariseMissionResults(results) {
  const independent = results.filter((result) => result.outcome === "independent").length;
  const supported = results.filter((result) => result.outcome === "supported").length;
  const revealed = results.filter((result) => result.outcome === "revealed").length;
  const total = results.length;
  const score = total ? (independent + supported * 0.65 + revealed * 0.25) / total : 0;
  const evidence = [
    { modality: "spoken", skill: "speaking", mode: "speak" },
    { modality: "draft", skill: "writing", mode: "writing" },
  ].flatMap((group) => {
    const attempts = results.filter((result) => result.modality === group.modality && result.outcome !== "revealed");
    if (!attempts.length) return [];
    const points = attempts.reduce((sum, result) => sum + (result.outcome === "independent" ? 1 : 0.65), 0);
    return [{ skill: group.skill, mode: group.mode, score: roundThree(points / attempts.length) }];
  });
  return {
    total,
    independent,
    supported,
    revealed,
    mistakes: revealed,
    score: roundThree(score),
    evidence,
  };
}
