import { allPhrases, dialogues, legacyIdMap, units } from "../data/course.js";

export const PROGRESS_VERSION = 4;
export const RATING_INTERVALS = { again: 0, hard: 1, good: 2, easy: 4 };
export const SESSION_BUDGETS = {
  10: { newCount: 2, reviewCount: 4 },
  15: { newCount: 3, reviewCount: 7 },
  20: { newCount: 4, reviewCount: 10 },
  30: { newCount: 5, reviewCount: 15 },
};

export const DEFAULT_PROGRESS = {
  version: PROGRESS_VERSION,
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  completedUnits: [],
  learnedPhrases: [],
  studyDates: [],
  phraseStats: {},
  dialogueStats: {},
  activeSession: null,
  dailyGoal: 15,
  todayMinutes: 0,
  totalReviews: 0,
};

const LEGACY_INTERVALS = [0, 1, 3, 7, 14, 30];
const phraseById = new Map(allPhrases.map((phrase) => [phrase.id, phrase]));
const unitIds = new Set(units.map((unit) => unit.id));
const dialogueIds = new Set(dialogues.map((dialogue) => dialogue.id));

export function localDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDate(date);
}

function emptyPhraseStat(overrides = {}) {
  return {
    intervalDays: 0,
    dueDate: localDate(),
    lastReviewed: null,
    reviews: 0,
    lapses: 0,
    lastRating: null,
    ...overrides,
  };
}

function migratePhraseStat(stat = {}, today = localDate()) {
  if ("intervalDays" in stat) {
    return emptyPhraseStat({ ...stat, dueDate: stat.dueDate || today });
  }
  const intervalDays = LEGACY_INTERVALS[Math.max(0, Math.min(5, Number(stat.box) || 0))];
  const lastReviewed = stat.last || null;
  return emptyPhraseStat({
    intervalDays,
    dueDate: lastReviewed ? addDays(lastReviewed, intervalDays) : today,
    lastReviewed,
    reviews: Number(stat.box) || 0,
  });
}

export function migrateProgress(saved, now = new Date()) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ...DEFAULT_PROGRESS };
  if (saved.version === PROGRESS_VERSION) return saved;

  let progress = { ...saved };
  if ((progress.version ?? 1) < 2) {
    const remap = (id) => legacyIdMap[id] ?? id;
    progress = {
      ...progress,
      version: 2,
      completedUnits: (progress.completedUnits ?? []).map(remap),
      learnedPhrases: (progress.learnedPhrases ?? []).map(remap),
    };
  }
  if ((progress.version ?? 2) < 3) {
    progress = {
      ...progress,
      version: 3,
      studyDates: progress.lastStudyDate ? [progress.lastStudyDate] : [],
      phraseStats: progress.phraseStats ?? {},
    };
  }
  if ((progress.version ?? 3) < 4) {
    const today = localDate(now);
    const phraseStats = Object.fromEntries(
      Object.entries(progress.phraseStats ?? {}).map(([id, stat]) => [id, migratePhraseStat(stat, today)]),
    );
    for (const id of progress.learnedPhrases ?? []) {
      if (!phraseStats[id]) phraseStats[id] = emptyPhraseStat({ dueDate: today });
    }
    progress = {
      ...progress,
      version: 4,
      phraseStats,
      dialogueStats: progress.dialogueStats ?? {},
      activeSession: null,
    };
  }
  return progress;
}

export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("polish-first-progress"));
    return saved ? { ...DEFAULT_PROGRESS, ...migrateProgress(saved) } : { ...DEFAULT_PROGRESS };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress) {
  localStorage.setItem("polish-first-progress", JSON.stringify(progress));
}

export function introducePhrase(progress, phraseId, now = new Date()) {
  const today = localDate(now);
  const learnedPhrases = progress.learnedPhrases.includes(phraseId)
    ? progress.learnedPhrases
    : [...progress.learnedPhrases, phraseId];
  if (progress.phraseStats?.[phraseId]) return { ...progress, learnedPhrases };
  return {
    ...progress,
    learnedPhrases,
    phraseStats: {
      ...(progress.phraseStats ?? {}),
      [phraseId]: emptyPhraseStat({ intervalDays: 1, dueDate: addDays(today, 1) }),
    },
  };
}

