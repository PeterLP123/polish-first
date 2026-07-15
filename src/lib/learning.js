import { ContentCatalog, allPhrases, dialogues, legacyIdMap, milestones, units } from "../data/course.js";
import { PRACTICE_MODES, SKILL_IDS, STAGES } from "../data/content/schema.js";

export const PROGRESS_VERSION = 5;
export const PROGRESS_STORAGE_KEY = "polish-first-progress";
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
  analyticsSince: null,
  skillStats: {},
  dailyStats: [],
  milestoneStats: {},
};

const LEGACY_INTERVALS = [0, 1, 3, 7, 14, 30];
const phraseById = new Map(allPhrases.map((phrase) => [phrase.id, phrase]));
const unitIds = new Set(units.map((unit) => unit.id));
const dialogueIds = new Set(dialogues.map((dialogue) => dialogue.id));
const milestoneIds = new Set(milestones.map((milestone) => milestone.id));
const contentIds = new Set(ContentCatalog.byId.keys());
export const RATING_SCORES = { again: 0, hard: 0.5, good: 0.8, easy: 1 };
export const SKILL_ORDER = [...SKILL_IDS];
export const SKILL_MODE = { recall: "flashcards", listening: "listen", speaking: "speak", reading: "reading", writing: "writing", grammar: "grammar" };

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
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ...DEFAULT_PROGRESS, analyticsSince: localDate(now) };
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
  if ((progress.version ?? 4) < 5) {
    progress = {
      ...progress,
      version: 5,
      analyticsSince: localDate(now),
      skillStats: progress.skillStats ?? {},
      dailyStats: progress.dailyStats ?? [],
      milestoneStats: progress.milestoneStats ?? {},
    };
  }
  return progress;
}

function freshProgress(now = new Date()) {
  return {
    ...DEFAULT_PROGRESS,
    completedUnits: [],
    learnedPhrases: [],
    studyDates: [],
    phraseStats: {},
    dialogueStats: {},
    skillStats: {},
    dailyStats: [],
    milestoneStats: {},
    analyticsSince: localDate(now),
  };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertRecord(value, name) {
  if (!isRecord(value)) throw new Error(`${name} must be an object.`);
}

function assertNonNegativeInteger(value, name, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${name} must be a non-negative whole number.`);
  }
}

function assertScore(value, name) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${name} must be between 0 and 1.`);
}

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function assertDate(value, name, nullable = false) {
  if (nullable && value === null) return;
  if (!isIsoDate(value)) throw new Error(`${name} must be a valid calendar date.`);
}

function assertTimestamp(value, name, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || !value || Number.isNaN(new Date(value).getTime())) {
    throw new Error(`${name} must be a valid timestamp.`);
  }
}

function assertUnique(values, name) {
  if (new Set(values).size !== values.length) throw new Error(`${name} contains duplicate entries.`);
}

function validateSkillAggregate(aggregate, name, includeLastAttempt = true) {
  assertRecord(aggregate, name);
  assertNonNegativeInteger(aggregate.attempts, `${name} attempts`);
  if (!Number.isFinite(aggregate.points) || aggregate.points < 0 || aggregate.points > aggregate.attempts) {
    throw new Error(`${name} points are not valid.`);
  }
  if (includeLastAttempt) {
    assertScore(aggregate.lastScore, `${name} last score`);
    if (aggregate.lastAttempted !== null && aggregate.lastAttempted !== undefined) {
      assertTimestamp(aggregate.lastAttempted, `${name} last attempt`);
    }
  }
}

