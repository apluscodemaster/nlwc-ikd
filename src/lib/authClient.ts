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
