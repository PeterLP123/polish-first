import { STAGES } from "./schema.js";

const SEEDED_EXISTING_IDS = [
  "first-words", "meet-someone", "cafe",
  "people-home", "restaurant", "help",
  "hotel", "train-travel", "airport",
  "past-future", "invitations", "repairs-problems",
];

const NEW_READING_IDS = [
  "clothing-returns", "appearance-character", "hobbies-sport", "personal-care", "education-courses", "workplace-coordination",
  "comparisons-preferences", "reasons-opinions", "past-sequencing", "experiences-changes", "future-arrangements", "phone-calls-messages",
];

const NEW_WRITING_IDS = [
  "bills-utilities", "renting-rules", "technology-internet", "celebrations-traditions", "culture-events", "nature-outdoors",
  "clarification-repair", "complaints-refunds", "public-forms", "notices-adverts", "texts-emails", "instructions-advice",
];

function meta(unit, id, skills) {
  return { id, unitId: unit.id, stage: unit.stage, topic: unit.topic, skills, grammarIds: unit.grammarIds ?? [] };
}

export function buildActivities(units, dialogues, grammarGuides) {
  const byUnit = new Map(units.map((unit) => [unit.id, unit]));
  const authoredReadingIds = units.filter((unit) => unit.activity?.type === "reading").map((unit) => unit.id);
  const authoredWritingIds = units.filter((unit) => unit.activity?.type === "writing").map((unit) => unit.id);
  const readingUnits = [...SEEDED_EXISTING_IDS, ...NEW_READING_IDS, ...authoredReadingIds].map((id) => byUnit.get(id)).filter(Boolean);
  const writingUnits = [...SEEDED_EXISTING_IDS, ...NEW_WRITING_IDS, ...authoredWritingIds].map((id) => byUnit.get(id)).filter(Boolean);
  const readings = readingUnits.map((unit) => {
    if (unit.activity?.type === "reading") {
      return { ...meta(unit, `reading-${unit.id}`, ["reading"]), ...unit.activity.content };
    }
    const [first, second, third] = unit.phrases;
    return {
      ...meta(unit, `reading-${unit.id}`, ["reading"]),
      text: `${first.polish}. ${second.polish}. ${third.polish}.`,
      questions: [
        { prompt: "Które zdanie pojawia się w tekście?", options: [second.polish, unit.phrases[5].polish, unit.phrases[8].polish], answerIndex: 0 },
        { prompt: "Jaki jest główny temat tekstu?", options: [unit.title, "Pogoda", "Rozkład jazdy"], answerIndex: 0 },
      ],
    };
  });

  const kinds = ["sms", "email", "form", "description"];
  const writingItems = writingUnits.map((unit, index) => {
    if (unit.activity?.type === "writing") {
      return { ...meta(unit, `writing-${unit.id}`, ["writing"]), ...unit.activity.content };
    }
    const phrase = unit.phrases[3];
    const requiredTokens = phrase.polish.toLocaleLowerCase("pl").replace(/[.,!?;:„”"'’]/g, "").split(/\s+/).slice(0, 2);
    return {
      ...meta(unit, `writing-${unit.id}`, ["writing"]),
      prompt: `Write a short ${kinds[index % kinds.length]} for “${phrase.english}”.`,
      kind: kinds[index % kinds.length],
      acceptedAnswers: [phrase.polish],
      requiredTokens,
    };
  });

  const clozeItems = grammarGuides.map((guide, index) => {
    const unit = units[index % units.length];
    const answer = guide.example.split(/[·→]/)[0]?.trim().replace(/[()….,!?;:]/g, "").split(/\s+/).find(Boolean) || "nie";
    return {
      ...meta(unit, `cloze-${guide.id}`, ["grammar"]),
      grammarIds: [guide.id],
      prompt: `${guide.meaning}: ____ (${guide.example})`,
      acceptedAnswers: [answer],
    };
  });

  const stageUnits = (stage) => units.filter((unit) => unit.stage === stage);
  const stageReadings = (stage) => readings.filter((item) => item.stage === stage);
  const stageWriting = (stage) => writingItems.filter((item) => item.stage === stage);
  const stageDialogueIds = {
    "B1 foundations": "project-delay",
    "B1 in action": "community-meeting",
    "B1 confidence": "presentation-questions",
    "B2 bridge": "negotiating-compromise",
  };
  const clozeByGrammarId = new Map(clozeItems.map((item) => [item.grammarIds[0], item]));
  const milestones = STAGES.map((stage, index) => {
    const availableUnits = stageUnits(stage);
    const phrases = availableUnits.flatMap((unit) => unit.phrases);
    const availableReadings = stageReadings(stage);
    const availableWriting = stageWriting(stage);
    const stageGrammarIds = [...new Set(availableUnits.flatMap((unit) => unit.grammarIds ?? []))];
    const stageClozes = stageGrammarIds.map((id) => clozeByGrammarId.get(id)).filter(Boolean);
    const fallbackClozes = [clozeItems[index * 2], clozeItems[(index * 2) + 1]].filter(Boolean);
    const selectedClozes = stageClozes.length >= 2 ? stageClozes : fallbackClozes;
    const dialogueId = stageDialogueIds[stage] ?? dialogues[index]?.id;
    return {
      id: `milestone-${stage.toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-")}`,
      title: `${stage} scenario check`,
      stage,
      topic: "Next steps",
      skills: ["listening", "reading", "grammar", "recall", "writing", "speaking"],
      grammarIds: [],
      tasks: [
        { kind: "listening", itemId: phrases[0].id },
        { kind: "listening", itemId: phrases[1].id },
        { kind: "reading", itemId: availableReadings[0].id },
        { kind: "reading", itemId: availableReadings[1]?.id ?? availableReadings[0].id },
        { kind: "grammar", itemId: selectedClozes[0].id },
        { kind: "grammar", itemId: selectedClozes[1].id },
        { kind: "builder", itemId: phrases.find((phrase) => phrase.polish.split(/\s+/).length >= 3)?.id ?? phrases[2].id },
        { kind: "writing", itemId: availableWriting[0].id },
        { kind: "dialogue", itemId: `dialogue:${dialogueId}` },
        { kind: "speaking", itemId: phrases[2].id },
      ],
    };
  });

  return { readings, writingItems, clozeItems, milestones };
}
