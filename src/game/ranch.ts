// Ranching systems for GLADE:
// Task 25 (Animal personalities), Task 26 + G8 (Coat colors, genetics & family records),
// Task 27 (Rotating pasture), Task 28 (Animal enrichment), G15 (Multiple pets: Farm Cat & pet gifts).

// ---------------------------------------------------------------- Task 25: Animal personalities
export type AnimalPersonality = 'timid' | 'curious' | 'calm' | 'playful';

export const PERSONALITIES: readonly AnimalPersonality[] = ['timid', 'curious', 'calm', 'playful'];

export const PERSONALITY_NOTES: Record<AnimalPersonality, { chicken: string; livestock: string; talk: string }> = {
  timid: {
    chicken: 'hugs close to the coop doorway',
    livestock: 'stays gently near the barn wall',
    talk: 'blinks shyly, then leans into your hand.',
  },
  curious: {
    chicken: 'pecks right up to the fence line',
    livestock: 'trots over to greet you at the pasture gate',
    talk: 'sniffs your sleeves eagerly for treats!',
  },
  calm: {
    chicken: 'preens steadily in the warm sun',
    livestock: 'chews cud peacefully in the middle of the meadow',
    talk: 'lets out a long, contented sigh.',
  },
  playful: {
    chicken: 'flutters in short hops across the yard',
    livestock: 'kicks up its heels in a lively trot',
    talk: 'bounces excitedly and nudges your shoulder!',
  },
};

export function pickPersonality(seed: number): AnimalPersonality {
  return PERSONALITIES[Math.abs(seed) % PERSONALITIES.length];
}

// ---------------------------------------------------------------- Task 26 & G8: Coat colors & family records
export interface CoatVariant {
  id: string;
  label: string;
  col: string; // base16 Isotope code
  rare: boolean;
  festBonus: number;
}

export const COW_COATS: readonly CoatVariant[] = [
  { id: 'classic', label: 'Classic Pied', col: '07', rare: false, festBonus: 0 },
  { id: 'spotted', label: 'Dappled Meadow', col: '05', rare: false, festBonus: 0 },
  { id: 'honey', label: 'Honey Jersey', col: '09', rare: false, festBonus: 4 },
  { id: 'midnight', label: 'Midnight Belted', col: '0D', rare: true, festBonus: 10 },
  { id: 'starlight', label: 'Starlight Roan', col: '0C', rare: true, festBonus: 15 },
];

export const SHEEP_COATS: readonly CoatVariant[] = [
  { id: 'ivory', label: 'Ivory Fleece', col: '07', rare: false, festBonus: 0 },
  { id: 'speckled', label: 'Speckled Downs', col: '05', rare: false, festBonus: 0 },
  { id: 'cinnamon', label: 'Cinnamon Wool', col: '09', rare: false, festBonus: 4 },
  { id: 'charcoal', label: 'Charcoal Heather', col: '04', rare: true, festBonus: 10 },
  { id: 'moonfleece', label: 'Moonfleece', col: '0E', rare: true, festBonus: 15 },
];

export function coatListFor(kind: string): readonly CoatVariant[] {
  return kind === 'sheep' ? SHEEP_COATS : COW_COATS;
}

export function coatInfo(kind: string, coatId?: string): CoatVariant {
  const list = coatListFor(kind);
  return list.find((c) => c.id === coatId) || list[0];
}

/** Deterministic coat inheritance with a chance to mutate into a rare coat variant. */
export function breedCoat(kind: string, parentCoat: string | undefined, sireCoat: string | undefined, roll: number): string {
  const list = coatListFor(kind);
  const p1 = coatInfo(kind, parentCoat);
  const p2 = sireCoat ? coatInfo(kind, sireCoat) : list[Math.floor(roll * 3) % 3];
  const rares = list.filter((c) => c.rare);
  const rareChance = p1.rare || p2.rare ? 0.45 : p1.id !== p2.id ? 0.25 : 0.12;
  if (roll < rareChance && rares.length) {
    return rares[Math.floor((roll / rareChance) * rares.length) % rares.length].id;
  }
  return roll < 0.65 ? p1.id : p2.id;
}

export function ensureAnimalRecord(a: any, idx: number, fallbackDay: number): any {
  const kind = a.kind === 'sheep' ? 'sheep' : 'cow';
  const list = coatListFor(kind);
  if (!a.personality || !PERSONALITIES.includes(a.personality)) {
    a.personality = pickPersonality(idx + (a.name ? a.name.charCodeAt(0) : 0));
  }
  if (!a.coat || !list.some((c) => c.id === a.coat)) {
    a.coat = list[idx % 3].id;
  }
  if (!Number.isInteger(a.bornDay) || a.bornDay < 0) {
    a.bornDay = Math.max(0, fallbackDay);
  }
  if (!Array.isArray(a.parents)) {
    a.parents = ['Highmeadow Herd', null];
  }
  return a;
}

