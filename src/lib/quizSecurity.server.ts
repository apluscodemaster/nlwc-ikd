// Server-only: imported exclusively by quiz API routes (never by client code).
import { createHmac } from "crypto";
import { normalizeSecurityAnswer } from "./quizSecurity";

// Server-side pepper for hashing security answers. Falls back to WEBHOOK_SECRET
// so the feature works without extra config, but a dedicated value is best.
const PEPPER =
  process.env.QUIZ_SECURITY_PEPPER ||
  process.env.WEBHOOK_SECRET ||
  "nlwc-quiz-security-fallback-pepper";

/** Hash a security answer (HMAC-SHA256 over the normalised answer + pepper). */
export function hashSecurityAnswer(answer: string): string {
  return createHmac("sha256", PEPPER)
    .update(normalizeSecurityAnswer(answer))
    .digest("hex");
}
