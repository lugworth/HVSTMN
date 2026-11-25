// Brackenford Town Rank (E -> S) & Farm Artisan Placeables (Bee House, Mushroom Log) for GLADE.

export type TownRankGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface TownRankTier {
  grade: TownRankGrade;
  minPoints: number;
  title: string;
  seedDiscount: number; // 0 .. 0.15
  artisanBonus: number; // 0 .. 0.15
  perkSummary: string;
  visuals: {
    lanterns: boolean;
    flowerBoxes: boolean;
    cobblestone: boolean;
    banners: boolean;
    goldenLanterns: boolean;
  };
}

export const TOWN_RANKS: readonly TownRankTier[] = [
  {
    grade: 'E',
    minPoints: 0,
    title: 'Quiet Hamlet',
    seedDiscount: 0,
    artisanBonus: 0,
    perkSummary: 'Donate to the Museum, fill requests, and rebuild Brackenford to raise Town Rank.',
    visuals: { lanterns: false, flowerBoxes: false, cobblestone: false, banners: false, goldenLanterns: false },
  },
  {
    grade: 'D',
    minPoints: 120,
    title: 'Sprouting Village',
    seedDiscount: 0.05,
    artisanBonus: 0,
    perkSummary: 'Market Cross dusk lanterns lit · 5% off seasonal seeds.',
    visuals: { lanterns: true, flowerBoxes: false, cobblestone: false, banners: false, goldenLanterns: false },
  },
  {
    grade: 'C',
    minPoints: 280,
    title: 'Market Hamlet',
    seedDiscount: 0.1,
    artisanBonus: 0.05,
    perkSummary: 'Flower boxes & cobblestone in Market Cross · 10% off seeds · +5% artisan value.',
    visuals: { lanterns: true, flowerBoxes: true, cobblestone: true, banners: false, goldenLanterns: false },
  },
  {
    grade: 'B',
    minPoints: 500,
    title: 'Thriving Crossroads',
    seedDiscount: 0.1,
    artisanBonus: 0.08,
    perkSummary: 'Festival banners fly in the square · +8% artisan value · neighbors send morning gifts.',
    visuals: { lanterns: true, flowerBoxes: true, cobblestone: true, banners: true, goldenLanterns: false },
  },
  {
    grade: 'A',
    minPoints: 800,
    title: 'Valley Gem',
    seedDiscount: 0.15,
    artisanBonus: 0.12,
    perkSummary: '15% off seeds · +12% artisan & aged goods value · celebrated across the valley.',
    visuals: { lanterns: true, flowerBoxes: true, cobblestone: true, banners: true, goldenLanterns: false },
  },
  {
    grade: 'S',
    minPoints: 1200,
    title: 'Heart of the Glade',
    seedDiscount: 0.15,
    artisanBonus: 0.15,
    perkSummary: 'Golden lanterns crown Market Cross · 15% off seeds · +15% artisan & aged goods value!',
    visuals: { lanterns: true, flowerBoxes: true, cobblestone: true, banners: true, goldenLanterns: true },
  },
];

export interface TownRankInput {
  museumCount: number;
  requestsDone: number;
  publicWorksBuilt: boolean;
  shortcutsOpened: number;
  pantryCompleted: number;
  contractsDone: number;
  festivalsWon: number;
  goodFriends: number; // villagers at 40+ friendship
  shippedKinds: number;
}

export interface TownRankStatus {
  points: number;
  tier: TownRankTier;
  next: TownRankTier | null;
  pointsToNext: number;
}

/** Compute Brackenford's unified Town Rank from all village contributions. */
export function computeTownRank(c: TownRankInput): TownRankStatus {
  const points =
    c.museumCount * 15 +
    c.requestsDone * 25 +
    (c.publicWorksBuilt ? 110 : 0) +
    c.shortcutsOpened * 45 +
    c.pantryCompleted * 40 +
    c.contractsDone * 35 +
    c.festivalsWon * 45 +
    c.goodFriends * 20 +
    Math.min(40, c.shippedKinds) * 5;

  let idx = 0;
  for (let i = 0; i < TOWN_RANKS.length; i++) {
    if (points >= TOWN_RANKS[i].minPoints) idx = i;
  }
  const tier = TOWN_RANKS[idx];
  const next = idx + 1 < TOWN_RANKS.length ? TOWN_RANKS[idx + 1] : null;
  return {
    points,
    tier,
    next,
    pointsToNext: next ? Math.max(0, next.minPoints - points) : 0,
  };
}