export function intervalForRating(previous, rating) {
  if (rating === "again") return 0;
  if (rating === "hard") return Math.min(90, Math.max(1, Math.round(previous * 1.2)));
  if (rating === "good") return Math.min(90, previous === 0 ? 2 : Math.max(2, Math.round(previous * 2)));
  if (rating === "easy") return Math.min(90, previous === 0 ? 4 : Math.max(4, Math.round(previous * 3)));
  throw new Error(`Unknown rating: ${rating}`);
}

export function ratePhrase(progress, phraseId, rating, now = new Date()) {
  if (!phraseById.has(phraseId)) throw new Error(`Unknown phrase: ${phraseId}`);
  const today = localDate(now);
  const current = migratePhraseStat(progress.phraseStats?.[phraseId] ?? {}, today);
  const intervalDays = intervalForRating(current.intervalDays, rating);
  const stat = {
    intervalDays,
    dueDate: addDays(today, intervalDays),
    lastReviewed: today,
    reviews: current.reviews + 1,
    lapses: current.lapses + (rating === "again" ? 1 : 0),
    lastRating: rating,
  };
  return {
    ...progress,
    learnedPhrases: progress.learnedPhrases.includes(phraseId)
      ? progress.learnedPhrases
      : [...progress.learnedPhrases, phraseId],
    phraseStats: { ...(progress.phraseStats ?? {}), [phraseId]: stat },
  };
}

export function addStudy(progress, payload = {}, now = new Date()) {
  const { xp = 0, minutes = 0, phraseId, unitId, review = false, phraseResult, rating, introduction = false } = payload;
  const today = localDate(now);
  const yesterday = addDays(today, -1);
  let next = { ...progress };

  if (phraseId && introduction) next = introducePhrase(next, phraseId, now);
  if (phraseId && (rating || phraseResult !== undefined)) {
    next = ratePhrase(next, phraseId, rating ?? (phraseResult ? "good" : "again"), now);
  } else if (phraseId && !next.learnedPhrases.includes(phraseId)) {
    next = introducePhrase(next, phraseId, now);
  }

  const firstStudyToday = next.lastStudyDate !== today;
  const streak = firstStudyToday
    ? (next.lastStudyDate === yesterday ? next.streak + 1 : 1)
    : next.streak;
  const studyDates = next.studyDates ?? [];

  return {
    ...next,
    xp: next.xp + xp,
    streak,
    lastStudyDate: today,
    studyDates: studyDates.includes(today) ? studyDates : [...studyDates.slice(-59), today],
    todayMinutes: firstStudyToday ? minutes : next.todayMinutes + minutes,
    totalReviews: next.totalReviews + (review ? 1 : 0),
    completedUnits: unitId && !next.completedUnits.includes(unitId)
      ? [...next.completedUnits, unitId]
      : next.completedUnits,
  };
}

export function recordDialogue(progress, dialogueId, mistakes, now = new Date()) {
  if (!dialogueIds.has(dialogueId)) throw new Error(`Unknown dialogue: ${dialogueId}`);
  const current = progress.dialogueStats?.[dialogueId] ?? { completions: 0, bestMistakes: null, lastCompleted: null };
  return {
    ...progress,
    dialogueStats: {
      ...(progress.dialogueStats ?? {}),
      [dialogueId]: {
        completions: current.completions + 1,
        bestMistakes: current.bestMistakes === null ? mistakes : Math.min(current.bestMistakes, mistakes),
        lastCompleted: localDate(now),
      },
    },
  };
}

export function todayMinutes(progress, now = new Date()) {
  return progress.lastStudyDate === localDate(now) ? progress.todayMinutes : 0;
}

export function effectiveStreak(progress, now = new Date()) {
  const today = localDate(now);
  const yesterday = addDays(today, -1);
  return progress.lastStudyDate === today || progress.lastStudyDate === yesterday ? progress.streak : 0;
}

export function weekActivity(studyDates = [], now = new Date()) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const dayIndex = (now.getDay() + 6) % 7;
  return labels.map((label, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + index - dayIndex);
    const iso = localDate(date);
    return { label, done: studyDates.includes(iso), today: index === dayIndex };
  });
}

