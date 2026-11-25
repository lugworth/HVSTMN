// Progression, mastery perks, recipe discovery, food buffs, daily luck, mine checkpoints & assist modes for GLADE
// Covers features G3, G6, G7, G13, G18.

// ---------------------------------------------------------------- G3: Mastery Perks
export interface MasteryPerkDef {
  id: string;
  discipline: 'farming' | 'foraging' | 'fishing' | 'mining' | 'ranching';
  rank: number; // 1 = Adept, 2 = Expert
  name: string;
  desc: string;
}

export const MASTERY_PERKS: readonly MasteryPerkDef[] = [
  // Rank 1 (Adept)
  { id: 'farm_can', discipline: 'farming', rank: 1, name: 'Deep Spout', desc: '+10 Watering Can capacity at every refill.' },
  { id: 'farm_value', discipline: 'farming', rank: 1, name: 'Select Grade', desc: '+15% shipping gold on harvested farm crops.' },
  { id: 'forage_double', discipline: 'foraging', rank: 1, name: 'Keen Eye', desc: '+20% chance to gather a second forage item.' },
  { id: 'forage_stamina', discipline: 'foraging', rank: 1, name: 'Trail Stride', desc: 'Forage snacks restore +25% more stamina.' },
  { id: 'fish_bite', discipline: 'fishing', rank: 1, name: 'Steady Float', desc: 'Fish bite faster and catch bar is wider.' },
  { id: 'fish_rare', discipline: 'fishing', rank: 1, name: 'Deep Line', desc: '+15% shipping value on caught fish.' },
  { id: 'mine_ore', discipline: 'mining', rank: 1, name: 'Vein Reader', desc: 'Higher chance of rare ores and gems per rock.' },
  { id: 'mine_stamina', discipline: 'mining', rank: 1, name: 'Light Swing', desc: 'Every other mine swing saves 1 stamina.' },
  { id: 'ranch_aff', discipline: 'ranching', rank: 1, name: 'Gentle Hand', desc: '+2 bonus daily affection for fed animals.' },
  { id: 'ranch_value', discipline: 'ranching', rank: 1, name: 'Creamery Pride', desc: '+15% shipping value on eggs, milk, wool & makers.' },
  // Rank 2 (Expert)
  { id: 'farm_artisan', discipline: 'farming', rank: 2, name: 'Artisan Touch', desc: '+20% value on Honey, Cask Wines, Preserves & Aged Cheese.' },
  { id: 'forage_bounty', discipline: 'foraging', rank: 2, name: 'Forest Bounty', desc: 'Mushroom Logs yield rarer Truffles & Morels.' },
  { id: 'fish_angler', discipline: 'fishing', rank: 2, name: 'Master Angler', desc: 'Much wider fishing bar and more Sunken Treasure chests.' },
  { id: 'mine_prospector', discipline: 'mining', rank: 2, name: 'Deep Prospector', desc: 'Higher Geode drop rate and gentler pitfall landings.' },
  { id: 'ranch_golden', discipline: 'ranching', rank: 2, name: 'Golden Pasture', desc: '+10% extra shipping value on all livestock & artisan dairy.' },
];

export function perksForDiscipline(discipline: string, rank?: number): MasteryPerkDef[] {
  return MASTERY_PERKS.filter((p) => p.discipline === discipline && (rank === undefined || p.rank === rank));
}

export function sanitizeMasteryPerks(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [slot, id] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof id !== 'string') continue;
    const isRank2 = slot.endsWith('_2');
    const disc = isRank2 ? slot.slice(0, -2) : slot;
    const reqRank = isRank2 ? 2 : 1;
    if (MASTERY_PERKS.some((p) => p.discipline === disc && p.rank === reqRank && p.id === id)) {
      out[slot] = id;
    }
  }
  return out;
}

// ---------------------------------------------------------------- G6: Mine Elevator Checkpoints
export const ELEVATOR_STEP = 25;
export const ELEVATOR_STAMINA_FEE = 5;

/** Floors the elevator offers: only depths the player has actually reached. The blessing waives the fee, never the depth. */
export function mineElevatorFloors(maxFloor: number, _wellkeeperBlessed = false): number[] {
  const set = new Set<number>([1]);
  for (const f of [10, 29, 50, 100, 200, 255]) {
    if (f <= maxFloor) set.add(f);
  }
  for (let f = ELEVATOR_STEP; f <= Math.min(250, maxFloor); f += ELEVATOR_STEP) {
    set.add(f);
  }
  return [...set].sort((a, b) => a - b);
}

// ---------------------------------------------------------------- G7: Recipe Discovery + Timed Food Buffs
export type FoodBuffKind = 'stamina' | 'luck' | 'mining' | 'fishing';

export interface FoodBuff {
  kind: FoodBuffKind;
  label: string;
  until: number; // absday * 1440 + minutes
}

export const FOOD_BUFF_MINUTES = 240; // 4 in-game hours

export const STARTER_RECIPES: readonly string[] = [
  'Salad',
  'Pickled Turnip',
  'Dried Herbs',
  'Boiled Egg',
  'Hot Milk',
  'Herb Tea',
];

