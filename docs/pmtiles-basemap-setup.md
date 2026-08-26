# Self-hosted Protomaps basemap (PMTiles)

Groundswell's maps (`SurfMap`, `RegionMap`, `WorldRegionsMap`) render vector
tiles from a **single `.pmtiles` file** the browser reads directly over HTTP
range requests. No tile server, no API key, no per-request cost, no third-party
runtime dependency.

- CARTO's keyless basemap started watermarking → moved to OpenFreeMap.
- OpenFreeMap's hosted tiles started returning **empty tiles** site-wide
  (2026-08-26) → moved to a self-hosted archive.

The app code is already wired up. What's left is a one-time infra task: get the
planet archive and host it. ~15 min of work + a long download.

---

## What the code expects

| Env var | Purpose | Default when unset |
|---|---|---|
| `NEXT_PUBLIC_PMTILES_URL` | Public URL of the hosted `.pmtiles` archive | Protomaps **demo bucket** — rate-limited, dev only |
| `NEXT_PUBLIC_MAP_ASSETS_URL` | Base URL for glyphs + sprites | `https://protomaps.github.io/basemaps-assets` (fine to keep) |

Until `NEXT_PUBLIC_PMTILES_URL` is set, the site points at
`https://demo-bucket.protomaps.com/v4.pmtiles`. Protomaps rate-limits that
archive and it's not for production; it has also been unreliable (it was
unreachable during this integration). Treat "no basemap on dev" as expected
until you set the var to your own archive — the wiring is verified by the unit
tests; the tiles just need a real host.

### Service worker

`public/sw.js` now bails on any cross-origin request (`url.origin !==
self.location.origin`). Before that fix it wrapped **every** GET in a
network-first handler whose offline fallback returns the app shell (`/`) — so a
cross-origin tile fetch that failed CORS came back as Groundswell's `index.html`,
which MapLibre can't parse, and the basemap silently stayed blank. If you fork
the SW, keep that guard.

The glyph/sprite bundle (`basemaps-assets`) is a few hundred KB of static files
on GitHub Pages' CDN — a totally different failure profile from a dynamic tile
endpoint. Leaving `NEXT_PUBLIC_MAP_ASSETS_URL` unset is reasonable. To go fully
first-party, copy that repo's `fonts/` and `sprites/` into your bucket and point
the var at it.

---

## Step 1 — Get the planet archive

Protomaps publishes a daily full-planet build (Protomaps **v4** schema, which is
what `@protomaps/basemaps` v5 targets). It's ~110 GB.

```sh
# Install the CLI (Go) — https://docs.protomaps.com/pmtiles/cli
brew install protomaps/tap/pmtiles   # or: go install github.com/protomaps/go-pmtiles@latest

# Download the latest daily build. Find the current date at https://maps.protomaps.com/builds/
curl -O https://build.protomaps.com/20260826.pmtiles     # ~110 GB, resumable with -C -
mv 20260826.pmtiles planet.pmtiles
```

Groundswell is a global surf app (spots on every coast), so you need the whole
planet — a regional extract won't do. If storage/transfer of 110 GB is a
problem, `pmtiles extract` can cut a coastline-biased subset later, but start
with the full file.

Quick sanity check before uploading:

```sh
pmtiles show planet.pmtiles          # prints schema, zoom range, bounds
pmtiles verify planet.pmtiles
```

---

## Step 2 — Host it on Cloudflare R2

R2 is the right home: **$0 egress**, ~$0.015/GB-month (≈ $1.65/mo for 110 GB),
S3-compatible, native HTTP range-request support.

1. **Create a bucket** — Cloudflare dashboard → R2 → *Create bucket* →
   `groundswell-basemap`.

2. **Upload** (the file is > 5 GB, so use multipart via `rclone` or `aws` CLI —
   the dashboard uploader caps out):

   ```sh
   rclone copy planet.pmtiles r2:groundswell-basemap/ --progress \
     --s3-upload-cutoff 200M --s3-chunk-size 200M
   ```

3. **Expose it read-only.** Two options:

   - **Public bucket + custom domain** (simplest): bucket → *Settings* →
     *Public access* → connect a domain like `basemap.groundswell.surf`.
     Then `NEXT_PUBLIC_PMTILES_URL=https://basemap.groundswell.surf/planet.pmtiles`.

   - **Cloudflare Worker in front** (if you want to lock access to your origin,
     add caching headers, or hide the bucket): deploy the worker from
     <https://github.com/protomaps/PMTiles/tree/main/serverless/cloudflare>.
     It serves `/{name}/{z}/{x}/{y}.mvt` *and* range requests on the raw file.

4. **CORS** — bucket → *Settings* → *CORS policy*:

   ```json
   [
     {
       "AllowedOrigins": [
         "https://groundswell.surf",
         "https://*.groundswell.surf",
         "http://localhost:3000"
       ],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["range", "if-match"],
       "ExposeHeaders": ["etag", "content-range", "content-length", "accept-ranges"],
       "MaxAgeSeconds": 86400
     }
   ]
   ```

   The `range` / `content-range` / `accept-ranges` entries are the important
   part — PMTiles is useless without working range requests.

---

## Step 3 — Set the env var

Local (`.env.local`) and Vercel (Project → Settings → Environment Variables,
all environments):

```
NEXT_PUBLIC_PMTILES_URL=https://basemap.groundswell.surf/planet.pmtiles
```

It's a public URL — no secret. `NEXT_PUBLIC_` so it reaches the client bundle.
Redeploy after setting it on Vercel (`NEXT_PUBLIC_*` is inlined at build time).

Verify:

```js
// browser console on any page with a map
performance.getEntriesByType('resource')
  .filter(e => e.name.includes('.pmtiles'))
// → one request to your domain, status 206 (Partial Content), repeated with different Range headers
```

The basemap should paint coastlines + labels on first load, and
`docs/` note the OpenFreeMap outage entry can be closed.

---

## Step 4 (optional) — keep the archive fresh

OSM data drifts; a yearly refresh is plenty for a surf app (coastlines and place
names barely move). To update: download a newer daily build, `rclone copy` it
over the same key. Clients pick it up on next load (consider a short
`Cache-Control` max-age or a versioned filename + env-var bump if you want
control over the cutover).

---

## Rollback

Unset `NEXT_PUBLIC_PMTILES_URL` → the app falls back to the Protomaps demo
bucket. Not for sustained production load, but it's a working basemap in one
env-var change if the R2 setup ever misbehaves.
