// Map layout wayfinding (package P2): shore, ridge, bend and farm roads, pond fix, signs.
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { Screen } from './screen';
import { Game } from './engine';
import { NPCS } from './constants';

const store: Record<string, string> = {};
before(() => {
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
  };
});

const fresh = () => {
  const g = new Game(new Screen(132, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  return g;
};

const MAPS = ['farm', 'town', 'mountain', 'beach', 'woods', 'ridge', 'river'];

/** Cells reachable on foot from (sx, sy), ignoring forage and dig spots that spawn overnight. */
const flood = (g: any, name: string, sx: number, sy: number): Set<string> => {
  const keep = [g.forage[name], g.objs[name]];
  g.forage[name] = {};
  g.objs[name] = {};
  const seen = new Set<string>();
  const stack: [number, number][] = [[sx, sy]];
  while (stack.length) {
    const [x, y] = stack.pop()!;
    const k = `${x},${y}`;
    if (seen.has(k) || !g.walkable(name, x, y)) continue;
    seen.add(k);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  [g.forage[name], g.objs[name]] = keep;
  return seen;
};
const near = (seen: Set<string>, x: number, y: number) =>
  [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`));

describe('map layout wayfinding (package P2)', () => {
  test('every warp, door and sign on the edited maps is reachable from the first warp', () => {
    const g = fresh();
    for (const name of MAPS) {
      const m = g.maps[name];
      const warps = Object.keys(m.warps).map((k) => k.split(',').map(Number));
      assert.ok(warps.length > 0, name);
      const seen = flood(g, name, warps[0][0], warps[0][1]);
      const targets = [...Object.keys(m.warps), ...Object.keys(m.doors), ...Object.keys(m.signs)];
      for (const k of targets) {
        const [x, y] = k.split(',').map(Number);
        assert.ok(near(seen, x, y), `${name}: ${k} is cut off from the first warp`);
      }
    }
  });

  test('the new roads and signs sit where the layout audit wants them', () => {
    const g = fresh();
    assert.equal(g.maps.beach.tile(40, 12), 'path', 'shore road');
    assert.equal(g.maps.mountain.tile(30, 7), 'path', 'lake-side ridge road');
    assert.notEqual(g.maps.mountain.tile(46, 7), 'pond', 'row 7 is road, not pond');
    assert.equal(g.maps.mountain.tile(46, 8), 'pond');
    assert.equal(g.maps.ridge.tile(40, 3), 'path', 'trail reaches the tarn');
    assert.equal(g.maps.farm.tile(31, 24), 'path', 'cart track');
    assert.equal(g.maps.woods.tile(50, 6), 'tree');
    assert.equal(g.maps.town.tile(34, 22), 'sign');
    assert.match(g.maps.town.signs['34,22'], /your farm/);
    assert.equal('1,21' in g.maps.town.signs, false, 'old compass sign is gone');
    assert.deepEqual(NPCS.Ferreira.where, ['town', 22, 12]);
    assert.ok(g.walkable('town', 22, 12), 'Ferreira stands on open ground');
  });
});
