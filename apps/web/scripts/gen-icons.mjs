// One-off icon generator: rasterizes the brand mark to PNGs for PWA + iOS.
// Run from repo root:  node apps/web/scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

// Full-bleed master (no transparent corners) so platform masking looks right.
const masterFullBleed = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0b0b0c"/>
  <path d="M150 132h212a44 44 0 0 1 44 44v120a44 44 0 0 1-44 44H252l-78 60a12 12 0 0 1-19-10v-50h-5a44 44 0 0 1-44-44V176a44 44 0 0 1 44-44z" fill="#16a34a"/>
  <path d="M196 240l40 40 84-92" fill="none" stroke="#ffffff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Maskable needs the important content inside the central ~80% safe zone:
// scale the artwork to 78% and center it on a full green-tinged dark field.
const masterMaskable = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0b0b0c"/>
  <g transform="translate(256 256) scale(0.78) translate(-256 -256)">
    <path d="M150 132h212a44 44 0 0 1 44 44v120a44 44 0 0 1-44 44H252l-78 60a12 12 0 0 1-19-10v-50h-5a44 44 0 0 1-44-44V176a44 44 0 0 1 44-44z" fill="#16a34a"/>
    <path d="M196 240l40 40 84-92" fill="none" stroke="#ffffff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

async function png(svg, size, outPath) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(outPath, buf);
  console.log('wrote', path.relative(ROOT, outPath), `(${size}px)`);
}

await mkdir(path.join(ROOT, 'public'), { recursive: true });
// iOS home-screen icon (Next auto-serves app/apple-icon.png)
await png(masterFullBleed, 180, path.join(ROOT, 'app', 'apple-icon.png'));
// PWA manifest icons
await png(masterFullBleed, 192, path.join(ROOT, 'public', 'icon-192.png'));
await png(masterFullBleed, 512, path.join(ROOT, 'public', 'icon-512.png'));
await png(masterMaskable, 512, path.join(ROOT, 'public', 'icon-512-maskable.png'));
// Classic favicon fallback for older browsers
await png(masterFullBleed, 48, path.join(ROOT, 'public', 'favicon.png'));
console.log('done');
