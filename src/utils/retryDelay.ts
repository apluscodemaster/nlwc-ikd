/**
 * How long to wait before retry `attempt` (1, 2, 3…) after a 429 Too Many
 * Requests: the server's Retry-After when it sends one (capped at 15 s), else
 * 2 s, 4 s, 8 s. WordPress's host rate-limits bursts.
 */
export function retryDelayMs(attempt: number, retryAfter: string | null): number {
  const seconds = Number(retryAfter);
  if (retryAfter && Number.isFinite(seconds) && seconds >= 0) return Math.min(15, seconds) * 1000;
  return 1000 * 2 ** attempt;
}
