// Town life systems for FURROW:
// Task 11 (Guest vendors who become regulars), Task 13 + G10 (Festival roles & yearly variants),
// Task 15 (Community pantry), Task 36 (People you meet along the trail), G16 (Otto shipping contracts).

// ---------------------------------------------------------------- Task 11: Guest vendors who become regulars
export const GUEST_VENDOR_SPOT: readonly [number, number] = [31, 16];

export interface GuestVendorDef {
  id: 'bram' | 'maren';
  name: string;
  title: string;
  glyph: string;
  col: string;
  guestWeekday: number; // 0=Mon..6=Sun
  guestParity: 0 | 1; // week % 2
  regularDays: readonly number[];
  hours: readonly [number, number];
  stock: readonly { item: string; price: number; limit: number; desc: string }[];
  greeting: string;
  regularGreeting: string;
  unlockHint: string;
}

export const GUEST_VENDORS: readonly GuestVendorDef[] = [
  {
    id: 'bram',
    name: 'Bram',
    title: "Bram's Traveling Seed Cart",
    glyph: 'B',
    col: '0B',
    guestWeekday: 2, // Wednesday
    guestParity: 0,
    regularDays: [2, 5], // Wednesday & Saturday once regular
    hours: [9, 17],
    stock: [
      { item: 'Duskbell Flower Seeds', price: 240, limit: 10, desc: 'Blooms beside cucumbers for bonus harvests.' },
      { item: 'Rosecap Flower Seeds', price: 250, limit: 10, desc: 'Fragrant blossoms for seasonal honey.' },
      { item: 'Cabbage Seeds', price: 420, limit: 10, desc: 'Hard-to-find spring brassica.' },
      { item: 'Sweet Potato Seeds', price: 260, limit: 10, desc: 'Fast autumn regrowth crop.' },
      { item: 'Compost', price: 80, limit: 10, desc: 'Rich leaf-mold dressing (+1 next harvest).' },
    ],
    greeting: 'Passing through Brackenford with a cart of heirloom packets! Make a lively Saturday market and I might set up weekly.',
    regularGreeting: 'Your Saturday stall put Market Cross on the map! I’m a regular here every Wednesday and Saturday now.',
    unlockHint: 'Earn 500G total at the Saturday stall to make Bram a weekly regular.',
  },
  {
    id: 'maren',
    name: 'Maren',
    title: "Maren's Traveling Joinery",
    glyph: 'M',
    col: '09',
    guestWeekday: 0, // Monday
    guestParity: 1,
    regularDays: [0, 3], // Monday & Thursday once regular
    hours: [9, 17],
    stock: [
      { item: 'Lumber', price: 38, limit: 30, desc: 'Seasoned timber at traveling-cart prices.' },
      { item: 'Farm Lamp', price: 100, limit: 8, desc: 'Hand-forged post lantern for your fields.' },
      { item: 'Farm Bench', price: 80, limit: 6, desc: 'Cedar bench for a quiet rest.' },
      { item: 'Farm Fence', price: 40, limit: 12, desc: 'Mortised fence panel.' },
      { item: 'Scarecrow', price: 420, limit: 4, desc: 'Sturdy windbreak against typhoons.' },
    ],
    greeting: 'Maren, traveling woodwright! If the village finishes a real public project, I’d gladly make Brackenford a regular stop.',
    regularGreeting: 'That rebuilt Willow Bend footbridge convinced me — Brackenford builds to last! Find me here Mondays and Thursdays.',
    unlockHint: 'Complete the Willow Bend footbridge (or a farm expansion) to make Maren a regular.',
  },
];

export function activeGuestVendor(ctx: {
  absday: number;
  weekday: number;
  minutes: number;
  festival: boolean;
  regulars: readonly string[];
}): GuestVendorDef | null {
  if (ctx.festival) return null;
  const week = Math.floor(ctx.absday / 7);
  for (const v of GUEST_VENDORS) {
    if (ctx.minutes < v.hours[0] * 60 || ctx.minutes >= v.hours[1] * 60) continue;
    const isReg = ctx.regulars.includes(v.id);
    if (isReg ? v.regularDays.includes(ctx.weekday) : ctx.weekday === v.guestWeekday && week % 2 === v.guestParity) {
      return v;
    }
  }
  return null;
}

