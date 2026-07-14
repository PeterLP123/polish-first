import { TOPICS } from "../data/content/schema.js";

const VIEW_IDS = new Set(["home", "session", "course", "practice", "sounds", "dialogues", "grammar", "data"]);
const PRACTICE_MODES = new Set(["flashcards", "listen", "builder", "speak", "reading", "writing", "grammar"]);
const PRACTICE_TOPICS = new Set(["All", ...TOPICS]);

export function viewFromHash(hash = "") {
  const raw = hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?", 2);
  const candidate = path.split("/")[0];
  const view = VIEW_IDS.has(candidate) ? candidate : "home";
  const practice = { mode: "flashcards", topic: "All" };
  if (view !== "practice" || !query) return { view, practice };
  try {
    const params = new URLSearchParams(query);
    const modes = params.getAll("mode");
    const topics = params.getAll("topic");
    if (modes.length === 1 && PRACTICE_MODES.has(modes[0])) practice.mode = modes[0];
    if (topics.length === 1 && PRACTICE_TOPICS.has(topics[0])) practice.topic = topics[0];
  } catch {
    return { view, practice };
  }
  return { view, practice };
}
