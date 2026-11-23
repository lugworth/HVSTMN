import { TILES, INTERIOR_LAYOUTS, INTERIOR_LEGEND, BUILDINGS, STALL_SPOT, pkey } from './constants';
import { PANTRY_SPOT } from './town-life';
import { PASTURE_GATE_SPOT } from './ranch';
import prebuiltMaps from './prebuilt_maps.json';
import { py_rng } from './runtime_helpers';

export class GameMap {
  name: string;
  title: string;
  w: number;
  h: number;
  indoor: boolean;
  t: string[][];
  doors: Record<string, string>;
  warps: Record<string, [string, number, number, [number, number]]>;
  signs: Record<string, string>;
  deco: Record<string, [string, string]>;
  /** Live tile changes laid over the stored grid (the farm's works), read by every `tile()` caller. */
  overlay?: (x: number, y: number, key?: string) => string | undefined;

  constructor(name: string, title: string, w: number, h: number, fill = 'grass', indoor = false) {
    this.name = name;
    this.title = title;
    this.w = w;
    this.h = h;
    this.indoor = indoor;
    this.t = Array.from({ length: h }, () => Array(w).fill(fill));
    this.doors = {};
    this.warps = {};
    this.signs = {};
    this.deco = {};
  }

  inb(x: number, y: number): boolean {
    return x >= 0 && x < this.w && y >= 0 && y < this.h;
  }

  inside(x: number, y: number): boolean {
    return this.inb(x, y);
  }

  set(x: number, y: number, t: string) {
    if (this.inb(x, y)) {
      this.t[y][x] = t;
    }
  }

  /** `key` is the caller's already-built pkey(x, y), so the overlay hook need not rebuild it. */
  tile(x: number, y: number, key?: string): string {
    if (!this.inb(x, y)) return 'void';
    return this.overlay?.(x, y, key) ?? this.t[y][x];
  }

  rect(x: number, y: number, w: number, h: number, t: string) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.set(x + dx, y + dy, t);
      }
    }
  }

  border(t = 'tree') {
    for (let x = 0; x < this.w; x++) {
      this.set(x, 0, t);
      this.set(x, this.h - 1, t);
    }
    for (let y = 0; y < this.h; y++) {
      this.set(0, y, t);
      this.set(this.w - 1, y, t);
    }
  }

  building(x: number, y: number, w: number, h: number, door_dx: number, door_id: string, label?: string, roof_col?: string) {
    this.rect(x, y, w, 2, 'roof');
    if (roof_col) {
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < w; dx++) {
          this.deco[pkey(x + dx, y + dy)] = ['^', roof_col];
        }
      }
    }
    this.rect(x, y + 2, w, h - 2, 'wall');
    const dy = y + h - 1;
    const dx = x + door_dx;
    this.set(dx, dy, 'door');
    this.doors[pkey(dx, dy)] = door_id;
    if (label && w >= label.length + 2) {
      const lx = x + Math.floor((w - label.length) / 2);
      for (let i = 0; i < label.length; i++) {
        this.deco[pkey(lx + i, y + 2)] = [label[i], '07'];
      }
    }
  }

  near(x: number, y: number, kinds: string[], r = 1): boolean {
    const kset = new Set(kinds);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (kset.has(this.tile(x + dx, y + dy))) return true;
      }
    }
    return false;
  }

  static fromPrebuilt(key: 'farm' | 'town' | 'mountain' | 'house'): GameMap {
    const raw = (prebuiltMaps as any)[key];
    const m = new GameMap(raw.name, raw.title, raw.w, raw.h, 'grass', raw.indoor);
    m.t = raw.t.map((r: string[]) => [...r]);
    m.doors = { ...raw.doors };
    m.warps = {};
    for (const [k, v] of Object.entries(raw.warps)) {
      m.warps[k] = v as [string, number, number, [number, number]];
    }
    m.signs = { ...raw.signs };
    m.deco = {};
    for (const [k, v] of Object.entries(raw.deco)) {
      m.deco[k] = v as [string, string];
    }
    return m;
  }
}

// ---------------------------------------------------------------- buildings that moved out of town
// The valley was rearranged so the town keeps its services (shop, inn, clinic, mayor, church,
// library, museum) and the crafts and farms sit out in the countryside. The four buildings drawn
// into the town's prebuilt layout are lifted from it, so they look the same in their new homes.

type Piece = { cells: [number, number, string][]; deco: [number, number, [string, string]][]; doors: [number, number, string][] };

/** Where each relocated building stands in the town's prebuilt drawing: x, y, width, height. */
const TOWN_PLOTS = {
  blacksmith: [16, 2, 11, 5],
  library: [40, 2, 11, 5],
  poultry: [45, 15, 12, 5],
  yodel: [59, 15, 12, 5],
} as const;

/** A building from the town's drawing (roof, walls, door, lettering and door id), relative to its plot. */
function townBuilding(name: keyof typeof TOWN_PLOTS): Piece {
  const src = GameMap.fromPrebuilt('town');
  const [px, py, w, h] = TOWN_PLOTS[name];
  const piece: Piece = { cells: [], deco: [], doors: [] };
  for (let y = py; y < py + h; y++) {
    for (let x = px; x < px + w; x++) {
      const t = src.tile(x, y);
      if (t !== 'roof' && t !== 'wall' && t !== 'door') continue;
      piece.cells.push([x - px, y - py, t]);
      const k = pkey(x, y);
      if (src.deco[k]) piece.deco.push([x - px, y - py, src.deco[k]]);
      if (src.doors[k]) piece.doors.push([x - px, y - py, src.doors[k]]);
    }
  }
  return piece;
}

