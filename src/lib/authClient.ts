/**
 * Client-side helper to get the Authorization header for admin API calls.
 * Uses the currently signed-in Firebase user's ID token.
 */

import { auth } from "./firebase";

/**
 * Get Authorization header value for authenticated API requests.
 * Returns "Bearer <idToken>" or throws if no user is signed in.
 *
 * Uses forceRefresh=true to guarantee a valid token — prevents 401s
 * when the tab has been backgrounded or the cached token has expired.
 */
export async function getAuthorizationHeader(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated. Please sign in to the admin panel.");
  }

  const idToken = await user.getIdToken(true);
  return `Bearer ${idToken}`;
}

/**
 * `fetch` with the admin's Firebase ID token attached as a Bearer header.
 *
 * Every admin write goes through here so the token is never forgotten — the
 * /admin layout's login gate is client-side only and never protected the API.
 * A failure to mint a token still issues the request, which the server rejects
 * with 401; the caller's normal error handling surfaces that.
 */
export async function authFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const authHeader = await getAuthorizationHeader().catch(() => "");
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });
}
