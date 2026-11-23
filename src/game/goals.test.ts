import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './engine';
import { Screen } from './screen';
import { FORTNIGHT_GOALS, payoutLine, sanitizeFortnight, achNewly } from './goals';

function fresh(w = 100, h = 30): any {
  const g = new Game(new Screen(w, h), true) as any;
  g.new_game('Ash', 'Bramble');
  g.say = async () => {};
  g.show_lines = async () => {};
  g.show_pages = async () => {};
  g.save = () => true;
  return g;
}

const roundTrip = (g: any): any => {
  const h = fresh();
  h.applySaveData(JSON.parse(JSON.stringify(g.snapshot())));
  return h;
};

describe('First Fortnight ladder', () => {
  test('starts when the first-morning checklist ends, by finishing or hiding it', () => {
    const g = fresh();
    assert.equal(g.fortnight.active, false);
    g.end_first_steps();
    assert.equal(g.first_steps, null);
    assert.equal(g.fortnight.active, true);
    const lines = g.today_lines().join('\n');
    assert.match(lines, /First fortnight {2}0\/5/);
    for (const goal of FORTNIGHT_GOALS) assert.ok(lines.includes(goal.label));
  });

  test('each goal ticks once with a message, sparkle and reward; the last leaves a keepsake', () => {
    const g = fresh();
    g.end_first_steps();
    const gold = g.gold;
    g.fortnight.picked = true;
    g.fortnight_update();
    assert.equal(g.gold, gold + 30);
    assert.match(g.msgs.at(-1)[0], /Fortnight 1\/5: Pick your first turnip \+30G/);
    assert.ok(g.fx.some((f: any) => f.kind === 'sparkle'));
    g.fortnight_update();
    assert.equal(g.gold, gold + 30, 'no double reward');
    g.shipped_total = 10;
    g.talked = new Set(['Rowan', 'Otto', 'Hilde']);
    g.fortnight.board = true;
    g.museum = ['Turnip'];
    const seeds = g.inv['Turnip Seeds'] || 0;
    g.fortnight_update();
    assert.equal(g.inv['Turnip Seeds'], seeds + 5);
    assert.equal(g.fortnight.active, false);
    assert.equal(g.fortnight.done.length, 5);
    assert.ok(g.souvenirs.some((v: any) => v.key === 'fortnight'));
    assert.match(g.msgs.at(-1)[0], /First Fortnight complete/);
  });

  test('harvesting a turnip and reading the board set their flags', async () => {
    const g = fresh();
    g.warp('farm', 20, 15, [1, 0]);
    g.tilled.add('21,15');
    g.crops['21,15'] = ['Turnip', 99];
    g.tool = 'Hoe';
    await g.interact();
    assert.equal(g.fortnight.picked, true);
  });

  test('renders in the 2-row side-panel slot at 50 columns and in Today lines', () => {
    const g = fresh(132, 44); // a desktop-height side panel has room for it
    g.end_first_steps();
    g.render();
    const screen = g.scr.buf.map((r: any[]) => r.map((c) => c[0]).join('')).join('\n');
    assert.match(screen, /FORTNIGHT 0\/5/);
    assert.match(screen, /○ Pick a turnip/);
    // 50 columns: no side panel; Today's Plan lines must fit
    const today = g.today_lines();
    const at = today.findIndex((x: string) => x.includes('First fortnight'));
    for (const l of today.slice(at, at + 7)) assert.ok(l.length <= 50, l);
    for (const goal of FORTNIGHT_GOALS) assert.ok(goal.short.length <= 20);
  });

  test('saves and loads; old saves and bad data stay hidden', () => {
    const g = fresh();
    g.end_first_steps();
    g.fortnight.picked = true;
    g.fortnight_update();
    const h = roundTrip(g);
    assert.deepEqual(h.fortnight, g.fortnight);
    const old: any = JSON.parse(JSON.stringify(g.snapshot()));
    delete old.fortnight;
    delete old.first_steps;
    const k = fresh();
    k.applySaveData(old);
    assert.equal(k.fortnight.active, false);
    assert.deepEqual(sanitizeFortnight({ active: true, done: ['pick', 'bogus'], picked: 1 }), { active: true, done: ['pick'], picked: true, board: false });
    assert.equal(sanitizeFortnight('x').active, false);
  });
});

describe('seeds hint', () => {
  test('tilling tells the player Tab selects the seeds', () => {
    const g = fresh();
    g.warp('farm', 20, 15, [1, 0]);
    g.tilled.add('21,15');
    g.first_steps_update();
    assert.match(g.msgs.at(-1)[0], /sow your turnip seeds \(Tab selects the seeds\)/);
  });
});

