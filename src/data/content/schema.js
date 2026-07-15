export const SKILL_IDS = ["recall", "listening", "speaking", "reading", "writing", "grammar"];
export const PRACTICE_MODES = ["flashcards", "listen", "builder", "speak", "reading", "writing", "grammar"];
export const STAGES = ["Starter", "Everyday", "Explorer", "Next steps", "Independent", "A2 bridge", "B1 foundations", "B1 in action", "B1 confidence", "B2 bridge"];
export const TOPICS = ["Essentials", "Social", "Food", "Travel", "Daily life", "Health", "Next steps"];
export function makeContentCatalog(collections) {
  const production = {};
  const byId = new Map();
  for (const [name, items] of Object.entries(collections)) {
    production[name] = [...items];
    for (const item of production[name]) {
      if (!item.id) throw new Error(`${name} contains an item without an id.`);
      if (byId.has(item.id)) throw new Error(`Duplicate content id: ${item.id}`);
      byId.set(item.id, { ...item, contentType: name });
    }
  }
  return { ...production, byId };
}

export function validateContentCatalog(catalog, expected = {}) {
  const errors = [];
  const unitById = new Map(catalog.units.map((unit) => [unit.id, unit]));
  const grammarIds = new Set(catalog.grammarGuides.map((guide) => guide.id));
  const knownIds = catalog.byId;

  for (const unit of catalog.units) {
    if (!STAGES.includes(unit.stage)) errors.push(`${unit.id}: invalid stage`);
    if (!TOPICS.includes(unit.topic)) errors.push(`${unit.id}: invalid topic`);
    if (!Array.isArray(unit.phrases) || unit.phrases.length < 9) errors.push(`${unit.id}: invalid phrase count`);
  }

  for (const type of ["phrases", "readings", "writingItems", "clozeItems"]) {
    for (const item of catalog[type] ?? []) {
      const unit = unitById.get(item.unitId);
      if (!unit) errors.push(`${item.id}: missing unit`);
      else if (item.stage !== unit.stage || item.topic !== unit.topic) errors.push(`${item.id}: unit metadata mismatch`);
      for (const skill of item.skills ?? []) if (!SKILL_IDS.includes(skill)) errors.push(`${item.id}: invalid skill ${skill}`);
      for (const grammarId of item.grammarIds ?? []) if (!grammarIds.has(grammarId)) errors.push(`${item.id}: missing grammar ${grammarId}`);
    }
  }

  for (const reading of catalog.readings ?? []) {
    if (!reading.text || reading.questions?.length < 2 || reading.questions.length > 4) errors.push(`${reading.id}: invalid reading`);
    for (const question of reading.questions ?? []) {
      if (!question.prompt || question.options?.length < 2 || !Number.isInteger(question.answerIndex) || !question.options[question.answerIndex]) errors.push(`${reading.id}: invalid question`);
    }
  }

  for (const item of catalog.writingItems ?? []) {
    if (!item.prompt || !["sms", "email", "form", "description", "translation"].includes(item.kind) || !item.acceptedAnswers?.length || !item.requiredTokens?.length) errors.push(`${item.id}: invalid writing item`);
  }
  for (const item of catalog.clozeItems ?? []) if (!item.prompt || !item.acceptedAnswers?.length) errors.push(`${item.id}: invalid cloze item`);

  for (const dialogue of catalog.dialogues) {
    if (!STAGES.includes(dialogue.stage)) errors.push(`${dialogue.id}: invalid dialogue stage`);
    if (dialogue.lines?.length !== 5) errors.push(`${dialogue.id}: dialogue must have five turns`);
    for (const line of dialogue.lines ?? []) {
      if (!line.polish || !line.phonetic || !line.english || line.choices?.length < 3) errors.push(`${dialogue.id}: invalid dialogue turn`);
      if ((line.choices ?? []).filter((choice) => choice.good).length < 2 || !(line.choices ?? []).some((choice) => !choice.good)) errors.push(`${dialogue.id}: invalid dialogue choices`);
    }
  }

  for (const milestone of catalog.milestones ?? []) {
    if (milestone.tasks?.length !== 10) errors.push(`${milestone.id}: milestone must have ten tasks`);
    for (const task of milestone.tasks ?? []) if (!knownIds.has(task.itemId)) errors.push(`${milestone.id}: missing task ${task.itemId}`);
  }

  for (const [name, count] of Object.entries(expected)) {
    if ((catalog[name]?.length ?? 0) !== count) errors.push(`${name}: expected ${count}, received ${catalog[name]?.length ?? 0}`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return true;
}