/** Stand a lifted building with its top-left corner at (x, y). */
function placeBuilding(m: GameMap, piece: Piece, x: number, y: number): void {
  for (const [dx, dy, t] of piece.cells) {
    m.set(x + dx, y + dy, t);
    delete m.deco[pkey(x + dx, y + dy)];
  }
  for (const [dx, dy, d] of piece.deco) m.deco[pkey(x + dx, y + dy)] = d;
  for (const [dx, dy, id] of piece.doors) m.doors[pkey(x + dx, y + dy)] = id;
}

/** Turn a plot back into open ground: tiles, lettering, doors and signs all go. */
function clearPlot(m: GameMap, x: number, y: number, w: number, h: number, tile = 'grass'): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const k = pkey(xx, yy);
      m.set(xx, yy, tile);
      delete m.deco[k];
      delete m.doors[k];
      delete m.signs[k];
    }
  }
}

export function build_farm(): GameMap {
  const m = GameMap.fromPrebuilt('farm');
  // Add Honey & Apple Tree next to Farmhouse
  m.set(7, 6, 'tree');
  m.signs[pkey(7, 6)] = 'honey_tree';
  // Add Doghouse & Horse Stable
  m.set(22, 6, 'doghouse');
  m.signs[pkey(22, 6)] = 'doghouse';
  m.set(24, 6, 'stable');
  m.signs[pkey(24, 6)] = 'stable';
  // Add Water Mill next to Chicken Coop to grind Corn into 30 Chicken Feed
  m.set(35, 6, 'mill');
  m.signs[pkey(35, 6)] = 'mill';
  // a bench on the farmhouse porch (mechanics task 44)
  m.set(9, 6, 'bench');
  // cart-track mouth to the Cedar Hollow gate, with a signpost
  m.rect(30, 22, 3, 4, 'path');
  m.set(29, 24, 'sign');
  m.signs[pkey(29, 24)] = 'Signpost — SOUTH: Cedar Hollow (Feathercote, Highmeadow Dairy, Thornvale Vineyard). EAST: the road to town. WEST: Ironwood Grove.';
  // rotating pasture gate between coop and barn (mechanics task 27)
  m.set(PASTURE_GATE_SPOT[0], PASTURE_GATE_SPOT[1], 'pasture_gate');
  return m;
}

export function build_town(): GameMap {
  const m = GameMap.fromPrebuilt('town');
  // The forge, the poultry farm and Highmeadow Dairy have moved out to the countryside (see
  // build_grove and build_woods), and the library has moved across town.
  for (const plot of Object.values(TOWN_PLOTS)) clearPlot(m, plot[0], plot[1], plot[2], plot[3]);
  // The south-east block is the town's quiet corner: the Library and the Museum side by side.
  placeBuilding(m, townBuilding('library'), 45, 15);
  m.building(61, 15, 8, 5, 4, 'museum', 'MUSEUM', '0C');

  // Town Green, on the north row west of the hill road: a pond ringed with flowers and trees.
  m.rect(21, 3, 8, 2, 'water');
  for (let y = 2; y <= 5; y++) {
    for (let x = 20; x <= 29; x++) if (m.tile(x, y) === 'grass' && layoutNoise(x, y, 7) < 0.55) m.set(x, y, 'flower');
  }
  for (const [x, y] of [[16, 2], [18, 5], [32, 2], [34, 5], [17, 3], [33, 3]]) m.set(x, y, 'tree');
  m.set(25, 6, 'sign');
  m.signs[pkey(25, 6)] = 'Town Green — Sit a while by the pond. The carp bite on a quiet morning.';
  m.set(22, 6, 'bench'); // a bench by the pond (mechanics task 44)
  // A flower garden east of the hill road, where the library used to stand.
  for (let y = 3; y <= 5; y++) {
    for (let x = 41; x <= 49; x++) if ((x + y) % 2 === 0) m.set(x, y, 'flower');
  }
  m.set(40, 2, 'tree');
  m.set(50, 2, 'tree');
  // An orchard on the west side: rows of fruit trees with a walk between them.
  for (const y of [9, 11]) for (let x = 3; x <= 11; x += 2) m.set(x, y, 'tree');
  m.rect(15, 7, 1, 13, 'path'); // the alley between the two streets
  // East Road: from Market Cross straight out to Willow Bend, with a lane up to the main street.
  m.rect(44, 11, 28, 3, 'path');
  m.rect(62, 8, 2, 3, 'path');
  m.set(27, 8, 'sign');
  m.signs[pkey(27, 8)] =
    "Fingerpost — WEST: your farm, and beyond it Ironwood Grove (Hilde's forge). SOUTH OF THE FARM: Cedar Hollow (Feathercote, Highmeadow Dairy, Thornvale Vineyard). EAST: Willow Bend (Hearthfolk). SOUTH: the beach, and Lighthouse Point (Otto & Ferreira).";
  // Add Market Cross Trash Can & Plaza Sign
  m.set(30, 11, 'trash');
  m.signs[pkey(30, 11)] = 'trash';
  m.set(30, 15, 'sign');
  m.signs[pkey(30, 15)] = 'Market Cross — Drop litter in the Trash Can (U) north of the plaza!';
  m.set(42, 10, 'sign');
  m.signs[pkey(42, 10)] = 'request_board';
  // The player's Saturday market stall, on the east side of the square.
  m.set(STALL_SPOT[0], STALL_SPOT[1], 'stall');
  // Community pantry chest by Market Cross (mechanics task 15).
  m.set(PANTRY_SPOT[0], PANTRY_SPOT[1], 'pantry');
  // Add South path & bridge across the river to Brackenford Beach (warp only at the south border y=31!)
  m.rect(35, 21, 3, 7, 'path');
  m.rect(35, 28, 3, 2, 'bridge');
  m.rect(35, 30, 3, 2, 'path');
  // the compass sign stands where the south road leaves the square, not in the far west corner
  const compassText = m.signs[pkey(1, 21)];
  delete m.signs[pkey(1, 21)];
  m.set(1, 21, 'grass');
  m.set(34, 22, 'sign');
  m.signs[pkey(34, 22)] = compassText;
  m.set(33, 24, 'bench');
  m.set(39, 24, 'bench');
  for (const x of [35, 36, 37]) {
    m.warps[pkey(x, m.h - 1)] = ['beach', 32, 2, [0, 1]];
  }
  return m;
}

