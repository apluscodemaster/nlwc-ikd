/**
 * Pure helpers for the Church Content admin — kept free of React so they can
 * be unit-tested and reused by the create forms and the edit modal alike.
 */

export const pad2 = (n: number | string) => String(n).padStart(2, "0");

/** Today's date as a YYYY-MM-DD picker value, in LOCAL calendar parts. */
export function todayInputValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** Convert any date string (a formatted label like "January 5, 2025" or an ISO
 *  string) to a YYYY-MM-DD value for the date picker, using LOCAL calendar
 *  parts so the day never shifts by one (toISOString would convert to UTC). */
export function toDateInputValue(value?: string): string {
  if (!value) return "";
  // A naive WordPress timestamp ("2026-07-28T00:15:00") carries no zone; take
  // its calendar parts literally instead of letting Date reinterpret them.
  const naive = /^(\d{4}-\d{2}-\d{2})T/.exec(value);
  if (naive) return naive[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Remove a single leading "Minister:/Speaker:" line from transcript/manual body
 * HTML, if one is present, so it can be re-derived from the speaker dropdown on
 * save.
 *
 * This is deliberately START-ANCHORED and matched against ONE leading node only.
 * The previous approach used a global, unanchored sweep
 * (`/(?:Minister|Speaker):\s*[^\n]*\n?/g`) that deleted everything from the first
 * "Minister:"/"Speaker:" occurrence to the next newline — when the leading
 * paragraph's markup varied even slightly, that ate the closing `</strong></p>`
 * and left a dangling `<p><strong>`, which rendered the rest of the document
 * bold and injected a stray "p>". Anchoring to the start makes it impossible to
 * touch the body: if the first node isn't a Minister/Speaker line, nothing is
 * removed.
 */
export function stripLeadingSpeakerLine(html: string): string {
  const out = html.replace(/^\s+/, "");
  // A leading paragraph whose text begins with Minister/Speaker, allowing any
  // emphasis wrapper (<strong>/<b>/<em>/<i>/<span>) and attributes. Non-greedy
  // up to the FIRST </p>, so only that one paragraph is removed.
  const leadingParagraph =
    /^<p\b[^>]*>(?:\s|<(?:strong|b|em|i|span)\b[^>]*>)*\s*(?:Minister|Speaker)\s*:[\s\S]*?<\/p>\s*/i;
  if (leadingParagraph.test(out)) return out.replace(leadingParagraph, "");
  // A leading bare "Minister: …" line (manuals / plain text). `[^\n<]*` stops at
  // the first newline or tag, so only the label line itself is removed.
  const leadingBare =
    /^(?:<(?:strong|b|em|i|span)\b[^>]*>)*\s*(?:Minister|Speaker)\s*:[^\n<]*(?:<br\s*\/?>)?\s*/i;
  return out.replace(leadingBare, "");
}

/**
 * Re-prepend the Minister line from the speaker dropdown. Transcripts get a
 * paragraph (they are rich HTML); manuals get a bare text line.
 *
 * Sermons get NOTHING prepended. They are Series Engine messages with a
 * first-class `speaker` column, so naming the minister inside the description
 * is redundant — and actively harmful: combined with the description not being
 * read back into the edit modal, saving a sermon used to replace its whole
 * description with the single line "Minister: <name>". Live rows were found in
 * exactly that state. The body is still stripped, so re-saving one of those
 * clears the stray line.
 */
export function withSpeakerLine(
  html: string,
  speaker: string,
  type: "transcript" | "manual" | "sermon",
): string {
  const body = stripLeadingSpeakerLine(html);
  if (!speaker || type === "sermon") return body;
  return type === "transcript"
    ? `<p><strong>Minister:</strong> ${speaker}</p>\n${body}`
    : `Minister: ${speaker}\n${body}`;
}
