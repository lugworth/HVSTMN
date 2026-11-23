const pkey = (x: number, y: number) => `${x},${y}`;

export const HYBRIDS = [
  { crop: 'Rose Turnip', parents: ['Turnip', 'Potato'], season: 'Spring', dish: 'Rose Slaw', grow: 5, value: 90, color: '0E' },
  { crop: 'Sunstripe', parents: ['Tomato', 'Corn'], season: 'Summer', dish: 'Sunstripe Salad', grow: 7, value: 105, color: '0A' },
  { crop: 'Amber Root', parents: ['Carrot', 'Sweet Potato'], season: 'Fall', dish: 'Amber Mash', grow: 6, value: 100, color: '09' },
  { crop: 'Snowheart', parents: ['Cabbage', 'Green Pepper'], season: 'Winter', dish: 'Snowheart Relish', grow: 7, value: 130, color: '0C' },
] as const;

/** Silas's fee to re-cross a hybrid once every seed, plant and harvest of it is gone. */
export const HYBRID_RECROSS_FEE = 200;
export const HYBRID_CROPS = new Set<string>(HYBRIDS.map((h) => h.crop));
export const ORCHARD_SPOTS = ['45,6', '47,6', '49,6'];
export const SAPLING = 'Orchard Sapling';
export const SAPLING_PRICE = 350;
export const TREE_DAYS = 16;
export const FRUIT_DAYS = [5, 15, 25]; // Fall only; ripe fruit keeps until winter.
export const BARREL_SPOT = [60, 8] as const;
export const CHANNEL_CELLS = Array.from({ length: 6 }, (_, i) => pkey(60, 9 + i));
export const BARREL_CAP = 3;
export const CHANNEL_COST = { gold: 250, lumber: 6 };
export const GLASS_SPOT = [42, 8] as const;
export const GLASS_CELLS = Array.from({ length: 3 }, (_, y) => Array.from({ length: 4 }, (_, x) => pkey(40 + x, 9 + y))).flat();
export const GLASS_COST = { gold: 2500, lumber: 20 };
export const PIECE_LIMIT = 80;

export const FARM_PIECES = {
  'Farm Path': { tile: 'farm_path', glyph: '·', color: '04', walk: true, price: 25, info: 'Walkable paving for open farm soil.' },
  'Farm Lamp': { tile: 'farm_lamp', glyph: '†', color: '0A', walk: false, price: 125, info: 'Lights a small pool after dusk.' },
  'Farm Bench': { tile: 'farm_bench', glyph: '╥', color: '09', walk: false, price: 100, info: 'A place to sit by the fields.' },
  'Farm Fence': { tile: 'farm_fence', glyph: '╪', color: '04', walk: false, price: 50, info: 'A short, solid fence panel. Leave a gate!' },
  'Sprinkler': { tile: 'farm_sprinkler', glyph: '¤', color: '0C', walk: false, price: 900, info: 'Waters the four touching soil tiles each morning.' },
  'Scarecrow': { tile: 'farm_scarecrow', glyph: '‡', color: '09', walk: false, price: 500, info: 'Its windbreak protects the eight touching tiles from typhoons.' },
  'Auto-Feeder': { tile: 'farm_feeder', glyph: '▣', color: '0B', walk: false, price: 1800, info: 'At dawn uses Chicken Feed and Fodder from your bag to fill empty troughs. One per farm.' },
} as const;

export const FARM_USE_TILES = ['orchard_tree', 'rain_barrel', 'greenhouse_frame', ...Object.values(FARM_PIECES).map((p) => p.tile)];

export type FarmPiece = keyof typeof FARM_PIECES;
export const FARM_PIECE_NAMES = Object.keys(FARM_PIECES) as FarmPiece[];
export function isFarmPiece(value: unknown): value is FarmPiece {
  return typeof value === 'string' && Object.hasOwn(FARM_PIECES, value);
}

export interface FarmWorks {
  hybrids: string[];
  orchard: Record<string, { planted: number; picked: number }>;
  channel: boolean;
  water: number;
  greenhouse: boolean;
  pieces: Record<string, FarmPiece>;
}

export const emptyFarmWorks = (): FarmWorks => ({ hybrids: [], orchard: {}, channel: false, water: 0, greenhouse: false, pieces: {} });

export function restoreFarmWorks(raw: unknown, canPlace: (key: string, piece: FarmPiece) => boolean, today: number): FarmWorks {
  const state = emptyFarmWorks();
  if (!raw || typeof raw !== 'object') return state;
  const data = raw as Partial<FarmWorks>;
  state.hybrids = HYBRIDS.filter((h) => Array.isArray(data.hybrids) && data.hybrids.includes(h.crop)).map((h) => h.crop);
  if (data.orchard && typeof data.orchard === 'object') {
    for (const key of ORCHARD_SPOTS) {
      const tree = data.orchard[key];
      if (!tree || !Number.isSafeInteger(tree.planted) || tree.planted < 0 || tree.planted > today) continue;
      const picked = Number.isSafeInteger(tree.picked) && tree.picked >= 0 && tree.picked <= today ? tree.picked : -1;
      state.orchard[key] = { planted: tree.planted, picked };
    }
  }
  state.channel = data.channel === true;
  state.greenhouse = data.greenhouse === true;
  if (state.channel && typeof data.water === 'number' && Number.isSafeInteger(data.water)) state.water = Math.max(0, Math.min(BARREL_CAP, data.water));
  if (data.pieces && typeof data.pieces === 'object') {
    let feeder = false;
    for (const [key, piece] of Object.entries(data.pieces)) {
      if (Object.keys(state.pieces).length >= PIECE_LIMIT) break;
      if (isFarmPiece(piece) && !(feeder && piece === 'Auto-Feeder') && canPlace(key, piece)) {
        state.pieces[key] = piece;
        feeder ||= piece === 'Auto-Feeder';
      }
    }
  }
  return state;
}

export function fixtureCoverage(key: string, diagonals: boolean): string[] {
  const [x, y] = key.split(',').map(Number);
  const out = [pkey(x + 1, y), pkey(x - 1, y), pkey(x, y + 1), pkey(x, y - 1)];
  if (diagonals) out.push(pkey(x + 1, y + 1), pkey(x - 1, y + 1), pkey(x + 1, y - 1), pkey(x - 1, y - 1));
  return out;
}

