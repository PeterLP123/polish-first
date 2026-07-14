import { allPhrases, legacyIdMap } from "../data/course.js";

export const PROGRESS_VERSION = 3;

export const DEFAULT_PROGRESS = {
  version: PROGRESS_VERSION,
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  completedUnits: [],
  learnedPhrases: [],
  studyDates: [],
  phraseStats: {},
  dailyGoal: 15,
  todayMinutes: 0,
  totalReviews: 0,
};

export function migrateProgress(saved) {
  let progress = saved;
  if ((progress.version ?? 1) < 2) {
    const remap = (id) => legacyIdMap[id] ?? id;
    progress = {
      ...progress,
      version: 2,
      completedUnits: (progress.completedUnits ?? []).map(remap),
      learnedPhrases: (progress.learnedPhrases ?? []).map(remap),
    };
  }
  if (progress.version < 3) {
    progress = {
      ...progress,
      version: 3,
      studyDates: progress.lastStudyDate ? [progress.lastStudyDate] : [],
      phraseStats: {},
    };
  }
  return progress;
}

export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("polish-first-progress"));
    return saved ? { ...DEFAULT_PROGRESS, ...migrateProgress(saved) } : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress) {
  localStorage.setItem("polish-first-progress", JSON.stringify(progress));
}

export function addStudy(progress, { xp = 0, minutes = 0, phraseId, unitId, review = false, phraseResult } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  let streak = progress.streak;

  if (progress.lastStudyDate !== today) {
    streak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;
  }

  const studyDates = progress.studyDates ?? [];
  const phraseStats = { ...(progress.phraseStats ?? {}) };
  if (phraseId && phraseResult !== undefined) {
    const current = phraseStats[phraseId] ?? { box: 0, last: null };
    phraseStats[phraseId] = { box: phraseResult ? Math.min(current.box + 1, 5) : 1, last: today };
  }

  return {
    ...progress,
    xp: progress.xp + xp,
    streak,
    lastStudyDate: today,
    studyDates: studyDates.includes(today) ? studyDates : [...studyDates.slice(-59), today],
    phraseStats,
    todayMinutes: progress.lastStudyDate === today ? progress.todayMinutes + minutes : minutes,
    totalReviews: progress.totalReviews + (review ? 1 : 0),
    learnedPhrases: phraseId && !progress.learnedPhrases.includes(phraseId)
      ? [...progress.learnedPhrases, phraseId]
      : progress.learnedPhrases,
    completedUnits: unitId && !progress.completedUnits.includes(unitId)
      ? [...progress.completedUnits, unitId]
      : progress.completedUnits,
  };
}

export function effectiveStreak(progress, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  return progress.lastStudyDate === today || progress.lastStudyDate === yesterday ? progress.streak : 0;
}

export function weekActivity(studyDates = [], now = new Date()) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const dayIndex = (now.getUTCDay() + 6) % 7;
  return labels.map((label, index) => {
    const iso = new Date(now.getTime() + (index - dayIndex) * 86_400_000).toISOString().slice(0, 10);
    return { label, done: studyDates.includes(iso), today: index === dayIndex };
  });
}

export function buildReviewDeck(progress, size = 12) {
  const learned = allPhrases.filter((phrase) => progress.learnedPhrases.includes(phrase.id));
  const pool = learned.length >= 5 ? learned : allPhrases.slice(0, 30);
  const stats = progress.phraseStats ?? {};
  const ranked = [...pool].sort((a, b) => {
    const left = stats[a.id] ?? { box: 0, last: "" };
    const right = stats[b.id] ?? { box: 0, last: "" };
    return left.box - right.box || String(left.last ?? "").localeCompare(String(right.last ?? ""));
  });
  return shuffled(ranked.slice(0, size));
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
