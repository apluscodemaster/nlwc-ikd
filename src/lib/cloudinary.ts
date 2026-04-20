/**
 * Cloudinary configuration and utility functions
 * Centralizes image quality and optimization settings
 */

const CLOUDINARY_CLOUD_NAME = "dj7rh8h6r";
const CLOUDINARY_QUALITY = 75;
const CLOUDINARY_QUALITY_OPTIMIZED = 80; // For high-visibility hero/feature images

/**
 * Get the base Cloudinary URL with optional quality parameter
 * @param publicId - The public ID of the image in Cloudinary
 * @param quality - Image quality (default: 75, range: 1-100)
 * @returns Full Cloudinary image URL
 */
export function getCloudinaryUrl(
  publicId: string,
  quality: number = CLOUDINARY_QUALITY
): string {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  // Add quality transformation if needed
  const params = quality ? `q_${quality}` : "";
  const path = params ? `/${params}` : "";
  return `${baseUrl}${path}/${publicId}`;
}

/**
 * Get a Cloudinary URL with custom transformations
 * @param publicId - The public ID of the image
 * @param transformations - Array of transformation strings (e.g., ['w_800', 'q_75'])
 * @returns Full Cloudinary image URL with transformations
 */
export function getCloudinaryUrlWithTransforms(
  publicId: string,
  transformations: string[] = []
): string {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const params = transformations.length ? `/${transformations.join("/")}` : "";
  return `${baseUrl}${params}/${publicId}`;
}

/**
 * Constants for common Cloudinary quality levels
 */
export const CLOUDINARY_QUALITY_LEVELS = {
  STANDARD: CLOUDINARY_QUALITY,
  OPTIMIZED: CLOUDINARY_QUALITY_OPTIMIZED,
  HIGH: 85,
  COMPRESSED: 65,
} as const;