// ---------------------------------------------------------------- Task 13 & G10: Festival roles & yearly variants
export type FestivalRole = 'compete' | 'cook' | 'setup';

export interface FestivalVariant {
  theme: string;
  intro: string;
  bonusTag: string;
}

export function festivalVariant(kind: string, year: number): FestivalVariant {
  const even = year % 2 === 0;
  if (kind === 'cooking') {
    return even
      ? { theme: 'Hearth & Preserves Year', intro: 'Year of Preserves! Pickled, jammed, and slow-simmered dishes earn extra praise from the judges!', bonusTag: 'preserve' }
      : { theme: 'Fresh Harvest Year', intro: 'Fresh Harvest Theme! Crisp seasonal ingredients take center stage on the tasting table!', bonusTag: 'fresh' };
  }
  if (kind === 'harvest') {
    return even
      ? { theme: 'Golden Broth Year', intro: 'This year’s Harvest Supper celebrates rare roots, hybrids, and golden farm goods!', bonusTag: 'golden' }
      : { theme: 'Valley Bounty Year', intro: 'Bring your freshest crop or forage to the giant iron kettle in Market Cross!', bonusTag: 'bounty' };
  }
  return even
    ? { theme: 'Lantern & Ribbon Year', intro: 'Even-year traditions! Extra streamers deck the square and neighbors swap stories around the fountain.', bonusTag: 'lantern' }
    : { theme: 'Founder’s Year', intro: 'Traditional Brackenford gathering — the whole valley turns out in Market Cross!', bonusTag: 'classic' };
}

export interface FestivalRoleOutcome {
  role: FestivalRole;
  title: string;
  lines: readonly [string, string][];
  gold: number;
  staminaCost: number;
  friends: readonly string[];
  friendPts: number;
  keepsake?: { key: string; name: string; text: string };
}

export function festivalRoleOutcome(festName: string, role: 'cook' | 'setup', donatedItem?: string | null): FestivalRoleOutcome {
  if (role === 'cook') {
    const itemBit = donatedItem ? ` with your fresh ${donatedItem}` : '';
    return {
      role: 'cook',
      title: 'Festival Kitchen Crew',
      lines: [
        ['Gideon', `That’s the spirit! Grab an apron and help Tess stir the big copper kettle${itemBit}!`],
        ['Tess', `You’ve got quick hands at the stove — half the square came back for seconds!`],
      ],
      gold: donatedItem ? 200 : 120,
      staminaCost: 8,
      friends: ['Gideon', 'Tess', 'Rosalind'],
      friendPts: 5,
      keepsake: { key: `fest_role:cook`, name: 'Festival apron pin', text: `Pinned on while cooking for the valley at the ${festName}.` },
    };
  }
  return {
    role: 'setup',
    title: 'Square Setup Crew',
    lines: [
      ['Ingrid', 'Hand me that lantern line! With two of us on the ladder, Market Cross looks festive in half the time.'],
      ['Ambrose', 'Splendid bunting! Brackenford’s festivals shine because folk like you pitch in early.'],
    ],
    gold: 100,
    staminaCost: 10,
    friends: ['Ingrid', 'Ambrose', 'Hollis'],
    friendPts: 5,
    keepsake: { key: `fest_role:setup`, name: 'Braided bunting tassel', text: `Saved from stringing up Market Cross for the ${festName}.` },
  };
}

// ---------------------------------------------------------------- Task 15: Community pantry
export const PANTRY_SPOT: readonly [number, number] = [38, 10];
export const PANTRY_GOAL = 6;
export const PANTRY_RECIPE = 'Brackenford Potluck Stew';
export const PANTRY_CATEGORIES = new Set(['crop', 'forage', 'fish', 'animal', 'food', 'dish']);

export interface PantryState {
  items: string[];
  meals: number;
  recipeLearned: boolean;
  lastMealDay: number;
}

export const emptyPantryState = (): PantryState => ({
  items: [],
  meals: 0,
  recipeLearned: false,
  lastMealDay: -1,
});

