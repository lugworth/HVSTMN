// Regression tests for engine bugs found by fuzzing and save/load diffing.
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { Screen } from './screen';
import { Game } from './engine';
import { computeFrame } from './enhanced';
import { HEDGE_GATE } from './map';
import {
  ITEMS,
  NPCS,
  STALL_SPOT,
  FORAGE,
  FORAGE_GLYPH,
  PALETTE,
  SEASONS,
  REGION_FORAGE,
  REGION_CATCH,
  LIGHTHOUSE_LOG,
  LOOKOUT_VIEW,
  LOOKOUT_STAMINA,
  TIDE_POOL_TEXT,
  DIG_CAP,
  DIG_MAPS,
  DIG_RELICS,
  INN_SCENES,
  INN_EVENING_DAY,
  INN_LISTEN_FRIEND,
  INN_JOIN_FRIEND,
  GRAY_COPPER_QTY,
  GRAY_COPPER_REWARD,
  GRAY_QUEST_FRIEND,
  VALLEY_LANDMARKS,
  PUBLIC_WORKS,
  COMPANION,
  CROPS,
  SEED_SAVING,
  MAKER_SPOTS,
  TILES,
  PRESERVES,
  PRESERVE_SEASONS,
  RECIPES,
  MARKET_SHOPPERS,
  ORDERS,
  ORDER_DAYS,
  ORDER_GAP,
} from './constants';
import { BASKET_CAPACITY } from './rules';
import { footbridge_cells, FOOTBRIDGE_SIGN } from './map';

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
  g.new_game('Pete', 'Moon');
  return g;
};

describe('engine regressions', () => {
  test('the clock and villagers wait while the game menu is open', async () => {
    const g = fresh();
    g.warp('farm', 14, 10); // outdoors, where the clock runs
    g.paused = true;
    const [minutes, acc, npcAcc] = [g.minutes, g.acc, g.npc_acc];
    g.last = Date.now() / 1000 - 10; // ten seconds pass with the menu open
    await g.update();
    assert.deepEqual([g.minutes, g.acc, g.npc_acc], [minutes, acc, npcAcc]);
    g.paused = false;
    g.last = Date.now() / 1000 - 0.2;
    await g.update();
    assert.ok(g.acc > acc, 'time runs again once the menu closes');
  });

  test("Shift+H whistles the horse; plain 'h' still moves left (hjkl)", async () => {
    const g = fresh();
    // find a spot on the farm whose left neighbour is walkable
    let spot: [number, number] | null = null;
    for (let y = 2; y < 26 && !spot; y++) for (let x = 3; x < 60 && !spot; x++) {
      if (g.walkable('farm', x, y) && g.walkable('farm', x - 1, y) && !(`${x - 1},${y}` in g.maps.farm.doors)) spot = [x, y];
    }
    assert.ok(spot);
    g.warp('farm', spot![0], spot![1]);
    const x0 = g.px;
    await g.handle('h');
    assert.equal(g.px, x0 - 1, 'h moves left');
    assert.equal(g.riding_horse, false);
    await g.handle('H');
    assert.equal(g.riding_horse, true, 'H whistles the horse');
  });

  test('seed pouch shortcut pins a seed bag and toggles back to the prior tool', async () => {
    const g = fresh();
    g.tool = 'Hoe';
    g.inv['Turnip Seeds'] = 5;
    g.inv['Tomato Seeds'] = 2;

    await g.handle('f');
    assert.ok(['Turnip Seeds', 'Tomato Seeds'].includes(g.tool));
    assert.ok(['Turnip Seeds', 'Tomato Seeds'].includes(g.favorite_seed!));
    assert.equal(g.previous_tool, 'Hoe');

    await g.handle('F');
    assert.equal(g.tool, 'Hoe');
    assert.equal(g.previous_tool, null);
  });

  test('barn animals and once-per-day flags survive save/load', () => {
    const a = fresh();
    a.animals = [{ kind: 'cow', name: 'Bess', aff: 40 }];
    a.talked = new Set(['Ann']);
    a.gifted = new Set(['Ann']);
    a.honey_picked = true;
    a.prayed = true;
    a.save(2);
    const b = new Game(new Screen(132, 30), true) as any;
    b.load(2);
    assert.deepEqual(b.animals, a.animals);
    assert.ok(b.gifted instanceof Set && b.gifted.has('Ann'));
    assert.ok(b.talked instanceof Set && b.talked.has('Ann'));
    assert.equal(b.honey_picked, true);
    assert.equal(b.prayed, true);
  });

  test('older saves without the new fields still load', () => {
    const a = fresh();
    a.save(1);
    const d = JSON.parse(store['hrvstmn-save']);
    for (const k of ['animals', 'talked', 'gifted', 'honey_picked']) delete d[k];
    store['hrvstmn-save'] = JSON.stringify(d);
    const b = new Game(new Screen(132, 30), true) as any;
    assert.doesNotThrow(() => b.load(1));
    assert.ok(Array.isArray(b.animals));
  });
});

/** Capture dialog text instead of waiting for a key. */
const quiet = (g: any) => {
  const said: string[] = [];
  g.say = async (text: string) => { said.push(text); };
  return said;
};

/** Run `fn` with Math.random pinned to `v` (py_rng draws from it). */
const pinned = async <T>(v: number, fn: () => T | Promise<T>): Promise<T> => {
  const orig = Math.random;
  Math.random = () => v;
  try {
    return await fn();
  } finally {
    Math.random = orig;
  }
};

const REGIONS = ['woods', 'ridge', 'river', 'point'];

/** Run fn with Math.random returning the given values first, then real randomness. */
const withRandom = <T,>(values: number[], fn: () => T): T => {
  const real = Math.random;
  let i = 0;
  Math.random = () => (i < values.length ? values[i++] : real());
  try {
    return fn();
  } finally {
    Math.random = real;
  }
};

describe('the rearranged valley', () => {
  test('forage saved under a building that has since moved in is dropped on load', () => {
    const g = fresh();
    const door = Object.keys(g.maps.river.doors)[0].split(',').map(Number);
    g.forage.river = { [`${door[0]},${door[1] - 1}`]: 'Watercress', '3,3': 'Watercress' };
    g.save(2);
    const b = new Game(new Screen(132, 30), true) as any;
    b.load(2);
    assert.deepEqual(Object.keys(b.forage.river), ['3,3']);
  });

  test('dig spots and forage turn up in Ironwood Grove, and the Teleport Stone reaches the forge', () => {
    const g = fresh();
    assert.ok(DIG_MAPS.includes('grove'));
    for (const season of SEASONS) assert.ok(REGION_FORAGE.grove[season].length >= 3, season);
    for (const pool of Object.values(REGION_FORAGE.grove)) for (const item of pool) assert.ok(ITEMS[item], `${item} is a real item`);
    g.spawn_forage();
    assert.ok(Object.keys(g.forage.grove).length > 0);
    assert.ok(g.walkable('grove', 22, 18), 'the Teleport Stone lands on open ground by the forge');
  });
});

describe('daily surprises', () => {
  const digsOn = (g: any, map: string) => Object.entries(g.objs[map] || {}).filter(([, o]) => o === 'dig').map(([k]) => k);

  test('dig spots grow on open ground, never more than DIG_CAP a map, and not on frozen farmland', () => {
    const g = fresh();
    for (let day = 0; day < 20; day++) g.spawn_digs();
    for (const map of DIG_MAPS) {
      const spots = digsOn(g, map);
      assert.ok(spots.length <= DIG_CAP, `${map} holds at most ${DIG_CAP}`);
      for (const k of spots) {
        const [x, y] = k.split(',').map(Number);
        const tile = g.maps[map].tile(x, y);
        assert.ok(map === 'farm' ? tile === 'field' : tile === 'grass' || tile === 'sand', `${map} ${k} is open ground (${tile})`);
        assert.ok(!(k in (g.forage[map] || {})), 'not on forage');
      }
    }
    assert.ok(DIG_MAPS.some((m) => digsOn(g, m).length > 0), 'twenty mornings grow some dig spots');
    const w = fresh();
    w.season = 3;
    for (const k of digsOn(w, 'farm')) delete w.objs.farm[k]; // the new game's spring spot
    for (let day = 0; day < 20; day++) w.spawn_digs();
    assert.equal(digsOn(w, 'farm').length, 0, 'none on the farm in Winter');
  });

  test('the Hoe digs a spot up for coins, ore, seeds, forage or a relic', async () => {
    const outcomes = new Set<string>();
    for (const roll of [0.05, 0.2, 0.45, 0.65, 0.9]) {
      const g = fresh();
      g.warp('farm', 14, 10);
      const [tx, ty] = g.target();
      g.objs.farm[`${tx},${ty}`] = 'dig';
      g.tool = 'Hoe';
      assert.deepEqual(g.context_action(), { key: 'space', label: 'DIG' });
      const [gold, inv] = [g.gold, JSON.stringify(g.inv)];
      await withRandom([roll, 0], () => g.use_tool());
      assert.equal(g.objs.farm[`${tx},${ty}`], undefined, 'the spot is used up');
      assert.ok(g.gold > gold || JSON.stringify(g.inv) !== inv, `roll ${roll} finds something`);
      if (Object.keys(g.inv).some((i) => DIG_RELICS.includes(i))) outcomes.add('relic');
      if (g.gold > gold) outcomes.add('gold');
    }
    assert.deepEqual([...outcomes].sort(), ['gold', 'relic']);
  });

  test('relics have their own museum wing, Star Fragment included', () => {
    const g = fresh();
    assert.ok(g.museum_categories().some(([, c]: [string, string]) => c === 'relic'));
    const wing = g.museum_pool('relic');
    for (const r of [...DIG_RELICS, 'Star Fragment']) assert.ok(wing.includes(r), `${r} can be donated`);
  });

  test('a falling star lands on open field and the Hammer cracks it open', async () => {
    const g = fresh();
    const report: string[] = [];
    withRandom([0, 0], () => g.night_surprise(report)); // surprise roll passes, first kind is the star
    const star = Object.entries(g.objs.farm).find(([, o]) => o === 'starrock');
    assert.ok(star, 'a star landed');
    assert.match(report[0], /falling star/);
    const [sx, sy] = star![0].split(',').map(Number);
    g.warp('farm', sx, sy + 1);
    g.face = [0, -1];
    g.tool = 'Hammer';
    assert.equal(g.context_action().label, 'CRACK');
    await g.use_tool();
    assert.equal(g.objs.farm[star![0]], undefined);
    assert.equal(g.inv['Star Fragment'], 1);
  });

  test('glowmoths grow some crops a day; most nights nothing happens', () => {
    const g = fresh();
    const keys = ['20,12', '21,12', '22,12', '23,12'];
    for (const k of keys) g.crops[k] = ['Turnip', 0];
    const report: string[] = [];
    withRandom([0, 0.99, 0.5], () => g.night_surprise(report)); // the last kind on the list is glowmoths
    assert.match(report[0], /Glowmoths/);
    assert.equal(keys.reduce((n, k) => n + g.crops[k][1], 0), 4, 'each of the four crops grew a day');
    const quiet: string[] = [];
    withRandom([0.99], () => g.night_surprise(quiet));
    assert.deepEqual(quiet, []);
  });

  test('a doorstep parcel brings forage from a friend', () => {
    const g = fresh();
    g.friend = { Ann: 40 };
    const report: string[] = [];
    withRandom([0, 0.6, 0], () => g.night_surprise(report)); // kinds: star, parcel -> parcel
    assert.match(report[0], /^Ann left a parcel by your door: 2 /);
  });
});

