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

const GRAMMAR_UNIT_IDS = {
  "grammar-a-sentence-without-i": "meet-someone",
  "grammar-make-it-negative": "first-words",
  "grammar-ask-a-yes-no-question": "meet-someone",
  "grammar-the-polite-you": "shopping",
  "grammar-ordering-with-poprosze": "cafe",
  "grammar-say-what-you-like": "feelings-opinions",
  "grammar-masculine-and-feminine": "people-home",
  "grammar-where-things-are": "directions",
  "grammar-a-useful-past-present-future-trio": "past-future",
  "grammar-stress-is-predictable": "first-words",
  "grammar-the-extra-polite-wish": "restaurant",
  "grammar-saying-you-have": "people-home",
  "grammar-counting-money": "numbers",
  "grammar-on-friday-in-the-evening": "days",
  "grammar-going-to-a-destination": "train-travel",
  "grammar-being-in-a-place": "hotel",
  "grammar-walking-or-taking-transport": "directions",
  "grammar-past-tense-shows-gender": "past-future",
  "grammar-a-dependable-future": "past-future",
  "grammar-short-future-promises": "phone-messages",
  "grammar-useful-command-pairs": "repairs-problems",
  "grammar-it-hurts-me": "doctor",
  "grammar-small-pronouns-natural-rhythm": "phone-messages",
  "grammar-question-words-that-unlock-details": "directions",
  "grammar-without-and-from-use-the-same-family": "cafe",
  "grammar-with-someone-or-something": "cafe",
  "grammar-calling-directly-to-someone": "social-etiquette",
  "grammar-because-and-therefore": "feelings-opinions",
  "grammar-if-opens-a-possibility": "weather-seasons",
  "grammar-finished-or-in-progress": "story-connectors",
  "grammar-agreement-review": "clothing-returns",
  "grammar-plural-patterns": "bills-utilities",
  "grammar-comparison": "comparisons-preferences",
  "grammar-modals": "workplace-coordination",
  "grammar-pronoun-forms": "phone-calls-messages",
  "grammar-movement-place": "nature-outdoors",
  "grammar-aspect-stories": "past-sequencing",
  "grammar-aspect-plans": "future-arrangements",
  "grammar-polite-instructions": "public-forms",
  "grammar-sequencing": "past-sequencing",
  "grammar-contrast": "reasons-opinions",
  "grammar-relative-repair": "clarification-repair",
};

const CLOZE_OVERRIDES = {
  "grammar-a-sentence-without-i": { prompt: "I speak Polish: ____ po polsku", acceptedAnswers: ["mówię"] },
  "grammar-make-it-negative": { prompt: "I do not understand: ____ rozumiem", acceptedAnswers: ["nie"] },
  "grammar-stress-is-predictable": { prompt: "Stress ‘thank you’ correctly: dzię-____-ję", acceptedAnswers: ["ku"] },
};

function sentence(value) {
  const trimmed = value.trim();
  return /[.!?…]$/u.test(trimmed) ? trimmed : `${trimmed}.`;
}

function question(prompt, correct, distractors, answerIndex) {
  const alternatives = [...new Set(distractors)].filter((option) => option && option !== correct).slice(0, 2);
  const options = alternatives;
  const index = Math.min(answerIndex, options.length);
  options.splice(index, 0, correct);
  return { prompt, options, answerIndex: index };
}

function clozeForGuide(guide) {
  if (CLOZE_OVERRIDES[guide.id]) return CLOZE_OVERRIDES[guide.id];

  const usesTransformation = guide.example.includes("→");
  const selectedSide = usesTransformation ? guide.example.split("→").at(-1) : guide.example.split("·")[0];
  const target = selectedSide
    .split(/\s+\/\s+/u)[0]
    .replace(/\([^)]*\)/gu, "")
    .replace(/[+…]/gu, " ")
    .replace(/[.,!?;:]+$/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  const tokens = [...target.matchAll(/\p{L}+(?:[-’']\p{L}+)*/gu)];
  const token = usesTransformation ? tokens[0] : tokens.at(-1);
  if (!token) return { prompt: `${guide.meaning}: ____`, acceptedAnswers: ["nie"] };

  const answer = token[0];
  const gapped = `${target.slice(0, token.index)}____${target.slice(token.index + answer.length)}`;
  return { prompt: `${guide.meaning}: ${gapped}`, acceptedAnswers: [answer] };
}

function meta(unit, id, skills) {
  return { id, unitId: unit.id, stage: unit.stage, topic: unit.topic, skills, grammarIds: unit.grammarIds ?? [] };
}

export function buildActivities(units, dialogues, grammarGuides) {
  const byUnit = new Map(units.map((unit) => [unit.id, unit]));
  const authoredReadingIds = units.filter((unit) => unit.activity?.type === "reading").map((unit) => unit.id);
  const authoredWritingIds = units.filter((unit) => unit.activity?.type === "writing").map((unit) => unit.id);
  const readingUnits = [...SEEDED_EXISTING_IDS, ...NEW_READING_IDS, ...authoredReadingIds].map((id) => byUnit.get(id)).filter(Boolean);
  const writingUnits = [...SEEDED_EXISTING_IDS, ...NEW_WRITING_IDS, ...authoredWritingIds].map((id) => byUnit.get(id)).filter(Boolean);
  const readings = readingUnits.map((unit, index) => {
    if (unit.activity?.type === "reading") {
      return { ...meta(unit, `reading-${unit.id}`, ["reading"]), ...unit.activity.content };
    }
    const [first, second, third] = unit.phrases;
    const otherTitles = units.filter((candidate) => candidate.id !== unit.id).map((candidate) => candidate.title);
    return {
      ...meta(unit, `reading-${unit.id}`, ["reading"]),
      format: "phrase-set",
      text: [first, second, third].map((phrase) => sentence(phrase.polish)).join(" "),
      questions: [
        question("Which Polish phrase appears in the text?", second.polish, unit.phrases.slice(3).map((phrase) => phrase.polish), index % 3),
        question("What is this phrase set mainly about?", unit.title, otherTitles, (index + 1) % 3),
      ],
    };
  });

  const writingItems = writingUnits.map((unit) => {
    if (unit.activity?.type === "writing") {
      return { ...meta(unit, `writing-${unit.id}`, ["writing"]), ...unit.activity.content };
    }
    const phrase = unit.phrases[3];
    const requiredTokens = phrase.polish.toLocaleLowerCase("pl").replace(/[.,!?;:„”"'’]/g, "").split(/\s+/);
    return {
      ...meta(unit, `writing-${unit.id}`, ["writing"]),
      prompt: `Write this useful phrase in Polish: “${phrase.english}”`,
      kind: "translation",
      acceptedAnswers: [phrase.polish],
      requiredTokens,
    };
  });

  const clozeItems = grammarGuides.map((guide, index) => {
    const linkedUnit = units.find((unit) => unit.grammarIds?.includes(guide.id));
    const mappedUnit = byUnit.get(GRAMMAR_UNIT_IDS[guide.id]);
    const unit = linkedUnit ?? mappedUnit ?? units[Math.min(index, units.length - 1)];
    return {
      ...meta(unit, `cloze-${guide.id}`, ["grammar"]),
      grammarIds: [guide.id],
      ...clozeForGuide(guide),
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
