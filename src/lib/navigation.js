const VIEW_IDS = new Set(["home", "course", "practice", "sounds", "dialogues", "grammar"]);

export function viewFromHash(hash = "") {
  const candidate = hash.replace(/^#\/?/, "").split("/")[0];
  return VIEW_IDS.has(candidate) ? candidate : "home";
}