function validateActiveSession(session) {
  if (session === null) return;
  assertRecord(session, "The active session");
  if (typeof session.id !== "string" || !session.id.trim()) throw new Error("The active session ID is not valid.");
  assertDate(session.date, "The active session date");
  if (!Object.hasOwn(SESSION_BUDGETS, session.targetMinutes)) throw new Error("The active session target is not valid.");
  assertTimestamp(session.startedAt, "The active session start time");
  assertTimestamp(session.completedAt, "The active session completion time", true);
  assertArray(session.tasks, "Active session tasks");
  assertArray(session.results, "Active session results");
  if (!session.tasks.length) throw new Error("The active session must contain at least one task.");
  assertNonNegativeInteger(session.cursor, "The active session cursor", session.tasks.length);
  if (session.completedAt === null && session.cursor >= session.tasks.length) throw new Error("The active session cursor is past the current task.");
  if (session.completedAt !== null && session.cursor !== session.tasks.length) throw new Error("The completed session cursor is not valid.");
  if (session.results.length > session.cursor) throw new Error("The active session has more results than completed tasks.");

  const taskIds = [];
  for (const [index, task] of session.tasks.entries()) {
    assertRecord(task, `Active session task ${index + 1}`);
    if (typeof task.id !== "string" || !task.id.trim()) throw new Error("An active session task ID is not valid.");
    taskIds.push(task.id);
    if (task.type === "learn") {
      if (!phraseById.has(task.phraseId) || !unitIds.has(task.unitId)) throw new Error("The progress contains content IDs this version does not recognise.");
      if (task.index !== undefined) assertNonNegativeInteger(task.index, "The learning task index");
    } else if (task.type === "review") {
      if (!phraseById.has(task.phraseId)) throw new Error("The progress contains content IDs this version does not recognise.");
      if (!["flashcard", "listening", "builder", "speaking"].includes(task.mode)) throw new Error("An active session review mode is not valid.");
      if (task.reinforcement !== undefined && typeof task.reinforcement !== "boolean") throw new Error("An active session reinforcement flag is not valid.");
    } else if (task.type === "dialogue") {
      if (!dialogueIds.has(task.dialogueId)) throw new Error("The progress contains content IDs this version does not recognise.");
    } else {
      throw new Error("An active session task type is not valid.");
    }
  }
  assertUnique(taskIds, "Active session task IDs");

  for (const [index, result] of session.results.entries()) {
    assertRecord(result, `Active session result ${index + 1}`);
    if (!['learn', 'review', 'dialogue'].includes(result.kind)) throw new Error("An active session result type is not valid.");
    assertNonNegativeInteger(result.xp, "The active session result XP");
    assertNonNegativeInteger(result.minutes, "The active session result minutes", 1440);
    if (result.taskId !== undefined && !taskIds.includes(result.taskId)) throw new Error("An active session result references an unknown task.");
    if (result.phraseId !== undefined && !phraseById.has(result.phraseId)) throw new Error("The progress contains content IDs this version does not recognise.");
    if (result.dialogueId !== undefined && !dialogueIds.has(result.dialogueId)) throw new Error("The progress contains content IDs this version does not recognise.");
    if (result.kind === "review" && !Object.hasOwn(RATING_INTERVALS, result.rating)) throw new Error("An active session result rating is not valid.");
    if (result.kind === "dialogue") assertNonNegativeInteger(result.mistakes, "The active session dialogue retries");
  }

  if (session.requeuedPhraseIds !== undefined) {
    assertArray(session.requeuedPhraseIds, "Requeued phrase IDs");
    assertUnique(session.requeuedPhraseIds, "Requeued phrase IDs");
    if (session.requeuedPhraseIds.some((id) => !phraseById.has(id))) throw new Error("The progress contains content IDs this version does not recognise.");
  }
}

/**
 * Validate the complete persisted v5 state. The same contract is used for
 * browser loads, imports, and saves so a current-version payload cannot bypass
 * checks that migrations receive.
 */
