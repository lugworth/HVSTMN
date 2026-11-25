// Interactive ASCII Fishing Tension Bar minigame for GLADE.
// Pure deterministic physics + rendering helpers; assist.easyFishing bypasses this for 1-tap cozy mode.

export type FishBehavior = 'calm' | 'dart' | 'heavy' | 'erratic' | 'king';

export interface FishProfile {
  behavior: FishBehavior;
  speed: number; // cells/sec target drift
  dartChance: number; // chance per sec to pick a new target
  drainRate: number; // progress lost/sec when off-target
  gainRate: number; // progress gained/sec when on-target
}

export const FISH_PROFILES: Record<FishBehavior, FishProfile> = {
  calm: { behavior: 'calm', speed: 4.5, dartChance: 0.7, drainRate: 14, gainRate: 30 },
  dart: { behavior: 'dart', speed: 8.5, dartChance: 1.5, drainRate: 18, gainRate: 28 },
  heavy: { behavior: 'heavy', speed: 5.5, dartChance: 0.9, drainRate: 20, gainRate: 26 },
  erratic: { behavior: 'erratic', speed: 10.5, dartChance: 2.1, drainRate: 21, gainRate: 27 },
  king: { behavior: 'king', speed: 12.5, dartChance: 2.4, drainRate: 24, gainRate: 25 },
};

export interface FishingGameState {
  fishName: string;
  profile: FishProfile;
  barWidth: number;
  zonePos: number; // left edge of catch zone (0 .. barWidth - zoneWidth)
  zoneVel: number;
  zoneWidth: number;
  fishPos: number; // 0 .. barWidth - 1
  fishTarget: number;
  progress: number; // 0 .. 100
  chestPos: number | null; // optional sunken treasure cell
  chestProgress: number; // 0 .. 100
  chestClaimed: boolean;
  onTarget: boolean;
  status: 'playing' | 'caught' | 'escaped';
}

export interface FishingGameOpts {
  barWidth?: number;
  steadyFloat?: boolean;
  masterAngler?: boolean;
  anglerBuff?: boolean;
  luck?: number;
  rng?: () => number;
}

/** Map a fish species name to its movement behavior profile. */
export function fishBehaviorFor(fishName: string): FishBehavior {
  const low = fishName.toLowerCase();
  if (low.includes('king') || low.includes('coelacanth') || low.includes('angler') || low.includes('huchen') || low.includes('squid') || low.includes('carp')) {
    return 'king';
  }
  if (low.includes('eel') || low.includes('pike') || low.includes('rainbow') || low.includes('marlin') || low.includes('tuna')) {
    return 'erratic';
  }
  if (low.includes('sturgeon') || low.includes('catfish') || low.includes('large') || low.includes('cod') || low.includes('snapper')) {
    return 'heavy';
  }
  if (low.includes('trout') || low.includes('salmon') || low.includes('medium') || low.includes('bass') || low.includes('perch')) {
    return 'dart';
  }
  return 'calm';
}

export function createFishingState(fishName: string, opts: FishingGameOpts = {}): FishingGameState {
  const rng = opts.rng ?? Math.random;
  const barWidth = opts.barWidth ?? 22;
  const behavior = fishBehaviorFor(fishName);
  const profile = FISH_PROFILES[behavior];
  const baseZone = behavior === 'king' ? 5 : behavior === 'erratic' ? 5 : 6;
  const zoneWidth = Math.min(
    barWidth - 4,
    baseZone + (opts.steadyFloat ? 1 : 0) + (opts.masterAngler ? 2 : 0) + (opts.anglerBuff ? 1 : 0),
  );
  const chestChance = 0.22 + (opts.masterAngler ? 0.14 : 0) + Math.max(0, (opts.luck ?? 0) * 0.05);
  const hasChest = rng() < chestChance;
  const chestPos = hasChest ? Math.floor(3 + rng() * (barWidth - 6)) : null;

  return {
    fishName,
    profile,
    barWidth,
    zonePos: Math.max(0, Math.floor((barWidth - zoneWidth) / 2)),
    zoneVel: 0,
    zoneWidth,
    fishPos: Math.floor(barWidth * 0.5),
    fishTarget: Math.floor(2 + rng() * (barWidth - 4)),
    progress: 30,
    chestPos,
    chestProgress: 0,
    chestClaimed: false,
    onTarget: true,
    status: 'playing',
  };
}

