export const DEFAULT_PROGRESS = {
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  completedUnits: [],
  learnedPhrases: [],
  dailyGoal: 15,
  todayMinutes: 0,
  totalReviews: 0,
};

export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("polish-first-progress"));
    return saved ? { ...DEFAULT_PROGRESS, ...saved } : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress) {
  localStorage.setItem("polish-first-progress", JSON.stringify(progress));
}

export function addStudy(progress, { xp = 0, minutes = 0, phraseId, unitId, review = false } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  let streak = progress.streak;

  if (progress.lastStudyDate !== today) {
    streak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;
  }

  return {
    ...progress,
    xp: progress.xp + xp,
    streak,
    lastStudyDate: today,
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