describe('outer-region content', () => {
  test('each region forages from its own seasonal pool, with full item data', () => {
    const g = fresh();
    for (const region of REGIONS) {
      for (let season = 0; season < 4; season++) {
        g.season = season;
        const pool = REGION_FORAGE[region][SEASONS[season]];
        assert.deepEqual(g.forage_pool(region), pool, `${region} ${SEASONS[season]}`);
        const generic = new Set(FORAGE[SEASONS[season]]);
        assert.ok(pool.some((i: string) => !generic.has(i)), `${region} ${SEASONS[season]} has something of its own`);
        for (const item of pool) {
          const [price, , cat] = ITEMS[item] || [];
          assert.equal(cat, 'forage', `${item} is forage`);
          assert.ok(price > 0, `${item} ships for gold`);
          const [ch, fg] = FORAGE_GLYPH[item] || [];
          assert.equal(String(ch).length, 1, `${item} has a glyph`);
          assert.ok(fg in PALETTE, `${item} glyph colour`);
          assert.ok(g.museum_pool('forage').includes(item), `${item} can be donated`);
        }
        g.spawn_forage();
        const placed = Object.values(g.forage[region]) as string[];
        assert.ok(placed.length > 0, `${region} gets forage`);
        assert.ok(placed.every((i) => pool.includes(i)), `${region} only grows its own pool`);
      }
    }
    // the first four maps keep the valley-wide lists
    g.season = 2;
    assert.deepEqual(g.forage_pool('mountain'), FORAGE.Fall);
  });

  test('river and sea catches come from their own tables, and cook like any fish', () => {
    const g = fresh();
    for (const region of ['river', 'point']) {
      const table = REGION_CATCH[region];
      const allowed = new Set([...table.fish.map((f) => f.item), table.rare]);
      for (const item of allowed) assert.ok(ITEMS[item], `${item} exists`);
      assert.equal(ITEMS[table.rare][2], 'fish');
      assert.ok(ITEMS[table.rare][0] >= 500, 'the rare catch is worth the trip');
      g.mapname = region;
      g.levels['Fishing Rod'] = 4;
      for (let i = 0; i < 300; i++) assert.ok(allowed.has(g.roll_catch()), region);
      assert.equal(await_rare(g), table.rare, `${region} rare catch`);
    }
    g.mapname = 'mountain';
    for (let i = 0; i < 300; i++) assert.ok(!['Willow Chub', 'Mackerel', 'Elder Sturgeon', 'Storm Marlin'].includes(g.roll_catch()));
    g.inv = { Flour: 1, Egg: 1, Oil: 1, 'Willow Chub': 1 };
    assert.ok(g.ingredient_plan('Tempura'), 'new fish count as any:fish');
    g.inv = { Blackberry: 2 };
    assert.ok(g.ingredient_plan('Fruit Juice'), 'blackberries count as fruit');
  });

  test('Skyline Ridge lookout: a view of tomorrow, and a once-a-day lift', async () => {
    const g = fresh();
    const said = quiet(g);
    assert.equal(g.maps.ridge.signs['33,6'], 'ridge_lookout');
    g.warp('ridge', 33, 5, [0, 1]);
    g.tomorrow = 'Rain';
    g.stamina = 50;
    g.fatigue = 30;
    await g.interact();
    assert.equal(g.stamina, 50 + LOOKOUT_STAMINA);
    assert.equal(g.fatigue, 20);
    assert.ok(said[0].includes(LOOKOUT_VIEW.Rain));
    await g.interact();
    assert.equal(g.stamina, 50 + LOOKOUT_STAMINA, 'only once a day');
    assert.ok(said[1].includes(LOOKOUT_VIEW.Rain));
    g.day += 1;
    await g.interact();
    assert.equal(g.stamina, 50 + 2 * LOOKOUT_STAMINA, 'again the next day');
  });

  test("Lighthouse Point: the keeper's log reads one page a day and leaves Sea Glass at the end", async () => {
    const g = fresh();
    const said = quiet(g);
    assert.equal(g.maps.point.signs['45,10'], 'lighthouse_log');
    g.warp('point', 45, 11, [0, -1]);
    await g.interact();
    assert.equal(g.lighthouse_log, 1);
    assert.ok(said[0].includes(LIGHTHOUSE_LOG[0]));
    await g.interact();
    assert.equal(g.lighthouse_log, 1, 'one new page a day');
    assert.ok(said[1].includes('Come back tomorrow'));
    for (let page = 2; page <= LIGHTHOUSE_LOG.length; page++) {
      g.day += 1;
      await g.interact();
      assert.equal(g.lighthouse_log, page);
      assert.ok(said[said.length - 1].includes(LIGHTHOUSE_LOG[page - 1]));
    }
    assert.equal(g.inv['Sea Glass'], 1);
    g.day += 1;
    await g.interact();
    assert.equal(g.lighthouse_log, LIGHTHOUSE_LOG.length);
    assert.equal(g.inv['Sea Glass'], 1, 'the keepsake is given once');
  });

  test('Cedar Hollow pond takes a wild gift for a lucky day; it is not the Goddess Pond', async () => {
    const g = fresh();
    quiet(g);
    g.warp('woods', 47, 19, [1, 0]);
    assert.equal(g.maps.woods.tile(48, 19), 'pond');
    assert.equal(g.context_action().label, 'OFFER');
    g.inv = { Turnip: 1, Fiddlehead: 2 };
    g.held = 'Turnip';
    await g.interact();
    assert.equal(g.inv.Turnip, 1, 'crops are refused');
    assert.equal(g.hollow_luck_day, -1);
    g.held = 'Fiddlehead';
    await g.interact();
    assert.equal(g.inv.Fiddlehead, 1);
    assert.equal(g.hollow_luck_day, g.absday());
    assert.equal(g.goddess_gifts, 0, 'no Goddess offering here');
    await g.interact();
    assert.equal(g.inv.Fiddlehead, 1, 'once a day');
    // lucky pickups can come in pairs, today only
    g.face = [0, -1];
    g.forage.woods = { '47,18': 'Chanterelle' };
    await pinned(0, () => g.interact());
    assert.equal(g.inv.Chanterelle, 2);
    g.day += 1;
    g.forage.woods = { '47,18': 'Chanterelle' };
    await pinned(0, () => g.interact());
    assert.equal(g.inv.Chanterelle, 3, 'the luck lapses overnight');
  });

  test('Lighthouse Point tide pools are for looking at, not offerings', async () => {
    const g = fresh();
    const said = quiet(g);
    const m = g.maps.point;
    let spot: [number, number] | null = null;
    for (let y = 1; y < m.h - 1 && !spot; y++) for (let x = 2; x < m.w - 1 && !spot; x++) if (m.tile(x, y) === 'pond') spot = [x, y];
    assert.ok(spot, 'the point has tide pools');
    g.warp('point', spot![0] - 1, spot![1], [1, 0]);
    g.inv = { Fiddlehead: 1 };
    g.held = 'Fiddlehead';
    assert.equal(g.context_action().label, 'LOOK');
    await g.interact();
    assert.equal(said[0], TIDE_POOL_TEXT);
    assert.equal(g.inv.Fiddlehead, 1);
    assert.equal(g.goddess_gifts, 0);
  });

  test('Willow Bend: skip stones across the river and keep a record', async () => {
    const g = fresh();
    const m = g.maps.river;
    let spot: [number, number] | null = null;
    for (let y = 2; y < m.h - 2 && !spot; y++) for (let x = 2; x < m.w - 2 && !spot; x++) {
      if (m.tile(x, y) === 'grass' && m.tile(x + 1, y) === 'water') spot = [x, y];
    }
    assert.ok(spot);
    g.warp('river', spot![0], spot![1], [1, 0]);
    g.tool = 'Hoe';
    assert.deepEqual(g.context_action(), { key: 'x', label: 'SKIP' });
    g.tool = 'Fishing Rod';
    assert.equal(g.context_action().label, 'CAST');
    const stamina = g.stamina;
    await pinned(0, () => g.interact());
    assert.equal(g.skip_best, 12);
    assert.ok(g.stamina < stamina, 'skipping costs a little stamina');
    await pinned(0.99, () => g.interact());
    assert.equal(g.skip_best, 12, 'a short skip keeps the record');
    assert.ok(g.msgs.some(([t]: [string]) => t.includes('Record: 12')));
  });

  test('landmark progress saves, loads, and defaults in older saves', () => {
    const a = fresh();
    Object.assign(a, { lookout_day: 7, hollow_luck_day: 7, skip_best: 9, lighthouse_log: 3, lighthouse_day: 6 });
    a.save(2);
    const b = new Game(new Screen(132, 30), true) as any;
    b.load(2);
    for (const k of ['lookout_day', 'hollow_luck_day', 'skip_best', 'lighthouse_log', 'lighthouse_day']) assert.equal(b[k], a[k], k);
    const d = JSON.parse(store['hrvstmn-save-2']);
    for (const k of ['lookout_day', 'hollow_luck_day', 'skip_best', 'lighthouse_log', 'lighthouse_day']) delete d[k];
    store['hrvstmn-save-2'] = JSON.stringify(d);
    const c = new Game(new Screen(132, 30), true) as any;
    c.load(2);
    assert.deepEqual(
      [c.lookout_day, c.hollow_luck_day, c.skip_best, c.lighthouse_log, c.lighthouse_day],
      [-1, -1, 0, 0, -1]
    );
    // a new farm starts the landmarks over
    a.new_game('Pete', 'Moon');
    assert.equal(a.skip_best, 0);
    assert.equal(a.lighthouse_log, 0);
  });
});

/** Roll until the rare catch shows up (it is a few percent with a Mystrile rod). */
function await_rare(g: any): string | null {
  const rare = REGION_CATCH[g.mapname].rare;
  for (let i = 0; i < 5000; i++) if (g.roll_catch() === rare) return rare;
  return null;
}

describe("Friday evenings at Doug's Inn (task 01)", () => {
  // Spring 5, Year 1 is a Friday (absday 4).
  const friday = (minutes = 19 * 60) => {
    const g = fresh();
    g.day = 5;
    g.minutes = minutes;
    assert.equal(g.weekday, INN_EVENING_DAY);
    return g;
  };
  const labels = async (g: any) => (await g.shop_options('inn')).map((o: any) => o[0]);

  test('the inn offers one scene on Friday evenings only', async () => {
    const g = friday();
    assert.ok((await labels(g))[0].startsWith('Friday evening: '));
    assert.ok(!(await labels(friday(15 * 60))).some((l: string) => l.startsWith('Friday')), 'not in the afternoon');
    assert.ok(!(await labels(friday(22 * 60))).some((l: string) => l.startsWith('Friday')), 'not after 10 PM');
    const thu = friday();
    thu.day = 4;
    assert.ok(!(await labels(thu)).some((l: string) => l.startsWith('Friday')), 'not on Thursday');
  });

  test('listening raises friendship once and the scene leaves the menu for the night', async () => {
    const g = friday();
    const said = quiet(g);
    g.menu = async () => 0; // Listen
    const scene = g.inn_scene();
    const before = scene.cast.map((n: string) => g.friend[n] || 0);
    await g.inn_evening();
    assert.deepEqual(scene.cast.map((n: string) => g.friend[n]), before.map((f: number) => f + INN_LISTEN_FRIEND));
    assert.equal(said.length, scene.listen.length);
    assert.ok(g.inn_scenes_seen.includes(scene.id));
    assert.ok(!(await labels(g)).some((l: string) => l.startsWith('Friday')));
  });

  test('joining gives more friendship and the scene payoff', async () => {
    const g = friday();
    quiet(g);
    g.menu = async () => 1; // join in
    while (g.inn_scene().id !== 'recipes') g.inn_scenes_seen.push(g.inn_scene().id);
    const before = g.friend['Ann'] || 0;
    const cookies = g.inv['Cookies'] || 0;
    await g.inn_evening();
    assert.equal(g.friend['Ann'], before + INN_JOIN_FRIEND);
    assert.equal(g.inv['Cookies'], cookies + 1);
  });

  test('a scene you have seen waits until the others have been seen', () => {
    const g = friday();
    const first = g.inn_scene().id;
    g.day = 12; // the next Friday
    g.inn_scenes_seen = [first];
    assert.notEqual(g.inn_scene().id, first);
    g.inn_scenes_seen = INN_SCENES.map((s) => s.id);
    assert.ok(INN_SCENES.some((s) => s.id === g.inn_scene().id), 'all seen: the rotation repeats');
  });

  test("Today's Plan names the evening on Fridays, and the attendance survives a reload", async () => {
    const g = friday();
    assert.ok(g.today_lines().some((l: string) => l.includes(g.inn_scene().title)));
    quiet(g);
    g.menu = async () => 0;
    await g.inn_evening();
    assert.ok(g.today_lines().some((l: string) => l.includes("Friday evening at Doug's")));
    const h = fresh();
    h.applySaveData(JSON.parse(JSON.stringify(g.snapshot())));
    assert.deepEqual(h.inn_scenes_seen, g.inn_scenes_seen);
    assert.equal(h.inn_evening_day, g.absday());
    const old = JSON.parse(JSON.stringify(g.snapshot()));
    delete old.inn_scenes_seen;
    delete old.inn_evening_day;
    const k = fresh();
    k.applySaveData(old);
    assert.deepEqual(k.inn_scenes_seen, []);
    assert.equal(k.inn_evening_day, -1);
  });
});

describe("Gray's two-chapter copper request (task 04)", () => {
  const talkGray = async (g: any) => {
    const said: string[] = [];
    g.say = async (text: string) => { said.push(text); };
    await g.talk('Gray');
    return said;
  };

  test('chapter one: Gray asks for copper, then reminds you once a day', async () => {
    const g = fresh();
    const ask = await talkGray(g);
    assert.equal(g.gray_quest, 1);
    assert.ok(ask[0].includes(`${GRAY_COPPER_QTY} Copper`));
    g.talked.clear();
    const remind = await talkGray(g);
    assert.ok(remind[0].includes('Still need'));
    assert.equal(g.gray_quest, 1, 'nothing delivered without copper');
    assert.ok(g.today_lines().some((l: string) => l.includes('Copper from the Spring Mine')));
  });

  test('delivering copper pays, starts chapter two and leaves a note for the next can upgrade', async () => {
    const g = fresh();
    await talkGray(g);
    g.give('Copper', GRAY_COPPER_QTY + 1);
    const [gold, friend, done] = [g.gold, g.friend['Gray'] || 0, g.requests_done];
    g.talked.clear();
    const said = await talkGray(g);
    assert.equal(g.inv['Copper'], 1, 'takes exactly the copper asked for');
    assert.equal(g.gold, gold + GRAY_COPPER_REWARD);
    assert.ok(g.friend['Gray'] >= friend + GRAY_QUEST_FRIEND);
    assert.equal(g.requests_done, done + 1);
    assert.equal(g.gray_quest, 2);
    assert.equal(g.gray_note_level, 1, 'a Basic can is pointed at Copper');
    assert.ok(said.some((l) => l.includes('Copper is the one to save for') && l.includes('1000G')));
    assert.ok(said.some((l) => l.includes('Mystrile') && l.includes('15 tiles')), 'names the big jump');
    assert.ok(g.today_lines().some((l: string) => l.includes('Take Saibara 1000G + 1 Copper')));
  });

  test('chapter two closes once the can reaches the noted level', async () => {
    const g = fresh();
    await talkGray(g);
    g.give('Copper', GRAY_COPPER_QTY);
    g.talked.clear();
    await talkGray(g);
    g.talked.clear();
    assert.ok((await talkGray(g))[0].includes('Remember my note'));
    g.levels['Watering Can'] = 1;
    const friend = g.friend['Gray'];
    const said = await talkGray(g);
    assert.equal(g.gray_quest, 3);
    assert.ok(said[0].includes('Copper can'));
    assert.ok(g.friend['Gray'] >= friend + GRAY_QUEST_FRIEND);
    assert.ok(!g.today_lines().some((l: string) => l.startsWith('  Note')));
    g.talked.clear();
    await talkGray(g); // ordinary chatter afterwards
    assert.equal(g.gray_quest, 3);
  });

  for (const [lvl, words] of [[4, 'Lake Mine'], [5, 'Carter'], [6, 'Mythic'], [7, 'nothing left']] as const) {
    test(`a level ${lvl} can gets a closing line about ${words}, and no note`, async () => {
      const g = fresh();
      g.levels['Watering Can'] = lvl;
      await talkGray(g);
      g.give('Copper', GRAY_COPPER_QTY);
      g.talked.clear();
      const said = await talkGray(g);
      assert.equal(g.gray_quest, 3);
      assert.ok(said.some((l) => l.includes(words)), said.join(' / '));
      assert.ok(!g.today_lines().some((l: string) => l.startsWith('  Note')));
    });
  }

  test('from a Silver can, Gold is next and Mystrile is named as the big jump without "everything between"', async () => {
    const g = fresh();
    g.levels['Watering Can'] = 2;
    await talkGray(g);
    g.give('Copper', GRAY_COPPER_QTY);
    g.talked.clear();
    const said = await talkGray(g);
    assert.ok(said.some((l) => l.includes('Gold is the one to save for')));
    const jump = said.find((l) => l.includes('Mystrile'))!;
    assert.ok(jump && !jump.includes('Everything between'), jump);
  });

  test('a can already at the forge is counted: the advice and note point past it', async () => {
    const g = fresh();
    await talkGray(g);
    g.give('Copper', GRAY_COPPER_QTY);
    g.upgrading = ['Watering Can', g.absday() + 1];
    g.talked.clear();
    const said = await talkGray(g);
    assert.ok(said.some((l) => l.startsWith("Once Saibara's done") && l.includes('Silver is the one to save for')));
    assert.equal(g.gray_note_level, 2);
    assert.ok(g.today_lines().some((l: string) => l.includes('Take Saibara 2000G + 1 Silver')));
    // paying for the noted upgrade turns the note into a pick-up reminder
    g.upgrading = null;
    g.levels['Watering Can'] = 1;
    g.upgrading = ['Watering Can', g.absday() + 1];
    assert.ok(g.today_lines().some((l: string) => l.includes('Saibara has your can')));
  });

  test('marrying Gray mid-quest does not strand it', async () => {
    const g = fresh();
    await talkGray(g);
    g.married = 'Gray';
    g.mapname = 'house';
    g.give('Copper', GRAY_COPPER_QTY);
    g.talked.clear();
    await talkGray(g);
    assert.equal(g.gray_quest, 2);
    assert.equal(g.inv['Copper'] || 0, 0);
  });

  test("quest talks still check for the Mary & Gray rival event", async () => {
    const g = fresh();
    let checked = 0;
    g.check_heart_and_rival_events = async () => { checked++; };
    await talkGray(g);
    assert.equal(checked, 1);
  });

  test('a held gift still goes to Gray as a gift, not to the quest', async () => {
    const g = fresh();
    g.give('Copper', 1);
    g.held = 'Copper';
    await talkGray(g);
    assert.equal(g.gray_quest, 0);
    assert.ok(g.gifted.has('Gray'));
  });

  test('quest progress survives a reload; old saves start before chapter one', () => {
    const g = fresh();
    g.gray_quest = 2;
    g.gray_note_level = 2;
    const h = fresh();
    h.applySaveData(JSON.parse(JSON.stringify(g.snapshot())));
    assert.equal(h.gray_quest, 2);
    assert.equal(h.gray_note_level, 2);
    const old = JSON.parse(JSON.stringify(g.snapshot()));
    delete old.gray_quest;
    delete old.gray_note_level;
    const k = fresh();
    k.applySaveData(old);
    assert.equal(k.gray_quest, 0);
  });
});

