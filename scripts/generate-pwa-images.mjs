#!/usr/bin/env node
/**
 * Generates Apple splash screens and manifest screenshots.
 * Run: node scripts/generate-pwa-images.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ICON = join(ROOT, "public/icons/icon-512.png");
const BG = "#030712";

// ── Apple splash screen sizes ─────────────────────────────────────────
// Device name is just for reference; the media query in <link> does the matching.
const SPLASH_SIZES = [
  // iPhones
  { w: 1320, h: 2868, name: "splash-1320x2868" }, // 16 Pro Max
  { w: 1290, h: 2796, name: "splash-1290x2796" }, // 14 Pro Max / 15 Plus / 16 Plus
  { w: 1206, h: 2622, name: "splash-1206x2622" }, // 16 Pro
  { w: 1179, h: 2556, name: "splash-1179x2556" }, // 14 Pro / 15 / 15 Pro / 16
  { w: 1284, h: 2778, name: "splash-1284x2778" }, // 13 Pro Max / 14 Plus
  { w: 1170, h: 2532, name: "splash-1170x2532" }, // 13 / 13 Pro / 14
  { w: 1125, h: 2436, name: "splash-1125x2436" }, // X / XS / 12 mini / 13 mini
  { w: 1242, h: 2688, name: "splash-1242x2688" }, // XS Max / 11 Pro Max
  { w: 828, h: 1792, name: "splash-828x1792" },   // XR / 11
  { w: 1242, h: 2208, name: "splash-1242x2208" }, // 8 Plus
  { w: 750, h: 1334, name: "splash-750x1334" },   // SE / 8
  // iPads
  { w: 2048, h: 2732, name: "splash-2048x2732" }, // iPad Pro 12.9
  { w: 1668, h: 2388, name: "splash-1668x2388" }, // iPad Pro 11
  { w: 1640, h: 2360, name: "splash-1640x2360" }, // iPad Air 10.9
  { w: 1620, h: 2160, name: "splash-1620x2160" }, // iPad 10.2
];

// ── Manifest screenshots ──────────────────────────────────────────────
const SCREENSHOT_SIZES = [
  { w: 1290, h: 2796, name: "screenshot-mobile", form_factor: "narrow" },
  { w: 2560, h: 1440, name: "screenshot-desktop", form_factor: "wide" },
];

async function generateSplash({ w, h, name }) {
  const iconSize = Math.round(Math.min(w, h) * 0.2);
  const icon = await sharp(ICON).resize(iconSize, iconSize).toBuffer();

  const out = join(ROOT, "public/splash", `${name}.png`);
  await sharp({
    create: { width: w, height: h, channels: 4, background: BG },
  })
    .composite([
      {
        input: icon,
        left: Math.round((w - iconSize) / 2),
        top: Math.round((h - iconSize) / 2),
      },
    ])
    .png()
    .toFile(out);
  console.log(`  ✓ ${name}.png (${w}×${h})`);
}

async function generateScreenshot({ w, h, name }) {
  // Simple branded screenshot: dark bg, centered icon, app name below
  const iconSize = Math.round(Math.min(w, h) * 0.15);
  const icon = await sharp(ICON).resize(iconSize, iconSize).toBuffer();

  const textSvg = `<svg width="${w}" height="80">
    <text x="${w / 2}" y="60" text-anchor="middle"
      font-family="system-ui, sans-serif" font-size="48" font-weight="600"
      fill="white">Mind — Save articles. Read later.</text>
  </svg>`;

  const out = join(ROOT, "public/screenshots", `${name}.png`);
  await sharp({
    create: { width: w, height: h, channels: 4, background: BG },
  })
    .composite([
      {
        input: icon,
        left: Math.round((w - iconSize) / 2),
        top: Math.round(h / 2 - iconSize / 2 - 40),
      },
      {
        input: Buffer.from(textSvg),
        left: 0,
        top: Math.round(h / 2 + iconSize / 2),
      },
    ])
    .png()
    .toFile(out);
  console.log(`  ✓ ${name}.png (${w}×${h})`);
}

async function main() {
  mkdirSync(join(ROOT, "public/splash"), { recursive: true });
  mkdirSync(join(ROOT, "public/screenshots"), { recursive: true });

  console.log("Generating splash screens...");
  await Promise.all(SPLASH_SIZES.map(generateSplash));

  console.log("\nGenerating screenshots...");
  await Promise.all(SCREENSHOT_SIZES.map(generateScreenshot));

  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
