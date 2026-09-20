/**
 * osmCoords.ts — OpenStreetMap (OSM) Geographic Coordinate Bridge
 * Maps real-world Kerala festival grounds (Thekkinkadu Maidan / Thrissur Pooram Grounds)
 * to the 3D Babylon world coordinates (X, Z).
 */

// Thrissur Pooram Grounds (Thekkinkadu Maidan, Thrissur, Kerala)
// Center of the maidan where the grand Pooram festival and fair take place
export const OSM_CENTER_LAT = 10.5244;
export const OSM_CENTER_LON = 76.2144;

// 1 degree of latitude ≈ 111,320 meters
const METERS_PER_DEGREE_LAT = 111320;
// 1 degree of longitude at 10.5° N ≈ 111,320 * cos(10.5°) ≈ 109,450 meters
const METERS_PER_DEGREE_LON = 109450;

/**
 * Converts 3D world (x, z) coordinates in meters to real-world OpenStreetMap GPS (lat, lon).
 */
export function worldToGps(x: number, z: number): { lat: number; lon: number } {
  const lat = OSM_CENTER_LAT + z / METERS_PER_DEGREE_LAT;
  const lon = OSM_CENTER_LON + x / METERS_PER_DEGREE_LON;
  return { lat, lon };
}

/**
 * Converts real-world OpenStreetMap GPS (lat, lon) to 3D world (x, z) in meters.
 */
export function gpsToWorld(lat: number, lon: number): { x: number; z: number } {
  const z = (lat - OSM_CENTER_LAT) * METERS_PER_DEGREE_LAT;
  const x = (lon - OSM_CENTER_LON) * METERS_PER_DEGREE_LON;
  return { x, z };
}

/**
 * Key Points of Interest across the Kerala Fair grounds.
 */
export interface FairPOI {
  id: string;
  name: string;
  malayalamName: string;
  category: 'ride' | 'attraction' | 'food' | 'shop' | 'entrance' | 'culture';
  worldPos: [number, number]; // [x, z] in 3D world meters
  icon: string;
  color: string;
}

export const FAIR_POIS: FairPOI[] = [
  {
    id: 'entrance',
    name: 'Festival Entrance Arch',
    malayalamName: 'പ്രവേശന കവാടം',
    category: 'entrance',
    worldPos: [0, -75],
    icon: '⛩️',
    color: '#F59E0B',
  },
  {
    id: 'nalukettu',
    name: 'Nalukettu Cultural Pavilion',
    malayalamName: 'നാലുകെട്ട് പവലിയൻ',
    category: 'culture',
    worldPos: [0, -15],
    icon: '🏛️',
    color: '#8B5CF6',
  },
  {
    id: 'ferris_wheel',
    name: 'Giant Ferris Wheel (Rattinam)',
    malayalamName: 'ഭീമൻ രാട്ടിനം',
    category: 'ride',
    worldPos: [55, 45],
    icon: '🎡',
    color: '#EF4444',
  },
  {
    id: 'carousel',
    name: 'Merry-Go-Round Carousel',
    malayalamName: 'ചുഴലിക്കുതിര',
    category: 'ride',
    worldPos: [35, 60],
    icon: '🎠',
    color: '#EC4899',
  },
  {
    id: 'elephant',
    name: 'Caparisoned Tusker (Aana)',
    malayalamName: 'തിടമ്പേറ്റിയ ഗജവീരൻ',
    category: 'attraction',
    worldPos: [-22, -15],
    icon: '🐘',
    color: '#F97316',
  },
  {
    id: 'thattukada',
    name: 'Chaya Kada & Thattukada',
    malayalamName: 'ചായക്കട & തട്ടുകട',
    category: 'food',
    worldPos: [-50, 40],
    icon: '☕',
    color: '#10B981',
  },
  {
    id: 'shops',
    name: 'Kasavu & Handicraft Stalls',
    malayalamName: 'കരകൗശല സ്റ്റാളുകൾ',
    category: 'shop',
    worldPos: [50, -30],
    icon: '🛍️',
    color: '#3B82F6',
  },
  {
    id: 'pookkalam',
    name: 'Grand Pookkalam Carpet',
    malayalamName: 'പൂക്കളം',
    category: 'culture',
    worldPos: [0, 10],
    icon: '🌸',
    color: '#EAB308',
  },
  {
    id: 'kathakali',
    name: 'Kathakali Natyagriham',
    malayalamName: 'കഥകളി മണ്ഡപം',
    category: 'culture',
    worldPos: [-55, -60],
    icon: '🎭',
    color: '#10B981',
  },
  {
    id: 'chenda_melam',
    name: 'Panchavadyam & Chenda Melam',
    malayalamName: 'മേളക്കൂട്ടം (പഞ്ചവാദ്യം)',
    category: 'culture',
    worldPos: [25, -60],
    icon: '🥁',
    color: '#F59E0B',
  },
  {
    id: 'temple_pond',
    name: 'Ambalakkulam Temple Pond',
    malayalamName: 'അമ്പലക്കുളം',
    category: 'attraction',
    worldPos: [0, 55],
    icon: '🪷',
    color: '#06B6D4',
  },
  {
    id: 'kettuvallam',
    name: 'Kerala Houseboat (Kettuvallam)',
    malayalamName: 'കെട്ടുവള്ളം',
    category: 'attraction',
    worldPos: [14, 55],
    icon: '⛵',
    color: '#84CC16',
  },
  {
    id: 'columbus',
    name: 'Columbus Pirate Ship Ride',
    malayalamName: 'കൊളംബസ് ബോട്ട്',
    category: 'ride',
    worldPos: [72, 50],
    icon: '🏴‍☠️',
    color: '#E11D48',
  },
  {
    id: 'tora_tora',
    name: 'Tora Tora Thrill Ride',
    malayalamName: 'ടോറ ടോറ',
    category: 'ride',
    worldPos: [70, 18],
    icon: '🌀',
    color: '#F97316',
  },
  {
    id: 'horror_house',
    name: 'Horror House (Ghost Cave)',
    malayalamName: 'ഭീതിയുടെ ഗുഹ',
    category: 'attraction',
    worldPos: [-70, 55],
    icon: '💀',
    color: '#DC2626',
  },
  {
    id: 'aqua_expo',
    name: '360° Aqua Tunnel Marine Expo',
    malayalamName: 'അക്വാ എക്സ്പോ',
    category: 'attraction',
    worldPos: [-28, 55],
    icon: '🐠',
    color: '#06B6D4',
  },
  {
    id: 'halwa_stalls',
    name: 'Kozhikodan Halwa & Food Street',
    malayalamName: 'കോഴിക്കോടൻ ഹൽവ & മിഠായി',
    category: 'food',
    worldPos: [50, -25],
    icon: '🍯',
    color: '#B87333',
  },
  {
    id: 'carnival_games',
    name: 'Balloon Shooting & Games',
    malayalamName: 'ബലൂൺ ഷൂട്ടിംഗ് & ഗെയിമുകൾ',
    category: 'attraction',
    worldPos: [48, 0],
    icon: '🎯',
    color: '#EC4899',
  },
  {
    id: 'selfie_zone',
    name: 'Miracle Garden & I ❤️ KANNUR',
    malayalamName: 'ഐ ലവ് കണ്ണൂർ സെൽഫി പോയിന്റ്',
    category: 'culture',
    worldPos: [-55, 0],
    icon: '❤️',
    color: '#F43F5E',
  },
];
