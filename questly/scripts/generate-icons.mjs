/**
 * Generates the PWA icons from the Questly mark.
 *
 * Written by hand with zlib rather than pulling in an image library: the mark
 * is three shapes, and a build-time dependency for that is not worth it.
 * Run with `npm run icons`.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const MOSS = [0x17, 0x5a, 0x4a]
const MINT = [0xa9, 0xd3, 0xc2]
const EMBER = [0xf0, 0xa7, 0x65]
const PAPER = [0xfb, 0xf7, 0xf1]

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0 // no filter
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // truecolour with alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Signed area of the triangle test, used for the compass needle. */
function inTriangle(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const sign = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3)
  const d1 = sign(px, py, ax, ay, bx, by)
  const d2 = sign(px, py, bx, by, cx, cy)
  const d3 = sign(px, py, cx, cy, ax, ay)
  const hasNegative = d1 < 0 || d2 < 0 || d3 < 0
  const hasPositive = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNegative && hasPositive)
}

function render(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4)
  const centre = size / 2
  const radiusOuter = size * (maskable ? 0.3 : 0.34)
  const ring = size * 0.022
  const corner = size * 0.22

  const put = (x, y, [r, g, b], a = 255) => {
    const index = (y * size + x) * 4
    rgba[index] = r
    rgba[index + 1] = g
    rgba[index + 2] = b
    rgba[index + 3] = a
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Rounded-square background (full bleed when maskable).
      const dx = Math.max(corner - x, 0, x - (size - corner))
      const dy = Math.max(corner - y, 0, y - (size - corner))
      const insideSquare = maskable || Math.hypot(dx, dy) <= corner
      if (!insideSquare) {
        put(x, y, [0, 0, 0], 0)
        continue
      }
      put(x, y, MOSS)

      const distance = Math.hypot(x - centre, y - centre)
      if (Math.abs(distance - radiusOuter) <= ring) put(x, y, MINT)

      if (
        inTriangle(
          x,
          y,
          [centre + radiusOuter * 0.55, centre - radiusOuter * 0.6],
          [centre + radiusOuter * 0.1, centre + radiusOuter * 0.12],
          [centre - radiusOuter * 0.6, centre + radiusOuter * 0.55],
        )
      ) {
        put(x, y, EMBER)
      }

      if (distance <= size * 0.03) put(x, y, PAPER)
    }
  }

  return encodePng(size, size, rgba)
}

mkdirSync(new URL('../public/icons/', import.meta.url), { recursive: true })
const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: true },
]

for (const target of targets) {
  const png = render(target.size, { maskable: target.maskable })
  writeFileSync(new URL(`../public/icons/${target.name}`, import.meta.url), png)
  console.log(`  ${target.name} (${png.length} bytes)`)
}
