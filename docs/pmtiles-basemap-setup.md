# Self-hosted Protomaps basemap (PMTiles)

Groundswell's maps (`SurfMap`, `RegionMap`, `WorldRegionsMap`) render vector
tiles from a **single `.pmtiles` file** the browser reads directly over HTTP
range requests. No tile server, no API key, no per-request cost, no third-party
runtime dependency.

- CARTO's keyless basemap started watermarking → moved to OpenFreeMap.
- OpenFreeMap's hosted tiles started returning **empty tiles** site-wide
  (2026-08-26) → moved to a self-hosted archive.

The app code is already wired up. What's left is a hosting decision:

- **Cheapest possible: do nothing.** The built-in fallback already reads a free,
  working planet archive (see *What the code expects*). Fine to ship on.
- **$0 and you own the file:** a zoom-capped extract on GitHub Releases or the
  Cloudflare R2 free tier — see *Free hosting*.
- **Full control, ~$2/mo:** the whole planet on paid R2 — see *Steps 1–4*.

---

## What the code expects

| Env var | Purpose | Default when unset |
|---|---|---|
| `NEXT_PUBLIC_PMTILES_URL` | Public URL of the hosted `.pmtiles` archive | Protomaps planet on **source.coop** — works, but shared/uncontrolled |
| `NEXT_PUBLIC_MAP_ASSETS_URL` | Base URL for glyphs + sprites | `https://protomaps.github.io/basemaps-assets` (fine to keep) |

Until `NEXT_PUBLIC_PMTILES_URL` is set, the site reads
`https://data.source.coop/protomaps/openstreetmap/v4.pmtiles` — the Protomaps
planet build hosted on source.coop (Radiant Earth's open-data host, CORS + range
requests, ~135 GB, `pmtiles://` reads only the header + visible tiles). That's a
genuine working basemap for dev and previews. It's still someone else's bucket
with no SLA to you, so host your own for production — you control CORS, caching,
and how often it refreshes.

(The old `demo-bucket.protomaps.com` URL is dead — Protomaps moved public
hosting to source.coop.)

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

## Free hosting

Two ways to run your own archive at $0. Both trade **max zoom** for size: the
full planet is ~135 GB because zooms 12–15 carry every building and footpath.
Groundswell's maps don't need that — the world atlas tops out around z6–8, and
the region detail maps fit-bound a handful of breaks at roughly z10–12. Capping
the archive at z8 keeps coastlines, boundaries, and town/city labels while
collapsing the size by ~50×.

What you lose at `--maxzoom=8`: street-level detail when a region map is zoomed
in tight (you still get the coastline, place names, and the break markers).
`--maxzoom=10` roughly quadruples the file but restores most of that; pick based
on what fits your host's free tier.

`pmtiles extract` reads the source over HTTP range requests, so this pulls only
the tiles it keeps — **no 135 GB download**:

```sh
# go install github.com/protomaps/go-pmtiles@latest   (or: brew install protomaps/tap/pmtiles)

pmtiles extract https://data.source.coop/protomaps/openstreetmap/v4.pmtiles \
  world-z8.pmtiles --maxzoom=8

pmtiles show world-z8.pmtiles     # confirm zoom range + size
```

Rough size guide (verify against your actual output): `--maxzoom=8` ≈ 1–3 GB,
`--maxzoom=10` ≈ 8–20 GB.

### Route A — GitHub Releases

GitHub serves release assets from `objects.githubusercontent.com`, which honors
HTTP range requests and sends `Access-Control-Allow-Origin: *` — everything
`pmtiles://` needs. No bill, no new vendor.

1. Keep the extract **under 2 GB** (GitHub's per-asset limit). That means
   `--maxzoom=8`, maybe `--maxzoom=9`; check `pmtiles show`. If it's over, drop a
   zoom level.
2. Create a release on this repo (e.g. tag `basemap-2026-08`) and attach
   `world-z8.pmtiles`.
3. ```
   NEXT_PUBLIC_PMTILES_URL=https://github.com/kevinmccalley/surf-report/releases/download/basemap-2026-08/world-z8.pmtiles
   ```
4. Refresh by attaching a new file to a new release and bumping the URL. (Don't
   reuse a tag — the CDN caches asset URLs hard.)

Before relying on it, confirm range + CORS actually work from the browser:

```js
fetch(URL, { headers: { Range: 'bytes=0-127' } })
  .then(r => r.status)   // want 206, and no CORS error in the console
```

### Route B — Cloudflare R2 free tier

R2's free tier is **10 GB storage** + generous ops, $0 egress. A `--maxzoom=8`
(or a lean `--maxzoom=9`) extract fits. Then follow *Step 2* below exactly —
public bucket + custom domain + the CORS policy — just with `world-z8.pmtiles`
instead of the full planet. Staying under 10 GB keeps it free indefinitely; if
it grows past that you're into the ~$0.015/GB-month pricing in Step 2.

### Keeping either fresh

Same as the paid path: coastlines and place names barely move, so re-extract
once a year and re-upload. Version the filename so cached URLs don't serve stale
data.

---

## Step 1 — Get the planet archive

*(Skip this and Steps 2–4 if you took a Free hosting route above.)*

Protomaps publishes a daily full-planet build (Protomaps **v4** schema, which is
what `@protomaps/basemaps` v5 targets). It's ~135 GB.

```sh
# Install the CLI (Go) — https://docs.protomaps.com/pmtiles/cli
brew install protomaps/tap/pmtiles   # or: go install github.com/protomaps/go-pmtiles@latest

# Download the latest daily build. Find the current date at https://maps.protomaps.com/builds/
curl -O https://build.protomaps.com/20260826.pmtiles     # ~135 GB, resumable with -C -
mv 20260826.pmtiles planet.pmtiles
```

Groundswell is a global surf app (spots on every coast), so a *bbox* extract
won't do — but a *zoom-capped* extract of the whole world is a valid, much
smaller option (see *Free hosting*). This path takes the full-detail planet; use
it if you want street-level zoom everywhere and don't mind the ~$2/mo.

Quick sanity check before uploading:

```sh
pmtiles show planet.pmtiles          # prints schema, zoom range, bounds
pmtiles verify planet.pmtiles
```

---

## Step 2 — Host it on Cloudflare R2

R2 is the right home: **$0 egress**, ~$0.015/GB-month (≈ $2/mo for the ~135 GB
planet; **$0 if a zoom-capped extract fits the 10 GB free tier**), S3-compatible,
native HTTP range-request support.

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

The basemap should paint coastlines + labels on first load.

---

## Step 4 (optional) — keep the archive fresh

OSM data drifts; a yearly refresh is plenty for a surf app (coastlines and place
names barely move). To update: download a newer daily build, `rclone copy` it
over the same key. Clients pick it up on next load (consider a short
`Cache-Control` max-age or a versioned filename + env-var bump if you want
control over the cutover).

---

## Rollback

Unset `NEXT_PUBLIC_PMTILES_URL` (and redeploy) → the app falls back to the
Protomaps planet on source.coop. It's a shared open-data host with no SLA to
you, but it's a real working basemap, so this is a one-env-var recovery if your
own host ever misbehaves.
