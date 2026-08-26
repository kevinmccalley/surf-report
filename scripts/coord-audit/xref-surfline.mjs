// Cross-reference app/data/surf-breaks.json against the ~6,900-entry Surfline-
// derived spot list already in the repo (app/lib/surf-spots.json). For each
// curated break, find the nearest Surfline entry with a matching name and
// report the gap — a second independent opinion on each coordinate.
//
// Big gap + confident name match  => investigate (one of them is wrong).
// Small gap                       => corroborated.
// No match                        => Surfline can't help; use a gazetteer.
//
// Usage:  node xref-surfline.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const curated = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../app/data/surf-breaks.json'), 'utf8'))
const surfline = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../app/lib/surf-spots.json'), 'utf8'))

const R = 6371000
const rad = d => (d * Math.PI) / 180
function haversine(aLat, aLon, bLat, bLon) {
  const dLat = rad(bLat - aLat), dLon = rad(bLon - aLon)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
const norm = s => s.toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const toks = s => new Set(norm(s).split(' ').filter(Boolean))
function nameScore(a, b) {
  const na = norm(a), nb = norm(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.85
  const ta = toks(a), tb = toks(b)
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  const union = new Set([...ta, ...tb]).size
  return union ? inter / union : 0
}

const rows = []
for (const c of curated) {
  let best = null
  for (const q of surfline) {
    if (Math.abs(q.lat - c.lat) > 0.35 || Math.abs(q.lon - c.lon) > 0.35) continue
    const ns = nameScore(c.name, q.name)
    if (ns < 0.6) continue
    const d = haversine(c.lat, c.lon, q.lat, q.lon)
    if (!best || ns > best.ns || (ns === best.ns && d < best.d)) best = { q, ns, d }
  }
  rows.push({ c, best })
}

rows.sort((a, b) => (b.best?.d ?? -1) - (a.best?.d ?? -1))
for (const r of rows) {
  if (!r.best) {
    console.log(`${r.c.name.padEnd(24)} —  no Surfline name match`)
    continue
  }
  console.log(
    `${r.c.name.padEnd(24)} ${String(Math.round(r.best.d)).padStart(6)}m  ` +
      `(${r.best.ns.toFixed(2)}) ${r.best.q.name}`,
  )
}
const within = n => rows.filter(r => r.best && r.best.d < n).length
console.log(
  `\ncorroborated <150m: ${within(150)} | <500m: ${within(500)} | ` +
    `name match but >1km: ${rows.filter(r => r.best && r.best.d >= 1000).length} | ` +
    `no match: ${rows.filter(r => !r.best).length}  (of ${rows.length})`,
)