export function build_mountain(): GameMap {
  const m = GameMap.fromPrebuilt('mountain');
  // Hot Spring pool in SW Beacon Hill (soak to recover Stamina & Fatigue, or toss Egg for Spa-Boiled Egg!)
  m.rect(6, 16, 5, 3, 'spring');
  m.set(5, 17, 'sign');
  m.signs[pkey(5, 17)] = 'Hot Spring — Step in or press X to soak (+Stamina, -Fatigue). Hold an Egg and press X to make a Spa-Boiled Egg!';

  // Wellkeeper Pond waterfall next to Copperseam Mine entrance
  m.rect(45, 8, 3, 2, 'pond');
  m.set(44, 8, 'sign');
  m.signs[pkey(44, 8)] = 'Wellkeeper Pond — Hold an item and press X facing the pond to make an offering to the Wellkeeper!';
  // the lake-side ridge road joins the Skyline Ridge exit to the town spine
  m.rect(25, 7, 11, 1, 'path');
  m.rect(25, 1, 1, 7, 'path');
  m.rect(23, 1, 3, 1, 'path');
  // Copperseam Mine: deep floors west of the pond
  m.set(51, 4, 'sign');
  m.signs[pkey(51, 4)] = 'Copperseam Mine — Step down on floor tiles to delve deeper; each floor holds ore, gems and side chambers. Bring a lamp.';

  // Mirewater Mine island in the middle of Beacon Hill Lake (surrounded by water; freezes in Winter!)
  m.rect(14, 8, 3, 2, 'grass');
  m.set(15, 8, 'cave');
  m.doors[pkey(15, 8)] = 'lakemine';
  m.set(15, 15, 'sign');
  m.signs[pkey(15, 15)] = "Beacon Hill Lake — Freezes over in Winter so you can cross to the Mirewater Mine! (Or toss a Cucumber to summon Reed Heron!)";
  return m;
}

export function build_beach(): GameMap {
  const m = new GameMap('beach', 'Brackenford Beach', 64, 24, 'sand');
  m.border('tree');
  // North exit back to Town
  m.rect(31, 0, 4, 4, 'path');
  for (const x of [31, 32, 33, 34]) {
    m.warps[pkey(x, 0)] = ['town', 36, 30, [0, -1]];
  }
  // Ocean water along bottom
  m.rect(1, 17, 62, 6, 'water');
  m.rect(1, 23, 62, 1, 'water'); // the sea runs off the map edge
  m.rect(63, 17, 1, 6, 'water');
  // Wooden Fishing & Fireworks Pier jutting into the sea
  m.rect(31, 4, 3, 16, 'bridge');
  m.set(30, 12, 'sign');
  m.signs[pkey(30, 12)] = 'Brackenford Beach Pier — Fish in the ocean or watch the Summer 24 Fireworks! Crab pot at pier end: bait with cheapest fish, press X to lower; unbaited is a gamble.';
  // (Otto & Ferreira's house now stands on Lighthouse Point, east along the shore.)
  // Nico's Seaside Lodge
  m.building(42, 5, 10, 5, 5, 'kai_shack', 'SEASIDE', '09');
  m.rect(47, 10, 2, 3, 'path');
  // the shore road links the pier, the lodge stub and the Lighthouse Point exit
  m.rect(34, 11, 29, 3, 'path');
  return m;
}

// ---------------------------------------------------------------- outer regions
// Five original regions spread the valley out around the first four maps:
//   Skyline Ridge (north of Beacon Hill), Willow Bend (east of town),
//   Cedar Hollow (south of the farm), Lighthouse Point (east of the beach)
//   and Ironwood Grove (west of the farm).

