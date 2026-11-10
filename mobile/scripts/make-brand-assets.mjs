#!/usr/bin/env node
/**
 * Generates brand assets derived from the church logo
 * (assets/images/splash-icon.png: dark artwork on a transparent background).
 *
 * The logo's black lettering and emblem disappear on dark backgrounds, and
 * recolouring it would break the emblem (the white mountains sit inside a
 * black disc). So instead of altering the mark, these assets present it on
 * white:
 *
 *   splash-icon-dark.png  logo on a white rounded badge, for the dark-mode splash
 *   icon-ios.png          1024² opaque app icon (iOS renders transparency as black)
 *
 * Run: npm run brand-assets   (uses jimp-compact, already installed with Expo)
 */
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Jimp = require("jimp-compact");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IMAGES = join(ROOT, "assets", "images");
const WHITE = 0xffffffff;

/** Paint a white rounded rectangle (anti-aliased corners) onto `img`. */
function fillRoundedRect(img, x0, y0, w, h, r) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      // Distance from the nearest corner centre, for pixels in a corner zone.
      const cx = x < x0 + r ? x0 + r : x >= x0 + w - r ? x0 + w - r - 1 : x;
      const cy = y < y0 + r ? y0 + r : y >= y0 + h - r ? y0 + h - r - 1 : y;
      const d = Math.hypot(x - cx, y - cy);
      const alpha = Math.max(0, Math.min(1, r - d + 0.5)); // 1 inside, smooth edge
      if (alpha <= 0) continue;
      img.setPixelColor(Jimp.rgbaToInt(255, 255, 255, Math.round(alpha * 255)), x, y);
    }
  }
}

const logo = await Jimp.read(join(IMAGES, "splash-icon.png"));
const lw = logo.bitmap.width;
const lh = logo.bitmap.height;

// 1) Dark-mode splash: the logo on a white rounded badge, transparent outside.
{
  const padX = Math.round(lw * 0.1);
  const padY = Math.round(lh * 0.22);
  const w = lw + padX * 2;
  const h = lh + padY * 2;
  const badge = new Jimp(w, h, 0x00000000);
  fillRoundedRect(badge, 0, 0, w, h, Math.round(h * 0.22));
  badge.composite(logo, padX, padY);
  await badge.writeAsync(join(IMAGES, "splash-icon-dark.png"));
  console.log(`splash-icon-dark.png  ${w}x${h}`);
}

// 2) iOS app icon: the emblem icon used on Android (adaptive-icon.png, opaque
//    white with the emblem and "IKORODU"), at the 1024² iOS expects. The full
//    wordmark is unreadable at home-screen size.
{
  const size = 1024;
  const src = await Jimp.read(join(IMAGES, "adaptive-icon.png"));
  const icon = new Jimp(size, size, WHITE);
  icon.composite(src.resize(size, size, Jimp.RESIZE_BICUBIC), 0, 0);
  await icon.writeAsync(join(IMAGES, "icon-ios.png"));
  console.log(`icon-ios.png          ${size}x${size}`);
}

// 3) Emblem only (no wordmark), for the in-app header. In the logo, the
//    emblem is the first block of opaque columns, before the divider bar.
{
  const { width: W, height: H, data } = logo.bitmap;
  const opaque = (x, y) => data[(y * W + x) * 4 + 3] > 40;
  const colHas = (x) => Array.from({ length: H }, (_, y) => opaque(x, y)).some(Boolean);
  let x0 = 0;
  while (x0 < W && !colHas(x0)) x0++;
  let x1 = x0;
  while (x1 < W && colHas(x1)) x1++; // first empty column = gap before the divider
  let y0 = 0;
  let y1 = H - 1;
  const rowHas = (y) => Array.from({ length: x1 - x0 }, (_, i) => opaque(x0 + i, y)).some(Boolean);
  while (y0 < H && !rowHas(y0)) y0++;
  while (y1 > y0 && !rowHas(y1)) y1--;
  const emblem = logo.clone().crop(x0, y0, x1 - x0, y1 - y0 + 1);
  await emblem.writeAsync(join(IMAGES, "emblem.png"));
  console.log(`emblem.png            ${emblem.bitmap.width}x${emblem.bitmap.height} (cropped x ${x0}-${x1 - 1})`);
}