export function getDuePhrases(progress, now = new Date()) {
  const today = localDate(now);
  const stats = progress.phraseStats ?? {};
  return allPhrases
    .filter((phrase) => progress.learnedPhrases.includes(phrase.id) && (stats[phrase.id]?.dueDate ?? today) <= today)
    .sort((left, right) => {
      const a = migratePhraseStat(stats[left.id] ?? {}, today);
      const b = migratePhraseStat(stats[right.id] ?? {}, today);
      return a.dueDate.localeCompare(b.dueDate) || a.intervalDays - b.intervalDays || left.id.localeCompare(right.id);
    });
}

export function masterySummary(progress, now = new Date()) {
  const due = getDuePhrases(progress, now).length;
  let learning = 0;
  let mastered = 0;
  for (const id of progress.learnedPhrases) {
    const interval = progress.phraseStats?.[id]?.intervalDays ?? 0;
    if (interval >= 30) mastered += 1;
    else learning += 1;
  }
  return { due, learning, mastered };
}

function stableScore(value) {
  let score = 0;
  for (const char of value) score = (score * 31 + char.charCodeAt(0)) >>> 0;
  return score;
}

function reviewMode(phrase, index) {
  const modes = ["flashcard", "listening", "builder", "speaking"];
  const proposed = modes[index % modes.length];
  return proposed === "builder" && phrase.polish.trim().split(/\s+/).length < 3 ? "flashcard" : proposed;
}

export function buildDailySession(progress, now = new Date()) {
  const date = localDate(now);
  const budget = SESSION_BUDGETS[progress.dailyGoal] ?? SESSION_BUDGETS[15];
  const unseen = allPhrases.filter((phrase) => !progress.learnedPhrases.includes(phrase.id));
  const newPhrases = unseen.slice(0, budget.newCount);
  const due = getDuePhrases(progress, now);
  const dueIds = new Set(due.map((phrase) => phrase.id));
  const learnedFallback = allPhrases
    .filter((phrase) => progress.learnedPhrases.includes(phrase.id) && !dueIds.has(phrase.id))
    .sort((left, right) => {
      const a = progress.phraseStats?.[left.id] ?? {};
      const b = progress.phraseStats?.[right.id] ?? {};
      return (a.intervalDays ?? 0) - (b.intervalDays ?? 0) || String(a.lastReviewed ?? "").localeCompare(String(b.lastReviewed ?? ""));
    });
  const reinforcement = newPhrases.length ? Array.from({ length: budget.reviewCount }, (_, index) => newPhrases[index % newPhrases.length]) : [];
  const reviewPhrases = [...due, ...learnedFallback, ...reinforcement].slice(0, budget.reviewCount);
  const dialogue = [...dialogues].sort((left, right) => {
    const a = progress.dialogueStats?.[left.id] ?? { completions: 0, lastCompleted: "" };
    const b = progress.dialogueStats?.[right.id] ?? { completions: 0, lastCompleted: "" };
    return a.completions - b.completions || String(a.lastCompleted ?? "").localeCompare(String(b.lastCompleted ?? "")) || stableScore(`${date}-${left.id}`) - stableScore(`${date}-${right.id}`);
  })[0];

  const tasks = [
    ...newPhrases.map((phrase, index) => ({ id: `learn-${phrase.id}`, type: "learn", phraseId: phrase.id, unitId: phrase.unitId, index })),
    ...reviewPhrases.map((phrase, index) => ({ id: `review-${index}-${phrase.id}`, type: "review", mode: reviewMode(phrase, index), phraseId: phrase.id })),
    { id: `dialogue-${dialogue.id}`, type: "dialogue", dialogueId: dialogue.id },
  ];

  return {
    id: `${date}-${progress.dailyGoal}`,
    date,
    targetMinutes: progress.dailyGoal,
    cursor: 0,
    tasks,
    results: [],
    requeuedPhraseIds: [],
    startedAt: now.toISOString(),
    completedAt: null,
  };
}

export function currentSession(progress, now = new Date()) {
  return progress.activeSession?.date === localDate(now) && !progress.activeSession.completedAt
    ? progress.activeSession
    : null;
}

