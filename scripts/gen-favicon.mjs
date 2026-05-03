// Generates app/favicon.ico from the WaveLogo SVG design.
// Run once with: node scripts/gen-favicon.mjs
// No external dependencies — uses only built-in zlib.

import zlib from 'zlib'
import fs from 'fs'

const SIZE = 32
const pixels = new Uint8Array(SIZE * SIZE * 4)

function setPixel(x, y, r, g, b, a) {
  x = Math.round(x); y = Math.round(y)
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const i = (y * SIZE + x) * 4
  const oa = pixels[i + 3] / 255
  const na = a / 255
  const ra = na + oa * (1 - na)
  if (ra <= 0) return
  pixels[i]     = Math.round((r * na + pixels[i]     * oa * (1 - na)) / ra)
  pixels[i + 1] = Math.round((g * na + pixels[i + 1] * oa * (1 - na)) / ra)
  pixels[i + 2] = Math.round((b * na + pixels[i + 2] * oa * (1 - na)) / ra)
  pixels[i + 3] = Math.round(ra * 255)
}

function drawDisc(cx, cy, cr, r, g, b, a) {
  const x0 = Math.floor(cx - cr - 1), x1 = Math.ceil(cx + cr + 1)
  const y0 = Math.floor(cy - cr - 1), y1 = Math.ceil(cy + cr + 1)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy
      const alpha = Math.max(0, Math.min(1, cr - Math.sqrt(dx * dx + dy * dy) + 0.5))
      if (alpha > 0) setPixel(x, y, r, g, b, Math.round(a * alpha))
    }
  }
}

function bez(t, p0, p1, p2, p3) {
  const m = 1 - t
  return m*m*m*p0 + 3*m*m*t*p1 + 3*m*t*t*p2 + t*t*t*p3
}

function drawBezier(x0, y0, cx1, cy1, cx2, cy2, x3, y3, r, g, b, a, thick) {
  for (let i = 0; i <= 400; i++) {
    const t = i / 400
    drawDisc(bez(t, x0, cx1, cx2, x3), bez(t, y0, cy1, cy2, y3), thick / 2, r, g, b, a)
  }
}

// Scale from the 28×28 WaveLogo viewBox to 32×32
const sc = 32 / 28

// Background circle (dark navy)
drawDisc(16, 16, 16, 14, 26, 46, 255)
// Sky-blue tint overlay (rgba(14,165,233,0.15))
drawDisc(16, 16, 15.5, 14, 165, 233, 38)

// Wave 1 — two cubic segments  (#38bdf8 = rgb(56,189,248))
drawBezier(sc*4,  sc*17, sc*7,  sc*13, sc*10, sc*20, sc*14, sc*16, 56, 189, 248, 255, 2.6)
drawBezier(sc*14, sc*16, sc*18, sc*12, sc*21, sc*19, sc*24, sc*15, 56, 189, 248, 255, 2.6)

// Wave 2 — two cubic segments (#0ea5e9 = rgb(14,165,233) @ ~55%)
drawBezier(sc*4,  sc*20, sc*7,  sc*16, sc*10, sc*23, sc*14, sc*19, 14, 165, 233, 140, 1.9)
drawBezier(sc*14, sc*19, sc*18, sc*15, sc*21, sc*22, sc*24, sc*18, 14, 165, 233, 140, 1.9)

// ── PNG encode ────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const lenBuf = Buffer.allocUnsafe(4); lenBuf.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crcVal = Buffer.allocUnsafe(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([lenBuf, typeBuf, data, crcVal])
}

// Raw scanlines: 1 filter byte (None=0) + 4 bytes per pixel
const raw = Buffer.alloc(SIZE * (1 + SIZE * 4))
for (let y = 0; y < SIZE; y++) {
  raw[y * (1 + SIZE * 4)] = 0
  for (let x = 0; x < SIZE; x++) {
    const si = (y * SIZE + x) * 4
    const di = y * (1 + SIZE * 4) + 1 + x * 4
    raw[di] = pixels[si]; raw[di+1] = pixels[si+1]
    raw[di+2] = pixels[si+2]; raw[di+3] = pixels[si+3]
  }
}

const ihdr = Buffer.allocUnsafe(13)
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

// ── ICO wrapper ───────────────────────────────────────────────────────────────

const dir = Buffer.allocUnsafe(6)
dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(1, 4)

const entry = Buffer.allocUnsafe(16)
entry[0] = 0  // 0 means 256 in ICO spec, but for 32 use 32
entry[0] = SIZE === 256 ? 0 : SIZE
entry[1] = SIZE === 256 ? 0 : SIZE
entry[2] = 0; entry[3] = 0
entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6)
entry.writeUInt32LE(png.length, 8)
entry.writeUInt32LE(6 + 16, 12)  // data starts right after ICONDIR + 1 entry

const ico = Buffer.concat([dir, entry, png])
fs.writeFileSync('app/favicon.ico', ico)
console.log(`Created app/favicon.ico (${ico.length} bytes, 32×32 RGBA PNG-in-ICO)`)