/** Deterministic 0..1 noise for laying out a region (same world every game). */
function layoutNoise(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Link two maps through a 3-wide opening: stepping onto `a`'s edge cells lands just inside `b`, and back. */
function link(a: GameMap, b: GameMap, side: 'n' | 's' | 'e' | 'w', at: number, bAt: number): void {
  for (let i = 0; i < 3; i++) {
    const [ax, ay, bx, by] =
      side === 's' ? [at + i, a.h - 1, bAt + i, 0] :
      side === 'n' ? [at + i, 0, bAt + i, b.h - 1] :
      side === 'e' ? [a.w - 1, at + i, 0, bAt + i] :
      [0, at + i, b.w - 1, bAt + i];
    a.set(ax, ay, 'path');
    b.set(bx, by, 'path');
    const inA: [number, number] = side === 's' ? [0, -1] : side === 'n' ? [0, 1] : side === 'e' ? [-1, 0] : [1, 0];
    a.set(ax + inA[0], ay + inA[1], 'path');
    b.set(bx - inA[0], by - inA[1], 'path');
    a.warps[pkey(ax, ay)] = [b.name, bx - inA[0], by - inA[1], [-inA[0], -inA[1]]];
    b.warps[pkey(bx, by)] = [a.name, ax + inA[0], ay + inA[1], inA];
  }
}

/** Cedar Hollow: dense woods south of the farm, a creek with a footbridge and a mossy clearing. */
export function build_woods(): GameMap {
  const m = new GameMap('woods', 'Cedar Hollow', 64, 26, 'grass');
  for (let y = 1; y < m.h - 1; y++) {
    for (let x = 1; x < m.w - 1; x++) if (layoutNoise(x, y, 1) < 0.34) m.set(x, y, 'tree');
  }
  m.border('tree');
  // the creek
  for (let x = 1; x < m.w - 1; x++) {
    const cy = 12 + Math.round(1.5 * Math.sin(x / 5));
    m.rect(x, cy, 1, 2, 'water');
  }
  // a winding trail from the farm gate down to the clearing, on a footbridge over the creek
  for (let y = 0; y < 20; y++) {
    const cx = 31 + Math.round(5 * Math.sin(y / 3.2));
    for (let x = cx - 1; x <= cx + 1; x++) m.set(x, y, m.tile(x, y) === 'water' ? 'bridge' : 'path');
  }
  m.rect(31, 19, 16, 2, 'path');
  // the clearing, with a mossy pond and wildflowers
  m.rect(40, 17, 18, 7, 'grass');
  m.rect(48, 19, 5, 2, 'pond');
  for (let y = 17; y < 24; y++) for (let x = 40; x < 58; x++) if (m.tile(x, y) === 'grass' && layoutNoise(x, y, 2) < 0.08) m.set(x, y, 'flower');
  m.set(50, 18, 'sign');
  m.signs[pkey(50, 18)] = 'Mossy Pond — Folk drop in a gift that grew wild (hold it, face the water, press X) for a lucky day of foraging.';
  m.set(36, 2, 'sign');
  m.signs[pkey(36, 2)] = 'Cedar Hollow — Fallen branches gather here every morning. Bring an Axe! Ranch Lane runs east to the Feathercote and Highmeadow Dairy; the Winery is down by the clearing.';
  // Ranch Lane: a pasture clearing east of the trail, with Rosalind's Feathercote and Highmeadow Dairy
  // side by side and a lane along their doors.
  m.rect(38, 1, 25, 10, 'grass');
  placeBuilding(m, townBuilding('poultry'), 38, 2);
  placeBuilding(m, townBuilding('yodel'), 51, 2);
  m.rect(36, 7, 27, 2, 'path');
  m.set(50, 6, 'tree'); // closes the dead-end alley between Feathercote and the Dairy
  for (let y = 9; y <= 10; y++) for (let x = 38; x <= 62; x++) if (layoutNoise(x, y, 8) < 0.12) m.set(x, y, 'flower');
  // Thornvale Vineyard, south of the creek on the path to the clearing, with a few rows of vines beside it.
  m.building(31, 15, 9, 4, 4, 'winery', 'WINERY', '0E');
  m.rect(41, 15, 5, 2, 'grass');
  for (const x of [41, 43, 45]) for (const y of [15, 16]) m.set(x, y, 'flower');
  return m;
}

/** Skyline Ridge: switchbacks through two cliff bands up to a lookout and a mountain tarn. */
export function build_ridge(): GameMap {
  const m = new GameMap('ridge', 'Skyline Ridge', 64, 26, 'grass');
  for (let y = 1; y < m.h - 1; y++) {
    for (let x = 1; x < m.w - 1; x++) {
      const n = layoutNoise(x, y, 3);
      if (n < 0.12) m.set(x, y, 'tree');
      else if (n > 0.95) m.set(x, y, 'flower');
    }
  }
  m.border('tree');
  // two cliff bands, each with one gap for the trail
  m.rect(1, 16, 62, 2, 'cliff');
  m.rect(1, 8, 62, 2, 'cliff');
  m.rect(49, 16, 3, 2, 'path');
  m.rect(12, 8, 3, 2, 'path');
  // the switchback trail
  m.rect(20, 18, 3, 8, 'path');
  m.rect(20, 18, 32, 2, 'path');
  m.rect(49, 10, 3, 8, 'path');
  m.rect(12, 10, 40, 2, 'path');
  m.rect(12, 3, 3, 7, 'path');
  m.rect(12, 3, 22, 2, 'path');
  // the lookout and a cold tarn
  m.rect(30, 2, 6, 4, 'path');
  m.rect(36, 3, 8, 2, 'path'); // on to the tarn shore
  m.rect(44, 2, 8, 4, 'water');
  m.set(33, 6, 'sign');
  m.signs[pkey(33, 6)] = 'ridge_lookout';
  return m;
}

/** Willow Bend's river: the west edge of its 5-wide channel on row y. */
function riverX(y: number): number {
  return 36 + Math.round(5 * Math.sin(y / 4.5));
}

/** Rows of the old footbridge below the Willow Bend road (the east-bank dock is what's left). */
const FOOTBRIDGE_ROWS = [18, 19, 20, 21];

/** The footbridge sign on the west bank, beside the water on the bridge's first row. */
export const FOOTBRIDGE_SIGN: [number, number] = [riverX(FOOTBRIDGE_ROWS[0]) - 1, FOOTBRIDGE_ROWS[0]];

/** The washed-out water cells west of the dock planks; rebuilding the footbridge turns them to 'bridge'. */
export function footbridge_cells(): [number, number][] {
  return FOOTBRIDGE_ROWS.flatMap((y) => [0, 1, 2, 3].map((dx): [number, number] => [riverX(y) + dx, y]));
}

/** Willow Bend: a slow river east of town with a road bridge, a fishing dock and a meadow. */
export function build_river(): GameMap {
  const m = new GameMap('river', 'Willow Bend', 64, 26, 'grass');
  for (let y = 1; y < m.h - 1; y++) {
    for (let x = 1; x < m.w - 1; x++) {
      const n = layoutNoise(x, y, 4);
      if (n < 0.1) m.set(x, y, 'tree');
      else if (n > 0.93) m.set(x, y, 'flower');
    }
  }
  m.border('tree');
  for (let y = 1; y < m.h - 1; y++) m.rect(riverX(y), y, 5, 1, 'water');
  // the road from town crosses on a bridge
  for (let x = 0; x < m.w - 6; x++) {
    for (let y = 11; y < 14; y++) m.set(x, y, m.tile(x, y) === 'water' ? 'bridge' : 'path');
  }
  // approaches to the footbridge sign and the east-bank dock (dry land only)
  m.rect(30, 14, 1, 5, 'path');
  m.rect(41, 14, 1, 5, 'path');
  m.rect(37, 18, 5, 1, 'path');
  // a fishing dock on the far bank
  for (const y of FOOTBRIDGE_ROWS) {
    m.set(riverX(y) + 4, y, 'bridge');
    m.set(riverX(y) + 5, y, 'path');
  }
  // the dock was once a footbridge: its western planks washed out (task 12, see footbridge_cells)
  const [sx, sy] = FOOTBRIDGE_SIGN;
  m.set(sx, sy, 'sign');
  m.signs[pkey(sx, sy)] = 'footbridge';
  // east-bank sign facing the dock, where the rebuilt planks will land
  const [ex, ey] = [riverX(FOOTBRIDGE_ROWS[3]) + 5, FOOTBRIDGE_ROWS[3]];
  m.set(ex, ey, 'sign');
  m.signs[pkey(ex, ey)] = 'Footbridge — the western planks washed away; ask Ingrid at her workshop to rebuild.';
  // The Hearthfolk' hut, in the meadow on the far bank, just off the road.
  m.building(49, 6, 9, 4, 4, 'sprites', 'SPRITES', '0A');
  m.set(53, 10, 'path');
  m.set(28, 10, 'sign');
  m.signs[pkey(28, 10)] = 'Willow Bend — The river runs slow and deep here. Good fishing off the east-bank dock, and the flat stones skip well (face the river, press X). Footbridge washed out; ask Ingrid.';
  return m;
}

/** Lighthouse Point: a rocky headland east of the beach with tide pools and the old lighthouse. */
export function build_point(): GameMap {
  const m = new GameMap('point', 'Lighthouse Point', 64, 24, 'sand');
  m.border('tree');
  m.rect(1, 17, 62, 6, 'water');
  m.rect(54, 1, 9, 22, 'water');
  // rocks along the shore, and tide pools among them
  for (let y = 1; y < 23; y++) {
    for (let x = 1; x < 63; x++) {
      if (m.tile(x, y) !== 'sand') continue;
      const coast = m.near(x, y, ['water'], 1);
      const n = layoutNoise(x, y, 5);
      if (coast && n < 0.3) m.set(x, y, 'cliff');
      else if (n > 0.975) m.set(x, y, 'pond');
    }
  }
  // the old lighthouse on the headland (closed up: no door)
  m.rect(46, 3, 4, 2, 'roof');
  m.rect(46, 5, 4, 6, 'wall');
  m.deco[pkey(47, 7)] = ['=', '0C'];
  m.rect(1, 11, 52, 3, 'path');
  m.set(45, 10, 'sign');
  m.signs[pkey(45, 10)] = 'lighthouse_log';
  // Otto & Ferreira's house, a short walk along the shore road from the beach.
  m.building(18, 5, 10, 5, 5, 'zack', 'CARRIER', '0D');
  m.rect(23, 10, 2, 1, 'path');
  // the sea runs off the map edge instead of stopping at a treeline
  m.rect(63, 1, 1, 22, 'water');
  m.rect(1, 23, 62, 1, 'water');
  m.rect(0, 17, 1, 6, 'water');
  return m;
}

/** Ironwood Grove: old woodland west of the farm, with Hilde's forge, a worked-out quarry and a still pool. */
export function build_grove(): GameMap {
  const m = new GameMap('grove', 'Ironwood Grove', 64, 26, 'grass');
  for (let y = 1; y < m.h - 1; y++) {
    for (let x = 1; x < m.w - 1; x++) {
      const n = layoutNoise(x, y, 6);
      if (n < 0.27) m.set(x, y, 'tree');
      else if (n > 0.965) m.set(x, y, 'flower');
    }
  }
  m.border('tree');
  // the forge road, in from the farm's west gate and on to the quarry mouth
  m.rect(22, 6, 42, 3, 'path');
  // the old quarry: a bare floor walled by rock, open to the road
  m.rect(5, 3, 17, 8, 'cliff');
  m.rect(6, 4, 15, 6, 'path');
  m.rect(21, 6, 1, 3, 'path');
  // the forge yard, down a track south of the road
  m.rect(28, 9, 3, 9, 'path');
  m.rect(10, 12, 21, 8, 'grass');
  placeBuilding(m, townBuilding('blacksmith'), 13, 12);
  m.rect(11, 17, 20, 2, 'path');
  for (const [x, y] of [[10, 12], [25, 12], [10, 19], [26, 19]]) m.set(x, y, 'tree');
  // a still pool in a glade, down a short path from the road
  m.rect(41, 13, 12, 6, 'grass');
  m.rect(43, 15, 8, 3, 'water');
  m.rect(44, 14, 6, 1, 'water');
  m.rect(46, 9, 2, 5, 'path');
  m.set(59, 5, 'sign');
  m.signs[pkey(59, 5)] = "Ironwood Grove — Hilde's forge is down the track to the south-west. The old quarry lies at the end of the road, and there is quiet fishing at the pool.";
  m.set(23, 5, 'sign');
  m.signs[pkey(23, 5)] = 'Old Quarry — Worked out long ago. Folk still turn up odd things in the ground around here.';
  return m;
}

/**
 * Close off open ground the player can never reach from the map's exits (pockets walled in by
 * trees, cliffs or water), so nothing spawns there: grass grows over into trees, sand into rocks.
 */
function sealUnreachable(m: GameMap): void {
  const open = (x: number, y: number) => m.inside(x, y) && !!TILES[m.tile(x, y)]?.[3];
  const seen = new Set<string>();
  const queue = Object.keys(m.warps).map((k) => k.split(',').map(Number) as [number, number]);
  while (queue.length) {
    const [x, y] = queue.pop()!;
    const k = pkey(x, y);
    if (seen.has(k) || !open(x, y)) continue;
    seen.add(k);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      const t = m.tile(x, y);
      if (seen.has(pkey(x, y)) || !open(x, y)) continue;
      if (t === 'grass' || t === 'flower') m.set(x, y, 'tree');
      else if (t === 'sand') m.set(x, y, 'cliff');
    }
  }
}