export function buildReviewDeck(progress, size = 12, now = new Date()) {
  const due = getDuePhrases(progress, now);
  const dueIds = new Set(due.map((phrase) => phrase.id));
  const learned = allPhrases.filter((phrase) => progress.learnedPhrases.includes(phrase.id) && !dueIds.has(phrase.id));
  const fallback = learned.length >= 5 ? learned : allPhrases.slice(0, 30).filter((phrase) => !dueIds.has(phrase.id));
  const stats = progress.phraseStats ?? {};
  const ranked = fallback.sort((a, b) => {
    const left = stats[a.id] ?? { intervalDays: 0, lastReviewed: "" };
    const right = stats[b.id] ?? { intervalDays: 0, lastReviewed: "" };
    return left.intervalDays - right.intervalDays || String(left.lastReviewed ?? "").localeCompare(String(right.lastReviewed ?? ""));
  });
  return [...due, ...ranked].slice(0, size);
}

export function serializeProgress(progress, now = new Date()) {
  return JSON.stringify({ app: "polish-first", schemaVersion: PROGRESS_VERSION, exportedAt: now.toISOString(), progress }, null, 2);
}

function assertArray(value, name) {
  if (!Array.isArray(value)) throw new Error(`${name} must be a list.`);
}

export function parseProgressImport(input, now = new Date()) {
  let envelope;
  try {
    envelope = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!envelope || envelope.app !== "polish-first" || !envelope.progress) throw new Error("This is not a Polish First progress export.");
  if (Number(envelope.schemaVersion) > PROGRESS_VERSION) throw new Error("This export was created by a newer app version.");
  const migrated = { ...DEFAULT_PROGRESS, ...migrateProgress(envelope.progress, now) };
  assertArray(migrated.completedUnits, "Completed units");
  assertArray(migrated.learnedPhrases, "Learned phrases");
  assertArray(migrated.studyDates, "Study dates");
  const unknownUnits = migrated.completedUnits.filter((id) => !unitIds.has(id));
  const unknownPhrases = [
    ...migrated.learnedPhrases.filter((id) => !phraseById.has(id)),
    ...Object.keys(migrated.phraseStats ?? {}).filter((id) => !phraseById.has(id)),
  ];
  const unknownDialogues = Object.keys(migrated.dialogueStats ?? {}).filter((id) => !dialogueIds.has(id));
  const activeTasks = migrated.activeSession?.tasks;
  if (activeTasks !== undefined && !Array.isArray(activeTasks)) throw new Error("The active session is not valid.");
  const unknownSessionContent = (activeTasks ?? []).filter((task) => {
    if (!task || typeof task !== "object") return true;
    if ((task.type === "learn" || task.type === "review") && !phraseById.has(task.phraseId)) return true;
    if (task.type === "dialogue" && !dialogueIds.has(task.dialogueId)) return true;
    return !["learn", "review", "dialogue"].includes(task.type);
  });
  if (unknownUnits.length || unknownPhrases.length || unknownDialogues.length || unknownSessionContent.length) throw new Error("The export contains content IDs this version does not recognise.");
  return migrated;
}

export function diagnosticsSummary(progress, capabilities = {}, now = new Date()) {
  const mastery = masterySummary(progress, now);
  return [
    `Polish First v${PROGRESS_VERSION}`,
    `Date: ${localDate(now)}`,
    `XP: ${progress.xp}`,
    `Units: ${progress.completedUnits.length}/${units.length}`,
    `Phrases: ${progress.learnedPhrases.length}/${allPhrases.length}`,
    `Due/Learning/Mastered: ${mastery.due}/${mastery.learning}/${mastery.mastered}`,
    `Dialogue completions: ${Object.values(progress.dialogueStats ?? {}).reduce((sum, item) => sum + (item.completions ?? 0), 0)}`,
    `Speech synthesis: ${capabilities.speechSynthesis ? "yes" : "no"}`,
    `Speech recognition: ${capabilities.speechRecognition ? "yes" : "no"}`,
  ].join("\n");
}

export function normalisePolish(value = "") {
  return value
    .toLocaleLowerCase("pl")
    .replace(/[.,!?;:„”"'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function similarity(a, b) {
  const left = normalisePolish(a);
  const right = normalisePolish(b);
  if (!left && !right) return 1;
  if (!left || !right) return 0;

  const matrix = Array.from({ length: left.length + 1 }, (_, index) => [index]);
  for (let index = 0; index <= right.length; index += 1) matrix[0][index] = index;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      matrix[i][j] = left[i - 1] === right[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
    }
  }
  return Math.max(0, 1 - matrix[left.length][right.length] / Math.max(left.length, right.length));
}

export function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
