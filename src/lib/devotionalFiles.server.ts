// Server-only: where devotional PDFs live in S3 (Daily_Devotionals/), shared
// by the upload/delete routes and scripts/migrate-devotionals-to-s3.mts.
// Devotionals uploaded before the move have a Cloudinary public id as their
// storagePath instead; isS3DevotionalKey tells them apart.
import { putObject, type S3Config } from "./s3.server";

export const DEVOTIONALS_PREFIX = "Daily_Devotionals/";

export function isS3DevotionalKey(
  storagePath: string | undefined | null,
): boolean {
  return !!storagePath && storagePath.startsWith(DEVOTIONALS_PREFIX);
}

/** "Faith That Works!" → "faith-that-works" (as the Cloudinary ids were made). */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/\.pdf$/i, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "devotional"
  );
}

/** A new, unique key for a devotional PDF. */
export function newDevotionalKey(name: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${DEVOTIONALS_PREFIX}${slugify(name)}-${suffix}.pdf`;
}

/**
 * Upload a devotional PDF (public, so the PDF viewer can open it). The URL
 * carries a version so a replaced file isn't served from a stale cache.
 */
export async function uploadDevotionalPdf(
  config: S3Config,
  key: string,
  body: Buffer,
): Promise<string> {
  const url = await putObject(config, key, body, "application/pdf", {
    publicRead: true,
  });
  return `${url}?v=${Date.now()}`;
}
