#!/usr/bin/env node
/**
 * Generates brand assets derived from the church logo
 * (assets/images/splash-icon.png: dark artwork on a transparent background).
 *
 * The logo's black lettering and emblem disappear on dark backgrounds, and
 * recolouring it would break the emblem (the white mountains sit inside a
 * black disc). So instead of altering the mark, these assets present it on
 * white where needed:
 *
 *   icon-ios.png             1024² opaque app icon (iOS renders transparency as black)
 *   emblem.png               emblem only (no wordmark), for the in-app header
 *   splash-emblem.png        light splash: emblem on transparent, circle-safe
 *   splash-emblem-dark.png   dark splash: emblem on a white disc, circle-safe
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

const logo = await Jimp.read(join(IMAGES, "splash-icon.png"));

// 1) iOS app icon: the emblem icon used on Android (adaptive-icon.png, opaque
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

// 2) Emblem only (no wordmark), for the in-app header. In the logo, the
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

  // 3) Splash images. Android 12+ shows the splash icon inside a circular
  //    mask, which trimmed the wide wordmark, so the splash uses the round
  //    emblem on a square canvas, kept well inside the circle.
  const SIZE = 512;
  const fit = (img, maxW, maxH) => {
    const s = Math.min(maxW / img.bitmap.width, maxH / img.bitmap.height);
    return img.clone().resize(Math.round(img.bitmap.width * s), Math.round(img.bitmap.height * s), Jimp.RESIZE_BICUBIC);
  };
  const centre = (canvas, img) =>
    canvas.composite(img, Math.round((SIZE - img.bitmap.width) / 2), Math.round((SIZE - img.bitmap.height) / 2));

  // Light: emblem on transparent (sits on the white splash background).
  const light = new Jimp(SIZE, SIZE, 0x00000000);
  centre(light, fit(emblem, SIZE * 0.62, SIZE * 0.62));
  await light.writeAsync(join(IMAGES, "splash-emblem.png"));

  // Dark: a white disc filling the circle, emblem inside, so the dark artwork
  // reads on the dark background (same treatment as the Home header badge).
  const dark = new Jimp(SIZE, SIZE, 0x00000000);
  const r = SIZE / 2;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const a = Math.max(0, Math.min(1, r - Math.hypot(x + 0.5 - r, y + 0.5 - r)));
      if (a > 0) dark.setPixelColor(Jimp.rgbaToInt(255, 255, 255, Math.round(a * 255)), x, y);
    }
  }
  centre(dark, fit(emblem, SIZE * 0.56, SIZE * 0.56));
  await dark.writeAsync(join(IMAGES, "splash-emblem-dark.png"));
  console.log(`splash-emblem*.png    ${SIZE}x${SIZE} (light + dark)`);
}
