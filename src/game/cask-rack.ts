/**
 * Cellar Cask Rack: a farm piece (see farm-works.ts) holding one barrel. Wild Grapes and orchard
 * fruit ferment into Young Wine in 2 days; wine and Small Cheese left in the rack keep ageing, and
 * sell for more at 7, 14 and 28 days. Timers are absolute days, so ageing needs no daily tick.
 * Numbers are starting values for playtest.
 */
export const CASK_RACK = 'Cask Rack';
export const CASK_PRICE = 1500;
export const CASK_CAP = 4; // bottles or wheels in one barrel
export const WINE_FRUIT = 3; // fruit per bottle
export const WINE_FRUITS = ['Wild Grape', 'Orchard Pear', 'Apple'] as const;

/** Days aged -> sale multiplier. Same Small/Medium/Large/Golden grade names as ranch goods. */
export const AGE_TIERS = [
  { days: 0, mult: 1.0, grade: 'Small' },
  { days: 7, mult: 1.4, grade: 'Medium' },
  { days: 14, mult: 1.9, grade: 'Large' },
  { days: 28, mult: 2.5, grade: 'Golden' },
] as const;

export type CaskKind = 'wine' | 'cheese';

export const CASK_KINDS: Record<CaskKind, { base: number; ferment: number; stamina: number; cat: string; items: string[] }> = {
  wine: { base: 300, ferment: 2, stamina: 15, cat: 'food', items: ['Young Wine', 'Medium Wine', 'Large Wine', 'Golden Wine'] },
  cheese: { base: 300, ferment: 0, stamina: 15, cat: 'animal', items: ['Small Cheese', 'Medium Cave Cheese', 'Large Cave Cheese', 'Golden Cave Cheese'] },
};

export interface Cask {
  kind: CaskKind;
  start: number; // absolute day it was loaded
  qty: number;
}

export const isCaskKind = (v: unknown): v is CaskKind => typeof v === 'string' && Object.hasOwn(CASK_KINDS, v);

/** 0..3: the highest tier whose day count has been reached. */
export function ageTier(age: number): number {
  let tier = 0;
  AGE_TIERS.forEach((t, i) => { if (age >= t.days) tier = i; });
  return tier;
}

export const salePrice = (kind: CaskKind, tier: number): number => Math.round(CASK_KINDS[kind].base * AGE_TIERS[tier].mult);

/** Days since the goods were finished (negative while still fermenting). */
export const caskAge = (c: Cask, today: number): number => today - c.start - CASK_KINDS[c.kind].ferment;

export const caskPhase = (c: Cask, today: number): 'working' | 'ready' => (caskAge(c, today) < 0 ? 'working' : 'ready');

export const caskItem = (c: Cask, today: number): string => CASK_KINDS[c.kind].items[ageTier(caskAge(c, today))];

/** Days until the next better tier (or until fermented), or null at the top tier. */
export function caskNextIn(c: Cask, today: number): number | null {
  const age = caskAge(c, today);
  if (age < 0) return -age;
  const next = AGE_TIERS[ageTier(age) + 1];
  return next ? next.days - age : null;
}

/** True on the morning something changed: wine finished fermenting, or a new tier was reached. */
export function caskMilestone(c: Cask, today: number): boolean {
  const age = caskAge(c, today);
  return (age === 0 && CASK_KINDS[c.kind].ferment > 0) || AGE_TIERS.some((t) => t.days > 0 && t.days === age);
}

/** What a barrel of wine would take from the rucksack: fruit by kind (first listed first) and bottles made. */
export function wineBatch(inv: Record<string, number>): { take: Record<string, number>; qty: number } {
  const have = WINE_FRUITS.reduce((n, f) => n + Math.max(0, inv[f] || 0), 0);
  const qty = Math.min(CASK_CAP, Math.floor(have / WINE_FRUIT));
  const take: Record<string, number> = {};
  let need = qty * WINE_FRUIT;
  for (const f of WINE_FRUITS) {
    const n = Math.min(need, Math.max(0, inv[f] || 0));
    if (n > 0) take[f] = n;
    need -= n;
  }
  return { take, qty };
}

/** Small Cheese wheels that could go in a barrel. */
export const cheeseBatch = (inv: Record<string, number>): number => Math.min(CASK_CAP, Math.max(0, inv['Small Cheese'] || 0));

/** Keep only well-formed casks standing in a rack the farm actually owns, loaded no later than today. */
export function sanitiseCasks(raw: unknown, hasRack: (key: string) => boolean, today: number): Record<string, Cask> {
  const out: Record<string, Cask> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, c] of Object.entries(raw as Record<string, any>)) {
    if (!hasRack(key) || !c || !isCaskKind(c.kind)) continue;
    if (!Number.isSafeInteger(c.start) || c.start < 0 || c.start > today) continue;
    if (!Number.isSafeInteger(c.qty) || c.qty < 1 || c.qty > CASK_CAP) continue;
    out[key] = { kind: c.kind, start: c.start, qty: c.qty };
  }
  return out;
}
