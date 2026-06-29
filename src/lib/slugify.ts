/**
 * Convert arbitrary text (e.g. a video message title) into a URL-safe slug.
 * Used to build and resolve shareable /video-messages/<slug> links, so the
 * share-link generator and the route resolver stay in lock-step.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-zA-Z0-9\s-]/g, "") // drop non-alphanumerics
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
