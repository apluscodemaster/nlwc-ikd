/**
 * Normalise a sermon's audio URL into something an <audio> element can stream.
 *
 * Sermon MP3s used to live only on S3, where the pasted link is already the
 * file. Google Drive is different: the link you get from "Share" or the Drive
 * app points at the *viewer page*, e.g.
 *
 *   https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
 *
 * Handing that to <audio src> fetches an HTML document, so playback fails
 * silently — the element just errors and never produces sound. The file has to
 * be requested through Drive's download host instead, which serves the bytes
 * with `Content-Type: audio/mpeg` and, crucially, `Accept-Ranges: bytes` so
 * seeking works.
 *
 * `confirm=t` is deliberate: for files past Drive's virus-scan threshold
 * (~25 MB — most sermons qualify) the plain download URL answers with an
 * HTML interstitial instead of the audio. The parameter skips it.
 *
 * Anything that is not a Drive link — S3, Cloudinary, a direct MP3 — is
 * returned untouched, so this is safe to apply to every URL.
 */

/** Drive host that actually serves file bytes (not the viewer UI). */
const DRIVE_DOWNLOAD_HOST = "https://drive.usercontent.google.com/download";

/**
 * Pull a Drive file ID out of any of the shapes Drive hands out:
 *   /file/d/<id>/view      (Share button, mobile app)
 *   /d/<id>                (short form)
 *   ?id=<id> / &id=<id>    (uc?export=download, open?id=)
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const match =
    /\/(?:file\/)?d\/([a-zA-Z0-9_-]{10,})/.exec(url) ||
    /[?&]id=([a-zA-Z0-9_-]{10,})/.exec(url);
  return match ? match[1] : null;
}

/** Whether this URL points at Google Drive in any form. */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return /(^|\/\/)(drive|docs)\.google\.com|drive\.usercontent\.google\.com/.test(
    url,
  );
}

/**
 * Convert a Drive share/view URL into a streamable one. Non-Drive URLs and
 * URLs already pointing at the download host are returned unchanged.
 */
export function toStreamableAudioUrl(url: string): string;
export function toStreamableAudioUrl(url: undefined): undefined;
export function toStreamableAudioUrl(
  url: string | undefined,
): string | undefined;
export function toStreamableAudioUrl(
  url: string | undefined,
): string | undefined {
  if (!url) return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (!isGoogleDriveUrl(trimmed)) return trimmed;

  // Already the download host — leave it alone rather than round-tripping it,
  // so a URL that someone tuned by hand (extra params, a resourcekey) survives.
  if (trimmed.startsWith(DRIVE_DOWNLOAD_HOST)) return trimmed;

  const id = extractDriveFileId(trimmed);
  // A Drive URL with no recognisable file ID (a folder link, say) is left as
  // it is: rewriting it to a broken download URL would be worse than failing
  // with the original, which at least opens in a browser.
  if (!id) return trimmed;

  return `${DRIVE_DOWNLOAD_HOST}?id=${id}&export=download&confirm=t`;
}

/**
 * The S3 bucket the sermon MP3s live in, in both URL styles
 * (virtual-hosted `bucket.s3.region…/key` and path-style `s3.region…/bucket/key`).
 */
const SERMON_BUCKET_ORIGINS = [
  /^https?:\/\/nlwc-ikorodu\.s3(?:[.-]us-east-2)?\.amazonaws\.com(?=\/)/i,
  /^https?:\/\/s3(?:[.-]us-east-2)?\.amazonaws\.com\/nlwc-ikorodu(?=\/)/i,
];

/**
 * Serve a sermon MP3 through the CDN (e.g. CloudFront) in front of the S3
 * bucket, when NEXT_PUBLIC_AUDIO_CDN_URL is set: same path, CDN origin. The
 * bucket is in Ohio (us-east-2); the CDN serves listeners from a nearby edge.
 *
 * Applied when sermons are READ (lib/audioSermons), never when they are
 * saved, so WordPress keeps the S3 URL and the CDN can be changed or
 * switched off by changing one setting. Other URLs (Drive, Cloudinary) and
 * everything when the setting is empty are returned unchanged.
 */
export function toCdnAudioUrl(
  url: string | undefined,
  cdnBase: string | undefined = process.env.NEXT_PUBLIC_AUDIO_CDN_URL,
): string | undefined {
  if (!url || !cdnBase?.trim()) return url;
  const base = cdnBase.trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(base)) return url;
  for (const origin of SERMON_BUCKET_ORIGINS) {
    if (origin.test(url)) return url.replace(origin, base);
  }
  return url;
}

/**
 * The audio link if it really is one, else undefined. Sermons edited directly
 * in WordPress can hold anything in the audio field (one had its title), and
 * handing that to the player just fails silently; undefined makes the pages
 * treat the sermon as having no audio instead.
 */
export function validAudioUrl(
  url: string | undefined | null,
): string | undefined {
  const trimmed = url?.trim();
  return trimmed && /^https?:\/\/\S+$/i.test(trimmed) ? trimmed : undefined;
}
