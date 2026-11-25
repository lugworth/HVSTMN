// Mining depth systems for GLADE: visual cave biomes, pitfall shafts, and crackable geodes.

export type MineBiomeId = 'earth' | 'crystal' | 'basalt' | 'glacier' | 'mythic';

export interface MineBiome {
  id: MineBiomeId;
  name: string;
  wallGlyph: string;
  wallCol: string;
  floorCol: string;
  wallBg: string;
  floorBg: string;
  geode: GeodeKind;
}

export type GeodeKind = 'Geode' | 'Frozen Geode' | 'Magma Geode';
export const GEODE_KINDS: readonly GeodeKind[] = ['Geode', 'Frozen Geode', 'Magma Geode'];
export const CRACK_GEODE_FEE = 25;

export interface GeodeMineralDef {
  name: string;
  price: number;
  desc: string;
}

export const GEODE_MINERALS: readonly GeodeMineralDef[] = [
  { name: 'Quartz', price: 110, desc: 'Clear six-sided cavern crystal prized by glassmakers.' },
  { name: 'Amethyst', price: 220, desc: 'Deep violet crystal cluster found in geode seams.' },
  { name: 'Sunstone', price: 320, desc: 'Warm amber feldspar that catches torchlight.' },
  { name: 'Moonstone', price: 340, desc: 'Opalescent pale-blue stone from frozen deep veins.' },
  { name: 'Star Shard', price: 520, desc: 'Rare iridescent mineral fragment prized by the Museum.' },
];

export const GEODE_MINERAL_NAMES: readonly string[] = GEODE_MINERALS.map((m) => m.name);

/** Visual & loot biome for a mine floor. */
export function mineBiomeFor(floor: number, mineType: 'spring' | 'lake' = 'spring'): MineBiome {
  if (floor >= 100) {
    return {
      id: 'mythic',
      name: 'Mythic Sanctum',
      wallGlyph: '▓',
      wallCol: '0B',
      floorCol: '0C',
      wallBg: '#0c241e',
      floorBg: '#071512',
      geode: mineType === 'lake' ? 'Frozen Geode' : 'Magma Geode',
    };
  }
  if (floor >= 50) {
    if (mineType === 'lake') {
      return {
        id: 'glacier',
        name: 'Glacier Vaults',
        wallGlyph: '▒',
        wallCol: '0C',
        floorCol: '0D',
        wallBg: '#0a1f3a',
        floorBg: '#061224',
        geode: 'Frozen Geode',
      };
    }
    return {
      id: 'basalt',
      name: 'Basalt Depths',
      wallGlyph: '▓',
      wallCol: '08',
      floorCol: '09',
      wallBg: '#2b1210',
      floorBg: '#170a09',
      geode: 'Magma Geode',
    };
  }
  if (floor >= 25) {
    return {
      id: 'crystal',
      name: 'Crystal Geode Caverns',
      wallGlyph: '▒',
      wallCol: '0E',
      floorCol: '0D',
      wallBg: '#201336',
      floorBg: '#120b1f',
      geode: mineType === 'lake' ? 'Frozen Geode' : 'Geode',
    };
  }
  return {
    id: 'earth',
    name: mineType === 'lake' ? 'Mirewater Upper Shaft' : 'Copperseam Upper Shaft',
    wallGlyph: '#',
    wallCol: '04',
    floorCol: '04',
    wallBg: '#261e18',
    floorBg: '#15110d',
    geode: mineType === 'lake' ? 'Frozen Geode' : 'Geode',
  };
}

export interface PitfallDrop {
  dropFloors: number;
  targetFloor: number;
  staminaCost: number;
}

/** Compute pitfall drop depth and stamina cost (safe-clamped to floor 255). */
export function rollPitfallDrop(
  currentFloor: number,
  hasDeepProspector: boolean,
  noFaint: boolean,
  rng: () => number = Math.random,
): PitfallDrop {
  const rawDrop = 2 + Math.floor(rng() * 5); // 2..6 floors
  const targetFloor = Math.min(255, currentFloor + rawDrop);
  const dropFloors = Math.max(1, targetFloor - currentFloor);
  const perFloor = hasDeepProspector ? 2 : 3;
  const staminaCost = noFaint ? Math.max(1, dropFloors) : dropFloors * perFloor;
  return { dropFloors, targetFloor, staminaCost };
}

/** Roll whether breaking a mine rock also uncovers a Geode. */
export function rollMineGeodeDrop(
  floor: number,
  mineType: 'spring' | 'lake',
  luck: number,
  hasDeepProspector: boolean,
  rng: () => number = Math.random,
): GeodeKind | null {
  const chance = 0.08 + Math.min(0.08, floor * 0.001) + Math.max(0, luck * 0.02) + (hasDeepProspector ? 0.06 : 0);
  if (rng() >= chance) return null;
  return mineBiomeFor(floor, mineType).geode;
}

/** Crack a Geode at Rowan's Forge into a mineral, gem, or ore bundle. */
export function rollGeodeLoot(
  geode: GeodeKind,
  luck: number,
  rng: () => number = Math.random,
): { item: string; qty: number; rare: boolean } {
  const r = Math.max(0, Math.min(0.999, rng() + Math.max(0, luck) * 0.04));
  if (geode === 'Magma Geode') {
    if (r < 0.22) return { item: 'Gold', qty: 2, rare: false };
    if (r < 0.46) return { item: 'Sunstone', qty: 1, rare: true };
    if (r < 0.72) return { item: 'Amethyst', qty: 1, rare: false };
    if (r < 0.88) return { item: 'Starsteel', qty: 1, rare: true };
    return { item: 'Star Shard', qty: 1, rare: true };
  }
  if (geode === 'Frozen Geode') {
    if (r < 0.24) return { item: 'Silver', qty: 2, rare: false };
    if (r < 0.52) return { item: 'Moonstone', qty: 1, rare: true };
    if (r < 0.76) return { item: 'Quartz', qty: 1, rare: false };
    if (r < 0.90) return { item: 'Amethyst', qty: 1, rare: true };
    return { item: 'Star Shard', qty: 1, rare: true };
  }
  // Standard Geode
  if (r < 0.28) return { item: 'Copper', qty: 2, rare: false };
  if (r < 0.54) return { item: 'Quartz', qty: 1, rare: false };
  if (r < 0.76) return { item: 'Amethyst', qty: 1, rare: true };
  if (r < 0.92) return { item: 'Sunstone', qty: 1, rare: true };
  return { item: 'Star Shard', qty: 1, rare: true };
}
