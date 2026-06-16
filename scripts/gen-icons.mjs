// Generates PWA/favicon PNGs from public/icon.svg. Run: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');
const rounded = readFileSync(resolve(pub, 'icon.svg'));
// Full-bleed (square) variant for maskable / apple-touch where the platform masks.
const square = Buffer.from(readFileSync(resolve(pub, 'icon.svg'), 'utf8').replace('rx="112"', 'rx="0"'));

const png = (svg, size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

const jobs = [
  ['pwa-192x192.png', rounded, 192],
  ['pwa-512x512.png', rounded, 512],
  ['maskable-512x512.png', square, 512],
  ['apple-touch-icon.png', square, 180],
  ['favicon-32x32.png', rounded, 32],
  ['favicon-16x16.png', rounded, 16],
];

for (const [name, svg, size] of jobs) {
  writeFileSync(resolve(pub, name), await png(svg, size));
  console.log('wrote', name, size);
}
// Keep an SVG favicon too.
writeFileSync(resolve(pub, 'favicon.svg'), rounded);
console.log('done');