describe('labeled valley map (task 33)', () => {
  const rowText = (g: any, y: number) => g.scr.buf[y].map((c: any) => c[0]).join('');
  const screenText = (g: any) => g.scr.buf.map((r: any) => r.map((c: any) => c[0]).join('')).join('\n');

  test('every landmark sits on a real door or sign of its map', () => {
    const g = fresh();
    for (const lm of VALLEY_LANDMARKS) {
      const m = g.maps[lm.map];
      assert.ok(m, `${lm.id}: map ${lm.map}`);
      const k = `${lm.x},${lm.y}`;
      assert.ok(k in m.doors || k in m.signs, `${lm.id} at ${k} on ${lm.map}`);
      if (lm.bid) assert.equal(m.doors[k], lm.bid, `${lm.id} door is ${lm.bid}`);
    }
    const glyphs = VALLEY_LANDMARKS.map((l) => l.glyph);
    assert.equal(new Set(glyphs).size, glyphs.length, 'symbols are distinct');
  });

  test('the pin points to the next map exit, then to the landmark itself', () => {
    const g = fresh();
    g.map_pin = 'forge';
    g.warp('farm', 14, 10);
    let r = g.pin_route();
    assert.equal(r.text, 'west exit to Ironwood Grove');
    assert.equal(r.cell[0], 0, 'the exit cell is on the west edge');
    assert.equal(g.maps.farm.warps[`${r.cell[0]},${r.cell[1]}`][0], 'grove');
    g.warp('woods', 30, 2);
    assert.equal(g.pin_route().text, 'north exit to Your Farm, toward Ironwood Grove');
    g.warp('grove', 30, 16);
    r = g.pin_route();
    assert.match(r.text, /^\d+ steps west$/);
    assert.deepEqual(r.cell, [18, 16]);
    g.warp('in_inn', ...g.interiors.inn.entry);
    assert.equal(g.pin_route().text, 'step outside to Mineral Town');
    g.map_pin = 'lookout';
    g.warp('beach', 30, 5);
    assert.equal(g.pin_route().text, "north exit to Mineral Town, toward Skyline Ridge");
  });

  test('the minimap and the map view show where to go while a pin is set', () => {
    const g = fresh();
    g.warp('farm', 14, 10);
    g.map_pin = 'forge';
    g.show_minimap = true;
    g.render();
    const tags = g.scr.tags.flat().filter(Boolean).map((t: any) => t.k);
    assert.ok(tags.includes('minimap:pin'), 'exit marked on the minimap');
    assert.ok(screenText(g).includes(' < Ironwood Grove '), 'minimap title names the next region');
    // the title stays inside the minimap's frame: its top row ends in a corner, and nothing spills past it
    const top = g.scr.buf.findIndex((r: any) => r.map((c: any) => c[0]).join('').includes('< Ironwood Grove'));
    const row = rowText(g, top);
    const start = row.indexOf('+-');
    const end = row.indexOf('+', start + 1);
    assert.ok(end > row.indexOf('Ironwood Grove'), row);
    // a next region too long for the frame is clipped with an ellipsis, still inside the corner
    g.map_pin = 'lighthouse';
    g.warp('beach', 30, 5);
    g.render();
    const lrow = g.scr.buf.map((r: any) => r.map((c: any) => c[0]).join('')).find((r: string) => r.includes('> Lighthouse'));
    assert.ok(lrow && lrow.includes('…'), lrow);
    assert.ok(lrow.indexOf('+', lrow.indexOf('…')) === lrow.indexOf('…') + 2, lrow);
    g.map_pin = 'forge';
    g.warp('farm', 14, 10);
    g.show_minimap = false;
    g.render();
    const hint = g.scr.buf[0].map((c: any) => c[0]).join('');
    assert.ok(hint.includes("⚒ Saibara's Forge: west exit"), hint);
    g.map_pin = null;
    g.render();
    assert.ok(!rowText(g, 0).includes("Saibara's Forge"), 'no pointer without a pin');
  });

  test('G opens the map; arrows pick a landmark, Enter pins and unpins, Esc closes', async () => {
    const g = fresh();
    g.warp('farm', 14, 10);
    for (const k of ['right', 'enter', 'esc']) g.scr.pushKey(k);
    await g.handle('g');
    assert.equal(g.map_pin, 'forge', 'from the farmhouse, one step right is the forge');
    for (const k of ['enter', 'esc']) g.scr.pushKey(k);
    await g.handle('G');
    assert.equal(g.map_pin, null, 'Enter on the pinned landmark clears it');
    for (const k of ['down', 'enter', 'esc']) g.scr.pushKey(k);
    await g.valley_map();
    assert.equal(g.map_pin, 'forge', 'down moves to the next region');
  });

  for (const [w, h] of [[80, 24], [50, 24], [50, 28], [132, 40]]) {
    test(`the valley map fits a ${w}x${h} screen with every symbol and the forge hours`, () => {
      const g = fresh();
      g.scr = new Screen(w, h);
      g.warp('town', 30, 12);
      g.render();
      g.draw_valley(0);
      const text = screenText(g);
      for (const lm of g.valley_landmarks()) assert.ok(text.includes(lm.glyph), `${lm.id} ${lm.glyph}`);
      assert.ok(text.includes('Forge '), 'forge status line');
      assert.ok(text.includes(w < 80 ? '<> pick  ^v region  Enter pin  Esc' : 'Left/Right landmark  Up/Down region  Enter pin  Esc close'), 'whole key hint');
      for (const row of g.scr.buf) assert.equal(row.length, w);
      // the right border of the overlay is intact on the region rows
      for (let y = 1; y < 16; y++) assert.equal(g.scr.buf[y][w - 1][0], '|', `row ${y}: ${rowText(g, y)}`);
    });
  }

  test("Today's Plan shows the forge hours always and the pin when set; the pin survives a reload", () => {
    const g = fresh();
    g.day = 2;
    g.minutes = 12 * 60;
    assert.ok(g.today_lines().includes('  Forge  open until 4PM'));
    g.day = 4; // Thursday
    assert.ok(g.today_lines().includes('  Forge  closed today (Thu); opens tomorrow 10AM'));
    g.day = 7; // Spring 7, 5 PM: the eve of the Spring 8 festival
    g.minutes = 17 * 60;
    assert.ok(g.fest_on(1), 'Spring 8 is a festival');
    assert.ok(!g.today_lines().includes('  Forge  closed for the day; opens tomorrow 10AM'), 'not "tomorrow" on a festival eve');
    g.day = 2;
    g.minutes = 12 * 60;
    g.map_pin = 'museum';
    g.warp('farm', 14, 10);
    assert.ok(g.today_lines().some((l: string) => l.includes('Pin    Museum: east exit to Mineral Town')));
    const h = fresh();
    h.applySaveData(JSON.parse(JSON.stringify(g.snapshot())));
    assert.equal(h.map_pin, 'museum');
    const old = JSON.parse(JSON.stringify(g.snapshot()));
    delete old.map_pin;
    const k = fresh();
    k.applySaveData(old);
    assert.equal(k.map_pin, null);
  });

  test("inside the pinned building you're there; in a mine the pin points up the ladder", () => {
    const g = fresh();
    g.map_pin = 'museum';
    g.warp('in_museum', ...g.interiors.museum.entry);
    assert.equal(g.pin_route().text, "you're there");
    g.map_pin = 'farmhouse';
    g.warp('house', 5, 5);
    assert.equal(g.pin_route().text, "you're there");
    g.map_pin = 'forge';
    g.enter_mine(3, 'spring');
    const r = g.pin_route();
    assert.equal(r.text, "climb out to Mother's Hill");
    assert.equal(g.map.tile(r.cell[0], r.cell[1]), 'up');
    assert.notEqual(r.arrow, '>', 'points at the ladder, not a default arrow');
  });

  test('at 50 columns the on-map pointer uses its short form, whole', () => {
    const g = fresh();
    g.scr = new Screen(50, 24);
    g.warp('farm', 14, 10);
    g.map_pin = 'forge';
    g.render();
    const row = g.scr.buf[1].map((c: any) => c[0]).join(''); // row 0 is the compact top bar
    assert.ok(row.includes('⚒ west exit: Ironwood Grove'), row);
    assert.ok(!row.includes('…'));
  });

  test('the forge reads as closed on its closed day and on festival days', () => {
    const g = fresh();
    g.day = 4; // absday 3: Thursday
    g.minutes = 12 * 60;
    assert.equal(g.weekday, 3);
    assert.equal(g.forge_status().open, false);
    g.day = 2;
    g.fest_on = () => ['Test Festival', 9, 17];
    assert.equal(g.forge_status().open, false);
    g.fest_on = () => null;
    assert.equal(g.forge_status().open, true);
  });
});

