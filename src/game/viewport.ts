// Canvas grid sizing and touch-input helpers for GameScreen. Pure functions, unit-tested.
import { COMPACT_MIN_COLS, FULL_MIN_COLS, MIN_ROWS } from './compact';
import { TEXT_SCALES, type TextScale } from './accessibility';

export const MAX_COLS = 160;
export const MAX_ROWS = 50;
/** Phone (compact) grids stop growing taller than this, so small rooms and the status strip stay near the map. */
export const TOUCH_COMPACT_MAX_ROWS = 32;
/** Baseline font size; touch screens cap here and desktop can grow to 26px. */
export const BASE_FONT = 16;
/** Touch screens never shrink the full 80-column layout below this. */
export const TOUCH_FULL_MIN_FONT = 12;
/** Compact (phone) layout font range: big enough to read, small enough to show some map. */
export const COMPACT_MAX_FONT = 14;
export const COMPACT_MIN_FONT = 9;
/** Non-touch windows narrower than this (CSS px) use the compact layout (no side panel). */
export const NARROW_WINDOW_PX = 600;
/** Phones showing a small interior may drop to this many columns so the room draws bigger. */
export const SMALL_MAP_MIN_COLS = 46;
export const SMALL_MAP_MAX_FONT = 20;

/** Hold-to-repeat timing for the on-screen D-pad: a tap is one step, a hold walks ~10 tiles/s. */
export const REPEAT_DELAY_MS = 220;
export const REPEAT_MS = 100;

export type Grid = { fontPx: number; cols: number; rows: number; compact: boolean };
export type Dir = 'up' | 'down' | 'left' | 'right';

export const lineHeight = (px: number): number => Math.ceil(px * 1.25);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Choose a font size and a cols x rows grid for a stage of `width` x `height` CSS px.
 * `measure(px)` is the advance width of one monospace cell at that font size.
 *
 * - Desktop grows the Contour grid to 26px, targeting 96 columns and 31 rows before
 *   adding more scenery. Small windows shrink to fit 80x24.
 * - Touch screens use the full layout (side panel) when it fits at 12px or more, otherwise
 *   the compact layout at the largest size (<= 14px) that still fits 50x24.
 * - Anything smaller is shrunk to fit 50x24; the canvas is scaled down if even that fails.
 */
export function chooseGrid(
  width: number,
  height: number,
  measure: (px: number) => number,
  touch: boolean,
  textScale: TextScale = 'normal',
  mapSize: [number, number] | null = null,
): Grid {
  const boost = TEXT_SCALES[textScale]?.boostPx ?? 0;
  const fits = (px: number, minCols: number) =>
    width / measure(px) >= minCols && height / lineHeight(px) >= MIN_ROWS;
  const grid = (px: number, minCols: number): Grid => {
    const cols = clamp(Math.floor(width / measure(px)), minCols, MAX_COLS);
    const compact = cols < FULL_MIN_COLS;
    const maxRows = touch && compact ? TOUCH_COMPACT_MAX_ROWS : MAX_ROWS;
    const rows = clamp(Math.floor(height / lineHeight(px)), MIN_ROWS, maxRows);
    return { fontPx: px, cols, rows, compact };
  };
  const shrinkTo = (minCols: number) =>
    Math.max(
      5,
      Math.floor(BASE_FONT * Math.min(width / (minCols * measure(BASE_FONT)), height / (MIN_ROWS * lineHeight(BASE_FONT)))),
    );

  const narrow = !touch && width < NARROW_WINDOW_PX;
  if (!touch && !narrow) {
    const maxPx = 26 + boost;
    const targetPx = Math.max(BASE_FONT + boost, Math.min(maxPx, Math.floor(height / (31 * 1.25)) + boost, Math.floor(width / (96 * 0.61)) + boost));
    if (fits(targetPx, FULL_MIN_COLS)) return grid(targetPx, FULL_MIN_COLS);
    // Larger text scale on small desktop windows prefers bigger readable text in compact layout before shrinking tiny.
    if (boost > 0) {
      for (let px = targetPx; px >= BASE_FONT; px--) {
        if (fits(px, FULL_MIN_COLS)) return grid(px, FULL_MIN_COLS);
      }
      for (let px = Math.min(targetPx, COMPACT_MAX_FONT + boost); px >= COMPACT_MIN_FONT + Math.min(3, boost); px--) {
        if (fits(px, COMPACT_MIN_COLS)) return grid(px, COMPACT_MIN_COLS);
      }
    }
    return grid(shrinkTo(FULL_MIN_COLS), FULL_MIN_COLS);
  }
  // On touch with larger text scale, raise the minimum threshold for full 80-col layout so prompts stay big & legible.
  const fullMin = TOUCH_FULL_MIN_FONT + boost;
  const fullMax = BASE_FONT + boost;
  if (!narrow) for (let px = fullMax; px >= fullMin; px--) if (fits(px, FULL_MIN_COLS)) return grid(px, FULL_MIN_COLS);
  const compactMax = COMPACT_MAX_FONT + boost;
  let plain = 0;
  for (let px = compactMax; px >= COMPACT_MIN_FONT && !plain; px--) if (fits(px, COMPACT_MIN_COLS)) plain = px;
  // A small interior (touch only) scales up: fewer columns, larger cells, as long as the whole room still fits.
  if (touch && mapSize) {
    const roomFits = (px: number) => mapSize[0] * measure(px) <= width && mapSize[1] * lineHeight(px) <= height;
    for (let px = SMALL_MAP_MAX_FONT + boost; px > Math.max(plain, 0); px--) {
      if (fits(px, SMALL_MAP_MIN_COLS) && roomFits(px)) return grid(px, SMALL_MAP_MIN_COLS);
    }
  }
  if (plain) return grid(plain, COMPACT_MIN_COLS);
  return grid(shrinkTo(COMPACT_MIN_COLS), COMPACT_MIN_COLS);
}

