#!/usr/bin/env python3
"""
Fetches named surf spots from Surfline's public web endpoint and writes
app/lib/surf-spots.json for use by the /api/nearby route.

Run locally:  python3 scripts/generate-surf-spots.py
Run in CI:    same command — no arguments needed.
"""

import json
import os
import sys
import time
import urllib.request
from pathlib import Path

# Major surfing regions [south, north, west, east]
REGIONS = [
    # West Coast USA + Canada
    [32, 38, -122, -116], [38, 42, -125, -121], [42, 50, -126, -122],
    # Mexico + Central America Pacific
    [14, 22, -110, -96], [22, 32, -120, -110], [7, 14, -92, -82],
    # Hawaii
    [18, 23, -162, -154],
    # South America Pacific
    [-18, 5, -82, -75], [-35, -18, -80, -70],
    # US + Canada East Coast
    [24, 32, -82, -77], [32, 41, -78, -70], [41, 47, -72, -65],
    # Brazil + South Atlantic
    [-15, 2, -45, -32], [-32, -15, -55, -38], [-43, -32, -68, -48],
    # Caribbean
    [14, 24, -88, -60],
    # Portugal + Spain Atlantic
    [35, 44, -10, -6],
    # France + Bay of Biscay
    [43, 49, -5, 2],
    # UK + Ireland
    [49, 61, -12, 2],
    # Morocco + Canary Islands
    [25, 37, -16, -1],
    # West Africa (Senegal, Mauritania)
    [10, 25, -20, -10],
    # South Africa
    [-36, -27, 14, 35],
    # Mediterranean (Spain / France / Italy / Greece)
    [35, 45, -5, 20],
    # East Africa + Madagascar
    [-28, -5, 32, 52],
    # Maldives + Sri Lanka + India West Coast
    [-2, 24, 70, 84],
    # Indonesia (Bali / Java / Lombok)
    [-10, -5, 105, 125],
    # Mentawai + Sumatra
    [-4, 4, 95, 106],
    # SE Asia (Thailand / Vietnam / Philippines)
    [5, 22, 98, 130],
    # Japan
    [30, 45, 128, 145],
    # Australia West
    [-36, -20, 113, 130],
    # Australia South + Victoria
    [-40, -32, 128, 152],
    # Australia East (NSW + QLD)
    [-33, -10, 150, 158],
    # New Zealand
    [-48, -34, 165, 178],
    # Pacific Islands (Fiji, Samoa, Tonga)
    [-23, -12, -180, -165],
    # French Polynesia (Tahiti, Teahupoo)
    [-20, -14, -153, -147],
    # Iceland
    [62, 67, -28, -10],
    # Azores
    [36, 41, -33, -23],
]

BASE_URL = 'https://services.surfline.com/kbyg/mapview'
HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    )
}
OUT_PATH = Path(__file__).parent.parent / 'app' / 'lib' / 'surf-spots.json'


def fetch_region(south, north, west, east):
    url = f'{BASE_URL}?south={south}&north={north}&west={west}&east={east}'
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=12) as resp:
        data = json.loads(resp.read())
    return data.get('data', {}).get('spots', [])


def main():
    seen_ids = set()
    all_spots = []
    failures = 0

    for i, (s, n, w, e) in enumerate(REGIONS):
        try:
            spots = fetch_region(s, n, w, e)
            added = 0
            for sp in spots:
                sid = sp.get('_id')
                name = (sp.get('name') or '').strip()
                lat = sp.get('lat')
                lon = sp.get('lon')
                if sid and name and lat is not None and lon is not None and sid not in seen_ids:
                    seen_ids.add(sid)
                    all_spots.append({
                        'name': name,
                        'lat': round(lat, 5),
                        'lon': round(lon, 5),
                    })
                    added += 1
            print(f'[{i+1:2d}/{len(REGIONS)}] ({s},{n},{w},{e}) -> {added} new ({len(spots)} returned)',
                  flush=True)
        except Exception as ex:
            failures += 1
            print(f'[{i+1:2d}/{len(REGIONS)}] FAILED ({s},{n},{w},{e}): {ex}', flush=True)
        time.sleep(0.3)

    print(f'\nTotal unique spots: {len(all_spots)} ({failures} region failures)')

    OUT_PATH.write_text(
        json.dumps(all_spots, separators=(',', ':'), ensure_ascii=False),
        encoding='utf-8',
    )
    size_kb = OUT_PATH.stat().st_size / 1024
    print(f'Saved {OUT_PATH} ({size_kb:.1f} KB)')

    if failures > len(REGIONS) // 2:
        print('ERROR: more than half of regions failed — aborting to avoid overwriting good data',
              file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
