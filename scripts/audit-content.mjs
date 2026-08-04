import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { allPhrases, validateCourseContent } from "../src/data/course.js";
import { REVIEWED_AUDIO, validateReviewedAudioManifest } from "../src/data/audio-manifest.js";
import { CONTENT_REVIEWS, validateContentReviewManifest } from "../src/data/content-review-manifest.js";

const PRIORITY_COUNT = 200;
const priority = allPhrases.slice(0, PRIORITY_COUNT);
const phraseById = new Map(allPhrases.map((phrase) => [phrase.id, phrase]));
const audioById = new Map(REVIEWED_AUDIO.map((entry) => [entry.phraseId, entry]));
const errors = [];

try { validateCourseContent(); } catch (error) { errors.push(...error.message.split("\n")); }
try { validateReviewedAudioManifest(); } catch (error) { errors.push(...error.message.split("\n")); }
try { validateContentReviewManifest(); } catch (error) { errors.push(...error.message.split("\n")); }

for (const entry of REVIEWED_AUDIO) {
  const phrase = phraseById.get(entry.phraseId);
  if (!phrase) errors.push(`${entry.phraseId}: audio references unknown phrase`);
  else if (phrase.polish !== entry.polish) errors.push(`${entry.phraseId}: audio Polish text does not match course content`);
  if (entry.src && !existsSync(resolve("public", entry.src.replace(/^\//, "")))) errors.push(`${entry.phraseId}: audio file is missing at public${entry.src}`);
}
for (const phraseId of Object.keys(CONTENT_REVIEWS)) if (!phraseById.has(phraseId)) errors.push(`${phraseId}: review references unknown phrase`);

const rows = priority.map((phrase, index) => {
  const review = CONTENT_REVIEWS[phrase.id] ?? null;
  const audio = audioById.get(phrase.id) ?? null;
  return {
    priority: index + 1,
    phraseId: phrase.id,
    stage: phrase.stage,
    topic: phrase.topic,
    polish: phrase.polish,
    english: phrase.english,
    phonetic: phrase.phonetic,
    textStatus: review?.textStatus ?? "pending-human-review",
    phoneticStatus: review?.phoneticStatus ?? "pending-human-review",
    audioStatus: audio ? "reviewed-recording" : "device-voice-fallback",
  };
});

const summary = {
  priorityCount: rows.length,
  textReviewed: rows.filter((row) => row.textStatus === "reviewed").length,
  phoneticReviewed: rows.filter((row) => row.phoneticStatus === "reviewed").length,
  reviewedAudio: rows.filter((row) => row.audioStatus === "reviewed-recording").length,
  errors,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify({ summary, items: rows }, null, 2)}\n`);
} else {
  console.log(`Priority content QA (${rows.length} phrases)`);
  console.log(`Text reviewed: ${summary.textReviewed}/${rows.length}`);
  console.log(`Phonetics reviewed: ${summary.phoneticReviewed}/${rows.length}`);
  console.log(`Native recordings: ${summary.reviewedAudio}/${rows.length}`);
  console.log(`Manifest errors: ${errors.length}`);
  if (errors.length) errors.forEach((error) => console.error(`- ${error}`));
  const pending = rows.filter((row) => row.textStatus !== "reviewed" || row.phoneticStatus !== "reviewed" || row.audioStatus !== "reviewed-recording").slice(0, 10);
  if (pending.length) console.log(`Next queue: ${pending.map((row) => row.phraseId).join(", ")}`);
}

if (errors.length || (process.argv.includes("--strict") && summary.textReviewed + summary.phoneticReviewed + summary.reviewedAudio < rows.length * 3)) process.exitCode = 1;