export function sanitizePantryState(raw: unknown): PantryState {
  const base = emptyPantryState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<PantryState>;
  if (Array.isArray(r.items)) base.items = r.items.filter((x): x is string => typeof x === 'string').slice(0, 24);
  if (Number.isInteger(r.meals) && (r.meals as number) >= 0) base.meals = r.meals as number;
  base.recipeLearned = r.recipeLearned === true;
  if (Number.isInteger(r.lastMealDay)) base.lastMealDay = r.lastMealDay as number;
  return base;
}

// ---------------------------------------------------------------- Task 36: People you meet along the trail
export interface TrailEncounterDef {
  id: string;
  npc: string;
  map: 'woods' | 'ridge' | 'river' | 'point' | 'grove';
  pos: readonly [number, number];
  kind: 'sketch' | 'scarf' | 'study';
  itemPos?: readonly [number, number];
  itemName?: string;
  prompt: string;
  resolve: string;
  clue: string;
  rewardItem?: string;
  memory: string;
}

export const TRAIL_ENCOUNTERS: readonly TrailEncounterDef[] = [
  {
    id: 'ridge_sketch',
    npc: 'Odessa',
    map: 'ridge',
    pos: [31, 4],
    kind: 'sketch',
    prompt: 'Oh! You caught me sketching the valley cloudline. Stand still a moment — the smoke from your farmhouse roof anchors the whole page.',
    resolve: 'Thank you for pausing on the trail! Here’s a spare Herb Tea from my pack, and a tip: lookouts tell tomorrow’s weather clear as glass.',
    clue: 'Odessa noted from Skyline Ridge that storms always gather south before reaching Brackenford.',
    rewardItem: 'Herb Tea',
    memory: 'Met Odessa sketching the valley view up on Skyline Ridge.',
  },
  {
    id: 'woods_scarf',
    npc: 'Margit',
    map: 'woods',
    pos: [36, 8],
    kind: 'scarf',
    itemPos: [42, 7],
    itemName: 'Crimson Scarf',
    prompt: 'Oh thank goodness — a friendly face! My crimson scarf caught on a bramble just east along Ranch Lane. Could you spot it for me?',
    resolve: 'My grandmother knitted this scarf! You saved my afternoon — please take this Mending Tonic for the trouble, and watch for mushrooms here after rain!',
    clue: 'Margit pointed out that Cedar Hollow’s mossy grass flushes with mushrooms the morning after rain.',
    rewardItem: 'Mending Tonic',
    memory: 'Found Margit’s dropped crimson scarf along the Cedar Hollow trail.',
  },
  {
    id: 'river_moss',
    npc: 'Silas',
    map: 'river',
    pos: [23, 13],
    kind: 'study',
    prompt: 'Quiet, look at the eddy rings along the bank! I’m cataloging how willow roots slow the water for spawning chub.',
    resolve: 'A rare moment to trade notes outdoors! Watch for circular ripples (◎) in Willow Bend — Willow Chub favor those calm eddies.',
    clue: 'Silas noted that circular ripples (◎) in Willow Bend mark prime Willow Chub water.',
    rewardItem: 'Medicinal Herb',
    memory: 'Traded field notes with Silas along the Willow Bend trail.',
  },
  {
    id: 'point_tides',
    npc: 'Nico',
    map: 'point',
    pos: [42, 12],
    kind: 'study',
    prompt: 'Hear how the surge thumps against the headland rocks? That’s where the Rockfish tuck in between tides.',
    resolve: 'Keep an eye out for rocky current ripples (≋) off Lighthouse Point — and when storms roll in, the Storm Marlin cruises right near the point!',
    clue: 'Nico showed you how rocky ripples (≋) off Lighthouse Point attract Rockfish.',
    rewardItem: 'Medium Fish',
    memory: 'Watched the tide surge with Nico out at Lighthouse Point.',
  },
  {
    id: 'grove_quarry',
    npc: 'Rowan',
    map: 'grove',
    pos: [26, 8],
    kind: 'study',
    prompt: 'I come out to the old quarry when I want to read stone seams. See those bright bands? Same veins run straight under Copperseam Mine.',
    resolve: 'Tip from a smith: sealed side chambers in the mines hold richer veins if you don’t mind giving up the ladder down. Take this extra Copper.',
    clue: 'Rowan pointed out that gold-banded mine pockets (≋) always hold clean floor ore.',
    rewardItem: 'Copper',
    memory: 'Studied old quarry stone with Rowan in Ironwood Grove.',
  },
];

