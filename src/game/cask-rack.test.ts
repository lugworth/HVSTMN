import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './engine';
import { Screen } from './screen';
import { ITEMS, TILES } from './constants';
import { FARM_PIECES } from './farm-works';
import { ageTier, salePrice, sanitiseCasks, wineBatch, caskItem, caskPhase, caskMilestone, caskNextIn, CASK_RACK } from './cask-rack';
import { computeFrame } from './enhanced';

function fresh(): any {
  const g = new Game(new Screen(100, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  g.mapname = 'farm';
  g.objs.farm = {};
  g.say = async () => {};
  return g;
}

function rack(g: any, x = 10, y = 12): string {
  g.inv[CASK_RACK] = 1;
  assert.ok(g.place_farm_piece(x, y, CASK_RACK));
  return `${x},${y}`;
}

test('cask: ageing tiers step at 7, 14 and 28 days', () => {
  assert.deepEqual([0, 6, 7, 13, 14, 27, 28, 90].map(ageTier), [0, 0, 1, 1, 2, 2, 3, 3]);
});

test('cask: wine prices follow 1.0x / 1.4x / 1.9x / 2.5x and the items are registered', () => {
  assert.deepEqual([0, 1, 2, 3].map((t) => salePrice('wine', t)), [300, 420, 570, 750]);
  assert.equal(ITEMS['Young Wine'][0], 300);
  assert.equal(ITEMS['Golden Wine'][0], 750);
  assert.equal(ITEMS['Golden Cave Cheese'][0], 750);
  assert.equal(ITEMS['Small Cheese'][0], 300); // existing prices untouched
  assert.equal(ITEMS['Wine'][0], 300);
});

test('cask: wine needs 3 fruit a bottle, capped at 4 bottles, grapes first', () => {
  assert.equal(wineBatch({ 'Wild Grape': 2 }).qty, 0);
  const b = wineBatch({ 'Wild Grape': 2, 'Orchard Pear': 20 });
  assert.equal(b.qty, 4);
  assert.deepEqual(b.take, { 'Wild Grape': 2, 'Orchard Pear': 10 });
});

test('cask: sanitiser drops unknown kinds, bad numbers, future loads and unowned racks', () => {
  const ok = { kind: 'wine', start: 3, qty: 2 };
  const out = sanitiseCasks(
    {
      '1,1': ok,
      '2,2': { ...ok, kind: 'mead' },
      '3,3': { ...ok, qty: 0 },
      '4,4': { ...ok, qty: 99 },
      '5,5': { ...ok, start: 50 },
      '6,6': { ...ok, start: 1.5 },
      '7,7': ok, // no rack there
      '8,8': null,
    },
    (k) => k !== '7,7',
    10,
  );
  assert.deepEqual(Object.keys(out), ['1,1']);
  assert.deepEqual(sanitiseCasks('junk', () => true, 10), {});
  assert.deepEqual(sanitiseCasks(undefined, () => true, 10), {});
});

test('cask: the rack is a carpenter piece at 1500G', () => {
  assert.equal(FARM_PIECES[CASK_RACK].price, 1500);
  assert.ok(TILES['farm_cask'] && TILES['farm_cask_work'] && TILES['farm_cask_ready']);
});

test('cask: wine ferments 2 days, then ages by tier while the rack stays filled', async () => {
  const g = fresh();
  const k = rack(g);
  g.inv['Wild Grape'] = 6;
  assert.ok(g.load_cask(k, 'wine'));
  assert.equal(g.inv['Wild Grape'] || 0, 0);
  const c = g.casks[k];
  const today = g.absday();
  assert.equal(caskPhase(c, today), 'working');
  assert.equal(g.collect_cask(k), null);
  assert.equal(g.farm_tile(10, 12, 'field'), 'farm_cask_work');
  assert.equal(caskPhase(c, today + 2), 'ready');
  assert.equal(caskItem(c, today + 2), 'Young Wine');
  assert.equal(caskItem(c, today + 9), 'Medium Wine');
  assert.equal(caskItem(c, today + 16), 'Large Wine');
  assert.equal(caskItem(c, today + 30), 'Golden Wine');
  assert.equal(caskNextIn(c, today + 30), null);
  assert.ok(caskMilestone(c, today + 2) && caskMilestone(c, today + 9) && !caskMilestone(c, today + 3));
});

test('cask: collecting through the menu pays out the tier item and frees the rack', async () => {
  const g = fresh();
  const k = rack(g);
  g.inv['Small Cheese'] = 2;
  g.menu = async (_t: string, opts: string[]) => opts.findIndex((o) => o.startsWith('Age'));
  await g.farm_works_interact(10, 12);
  assert.equal(g.casks[k].qty, 2);
  assert.equal(g.farm_tile(10, 12, 'field'), 'farm_cask_ready');
  const start = g.casks[k].start;
  g.casks[k].start = start - 20; // 20 days in the rack
  g.menu = async (_t: string, opts: string[]) => opts.findIndex((o) => o.startsWith('Take'));
  await g.farm_works_interact(10, 12);
  assert.equal(g.casks[k], undefined);
  assert.equal(g.inv['Large Cave Cheese'], 2);
  assert.equal(g.farm_tile(10, 12, 'field'), 'farm_cask');
});

test('cask: menu offers the right choices, and a full rack cannot be picked up', async () => {
  const g = fresh();
  const k = rack(g);
  let seen: string[] = [];
  g.menu = async (_t: string, opts: string[]) => { seen = opts; return opts.length - 1; };
  await g.farm_works_interact(10, 12);
  assert.deepEqual(seen, ['Pick it up', 'Leave']);
  g.inv['Wild Grape'] = 3;
  await g.farm_works_interact(10, 12);
  assert.ok(seen[0].startsWith('Ferment 1'));
  g.load_cask(k, 'wine');
  await g.farm_works_interact(10, 12);
  assert.deepEqual(seen, ['Leave']);
  assert.equal(g.load_cask(k, 'wine'), false);
});

test('cask: today plan line, morning report, and bottles ship at the aged price', async () => {
  const g = fresh();
  const k = rack(g);
  assert.ok(g.today_lines().some((l: string) => l.includes('Casks') && l.includes('1 rack: 0 ready, 0 working, 1 empty')));
  g.inv['Orchard Pear'] = 3;
  g.load_cask(k, 'wine');
  g.casks[k].start = g.absday() - 2 - 7;
  const report: string[] = [];
  g.cask_morning(report);
  assert.equal(report.length, 1);
  g.collect_cask(k);
  g.bin = { 'Medium Wine': 1 };
  assert.equal(g.process_zack_pickup().total, 420);
});

test('cask: save round-trip keeps barrels; old saves load with none; orphaned barrels drop', () => {
  const g = fresh();
  const k = rack(g);
  g.inv['Wild Grape'] = 3;
  g.load_cask(k, 'wine');
  const snap = JSON.parse(JSON.stringify(g.snapshot()));
  const h = fresh();
  h.applySaveData(snap);
  assert.deepEqual(h.casks, g.casks);
  assert.equal(h.farm_tile(10, 12, 'field'), 'farm_cask_work');

  const old = JSON.parse(JSON.stringify(g.snapshot()));
  delete old.casks;
  const o = fresh();
  o.applySaveData(old);
  assert.deepEqual(o.casks, {});

  const orphan = JSON.parse(JSON.stringify(g.snapshot()));
  orphan.farm_works.pieces = {};
  const p = fresh();
  p.applySaveData(orphan);
  assert.deepEqual(p.casks, {});
});

test('cask: renders as a coloured fixture on the farm', () => {
  const g = fresh();
  rack(g, 41, 12);
  g.px = 42; g.py = 10;
  g.render();
  const frame = computeFrame(g.scr, 0);
  assert.ok(frame.flat().some((c: any) => c.ch === FARM_PIECES[CASK_RACK].glyph));
});