describe('achievement announcements', () => {
  test('fires once with two gold lines, sparkle and a Diary star', () => {
    const g = fresh();
    g.shipped_total = 50;
    g.ach_check();
    const got = g.msgs.slice(-2).map((m: any) => m[0]);
    assert.equal(got[0], 'Achievement: First Shipment');
    assert.match(got[1], /Ship your first item/);
    assert.ok(g.fx.some((f: any) => f.kind === 'sparkle'));
    assert.equal(g.ach_unread, true);
    const n = g.msgs.length;
    g.ach_check();
    assert.equal(g.msgs.length, n);
    assert.deepEqual(g.ach_seen, ['First Shipment']);
  });

  test('advance() and new_day announce; the Diary star clears when opened', async () => {
    const g = fresh();
    g.shipped_total = 50;
    await g.advance(10);
    assert.ok(g.msgs.some((m: any) => m[0] === 'Achievement: First Shipment'));
    await g.achievements_page();
    assert.equal(g.ach_unread, false);
  });

  test('not on load; an old farm is silently seeded with finished achievements', () => {
    const g = fresh();
    g.shipped_total = 50;
    g.ach_check();
    const h = roundTrip(g);
    h.ach_check();
    assert.ok(!h.msgs.some((m: any) => m[0].startsWith('Achievement:')));
    const old: any = JSON.parse(JSON.stringify(g.snapshot()));
    delete old.ach_seen;
    delete old.ach_unread;
    const k = fresh();
    k.applySaveData(old);
    assert.deepEqual(k.ach_seen, ['First Shipment']);
    assert.equal(k.ach_unread, false);
    k.ach_check();
    assert.ok(!k.msgs.some((m: any) => m[0].startsWith('Achievement:')));
    k.museum = Array.from({ length: 10 }, (_, i) => `x${i}`);
    k.ach_check();
    assert.ok(k.msgs.some((m: any) => m[0] === 'Achievement: Museum Patron'));
  });

  test('achNewly filters by seen', () => {
    assert.deepEqual(achNewly([{ name: 'A', done: true }, { name: 'B', done: true }, { name: 'C', done: false }], ['A']).map((a) => a.name), ['B']);
  });
});

describe('bin warning and itemised payout', () => {
  test('4:30 PM warns with the waiting value and takes nothing', async () => {
    const g = fresh();
    g.bin = { Turnip: 4 };
    g.minutes = 16 * 60 + 20;
    await g.advance(10);
    const m = g.msgs.find((x: any) => x[0].startsWith('4:30'))[0];
    assert.match(m, /^4:30 PM: Otto will be along at 5 PM, [\d,]+G waiting/);
    assert.deepEqual(g.bin, { Turnip: 4 });
    const n = g.msgs.length;
    await g.advance(10);
    assert.ok(!g.msgs.slice(n).some((x: any) => x[0].startsWith('4:30')), 'once only');
  });

  test('empty bin stays quiet; a full Basket gets a reminder', async () => {
    const g = fresh();
    g.minutes = 16 * 60 + 20;
    await g.advance(10);
    assert.ok(!g.msgs.some((x: any) => x[0].startsWith('4:30')));
    g.basket = { Turnip: 2 };
    g.minutes = 16 * 60 + 20;
    await g.advance(10);
    assert.ok(g.msgs.some((x: any) => /Basket still holds goods/.test(x[0])));
    assert.deepEqual(g.basket, { Turnip: 2 });
  });

  test('5 PM names what Otto took and pays', async () => {
    const g = fresh();
    g.contracts = [];
    g.bin = { Turnip: 9, Egg: 2 };
    const gold = g.gold;
    g.minutes = 16 * 60 + 50;
    await g.advance(10);
    const total = 9 * g.bin_price('Turnip') + 2 * g.bin_price('Egg');
    assert.equal(g.gold - gold, total);
    assert.equal(g.msgs.find((x: any) => x[0].startsWith('5:00 PM'))[0], `5:00 PM: Otto took 9 Turnip, 2 Egg: +${total.toLocaleString('en-US')}G`);
  });

  test('process_zack_pickup returns the breakdown', () => {
    const g = fresh();
    g.contracts = [];
    g.bin = { Turnip: 3 };
    const p = g.process_zack_pickup();
    assert.deepEqual(p.items, [['Turnip', 3]]);
    assert.equal(p.total, 3 * g.bin_price('Turnip'));
    assert.equal(p.bonus, 0);
    assert.equal(payoutLine({ total: 1260, items: [['A', 1], ['B', 2], ['C', 3], ['D', 4]], bonus: 100 }), 'Otto took 1 A, 2 B, 3 C, 1 more: +1,260G (incl. 100G contract bonus)');
  });
});