/** Open the edges between the first four maps and the outer regions. */
export function link_regions(maps: Record<string, GameMap>): void {
  link(maps.farm, maps.woods, 's', 30, 30);
  link(maps.mountain, maps.ridge, 'n', 20, 20);
  link(maps.town, maps.river, 'e', 11, 11);
  link(maps.beach, maps.point, 'e', 11, 11);
  link(maps.grove, maps.farm, 'e', 6, 6);
  for (const name of ['woods', 'ridge', 'river', 'point', 'grove']) sealUnreachable(maps[name]);
}

// ---------------------------------------------------------------- wayfinding signs
const open = (m: GameMap, x: number, y: number) => m.inside(x, y) && !!TILES[m.tile(x, y)]?.[3];
const STEPS4: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Steps from `from` to every cell reachable on foot (doors count as reachable, not passable). */
function walkSteps(m: GameMap, from: [number, number]): Map<string, number> {
  const d = new Map<string, number>([[pkey(...from), 0]]);
  let frontier = [from];
  for (let n = 1; frontier.length; n++) {
    const next: [number, number][] = [];
    for (const [x, y] of frontier) {
      for (const [dx, dy] of STEPS4) {
        const [nx, ny] = [x + dx, y + dy];
        const k = pkey(nx, ny);
        if (d.has(k)) continue;
        if (k in m.doors) d.set(k, n);
        else if (open(m, nx, ny)) {
          d.set(k, n);
          next.push([nx, ny]);
        }
      }
    }
    frontier = next;
  }
  return d;
}

