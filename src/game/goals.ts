// New-player guidance for GLADE: the First Fortnight ladder (follows the first-morning checklist),
// achievement announcements, and the shipping-bin payout wording. Pure data and helpers; the engine owns state.

// ---------------------------------------------------------------- First Fortnight ladder
export interface FortnightState {
  active: boolean; // shown in Today's Plan and the side panel
  done: string[]; // goal ids already rewarded
  picked: boolean; // a crop has been harvested
  board: boolean; // the Market Cross board has been read
}

export interface FortnightCtx {
  state: FortnightState;
  shipped_total: number;
  talked: number;
  museum: number;
}

export interface FortnightGoal {
  id: string;
  label: string; // Today's Plan line
  short: string; // side-panel line (narrow)
  hint: string;
  gold: number;
  seeds?: [string, number];
  met: (c: FortnightCtx) => boolean;
}

export const FORTNIGHT_GOALS: readonly FortnightGoal[] = [
  { id: 'pick', label: 'Pick your first turnip', short: 'Pick a turnip', hint: 'Water daily; ripe in 4 days. SPACE to pick.', gold: 30, met: (c) => c.state.picked },
  { id: 'ship', label: 'Ship it and see Otto pay', short: 'Ship a crop', hint: 'Drop it in the bin; Otto pays at 5 PM.', gold: 40, met: (c) => c.shipped_total > 0 },
  { id: 'greet', label: 'Greet 3 villagers', short: 'Greet 3 villagers', hint: 'In town, press X beside villagers.', gold: 0, seeds: ['Turnip Seeds', 5], met: (c) => c.talked >= 3 },
  { id: 'board', label: 'Read the Market Cross board', short: 'Read town board', hint: 'Face the board in Market Cross, press X.', gold: 50, met: (c) => c.state.board },
  { id: 'museum', label: 'Donate one item to the museum', short: 'Museum donation', hint: 'Give the curator a fish, ore or crop.', gold: 80, met: (c) => c.museum >= 1 },
];

export const FORTNIGHT_KEEPSAKE = {
  key: 'fortnight',
  name: 'Hearthfolk Hearth-Knot',
  text: 'A knot of green thread the Hearthfolk tie for newcomers who have found their feet in Brackenford.',
};

export function newFortnight(active = false): FortnightState {
  return { active, done: [], picked: false, board: false };
}

export function sanitizeFortnight(raw: unknown): FortnightState {
  if (!raw || typeof raw !== 'object') return newFortnight();
  const r = raw as Record<string, unknown>;
  const ids = FORTNIGHT_GOALS.map((g) => g.id);
  const done = Array.isArray(r.done) ? ids.filter((i) => (r.done as unknown[]).includes(i)) : [];
  return { active: !!r.active && done.length < ids.length, done, picked: !!r.picked, board: !!r.board };
}

/** Goals now met but not yet rewarded. */
export function fortnightNewly(c: FortnightCtx): FortnightGoal[] {
  return c.state.active ? FORTNIGHT_GOALS.filter((g) => !c.state.done.includes(g.id) && g.met(c)) : [];
}

// ---------------------------------------------------------------- achievements
export function sanitizeAchSeen(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
}

/** Achievements done but not yet announced. */
export function achNewly<T extends { name: string; done: boolean }>(list: readonly T[], seen: readonly string[]): T[] {
  return list.filter((a) => a.done && !seen.includes(a.name));
}

// ---------------------------------------------------------------- bin payout
export interface Payout {
  total: number;
  items: [string, number][];
  bonus: number;
}

/** "Otto took 9 Turnip, 2 Egg: +1,260G" (at most three kinds named, then "N more"). */
export function payoutLine(p: Payout, prefix = 'Otto took'): string {
  const named = p.items.slice(0, 3).map(([n, q]) => `${q} ${n}`);
  if (p.items.length > 3) named.push(`${p.items.length - 3} more`);
  const bonus = p.bonus ? ` (incl. ${p.bonus.toLocaleString('en-US')}G contract bonus)` : '';
  return `${prefix} ${named.join(', ')}: +${p.total.toLocaleString('en-US')}G${bonus}`;
}
