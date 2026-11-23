import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './engine';
import { Screen } from './screen';
import { CROPS, ITEMS, RECIPES, TILES } from './constants';
import { HYBRIDS, GLASS_CELLS, CHANNEL_CELLS, FARM_PIECES } from './farm-works';
import { computeFrame } from './enhanced';

function fresh(): any {
  const g = new Game(new Screen(100, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  g.mapname = 'farm';
  g.objs.farm = {};
  g.say = async () => {};
  return g;
}

test('fields: Silas crosses each documented pair, consumes exactly one of each and logs it', async () => {
  const g = fresh();
  for (let i = 0; i < HYBRIDS.length; i++) {
    const h = HYBRIDS[i];
    const [a, b] = h.parents.map((p) => `${p} Seeds`);
    g.inv[a] = g.inv[b] = 1;
    g.menu = async () => i;
    await g.hybrid_menu();
    assert.equal(g.inv[a] || 0, 0);
    assert.equal(g.inv[b] || 0, 0);
    assert.equal(g.inv[`${h.crop} Seeds`], 1);
    assert.ok(g.farm_works.hybrids.includes(h.crop));
    assert.equal(CROPS[h.crop][0], h.season);
    assert.ok(ITEMS[h.crop] && RECIPES[h.dish]);
    await g.hybrid_menu();
    assert.equal(g.inv[`${h.crop} Seeds`], 1);
  }
  const options = await g.shop_options('library');
  assert.ok(options.some(([name]: [string, unknown]) => name.includes('crossing')));
});

test('fields: orchard has an open road, establishment and predictable repeatable autumn fruit', async () => {
  const g = fresh();
  g.inv['Orchard Sapling'] = 1;
  g.plant_orchard(45, 6);
  assert.ok(g.farm_works.orchard['45,6']);
  assert.equal(g.walkable('farm', 45, 6), false);
  assert.equal(g.walkable('farm', 45, 7), true);
  assert.equal(g.orchard_due('45,6'), null);
  g.season = 2; g.day = 5;
  await g.farm_works_interact(45, 6);
  assert.equal(g.inv['Orchard Pear'], 1);
  assert.equal(g.orchard_due('45,6'), null);
  g.day = 15;
  await g.farm_works_interact(45, 6);
  assert.equal(g.inv['Orchard Pear'], 2);
  assert.equal(RECIPES['Pear Preserve'][0][0][0], 'Orchard Pear');
});

test('fields: channel repairs atomically and spends only stored rain on dry soil', async () => {
  const g = fresh();
  g.menu = async () => 0;
  g.gold = 250; g.inv.Lumber = 5;
  await g.channel_menu();
  assert.equal(g.farm_works.channel, false);
  assert.equal(g.gold, 250);
  g.inv.Lumber = 6;
  await g.channel_menu();
  assert.equal(g.farm_works.channel, true);
  assert.equal(g.gold, 0);
  assert.equal(g.inv.Lumber || 0, 0);
  CHANNEL_CELLS.forEach((k) => g.tilled.add(k));
  const report: string[] = [];
  g.weather = 'Rain'; g.farm_works_morning(report);
  assert.equal(g.farm_works.water, 3);
  g.weather = 'Sunny'; g.farm_works_morning(report);
  assert.equal(g.farm_works.water, 2);
  assert.ok(CHANNEL_CELLS.every((k) => g.wet.has(k)));
  g.farm_works_morning(report);
  assert.equal(g.farm_works.water, 2);
});

test('fields: furniture previews, placement, walking, removal, and persistence are coherent', async () => {
  const g = fresh();
  for (const [i, name] of (Object.keys(FARM_PIECES) as (keyof typeof FARM_PIECES)[]).entries()) {
    const x = 8 + i * 2; const k = `${x},12`;
    g.inv[name] = 1;
    g.place_farm_piece(x, 12, name);
    assert.equal(g.farm_works.pieces[k], name);
    assert.equal(g.walkable('farm', x, 12), FARM_PIECES[name].walk);
    assert.equal(g.farm_tile(x, 12, 'field'), FARM_PIECES[name].tile);
    assert.ok(TILES[FARM_PIECES[name].tile]);
  }
  const h = fresh();
  h.applySaveData(JSON.parse(JSON.stringify(g.snapshot())));
  assert.deepEqual(h.farm_works.pieces, g.farm_works.pieces);
  h.menu = async () => 0;
  await h.farm_works_interact(8, 12);
  assert.equal(h.farm_works.pieces['8,12'], undefined);
  assert.equal(h.inv['Farm Path'], 1);
  h.inv['Farm Lamp'] = 1;
  h.tilled.add('30,12');
  h.place_farm_piece(30, 12, 'Farm Lamp');
  assert.equal(h.inv['Farm Lamp'], 1);
});

test('fields: greenhouse accepts off-season seeds and protects crops through seasonal turnover', async () => {
  const g = fresh();
  g.gold = 2500; g.inv.Lumber = 20; g.menu = async () => 0;
  await g.greenhouse_menu();
  assert.equal(g.farm_works.greenhouse, true);
  g.season = 3; g.day = 30; g.tomorrow = 'Sunny';
  g.tilled.add('40,9'); g.tilled.add('39,9');
  g.inv['Turnip Seeds'] = 1;
  await g.sow('Turnip Seeds', [40, 9]);
  assert.equal(g.crops['40,9'][0], 'Turnip');
  assert.equal(g.crops['39,9'], undefined);
  g.wet.add('40,9');
  g.show_lines = async () => {}; g.save = () => true;
  await g.new_day('passout');
  assert.equal(g.season, 0);
  assert.deepEqual(g.crops['40,9'], ['Turnip', 1]);
  assert.ok(GLASS_CELLS.includes('40,9'));
});

test('fields: sprinklers and storm protection respect coverage; feeder uses real stock', () => {
  const g = fresh();
  g.farm_works.pieces = { '10,12': 'Sprinkler', '20,12': 'Scarecrow', '30,12': 'Auto-Feeder' };
  g.tilled.add('10,11'); g.tilled.add('12,12');
  g.weather = 'Sunny';
  g.farm_works_morning([]);
  assert.ok(g.wet.has('10,11'));
  assert.equal(g.wet.has('12,12'), false);
  g.chickens = 3; g.fed = 1; g.inv['Chicken Feed'] = 1;
  g.animals = [{ fed: false }, { fed: false }]; g.inv.Fodder = 1;
  g.farm_auto_feed([]);
  assert.equal(g.fed, 2); assert.equal(g.animals.filter((a: any) => a.fed).length, 1);
  g.farm_works.greenhouse = true;
  g.weather = 'Typhoon';
  const day = g.absday();
  const vulnerable = Array.from({ length: 40 }, (_, i) => `${4 + i},15`).filter((k) => { const [x,y] = k.split(',').map(Number); return (x * 17 + y * 31 + day * 13) % 4 === 0; })[0];
  g.crops[vulnerable] = ['Turnip', 1];
  g.crops['20,11'] = ['Turnip', 1];
  g.crops['40,9'] = ['Turnip', 1];
  g.farm_works_morning([]);
  assert.equal(g.crops[vulnerable], undefined);
  assert.ok(g.crops['20,11']); assert.ok(g.crops['40,9']);
});

test('fields: old and corrupt saves get safe additive farm works', () => {
  const g = fresh();
  const old = g.snapshot(); delete old.farm_works;
  g.applySaveData(old);
  assert.deepEqual(g.farm_works, { hybrids: [], orchard: {}, channel: false, water: 0, greenhouse: false, pieces: {} });
  const bad = g.snapshot();
  bad.farm_works = { hybrids: ['Rose Turnip', 'bogus', 'Rose Turnip'], orchard: { '45,6': { planted: 0, picked: 99999 }, '8,6': { planted: 0 } }, channel: true, water: 999, greenhouse: true, pieces: { '3,9': 'Farm Fence', '8,5': 'Farm Lamp', '1,1': 'bad', '40,9': 'Farm Path' } };
  g.objs.farm = {};
  bad.map_objs.farm = {};
  g.applySaveData(bad);
  assert.deepEqual(g.farm_works.hybrids, ['Rose Turnip']);
  assert.equal(g.farm_works.water, 3);
  assert.equal(g.farm_works.orchard['45,6'].picked, -1);
  assert.equal(g.farm_works.orchard['8,6'], undefined);
  assert.equal(g.farm_works.pieces['8,5'], undefined);
});

test('fields: the barrel and equipable sapling preview their actual coverage', () => {
  const g = fresh();
  g.px = 59; g.py = 8; g.face = [1, 0];
  g.render();
  const highlighted = g.scr.tags.flat().filter((t: any) => t?.hl || t?.hlArea).map((t: any) => `${t.wx},${t.wy}`);
  assert.ok(CHANNEL_CELLS.every((k) => highlighted.includes(k)));
  g.px = 46; g.py = 7; g.face = [0, -1];
  g.inv['Orchard Sapling'] = 1; g.tool = 'Orchard Sapling';
  g.render();
  const orchard = g.scr.tags.flat().filter((t: any) => t?.hl || t?.hlArea).map((t: any) => `${t.wx},${t.wy}`);
  assert.ok(['45,6', '47,6', '49,6'].every((k) => orchard.includes(k)));
});

test('fields: enhanced renderer displays fixture glyphs and greenhouse tint', () => {
  const g = fresh();
  g.px = 42; g.py = 10; g.farm_works.greenhouse = true;
  g.farm_works.pieces['41,12'] = 'Farm Lamp';
  g.render();
  const frame = computeFrame(g.scr, 0);
  assert.ok(frame.flat().some((c: any) => c.ch === FARM_PIECES['Farm Lamp'].glyph));
  assert.ok(g.scr.tags.flat().some((c: any) => c?.greenhouse));
});