// ---------------------------------------------------------------- Bee House & Mushroom Log
export const BEE_CYCLE_DAYS = 3;
export const MUSHROOM_LOG_DAYS = 4;

export const FLOWER_HONEY_MAP: Record<string, string> = {
  'Duskbell Flower': 'Duskbell Honey',
  'Rosecap Flower': 'Rosecap Honey',
  'Emberbloom Flower': 'Emberbloom Honey',
  'Moonbloom Flower': 'Duskbell Honey',
  'Pink Cat': 'Rosecap Honey',
  'Toy Flower': 'Rosecap Honey',
  'Magic Red': 'Emberbloom Honey',
  'Moondrop': 'Duskbell Honey',
};

export interface ArtisanYield {
  ready: boolean;
  item: string;
  daysLeft: number;
  dormant?: boolean;
}

/**
 * Determine Bee House status and honey variety from nearby blooming flowers (radius 2).
 * Dormant in Winter (season === 3).
 */
export function beeHouseYield(
  key: string,
  crops: Record<string, [string, number]>,
  cropGrowDays: (cropName: string) => number,
  season: number,
  absday: number,
  lastCollectedDay: number,
): ArtisanYield {
  if (season === 3) {
    return { ready: false, item: 'Wild Honey', daysLeft: 0, dormant: true };
  }
  const [bx, by] = key.split(',').map(Number);
  let bestHoney = 'Wild Honey';
  let bestPriority = 0;
  const prio: Record<string, number> = { 'Wild Honey': 0, 'Duskbell Honey': 1, 'Rosecap Honey': 2, 'Emberbloom Honey': 3 };

  for (const [ck, [cropName, daysGrown]] of Object.entries(crops)) {
    const honey = FLOWER_HONEY_MAP[cropName];
    if (!honey) continue;
    if (daysGrown < cropGrowDays(cropName)) continue; // must be in bloom
    const [cx, cy] = ck.split(',').map(Number);
    if (Math.abs(cx - bx) <= 2 && Math.abs(cy - by) <= 2) {
      if ((prio[honey] ?? 1) > bestPriority) {
        bestPriority = prio[honey] ?? 1;
        bestHoney = honey;
      }
    }
  }

  const elapsed = Math.max(0, absday - lastCollectedDay);
  const ready = elapsed >= BEE_CYCLE_DAYS;
  return { ready, item: bestHoney, daysLeft: ready ? 0 : BEE_CYCLE_DAYS - elapsed };
}

/** Determine Mushroom Log yield (boosted by rain, Fall season, nearby trees, and Forest Bounty perk). */
export function mushroomLogYield(
  adjacentTrees: number,
  season: number,
  rainBoostDays: number,
  hasForestBounty: boolean,
  absday: number,
  lastCollectedDay: number,
  seed: number,
): ArtisanYield {
  const needed = Math.max(2, MUSHROOM_LOG_DAYS - (adjacentTrees >= 2 ? 1 : 0) - Math.min(1, rainBoostDays));
  const elapsed = Math.max(0, absday - lastCollectedDay);
  const ready = elapsed >= needed;
  const roll = Math.abs((seed * 31 + absday * 17) % 100);
  const truffleThreshold = (season === 2 ? 22 : 10) + adjacentTrees * 6 + (hasForestBounty ? 18 : 0);
  const morelThreshold = truffleThreshold + 30;
  const item = roll < truffleThreshold ? 'Truffle' : roll < morelThreshold ? 'Morel' : 'Mushroom';
  return { ready, item, daysLeft: ready ? 0 : needed - elapsed };
}