export function validateProgress(progress) {
  assertRecord(progress, "Progress");
  if (progress.version !== PROGRESS_VERSION) throw new Error("The progress version is not supported.");
  assertNonNegativeInteger(progress.xp, "XP");
  assertNonNegativeInteger(progress.streak, "Streak");
  assertNonNegativeInteger(progress.todayMinutes, "Today's minutes", 1440);
  assertNonNegativeInteger(progress.totalReviews, "Total reviews");
  if (!Object.hasOwn(SESSION_BUDGETS, progress.dailyGoal)) throw new Error("The daily goal is not valid.");
  assertDate(progress.lastStudyDate, "Last study date", true);
  assertDate(progress.analyticsSince, "Analytics start date", true);

  assertArray(progress.completedUnits, "Completed units");
  assertArray(progress.learnedPhrases, "Learned phrases");
  assertArray(progress.studyDates, "Study dates");
  assertArray(progress.dailyStats, "Daily analytics");
  assertUnique(progress.completedUnits, "Completed units");
  assertUnique(progress.learnedPhrases, "Learned phrases");
  assertUnique(progress.studyDates, "Study dates");
  for (const date of progress.studyDates) assertDate(date, "Study date");
  if (progress.dailyStats.length > 180) throw new Error("The progress contains too many daily analytics entries.");

  assertRecord(progress.phraseStats, "Phrase statistics");
  assertRecord(progress.dialogueStats, "Dialogue statistics");
  assertRecord(progress.skillStats, "Skill analytics");
  assertRecord(progress.milestoneStats, "Milestone statistics");

  const unknownUnits = progress.completedUnits.filter((id) => !unitIds.has(id));
  const unknownPhrases = [
    ...progress.learnedPhrases.filter((id) => !phraseById.has(id)),
    ...Object.keys(progress.phraseStats).filter((id) => !phraseById.has(id)),
  ];
  const unknownDialogues = Object.keys(progress.dialogueStats).filter((id) => !dialogueIds.has(id));
  const unknownAttemptItems = Object.keys(progress.skillStats).filter((id) => !contentIds.has(id));
  const unknownMilestones = Object.keys(progress.milestoneStats).filter((id) => !milestoneIds.has(id));
  const sessionTasks = isRecord(progress.activeSession) && Array.isArray(progress.activeSession.tasks) ? progress.activeSession.tasks : [];
  const unknownSessionTask = sessionTasks.some((task) => {
    if (!isRecord(task) || !["learn", "review", "dialogue"].includes(task.type)) return true;
    if (task.type === "learn") return !phraseById.has(task.phraseId) || !unitIds.has(task.unitId);
    if (task.type === "review") return !phraseById.has(task.phraseId);
    return !dialogueIds.has(task.dialogueId);
  });
  const sessionResults = isRecord(progress.activeSession) && Array.isArray(progress.activeSession.results) ? progress.activeSession.results : [];
  const unknownSessionResult = sessionResults.some((result) => isRecord(result) && (
    (result.phraseId !== undefined && !phraseById.has(result.phraseId))
    || (result.dialogueId !== undefined && !dialogueIds.has(result.dialogueId))
  ));
  const unknownRequeuedPhrase = isRecord(progress.activeSession) && Array.isArray(progress.activeSession.requeuedPhraseIds)
    && progress.activeSession.requeuedPhraseIds.some((id) => !phraseById.has(id));
  if (unknownUnits.length || unknownPhrases.length || unknownDialogues.length || unknownAttemptItems.length || unknownMilestones.length || unknownSessionTask || unknownSessionResult || unknownRequeuedPhrase) {
    throw new Error("The progress contains content IDs this version does not recognise.");
  }

  for (const [id, stat] of Object.entries(progress.phraseStats)) {
    assertRecord(stat, `Phrase statistics for ${id}`);
    assertNonNegativeInteger(stat.intervalDays, `Review interval for ${id}`, 90);
    assertDate(stat.dueDate, `Due date for ${id}`);
    assertDate(stat.lastReviewed, `Last review date for ${id}`, true);
    assertNonNegativeInteger(stat.reviews, `Review count for ${id}`);
    assertNonNegativeInteger(stat.lapses, `Lapse count for ${id}`, stat.reviews);
    if (stat.lastRating !== null && !Object.hasOwn(RATING_INTERVALS, stat.lastRating)) throw new Error(`The last rating for ${id} is not valid.`);
  }

  for (const [id, stat] of Object.entries(progress.dialogueStats)) {
    assertRecord(stat, `Dialogue statistics for ${id}`);
    assertNonNegativeInteger(stat.completions, `Dialogue completions for ${id}`);
    if (stat.bestMistakes !== null) assertNonNegativeInteger(stat.bestMistakes, `Best dialogue retries for ${id}`);
    assertDate(stat.lastCompleted, `Last dialogue completion for ${id}`, true);
  }

  for (const [itemId, item] of Object.entries(progress.skillStats)) {
    assertRecord(item, `Skill analytics for ${itemId}`);
    for (const [skill, aggregate] of Object.entries(item)) {
      if (!SKILL_IDS.includes(skill)) throw new Error("The progress contains invalid skill analytics.");
      try {
        validateSkillAggregate(aggregate, `${skill} analytics`);
      } catch {
        throw new Error("The progress contains invalid skill analytics.");
      }
    }
  }

  const dailyDates = [];
  for (const summary of progress.dailyStats) {
    assertRecord(summary, "Daily analytics entry");
    assertDate(summary.date, "Daily analytics date");
    dailyDates.push(summary.date);
    assertNonNegativeInteger(summary.minutes, "Daily minutes", 1440);
    assertNonNegativeInteger(summary.newItems, "Daily new items");
    assertNonNegativeInteger(summary.reviews, "Daily reviews");
    assertRecord(summary.skills, "Daily skill analytics");
    for (const [skill, aggregate] of Object.entries(summary.skills)) {
      if (!SKILL_IDS.includes(skill)) throw new Error("The progress contains invalid daily skill analytics.");
      try {
        validateSkillAggregate(aggregate, `${skill} daily analytics`, false);
      } catch {
        throw new Error("The progress contains invalid daily skill analytics.");
      }
    }
  }
  assertUnique(dailyDates, "Daily analytics dates");

  for (const [id, stat] of Object.entries(progress.milestoneStats)) {
    assertRecord(stat, `Milestone statistics for ${id}`);
    assertNonNegativeInteger(stat.attempts, `Milestone attempts for ${id}`);
    assertScore(stat.lastAutoScore, `Last milestone score for ${id}`);
    assertScore(stat.bestAutoScore, `Best milestone score for ${id}`);
    if (stat.bestAutoScore < stat.lastAutoScore) throw new Error(`Best milestone score for ${id} is not valid.`);
    assertTimestamp(stat.lastAttempted, `Last milestone attempt for ${id}`, true);
    if (stat.lastSpeakingRating !== null && !Object.hasOwn(RATING_SCORES, stat.lastSpeakingRating)) throw new Error(`The speaking rating for ${id} is not valid.`);
    assertTimestamp(stat.passedAt, `Milestone pass time for ${id}`, true);
  }

  validateActiveSession(progress.activeSession);
  return progress;
}