/** How many open cells can be walked to from the map's entrances. */
function reachableCells(m: GameMap): number {
  const seen = new Set<string>();
  for (const k of Object.keys(m.warps)) {
    if (seen.has(k)) continue;
    for (const c of walkSteps(m, k.split(',').map(Number) as [number, number]).keys()) seen.add(c);
  }
  return seen.size;
}

const compass = (dx: number, dy: number): string =>
  Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'east' : 'west') : dy >= 0 ? 'south' : 'north';

/** The map's entrances: its edge warps grouped by where they lead, with the cell just inside. */
export function edgeEntrances(m: GameMap): { to: string; mid: [number, number]; inward: [number, number] }[] {
  const groups = new Map<string, [number, number][]>();
  for (const [k, [to]] of Object.entries(m.warps)) {
    const cell = k.split(',').map(Number) as [number, number];
    const [x, y] = cell;
    if (x > 0 && x < m.w - 1 && y > 0 && y < m.h - 1) continue;
    if (!groups.has(to)) groups.set(to, []);
    groups.get(to)!.push(cell);
  }
  return [...groups.entries()].map(([to, cells]) => {
    cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const mid = cells[Math.floor(cells.length / 2)];
    const inward: [number, number] =
      mid[0] === 0 ? [1, 0] : mid[0] === m.w - 1 ? [-1, 0] : mid[1] === 0 ? [0, 1] : [0, -1];
    return { to, mid, inward };
  });
}

/**
 * Where an entrance's sign goes: beside the path a few steps in, on plain ground, never on the
 * path itself and never where it would wall anything off. Null if there is no such spot.
 */
