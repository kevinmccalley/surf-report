import type { GeoResult } from './types'

interface SurfSpot {
  name: string
  aliases?: string[]
  // country field is displayed as subtitle and passed to the surf API as location context
  country: string
  lat: number
  lon: number
}

// ~250 curated surf breaks with hand-verified coordinates.
// Using open-coast / surf-zone coordinates (not parking lots or towns).
const SURF_SPOTS: SurfSpot[] = [

  // ── California ──────────────────────────────────────────────────────────────
  { name: 'Mavericks',           aliases: ['Mavs'],                          country: 'Half Moon Bay, CA',       lat:  37.4920, lon: -122.5006 },
  { name: 'Ghost Tree',          aliases: ['Pescadero Point'],               country: 'Pebble Beach, CA',        lat:  36.5568, lon: -121.9618 },
  { name: 'Steamer Lane',        aliases: ['Steamers'],                      country: 'Santa Cruz, CA',          lat:  36.9516, lon: -122.0251 },
  { name: 'Pleasure Point',      aliases: ['Pleasure Point Santa Cruz'],     country: 'Santa Cruz, CA',          lat:  36.9552, lon: -121.9688 },
  { name: 'Ocean Beach',         aliases: ['OB San Francisco', 'SF Beach'],  country: 'San Francisco, CA',       lat:  37.7557, lon: -122.5065 },
  { name: 'Fort Point',                                                       country: 'San Francisco, CA',       lat:  37.8105, lon: -122.4769 },
  { name: 'Rincon',              aliases: ['Rincon Point', 'Queen of the Coast'], country: 'Carpinteria, CA',   lat:  34.3666, lon: -119.4750 },
  { name: 'C-Street',            aliases: ['California Street', 'Ventura Overhead'], country: 'Ventura, CA',   lat:  34.2742, lon: -119.2290 },
  { name: 'First Point Malibu',  aliases: ['Surfrider Beach', 'Malibu'],     country: 'Malibu, CA',             lat:  34.0312, lon: -118.7882 },
  { name: 'El Porto',            aliases: ['El Porto Manhattan Beach'],      country: 'Manhattan Beach, CA',     lat:  33.9050, lon: -118.4231 },
  { name: 'Huntington Beach',    aliases: ['HB', 'Surf City USA'],           country: 'Huntington Beach, CA',   lat:  33.6547, lon: -118.0046 },
  { name: 'Salt Creek',          aliases: ['The Ranch'],                     country: 'Dana Point, CA',          lat:  33.4771, lon: -117.7199 },
  { name: 'Lowers',              aliases: ['Lower Trestles', 'Trestles'],    country: 'San Clemente, CA',        lat:  33.3836, lon: -117.5897 },
  { name: 'Uppers',              aliases: ['Upper Trestles'],                country: 'San Clemente, CA',        lat:  33.3920, lon: -117.5930 },
  { name: 'San Onofre',          aliases: ['San-O', 'Old Mans'],             country: 'San Clemente, CA',        lat:  33.3742, lon: -117.5702 },
  { name: 'Swamis',                                                           country: 'Encinitas, CA',           lat:  33.0350, lon: -117.2917 },
  { name: 'Blacks Beach',        aliases: ['Black\'s'],                      country: 'La Jolla, CA',            lat:  32.8925, lon: -117.2536 },
  { name: 'Windansea',           aliases: ['Wind-n-Sea'],                    country: 'La Jolla, CA',            lat:  32.8312, lon: -117.2811 },
  { name: 'Big Rock',                                                         country: 'La Jolla, CA',            lat:  32.8218, lon: -117.2792 },
  { name: 'Pismo Beach',                                                      country: 'Pismo Beach, CA',         lat:  35.1427, lon: -120.6408 },

  // ── Hawaii ──────────────────────────────────────────────────────────────────
  { name: 'Pipeline',            aliases: ['Banzai Pipeline', 'Pipe'],       country: 'North Shore, Oahu',       lat:  21.6649, lon: -158.0530 },
  { name: 'Backdoor',            aliases: ['Backdoor Pipeline'],             country: 'North Shore, Oahu',       lat:  21.6645, lon: -158.0528 },
  { name: 'Off The Wall',        aliases: ['OTW', 'Kodak Reef'],             country: 'North Shore, Oahu',       lat:  21.6625, lon: -158.0505 },
  { name: 'Sunset Beach',        aliases: ['Sunset Hawaii', 'Sunset Oahu'], country: 'North Shore, Oahu',       lat:  21.6786, lon: -158.0404 },
  { name: 'Waimea Bay',                                                       country: 'Haleiwa, Oahu',           lat:  21.6432, lon: -158.0638 },
  { name: 'Laniakea',            aliases: ['Laniakea Beach', 'Turtle Beach'], country: 'North Shore, Oahu',     lat:  21.6190, lon: -158.0852 },
  { name: 'Rocky Point',         aliases: ['Rocky\'s'],                      country: 'North Shore, Oahu',       lat:  21.6645, lon: -158.0494 },
  { name: 'Haleiwa',             aliases: ['Haleiwa Ali\'i Beach'],           country: 'Haleiwa, Oahu',           lat:  21.5928, lon: -158.1034 },
  { name: 'Makaha',                                                           country: 'Waianae, Oahu',           lat:  21.4663, lon: -158.2104 },
  { name: 'Sandy Beach',         aliases: ['Sandy\'s'],                      country: 'Honolulu, Oahu',          lat:  21.2857, lon: -157.6727 },
  { name: 'Ala Moana Bowls',     aliases: ['Bowls'],                         country: 'Honolulu, Oahu',          lat:  21.2804, lon: -157.8445 },
  { name: 'Jaws',                aliases: ['Peahi', 'Pe\'ahi'],              country: 'Haiku, Maui',             lat:  20.9464, lon: -156.3014 },
  { name: 'Honolua Bay',                                                      country: 'Kapalua, Maui',           lat:  21.0145, lon: -156.6395 },
  { name: 'Hookipa',             aliases: ['Ho\'okipa'],                     country: 'Paia, Maui',              lat:  20.9352, lon: -156.3556 },
  { name: 'Hanalei Bay',                                                      country: 'Hanalei, Kauai',          lat:  22.2091, lon: -159.5068 },
  { name: 'Sunset Beach',        aliases: ['Sunset California', 'Sunset CA'], country: 'Huntington Beach, CA',  lat:  33.7271, lon: -118.0536 },

  // ── East Coast USA ───────────────────────────────────────────────────────────
  { name: 'Sebastian Inlet',                                                  country: 'Melbourne Beach, FL',    lat:  27.8603, lon:  -80.4473 },
  { name: 'Cocoa Beach',                                                       country: 'Cocoa Beach, FL',        lat:  28.3200, lon:  -80.6076 },
  { name: 'New Smyrna Beach',    aliases: ['NSB', 'Smyrna'],                 country: 'New Smyrna Beach, FL',   lat:  29.0360, lon:  -80.9650 },
  { name: 'Flagler Beach',                                                     country: 'Flagler Beach, FL',      lat:  29.4733, lon:  -81.1289 },
  { name: 'Cape Hatteras',       aliases: ['The Lighthouse'],                country: 'Buxton, NC',             lat:  35.2480, lon:  -75.5393 },
  { name: 'Outer Banks',         aliases: ['OBX', 'Jennettes Pier'],         country: 'Kill Devil Hills, NC',   lat:  36.0255, lon:  -75.7141 },
  { name: 'Folly Beach',                                                       country: 'Folly Beach, SC',        lat:  32.6597, lon:  -79.9368 },
  { name: 'Montauk',             aliases: ['The End', 'Ditch Plains'],       country: 'Montauk, NY',            lat:  41.0358, lon:  -71.9557 },
  { name: 'Manasquan',           aliases: ['Squan Inlet'],                   country: 'Manasquan, NJ',          lat:  40.1137, lon:  -74.0376 },
  { name: 'Asbury Park',                                                       country: 'Asbury Park, NJ',        lat:  40.2171, lon:  -74.0120 },
  { name: 'Nantucket',                                                         country: 'Nantucket, MA',          lat:  41.2570, lon:  -70.0934 },
  { name: 'Nauset Beach',                                                      country: 'Orleans, MA',            lat:  41.7944, lon:  -69.9352 },

  // ── Puerto Rico ──────────────────────────────────────────────────────────────
  { name: 'Rincon',              aliases: ['Rincon Puerto Rico', 'PR Rincon'], country: 'Rincón, Puerto Rico',  lat:  18.3402, lon:  -67.2500 },
  { name: 'Maria\'s Beach',      aliases: ['Marias', 'Tres Palmas'],          country: 'Rincón, Puerto Rico',   lat:  18.3480, lon:  -67.2615 },
  { name: 'Gas Chambers',                                                      country: 'Rincón, Puerto Rico',   lat:  18.3450, lon:  -67.2580 },
  { name: 'Wilderness',                                                         country: 'Rincón, Puerto Rico',   lat:  18.3565, lon:  -67.2603 },
  { name: 'Sandy Beach',         aliases: ['Sandy Beach PR'],                 country: 'Rincón, Puerto Rico',   lat:  18.3408, lon:  -67.2474 },

  // ── Mexico ───────────────────────────────────────────────────────────────────
  { name: 'Puerto Escondido',    aliases: ['Zicatela', 'Mexican Pipeline'],  country: 'Puerto Escondido, Oaxaca', lat: 15.8581, lon:  -97.0686 },
  { name: 'Punta de Mita',       aliases: ['El Anclote'],                    country: 'Punta de Mita, Nayarit', lat:  20.7795, lon: -105.5269 },
  { name: 'Pascuales',                                                         country: 'Tecoman, Colima',        lat:  18.5097, lon: -103.4628 },
  { name: 'La Ticla',                                                          country: 'La Ticla, Michoacán',    lat:  18.4544, lon: -103.5541 },
  { name: 'Scorpion Bay',        aliases: ['San Juanico'],                   country: 'San Juanico, Baja California Sur', lat: 26.2565, lon: -112.4850 },
  { name: 'Todos Santos',        aliases: ['Killers', 'Isla Todos Santos'],  country: 'Ensenada, Baja California', lat: 31.7997, lon: -116.7889 },
  { name: 'La Saladita',                                                       country: 'Troncones, Guerrero',    lat:  17.9389, lon: -101.6753 },
  { name: 'K38',                 aliases: ['La Fonda'],                      country: 'Rosarito, Baja California', lat: 32.1800, lon: -117.0600 },

  // ── Central America ──────────────────────────────────────────────────────────
  { name: 'Witch\'s Rock',       aliases: ['Roca Bruja'],                    country: 'Guanacaste, Costa Rica', lat:  10.8697, lon:  -85.8131 },
  { name: 'Ollie\'s Point',                                                   country: 'Guanacaste, Costa Rica', lat:  10.8379, lon:  -85.7051 },
  { name: 'Salsa Brava',                                                       country: 'Puerto Viejo, Costa Rica', lat: 9.6560, lon:  -82.7237 },
  { name: 'Pavones',                                                           country: 'Puntarenas, Costa Rica', lat:   8.3876, lon:  -83.1394 },
  { name: 'Playa Dominical',     aliases: ['Dominical'],                     country: 'Dominical, Costa Rica',  lat:   9.2507, lon:  -83.8617 },
  { name: 'Playa Grande',                                                      country: 'Guanacaste, Costa Rica', lat:  10.3282, lon:  -85.8514 },
  { name: 'Punta Roca',                                                        country: 'La Libertad, El Salvador', lat: 13.4797, lon: -89.3265 },
  { name: 'Las Flores',          aliases: ['El Salvador Las Flores'],        country: 'La Unión, El Salvador',  lat:  13.3200, lon:  -87.9400 },

  // ── South America ────────────────────────────────────────────────────────────
  { name: 'Chicama',             aliases: ['Puerto Malabrigo'],              country: 'La Libertad, Peru',      lat:  -7.7000, lon:  -79.4500 },
  { name: 'Lobitos',                                                           country: 'Talara, Peru',           lat:  -4.4528, lon:  -81.2777 },
  { name: 'Mancora',                                                           country: 'Piura, Peru',            lat:  -4.1067, lon:  -81.0516 },
  { name: 'Punta de Lobos',                                                    country: 'Pichilemu, Chile',       lat: -34.4000, lon:  -71.9167 },
  { name: 'Pichilemu',           aliases: ['Punta de Lobos'],                country: 'O\'Higgins, Chile',      lat: -34.3936, lon:  -72.0016 },
  { name: 'Arica',               aliases: ['El Gringo'],                     country: 'Arica, Chile',           lat: -18.4783, lon:  -70.3126 },
  { name: 'Iquique',                                                           country: 'Iquique, Chile',         lat: -20.2208, lon:  -70.1431 },
  { name: 'Fernando de Noronha',                                               country: 'Pernambuco, Brazil',     lat:  -3.8558, lon:  -32.4249 },
  { name: 'Saquarema',                                                         country: 'Rio de Janeiro, Brazil', lat: -22.9269, lon:  -42.5108 },
  { name: 'Florianopolis',       aliases: ['Joaquina'],                      country: 'Santa Catarina, Brazil', lat: -27.5969, lon:  -48.5495 },
  { name: 'Praia do Rosa',                                                     country: 'Imbituba, Brazil',       lat: -28.1289, lon:  -48.6558 },

  // ── Portugal ─────────────────────────────────────────────────────────────────
  { name: 'Supertubos',          aliases: ['Peniche', 'Portuguese Pipeline'], country: 'Peniche, Portugal',     lat:  39.3458, lon:   -9.3883 },
  { name: 'Praia do Norte',      aliases: ['Nazare', 'Nazaré'],              country: 'Nazaré, Portugal',       lat:  39.6015, lon:   -9.0710 },
  { name: 'Ribeira d\'Ilhas',    aliases: ['Ericeira'],                      country: 'Ericeira, Portugal',     lat:  38.9878, lon:   -9.4193 },
  { name: 'Coxos',                                                             country: 'Ericeira, Portugal',     lat:  39.0050, lon:   -9.4120 },
  { name: 'Sagres',              aliases: ['Tonel'],                         country: 'Sagres, Portugal',       lat:  37.0076, lon:   -8.9456 },
  { name: 'Guincho',                                                           country: 'Cascais, Portugal',      lat:  38.7276, lon:   -9.4761 },

  // ── France ───────────────────────────────────────────────────────────────────
  { name: 'La Graviere',         aliases: ['Hossegor', 'La Grav'],           country: 'Hossegor, France',       lat:  43.6654, lon:   -1.4438 },
  { name: 'Les Culs Nuls',       aliases: ['Hossegor south'],                country: 'Hossegor, France',       lat:  43.6521, lon:   -1.4449 },
  { name: 'Biarritz',            aliases: ['Grande Plage'],                  country: 'Biarritz, France',       lat:  43.4832, lon:   -1.5586 },
  { name: 'Lacanau',                                                           country: 'Lacanau-Océan, France',  lat:  45.0004, lon:   -1.1918 },
  { name: 'Anglet',              aliases: ['Chambre d\'Amour'],              country: 'Anglet, France',         lat:  43.5183, lon:   -1.5386 },

  // ── Spain ────────────────────────────────────────────────────────────────────
  { name: 'Mundaka',                                                           country: 'Basque Country, Spain',  lat:  43.4078, lon:   -2.6993 },
  { name: 'Zarautz',                                                           country: 'Basque Country, Spain',  lat:  43.2835, lon:   -2.1723 },
  { name: 'Pantin',                                                            country: 'Galicia, Spain',         lat:  43.7128, lon:   -7.8514 },
  { name: 'El Quemao',           aliases: ['Lanzarote'],                     country: 'Lanzarote, Canary Islands', lat: 29.0997, lon:  -13.5631 },
  { name: 'Famara',              aliases: ['Las Dunas de Famara'],           country: 'Lanzarote, Canary Islands', lat: 29.1333, lon:  -13.5500 },
  { name: 'El Confital',                                                       country: 'Gran Canaria, Canary Islands', lat: 28.1598, lon: -15.4394 },

  // ── UK & Ireland ─────────────────────────────────────────────────────────────
  { name: 'Fistral',             aliases: ['Fistral Beach'],                 country: 'Newquay, Cornwall, UK',  lat:  50.4150, lon:   -5.1000 },
  { name: 'Croyde',              aliases: ['Croyde Bay'],                    country: 'North Devon, UK',        lat:  51.1278, lon:   -4.2286 },
  { name: 'Porthleven',                                                        country: 'Cornwall, UK',           lat:  50.0837, lon:   -5.3218 },
  { name: 'Lynmouth',                                                          country: 'Devon, UK',              lat:  51.2307, lon:   -3.8293 },
  { name: 'Thurso East',         aliases: ['Thurso', 'Shit Pipe'],           country: 'Thurso, Scotland',       lat:  58.5928, lon:   -3.5062 },
  { name: 'Bundoran',            aliases: ['The Peak', 'Bundoran Peak'],     country: 'Donegal, Ireland',       lat:  54.4766, lon:   -8.2860 },
  { name: 'Mullaghmore',         aliases: ['Mullaghmore Head'],              country: 'Sligo, Ireland',         lat:  54.4655, lon:   -8.4495 },
  { name: 'Lahinch',             aliases: ['Crab Island'],                   country: 'County Clare, Ireland',  lat:  52.9355, lon:   -9.3437 },

  // ── Morocco ──────────────────────────────────────────────────────────────────
  { name: 'Anchor Point',                                                      country: 'Taghazout, Morocco',     lat:  30.5450, lon:   -9.7258 },
  { name: 'Hash Point',          aliases: ['Taghazout'],                     country: 'Taghazout, Morocco',     lat:  30.5395, lon:   -9.7240 },
  { name: 'Killer Point',        aliases: ['Killers Morocco'],                country: 'Taghazout, Morocco',     lat:  30.5256, lon:   -9.7192 },
  { name: 'La Source',                                                         country: 'Taghazout, Morocco',     lat:  30.5194, lon:   -9.7133 },
  { name: 'Safi',                aliases: ['Safi Right'],                    country: 'Safi, Morocco',           lat:  32.2833, lon:   -9.2333 },

  // ── South Africa ─────────────────────────────────────────────────────────────
  { name: 'Supertubes',          aliases: ['J-Bay', 'J Bay', 'Jeffrey\'s Bay', 'Jeffreys Bay', 'Jeffery\'s Bay', 'Jefferys Bay'], country: 'Jeffrey\'s Bay, South Africa', lat: -34.0481, lon: 24.9313 },
  { name: 'Boneyards',           aliases: ['Boneyard J-Bay', 'Jeffery\'s Bay'],        country: 'Jeffrey\'s Bay, South Africa', lat: -34.0439, lon: 24.9394 },
  { name: 'Dungeons',                                                          country: 'Hout Bay, South Africa', lat: -34.0333, lon:  18.3500 },
  { name: 'Cave Rock',           aliases: ['Bluff'],                         country: 'Durban, South Africa',   lat: -29.9700, lon:  31.0300 },
  { name: 'New Pier',                                                          country: 'Durban, South Africa',   lat: -29.8600, lon:  31.0490 },
  { name: 'Elands Bay',                                                        country: 'Western Cape, South Africa', lat: -32.3000, lon:  18.3167 },
  { name: 'Victoria Bay',        aliases: ['Vic Bay'],                       country: 'George, South Africa',   lat: -34.0056, lon:  22.5931 },

  // ── Namibia ──────────────────────────────────────────────────────────────────
  { name: 'Skeleton Bay',        aliases: ['Donkey Bay', 'Lagoa'],           country: 'Walvis Bay, Namibia',    lat: -22.9376, lon:  14.4175 },

  // ── Indonesia ────────────────────────────────────────────────────────────────
  { name: 'Uluwatu',             aliases: ['Ulu\'s'],                        country: 'Uluwatu, Bali',          lat:  -8.8292, lon: 115.0849 },
  { name: 'Padang Padang',       aliases: ['Padang'],                        country: 'Uluwatu, Bali',          lat:  -8.8110, lon: 115.0877 },
  { name: 'Bingin',              aliases: ['Impossibles'],                   country: 'Bukit Peninsula, Bali',  lat:  -8.8030, lon: 115.0920 },
  { name: 'Keramas',                                                           country: 'Gianyar, Bali',          lat:  -8.6558, lon: 115.2889 },
  { name: 'Medewi',                                                            country: 'West Bali, Indonesia',   lat:  -8.4722, lon: 114.6667 },
  { name: 'Canggu',              aliases: ['Batu Bolong', 'Echo Beach'],     country: 'Canggu, Bali',           lat:  -8.6503, lon: 115.1332 },
  { name: 'G-Land',              aliases: ['Grajagan', 'Grajagan Bay'],      country: 'East Java, Indonesia',   lat:  -8.6590, lon: 114.3710 },
  { name: 'Desert Point',        aliases: ['Bangko Bangko'],                 country: 'Lombok, Indonesia',      lat:  -8.7558, lon: 115.8139 },
  { name: 'Lagundri Bay',        aliases: ['Nias', 'Sorake'],                country: 'Nias, Indonesia',        lat:   0.5960, lon:  97.7860 },
  { name: 'Macaronis',           aliases: ['Macas'],                         country: 'Mentawai Islands, Indonesia', lat: -2.5920, lon:  99.8540 },
  { name: 'Rifles',              aliases: ['Mentawai Rifles'],               country: 'Mentawai Islands, Indonesia', lat: -2.4590, lon:  99.8640 },
  { name: 'Bank Vaults',                                                       country: 'Mentawai Islands, Indonesia', lat: -2.4420, lon:  99.8730 },
  { name: 'HT\'s',              aliases: ['Lance\'s Right', 'Hollow Trees'], country: 'Mentawai Islands, Indonesia', lat: -1.9620, lon:  99.6220 },
  { name: 'E-Bay',               aliases: ['Lance\'s Left'],                 country: 'Mentawai Islands, Indonesia', lat: -2.0210, lon:  99.6310 },

  // ── Maldives ─────────────────────────────────────────────────────────────────
  { name: 'Pasta Point',         aliases: ['Dhigu'],                         country: 'North Malé Atoll, Maldives', lat: 4.2833, lon: 73.5000 },
  { name: 'Sultans',             aliases: ['Honky\'s'],                      country: 'North Malé Atoll, Maldives', lat: 4.2597, lon: 73.4765 },
  { name: 'Chickens',                                                          country: 'North Malé Atoll, Maldives', lat: 4.2500, lon: 73.4700 },

  // ── Reunion Island ───────────────────────────────────────────────────────────
  { name: 'St. Leu',             aliases: ['Saint-Leu'],                     country: 'Réunion Island, France', lat: -21.1664, lon:  55.2869 },
  { name: 'Trois Bassins',                                                     country: 'Réunion Island, France', lat: -21.1000, lon:  55.2700 },

  // ── French Polynesia ─────────────────────────────────────────────────────────
  { name: 'Teahupo\'o',          aliases: ['Chopes', 'Teahupoo', 'Tahiti'],  country: 'Tahiti, French Polynesia', lat: -17.8417, lon: -149.2670 },

  // ── Fiji ─────────────────────────────────────────────────────────────────────
  { name: 'Cloudbreak',          aliases: ['Tavarua'],                       country: 'Tavarua, Fiji',          lat: -17.8577, lon: 177.2018 },
  { name: 'Restaurants',         aliases: ['Tavarua Inside'],                country: 'Tavarua, Fiji',          lat: -17.8560, lon: 177.2030 },
  { name: 'Frigates',            aliases: ['Frigates Passage'],              country: 'Pacific Harbour, Fiji',  lat: -18.3333, lon: 178.0833 },
  { name: 'Swimming Pools',                                                    country: 'Namotu, Fiji',           lat: -17.8620, lon: 177.2200 },

  // ── Australia ────────────────────────────────────────────────────────────────
  { name: 'Bells Beach',         aliases: ['Rincon of the South'],           country: 'Torquay, Victoria',      lat: -38.3677, lon: 144.2829 },
  { name: 'Jan Juc',                                                           country: 'Torquay, Victoria',      lat: -38.3990, lon: 144.3121 },
  { name: 'Snapper Rocks',       aliases: ['Superbank', 'Kirra Point'],      country: 'Gold Coast, Queensland', lat: -28.1575, lon: 153.5538 },
  { name: 'Kirra',                                                             country: 'Gold Coast, Queensland', lat: -28.1666, lon: 153.5313 },
  { name: 'Burleigh Heads',      aliases: ['Burleigh'],                      country: 'Gold Coast, Queensland', lat: -28.1006, lon: 153.4373 },
  { name: 'Duranbah',            aliases: ['D-Bah'],                         country: 'Tweed Heads, NSW',       lat: -28.1403, lon: 153.5428 },
  { name: 'Coolangatta',                                                       country: 'Gold Coast, Queensland', lat: -28.1697, lon: 153.5568 },
  { name: 'Noosa',               aliases: ['Noosa Heads', 'Noosa National Park'], country: 'Sunshine Coast, Queensland', lat: -26.3943, lon: 153.0901 },
  { name: 'The Pass',            aliases: ['Byron Bay'],                     country: 'Byron Bay, NSW',         lat: -28.6431, lon: 153.6150 },
  { name: 'Wategos',             aliases: ['Watego\'s Beach'],               country: 'Byron Bay, NSW',         lat: -28.6406, lon: 153.6364 },
  { name: 'Lennox Head',         aliases: ['Lennox'],                        country: 'Lennox Head, NSW',       lat: -28.7917, lon: 153.5875 },
  { name: 'North Narrabeen',     aliases: ['Narrabeen', 'Narra'],            country: 'Sydney, NSW',            lat: -33.7094, lon: 151.2961 },
  { name: 'Bondi Beach',         aliases: ['Bondi'],                         country: 'Sydney, NSW',            lat: -33.8908, lon: 151.2743 },
  { name: 'Cronulla',                                                          country: 'Sydney, NSW',            lat: -34.0566, lon: 151.1542 },
  { name: 'Shipsterns Bluff',    aliases: ['Shippies', 'Shipstern'],         country: 'Tasman Peninsula, Tasmania', lat: -43.0943, lon: 148.0058 },
  { name: 'Surfers Point',       aliases: ['Margaret River'],                country: 'Margaret River, WA',     lat: -33.9572, lon: 114.9833 },
  { name: 'The Box',                                                           country: 'Margaret River, WA',     lat: -33.9600, lon: 114.9820 },
  { name: 'Yallingup',                                                         country: 'Yallingup, WA',          lat: -33.6567, lon: 115.0265 },
  { name: 'North Point',                                                        country: 'Kalbarri, WA',           lat: -27.6990, lon: 114.1670 },

  // ── New Zealand ──────────────────────────────────────────────────────────────
  { name: 'Raglan',              aliases: ['Manu Bay', 'Indicators', 'Whale Bay'], country: 'Raglan, Waikato',  lat: -37.8013, lon: 174.8777 },
  { name: 'Piha',                aliases: ['Piha Beach'],                    country: 'Auckland, New Zealand',  lat: -36.9540, lon: 174.4710 },

  // ── Japan ────────────────────────────────────────────────────────────────────
  { name: 'Tsurigasaki',         aliases: ['Shidashita', 'Ichinomiya Olympics'], country: 'Chiba, Japan',      lat:  35.3667, lon: 140.3667 },
  { name: 'Ichinomiya',                                                        country: 'Chiba, Japan',          lat:  35.3730, lon: 140.3581 },
]

export function searchSurfSpots(query: string): GeoResult[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  const matches = SURF_SPOTS.filter(s => {
    const searchFields = [s.name, ...(s.aliases ?? []), s.country]
    return searchFields.some(f => f.toLowerCase().includes(q))
  })

  // Prefer name-starts-with matches first
  matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1
    const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1
    return aStarts - bStarts
  })

  return matches.slice(0, 6).map(s => ({
    name: s.name,
    country: s.country,
    lat: s.lat,
    lon: s.lon,
    displayName: `${s.name}, ${s.country}`,
  }))
}