export function normaliseProgress(saved, now = new Date()) {
  if (!isRecord(saved)) throw new Error("Saved progress must be an object.");
  return validateProgress({ ...DEFAULT_PROGRESS, ...migrateProgress(saved, now) });
}

/**
 * Read progress without mutating storage. A recovery result means callers must
 * not immediately persist the fallback state, otherwise the unreadable raw
 * value would be overwritten before the learner chooses to reset it.
 */
export function loadProgressResult(now = new Date(), storage) {
  let raw;
  try {
    raw = (storage ?? globalThis.localStorage).getItem(PROGRESS_STORAGE_KEY);
  } catch (error) {
    return {
      progress: freshProgress(now),
      status: "unavailable",
      recoveryRequired: true,
      error: error instanceof Error ? error.message : "Browser storage is unavailable.",
    };
  }
  if (raw === null) return { progress: freshProgress(now), status: "empty", recoveryRequired: false, error: null };
  try {
    return { progress: normaliseProgress(JSON.parse(raw), now), status: "loaded", recoveryRequired: false, error: null };
  } catch (error) {
    return {
      progress: freshProgress(now),
      status: "recovery",
      recoveryRequired: true,
      error: error instanceof Error ? error.message : "Saved progress could not be read.",
    };
  }
}

export function loadProgress(now = new Date()) {
  return loadProgressResult(now).progress;
}

export function saveProgress(progress, storage) {
  try {
    validateProgress(progress);
  } catch (error) {
    return { ok: false, reason: "validation", error: error instanceof Error ? error.message : "Progress is not valid." };
  }
  try {
    (storage ?? globalThis.localStorage).setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return { ok: true, reason: null, error: null };
  } catch (error) {
    return { ok: false, reason: "storage", error: error instanceof Error ? error.message : "Progress could not be saved." };
  }
}

