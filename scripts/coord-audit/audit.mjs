// Water audit for app/data/surf-breaks.json.
//
// For every break, test the coordinate against real OpenStreetMap land/water
// geometry (Protomaps v4 planet PMTiles, read over HTTP range requests — no
// download, no API key). Reports, per break:
//   - IN_WATER     the pin sits inside an OSM `water` polygon (ideal for reefs)
//   - SHORE_OK     on land but <= 40 m from the waterline (fine for beachbreaks)
//   - CLOSE        41-120 m inland — usually coastline generalisation, eyeball it
//   - INLAND       > 120 m inland — almost certainly misplaced
//   - NO_WATER     no water within the 3x3 tile block — badly wrong or far inland
//
// NOTE the OSM coastline is generalised, so distances are +/- ~75 m near complex
// coasts. Trust IN_WATER / INLAND / NO_WATER; treat CLOSE as "look closer".
//
// Usage:  cd scripts/coord-audit && npm install && node audit.mjs [--json out.json]

import { PMTiles } from 'pmtiles'
import { createRequire } from 'node:module'
import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { VectorTile } = require('@mapbox/vector-tile')
const Pbf = require('pbf')

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.resolve(HERE, '../../app/data/surf-breaks.json')
const PM_URL = 'https://data.source.coop/protomaps/openstreetmap/v4.pmtiles'
const Z = 15
const EXTENT = 4096
const N = 2 ** Z

const jsonFlag = process.argv.indexOf('--json')
const jsonOut = jsonFlag > -1 ? process.argv[jsonFlag + 1] : null

const breaks = JSON.parse(fs.readFileSync(DATA, 'utf8'))
console.log(`auditing ${breaks.length} breaks against OSM water (z${Z})\n`)

function llToPx(lon, lat) {
  const sx = ((lon + 180) / 360) * N
  const latR = (lat * Math.PI) / 180
  const sy = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * N
  return { gx: sx * EXTENT, gy: sy * EXTENT, tx: Math.floor(sx), ty: Math.floor(sy) }
}
const mppAt = lat => (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (N * EXTENT)

const pm = new PMTiles(PM_URL)
await pm.getHeader()
const cache = new Map()

// pmtiles' fetch source has no timeout — a single stalled range request would
// hang the whole run. Race every tile read against a deadline and retry once.
async function getTile(z, x, y) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await Promise.race([
        pm.getZxy(z, x, y),
        new Promise((_, rej) => setTimeout(() => rej(new Error('tile timeout')), 15000)),
      ])
    } catch (e) {
      if (attempt === 2) throw e
    }
  }
}

async function waterRings(tx, ty) {
  const key = `${tx}/${ty}`
  if (cache.has(key)) return cache.get(key)
  let rings = []
  try {
    const r = await getTile(Z, tx, ty)
    if (r) {
      let buf = Buffer.from(r.data)
      if (buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf)
      const layer = new VectorTile(new Pbf(buf)).layers.water
      if (layer) {
        for (let i = 0; i < layer.length; i++) {
          for (const ring of layer.feature(i).loadGeometry()) {
            rings.push(ring.map(p => [p.x + tx * EXTENT, p.y + ty * EXTENT]))
          }
        }
      }
    }
  } catch {
    /* missing tile -> treated as no water */
  }
  cache.set(key, rings)
  return rings
}

function inRings(px, py, rings) {
  let inside = false
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
    }
  }
  return inside
}
function minEdgeDist(px, py, rings) {
  let best = Infinity
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const ax = ring[j][0], ay = ring[j][1], bx = ring[i][0], by = ring[i][1]
      const dx = bx - ax, dy = by - ay
      const l2 = dx * dx + dy * dy
      let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0
      t = Math.max(0, Math.min(1, t))
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
      if (d < best) best = d
    }
  }
  return best
}

const report = []
for (const b of breaks) {
  const { gx, gy, tx, ty } = llToPx(b.lon, b.lat)
  let rings = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) rings = rings.concat(await waterRings(tx + dx, ty + dy))
  }
  const mpp = mppAt(b.lat)
  let status, dist
  if (!rings.length) {
    status = 'NO_WATER'
    dist = null
  } else if (inRings(gx, gy, rings)) {
    status = 'IN_WATER'
    dist = 0
  } else {
    dist = Math.round(minEdgeDist(gx, gy, rings) * mpp)
    status = dist <= 40 ? 'SHORE_OK' : dist <= 120 ? 'CLOSE' : 'INLAND'
  }
  report.push({ name: b.name, country: b.country, lat: b.lat, lon: b.lon, confidence: b.confidence, status, dist })
}

const rank = { NO_WATER: 0, INLAND: 1, CLOSE: 2, SHORE_OK: 3, IN_WATER: 4 }
const flagged = report
  .filter(r => r.status === 'NO_WATER' || r.status === 'INLAND')
  .sort((a, b) => rank[a.status] - rank[b.status] || (b.dist ?? -1) - (a.dist ?? -1))

console.log('=== FLAGGED (NO_WATER / INLAND) ===')
for (const r of flagged) {
  console.log(`${r.status.padEnd(9)} ${String(r.dist ?? '').padStart(5)}m  ${r.name}  (${r.country})  ${r.lat}, ${r.lon}`)
}
const count = s => report.filter(r => r.status === s).length
console.log(
  `\nIN_WATER ${count('IN_WATER')} | SHORE_OK ${count('SHORE_OK')} | CLOSE ${count('CLOSE')} | ` +
    `INLAND ${count('INLAND')} | NO_WATER ${count('NO_WATER')}  (of ${report.length})`,
)

if (jsonOut) {
  fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2))
  console.log(`\nfull report -> ${jsonOut}`)
}