const STEPS: [Dir, number, number][] = [
  ['up', 0, -1],
  ['down', 0, 1],
  ['left', -1, 0],
  ['right', 1, 0],
];

/** The direction that moves from (x, y) one step toward the adjacent cell (tx, ty). */
export function dirToward(x: number, y: number, tx: number, ty: number): Dir {
  if (Math.abs(tx - x) >= Math.abs(ty - y)) return tx > x ? 'right' : 'left';
  return ty > y ? 'down' : 'up';
}

/**
 * Tap-to-walk: the first step of a shortest 4-way path from `start` to any cell where `isGoal`
 * holds, through cells where `passable` holds (breadth-first, at most `limit` cells explored).
 * Returns `{ dir: null, dist: 0 }` when already there, or null when no path exists.
 */
export function firstStep(
  start: [number, number],
  isGoal: (x: number, y: number) => boolean,
  passable: (x: number, y: number) => boolean,
  limit = 6000,
): { dir: Dir | null; dist: number } | null {
  if (isGoal(start[0], start[1])) return { dir: null, dist: 0 };
  const seen = new Set<string>([`${start[0]},${start[1]}`]);
  let frontier: [number, number, Dir][] = [[start[0], start[1], 'up']];
  for (let dist = 1; frontier.length && seen.size < limit; dist++) {
    const next: [number, number, Dir][] = [];
    for (const [x, y, first] of frontier) {
      for (const [d, dx, dy] of STEPS) {
        const nx = x + dx;
        const ny = y + dy;
        const k = `${nx},${ny}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const dir = dist === 1 ? d : first;
        if (isGoal(nx, ny)) return { dir, dist };
        if (passable(nx, ny)) next.push([nx, ny, dir]);
      }
    }
    frontier = next;
  }
  return null;
}

/**
 * Direction for a touch at (dx, dy) px from the D-pad centre, or null inside the dead zone.
 * With `current` set, the held axis is kept until the other axis is `bias` times stronger,
 * so a thumb resting near a diagonal doesn't flicker between two directions.
 */
export function dpadDirection(dx: number, dy: number, dead: number, current: Dir | null = null, bias = 1.25): Dir | null {
  if (Math.hypot(dx, dy) < dead) return null;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  let horizontal = ax > ay;
  if (current) {
    const wasHorizontal = current === 'left' || current === 'right';
    if (wasHorizontal && ax * bias >= ay) horizontal = true;
    else if (!wasHorizontal && ay * bias >= ax) horizontal = false;
  }
  if (horizontal) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

/** Viewports narrower than this get the phone layout even without a touch signal. */
export const NARROW_VIEWPORT_PX = 600;
export const wantsTouchLayout = (hasTouch: boolean, viewportWidth: number): boolean =>
  hasTouch || viewportWidth < NARROW_VIEWPORT_PX;
