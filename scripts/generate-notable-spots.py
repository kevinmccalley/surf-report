#!/usr/bin/env python3
"""
Generates app/lib/notable-spots.json — a curated ~400-spot global list used
by the /api/cron/epic-now route to find Epic-rated spots around the world.

Strategy:
1. Start with a guaranteed list of world-famous surf spots (always included).
2. Fill remaining slots with grid-distributed spots from surf-spots.json
   so every populated surf region has representation.

Run: python3 scripts/generate-notable-spots.py
"""

import json
from pathlib import Path

SRC_PATH = Path(__file__).parent.parent / 'app' / 'lib' / 'surf-spots.json'
OUT_PATH = Path(__file__).parent.parent / 'app' / 'lib' / 'notable-spots.json'

# Famous spots that must always be in the list.
# Each entry is a substring to match against spot names (case-insensitive).
# Spots not in surf-spots.json (outside fetch region bounding boxes) but too famous to omit.
# Coordinates verified from public sources.
HARDCODED_SPOTS = [
    {'name': 'Cloudbreak',    'lat': -17.703, 'lon': 177.080},  # Fiji
    {'name': 'Restaurants',   'lat': -17.710, 'lon': 177.070},  # Fiji
    {'name': 'Mavericks',     'lat':  37.496, 'lon': -122.499}, # Half Moon Bay, CA
    {'name': 'Steamer Lane',  'lat':  36.953, 'lon': -122.024}, # Santa Cruz, CA
    {'name': "HT's",          'lat':  -1.608, 'lon':  98.817},  # Mentawai
]

MUST_INCLUDE_NAMES = [
    # Hawaii
    'Pipeline', 'Backdoor', 'Sunset Beach', 'Waimea Bay', 'Off The Wall',
    'Rocky Point', 'Haleiwa', 'Laniakea', 'Makaha',
    # California
    'Lower Trestles', 'Upper Trestles', 'Mavericks', 'Rincon',
    'Blacks Beach', 'Swamis', 'Salt Creek', "Black's",
    'Huntington Beach Pier', 'Zuma',
    # Pacific NW / Alaska
    'Steamer Lane',
    # Mexico
    'Puerto Escondido', 'Barra de la Cruz', 'Todos Santos',
    # Central America
    'Pavones', "Witch's Rock", 'Playa Hermosa',
    # South America
    'Punta Roca', 'Pico Alto', 'La Herradura',
    # Brazil
    'Fernando de Noronha', 'Itacaré',
    # France
    'La Graviere', 'Hossegor', 'Biarritz', 'Lacanau', 'Anglet',
    # Portugal
    'Supertubos', 'Coxos', 'Ribeira', 'Nazaré', 'Ericeira',
    # Spain
    'Mundaka',
    # Morocco
    'Anchor Point', 'Taghazout', 'Boilers', 'Killer Point',
    # UK / Ireland
    'Fistral', 'Thurso', 'Bundoran',
    # South Africa
    'Jeffreys Bay', 'J-Bay', 'Dungeons', 'Cave Rock',
    # Canary Islands
    'El Quemao', 'La Santa', 'Lanzarote',
    # Azores
    'Santa Barbara',
    # Australia
    'Bells Beach', 'Snapper Rocks', 'Kirra', 'Burleigh Heads',
    'Margaret River', 'The Right', 'Shipstern',
    # New Zealand
    'Raglan',
    # Indonesia / Bali
    'Uluwatu', 'Padang Padang', 'Keramas', 'Desert Point', 'Lakey Peak',
    # Maldives
    'Sultans', 'Jailbreaks', 'Chickens',
    # Tahiti / French Polynesia
    'Teahupo',
    # Fiji
    'Cloudbreak', 'Restaurants', 'Frigates',
    # Japan
    'Tsurigasaki', 'Chiba',
    # Mentawai
    'HT\'s', 'Macaronis', 'Rifles',
]