function signSpot(m: GameMap, mid: [number, number], inward: [number, number]): [number, number] | null {
  const side: [number, number] = [Math.abs(inward[1]), Math.abs(inward[0])];
  const before = reachableCells(m);
  for (const depth of [2, 3, 4, 5, 1]) {
    for (const off of [2, -2, 3, -3, 4, -4, 1, -1]) {
      const x = mid[0] + inward[0] * depth + side[0] * off;
      const y = mid[1] + inward[1] * depth + side[1] * off;
      const k = pkey(x, y);
      if (!m.inside(x, y) || !['grass', 'field', 'sand'].includes(m.tile(x, y))) continue;
      if (k in m.warps || k in m.doors || k in m.signs) continue;
      // something must already be in view of the path: a sign standing out in a meadow is noise
      if (!STEPS4.some(([dx, dy]) => m.tile(x + dx, y + dy) === 'path')) continue;
      const was = m.tile(x, y);
      m.set(x, y, 'sign');
      if (reachableCells(m) === before - 1) return [x, y];
      m.set(x, y, was);
    }
  }
  return null;
}

const PLACE_NAMES: Record<string, string> = { mine: 'Copperseam Mine', lakemine: 'Mirewater Mine (across the ice in Winter)' };

/**
 * Wayfinding: at each way into a region (the farm excepted), a sign beside the path says what
 * is here, which way and how many steps, and where the other paths lead. Generated from the
 * map, so it stays right when buildings or paths move.
 */
export function add_wayfinding_signs(maps: Record<string, GameMap>, names: Record<string, string>): void {
  for (const [name, m] of Object.entries(maps)) {
    if (name === 'farm' || m.indoor) continue;
    const ways = edgeEntrances(m);
    for (const { to, mid, inward } of ways) {
      const spot = signSpot(m, mid, inward);
      if (!spot) continue;
      const steps = walkSteps(m, spot);
      const here = Object.entries(m.doors)
        .map(([k, id]) => {
          const [x, y] = k.split(',').map(Number);
          return { label: PLACE_NAMES[id] ?? names[id] ?? id, n: steps.get(k), dir: compass(x - spot[0], y - spot[1]) };
        })
        .filter((p) => p.n !== undefined && !p.label.includes('_'))
        .sort((a, b) => a.n! - b.n!);
      // the nearest few: a sign is read in passing, and the rest are a short walk further
      const near = here.slice(0, 3).map((p) => `${p.label} ${p.dir}, ${p.n} steps`);
      if (here.length > 3) near.push(`${here.length - 3} more further in`);
      const onward = ways
        .filter((w) => w.to !== to && maps[w.to])
        .map((w) => `${compass(-w.inward[0], -w.inward[1])} to ${maps[w.to].title}`);
      const back = `${compass(-inward[0], -inward[1])} back to ${maps[to]?.title ?? 'the valley'}`;
      const what = near.length ? near.join(' · ') : 'Open country: forage and quiet';
      m.signs[pkey(...spot)] = `${m.title} — ${what}. Paths: ${[...onward, back].join(', ')}.`;
    }
  }
}

/** Every outdoor map, built and joined: a fresh valley with no shortcuts opened. */
export function build_valley(): Record<string, GameMap> {
  const maps: Record<string, GameMap> = {
    farm: build_farm(),
    town: build_town(),
    mountain: build_mountain(),
    beach: build_beach(),
    woods: build_woods(),
    ridge: build_ridge(),
    river: build_river(),
    point: build_point(),
    grove: build_grove(),
  };
  link_regions(maps);
  add_hedge_gate_signs(maps);
  add_wayfinding_signs(maps, BUILDINGS);
  return maps;
}

/**
 * Task 34: an old field gate in the hedge between Cedar Hollow's clearing (east edge, rows 18-20)
 * and Brackenford Beach (west edge, rows 7-9). It is latched on the beach side; the signs stand just
 * north of it, clear of the cells the opening carves.
 */
export const HEDGE_GATE = { at: 18, bAt: 7, woodsSign: [61, 17], beachSign: [0, 6] } as const;
const HEDGE_SHUT = 'An old field gate in the hedge, grown over with briar. It is latched fast from the other side.';

function add_hedge_gate_signs(maps: Record<string, GameMap>): void {
  const [[wx, wy], [bx, by]] = [HEDGE_GATE.woodsSign, HEDGE_GATE.beachSign];
  maps.woods.set(wx, wy, 'sign');
  maps.woods.signs[pkey(wx, wy)] = HEDGE_SHUT;
  maps.beach.set(bx, by, 'sign');
  maps.beach.signs[pkey(bx, by)] = 'hedge_latch';
}

function open_hedge_gate(maps: Record<string, GameMap>): void {
  link(maps.woods, maps.beach, 'e', HEDGE_GATE.at, HEDGE_GATE.bAt);
  maps.woods.signs[pkey(...HEDGE_GATE.woodsSign)] = 'Hedge gate — the short way to Brackenford Beach';
  maps.beach.signs[pkey(...HEDGE_GATE.beachSign)] = 'Hedge gate — the short way to Cedar Hollow';
}

/** Shortcuts the player can open for good (saved by id in Game.shortcuts). */
const SHORTCUTS: Record<string, (maps: Record<string, GameMap>) => void> = { hollow_gate: open_hedge_gate };
export const SHORTCUT_IDS = Object.keys(SHORTCUTS);

/** Carve an earned shortcut into the built maps (safe to repeat). */
export function open_shortcut(maps: Record<string, GameMap>, id: string): void {
  SHORTCUTS[id]?.(maps);
}

