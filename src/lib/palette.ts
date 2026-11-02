'use client';
import Color from 'color';

/**
 * Extract a 3-color palette from artwork by sampling a small canvas.
 * Returns RGB triplets (string "r g b") suitable for `rgb(var(--tint-1))`.
 * Falls back to brand palette on any failure (CORS, decode error, missing image).
 */
const FALLBACK = {
  t1: '167 139 250',
  t2: '240 171 252',
  t3: '103 232 249',
} as const;

const SIZE = 36; // tiny → very fast

export async function extractPalette(src: string | undefined): Promise<{ t1: string; t2: string; t3: string }> {
  if (!src || typeof window === 'undefined') return FALLBACK;
  try {
    const img = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return FALLBACK;
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

    // Bucket by hue, find top buckets weighted by saturation × area.
    const buckets = new Array(12).fill(0).map(() => ({ count: 0, r: 0, g: 0, b: 0 }));
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2],
        a = data[i + 3];
      if (a < 128) continue;
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      const lightness = (max + min) / 2;
      // Skip near-black / near-white pixels — they wash out the tint.
      if (lightness < 28 || lightness > 232) continue;
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat < 0.18) continue;
      const c = Color.rgb(r, g, b);
      const h = c.hue();
      const idx = Math.floor((h % 360) / 30);
      const w = sat * 1.2;
      buckets[idx].count += w;
      buckets[idx].r += r * w;
      buckets[idx].g += g * w;
      buckets[idx].b += b * w;
    }
    const ranked = buckets
      .map((b, i) => ({ ...b, i }))
      .filter((b) => b.count > 0)
      .sort((a, b) => b.count - a.count);
    if (ranked.length === 0) return FALLBACK;

    const top = ranked.slice(0, 3).map((b) => {
      const r = Math.round(b.r / b.count);
      const g = Math.round(b.g / b.count);
      const blu = Math.round(b.b / b.count);
      // Boost saturation, cap lightness for ambient look.
      const c = Color.rgb(r, g, blu).saturate(0.35).lightness(60);
      return `${Math.round(c.red())} ${Math.round(c.green())} ${Math.round(c.blue())}`;
    });
    return {
      t1: top[0] ?? FALLBACK.t1,
      t2: top[1] ?? top[0] ?? FALLBACK.t2,
      t3: top[2] ?? top[1] ?? top[0] ?? FALLBACK.t3,
    };
  } catch {
    return FALLBACK;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function applyPalette(p: { t1: string; t2: string; t3: string }) {
  if (typeof document === 'undefined') return;
  const r = document.documentElement;
  r.style.setProperty('--tint-1', p.t1);
  r.style.setProperty('--tint-2', p.t2);
  r.style.setProperty('--tint-3', p.t3);
}
