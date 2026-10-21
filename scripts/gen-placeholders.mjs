/**
 * Generate brand-coloured placeholder images for mock mode — with ZERO npm
 * dependencies (pure Node: zlib + fs). These are real raster PNGs with correct
 * intrinsic dimensions, so the mock experience has true LCP imagery and zero
 * external network requests. Filenames here must match app/mocks/*.
 *
 * Product, video and tutorial images in public/uploads are now provisional
 * JPEG art rendered from the 3D models and the fabric painters, so only the
 * remaining PNG placeholders are listed here. Existing files are kept; pass
 * --force to overwrite.
 *
 * Run: `npm run gen:placeholders`
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'uploads')

// ── CRC32 (PNG chunk checksums) ───────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]
const lerp = (a, b, t) => Math.round(a + (b - a) * t)

/**
 * Encode an RGB PNG with a vertical 2-stop gradient. Vertical-only variation +
 * the PNG "Up" filter makes these compress to a couple of KB each.
 */
function gradientPng(width, height, topHex, bottomHex) {
  const top = hex(topHex)
  const bottom = hex(bottomHex)
  const stride = width * 3
  const raw = Buffer.alloc((stride + 1) * height)

  for (let y = 0; y < height; y++) {
    const t = height === 1 ? 0 : y / (height - 1)
    const r = lerp(top[0], bottom[0], t)
    const g = lerp(top[1], bottom[1], t)
    const b = lerp(top[2], bottom[2], t)
    const rowStart = y * (stride + 1)
    // Filter byte: None on first row, Up on the rest (great for vertical grads).
    raw[rowStart] = y === 0 ? 0 : 2
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3
      if (y === 0) {
        raw[px] = r
        raw[px + 1] = g
        raw[px + 2] = b
      } else {
        // Up filter => delta vs the pixel above (constant per column here).
        const prevT = (y - 1) / (height - 1)
        raw[px] = (r - lerp(top[0], bottom[0], prevT)) & 0xff
        raw[px + 1] = (g - lerp(top[1], bottom[1], prevT)) & 0xff
        raw[px + 2] = (b - lerp(top[2], bottom[2], prevT)) & 0xff
      }
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Brand palette — Stella denim + brass (key names kept from the first theme)
const C = {
  ink: '#262523',
  charcoal: '#33312d',
  violet: '#2b3a67',
  violetDeep: '#1a2238',
  pink: '#967d59',
  pinkDeep: '#5b4a33',
  indigo: '#86a6cc',
  bone: '#f4f3ee',
}

// name, width, height, topColor, bottomColor — names mirror app/mocks/*
const IMAGES = [
  // Home
  ['hero-linea2_3f9c21.png', 1600, 1000, C.violet, C.ink],
]

mkdirSync(OUT_DIR, { recursive: true })
let total = 0
const force = process.argv.includes('--force')
for (const [name, w, h, top, bottom] of IMAGES) {
  if (!force && existsSync(join(OUT_DIR, name))) continue
  const png = gradientPng(w, h, top, bottom)
  writeFileSync(join(OUT_DIR, name), png)
  total += png.length
  console.log(`  ${name}  ${w}x${h}  ${(png.length / 1024).toFixed(1)}kB`)
}
console.log(`\n✔ ${IMAGES.length} placeholders -> public/uploads (${(total / 1024).toFixed(1)}kB total)`)