export function build_house(): GameMap {
  const m = GameMap.fromPrebuilt('house');
  m.set(13, 8, 'stamp_bench');
  return m;
}

export function build_mine(floor: number, objs: Record<string, Record<string, string>>, mineType: 'spring' | 'lake' = 'spring'): GameMap {
  const titlePrefix = mineType === 'lake' ? 'Mirewater Mine' : 'Copperseam Mine';
  const m = new GameMap('mine', `${titlePrefix} B${floor}F`, 25, 15, 'mfloor', true);
  m.border('mwall');
  const rng = py_rng();
  for (let i = 0; i < 18; i++) {
    const x = rng.randint(2, m.w - 3);
    const y = rng.randint(2, m.h - 3);
    m.set(x, y, 'mwall');
  }
  const [ux, uy] = [3, 2];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (m.inb(ux + dx, uy + dy)) {
        m.set(ux + dx, uy + dy, 'mfloor');
      }
    }
  }
  m.set(ux, uy, 'up');

  // Mirewater Mine Floor 9 has an underground pond where the Coelacanth King Fish lives!
  if (mineType === 'lake' && floor === 9) {
    m.rect(10, 5, 5, 4, 'water');
  }

  let [dx, dy] = [m.w - 4, m.h - 3];
  for (let tries = 0; tries < 50; tries++) {
    const tx = rng.randint(4, m.w - 3);
    const ty = rng.randint(3, m.h - 3);
    if (m.tile(tx, ty) === 'mfloor' && Math.abs(tx - ux) + Math.abs(ty - uy) > 6) {
      dx = tx;
      dy = ty;
      break;
    }
  }
  if (floor < 255) {
    m.set(dx, dy, 'down');
  }

  const mobjs: Record<string, string> = {};
  if (floor < 255) {
    mobjs[pkey(dx, dy)] = 'rock';
  }
  const nrocks = Math.min(45, 22 + Math.floor(floor / 5));
  for (let i = 0; i < nrocks; i++) {
    const x = rng.randint(2, m.w - 3);
    const y = rng.randint(2, m.h - 3);
    if (m.tile(x, y) === 'mfloor' && !(x === ux && y === uy)) {
      mobjs[pkey(x, y)] = 'rock';
    }
  }
  objs['mine'] = mobjs;
  return m;
}

export function build_interior(bid: string, exit_to: [string, number, number]): [GameMap, [number, number], Record<string, [number, number]>] {
  const rows = INTERIOR_LAYOUTS[bid];
  const h = rows.length;
  const w = rows[0].length;
  const m = new GameMap(`in_${bid}`, BUILDINGS[bid], w, h, 'floor', true);
  const spots: Record<string, [number, number]> = {};
  let entry: [number, number] = [Math.floor(w / 2), h - 2];

  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      if (ch === 'D') {
        m.set(x, y, 'exit');
        m.warps[pkey(x, y)] = [exit_to[0], exit_to[1], exit_to[2], [0, 1]];
        entry = [x, y - 1];
      } else if (ch === 'k' || (ch >= '1' && ch <= '9')) {
        spots[ch] = [x, y];
      } else if (INTERIOR_LEGEND[ch]) {
        const [tile, glyph, col] = INTERIOR_LEGEND[ch];
        m.set(x, y, tile);
        if (glyph && col) {
          m.deco[pkey(x, y)] = [glyph, col];
        }
      }
    }
  }

  // Add Inn Telephone on the counter of Gideon's Inn for Saturday TV Shopping orders!
  if (bid === 'inn') {
    m.set(14, 2, 'phone');
    m.signs[pkey(14, 2)] = 'inn_phone';
  }

  return [m, entry, spots];
}

export function build_house_upgraded(flags: Set<string> | string[]): GameMap {
  const fset = new Set(flags);
  const ext = fset.has('Extension');
  const m = new GameMap('house', 'Your Farmhouse', ext ? 22 : 16, 10, 'floor', true);
  m.border('iwall');
  m.set(1, 1, 'bed');
  m.set(2, 1, 'bed');
  if (fset.has('Big Bed')) {
    m.set(3, 1, 'bed');
  }
  m.set(5, 1, 'tv');
  m.set(8, 1, 'cal');
  m.set(12, 1, 'bin');
  // the mantel for festival souvenirs and keepsakes (mechanics task 45)
  m.set(14, 1, 'mantel');
  // indoor winter hobby stamp-printing bench (mechanics task 48)
  m.set(13, 8, 'stamp_bench');
  m.rect(3, 4, 3, 2, 'table');
  // Flower Vase on the table
  m.set(3, 4, 'vase');
  if (fset.has('Kitchen')) {
    m.set(10, 1, 'kitchen');
    m.set(11, 1, 'kitchen');
  }
  if (ext) {
    for (let y = 1; y < 9; y++) {
      if (y !== 4 && y !== 5) {
        m.set(15, y, 'iwall');
      }
    }
    m.set(17, 1, 'shelf');
    m.set(18, 1, 'shelf');
    m.rect(17, 5, 2, 2, 'table');
    if (fset.has('Bathroom')) {
      m.set(20, 1, 'bath');
      m.set(19, 1, 'fireplace');
    }
  }
  m.set(7, 9, 'exit');
  m.doors[pkey(7, 9)] = 'house_out';
  m.warps[pkey(7, 9)] = ['farm', 8, 6, [0, 1]];
  return m;
}

