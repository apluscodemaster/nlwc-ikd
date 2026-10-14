/**
 * Share-image upscaling — Server-only
 *
 * Link previews are shown at 1200px wide. A WordPress featured image smaller
 * than that gets stretched by Facebook/WhatsApp/LinkedIn and looks soft, and
 * WordPress can't make it any bigger. So such an image is copied once into
 * Cloudinary (`share-images/…`) and the preview points at a Cloudinary
 * rendition run through `e_upscale` (AI super-resolution) and scaled to 1200px.
 *
 * Cloudinary can't pull from WordPress on the fly (remote "fetch" delivery is
 * disabled on this account), hence the one-time upload. Any failure falls back
 * to the original image, so a share preview is never broken by this.
 */

import crypto from "crypto";
import type { ShareImage } from "@/lib/wordpress";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/** Width link previews are displayed at. */
const TARGET_WIDTH = 1200;
const FOLDER = "share-images";

/** Uploads already confirmed in this server process (skips the HEAD check). */
const known = new Set<string>();

/**
 * Deterministic Cloudinary id per source URL: the same WordPress image is
 * only ever uploaded once, and replacing it in WordPress (new file URL) gives
 * it a new id automatically.
 */
function publicIdFor(sourceUrl: string): string {
  const hash = crypto.createHash("sha1").update(sourceUrl).digest("hex");
  return `${FOLDER}/wp-${hash.slice(0, 20)}`;
}

function deliveryUrl(publicId: string, transform?: string): string {
  const t = transform ? `${transform}/` : "";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}${publicId}`;
}

async function alreadyUploaded(publicId: string): Promise<boolean> {
  if (known.has(publicId)) return true;
  const res = await fetch(deliveryUrl(publicId), {
    method: "HEAD",
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (res.ok) known.add(publicId);
  return res.ok;
}

/** Signed upload of a remote URL — Cloudinary downloads it server-side. */
async function uploadFromUrl(sourceUrl: string, publicId: string) {
  const timestamp = Math.round(Date.now() / 1000).toString();
  // Signature params in alphabetical order (file/api_key are excluded).
  const signature = crypto
    .createHash("sha1")
    .update(
      `overwrite=false&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`,
    )
    .digest("hex");

  const form = new FormData();
  form.append("file", sourceUrl);
  form.append("public_id", publicId);
  form.append("overwrite", "false");
  form.append("timestamp", timestamp);
  form.append("api_key", API_KEY!);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form, signal: AbortSignal.timeout(15000) },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: { message?: string } }).error?.message ||
        `Cloudinary upload returned ${res.status}`,
    );
  }
  known.add(publicId);
}

/**
 * A preview-ready version of `image`: unchanged when it is already at least
 * 1200px wide (or its size is unknown), otherwise an AI-upscaled 1200px-wide
 * Cloudinary copy with the same aspect ratio.
 */
export async function sharpShareImage(image: ShareImage): Promise<ShareImage> {
  if (!image.width || !image.height || image.width >= TARGET_WIDTH) {
    return image;
  }
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) return image;

  try {
    const publicId = publicIdFor(image.url);
    if (!(await alreadyUploaded(publicId))) {
      await uploadFromUrl(image.url, publicId);
    }

    const url = deliveryUrl(
      publicId,
      `e_upscale/c_scale,w_${TARGET_WIDTH}/f_jpg,q_auto:best`,
    );
    // The upscale runs on the first request for this rendition; warm it now
    // so a link previewer (which may give up after a few seconds) gets the
    // cached result rather than waiting on it.
    void fetch(url, { cache: "no-store" }).catch(() => {});

    return {
      url,
      width: TARGET_WIDTH,
      height: Math.round((image.height * TARGET_WIDTH) / image.width),
    };
  } catch (error) {
    console.error("Share image upscale failed; using original:", error);
    return image;
  }
}
