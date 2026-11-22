import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { Screen } from './screen';
import { Game } from './engine';
import { computeFrame, stepOffset, STEP_SLIDE_SECS, STEP_BUMP_SECS } from './enhanced';

before(() => {
  const store: Record<string, string> = {};
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

/** A farm tile with open ground to its right and a wall (something unwalkable) above. */
function openSpot(g: any): [number, number] {
  const m = g.maps.farm;
  for (let y = 2; y < m.h - 2; y++) {
    for (let x = 2; x < m.w - 3; x++) {
      const k = (dx: number, dy: number) => `${x + dx},${y + dy}`;
      if (
        g.walkable('farm', x, y) && g.walkable('farm', x + 1, y) && g.walkable('farm', x + 2, y) &&
        !g.walkable('farm', x, y - 1) && !(k(0, -1) in m.doors) && !(k(0, -1) in m.warps) &&
        !(k(1, 0) in m.doors) && !(k(1, 0) in m.warps) && !(k(2, 0) in m.warps)
      ) return [x, y];
    }
  }
  throw new Error('no open spot on the farm');
}

const place = (g: any) => {
  g.mapname = 'farm';
  g.map = g.maps.farm;
  [g.px, g.py] = openSpot(g);
  g.npc_pos = {};
  g.face = [0, 1];
};

describe('turning, stepping and bumping', () => {
  test('a turn key faces that way without moving', async () => {
    const g = fresh();
    place(g);
    const at = [g.px, g.py];
    await g.handle('turn-right');
    assert.deepEqual(g.face, [1, 0]);
    assert.deepEqual([g.px, g.py], at);
    assert.equal(g.step_fx, null);
  });

  test('a step records a slide from the old tile; a wall records a bump toward it', async () => {
    const g = fresh();
    place(g);
    await g.handle('right');
    assert.equal(g.step_fx.kind, 'slide');
    assert.deepEqual([g.step_fx.dx, g.step_fx.dy], [1, 0]);
    await g.handle('up');
    assert.equal(g.step_fx.kind, 'bump');
    assert.deepEqual([g.step_fx.dx, g.step_fx.dy], [0, -1]);
  });

  test('the slide starts where the token was drawn last frame, so a scrolling camera cannot throw it off', async () => {
    const g = fresh();
    place(g);
    g.render();
    const before = { ...g.player_screen };
    await g.handle('right');
    g.render();
    const step = g.scr.ctx.step;
    assert.equal(step.kind, 'slide');
    assert.deepEqual(step.at, [g.player_screen.x, g.player_screen.y]);
    assert.deepEqual([step.dx, step.dy], [before.x - g.player_screen.x, before.y - g.player_screen.y]);
  });

  test('with reduced motion there is no step animation at all', async () => {
    const g = fresh();
    place(g);
    g.scr.reducedMotion = true;
    g.render();
    await g.handle('right');
    g.render();
    assert.equal(g.scr.ctx.step, undefined);
  });
});

describe('the step animation', () => {
  const slide = { kind: 'slide' as const, at: [5, 5] as [number, number], dx: -1, dy: 0, born: 10 };
  const bump = { kind: 'bump' as const, at: [5, 5] as [number, number], dx: 0, dy: -1, born: 10 };

  test('a slide starts on the old tile, eases out, and finishes inside one walking step', () => {
    assert.deepEqual(stepOffset(slide, 10), [-1, 0]);
    const mid = stepOffset(slide, 10 + STEP_SLIDE_SECS / 2)!;
    assert.ok(mid[0] > -0.5 && mid[0] < 0, 'past halfway by half time (ease-out)');
    assert.equal(stepOffset(slide, 10 + STEP_SLIDE_SECS), null);
    assert.ok(STEP_SLIDE_SECS < 0.1, 'done before the next step at 10 steps a second');
  });

  test('a bump leans a fifth of a cell toward the wall and comes back', () => {
    const peak = stepOffset(bump, 10 + STEP_BUMP_SECS / 2)!;
    assert.ok(Math.abs(peak[1] + 0.2) < 1e-9);
    assert.equal(stepOffset(bump, 10 + STEP_BUMP_SECS), null);
  });

  test('motion off (t = 0) or no step: nothing moves', () => {
    assert.equal(stepOffset(slide, 0), null);
    assert.equal(stepOffset(undefined, 10), null);
  });

  test('mid-slide the player cell carries the offset and the cell it is leaving repaints with it', async () => {
    const g = fresh();
    place(g);
    g.render();
    await g.handle('right');
    g.render();
    const step = g.scr.ctx.step;
    const [x, y] = step.at;
    const out = computeFrame(g.scr, step.born + STEP_SLIDE_SECS / 3);
    assert.ok(out[y][x].shift, 'the token is offset');
    assert.ok(out[y][x + Math.sign(step.dx)].ghost, 'the old cell is marked');
    const done = computeFrame(g.scr, step.born + STEP_SLIDE_SECS);
    assert.equal(done[y][x].shift, undefined);
  });
});

describe('wayfinding signs', () => {
  test('every way into a region (the farm excepted) has a sign beside the path', async () => {
    const { build_valley } = await import('./map');
    const maps = build_valley();
    for (const [name, m] of Object.entries(maps)) {
      if (name === 'farm') continue;
      const ways = new Set(Object.values(m.warps).map((w) => w[0]));
      const signs = Object.entries(m.signs).filter(([, v]) => v.includes('Paths:'));
      assert.equal(signs.length, ways.size, `${name}: ${signs.length} signs for ${ways.size} entrances`);
      for (const [k, text] of signs) {
        assert.equal(m.tile(...(k.split(',').map(Number) as [number, number])), 'sign');
        assert.ok(text.startsWith(`${m.title} — `), text);
        for (const w of ways) assert.ok(text.includes(maps[w].title), `${name} sign names the way to ${w}`);
      }
    }
  });

  test('no sign walls anything off: every door is still reachable from every entrance', async () => {
    const { build_valley } = await import('./map');
    const { TILES } = await import('./constants');
    const maps = build_valley();
    for (const [name, m] of Object.entries(maps)) {
      const open = (x: number, y: number) => m.inside(x, y) && !!TILES[m.tile(x, y)]?.[3];
      for (const start of Object.keys(m.warps)) {
        const seen = new Set([start]);
        const queue = [start.split(',').map(Number)];
        while (queue.length) {
          const [x, y] = queue.pop()!;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const k = `${x + dx},${y + dy}`;
            if (seen.has(k)) continue;
            seen.add(k);
            if (open(x + dx, y + dy) && !(k in m.doors)) queue.push([x + dx, y + dy]);
          }
        }
        for (const [door, id] of Object.entries(m.doors)) {
          if (id === 'lakemine') continue; // across the lake: the ice bridge only forms in Winter
          assert.ok(seen.has(door), `${name}: ${id} reachable from the entrance at ${start}`);
        }
      }
    }
  });
});
