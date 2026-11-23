// Regression tests for the P1 mechanics-audit fixes (shop, stamina, greenhouse, fey lock, festival, hybrids, chickens).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './engine';
import { Screen } from './screen';
import { NPCS } from './constants';
import { HYBRIDS, HYBRID_RECROSS_FEE } from './farm-works';

function fresh(): any {
  const g = new Game(new Screen(100, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  g.mapname = 'farm';
  g.objs.farm = {};
  g.say = async () => {};
  return g;
}

const homes = () => JSON.stringify(Object.values(NPCS).map((d: any) => d.where));

test('p1: Jewel of Truth sells once and a second purchase charges nothing', async () => {
  const g = fresh();
  g.gold = 120000;
  g.menu = async (_t: string, opts: string[]) => opts.findIndex((o) => o.startsWith('Jewel of Truth'));
  await g.won_shop();
  assert.equal(g.gold, 70000);
  assert.equal(g.truth_jewels, 1);
  await g.won_shop();
  assert.equal(g.gold, 70000);
  assert.equal(g.truth_jewels, 1);
});

test('p1: a Heartseed keeps the Big Bed stamina and survives a save round-trip', () => {
  const g = fresh();
  g.house_flags.push('Big Bed');
  g.recompute_max_stamina();
  const before = g.max_stamina;
  g.give_power_berry('test_berry');
  assert.equal(g.max_stamina, before + 10);
  const h = fresh();
  h.applySaveData(JSON.parse(JSON.stringify(g.snapshot())));
  assert.equal(h.max_stamina, g.max_stamina);
});

test('p1: the Hoe tills glass in Winter once the greenhouse stands, and rows accept it', async () => {
  const g = fresh();
  g.farm_works.greenhouse = true;
  g.season = 3;
  g.tool = 'Hoe';
  g.px = 39; g.py = 9; g.face = [1, 0];
  g.spend = async () => {};
  assert.equal(g.row_tile(40, 9), 'work');
  await g.use_tool();
  assert.ok(g.tilled.has('40,9'));
  g.farm_works.greenhouse = false;
  g.tilled.clear();
  assert.notEqual(g.row_tile(40, 9), 'work');
  await g.use_tool();
  assert.equal(g.tilled.has('40,9'), false);
});

test('p1: the seed pouch and the confession booth respect a Fey tool', async () => {
  const g = fresh();
  g.inv['Turnip Seeds'] = 3;
  g.levels.Hoe = 5;
  g.tool = 'Hoe';
  g.gold = 5000;
  g.seed_pouch_shortcut();
  assert.equal(g.tool, 'Hoe');
  g.menu = async () => 0;
  await g.confession_booth();
  assert.equal(g.gold, 5000, 'a Fey Hoe is blessed, not removed, and nothing is charged');
  assert.equal(g.levels.Hoe, 5);
  g.levels.Hoe = 0;
  g.levels.Sickle = 5;
  g.tool = 'Sickle';
  await g.confession_booth();
  assert.equal(g.gold, 4000);
  assert.notEqual(g.levels[g.tool], 5);
});

test('p1: festival NPC positions never leak into a fresh Game', () => {
  const home = homes();
  const a = fresh();
  a.fest_active = () => ['Test Fair', 9, 17, 'x'];
  a.fest_sync();
  assert.notEqual(homes(), home);
  const b = fresh();
  b.fest_active = () => null;
  b.fest_sync();
  assert.equal(homes(), home);
});

test('p1: Silas re-crosses a lost hybrid for a fee but not while one remains', async () => {
  const g = fresh();
  const h = HYBRIDS[0];
  const [a, b] = h.parents.map((p) => `${p} Seeds`);
  g.inv[a] = g.inv[b] = 1;
  g.menu = async () => 0;
  await g.hybrid_menu();
  g.gold = 500;
  g.inv[a] = g.inv[b] = 1;
  await g.hybrid_menu();
  assert.equal(g.inv[a], 1, 'still holding the hybrid seed, so no second cross');
  assert.equal(g.gold, 500);
  g.take(`${h.crop} Seeds`);
  await g.hybrid_menu();
  assert.equal(g.inv[`${h.crop} Seeds`], 1);
  assert.equal(g.gold, 500 - HYBRID_RECROSS_FEE);
  assert.equal(g.farm_works.hybrids.filter((c: string) => c === h.crop).length, 1);
});

test('p1: chickens stay aligned with temperaments and a full coop holds the egg', async () => {
  const g = fresh();
  g.gold = 5000;
  g.chickens = 0;
  g.chicken_personalities = [];
  g.confirm = async () => true;
  await g.buy_chicken();
  assert.equal(g.chickens, 1);
  assert.equal(g.chicken_personalities.length, 1);
  g.chickens = g.coop_cap();
  g.chicken_personalities = Array(g.chickens).fill('calm');
  g.incubator_days = 1;
  g.show_lines = async () => {};
  g.save = () => true;
  await g.new_day('passout');
  assert.equal(g.chickens, g.coop_cap());
  assert.ok(g.incubator_days > 0, 'the egg stays in the incubator');
  g.house_flags.push('Coop Expansion');
  g.incubator_days = 1;
  await g.new_day('passout');
  assert.equal(g.chickens, 9);
  assert.equal(g.chicken_personalities.length, 9);
});