describe('the Willow Bend footbridge (task 12)', () => {
  const [SX, SY] = FOOTBRIDGE_SIGN;
  /** Walk the river's south bank (below the road) from the sign's west side; can we reach the dock path? */
  const crosses = (g: any): boolean => {
    const seen = new Set<string>();
    const queue: [number, number][] = [[SX - 1, SY]];
    while (queue.length) {
      const [x, y] = queue.pop()!;
      const k = `${x},${y}`;
      if (seen.has(k) || y < 15 || !g.walkable('river', x, y)) continue;
      seen.add(k);
      if (g.maps.river.tile(x, y) === 'path' && x > SX + 4) return true; // the far-bank path behind the dock
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return false;
  };
  /** Hand Gotz everything the project needs, with Turnips as the crop. */
  const deliverAll = (g: any) => {
    g.give('Lumber', PUBLIC_WORKS.needs.Lumber);
    g.give('Copper', PUBLIC_WORKS.needs.Copper);
    g.give('Turnip', PUBLIC_WORKS.crop_qty);
    for (const i of ['Lumber', 'Copper', 'Turnip']) g.works_deliver(i);
  };
  const sleep = async (g: any) => {
    const said = quiet(g);
    await g.new_day('passout');
    return said;
  };

  test('a washed-out crossing beside a readable sign, reachable from the west bank', async () => {
    const g = fresh();
    const m = g.maps.river;
    assert.equal(m.tile(SX, SY), 'sign');
    assert.equal(m.signs[`${SX},${SY}`], 'footbridge');
    assert.ok(footbridge_cells().some(([x, y]) => x === SX + 1 && y === SY), 'the sign stands beside the water');
    for (const [x, y] of footbridge_cells()) {
      assert.equal(m.tile(x, y), 'water', `${x},${y}`);
      assert.equal(m.tile(x + 1, y) === 'bridge' || footbridge_cells().some(([a, b]) => a === x + 1 && b === y), true, 'the dock planks are east of the gap');
    }
    assert.equal(crosses(g), false, 'no way across below the road yet');
    // read it in game: stand west of the sign, face it, press X
    g.warp('river', SX - 1, SY);
    g.face = [1, 0];
    const said = quiet(g);
    await g.handle('x');
    assert.match(said.join(' '), /washed out.*Gotz could rebuild it/);
  });

  test("Gotz's menu offers the project; partial deliveries count and only what is missing is taken", () => {
    const g = fresh();
    g.give('Lumber', 5);
    assert.equal(g.works_deliver('Lumber'), 5);
    assert.equal(g.inv['Lumber'] ?? 0, 0);
    g.give('Lumber', 10);
    assert.equal(g.works_deliver('Lumber'), 7, 'only the 7 still needed');
    assert.equal(g.inv['Lumber'], 3);
    assert.equal(g.public_works.delivered['Lumber'], 12);
    assert.equal(g.works_deliver('Lumber'), 0, 'lumber is done');
    g.give('Copper', 1);
    g.works_deliver('Copper');
    assert.equal(g.works_line(), 'Gotz needs 1 Copper, 3 of one farm crop');
    assert.equal(g.public_works.done_day, null);
  });

  test('the crop slot takes any one farm crop you carry, then sticks to it', () => {
    const g = fresh();
    g.give('Turnip', 2);
    g.give('Potato', 5);
    g.give('Egg', 4);
    g.give('Grass', 9);
    const offered = g.works_offers().map(([i]: [string, number]) => i).sort();
    assert.deepEqual(offered, ['Potato', 'Turnip'], 'crops only');
    assert.equal(g.works_deliver('Turnip'), 2);
    assert.equal(g.public_works.crop, 'Turnip');
    assert.deepEqual(g.works_offers(), [], 'Potatoes no longer count');
    assert.equal(g.works_deliver('Potato'), 0);
    g.give('Turnip', 4);
    assert.equal(g.works_deliver('Turnip'), 1);
    assert.equal(g.inv['Turnip'], 3);
  });

  test('the menu shows progress and hands over what you carry', async () => {
    const g = fresh();
    const opts = await g.shop_options('carpenter');
    assert.equal(opts[0][0], `Village project: ${PUBLIC_WORKS.name}`);
    g.give('Lumber', 4);
    g.give('Potato', 3);
    const said = quiet(g);
    let info: string[] = [];
    g.menu = async (_t: string, o: string[], _s: number, i: string[]) => {
      info = i;
      return o.indexOf('Hand over 4 Lumber') >= 0 ? o.indexOf('Hand over 4 Lumber') : null;
    };
    await g.works_menu();
    assert.match(said[0], /Basil/, 'Gotz names the neighbour who wants the bridge');
    assert.equal(g.public_works.delivered['Lumber'], 4);
    assert.ok(info.some((l) => l.includes('Lumber 4/12')), info.join('|'));
    assert.ok(info.some((l) => l.includes('Still needed: 8 Lumber')), info.join('|'));
  });

  test('the last delivery starts the build; two nights later the river can be crossed', async () => {
    const g = fresh();
    const f0 = { Gotz: g.friend['Gotz'], Basil: g.friend['Basil'] };
    deliverAll(g);
    assert.equal(g.public_works.done_day, g.absday() + PUBLIC_WORKS.days);
    assert.match(g.works_line(), /^Gotz and Basil are building the footbridge \(done Spring 3\)$/);
    assert.ok(g.today_lines().includes('  Bridge Gotz and Basil are building the footbridge (done Spring 3)'));
    assert.equal(g.valley_landmarks().some((l: any) => l.id === 'footbridge'), false, 'no landmark yet');
    await sleep(g);
    assert.equal(g.public_works.built, false, 'one night is not enough');
    assert.equal(crosses(g), false);
    const said = await sleep(g);
    assert.equal(g.public_works.built, true);
    assert.ok(said.some((t) => t.includes('finished the Willow Bend footbridge')), said.join('|'));
    for (const [x, y] of footbridge_cells()) {
      assert.equal(g.maps.river.tile(x, y), 'bridge');
      assert.equal(g.walkable('river', x, y), true);
    }
    assert.equal(crosses(g), true, 'the west bank reaches the dock path');
    assert.equal(g.friend['Gotz'], f0.Gotz + PUBLIC_WORKS.friend);
    assert.equal(g.friend['Basil'], f0.Basil + PUBLIC_WORKS.friend);
    assert.equal(g.works_line(), null);
    assert.ok(!g.today_lines().some((l: string) => l.includes('Bridge')));
    assert.match(g.footbridge_sign(), /^Willow Bend footbridge — Rebuilt by Gotz, Basil and Pete, Spring 3, Year 1\.$/);
    const opts = await g.shop_options('carpenter');
    assert.ok(!opts.some(([o]: [string]) => o.startsWith('Village project')), 'the project leaves the menu');
  });

  test('the Valley Map shows the footbridge only once it is built', () => {
    const g = fresh();
    const lm = VALLEY_LANDMARKS.find((l) => l.id === 'footbridge')!;
    assert.deepEqual([lm.map, lm.x, lm.y], ['river', SX, SY], 'it stands on the sign');
    assert.ok(!VALLEY_LANDMARKS.some((l) => l !== lm && l.glyph === lm.glyph));
    g.map_pin = 'footbridge';
    assert.equal(g.pin_route(), null, 'cannot route to an unbuilt bridge');
    g.map_pin = null;
    // before the build the map neither draws nor lists it, whichever landmark is selected
    for (const [w, h] of [[80, 24], [50, 24]]) {
      for (let sel = 0; sel < g.valley_landmarks().length; sel++) {
        g.scr = new Screen(w, h);
        g.draw_valley(sel);
        const text = g.scr.buf.map((r: any) => r.map((c: any) => c[0]).join('')).join('\n');
        assert.ok(!text.includes('≡'), `no bridge symbol at ${w}x${h}, selection ${sel}`);
        assert.ok(!text.includes('footbridge'), `no bridge name at ${w}x${h}, selection ${sel}`);
      }
    }
    g.public_works.built = true;
    g.map_pin = 'footbridge';
    assert.ok(g.valley_landmarks().includes(lm));
    assert.ok(g.pin_route());
    for (const [w, h] of [[80, 24], [50, 24]]) {
      g.scr = new Screen(w, h);
      g.draw_valley(g.valley_landmarks().indexOf(lm));
      const text = g.scr.buf.map((r: any) => r.map((c: any) => c[0]).join('')).join('\n');
      assert.ok(text.includes('≡'), `${w}x${h}`);
      assert.ok(text.includes('Willow Bend footbridge'), `${w}x${h}`);
    }
  });

  test('the unbuilt footbridge cannot be chosen or pinned on the Valley Map', async () => {
    const g = fresh();
    g.warp('river', 10, 12);
    // step right 0..N times from the starting landmark, pin whatever is selected, close
    for (let steps = 0; steps <= VALLEY_LANDMARKS.length; steps++) {
      g.map_pin = null;
      for (let i = 0; i < steps; i++) g.scr.pushKey('right');
      g.scr.pushKey('enter');
      g.scr.pushKey('esc');
      await g.valley_map();
      assert.ok(g.map_pin, 'something was pinned');
      assert.notEqual(g.map_pin, 'footbridge', `after ${steps} steps right`);
    }
  });

  test('progress and the built bridge survive a reload; old saves start the project fresh', () => {
    const a = fresh();
    a.give('Lumber', 6);
    a.works_deliver('Lumber');
    const b = new Game(new Screen(132, 30), true) as any;
    b.applySaveData(JSON.parse(JSON.stringify(a.snapshot())));
    assert.deepEqual(b.public_works, a.public_works);
    deliverAll(a);
    a.public_works.done_day = a.absday();
    a.works_day();
    a.save(2);
    const c = new Game(new Screen(132, 30), true) as any;
    c.load(2);
    assert.equal(c.public_works.built, true);
    for (const [x, y] of footbridge_cells()) assert.equal(c.maps.river.tile(x, y), 'bridge', 'tiles re-applied on load');
    assert.ok(c.valley_landmarks().some((l: any) => l.id === 'footbridge'));
    // an older save, loaded into the same game: the project is open again and the water is back
    const old = JSON.parse(store['hrvstmn-save-2']);
    delete old.public_works;
    c.applySaveData(old);
    assert.deepEqual(c.public_works, { delivered: {}, crop: null, done_day: null, built: false });
    for (const [x, y] of footbridge_cells()) assert.equal(c.maps.river.tile(x, y), 'water');
    assert.equal(c.works_line(), 'Gotz needs 12 Lumber, 2 Copper, 3 of one farm crop');
  });
});

describe('Cedar Hollow hedge gate (task 34)', () => {
  const sign = (g: any, map: string, xy: readonly number[]) => g.maps[map].signs[`${xy[0]},${xy[1]}`];
  const toBeach = (g: any) => Object.values(g.maps.woods.warps).filter((w: any) => w[0] === 'beach');
  const toWoods = (g: any) => Object.values(g.maps.beach.warps).filter((w: any) => w[0] === 'woods');
  /** Stand at the beach latch, answer the prompt with `keys`, and lift (or not). */
  const atLatch = async (g: any, keys: string[]) => {
    g.warp('beach', HEDGE_GATE.beachSign[0] + 1, HEDGE_GATE.beachSign[1], [-1, 0]);
    for (const k of keys) g.scr.pushKey(k);
    await g.interact();
  };
  const isOpen = (g: any) => g.shortcuts.includes('hollow_gate') && toBeach(g).length === 3 && toWoods(g).length === 3;

  test('shut at first: the hedge is closed and the way to the beach runs through the farm', () => {
    const g = fresh();
    const m = g.maps.woods;
    for (let y = HEDGE_GATE.at; y < HEDGE_GATE.at + 3; y++) {
      assert.equal(g.walkable('woods', m.w - 1, y), false, `hedge at ${y}`);
      assert.equal(m.tile(m.w - 3, y), 'grass', 'the clearing runs up to the hedge');
    }
    assert.equal(toBeach(g).length, 0);
    assert.equal(toWoods(g).length, 0);
    assert.ok(!g.valley_links().woods.includes('beach'));
    g.map_pin = 'pier';
    g.warp('woods', 45, 19);
    assert.equal(g.pin_route().text, 'north exit to Your Farm, toward Mineral Beach');
    assert.deepEqual(g.shortcuts, []);
  });

  test('the Cedar Hollow sign only describes the gate', async () => {
    const g = fresh();
    const said = quiet(g);
    g.warp('woods', HEDGE_GATE.woodsSign[0], HEDGE_GATE.woodsSign[1] + 1, [0, -1]);
    assert.equal(g.maps.woods.tile(g.px, g.py), 'grass', 'the sign is read from the clearing');
    await g.interact();
    assert.match(said[0], /latched fast from the other side/);
    assert.deepEqual(g.shortcuts, []);
    assert.equal(toBeach(g).length, 0);
  });

  test('declining at the latch leaves the gate shut', async () => {
    const g = fresh();
    await atLatch(g, ['down', 'enter']);
    assert.deepEqual(g.shortcuts, []);
    await atLatch(g, ['esc']);
    assert.equal(isOpen(g), false);
    assert.ok(g.msgs.some(([t]: [string]) => t.includes('leave the old gate latched')));
  });

  test('lifting the latch opens a 3-wide gate both ways, renames both signs and plays feedback', async () => {
    const g = fresh();
    await atLatch(g, ['enter']);
    assert.ok(isOpen(g));
    assert.ok(g.msgs.some(([t]: [string]) => t.includes('short way to Cedar Hollow')));
    assert.ok(g.fx.some((f: any) => f.map === 'beach' && f.x === 0 && f.kind === 'dust'));
    assert.equal(sign(g, 'woods', HEDGE_GATE.woodsSign), 'Hedge gate — the short way to Mineral Beach');
    assert.equal(sign(g, 'beach', HEDGE_GATE.beachSign), 'Hedge gate — the short way to Cedar Hollow');
    // walk east out of the hollow onto the beach...
    const mid = HEDGE_GATE.at + 1;
    g.warp('woods', g.maps.woods.w - 2, mid, [1, 0]);
    await g.move(1, 0);
    assert.equal(g.mapname, 'beach');
    assert.ok(g.walkable('beach', g.px, g.py), `landed on open sand at ${g.px},${g.py}`);
    // ...and west back again
    await g.move(-1, 0);
    assert.equal(g.mapname, 'woods');
    assert.ok(g.walkable('woods', g.px, g.py));
    assert.deepEqual([g.px, g.py], [g.maps.woods.w - 2, mid]);
    // the latch sign now just names the shortcut; reading it again does not re-open anything
    const said = quiet(g);
    await atLatch(g, []);
    assert.deepEqual(said, ['Hedge gate — the short way to Cedar Hollow']);
    assert.deepEqual(g.shortcuts, ['hollow_gate']);
  });

  test('the valley map links the hollow and the beach, and the pin uses the gate', async () => {
    const g = fresh();
    g.scr = new Screen(80, 24);
    g.warp('woods', 45, 19);
    // with an 80-column screen the region boxes are 19 wide from x=2: the woods/beach gap is x=39, row 14
    g.draw_valley(0);
    assert.equal(g.scr.buf[14][39][0], ' ', 'no connector while shut');
    await atLatch(g, ['enter']);
    assert.ok(g.valley_links().woods.includes('beach'));
    assert.ok(g.valley_links().beach.includes('woods'));
    g.warp('woods', 45, 19);
    g.map_pin = 'pier';
    const r = g.pin_route();
    assert.equal(r.text, 'east exit to Mineral Beach');
    assert.equal(r.cell[0], g.maps.woods.w - 1);
    g.render();
    g.draw_valley(0);
    assert.equal(g.scr.buf[14][39][0], '═', 'connector between the woods and beach boxes');
  });

  test('the gate stays open across a save and reload; old saves and new farms start shut', async () => {
    const g = fresh();
    await atLatch(g, ['enter']);
    g.save(2);
    const b = new Game(new Screen(132, 30), true) as any;
    b.load(2);
    assert.ok(isOpen(b), 'rebuilt maps carry the gate again');
    assert.equal(sign(b, 'beach', HEDGE_GATE.beachSign), 'Hedge gate — the short way to Cedar Hollow');
    // an old save without the field loads shut, even into a game whose gate was open
    const old = JSON.parse(store['hrvstmn-save-2']);
    delete old.shortcuts;
    b.applySaveData(old);
    assert.deepEqual(b.shortcuts, []);
    assert.equal(toBeach(b).length, 0);
    assert.equal(b.walkable('woods', b.maps.woods.w - 1, HEDGE_GATE.at + 1), false);
    assert.equal(sign(b, 'beach', HEDGE_GATE.beachSign), 'hedge_latch');
    // unknown ids are dropped
    b.applySaveData({ ...old, shortcuts: ['hollow_gate', 'nowhere'] });
    assert.deepEqual(b.shortcuts, ['hollow_gate']);
    // a new farm starts with the gate shut
    g.new_game('Pete', 'Moon');
    assert.equal(isOpen(g), false);
    assert.equal(toWoods(g).length, 0);
  });

  test('with the gate open, a pin with two equally short ways points to the exit nearer you', async () => {
    const g = fresh();
    await atLatch(g, ['enter']);
    assert.ok(isOpen(g));
    // Cedar Hollow -> town is two regions either way (via the farm, or via the beach)
    g.map_pin = 'supermarket';
    g.warp('woods', 30, 2); // by the north entrance
    assert.equal(g.pin_route().text, 'north exit to Your Farm, toward Mineral Town');
    g.warp('woods', g.maps.woods.w - 3, HEDGE_GATE.at + 1); // by the gate
    assert.equal(g.pin_route().text, 'east exit to Mineral Beach, toward Mineral Town');
    // town -> Poultry Farm: west through the farm from the west end, south through the beach from the south gate
    g.map_pin = 'poultry';
    g.warp('town', 3, 6);
    assert.equal(g.pin_route().text, 'west exit to Your Farm, toward Cedar Hollow');
    g.warp('town', 35, 29);
    assert.equal(g.pin_route().text, 'south exit to Mineral Beach, toward Cedar Hollow');
  });

  test('the latch prompt reads cleanly at 50 columns', async () => {
    const g = fresh();
    g.scr = new Screen(50, 24);
    g.warp('beach', HEDGE_GATE.beachSign[0] + 1, HEDGE_GATE.beachSign[1], [-1, 0]);
    let shown = '';
    const modal = g.modal.bind(g);
    g.modal = async (draw: () => void) => {
      g.render();
      draw();
      shown = g.scr.buf.map((r: any) => r.map((c: any) => c[0]).join('')).join('\n');
      return 'esc';
    };
    await g.hedge_latch();
    g.modal = modal;
    for (const line of ['An old field gate in the hedge.', 'Its latch is on this side, stiff with salt.', 'Beyond it, the woods.']) {
      assert.ok(shown.includes(line), `whole line: ${line}`);
    }
  });
});

describe('Saturday stall in Rose Square (task 09)', () => {
  /** A fresh game on the first Saturday morning, standing at the stall with goods to sell. */
  const saturday = () => {
    const g = fresh();
    g.day = 6;
    g.minutes = 9 * 60;
    g.weather = 'Sunny';
    g.inv = { Turnip: 8, Egg: 3, 'Small Fish': 2, 'Turnip Seeds': 4 };
    g.warp('town', STALL_SPOT[0], STALL_SPOT[1] + 1, [0, -1]);
    return g;
  };
  /** Run fn with every random roll at zero: the first villager in the crowd comes, and plain goods sell. */
  const steady = async (fn: () => Promise<void>) => {
    const real = Math.random;
    Math.random = () => 0;
    try {
      await fn();
    } finally {
      Math.random = real;
    }
  };

  test('the stall stands in Rose Square and can be stocked only on a Saturday morning', () => {
    const g = saturday();
    assert.equal(g.weekday, 5, 'Spring 6 is a Saturday');
    assert.equal(g.maps.town.tile(STALL_SPOT[0], STALL_SPOT[1]), 'stall');
    assert.equal(g.walkable('town', STALL_SPOT[0], STALL_SPOT[1]), false);
    for (const x of [35, 36, 37]) assert.equal(g.maps.town.tile(x, STALL_SPOT[1]), 'path', 'the road to the beach stays clear');
    assert.deepEqual(g.context_action(), { key: 'x', label: 'STALL' });
    assert.equal(g.stall_state(), 'ready');
    g.minutes = 12 * 60;
    assert.equal(g.stall_state(), 'shut', 'too late after noon');
    g.minutes = 9 * 60;
    g.day = 5;
    assert.equal(g.stall_state(), 'shut', 'not on a Friday');
    g.day = 6;
    g.fest_on = () => ['Spring Fair', 10, 18, ''];
    assert.equal(g.stall_state(), 'shut', 'no market on a festival day');
  });

  test('up to three kinds of produce or food go out, five of each at most', () => {
    const g = saturday();
    assert.deepEqual(g.stall_pool(), ['Egg', 'Small Fish', 'Turnip'], 'seed bags are not market goods');
    g.inv.Potato = 2;
    assert.equal(g.stall_open([['Turnip Seeds', 2]]), false, 'nothing sellable was picked');
    assert.equal(g.stall_open([['Turnip', 9], ['Egg', 2], ['Small Fish', 2], ['Potato', 2]]), true);
    assert.deepEqual(g.stall.goods, [
      { item: 'Turnip', qty: 5, sold: 0 },
      { item: 'Egg', qty: 2, sold: 0 },
      { item: 'Small Fish', qty: 2, sold: 0 },
    ]);
    assert.deepEqual([g.inv.Turnip, g.inv.Egg, g.inv['Small Fish'], g.inv.Potato], [3, 1, undefined, 2], 'the goods left the rucksack');
    assert.equal(g.stall_state(), 'open');
    assert.equal(g.stall_open([['Potato', 1]]), false, 'one stall a day');
  });

  test('shoppers come by on the hour, and at 5 PM the stall pays out and reports', async () => {
    const g = saturday();
    const gold = g.gold;
    g.stall_open([['Turnip', 5], ['Egg', 3], ['Small Fish', 2]]);
    await steady(async () => {
      await g.advance(30);
      assert.equal(g.stall.seen.length, 0, 'nobody before the hour');
      await g.advance(30);
      assert.equal(g.stall.seen.length, 1, 'one caller at 10 AM');
      await g.advance(6 * 60); // through 4 PM
      assert.equal(g.stall.seen.length, 7);
      assert.equal(new Set(g.stall.seen).size, 7, 'each villager comes by once');
    });
    const sold = g.stall.goods.reduce((n: number, x: any) => n + x.sold, 0);
    const shipValue = g.stall.goods.reduce((n: number, x: any) => n + x.sold * ITEMS[x.item][0], 0);
    const takings = g.stall.gold;
    assert.ok(sold >= 1 && takings > shipValue, `the stall pays over the shipping price (${takings}G for ${shipValue}G of goods)`);
    assert.equal(g.gold, gold, 'takings are banked at closing');
    assert.match(g.today_lines().join('\n'), /Market: your stall is open until 5 ?PM/i);
    for (let i = 0; i < 4; i++) g.scr.pushKey('enter');
    await g.advance(60); // 5 PM
    assert.equal(g.stall, null);
    assert.equal(g.gold, gold + takings);
    assert.deepEqual(g.stall_last, [g.absday(), takings]);
    assert.equal(g.stall_earned, takings);
    assert.equal(g.stall_state(), 'done');
    const back = (g.inv.Turnip || 0) + (g.inv.Egg || 0) + (g.inv['Small Fish'] || 0);
    assert.equal(back, 8 + 3 + 2 - sold, 'unsold goods are back in the rucksack');
    assert.match(g.today_lines().join('\n'), new RegExp(`Market: you took ${takings}G`));
  });

  test('a villager who loves a good pays most for it and warms to you', async () => {
    const g = saturday();
    const fan = Object.keys(NPCS).sort().find((n) => NPCS[n].out && NPCS[n].where?.[0] !== 'mountain')!;
    const loved = NPCS[fan].loves.find((i: string) => ITEMS[i] && ITEMS[i][0] > 0 && ['crop', 'forage', 'fish', 'animal', 'food', 'dish'].includes(ITEMS[i][2]));
    assert.ok(loved, `${fan} loves something a stall can carry`);
    g.inv = { [loved]: 3 };
    g.friend[fan] = 10;
    g.stall_open([[loved, 3]]);
    await steady(async () => g.advance(60));
    assert.deepEqual(g.stall.seen, [fan]);
    assert.equal(g.stall.goods[0].sold, 2);
    assert.equal(g.stall.gold, Math.round(ITEMS[loved][0] * 1.5) * 2);
    assert.equal(g.friend[fan], 12);
    assert.match(g.stall.log[0], /My favourite/);
  });

  test('stocking the stall through its menu, then packing up early from it', async () => {
    const g = saturday();
    for (const k of ['enter', 'enter', 'enter', 'down', 'enter']) g.scr.pushKey(k); // put out a good > first good > how many > open
    await g.interact();
    assert.equal(g.stall_state(), 'open');
    assert.equal(g.stall.goods.length, 1);
    assert.deepEqual(g.stall.goods[0], { item: 'Egg', qty: 3, sold: 0 });
    for (const k of ['enter', 'enter', 'enter', 'enter']) g.scr.pushKey(k); // status page > yes, pack up > report
    await g.interact();
    assert.equal(g.stall, null);
    assert.equal(g.inv.Egg, 3, 'nothing sold yet, so it all came back');
    assert.equal(g.stall_state(), 'done');
  });

  test('an open stall survives a save, and turning in early packs it up', async () => {
    const g = saturday();
    g.stall_open([['Turnip', 4]]);
    await steady(async () => g.advance(60));
    g.save(2);
    const b = new Game(new Screen(132, 30), true) as any;
    b.load(2);
    assert.deepEqual(b.stall, g.stall);
    assert.equal(b.stall_state(), 'open');
    const gold = b.gold;
    const takings = b.stall.gold;
    const left = b.stall.goods[0].qty - b.stall.goods[0].sold;
    for (let i = 0; i < 12; i++) b.scr.pushKey('enter');
    await b.new_day('sleep');
    assert.equal(b.stall, null);
    assert.equal(b.gold, gold + takings);
    assert.equal(b.inv.Turnip || 0, 4 + left, 'the four still in the rucksack, plus what did not sell');
  });
});

describe('renderer context', () => {
  test('render() hands the renderer the day of the season, for late-season blending', () => {
    const g = fresh();
    g.day = 29;
    g.warp('farm', 14, 10);
    g.render();
    assert.equal(g.scr.ctx.day, 29);
  });
});

describe('leaving the game takes a deliberate choice', () => {
  /** Feed keys one at a time, letting the engine settle between them, then report where it stands. */
  const play = async (g: any, keys: string[]) => {
    for (const k of keys) {
      g.scr.pushKey(k);
      await new Promise((r) => setTimeout(r, 5));
    }
  };
  /** Run the engine in the background and stop it when the test is done. */
  const session = async (autostart: boolean, body: (g: any) => Promise<void>) => {
    const g = new Game(new Screen(132, 30), autostart) as any;
    const done = g.run();
    try {
      await body(g);
    } finally {
      g.running = false;
      g.scr.pushKey('esc');
      await done;
    }
  };

  test('Esc, Q, Backspace and wrapping past the last entry never leave the title screen', async () => {
    await session(false, async (g) => {
    await play(g, ['esc', 'q', 'backspace', 'ctrl-c', 'up', 'esc']);
    assert.equal(g.running, true);
    assert.equal(g.started, false);
    assert.ok(g.modal_depth > 0, 'the title menu is still open');
    });
  });

  test('the title menu has no Quit entry', async () => {
    await session(false, async (g) => {
    await play(g, ['up']);
    const rows = g.scr.buf.map((row: any[]) => row.map((c: any) => c[0]).join(''));
    assert.ok(rows.some((r: string) => r.includes('New Game')));
    assert.ok(!rows.some((r: string) => /Quit/.test(r)));
    });
  });

  test('mashing a confirm key through the Diary Quit entry keeps the game going', async () => {
    for (const ok of ['enter', 'space', 'x', 'e', 'z']) {
      await session(true, async (g) => {
      await play(g, ['esc', 'up', ok, ok, ok]); // Diary > wrap up to Quit > select > confirm > confirm
      assert.equal(g.running, true, ok);
      assert.equal(g.to_title, false, ok);
      assert.equal(g.started, true, ok);
      });
    }
  });

  test('Shift+Q then a tool, talk or number key keeps the game going', async () => {
    for (const next of ['space', 'x', 'e', 'enter', 'z', '1', '2', 'esc', 'q']) {
      await session(true, async (g) => {
      await play(g, ['Q', next]);
      assert.equal(g.to_title, false, next);
      assert.equal(g.started, true, next);
      });
    }
  });

  test('Ctrl+C no longer asks to quit', async () => {
    await session(true, async (g) => {
    await play(g, ['ctrl-c']);
    assert.equal(g.modal_depth, 0);
    });
  });

  test('choosing Save & quit saves and returns to the title screen, where Continue resumes', async () => {
    await session(true, async (g) => {
    g.gold = 4321;
    await play(g, ['Q', 'down', 'enter']);
    assert.equal(g.running, true, 'the engine keeps running');
    assert.equal(g.started, false, 'back on the title screen');
    assert.equal(JSON.parse(store['hrvstmn-save']).gold, 4321);
    g.gold = 0;
    await play(g, ['enter', 'enter']); // Continue (Diary Slot 1) > welcome back
    assert.equal(g.started, true);
    assert.equal(g.gold, 4321);
    });
  });
});

describe('fishing and the request board', () => {
  /** Fish one cast with a scripted clock: `keys(t)` says which key (if any) arrives t seconds after the cast. */
  const cast = async (keys: (t: number) => string | null) => {
    const g = fresh();
    const [realNow, realRandom] = [Date.now, Math.random];
    let now = 5_000_000;
    Date.now = () => now;
    Math.random = () => 0; // the bite comes exactly 1.0 s after the cast
    const start = now;
    g.scr.getKey = async () => {
      now += 50;
      return keys((now - start) / 1000);
    };
    try {
      await g.fish();
    } finally {
      Date.now = realNow;
      Math.random = realRandom;
    }
    return g.msgs.map((m: [string, string]) => m[0]).join(' | ');
  };
  const once = (at: number, key: string) => (t: number) => (Math.abs(t - at) < 0.026 ? key : null);

  test('a cast key that is still held down does not reel the line in early', async () => {
    // Space held for 0.9 s: the first repeat after 0.3 s, then one every 50 ms; a fresh press on the bite
    const held = (t: number) => (t >= 0.3 && t <= 0.9 ? 'space' : Math.abs(t - 1.3) < 0.026 ? 'space' : null);
    const log = await cast(held);
    assert.ok(!log.includes('too early'), log);
    assert.match(log, /caught|rare catch/);
  });

  test('a fresh press before the bite is still too early, and a press on the bite lands it', async () => {
    assert.match(await cast(once(0.8, 'space')), /too early/);
    assert.match(await cast(once(1.4, 'x')), /caught|rare catch/);
    assert.match(await cast(() => null), /got away/);
  });

  test('brushing a movement key while waiting does not pull the line in', async () => {
    const log = await cast((t) => (Math.abs(t - 0.8) < 0.026 ? 'left' : Math.abs(t - 1.3) < 0.026 ? 'space' : null));
    assert.ok(!log.includes('too early'), log);
    assert.match(log, /caught|rare catch/);
  });

  test('every fish the board can ask for bites somewhere today with the rod in hand', () => {
    const g = fresh();
    for (let season = 0; season < 4; season++) for (const rod of [0, 1, 2, 3, 4, 5]) for (const weather of ['Sunny', 'Rain']) {
      g.season = season;
      g.weather = weather;
      g.levels['Fishing Rod'] = rod;
      const guide = new Map(g.fishing_guide().map((f: any) => [f.item, f]));
      for (const item of g.request_pool()) {
        if (ITEMS[item][2] !== 'fish') continue;
        const f: any = guide.get(item);
        assert.ok(f && f.chance >= 0.1, `${item} in ${SEASONS[season]} with rod ${rod}`);
        // and it really comes out of the water there
        const map = Object.keys(g.maps).find((m) => g.maps[m].title === f.where.split(' or ')[0]) ?? 'farm';
        assert.ok(g.catch_odds(map).some((o: [string, number]) => o[0] === item), `${item} bites at ${map}`);
      }
    }
  });

  test('fish nothing in the valley gives are never requested', () => {
    const g = fresh();
    const never = ['Monkfish', 'Spa Catfish', 'Coelacanth'];
    for (let season = 0; season < 4; season++) {
      g.season = season;
      g.levels['Fishing Rod'] = 5;
      const pool = g.request_pool();
      for (const item of never) assert.ok(!pool.includes(item), `${item} in ${SEASONS[season]}`);
      assert.ok(pool.includes('Small Fish') && pool.includes('Large Fish'));
    }
    g.season = 0;
    g.levels['Fishing Rod'] = 0;
    const pool = g.request_pool();
    assert.ok(pool.includes('Willow Chub') && pool.includes('Mackerel'), 'the river and the sea in spring');
    for (const item of ['Burbot', 'Sea Bass', 'Carp', 'Catfish', 'Squid', 'Elder Sturgeon', 'Storm Marlin']) {
      assert.ok(!pool.includes(item), `${item} needs another season or a better rod`);
    }
    g.season = 3;
    assert.ok(g.request_pool().includes('Burbot'), 'burbot in winter');
  });

  test('forage is asked for only in the season it grows; crops only when you grow or hold them', () => {
    const g = fresh();
    g.season = 3;
    const winter = g.request_pool();
    assert.ok(winter.includes('White Grass') && !winter.includes('Bamboo Shoot') && !winter.includes('Blackberry'));
    g.season = 0;
    assert.ok(g.request_pool().includes('Bamboo Shoot'));
    assert.ok(!g.request_pool().includes('Turnip'), 'nothing planted yet');
    g.crops['10,10'] = ['Turnip', 0];
    assert.ok(g.request_pool().includes('Turnip'), 'a crop in the ground');
    delete g.crops['10,10'];
    g.inv['Potato'] = 2;
    assert.ok(g.request_pool().includes('Potato'), 'a crop in the rucksack');
    g.inv['Tomato'] = 2;
    assert.ok(!g.request_pool().includes('Tomato'), 'summer crops wait for summer');
  });

  test('requests are for obtainable things, a scarce fish is asked for one at a time, and each has a source line', () => {
    const g = fresh();
    g.levels['Fishing Rod'] = 4; // squid off the beach at 12%: allowed, but scarce
    let squid = 0;
    for (let i = 0; i < 400; i++) {
      g.requests = [];
      g.request_refresh(3);
      assert.equal(g.requests.length, 3);
      for (const r of g.requests) {
        assert.ok(g.request_source(r.item), `${r.item} has a source`);
        if (r.item === 'Squid') {
          squid++;
          assert.equal(r.qty, 1);
        }
      }
    }
    assert.ok(squid > 0);
    assert.match(g.request_source('Willow Chub'), /^Fish: Willow Bend, about \d+ in 10 catches\.$/);
    assert.match(g.request_source('Small Fish'), /^Fish: /);
    assert.equal(g.request_source('Monkfish'), null);
    assert.match(g.request_source('Bamboo Shoot'), /^Forage: /);
  });

  test('loading a save drops requests nothing can fill and keeps the rest', () => {
    const g = fresh();
    g.requests = [
      { id: 1, npc: 'Ann', item: 'Monkfish', qty: 2, reward: 100, deadline: g.absday() + 2 },
      { id: 2, npc: 'Gray', item: 'Small Fish', qty: 1, reward: 100, deadline: g.absday() + 2 },
      { id: 3, npc: 'Mary', item: 'Spa Catfish', qty: 1, reward: 100, deadline: g.absday() + 2 },
    ];
    g.inv['Spa Catfish'] = 1; // already in the bag, so that one can still be handed over
    g.save(1);
    const h = fresh();
    h.load(1);
    assert.deepEqual(h.requests.map((r: any) => r.item), ['Small Fish', 'Spa Catfish']);
  });
});

describe('context action reticle', () => {
  test('farmhouse exit interaction is marked, then modal and typing actions clear it', () => {
    const g: Game = fresh();
    g.warp('house', 7, 8, [0, 1]); // faced farmhouse exit at 7,9
    g.render();
    const isExit = (tag: (typeof g.scr.tags)[number][number]) => tag?.wx === 7 && tag?.wy === 9;
    const target = () => g.scr.tags.flat().find(isExit);
    assert.equal(g.context_action().label, 'ENTER');
    assert.equal(target()?.actionTarget, true);
    const index = g.scr.tags.flat().findIndex(isExit);
    const marked = computeFrame(g.scr, 0).flat()[index];
    assert.equal(marked.aoePrimary, true, 'uses the existing primary corner bracket');
    assert.equal(marked.actionReticle, true, 'marker metadata reaches renderer');

    g.modal_depth = 1;
    g.render();
    assert.equal(g.context_action().label, 'OK');
    assert.equal(target()?.actionTarget, undefined);
    const plain = computeFrame(g.scr, 0).flat()[index];
    assert.equal(plain.actionReticle, undefined);
    assert.equal(plain.ch, marked.ch, 'action marker leaves the target glyph intact');
    g.modal_depth = 0;
    g.typing = true;
    g.render();
    assert.equal(g.context_action().label, 'DONE');
    assert.equal(target()?.actionTarget, undefined);
  });

  test('generic Hoe use keeps the ordinary primary preview without action emphasis', () => {
    const g: Game = fresh();
    g.warp('farm', 14, 10, [1, 0]);
    g.tool = 'Hoe';
    g.render();
    assert.equal(g.context_action().label, 'USE HOE');
    const index = g.scr.tags.flat().findIndex((tag) => tag?.wx === 15 && tag?.wy === 10);
    const tag = g.scr.tags.flat()[index];
    const out = computeFrame(g.scr, 0).flat()[index];
    assert.equal(tag?.hl, true);
    assert.equal(tag?.actionTarget, undefined);
    assert.equal(out.aoePrimary, true);
    assert.equal(out.actionReticle, undefined);
  });
});

describe('the camera stays on the map', () => {
  test('waking at home after collapsing outdoors on a phone-sized screen does not crash', async () => {
    const g = new Game(new Screen(44, 30), true) as any;
    g.new_game('Pete', 'Moon');
    // stand somewhere on the farm where the camera has scrolled a few rows down
    let found = false;
    for (let y = 8; y < g.maps.farm.h - 2 && !found; y++) for (let x = 3; x < g.maps.farm.w - 3 && !found; x++) {
      if (!g.walkable('farm', x, y)) continue;
      g.warp('farm', x, y);
      g.render();
      found = g.cam_y >= 1 && g.cam_y <= 6;
    }
    assert.ok(found, 'a scrolled camera position on the farm');
    for (let i = 0; i < 60; i++) g.scr.pushKey('enter'); // read through the morning report
    await g.new_day('passout');
    assert.equal(g.mapname, 'house');
    assert.doesNotThrow(() => g.render());
    assert.equal(g.scr.ctx.view.h, g.maps.house.h, 'the whole farmhouse is drawn');
  });
});

describe('market regulars at the stall (task 10)', () => {
  /** Monday of the first week, Spring Y1: the market is on Spring 6. */
  const monday = () => {
    const g = fresh();
    g.day = 1;
    g.minutes = 8 * 60;
    g.weather = 'Sunny';
    return g;
  };
  /** The same game moved on to market morning, at the stall. */
  const toSaturday = (g: any) => {
    g.day = 6;
    g.minutes = 9 * 60;
    g.warp('town', STALL_SPOT[0], STALL_SPOT[1] + 1, [0, -1]);
  };
  /** Run fn with the ordinary villagers already gone by, so only the regulars shop. */
  const steady = async (g: any, fn: () => Promise<void>) => {
    const real = Math.random;
    Math.random = () => 0.99;
    g.stall.seen = Object.keys(NPCS);
    try {
      await fn();
    } finally {
      Math.random = real;
    }
  };

  test("the week's lists are in Today's Plan from Monday, and on the market sign", async () => {
    const g = monday();
    const w = g.market_wants();
    assert.equal(g.market_next(), g.absday(1, 0, 6), 'the next market is Saturday');
    const today = g.today_lines().join('\n');
    assert.match(today, new RegExp(`Saturday regulars: Doug wants ${w.pantry.join(' and ')}; Lillia wants an? ${w.flower}`));
    const said: string[] = [];
    g.say = async (text: string) => { said.push(text); };
    g.warp('town', STALL_SPOT[0], STALL_SPOT[1] + 1, [0, -1]);
    await g.interact();
    assert.match(said.join(' '), new RegExp(`This Saturday: Doug wants ${w.pantry[0]}`));
    g.day = 4;
    assert.deepEqual(g.market_wants(), w, 'the list holds all week');
    g.day = 13;
    assert.notEqual(JSON.stringify(g.market_wants()), JSON.stringify(w), 'next week brings a new list (for these two weeks)');
  });

  test('the stocking menu shows the lists and marks the goods a regular wants', async () => {
    const g = monday();
    const w = g.market_wants();
    toSaturday(g);
    g.inv = { [w.pantry[0]]: 4, [w.flower]: 2, 'Small Fish': 3 };
    const menus: { title: string; opts: string[]; info: any }[] = [];
    g.menu = async (title: string, opts: string[], _sel = 0, info: any = null) => {
      menus.push({ title, opts, info: typeof info === 'function' ? info(0) : info });
      return menus.length === 1 ? opts.indexOf('Put out a good...') : null;
    };
    await g.interact();
    assert.ok(menus[0].info.some((l: string) => l.startsWith('Regulars: Doug wants')), 'the lists in the stall menu');
    const picker = menus[1].opts;
    assert.ok(picker.find((o) => o.startsWith(w.pantry[0]))!.endsWith('Doug wants this'));
    assert.ok(picker.find((o) => o.startsWith(w.flower))!.endsWith('Lillia wants this'));
    assert.ok(!picker.find((o) => o.startsWith('Small Fish'))!.includes('wants this'));
  });

  test('Doug comes at noon and Lillia at 3 PM, and each buys from their list at a premium', async () => {
    const g = monday();
    const w = g.market_wants();
    toSaturday(g);
    g.inv = { [w.pantry[0]]: 5, [w.flower]: 3, 'Small Fish': 3 };
    const [dougFriend, lilliaFriend] = [g.friend.Doug || 0, g.friend.Lillia || 0];
    g.stall_open([[w.pantry[0], 5], [w.flower, 3], ['Small Fish', 3]]);
    await steady(g, async () => {
      await g.advance(3 * 60); // to noon
      assert.deepEqual(g.stall.callers, ['Doug']);
      assert.equal(g.stall.goods[0].sold, 3, 'three of a staple he wanted');
      assert.equal(g.stall.goods[1].sold, 0, 'not the flower');
      assert.equal(g.stall.gold, Math.round(ITEMS[w.pantry[0]][0] * 1.6) * 3);
      await g.advance(3 * 60); // to 3 PM
      assert.deepEqual(g.stall.callers, ['Doug', 'Lillia']);
      assert.equal(g.stall.goods[1].sold, 2, 'two of the flower she hoped for');
    });
    assert.equal(g.friend.Doug, dougFriend + 3);
    assert.equal(g.friend.Lillia, lilliaFriend + 3);
    assert.ok(g.stall.log.some((l: string) => l.startsWith('Doug: "Just what')));
    assert.ok(g.stall.log.some((l: string) => l.startsWith('Lillia: "You found one!')));
  });

  test('a regular whose list is not on the stall leaves without, and says what they came for', async () => {
    const g = monday();
    const w = g.market_wants();
    toSaturday(g);
    g.inv = { 'Small Fish': 3 };
    g.stall_open([['Small Fish', 3]]);
    await steady(g, async () => g.advance(6 * 60));
    assert.equal(g.stall.goods[0].sold, 0);
    assert.equal(g.stall.gold, 0);
    assert.ok(g.stall.log.includes(`Doug came for ${w.pantry.join(' and ')} for the inn, and left without.`));
    assert.ok(g.stall.log.some((l: string) => l.startsWith(`Lillia hoped for a`) && l.includes(w.flower)));
  });

  test('in winter Lillia stays home and Doug asks for eggs and a preserve (task 31)', () => {
    const g = monday();
    g.season = 3;
    g.day = 1;
    const w = g.market_wants();
    assert.equal(w.flower, null);
    assert.equal(w.pantry.length, 2);
    assert.ok(PRESERVES.includes(w.pantry[0]), w.pantry.join(', '));
    assert.equal(w.pantry[1], 'Egg', 'nothing grows in winter, so the other pick is eggs');
    assert.equal(g.market_clue(), `Doug wants ${w.pantry[0]} and Egg.`);
  });

  test('no clue for a Saturday that is a festival, since there is no market', () => {
    const g = monday();
    const real = g.fest_on.bind(g);
    g.fest_on = (offset = 0) => (offset === 5 ? ['Spring Fair', 10, 18, ''] : real(offset));
    assert.equal(g.market_clue(), null);
    assert.ok(!/Saturday regulars/.test(g.today_lines().join('\n')));
  });

  test('an open stall from an older save (no callers yet) still gets its regulars', async () => {
    const g = monday();
    const w = g.market_wants();
    toSaturday(g);
    g.inv = { [w.pantry[0]]: 3 };
    g.stall_open([[w.pantry[0], 3]]);
    delete g.stall.callers;
    g.save(2);
    const b = new Game(new Screen(132, 30), true) as any;
    b.load(2);
    await steady(b, async () => b.advance(3 * 60));
    assert.deepEqual(b.stall.callers, ['Doug']);
    assert.equal(b.stall.goods[0].sold, 3);
  });
});

describe('companion planting (task 17)', () => {
  const RIPE = (crop: string) => CROPS[crop][2];
  /** A spring farm with a tilled 7x3 strip at (20..26, 14..16), the player facing (21, 15) from the left. */
  const field = () => {
    const g = fresh();
    g.season = 0;
    g.day = 3;
    g.minutes = 9 * 60;
    for (let y = 14; y <= 16; y++) for (let x = 20; x <= 26; x++) {
      const k = `${x},${y}`;
      delete g.objs.farm[k];
      g.tilled.add(k);
    }
    g.warp('farm', 19, 15, [1, 0]);
    [g.px, g.py] = [20, 15]; // on the strip's first tile, facing (21, 15)
    return g;
  };
  const plant = (g: any, x: number, y: number, crop: string, age: number) => { g.crops[`${x},${y}`] = [crop, age]; };

  test('a Cucumber beside a Moondrop in bloom gives two a picking, and keeps regrowing', async () => {
    const g = field();
    plant(g, 21, 15, 'Cucumber', RIPE('Cucumber'));
    plant(g, 22, 16, 'Moondrop Flower', RIPE('Moondrop Flower')); // diagonal counts
    assert.equal(g.companion_bonus('21,15'), COMPANION.bonus);
    g.inv = {};
    await g.interact();
    assert.equal(g.inv.Cucumber, 2);
    assert.match(g.msgs.at(-1)[0], /You harvested 2 Cucumber! The Moondrop Flower beside it drew the bees/);
    assert.equal(g.crops['21,15'][1], RIPE('Cucumber') - CROPS.Cucumber[3], 'it regrows as usual');
  });

  test('no bonus without a blooming Moondrop next to it', async () => {
    const g = field();
    plant(g, 21, 15, 'Cucumber', RIPE('Cucumber'));
    plant(g, 23, 15, 'Moondrop Flower', RIPE('Moondrop Flower')); // two tiles away
    assert.equal(g.companion_bonus('21,15'), 0, 'two tiles away is too far');
    plant(g, 22, 15, 'Moondrop Flower', 2); // next to it, still growing
    assert.equal(g.companion_bonus('21,15'), 0, 'not in bloom yet');
    plant(g, 22, 15, 'Toy Flower', RIPE('Toy Flower'));
    assert.equal(g.companion_bonus('21,15'), 0, 'only the Moondrop');
    plant(g, 22, 15, 'Moondrop Flower', RIPE('Moondrop Flower'));
    assert.equal(g.companion_bonus('22,15'), 0, 'the flower itself gets nothing');
    g.inv = {};
    await g.interact();
    assert.equal(g.inv.Cucumber, 2);
  });

  test('the bonus fills the Basket up to its capacity, with any spare berry kept in the rucksack', async () => {
    const g = field();
    plant(g, 21, 15, 'Cucumber', RIPE('Cucumber'));
    plant(g, 21, 14, 'Moondrop Flower', RIPE('Moondrop Flower'));
    g.inv = { Basket: 1 };
    g.held = 'Basket';
    g.basket = { Turnip: BASKET_CAPACITY - 1 };
    await g.interact();
    assert.equal(g.basket.Cucumber, 1);
    assert.equal(g.inv.Cucumber, 1);
  });

  test('Harvest Sprites collect the bonus too, even when they pick the flower in the same pass', () => {
    const g = field();
    plant(g, 22, 15, 'Moondrop Flower', RIPE('Moondrop Flower'));
    plant(g, 21, 15, 'Cucumber', RIPE('Cucumber'));
    plant(g, 23, 15, 'Cucumber', RIPE('Cucumber'));
    plant(g, 25, 15, 'Cucumber', RIPE('Cucumber')); // not touching the flower
    const sprite = Object.keys(g.sprite_jobs)[0];
    g.sprite_jobs[sprite] = { task: 'Harvesting', days: 2, skill: 10 };
    g.bin = {};
    g.run_sprites_work([]);
    assert.equal(g.bin.Cucumber, 2 + 2 + 1);
    assert.equal(g.bin['Moondrop Flower'], 1);
  });

  test('aiming Cucumber seeds marks the tiles that would sit beside a Moondrop and says so', () => {
    const g = field();
    plant(g, 23, 15, 'Moondrop Flower', 1); // any stage: it will bloom
    g.inv = { 'Cucumber Seeds': 1 };
    g.tool = 'Cucumber Seeds';
    const p = g.companion_preview('Cucumber Seeds', 21, 15);
    assert.deepEqual(p.cells.sort(), ['22,14', '22,15', '22,16']);
    assert.match(g.facing_action().summary, /^Sow cucumber · 3 by Moondrop: 2 a picking$/);
    g.render();
    const marked = g.scr.tags.flat().filter((t: any) => t?.companion).map((t: any) => `${t.wx},${t.wy}`).sort();
    assert.deepEqual(marked, ['22,14', '22,15', '22,16']);
    assert.equal(g.companion_preview('Turnip Seeds', 21, 15), null, 'other bags show nothing');
    g.tool = 'Hoe';
    g.render();
    assert.equal(g.scr.tags.flat().filter((t: any) => t?.companion).length, 0, 'no marks without the bag');
  });

  test('aiming Moondrop seeds marks the Cucumber plants the flowers would help', () => {
    const g = field();
    plant(g, 23, 14, 'Cucumber', 2);
    plant(g, 26, 16, 'Cucumber', 2); // too far from the 3x3 at (21,15)
    g.inv = { 'Moondrop Flower Seeds': 1 };
    g.tool = 'Moondrop Flower Seeds';
    assert.deepEqual(g.companion_preview(g.tool, 21, 15).cells, ['23,14']);
    assert.match(g.facing_action().summary, /^Sow moondrop flower · helps 1 Cucumber: \+1 a picking$/);
  });

  test('sowing next to the pair says so; checking a cucumber tells you about its flower', async () => {
    const g = field();
    plant(g, 23, 15, 'Moondrop Flower', 1);
    g.inv = { 'Cucumber Seeds': 1 };
    g.tool = 'Cucumber Seeds';
    await g.sow('Cucumber Seeds', [21, 15]);
    assert.match(g.msgs.at(-1)[0], /You sowed Cucumber seeds on 9 tiles\. 3 Cucumber plants are paired with Moondrop Flower\./);
    g.tool = 'Hoe';
    g.face = [1, 0];
    g.px = 21; g.py = 15; // facing (22, 15), a new cucumber beside the young flower
    await g.interact();
    assert.match(g.msgs.at(-1)[0], /will draw bees once it blooms/);
    g.crops['23,15'][1] = RIPE('Moondrop Flower');
    await g.interact();
    assert.match(g.msgs.at(-1)[0], /A Moondrop Flower in bloom beside it: 2 a picking/);
  });

  test("Jeff's seed shop explains the pairing for Cucumber seeds", () => {
    const g = fresh();
    g.season = 0;
    const seen: string[][] = [];
    g.menu = async (_t: string, opts: string[], _s = 0, info: any) => {
      for (let i = 0; i < opts.length; i++) seen.push([opts[i], ...info(i)]);
      return null;
    };
    return g.buy_seeds().then(() => {
      const line = (name: string) => seen.find((r) => r[0].startsWith(name))!.join(' ');
      assert.match(line('Cucumber Seeds'), /Companion: a Moondrop Flower in bloom beside a Cucumber gives 2 a picking/);
      assert.ok(!/Companion:/.test(line('Turnip Seeds')));
      assert.ok(!line('Cucumber Seeds').includes('LOCKED'), 'cucumber seeds are on sale from the first day');
    });
  });

  test("Won's shop explains the pairing where Moondrop seeds are sold", async () => {
    const g = fresh();
    let info: any = null;
    let opts: string[] = [];
    g.menu = async (_t: string, o: string[], _s = 0, i: any) => {
      opts = o;
      info = i;
      return null;
    };
    await g.won_shop();
    const at = opts.findIndex((o) => o.startsWith('Moondrop Flower Seeds'));
    assert.match(info(at).join(' '), /Companion: a Moondrop Flower in bloom beside a Cucumber gives 2 a picking/);
    assert.deepEqual(info(opts.findIndex((o) => o.startsWith('Toy Flower Seeds'))), []);
  });
});

describe('seed saving (task 19)', () => {
  const recipe = SEED_SAVING[0];
  /** Answers each menu in turn with the option whose text starts with the given prefix (null: cancel). */
  const answering = (g: any, picks: (string | null)[]) => {
    const seen: { title: string; opts: string[]; info: any }[] = [];
    g.menu = async (title: string, opts: string[], _s = 0, info: any = null) => {
      seen.push({ title, opts, info: typeof info === 'function' ? info(0) : info });
      const want = picks.shift();
      if (want === undefined || want === null) return null;
      const i = opts.findIndex((o) => o.trim().startsWith(want));
      assert.ok(i >= 0, `"${want}" offered in ${title}: ${opts.join(' | ')}`);
      return i;
    };
    return seen;
  };

  test('one recipe to start: three Cucumbers make one bag of Cucumber Seeds', () => {
    assert.deepEqual(SEED_SAVING, [{ crop: 'Cucumber', need: 3, bags: 1 }]);
    const ship = ITEMS.Cucumber[0] * recipe.need;
    const shop = CROPS.Cucumber[1] * recipe.bags;
    assert.ok(ship < shop && shop - ship <= ship * 0.25, `a fair trade, not free seed (${ship}G of crop for a ${shop}G bag)`);
  });

  test('saving takes the crop and gives the bag, only when there is enough', () => {
    const g = fresh();
    g.inv = { Cucumber: 2 };
    assert.equal(g.save_seeds('Cucumber'), false);
    assert.deepEqual(g.inv, { Cucumber: 2 }, 'nothing used up');
    g.inv.Cucumber = 4;
    g.held = 'Cucumber';
    assert.equal(g.save_seeds('Cucumber'), true);
    assert.equal(g.inv.Cucumber, 1);
    assert.equal(g.inv['Cucumber Seeds'], 1);
    assert.equal(g.held, 'Cucumber', 'still holding the one left');
    assert.equal(g.save_seeds('Turnip'), false, 'no recipe for turnips yet');
  });

  test('the rucksack offers it for Cucumbers, previews the trade, and keeps the crop by default', async () => {
    const g = fresh();
    g.inv = { Cucumber: 3, Turnip: 3 };
    // Cucumber > Save seeds > (preview) Keep > close
    let seen = answering(g, ['Cucumber', 'Save seeds', 'Keep the Cucumber', null]);
    await g.rucksack();
    const preview = seen.find((m) => m.title === 'Save Cucumber seeds?')!;
    assert.deepEqual(preview.opts, ['Keep the Cucumber', 'Save seeds from 3 Cucumber'], 'keeping is the highlighted answer');
    assert.match(preview.info.join(' '), /Gives 1 bag of Cucumber Seeds: sows 3x3, 9 days to grow, regrows every 5d/);
    assert.match(preview.info.join(' '), /Jeff sells the bag for 200G; 3 Cucumber would ship for 180G/);
    assert.equal(g.inv.Cucumber, 3, 'kept');
    // now save them
    seen = answering(g, ['Cucumber', 'Save seeds', 'Save seeds from', null]);
    await g.rucksack();
    assert.deepEqual([g.inv.Cucumber, g.inv['Cucumber Seeds']], [undefined, 1]);
    // no such option on a turnip
    seen = answering(g, ['Turnip', null, null]);
    await g.rucksack();
    assert.ok(!seen[1].opts.some((o) => o.trim().startsWith('Save seeds')));
  });

  test('a stray number key does not save the seeds', async () => {
    const g = fresh();
    g.inv = { Cucumber: 3 };
    g.scr.pushKey('2');
    g.scr.pushKey('esc');
    await g.seed_saving_menu('Cucumber');
    assert.equal(g.inv.Cucumber, 3);
  });

  test('too few cucumbers: it says how many it takes instead', async () => {
    const g = fresh();
    g.inv = { Cucumber: 1 };
    const said: string[] = [];
    g.say = async (t: string) => { said.push(t); };
    await g.seed_saving_menu('Cucumber');
    assert.match(said[0], /takes 3 Cucumber; you have 1/);
  });

  test('a saved bag sows like a bought one', async () => {
    const g = fresh();
    g.season = 0;
    g.inv = { Cucumber: 3 };
    g.save_seeds('Cucumber');
    g.warp('farm', 19, 15, [1, 0]);
    for (let y = 14; y <= 16; y++) for (let x = 20; x <= 22; x++) { delete g.objs.farm[`${x},${y}`]; g.tilled.add(`${x},${y}`); }
    await g.sow('Cucumber Seeds', [21, 15]);
    assert.equal(Object.values(g.crops).filter((c: any) => c[0] === 'Cucumber').length, 9);
    assert.equal(g.inv['Cucumber Seeds'] || 0, 0);
  });

  test("Jeff's shop mentions saving your own", async () => {
    const g = fresh();
    g.season = 0;
    let rows: string[] = [];
    g.menu = async (_t: string, opts: string[], _s = 0, info: any) => {
      rows = opts.map((o, i) => [o, ...info(i)].join(' '));
      return null;
    };
    await g.buy_seeds();
    assert.match(rows.find((r) => r.startsWith('Cucumber Seeds'))!, /Or save your own: 3 Cucumber make 1 bag \(Rucksack\)/);
    assert.ok(!/save your own/.test(rows.find((r) => r.startsWith('Turnip Seeds'))!));
  });
});

describe('makers you can walk up to (task 30)', () => {
  const spot = MAKER_SPOTS['Mayonnaise Maker'];
  /** A farm with a Mayonnaise Maker installed and the player facing it from the path below. */
  const withMaker = (inv: Record<string, number> = {}) => {
    const g = fresh();
    g.makers = ['Mayonnaise Maker'];
    g.place_makers();
    g.inv = { ...inv };
    g.minutes = 10 * 60;
    g.warp('farm', spot.x, spot.y + 1, [0, -1]);
    g.warp_fx = null;
    return g;
  };
  const answering = (g: any, picks: (string | null)[]) => {
    const seen: { title: string; opts: string[]; info: string[] }[] = [];
    g.menu = async (title: string, opts: string[], _s = 0, info: any = null) => {
      seen.push({ title, opts, info: typeof info === 'function' ? info(0) : info || [] });
      const want = picks.shift();
      if (want === undefined || want === null) return null;
      const i = opts.findIndex((o) => o.trim().startsWith(want));
      assert.ok(i >= 0, `"${want}" offered in ${title}: ${opts.join(' | ')}`);
      return i;
    };
    return seen;
  };

  test('each Maker has its own spot on open farm ground beside the coop or barn', () => {
    const g = fresh();
    const farm = g.maps.farm;
    const taken = new Set<string>();
    for (const [name, sp] of Object.entries(MAKER_SPOTS)) {
      assert.equal(farm.tile(sp.x, sp.y), 'grass', `${name} spot starts as grass`);
      assert.ok(farm.tile(sp.x, sp.y + 1) === 'path', `${name} is reached from the farm path`);
      assert.ok(!taken.has(`${sp.x},${sp.y}`));
      taken.add(`${sp.x},${sp.y}`);
      // not the dog's or the horse's spot, and not a door
      assert.ok(!(sp.x === 21 && sp.y === 6) && !(sp.x === 25 && sp.y === 6), name);
      assert.ok(!(`${sp.x},${sp.y}` in farm.doors), name);
    }
    assert.equal(TILES.maker[0], '⚙');
  });

  test('ordering a Maker stands it on the farm; a new farm takes it away', async () => {
    const g = fresh();
    quiet(g);
    g.house_flags = ['Coop Expansion'];
    g.gold = 25000;
    g.inv = { Adamantite: 1 };
    answering(g, ['Mayonnaise Maker']);
    await g.order_maker();
    assert.deepEqual(g.makers, ['Mayonnaise Maker']);
    assert.equal(g.maps.farm.tile(spot.x, spot.y), 'maker');
    assert.equal(TILES.maker[3], false, 'you stand beside it, not on it');
    g.new_game('Pete', 'Moon');
    assert.equal(g.maps.farm.tile(spot.x, spot.y), 'grass');
  });

  test('walk up, load every grade, see when it is done, and collect it there', async () => {
    const g = withMaker({ Egg: 2, 'Golden Egg': 3, Turnip: 1 });
    quiet(g);
    assert.deepEqual(g.context_action(), { key: 'x', label: 'LOAD' });
    assert.equal(g.facing_action().label, 'LOAD');
    let seen = answering(g, ['Load 5 eggs']);
    await g.interact();
    assert.equal(seen[0].title, 'Mayonnaise Maker');
    const info = seen[0].info.join('\n');
    assert.match(info, /3 x Golden Egg → Golden Mayonnaise/);
    assert.match(info, /2 x Egg → Small Mayonnaise/);
    assert.match(info, /Takes 4 hours: ready at 2:00PM/);
    assert.deepEqual(g.inv, { Turnip: 1 }, 'eggs went in, the turnip stayed');
    assert.equal(g.msgs.at(-1)[0], 'Loaded 5 eggs into the Mayonnaise Maker: ready at 2:00PM.');

    // working: the machine says when, and the glyph turns orange
    g.minutes = 12 * 60 + 40;
    assert.deepEqual(g.context_action(), { key: 'x', label: 'CHECK' });
    assert.equal(g.facing_action().summary, 'Mayonnaise Maker: ready at 2:00PM');
    assert.deepEqual(g.glyph(g.maps.farm, spot.x, spot.y, 'maker').slice(0, 2), ['⚙', '09']);
    seen = answering(g, [null]);
    await g.interact();
    assert.match(seen[0].info[0], /Working: ready at 2:00PM \(1h 20m left\)/);
    assert.deepEqual(seen[0].opts, ['Leave']);

    // done: green, and the menu lists each grade before collecting
    g.minutes = 14 * 60;
    assert.deepEqual(g.context_action(), { key: 'x', label: 'COLLECT' });
    assert.deepEqual(g.glyph(g.maps.farm, spot.x, spot.y, 'maker').slice(0, 2), ['⚙', '0B']);
    seen = answering(g, ['Collect 5 mayonnaise']);
    await g.interact();
    assert.match(seen[0].info.join('\n'), /3 x Golden Mayonnaise[\s\S]*2 x Small Mayonnaise/);
    assert.deepEqual(g.inv, { Turnip: 1, 'Golden Mayonnaise': 3, 'Small Mayonnaise': 2 });
    assert.equal(g.maker_state('Mayonnaise Maker'), 'idle');
    assert.deepEqual(g.glyph(g.maps.farm, spot.x, spot.y, 'maker').slice(0, 2), ['⚙', '03']);
  });

  test('an empty Maker with nothing to load explains itself without a menu', async () => {
    const g = withMaker({});
    const said = quiet(g);
    const seen = answering(g, []);
    await g.interact();
    assert.equal(seen.length, 0);
    assert.match(said[0], /The Mayonnaise Maker is empty\. It takes every grade of eggs in your rucksack and needs 4 hours\./);
  });

  test('collecting with more eggs in the rucksack offers the next batch straight away', async () => {
    const g = withMaker({ Egg: 1 });
    quiet(g);
    g.load_maker('Mayonnaise Maker');
    g.inv['Good Egg'] = 4;
    g.minutes += 4 * 60;
    const seen = answering(g, ['Collect', 'Load 4 eggs']);
    await g.interact();
    assert.equal(seen.length, 2);
    assert.equal(g.inv['Small Mayonnaise'], 1);
    assert.deepEqual(g.maker_jobs['Mayonnaise Maker'].steps, [{ input: 'Good Egg', output: 'Medium Mayonnaise', qty: 4 }]);
  });

  test('the clock runs through the night: an evening batch is ready by morning', async () => {
    const g = fresh();
    g.minutes = 22 * 60;
    const today = g.absday();
    assert.equal(g.maker_when(g.now_abs() + 4 * 60), 'by morning');
    assert.equal(g.maker_when(g.now_abs() + 8 * 60), 'by morning');
    g.minutes = 23 * 60;
    assert.equal(g.maker_when(g.now_abs() + 8 * 60), 'tomorrow at 7:00AM');
    assert.equal(g.maker_when(today * 1440 + 15 * 60), 'at 3:00PM');

    const h = withMaker({ 'High Egg': 2 });
    h.minutes = 21 * 60;
    h.load_maker('Mayonnaise Maker');
    assert.match(h.msgs.at(-1)[0], /ready by morning\.$/);
    for (let i = 0; i < 12; i++) h.scr.pushKey('enter');
    await h.new_day('sleep');
    assert.equal(h.maker_state('Mayonnaise Maker'), 'ready', 'done when you wake up');
    assert.ok(h.today_lines().some((l: string) => l.includes('Makers Mayonnaise: ready to collect')));
  });

  test('the coop menu shows the machine outside instead of processing in the menu', async () => {
    const g = withMaker({ Egg: 3 });
    const seen = answering(g, [null]);
    await g.coop();
    assert.ok(!seen[0].opts.some((o) => /Maker/.test(o)), seen[0].opts.join(' | '));
    assert.ok(seen[0].info.some((l) => l.includes('Mayonnaise Maker (outside, west of the door): empty (3 eggs in your rucksack to load)')));
    g.load_maker('Mayonnaise Maker');
    const again = answering(g, [null]);
    await g.coop();
    assert.ok(again[0].info.some((l) => l.includes('Mayonnaise Maker (outside, west of the door): 3 eggs in, ready at 2:00PM')));
  });

  test('a batch and its machine survive a reload; a broken batch is dropped', () => {
    const g = withMaker({ 'P Egg': 2 });
    g.load_maker('Mayonnaise Maker');
    const snap = JSON.parse(JSON.stringify(g.snapshot()));
    const h = fresh();
    h.applySaveData(snap);
    assert.equal(h.maps.farm.tile(spot.x, spot.y), 'maker');
    assert.deepEqual(h.maker_jobs, g.maker_jobs);
    assert.equal(h.maker_state('Mayonnaise Maker'), 'working');

    const bad = JSON.parse(JSON.stringify(snap));
    bad.maker_jobs = {
      'Mayonnaise Maker': { steps: [{ input: 'P Egg', output: 'Not An Item', qty: 2 }], ready: 5 },
      'Cheese Maker': { steps: [{ input: 'Small Milk', output: 'Small Cheese', qty: 1 }], ready: 5 },
    };
    const k = fresh();
    k.applySaveData(bad);
    assert.deepEqual(k.maker_jobs, {}, 'unknown output and a Maker not owned are both dropped');

    const old = JSON.parse(JSON.stringify(snap));
    delete old.maker_jobs;
    const o = fresh();
    o.applySaveData(old);
    assert.deepEqual(o.maker_jobs, {});
    assert.equal(o.maps.farm.tile(spot.x, spot.y), 'maker', 'older saves with a Maker get the machine too');
  });

  test('the renderer draws the machine as a lit point of interest', () => {
    const g = withMaker({ Egg: 1 });
    g.load_maker('Mayonnaise Maker');
    g.render();
    let found = false;
    for (let y = 0; y < g.scr.h; y++) for (let x = 0; x < g.scr.w; x++) {
      const tag = g.scr.tags[y][x];
      if (tag?.wx === spot.x && tag?.wy === spot.y && tag.t === 'maker') {
        found = true;
        assert.equal(g.scr.buf[y][x][0], '⚙');
      }
    }
    assert.ok(found, 'machine visible on screen');
  });
});

describe('a few preserves (task 31)', () => {
  /** A Monday (absolute day `1 + 30 * season`) in the given season, sunny, before the market. */
  const mondayIn = (season: number) => {
    const g = fresh();
    g.season = season;
    g.day = 1;
    g.minutes = 8 * 60;
    g.weather = 'Sunny';
    return g;
  };

  test('three preserves, made in the kitchen; two need no utensil and are worth more than what goes in', () => {
    assert.deepEqual(PRESERVES, ['Pickled Turnip', 'Dried Herbs', 'Strawberry Jam']);
    for (const p of PRESERVES) {
      assert.equal(ITEMS[p][2], 'dish', `${p} is a kitchen good`);
      assert.ok(RECIPES[p], `${p} has a recipe`);
      const [ing, , , sell] = RECIPES[p];
      const raw = ing.reduce((t: number, [i, q]: [string, number]) => t + ITEMS[i][0] * q, 0);
      assert.ok(sell > raw, `${p} ships for more than its ${raw}G of ingredients`);
      assert.equal(ITEMS[p][0], sell);
    }
    assert.equal(RECIPES['Pickled Turnip'][1], null);
    assert.deepEqual(RECIPES['Dried Herbs'], [[['Medicinal Herb', 3]], null, 10, 50]);
    assert.ok(FORAGE.Spring.includes('Medicinal Herb'), 'the herbs can be gathered in spring');
  });

  test('cooking Dried Herbs uses three Medicinal Herbs, and the kitchen says what a preserve is for', async () => {
    const g = mondayIn(0);
    g.inv = { 'Medicinal Herb': 4 };
    const seen: string[][] = [];
    let n = 0;
    g.menu = async (_t: string, opts: string[], _s = 0, info: any = null) => {
      if (n++ > 0) return null;
      const i = opts.findIndex((o) => o.slice(2) === 'Dried Herbs');
      seen.push(info(i));
      return i;
    };
    await g.cook();
    assert.deepEqual(g.inv, { 'Medicinal Herb': 1, 'Dried Herbs': 1 });
    assert.ok(seen[0].some((l) => l.includes('Keeps for winter. Doug buys preserves for the inn in Fall and Winter.')), seen[0].join(' | '));
  });

  test('Doug asks for one preserve in Fall and Winter, never in Spring or Summer', () => {
    const seen = new Set<string>();
    for (let season = 0; season < 4; season++) {
      for (let week = 0; week < 4; week++) {
        const g = mondayIn(season);
        g.day = 1 + week * 7;
        if (g.day > 30) continue;
        const { pantry } = g.market_wants();
        assert.equal(pantry.length, 2);
        assert.notEqual(pantry[0], pantry[1]);
        const preserves = pantry.filter((i: string) => PRESERVES.includes(i));
        if (PRESERVE_SEASONS.includes(season)) {
          assert.equal(preserves.length, 1, `${pantry.join(', ')} in season ${season}`);
          preserves.forEach((p: string) => seen.add(p));
        } else {
          assert.equal(preserves.length, 0, `${pantry.join(', ')} in season ${season}`);
        }
      }
    }
    assert.ok(seen.size >= 2, `more than one preserve turns up over the cold weeks (${[...seen].join(', ')})`);
  });

  test('at a winter market Doug buys the preserve he asked for at his premium', async () => {
    const g = mondayIn(3);
    const w = g.market_wants();
    const want = w.pantry[0];
    g.day += g.market_next() - g.absday(); // on to that week's Saturday
    g.minutes = 9 * 60;
    assert.equal(g.stall_state(), 'ready');
    g.warp('town', STALL_SPOT[0], STALL_SPOT[1] + 1, [0, -1]);
    g.inv = { [want]: 4, Egg: 2 };
    assert.ok(g.stall_open([[want, 4], ['Egg', 2]]));
    g.stall_regular('pantry');
    assert.equal(g.stall.goods[0].sold, MARKET_SHOPPERS.pantry.each);
    assert.equal(g.stall.goods[0].item, want);
    assert.ok(g.stall.gold >= Math.round(ITEMS[want][0] * MARKET_SHOPPERS.pantry.markup) * MARKET_SHOPPERS.pantry.each);
    assert.match(g.stall.log.at(-1), new RegExp(`Doug: "Just what the inn's kitchen needs\\." Bought .*${want}`));
  });

  test('the rucksack marks a preserve and says who wants it this week', async () => {
    const g = mondayIn(3);
    const want = g.market_wants().pantry[0];
    g.inv = { [want]: 1, Turnip: 1 };
    const infos: Record<string, string[]> = {};
    g.menu = async (title: string, opts: string[], _s = 0, info: any = null) => {
      if (title !== '▣ Rucksack') return null;
      opts.forEach((_o, i) => {
        const lines = info(i);
        infos[lines[0].split('  ·  ')[0]] = lines;
      });
      return null;
    };
    await g.rucksack();
    assert.deepEqual(infos.PRESERVE, [
      `PRESERVE  ·  Ships ${ITEMS[want][0]}G  ·  +${ITEMS[want][1]} Stamina`,
      `Keeps for winter. Doug wants ${want} at this Saturday's market.`,
    ]);
    assert.equal(infos.CROP.length, 1, 'a turnip gets no preserve line');
    assert.equal(g.preserve_note('Turnip'), null);
  });
});

describe('orders for finished goods (task 32)', () => {
  const supper = ORDERS.find((o) => o.id === 'inn_supper')!;
  /** A farm with a Kitchen and the inn's supper basket on the board. */
  const withOrder = () => {
    const g = fresh();
    g.house_flags = ['Kitchen'];
    g.order_last = 'inn_cheese'; // so the refresh can only pick the supper basket among what is possible
    assert.ok(g.order_refresh());
    assert.equal(g.order.id, 'inn_supper');
    return g;
  };
  const answering = (g: any, picks: (string | null)[]) => {
    const seen: { title: string; opts: string[]; info: string[] }[] = [];
    g.menu = async (title: string, opts: string[], _s = 0, info: any = null) => {
      const want = picks.shift();
      const i = want == null ? -1 : opts.findIndex((o) => o.trim().startsWith(want));
      seen.push({ title, opts, info: typeof info === 'function' ? info(Math.max(0, i)) : info || [] });
      if (want == null) return null;
      assert.ok(i >= 0, `"${want}" offered in ${title}: ${opts.join(' | ')}`);
      return i;
    };
    return seen;
  };

  test('each order is a small bundle of finished goods from someone in the valley, worth more than its parts at the lowest grade', () => {
    for (const o of ORDERS) {
      assert.ok(NPCS[o.npc], o.npc);
      assert.ok(o.pieces.length >= 1 && o.pieces.length <= 3, o.id);
      let parts = 0;
      for (const p of o.pieces) {
        for (const it of p.any) assert.ok(ITEMS[it], `${it} is an item`);
        assert.ok(['food', 'dish', 'animal'].includes(ITEMS[p.any[0]][2]), `${p.label} is a finished good`);
        parts += Math.min(...p.any.map((it) => ITEMS[it][0] || 100)) * p.qty; // at the lowest grade (Bread: Jeff's 100G)
        assert.ok(p.where.length > 0);
      }
      assert.ok(o.reward > parts, `${o.id}: ${o.reward}G beats shipping the parts (${parts}G)`);
    }
  });

  test('no order is posted until its goods can be made', () => {
    const g = fresh();
    assert.equal(g.order_refresh(), null, 'no Kitchen, no Makers');
    g.makers = ['Yarn Maker'];
    assert.equal(g.order_refresh().id, 'manna_scarf', 'a Yarn Maker opens Manna\'s scarf');
    const h = fresh();
    h.house_flags = ['Kitchen'];
    assert.equal(h.order_refresh().id, 'inn_supper', 'a Kitchen opens the supper basket, but not the cheese board');
    assert.equal(h.order_refresh(), null, 'one order at a time');
  });

  test('the board lists the order first and its page shows which pieces are still missing', async () => {
    const g = withOrder();
    g.inv = { Bread: 1, Turnip: 2 };
    const seen = answering(g, ['★ Doug', null]);
    await g.request_menu();
    assert.match(seen[0].opts[0], new RegExp(`^★ Doug's order: a supper basket for the inn — ${supper.reward}G \\(${ORDER_DAYS}d left\\)$`));
    assert.deepEqual(seen[0].info, [
      'A bundle of finished goods. Still needed: Bread, Pickled Turnip and Dried Herbs.',
      'Hand pieces over as you make them; paid when it is complete.',
    ]);
    assert.equal(seen[1].title, 'Order: a supper basket for the inn');
    assert.deepEqual(seen[1].info.slice(1), [
      "  · Bread 0/1, in your rucksack (Jeff's General Store, 100G)",
      '  · Pickled Turnip 0/1, missing 1 (Kitchen: 2 Turnip)',
      '  · Dried Herbs 0/1, missing 1 (Kitchen: 3 Medicinal Herb)',
    ]);
    assert.deepEqual(seen[1].opts, ['Hand over what you have', 'Leave']);
  });

  test('pieces go over a few at a time, and the reward comes with the last one', async () => {
    const g = withOrder();
    quiet(g);
    const gold = g.gold;
    const friend = g.friend.Doug || 0;
    g.inv = { Bread: 2, 'Pickled Turnip': 1 };
    answering(g, ['★ Doug', 'Hand over']);
    await g.request_menu();
    assert.deepEqual(g.inv, { Bread: 1 }, 'one of each piece, no more');
    assert.deepEqual(g.order.delivered, [1, 1, 0]);
    assert.equal(g.gold, gold, 'not paid yet');
    assert.match(g.msgs.at(-1)[0], /^You handed Doug 1 Bread and 1 Pickled Turnip\. Still needed: Dried Herbs\.$/);
    assert.ok(g.today_lines().some((l: string) => l.startsWith('  Order  Doug: Dried Herbs (')));

    // the page now ticks off what was handed over, and offers nothing to hand over
    const seen = answering(g, ['★ Doug', null]);
    await g.request_menu();
    assert.ok(seen[1].info.includes('  ✓ Bread 1/1'));
    assert.ok(seen[1].info.includes('  ✓ Pickled Turnip 1/1'));
    assert.deepEqual(seen[1].opts, ['Leave']);

    g.inv['Dried Herbs'] = 1;
    answering(g, ['★ Doug', 'Hand over']);
    await g.request_menu();
    assert.equal(g.order, null);
    assert.equal(g.gold, gold + supper.reward);
    assert.equal(g.friend.Doug, Math.min(100, friend + 8));
    assert.equal(g.requests_done, 1);
    assert.equal(g.order_next, g.absday() + ORDER_GAP, 'a short gap before the next order');
    assert.equal(g.order_refresh(), null);
  });

  test('graded goods count at any grade, and the lowest grade goes first', () => {
    const g = fresh();
    g.makers = ['Yarn Maker'];
    g.order_refresh();
    g.inv = { 'Golden Yarn': 2, 'Small Yarn': 1 };
    g.order_deliver();
    assert.equal(g.order, null, 'two yarn of any grade complete the scarf');
    assert.deepEqual(g.inv, { 'Golden Yarn': 1 }, 'the Small Yarn went first, then one Golden');
  });

  test('an order lapses after its days and the next one waits a little', async () => {
    const g = withOrder();
    g.order.delivered = [1, 0, 0];
    g.day += ORDER_DAYS + 1;
    const report: string[] = [];
    g.request_day(report);
    assert.ok(report.includes("Doug's order for a supper basket for the inn lapsed at the Rose Square board."), report.join(' | '));
    assert.equal(g.order, null);
    g.day += ORDER_GAP;
    const later: string[] = [];
    g.request_day(later);
    assert.ok(later.some((l) => l.startsWith('Doug posted an order at the Rose Square board')), later.join(' | '));
  });

  test('an order and its progress survive a reload; a broken one is dropped', () => {
    const g = withOrder();
    g.order.delivered = [1, 0, 0];
    const snap = JSON.parse(JSON.stringify(g.snapshot()));
    const h = fresh();
    h.applySaveData(snap);
    assert.deepEqual(h.order, g.order);
    assert.equal(h.order_last, 'inn_supper');
    const bad = JSON.parse(JSON.stringify(snap));
    bad.order = { id: 'no_such_order', delivered: [], deadline: 9 };
    const k = fresh();
    k.applySaveData(bad);
    assert.equal(k.order, null);
    const odd = JSON.parse(JSON.stringify(snap));
    odd.order.delivered = [99, -3, 'x'];
    const o = fresh();
    o.applySaveData(odd);
    assert.deepEqual(o.order.delivered, [1, 0, 0], 'clamped to each piece');
    const old = JSON.parse(JSON.stringify(snap));
    delete old.order;
    delete old.order_next;
    delete old.order_last;
    const p = fresh();
    p.applySaveData(old);
    assert.equal(p.order, null);
  });
});