export function introducePhrase(progress, phraseId, now = new Date()) {
  const today = localDate(now);
  const learnedPhrases = progress.learnedPhrases.includes(phraseId)
    ? progress.learnedPhrases
    : [...progress.learnedPhrases, phraseId];
  if (progress.phraseStats?.[phraseId]) return { ...progress, learnedPhrases };
  return {
    ...progress,
    analyticsSince: progress.analyticsSince ?? today,
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

  const dailyStats = mergeDailySummary(next.dailyStats ?? [], today, {
    minutes,
    newItems: phraseId && introduction ? 1 : 0,
    reviews: review ? 1 : 0,
  });

  return {
    ...next,
    analyticsSince: next.analyticsSince ?? today,
    xp: next.xp + xp,
    streak,
    lastStudyDate: today,
    studyDates: studyDates.includes(today) ? studyDates : [...studyDates.slice(-59), today],
    todayMinutes: firstStudyToday ? minutes : next.todayMinutes + minutes,
    totalReviews: next.totalReviews + (review ? 1 : 0),
    completedUnits: unitId && !next.completedUnits.includes(unitId)
      ? [...next.completedUnits, unitId]
      : next.completedUnits,
    dailyStats,
  };
}

function mergeDailySummary(dailyStats, date, changes = {}) {
  const current = dailyStats.find((item) => item.date === date) ?? { date, minutes: 0, newItems: 0, reviews: 0, skills: {} };
  const skills = { ...(current.skills ?? {}) };
  if (changes.skill) {
    const existing = skills[changes.skill] ?? { attempts: 0, points: 0 };
    skills[changes.skill] = { attempts: existing.attempts + 1, points: existing.points + changes.score };
  }
  const merged = {
    ...current,
    minutes: current.minutes + (changes.minutes ?? 0),
    newItems: current.newItems + (changes.newItems ?? 0),
    reviews: current.reviews + (changes.reviews ?? 0),
    skills,
  };
  const cutoff = addDays(date, -179);
  return [...dailyStats.filter((item) => item.date !== date && item.date >= cutoff), merged]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-180);
}

export function recordAttempt(progress, event) {
  if (!event || typeof event !== "object") throw new Error("Attempt must be an object.");
  if (!contentIds.has(event.itemId)) throw new Error(`Unknown content item: ${event.itemId}`);
  if (!SKILL_IDS.includes(event.skill)) throw new Error(`Unknown skill: ${event.skill}`);
  if (![...PRACTICE_MODES, "milestone"].includes(event.mode)) throw new Error(`Unknown practice mode: ${event.mode}`);
  if (!Number.isFinite(event.score) || event.score < 0 || event.score > 1) throw new Error("Attempt score must be between 0 and 1.");
  const occurred = new Date(event.occurredAt);
  if (!event.occurredAt || Number.isNaN(occurred.getTime())) throw new Error("Attempt timestamp is invalid.");
  const date = localDate(occurred);
  const itemStats = progress.skillStats?.[event.itemId] ?? {};
  const current = itemStats[event.skill] ?? { attempts: 0, points: 0, lastScore: 0, lastAttempted: null };
  return {
    ...progress,
    analyticsSince: progress.analyticsSince ?? date,
    skillStats: {
      ...(progress.skillStats ?? {}),
      [event.itemId]: {
        ...itemStats,
        [event.skill]: {
          attempts: current.attempts + 1,
          points: current.points + event.score,
          lastScore: event.score,
          lastAttempted: occurred.toISOString(),
        },
      },
    },
    dailyStats: mergeDailySummary(progress.dailyStats ?? [], date, { skill: event.skill, score: event.score }),
  };
}

export function scoreForRating(rating) {
  if (!Object.hasOwn(RATING_SCORES, rating)) throw new Error(`Unknown rating: ${rating}`);
  return RATING_SCORES[rating];
}

