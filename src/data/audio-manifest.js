// Human-reviewed assets belong here only after the checklist in docs/content-qa.md
// is complete. An empty manifest is intentional: browser speech remains the
// labelled fallback until a Polish speaker approves and records an item.
export const REVIEWED_AUDIO = [];

function lookupKey(value) {
  return String(value ?? "").toLocaleLowerCase("pl").replace(/\s+/g, " ").trim();
}

const audioByText = new Map(REVIEWED_AUDIO.map((entry) => [lookupKey(entry.polish), entry]));

export function reviewedAudioForText(text) {
  return audioByText.get(lookupKey(text)) ?? null;
}

export function validateReviewedAudioManifest(entries = REVIEWED_AUDIO) {
  const errors = [];
  const ids = new Set();
  const texts = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") { errors.push("Audio entry is not an object"); continue; }
    if (!entry.phraseId || ids.has(entry.phraseId)) errors.push(`${entry.phraseId || "unknown"}: missing or duplicate phraseId`);
    if (!entry.polish || texts.has(lookupKey(entry.polish))) errors.push(`${entry.phraseId || "unknown"}: missing or duplicate Polish text`);
    if (!String(entry.src ?? "").startsWith("/audio/reviewed/")) errors.push(`${entry.phraseId || "unknown"}: reviewed audio must live under /audio/reviewed/`);
    if (!entry.nativeReviewer || !entry.reviewedAt || !entry.usageRights) errors.push(`${entry.phraseId || "unknown"}: reviewer, review date, and usage rights are required`);
    ids.add(entry.phraseId);
    texts.add(lookupKey(entry.polish));
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return true;
}

