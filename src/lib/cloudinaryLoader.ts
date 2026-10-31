import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader that asks Cloudinary for the exact width the browser
 * needs, instead of routing Cloudinary images through Vercel's image
 * optimizer. Cloudinary already resizes, compresses and picks the format
 * (f_auto/q_auto), so going through Vercel as well optimised every image
 * twice and counted each one against Vercel's billed image transformations.
 *
 * The URL's existing transformations (crops, effects) are kept and a final
 * resize step is appended after them, so the image looks the same — just at
 * the right size.
 */

const UPLOAD = "/image/upload/";
/** A Cloudinary transformation segment, e.g. "c_fill,g_auto,w_1200,q_auto". */
const TRANSFORM_SEGMENT = /^[a-z]{1,3}_[^/]*(?:,[a-z]{1,3}_[^/]*)*$/;

export function isCloudinaryUrl(src: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(src);
}

export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const at = src.indexOf(UPLOAD);
  if (at === -1) return src;

  const head = src.slice(0, at + UPLOAD.length);
  const segments = src.slice(at + UPLOAD.length).split("/");

  // Keep the URL's own transformation segments in order…
  let i = 0;
  while (i < segments.length - 1 && TRANSFORM_SEGMENT.test(segments[i])) i++;
  const transforms = segments.slice(0, i);
  // …then resize last. c_limit never upscales past the source.
  transforms.push(
    `c_limit,w_${width},q_${quality ? Math.round(quality) : "auto"},f_auto`,
  );

  return head + [...transforms, ...segments.slice(i)].join("/");
}

/**
 * Spread onto a next/image: `<Image {...cloudinaryImageProps(src)} … />`.
 * Uses the Cloudinary loader for Cloudinary URLs and leaves any other image
 * on the default optimizer.
 */
export function cloudinaryImageProps(src: string) {
  return isCloudinaryUrl(src) ? { loader: cloudinaryLoader } : {};
}
