// apps/web/scripts/generate-icons.mjs
// Generates icon-192.png and icon-512.png using SVG-to-PNG conversion via sharp
// Run: node scripts/generate-icons.mjs

import sharp from 'sharp'
import { mkdirSync } from 'fs'

const sizes = [192, 512]
const dir = 'public/icons'
mkdirSync(dir, { recursive: true })

for (const size of sizes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a0a2e"/>
        <stop offset="100%" stop-color="#7c3aed"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
    <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle"
      font-size="${size * 0.55}" fill="white" font-family="Arial, sans-serif">&#x634;</text>
  </svg>`

  await sharp(Buffer.from(svg)).png().toFile(`${dir}/icon-${size}.png`)
  console.log(`Generated ${dir}/icon-${size}.png`)
}