export interface ActiveTrailEncounter {
  day: number;
  id: string;
  found: boolean;
  done: boolean;
}

export function rollTrailEncounter(absday: number): ActiveTrailEncounter {
  const def = TRAIL_ENCOUNTERS[absday % TRAIL_ENCOUNTERS.length];
  return { day: absday, id: def.id, found: false, done: false };
}

export function sanitizeTrailEncounter(raw: unknown, today: number): ActiveTrailEncounter | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<ActiveTrailEncounter>;
  if (!Number.isInteger(r.day) || (r.day as number) < today || typeof r.id !== 'string') return null;
  if (!TRAIL_ENCOUNTERS.some((e) => e.id === r.id)) return null;
  return { day: r.day as number, id: r.id, found: Boolean(r.found), done: Boolean(r.done) };
}

// ---------------------------------------------------------------- G16: Otto's Weekly Shipping Contracts
export interface ShippingContract {
  id: string;
  item: string;
  need: number;
  shipped: number;
  bonusGold: number;
  deadline: number; // absday (Saturday)
  done: boolean;
}

const CONTRACT_POOL: Record<number, readonly { item: string; need: number; bonus: number }[]> = {
  0: [
    { item: 'Turnip', need: 6, bonus: 240 },
    { item: 'Potato', need: 5, bonus: 260 },
    { item: 'Cucumber', need: 5, bonus: 280 },
    { item: 'Egg', need: 4, bonus: 220 },
  ],
  1: [
    { item: 'Tomato', need: 5, bonus: 280 },
    { item: 'Corn', need: 4, bonus: 320 },
    { item: 'Onion', need: 5, bonus: 290 },
    { item: 'Medium Fish', need: 3, bonus: 260 },
  ],
  2: [
    { item: 'Sweet Potato', need: 6, bonus: 320 },
    { item: 'Eggplant', need: 5, bonus: 300 },
    { item: 'Carrot', need: 5, bonus: 310 },
    { item: 'Mushroom', need: 4, bonus: 250 },
  ],
  3: [
    { item: 'Copper', need: 5, bonus: 280 },
    { item: 'Silver', need: 3, bonus: 340 },
    { item: 'Large Fish', need: 3, bonus: 360 },
    { item: 'Egg', need: 4, bonus: 240 },
  ],
};

export function generateWeeklyContracts(absday: number, season: number): ShippingContract[] {
  const weekday = absday % 7;
  const daysToSat = (5 - weekday + 7) % 7;
  const deadline = absday + (daysToSat === 0 ? 6 : daysToSat);
  const pool = CONTRACT_POOL[season] || CONTRACT_POOL[0];
  const week = Math.floor(absday / 7);
  const a = pool[week % pool.length];
  const b = pool[(week + 2) % pool.length];
  return [a, b].map((entry, idx) => ({
    id: `c:${week}:${idx}:${entry.item}`,
    item: entry.item,
    need: entry.need,
    shipped: 0,
    bonusGold: entry.bonus,
    deadline,
    done: false,
  }));
}

export function sanitizeContracts(raw: unknown, today: number): ShippingContract[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (c): c is ShippingContract =>
        Boolean(c) &&
        typeof c === 'object' &&
        typeof c.id === 'string' &&
        typeof c.item === 'string' &&
        Number.isInteger(c.need) &&
        c.need > 0 &&
        Number.isInteger(c.shipped) &&
        c.shipped >= 0 &&
        Number.isInteger(c.bonusGold) &&
        c.bonusGold > 0 &&
        Number.isInteger(c.deadline) &&
        c.deadline >= today,
    )
    .slice(0, 3)
    .map((c) => ({ ...c, done: Boolean(c.done) }));
}
