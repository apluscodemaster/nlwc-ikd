/**
 * Cloudflare Turnstile verification for public forms (contact, testimonies).
 *
 * Fails OPEN when TURNSTILE_SECRET_KEY is not configured, so a missing secret
 * never breaks a form — the per-IP rate limit is then the only guard. With the
 * secret set, a request without a valid token is rejected.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(8000),
      },
    );
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/** True when the form must carry a Turnstile token. */
export function turnstileRequired(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}
