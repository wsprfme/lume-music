import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../public/icon.svg');
const out = resolve(__dirname, '../public');

const svg = await readFile(svgPath);

// ---------- Standard square icons (full bleed) ----------
const SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];
for (const size of SIZES) {
  const buf = await sharp(svg).resize(size, size).png().toBuffer();
  await writeFile(resolve(out, `icon-${size}.png`), buf);
  console.log(`wrote icon-${size}.png`);
}

// Apple touch icons (precomposed, never transparent)
const APPLE_SIZES = [120, 152, 167, 180];
for (const size of APPLE_SIZES) {
  const buf = await sharp(svg).resize(size, size).flatten({ background: '#06070b' }).png().toBuffer();
  await writeFile(resolve(out, `icon-apple-${size}.png`), buf);
  console.log(`wrote icon-apple-${size}.png`);
}

// Maskable: pad inner content so Android can crop to a circle/squircle without clipping
async function maskable(size) {
  const innerRatio = 0.78;
  const inner = Math.round(size * innerRatio);
  const pad = Math.round((size - inner) / 2);
  const innerBuf = await sharp(svg).resize(inner, inner).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 6, g: 7, b: 11, alpha: 1 } },
  })
    .composite([{ input: innerBuf, top: pad, left: pad }])
    .png()
    .toBuffer();
}
for (const size of [192, 512]) {
  await writeFile(resolve(out, `icon-mask-${size}.png`), await maskable(size));
  console.log(`wrote icon-mask-${size}.png`);
}

// ---------- Apple splash screens ----------
async function splash(width, height) {
  // Logo approx 26% of the shorter side
  const logoSize = Math.round(Math.min(width, height) * 0.26);
  const logo = await sharp(svg).resize(logoSize, logoSize).png().toBuffer();

  // Subtle radial gradient + grain background
  const bgSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <radialGradient id="g" cx="50%" cy="38%" r="80%">
          <stop offset="0%" stop-color="#1a1d28"/>
          <stop offset="55%" stop-color="#0a0c12"/>
          <stop offset="100%" stop-color="#06070b"/>
        </radialGradient>
        <radialGradient id="t" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stop-color="#a78bfa" stop-opacity=".22"/>
          <stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect width="100%" height="100%" fill="url(#t)"/>
    </svg>`;

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      {
        input: logo,
        top: Math.round(height * 0.38 - logoSize / 2),
        left: Math.round(width / 2 - logoSize / 2),
      },
    ])
    .png()
    .toBuffer();

  return composed;
}

// Common modern iPhone sizes
const SPLASHES = [
  { w: 1170, h: 2532 }, // 13 / 14 / 15
  { w: 1284, h: 2778 }, // Pro Max
  { w: 1125, h: 2436 }, // X / XS / 11 Pro / 13 mini
  { w: 1290, h: 2796 }, // 14 Pro / 15 Pro
  { w: 1179, h: 2556 }, // 15
  { w: 828, h: 1792 },  // XR / 11
  { w: 750, h: 1334 },  // SE 2/3
];
for (const s of SPLASHES) {
  await writeFile(resolve(out, `splash-${s.w}x${s.h}.png`), await splash(s.w, s.h));
  console.log(`wrote splash-${s.w}x${s.h}.png`);
}

// Manifest screenshot — synthesised from the same dark gradient + logo
const screenshot = await splash(1080, 1920);
await writeFile(resolve(out, 'screenshot-narrow.png'), screenshot);
console.log('wrote screenshot-narrow.png');

// Backwards-compat aliases (some references still use these)
await writeFile(resolve(out, 'icon-apple.png'), await sharp(svg).resize(180, 180).flatten({ background: '#06070b' }).png().toBuffer());
console.log('wrote icon-apple.png');
