// Walking distances across the valley, in steps and in-game minutes at a held key.
// npx tsx scripts/measure-valley.ts [--winter]
import { Screen } from '../src/game/screen';
import { Game } from '../src/game/engine';
import { DAY_PACES } from '../src/game/constants';

const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
const g = new Game(new Screen(132, 30), true) as any;
g.new_game('Ash', 'Bramble');
const maps: Record<string, any> = g.maps;

type Node = string; // "map:x,y"
const node = (m: string, x: number, y: number) => `${m}:${x},${y}`;
// Dijkstra over every outdoor tile; warps jump between maps for free.
function dist(from: [string, number, number]): Map<Node, number> {
  const d = new Map<Node, number>([[node(...from), 0]]);
  const q: [string, number, number, number][] = [[...from, 0]];
  while (q.length) {
    q.sort((a, b) => a[3] - b[3]);
    const [mp, x, y, c] = q.shift()!;
    const m = maps[mp];
    const wk = `${x},${y}`;
    if (m.warps?.[wk]) {
      const [tm, tx, ty] = m.warps[wk];
      const n = node(tm, tx, ty);
      if (!d.has(n) || d.get(n)! > c) { d.set(n, c); q.push([tm, tx, ty, c]); }
      continue;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!m.inside(nx, ny)) continue;
      const k = `${nx},${ny}`;
      const ok = k in (m.warps || {}) || k in (m.doors || {}) || g.walkable(mp, nx, ny);
      if (!ok) continue;
      const n = node(mp, nx, ny);
      if (!d.has(n) || d.get(n)! > c + 1) { d.set(n, c + 1); if (!(k in (m.doors || {}))) q.push([mp, nx, ny, c + 1]); }
    }
  }
  return d;
}
const doorOf = (mp: string, id: string): [string, number, number] | null => {
  for (const [k, v] of Object.entries(maps[mp]?.doors || {})) if (v === id) { const [x, y] = k.split(',').map(Number); return [mp, x, y]; }
  return null;
};
const allDoors: Record<string, [string, number, number]> = {};
for (const [mp, m] of Object.entries(maps)) if (!m.indoor) for (const [k, v] of Object.entries(m.doors || {})) { const [x, y] = k.split(',').map(Number); allDoors[`${v}`] ??= [mp, x, y]; }
// The Mirewater Mine sits on an island; the lake only freezes into an ice bridge in Winter.
if (process.argv.includes('--winter')) g.season = 3;
const home = doorOf('farm', Object.values(maps.farm.doors).find((v: any) => String(v).includes('house')) as string)!;
const d = dist(home);
const stepSecs = 0.1; // REPEAT_MS
const minsPerSec = 10 / DAY_PACES.normal.secs;
console.log('map sizes:', Object.entries(maps).filter(([, m]) => !m.indoor).map(([k, m]) => `${k} ${m.w}x${m.h}`).join(', '));
const rows = Object.entries(allDoors).map(([id, [mp, x, y]]) => [id, mp, d.get(node(mp, x, y)) ?? Infinity] as const).sort((a, b) => a[2] - b[2]);
for (const [id, mp, s] of rows) console.log(`${id.padEnd(14)} ${mp.padEnd(9)} ${String(s).padStart(4)} steps  ${(s * stepSecs * minsPerSec).toFixed(0).padStart(3)} game-min`);
