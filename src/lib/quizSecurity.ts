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

// ── Admin-issued recovery codes ─────────────────────────────────────────────
// For players locked out of their progress (typically those who chose a name
// before security questions existed). The admin issues a code or a link from
// /admin/quiz; both carry the same single-use credential.

/** How long an issued recovery code (and its link) stays valid. */
export const RECOVERY_CODE_TTL_HOURS = 24;

/** Query param a recovery link uses on /sermons/quiz. */
export const RECOVERY_LINK_PARAM = "recover";

/**
 * Normalise a typed recovery code before hashing/comparing: case-insensitive,
 * and dashes/spaces are only there for readability.
 */
export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** "KJ7Q4PXW" → "KJ7Q-4PXW" for display. */
export function formatRecoveryCode(code: string): string {
  const c = normalizeRecoveryCode(code);
  return c.length > 4 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}
