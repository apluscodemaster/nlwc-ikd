// Background for a manual that has no featured image. Shared by the card
// placeholder (ManualThumbnail) and the manual's social-share image, so a
// shared link previews with the same photo the manuals page shows.

// Background images — warm, editorial-quality photographs
export const MANUAL_BACKGROUNDS = [
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247571/nlwc-ikd-assets/xebxdhjcdfayfvunrps6.png",
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247584/nlwc-ikd-assets/tz3n3x9h037eaic8gr5d.png",
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247589/nlwc-ikd-assets/yp4zkve02wdprhaqkwzl.png",
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247598/nlwc-ikd-assets/pmefke827pbgssp3zvy8.png",
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247602/nlwc-ikd-assets/iwa9dccmroxtosppxcdm.png",
];

// Deterministic hash from title to pick a background image
function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** The placeholder background a manual with this title gets. */
export function manualBackgroundFor(title: string): string {
  return MANUAL_BACKGROUNDS[hashTitle(title) % MANUAL_BACKGROUNDS.length];
}
