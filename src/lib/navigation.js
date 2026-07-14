const VIEW_IDS = new Set(["home", "session", "course", "practice", "sounds", "dialogues", "grammar", "data"]);

export function viewFromHash(hash = "") {
  const candidate = hash.replace(/^#\/?/, "").split("/")[0];
  return VIEW_IDS.has(candidate) ? candidate : "home";
}