# Generic terms that should never count as a famous spot match
SKIP_GENERIC = {'beach', 'point', 'reef', 'break', 'bar', 'rights', 'lefts'}

GRID_DEGREES   = 5   # degrees per grid cell
MAX_PER_CELL   = 6   # grid spots per cell (after famous spots are placed)
TARGET_TOTAL   = 450


def find_famous(all_spots: list[dict]) -> list[dict]:
    found: list[dict] = []
    found_names: set[str] = set()
    for keyword in MUST_INCLUDE_NAMES:
        kw_lower = keyword.lower()
        # Skip if the keyword itself is too generic
        if kw_lower in SKIP_GENERIC:
            continue
        best = None
        for spot in all_spots:
            if kw_lower in spot['name'].lower():
                if best is None:
                    best = spot
                # Prefer shorter names (more specific match)
                elif len(spot['name']) < len(best['name']):
                    best = spot
        if best and best['name'] not in found_names:
            found.append(best)
            found_names.add(best['name'])
    return found


def grid_key(lat: float, lon: float) -> tuple[int, int]:
    return (int(lat // GRID_DEGREES), int(lon // GRID_DEGREES))


def grid_fill(all_spots: list[dict], already_taken: set[str]) -> list[dict]:
    cells: dict[tuple, list[dict]] = {}
    for spot in all_spots:
        if spot['name'] in already_taken:
            continue
        key = grid_key(spot['lat'], spot['lon'])
        cells.setdefault(key, []).append(spot)

    selected: list[dict] = []
    for cell_spots in cells.values():
        selected.extend(cell_spots[:MAX_PER_CELL])
    return selected


def main():
    all_spots: list[dict] = json.loads(SRC_PATH.read_text(encoding='utf-8'))
    print(f'Loaded {len(all_spots)} spots from surf-spots.json')

    famous = find_famous(all_spots)
    # Add hardcoded spots not in surf-spots.json
    hardcoded_names = {sp['name'] for sp in famous}
    for sp in HARDCODED_SPOTS:
        if sp['name'] not in hardcoded_names:
            famous.append(sp)
            hardcoded_names.add(sp['name'])
    print(f'Famous spots matched: {len(famous)} (includes {len(HARDCODED_SPOTS)} hardcoded)')
    for sp in famous:
        print(f'  + {sp["name"]} ({sp["lat"]:.3f}, {sp["lon"]:.3f})')

    taken = {sp['name'] for sp in famous}
    grid = grid_fill(all_spots, taken)
    print(f'Grid-distributed spots: {len(grid)}')

    combined = famous + grid
    combined.sort(key=lambda s: (s['lat'], s['lon']))

    if len(combined) > TARGET_TOTAL:
        # Keep all famous spots; trim grid fill
        grid_trimmed = grid[:TARGET_TOTAL - len(famous)]
        combined = famous + grid_trimmed
        combined.sort(key=lambda s: (s['lat'], s['lon']))

    print(f'\nTotal notable spots: {len(combined)}')

    # Verify famous spots present
    print('\nVerification:')
    checks = ['Pipeline', 'Teahupo', 'Trestles', 'La Graviere', 'Uluwatu', 'Supertubos',
              'Cloudbreak', 'Mavericks', 'Bells Beach', 'Snapper', 'Jeffreys', 'HT']
    for name in checks:
        matches = [s['name'] for s in combined if name.lower() in s['name'].lower()]
        status = ', '.join(matches) if matches else 'MISSING'
        print(f'  {name}: {status}')

    OUT_PATH.write_text(
        json.dumps(combined, separators=(',', ':'), ensure_ascii=False),
        encoding='utf-8',
    )
    size_kb = OUT_PATH.stat().st_size / 1024
    print(f'\nSaved {OUT_PATH} ({size_kb:.1f} KB, {len(combined)} spots)')


if __name__ == '__main__':
    main()
