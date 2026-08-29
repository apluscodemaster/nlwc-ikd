/**
 * Display identity for the signed-in admin.
 *
 * The admin area signs in with `signInWithEmailAndPassword` — there is no Google
 * provider wired up — so `user.displayName` is only populated when someone has
 * explicitly set it on the Firebase account (console, or `updateProfile`). It is
 * NOT filled in automatically.
 *
 * So the resolution order is:
 *
 *   1. `displayName` — the real profile name when it exists. This is also what
 *      would flow in automatically if Google sign-in is added later, so no
 *      change here would be needed then.
 *   2. A name derived from the email's local part — "adebanjo.adeniji@…"
 *      becomes "Adebanjo Adeniji". This is what makes the panel show a proper
 *      first/last name today, with nothing to configure.
 *   3. "Administrator", so the UI never renders an empty string.
 */

export interface AdminIdentity {
  /** Best available human name. Never empty. */
  name: string;
  /** Up to two letters for the avatar. Never empty. */
  initials: string;
  /** True when `name` came from a real profile rather than the email. */
  fromProfile: boolean;
}

/** Tokens that are an email local part but never a person's name. */
const NON_NAME_LOCALPARTS = new Set([
  "admin",
  "administrator",
  "info",
  "contact",
  "hello",
  "support",
  "team",
  "office",
  "mail",
  "noreply",
  "no-reply",
]);

function titleCase(token: string): string {
  if (!token) return "";
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

/**
 * Turn an email local part into a plausible display name.
 * Returns null when nothing name-like can be recovered.
 */
export function nameFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const at = email.indexOf("@");
  let local = at === -1 ? email : email.slice(0, at);

  // Drop plus-addressing: "john.doe+admin@…" is still John Doe.
  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);

  if (!local) return null;
  if (NON_NAME_LOCALPARTS.has(local.toLowerCase())) return null;

  const tokens = local
    .split(/[._\-\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    // A trailing counter ("john.doe2") isn't part of the name.
    .filter((t) => !/^\d+$/.test(t));

  if (tokens.length === 0) return null;

  return tokens.map(titleCase).join(" ");
}

/** First letter of the first and last word, e.g. "Adebanjo Adeniji" → "AA". */
export function initialsFromName(name: string): string {
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "A";
  if (tokens.length === 1) return tokens[0].charAt(0).toUpperCase();
  return (
    tokens[0].charAt(0).toUpperCase() +
    tokens[tokens.length - 1].charAt(0).toUpperCase()
  );
}

/**
 * Resolve what the sidebar should show. Takes the two fields it needs rather
 * than a Firebase `User`, so it stays trivially testable and usable server-side.
 */
export function resolveAdminIdentity(input: {
  displayName?: string | null;
  email?: string | null;
}): AdminIdentity {
  const profileName = input.displayName?.trim();
  if (profileName) {
    return {
      name: profileName,
      initials: initialsFromName(profileName),
      fromProfile: true,
    };
  }

  const derived = nameFromEmail(input.email);
  if (derived) {
    return {
      name: derived,
      initials: initialsFromName(derived),
      fromProfile: false,
    };
  }

  const fallbackInitial = input.email?.trim().charAt(0).toUpperCase() || "A";
  return {
    name: "Administrator",
    initials: fallbackInitial,
    fromProfile: false,
  };
}
