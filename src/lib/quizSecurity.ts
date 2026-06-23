// Shared (client + server safe) constants for quiz progress recovery.
// NOTE: keep this file free of Node-only APIs (e.g. crypto) so it can be
// imported by client components. The answer hashing lives in
// quizSecurity.server.ts.

/** Preset security questions a user can choose from to protect their progress. */
export const SECURITY_QUESTIONS = [
  "What is your favourite book of the Bible?",
  "What city were you born in?",
  "What was your childhood nickname?",
  "What is your mother's first name?",
  "What was the name of your first school?",
  "What is your favourite hymn or worship song?",
];

/** A user may change their own security question at most once every N days. */
export const SELF_RESET_COOLDOWN_DAYS = 30;

/** Normalise an answer before hashing/comparing (case- and space-insensitive). */
export function normalizeSecurityAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}