/** Observable grazing position on the farm yard based on personality & enrichment. */
export function animalYardSpot(
  kind: 'chicken' | 'cow' | 'sheep',
  personality: AnimalPersonality,
  index: number,
  tick: number,
  enrichment: { perch: boolean; shadeTree: boolean },
  playerPos?: [number, number],
): [number, number] {
  if (kind === 'chicken') {
    if (enrichment.perch && index === 0) return [17, 7]; // right by the cedar perch (17, 8)
    if (personality === 'timid') return [18 + (index % 2), 7]; // hugs coop door
    if (personality === 'curious') return [20 + ((index + tick) % 3), 8]; // near gate/path
    if (personality === 'playful') return [17 + ((index * 2 + tick) % 6), 7 + (tick % 2)];
    return [18 + (index % 4), 8];
  }
  if (enrichment.shadeTree && (index === 0 || personality === 'calm')) {
    return [33 + (index % 2), 7]; // shaded beside the shade tree (34, 8)
  }
  if (personality === 'curious') {
    // Curious cows/sheep wander up near the pasture gate (27, 8) or toward the player
    const nearGateX = playerPos && Math.abs(playerPos[0] - 28) <= 4 ? 28 : 28 + (tick % 2);
    return [nearGateX, 7];
  }
  if (personality === 'timid') return [30 + (index % 3), 7];
  if (personality === 'playful') return [28 + ((index * 3 + tick) % 8), 7 + ((index + tick) % 2)];
  return [29 + (index % 5), 8];
}

// ---------------------------------------------------------------- Task 27: Rotating pasture
export const PASTURE_GATE_SPOT: readonly [number, number] = [27, 8];
export const PASTURE_GRAZE_COST = 20;
export const PASTURE_REGROW_WARM = 30;
export const PASTURE_REGROW_WINTER = 10;

export interface PastureState {
  active: 'west' | 'east';
  west: number;
  east: number;
  grazedDay: number;
}

export const emptyPastureState = (): PastureState => ({
  active: 'west',
  west: 100,
  east: 100,
  grazedDay: -1,
});

export function sanitizePastureState(raw: unknown): PastureState {
  const base = emptyPastureState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<PastureState>;
  base.active = r.active === 'east' ? 'east' : 'west';
  if (typeof r.west === 'number' && Number.isFinite(r.west)) base.west = Math.max(0, Math.min(100, Math.round(r.west)));
  if (typeof r.east === 'number' && Number.isFinite(r.east)) base.east = Math.max(0, Math.min(100, Math.round(r.east)));
  if (Number.isInteger(r.grazedDay)) base.grazedDay = r.grazedDay as number;
  return base;
}

export function pastureMorning(state: PastureState, season: number): string | null {
  const resting = state.active === 'west' ? 'east' : 'west';
  const gain = season === 3 ? PASTURE_REGROW_WINTER : PASTURE_REGROW_WARM;
  const before = state[resting];
  state[resting] = Math.min(100, state[resting] + gain);
  if (before < 100 && state[resting] === 100) {
    return `The resting ${resting === 'west' ? 'West' : 'East'} Meadow has regrown to 100% grass.`;
  }
  return null;
}

// ---------------------------------------------------------------- Task 28: Animal enrichment
export const PERCH_SPOT: readonly [number, number] = [17, 8];
export const SHADE_TREE_SPOT: readonly [number, number] = [34, 8];
export const PERCH_COST = { gold: 200, lumber: 4 };
export const SHADE_TREE_COST = { gold: 300, lumber: 6 };

export interface EnrichmentState {
  perch: boolean;
  shadeTree: boolean;
}

export const emptyEnrichmentState = (): EnrichmentState => ({ perch: false, shadeTree: false });

export function sanitizeEnrichmentState(raw: unknown): EnrichmentState {
  if (!raw || typeof raw !== 'object') return emptyEnrichmentState();
  const r = raw as Partial<EnrichmentState>;
  return { perch: r.perch === true, shadeTree: r.shadeTree === true };
}

// ---------------------------------------------------------------- G15: Multiple pets (Farm Cat) & morning pet gifts
export const CAT_SPOT: readonly [number, number] = [20, 6];
export const CAT_UNLOCK_DOG_AFF = 60;

export interface PetExtrasState {
  cat: boolean;
  catName: string;
  catAff: number;
  bowlGift: string | null;
  catClue: string | null;
}

export const emptyPetExtras = (): PetExtrasState => ({
  cat: false,
  catName: 'Mallow',
  catAff: 25,
  bowlGift: null,
  catClue: null,
});

export function sanitizePetExtras(raw: unknown): PetExtrasState {
  const base = emptyPetExtras();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<PetExtrasState>;
  base.cat = r.cat === true;
  if (typeof r.catName === 'string' && r.catName.trim()) base.catName = r.catName.trim().slice(0, 12);
  if (typeof r.catAff === 'number' && Number.isFinite(r.catAff)) base.catAff = Math.max(0, Math.min(100, Math.round(r.catAff)));
  if (typeof r.bowlGift === 'string' && r.bowlGift.trim()) base.bowlGift = r.bowlGift;
  if (typeof r.catClue === 'string' && r.catClue.trim()) base.catClue = r.catClue.slice(0, 120);
  return base;
}

export const PET_GIFT_POOLS: Record<number, readonly string[]> = {
  0: ['Bamboo Shoot', 'Medicinal Herb', 'Duskbell Flower', 'Honey'],
  1: ['Wild Grape', 'Bluewort', 'Rosecap Flower', 'Small Fish'],
  2: ['Mushroom', 'Chestnut', 'Truffle', 'Apple'],
  3: ['Frostwort', 'Small Fish', 'Copper', 'Honey'],
};

export function rollPetGift(season: number, absday: number): string {
  const pool = PET_GIFT_POOLS[season] || PET_GIFT_POOLS[0];
  return pool[absday % pool.length];
}