/** Advance the fishing tension bar by `dt` seconds. Pure and deterministic when given `rng`. */
export function stepFishingState(
  prev: FishingGameState,
  reelHeld: boolean,
  dt: number,
  rng: () => number = Math.random,
): FishingGameState {
  if (prev.status !== 'playing') return prev;
  const s = { ...prev };
  const clampedDt = Math.max(0.01, Math.min(0.15, dt));

  // Player catch-zone spring physics: holding reels right; releasing drifts left.
  const accel = reelHeld ? 42 : -30;
  s.zoneVel = Math.max(-16, Math.min(18, s.zoneVel + accel * clampedDt));
  s.zoneVel *= Math.pow(0.28, clampedDt);
  s.zonePos += s.zoneVel * clampedDt;
  const maxZone = s.barWidth - s.zoneWidth;
  if (s.zonePos < 0) {
    s.zonePos = 0;
    s.zoneVel = Math.max(0, -s.zoneVel * 0.25);
  } else if (s.zonePos > maxZone) {
    s.zonePos = maxZone;
    s.zoneVel = Math.min(0, -s.zoneVel * 0.25);
  }

  // Fish AI target selection and glide
  if (Math.abs(s.fishPos - s.fishTarget) < 0.7 || rng() < s.profile.dartChance * clampedDt) {
    const span = s.profile.behavior === 'heavy' ? 6 : s.barWidth - 2;
    const minT = Math.max(1, s.fishPos - span * 0.5);
    const maxT = Math.min(s.barWidth - 2, s.fishPos + span * 0.5);
    s.fishTarget = s.profile.behavior === 'heavy'
      ? minT + rng() * Math.max(1, maxT - minT)
      : 1 + rng() * (s.barWidth - 2);
  }
  const dir = Math.sign(s.fishTarget - s.fishPos);
  const step = Math.min(Math.abs(s.fishTarget - s.fishPos), s.profile.speed * clampedDt);
  s.fishPos = Math.max(0.5, Math.min(s.barWidth - 1.5, s.fishPos + dir * step));

  // Overlap check with generous 0.4-cell forgiveness edge
  const onTarget = s.fishPos >= s.zonePos - 0.4 && s.fishPos <= s.zonePos + s.zoneWidth + 0.4;
  s.onTarget = onTarget;
  s.progress = Math.max(0, Math.min(100, s.progress + (onTarget ? s.profile.gainRate : -s.profile.drainRate) * clampedDt));

  // Optional Sunken Treasure Chest overlap
  if (s.chestPos !== null && !s.chestClaimed) {
    const overChest = s.chestPos >= s.zonePos - 0.5 && s.chestPos <= s.zonePos + s.zoneWidth + 0.5;
    if (overChest) {
      s.chestProgress = Math.min(100, s.chestProgress + 58 * clampedDt);
      if (s.chestProgress >= 100) s.chestClaimed = true;
    } else {
      s.chestProgress = Math.max(0, s.chestProgress - 18 * clampedDt);
    }
  }

  if (s.progress >= 100) s.status = 'caught';
  else if (s.progress <= 0) s.status = 'escaped';
  return s;
}

/** Render the horizontal ASCII tension bar and catch progress gauge. */
export function renderFishingBar(s: FishingGameState): { track: string; meter: string; chestNote: string } {
  const cells: string[] = [];
  const zStart = Math.round(s.zonePos);
  const zEnd = zStart + s.zoneWidth - 1;
  const fCol = Math.max(0, Math.min(s.barWidth - 1, Math.round(s.fishPos)));
  for (let i = 0; i < s.barWidth; i++) {
    const inZone = i >= zStart && i <= zEnd;
    if (i === fCol) {
      cells.push(s.onTarget ? '◈' : '♦');
    } else if (s.chestPos !== null && !s.chestClaimed && i === s.chestPos) {
      cells.push('▤');
    } else if (inZone) {
      cells.push(i === zStart || i === zEnd ? '|' : '=');
    } else {
      cells.push('·');
    }
  }
  const meterCells = 14;
  const filled = Math.max(0, Math.min(meterCells, Math.round((s.progress / 100) * meterCells)));
  const meter = `[${'#'.repeat(filled)}${'.'.repeat(meterCells - filled)}] ${Math.round(s.progress)}%`;
  const chestNote = s.chestClaimed
    ? 'Treasure hooked!'
    : s.chestPos !== null
      ? `Treasure ${Math.round(s.chestProgress)}%`
      : '';
  return { track: `[${cells.join('')}]`, meter, chestNote };
}

export interface FishingTreasure {
  item?: string;
  qty?: number;
  gold?: number;
  label: string;
}

/** Roll bonus loot when the player lands a Sunken Treasure Chest during fishing. */
export function rollFishingTreasure(season: number, luck: number, rng: () => number = Math.random): FishingTreasure {
  const r = Math.max(0, Math.min(0.999, rng() + Math.max(0, luck) * 0.04));
  if (r < 0.34) {
    const geode = season === 3 ? 'Frozen Geode' : season === 1 ? 'Magma Geode' : 'Geode';
    return { item: geode, qty: 1, label: `a ${geode}` };
  }
  if (r < 0.62) {
    const gold = 120 + Math.floor(rng() * 180);
    return { gold, label: `${gold}G in sunken coins` };
  }
  if (r < 0.84) {
    const seed = season === 0 ? 'Strawberry Seeds' : season === 1 ? 'Pineapple Seeds' : season === 2 ? 'Sweet Potato Seeds' : 'Snowheart Seeds';
    return { item: seed, qty: 2, label: `2x ${seed}` };
  }
  const mineral = season === 3 ? 'Moonstone' : 'Star Shard';
  return { item: mineral, qty: 1, label: `a gleaming ${mineral}` };
}