export function recordMilestoneResult(progress, milestoneId, autoScores, speakingRating, now = new Date()) {
  if (!milestoneIds.has(milestoneId)) throw new Error(`Unknown milestone: ${milestoneId}`);
  if (!Array.isArray(autoScores) || autoScores.length !== 9 || autoScores.some((score) => !Number.isFinite(score) || score < 0 || score > 1)) throw new Error("Milestones require nine scores between 0 and 1.");
  if (!Object.hasOwn(RATING_SCORES, speakingRating)) throw new Error("A speaking self-rating is required.");
  const current = progress.milestoneStats?.[milestoneId] ?? { attempts: 0, lastAutoScore: 0, bestAutoScore: 0, lastAttempted: null, lastSpeakingRating: null, passedAt: null };
  const mean = Number((autoScores.reduce((sum, score) => sum + score, 0) / autoScores.length).toFixed(4));
  const attemptedAt = now.toISOString();
  return {
    ...progress,
    milestoneStats: {
      ...(progress.milestoneStats ?? {}),
      [milestoneId]: {
        attempts: current.attempts + 1,
        lastAutoScore: mean,
        bestAutoScore: Math.max(current.bestAutoScore, mean),
        lastAttempted: attemptedAt,
        lastSpeakingRating: speakingRating,
        passedAt: current.passedAt ?? (mean >= 0.8 && speakingRating !== "again" ? attemptedAt : null),
      },
    },
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
  const dueReviews = due.slice(0, budget.reviewCount).map((phrase) => ({ phrase, reinforcement: false }));
  const fallbackSlots = budget.reviewCount - dueReviews.length;
  const fallbackReviews = learnedFallback.slice(0, fallbackSlots).map((phrase) => ({ phrase, reinforcement: true }));
  const reinforcementSlots = budget.reviewCount - dueReviews.length - fallbackReviews.length;
  const newReinforcement = newPhrases.length
    ? Array.from({ length: reinforcementSlots }, (_, index) => ({ phrase: newPhrases[index % newPhrases.length], reinforcement: true }))
    : [];
  const reviewEntries = [...dueReviews, ...fallbackReviews, ...newReinforcement];
  const nextUnit = units.find((unit) => !progress.completedUnits.includes(unit.id)) ?? units.at(-1);
  const currentStageIndex = Math.max(0, STAGES.indexOf(nextUnit.stage));
  const eligibleDialogues = dialogues.filter((item) => STAGES.indexOf(item.stage) <= currentStageIndex);
  const dialogue = [...eligibleDialogues].sort((left, right) => {
    const a = progress.dialogueStats?.[left.id] ?? { completions: 0, lastCompleted: "" };
    const b = progress.dialogueStats?.[right.id] ?? { completions: 0, lastCompleted: "" };
    return a.completions - b.completions || String(a.lastCompleted ?? "").localeCompare(String(b.lastCompleted ?? "")) || stableScore(`${date}-${left.id}`) - stableScore(`${date}-${right.id}`);
  })[0];

  const tasks = [
    ...newPhrases.map((phrase, index) => ({ id: `learn-${phrase.id}`, type: "learn", phraseId: phrase.id, unitId: phrase.unitId, index })),
    ...reviewEntries.map(({ phrase, reinforcement }, index) => ({ id: `${reinforcement ? "reinforce" : "review"}-${index}-${phrase.id}`, type: "review", mode: reviewMode(phrase, index), phraseId: phrase.id, ...(reinforcement ? { reinforcement: true } : {}) })),
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
  if (!isRecord(envelope) || envelope.app !== "polish-first" || !isRecord(envelope.progress)) {
    throw new Error("This is not a Polish First progress export.");
  }
  const schemaVersion = Number(envelope.schemaVersion ?? envelope.progress.version ?? 1);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) throw new Error("This export has an invalid schema version.");
  if (schemaVersion > PROGRESS_VERSION) throw new Error("This export was created by a newer app version.");
  try {
    return normaliseProgress(envelope.progress, now);
  } catch (error) {
    if (error instanceof Error && error.message.includes("content IDs")) {
      throw new Error("The export contains content IDs this version does not recognise.");
    }
    if (error instanceof Error && error.message.includes("too many daily analytics")) {
      throw new Error("The export contains too many daily analytics entries.");
    }
    if (error instanceof Error && error.message.includes("skill analytics")) {
      throw new Error("The export contains invalid skill analytics.");
    }
    throw error;
  }
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

export function scoreWriting(item, input) {
  const value = normalisePolish(input);
  if (!value) return 0;
  if ((item.acceptedAnswers ?? []).some((answer) => normalisePolish(answer) === value)) return 1;
  if (item.kind === "translation") return 0;
  const tokens = new Set(value.split(/\s+/));
  return (item.requiredTokens ?? []).every((token) => tokens.has(normalisePolish(token))) ? 1 : 0;
}

export function scoreCloze(item, input) {
  const value = normalisePolish(input);
  return (item.acceptedAnswers ?? []).some((answer) => normalisePolish(answer) === value) ? 1 : 0;
}

export function scoreReading(item, answers) {
  if (!Array.isArray(answers) || !item.questions?.length) return 0;
  const correct = item.questions.reduce((sum, question, index) => sum + (answers[index] === question.answerIndex ? 1 : 0), 0);
  return correct / item.questions.length;
}

export function skillOverview(progress) {
  const totals = Object.fromEntries(SKILL_IDS.map((skill) => [skill, { skill, attempts: 0, points: 0, mean: null, lastAttempted: null }]));
  for (const item of Object.values(progress.skillStats ?? {})) {
    for (const [skill, aggregate] of Object.entries(item ?? {})) {
      if (!totals[skill]) continue;
      totals[skill].attempts += aggregate.attempts ?? 0;
      totals[skill].points += aggregate.points ?? 0;
      if (aggregate.lastAttempted && (!totals[skill].lastAttempted || aggregate.lastAttempted > totals[skill].lastAttempted)) totals[skill].lastAttempted = aggregate.lastAttempted;
    }
  }
  return SKILL_IDS.map((skill) => ({
    ...totals[skill],
    mean: totals[skill].attempts ? totals[skill].points / totals[skill].attempts : null,
    label: skillLabel(totals[skill].attempts, totals[skill].attempts ? totals[skill].points / totals[skill].attempts : null),
  }));
}

export function skillLabel(attempts, mean) {
  if (attempts < 5) return "Not enough evidence";
  if (mean < 0.6) return "Needs focus";
  if (mean < 0.8) return "Developing";
  return "Strong";
}

export function topicOverview(progress, now = new Date()) {
  const dueIds = new Set(getDuePhrases(progress, now).map((phrase) => phrase.id));
  return [...new Set(units.map((unit) => unit.topic))].map((topic) => {
    const phrases = allPhrases.filter((phrase) => phrase.topic === topic);
    const learned = phrases.filter((phrase) => progress.learnedPhrases.includes(phrase.id));
    const intervals = learned.map((phrase) => progress.phraseStats?.[phrase.id]?.intervalDays ?? 0);
    return {
      topic,
      seen: learned.length,
      total: phrases.length,
      due: phrases.filter((phrase) => dueIds.has(phrase.id)).length,
      meanInterval: intervals.length ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length : 0,
    };
  });
}

export function performanceTrend(progress, days = 30, now = new Date()) {
  const today = localDate(now);
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index - days + 1);
    const summary = (progress.dailyStats ?? []).find((item) => item.date === date);
    const skills = Object.values(summary?.skills ?? {});
    const attempts = skills.reduce((sum, item) => sum + (item.attempts ?? 0), 0);
    const points = skills.reduce((sum, item) => sum + (item.points ?? 0), 0);
    return { date, attempts, mean: attempts ? points / attempts : null };
  });
}

