// Review claims are intentionally empty until supplied by a fluent/native
// Polish reviewer. See docs/content-qa.md for the required evidence fields.
export const CONTENT_REVIEWS = {};

export function validateContentReviewManifest(reviews = CONTENT_REVIEWS) {
  const errors = [];
  for (const [phraseId, review] of Object.entries(reviews)) {
    if (!review || typeof review !== "object") { errors.push(`${phraseId}: review is not an object`); continue; }
    if (review.textStatus !== "reviewed" || review.phoneticStatus !== "reviewed") errors.push(`${phraseId}: both text and phonetic status must be reviewed`);
    if (!review.nativeReviewer || !review.reviewedAt || !review.notes) errors.push(`${phraseId}: reviewer, review date, and notes are required`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return true;
}