export function foodBuffForDish(dish: string, staminaGain: number): { kind: FoodBuffKind; label: string } | null {
  if (dish === 'Failed Dish') return null;
  const low = dish.toLowerCase();
  if (low.includes('fish') || low.includes('sashimi') || low.includes('sushi') || low.includes('chowder')) {
    return { kind: 'fishing', label: 'Angler Focus (easier bites)' };
  }
  if (low.includes('curry') || low.includes('stew') || low.includes('noodle') || low.includes('omelet') || low.includes('mash')) {
    return { kind: 'mining', label: 'Miner Vigour (better ore finds)' };
  }
  if (low.includes('tea') || low.includes('cake') || low.includes('pie') || low.includes('pudding') || low.includes('jam') || low.includes('preserve') || low.includes('slaw') || low.includes('salad')) {
    return { kind: 'luck', label: 'High Spirits (+1 Luck)' };
  }
  if (staminaGain >= 20) {
    return { kind: 'stamina', label: 'Well Fed (-1 tool stamina)' };
  }
  return null;
}

export function sanitizeFoodBuff(raw: unknown, nowAbs: number): FoodBuff | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<FoodBuff>;
  if (
    (r.kind !== 'stamina' && r.kind !== 'luck' && r.kind !== 'mining' && r.kind !== 'fishing') ||
    typeof r.label !== 'string' ||
    !Number.isInteger(r.until) ||
    (r.until as number) <= nowAbs
  ) {
    return null;
  }
  return { kind: r.kind, label: r.label.slice(0, 60), until: r.until as number };
}

/** Match an experimental set of ingredients against known recipes to discover new dishes! */
export function matchExperimentalRecipe(
  picked: string[],
  recipes: Record<string, [Array<[string, number]>, string | null, number, number]>,
  items: Record<string, [number, number, string]>,
  fruits: Set<string>,
  ownedUtensils: Record<string, number>,
): string | null {
  const counts: Record<string, number> = {};
  for (const p of picked) counts[p] = (counts[p] || 0) + 1;

  for (const [dish, [reqs, utensil]] of Object.entries(recipes)) {
    if (utensil && !ownedUtensils[utensil]) continue;
    const left = { ...counts };
    let ok = true;
    for (const [tok, need] of reqs) {
      let rem = need;
      if (tok.startsWith('any:')) {
        const kind = tok.slice(4);
        for (const k of Object.keys(left)) {
          if (left[k] <= 0) continue;
          const matches = kind === 'fruit' ? fruits.has(k) : items[k]?.[2] === kind;
          if (!matches) continue;
          const take = Math.min(rem, left[k]);
          left[k] -= take;
          rem -= take;
          if (rem === 0) break;
        }
      } else {
        const take = Math.min(rem, left[tok] || 0);
        left[tok] = (left[tok] || 0) - take;
        rem -= take;
      }
      if (rem > 0) {
        ok = false;
        break;
      }
    }
    const leftover = Object.values(left).reduce((a, b) => a + b, 0);
    if (ok && leftover === 0) return dish;
  }
  return null;
}

// ---------------------------------------------------------------- G13: Daily Luck / Fortune
export type LuckLevel = -2 | -1 | 0 | 1 | 2;

export const LUCK_LABELS: Record<LuckLevel, { name: string; forecast: string; col: string }> = {
  [-2]: { name: 'Cloudy', forecast: 'A quiet, careful day — keep expectations modest in the mines.', col: '04' },
  [-1]: { name: 'Mild', forecast: 'Steady skies, nothing extravagant — good for routine farm chores.', col: '05' },
  [0]: { name: 'Balanced', forecast: 'Even fortune across the valley today.', col: '07' },
  [1]: { name: 'Bright', forecast: 'Good fortune! Fish bite briskly and veins glint brighter underground.', col: '0B' },
  [2]: { name: 'Radiant', forecast: 'Radiant luck! Rare mine finds, eager bites, and warmer neighbor chats.', col: '0A' },
};

export function rollDailyLuck(absday: number, farmSeed: number): LuckLevel {
  const h = Math.abs(Math.imul(absday + 17, 2654435761) ^ Math.imul(farmSeed + 31, 1597334677)) % 100;
  if (h < 12) return -2;
  if (h < 32) return -1;
  if (h < 68) return 0;
  if (h < 88) return 1;
  return 2;
}

export function sanitizeLuck(raw: unknown): LuckLevel {
  if (raw === -2 || raw === -1 || raw === 0 || raw === 1 || raw === 2) return raw;
  return 0;
}

// ---------------------------------------------------------------- G18: Assist Modes
export const ASSIST_KEY = 'hrvstmn-assist';

export interface AssistSettings {
  noFaint: boolean;
  easyFishing: boolean;
  confirmDestructive: boolean;
}

export const defaultAssist = (): AssistSettings => ({
  noFaint: false,
  easyFishing: false,
  confirmDestructive: false,
});

export function readAssistSettings(storage?: Pick<Storage, 'getItem'> | null): AssistSettings {
  try {
    const raw = storage?.getItem(ASSIST_KEY);
    if (!raw) return defaultAssist();
    const p = JSON.parse(raw) as Partial<AssistSettings>;
    return {
      noFaint: p.noFaint === true,
      easyFishing: p.easyFishing === true,
      confirmDestructive: p.confirmDestructive === true,
    };
  } catch {
    return defaultAssist();
  }
}

export function writeAssistSettings(storage: Pick<Storage, 'setItem'> | null | undefined, settings: AssistSettings): void {
  try {
    storage?.setItem(ASSIST_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable
  }
}
