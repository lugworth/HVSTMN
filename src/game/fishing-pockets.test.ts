import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { FISH_POCKETS, REGION_CATCH } from './constants';
import { regionCatchOdds, rollRegionCatch } from './rules';
import { Game } from './engine';
import { Screen } from './screen';
import { computeFrame } from './enhanced';

describe('reading the water', () => {
  test('pockets favor their fish without changing the rare roll or season restrictions', () => {
    for (const pocket of FISH_POCKETS) for (let season = 0; season < 4; season++) {
      const table = REGION_CATCH[pocket.map];
      const ctx = { season, weather: 'Rain', rodLvl: 3 };
      const base = Object.fromEntries(regionCatchOdds(table, ctx));
      const favored = Object.fromEntries(regionCatchOdds(table, { ...ctx, favored: pocket.fish }));
      assert.ok(favored[pocket.fish] > base[pocket.fish]);
      assert.equal(favored[table.rare], base[table.rare]);
      assert.ok(Math.abs(Object.values(favored).reduce((a, b) => a + b, 0) - 1) < 1e-10);
      const n = 80;
      const counts: Record<string, number> = {};
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const rolls = [(i + 0.5) / n, (j + 0.5) / n];
        const result = rollRegionCatch(table, { ...ctx, favored: pocket.fish }, () => rolls.shift() ?? 0);
        counts[result] = (counts[result] || 0) + 1 / (n * n);
      }
      for (const [item, chance] of Object.entries(favored)) assert.ok(Math.abs((counts[item] || 0) - chance) < 0.02, `${pocket.map} ${item}`);
      for (const fish of table.fish.filter((f) => f.seasons && !f.seasons.includes(season))) assert.ok(!(fish.item in favored));
    }
  });

  test('marks are on reachable water, visible in both modes, and described when aiming the rod', () => {
    const s = new Screen(80, 24);
    const g = new Game(s, true);
    g.new_game('Ash', 'Bramble');
    s.reducedMotion = true;
    for (const p of FISH_POCKETS) {
      // Daily forage and dig spots are removable, not permanent barriers.
      g.objs[p.map] = {};
      g.forage[p.map] = {};
      const neighbor = [[p.x - 1, p.y], [p.x + 1, p.y], [p.x, p.y - 1], [p.x, p.y + 1]]
        .find(([x, y]) => g.walkable(p.map, x, y));
      assert.ok(neighbor, `${p.map} has somewhere to stand`);
      const [x, y] = neighbor;
      g.warp(p.map, x, y, [p.x - x, p.y - y]);
      g.tool = 'Fishing Rod';
      assert.equal(g.fish_pocket(p.map, p.x, p.y)?.fish, p.fish);
      assert.equal(g.fish_pocket(p.map, x, y), undefined);
      assert.match(g.facing_action().summary, new RegExp(p.fish));
      assert.equal(g.context_action().label, 'CAST');
      g.render();
      const sy = s.tags.findIndex((row) => row.some((tag) => tag?.fishPocket === p.glyph));
      assert.ok(sy >= 0, 'pocket appears on the map');
      const sx = s.tags[sy].findIndex((tag) => tag?.fishPocket === p.glyph);
      for (const hires of [false, true]) for (const time of [0, 3, 12]) {
        s.hires = hires;
        assert.equal(computeFrame(s, time)[sy][sx].ch, p.glyph);
      }
      assert.equal(s.buf[sy][sx][0], p.glyph, 'classic path shows it too');
    }
  });
});