export function dueForecast(progress, days = 7, now = new Date()) {
  const today = localDate(now);
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index);
    return {
      date,
      due: Object.values(progress.phraseStats ?? {}).filter((stat) => index === 0 ? (stat.dueDate ?? today) <= date : stat.dueDate === date).length,
    };
  });
}

export function milestoneOverview(progress) {
  return milestones.map((milestone) => {
    const stageUnits = units.filter((unit) => unit.stage === milestone.stage);
    const ready = stageUnits.length > 0 && stageUnits.every((unit) => progress.completedUnits.includes(unit.id));
    const result = progress.milestoneStats?.[milestone.id] ?? null;
    return { ...milestone, ready, passed: Boolean(result?.passedAt), result };
  });
}

function rankSkills(skills) {
  return [...skills].sort((left, right) => (left.mean ?? 1) - (right.mean ?? 1) || right.attempts - left.attempts || SKILL_IDS.indexOf(left.skill) - SKILL_IDS.indexOf(right.skill));
}

export function nextRecommendation(progress, now = new Date()) {
  const due = getDuePhrases(progress, now);
  if (due.length) return { kind: "practice", mode: "flashcards", topic: "All", itemIds: due.slice(0, 12).map((phrase) => phrase.id), reason: `${due.length} phrase${due.length === 1 ? " is" : "s are"} due for review.` };

  const milestone = milestoneOverview(progress).find((item) => item.ready && !item.passed);
  if (milestone) return { kind: "milestone", milestoneId: milestone.id, reason: `${milestone.stage} is complete. Check your scenario readiness.` };

  const skills = skillOverview(progress);
  const weak = rankSkills(skills.filter((skill) => skill.attempts >= 5 && skill.mean < 0.7))[0];
  if (weak) return { kind: "practice", mode: SKILL_MODE[weak.skill], topic: "All", reason: `${weak.skill} is your clearest focus area from recent evidence.` };

  const incomplete = units.find((unit) => !progress.completedUnits.includes(unit.id));
  if (incomplete) return { kind: "unit", unitId: incomplete.id, reason: `Continue with Unit ${incomplete.number}: ${incomplete.title}.` };

  const practised = rankSkills(skills.filter((skill) => skill.attempts > 0));
  if (practised.length) return { kind: "practice", mode: SKILL_MODE[practised[0].skill], topic: "All", reason: `Keep strengthening your least-practised skill: ${practised[0].skill}.` };
  return { kind: "practice", mode: "flashcards", topic: "All", reason: "Keep the complete course fresh with mixed recall." };
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
