/**
 * The quiz's "review before you continue" rule, shared by the website
 * (FailedQuestionOverlay) and the app (quiz/play): after a wrong answer the
 * player must open one of the recommended messages (listen or read) before
 * the next question, unless there is nothing to open.
 */
import type { Recommendation } from "@/types/quiz";

type Linkable = Pick<Recommendation, "listen_url" | "read_url">;

/** At least one recommendation links to a message to listen to or read. */
export function hasClickableResource(
  recommendations: readonly Linkable[],
): boolean {
  return recommendations.some((r) => !!(r.listen_url || r.read_url));
}

/**
 * Whether Next / Finish stay locked. While recommendations are still loading
 * the answer is "locked", so a fast tap can't skip the review.
 */
export function mustReviewBeforeContinuing({
  answeredWrong,
  reviewed,
  recommendations,
  loading = false,
}: {
  answeredWrong: boolean;
  /** A recommended message has been opened for this question. */
  reviewed: boolean;
  recommendations: readonly Linkable[];
  loading?: boolean;
}): boolean {
  if (!answeredWrong || reviewed) return false;
  return loading || hasClickableResource(recommendations);
}
