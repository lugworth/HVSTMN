import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, PRESERVES } from './constants';
import {
  buildDisplayRows,
  buildInventoryEntries,
  buildInventoryTabs,
  classifyInventoryItem,
  computeInventoryLayout,
  computeListViewport,
  findItemRowIndex,
  fitTabStrip,
  formatListItemRow,
  nextSortMode,
  pageItemRow,
  sortAndFilterInventory,
  stepItemRow,
} from './inventory-ui';

const def = (n: string) => ITEMS[n] as [number, number, string] | undefined;
const isPreserve = (n: string) => PRESERVES.includes(n);

describe('inventory-ui pure helpers', () => {
  test('classifies all ITEMS categories into intuitive rucksack tabs', () => {
    for (const [name, val] of Object.entries(ITEMS)) {
      const cat = classifyInventoryItem(name, val[2]);
      assert.ok(['seed', 'crop', 'forage', 'fish', 'ranch', 'food', 'goods'].includes(cat), `${name} -> ${cat}`);
    }
    assert.equal(classifyInventoryItem('Orchard Sapling', ITEMS['Orchard Sapling'][2]), 'seed');
    assert.equal(classifyInventoryItem('Turnip Seeds', 'seed'), 'seed');
    assert.equal(classifyInventoryItem('Pickled Turnip', 'dish'), 'food');
    assert.equal(classifyInventoryItem('Rice', 'ingredient'), 'food');
    assert.equal(classifyInventoryItem('Small Cheese', 'animal'), 'ranch');
    assert.equal(classifyInventoryItem('Copper', 'ore'), 'goods');
    assert.equal(classifyInventoryItem('Clay Whistle', 'relic'), 'goods');
    assert.equal(classifyInventoryItem('Basket', 'special'), 'goods');
  });

  test('builds non-empty category tabs in canonical order and filters/sorts cleanly', () => {
    const inv = {
      Turnip: 5,
      'Turnip Seeds': 2,
      Copper: 12,
      'Small Fish': 1,
      Salad: 3,
    };
    const entries = buildInventoryEntries(inv, 'Turnip', 0, 30, def, isPreserve);
    const tabs = buildInventoryTabs(entries);
    assert.deepEqual(
      tabs.map((t) => `${t.id}:${t.count}`),
      ['all:5', 'seed:1', 'crop:1', 'fish:1', 'food:1', 'goods:1'],
    );
    assert.equal(tabs[0].totalQty, 23);

    const byVal = sortAndFilterInventory(entries, 'all', 'value');
    assert.equal(byVal[0].name, 'Salad');
    assert.equal(byVal.at(-1)!.name, 'Turnip Seeds');

    const byQty = sortAndFilterInventory(entries, 'all', 'qty');
    assert.equal(byQty[0].name, 'Copper');

    const byName = sortAndFilterInventory(entries, 'all', 'name');
    assert.deepEqual(
      byName.map((e) => e.name),
      ['Copper', 'Salad', 'Small Fish', 'Turnip', 'Turnip Seeds'],
    );

    assert.equal(nextSortMode('category'), 'value');
    assert.equal(nextSortMode('name'), 'category');
  });

  test('inserts section headers in All+Category and skips headers when stepping', () => {
    const inv = { Turnip: 2, Potato: 1, 'Turnip Seeds': 3, Copper: 4 };
    const entries = buildInventoryEntries(inv, null, 0, 30, def, isPreserve);
    const sorted = sortAndFilterInventory(entries, 'all', 'category');
    const rows = buildDisplayRows(sorted, 'all', 'category', true);
    assert.deepEqual(
      rows.map((r) => (r.kind === 'header' ? `#${r.label}` : r.entry.name)),
      ['#SEEDS', 'Turnip Seeds', '#CROPS', 'Potato', 'Turnip', '#GOODS', 'Copper'],
    );

    assert.equal(findItemRowIndex(rows, 'Potato'), 3);
    assert.equal(findItemRowIndex(rows, 'Missing'), 1);

    let cur = 1; // Turnip Seeds
    cur = stepItemRow(rows, cur, 1);
    assert.equal(cur, 3, 'skips #CROPS header');
    cur = stepItemRow(rows, cur, -1);
    assert.equal(cur, 1, 'skips header backwards');
    cur = stepItemRow(rows, cur, -1);
    assert.equal(cur, 6, 'wraps cleanly to Copper');

    const paged = pageItemRow(rows, 1, 4, 1);
    assert.ok(rows[paged].kind === 'item');
  });

  test('keeps preceding section header in viewport and computes scrollbar geometry', () => {
    const inv = {
      'Turnip Seeds': 2,
      'Potato Seeds': 2,
      Turnip: 1,
      Potato: 1,
      Cucumber: 1,
      'Bamboo Shoot': 1,
      'Small Fish': 1,
      Copper: 1,
    };
    const entries = buildInventoryEntries(inv, null, 0, 30, def, isPreserve);
    const sorted = sortAndFilterInventory(entries, 'all', 'category');
    const rows = buildDisplayRows(sorted, 'all', 'category', true);
    // Select first item under CROPS when listH=6; ensure viewport pulls header in if at boundary
    const turnipIdx = findItemRowIndex(rows, 'Cucumber');
    const vp = computeListViewport(rows, turnipIdx, 6);
    assert.equal(vp.visRows.length, 6);
    assert.ok(vp.thumbHeight >= 1 && vp.thumbTop >= 0 && vp.thumbTop + vp.thumbHeight <= 6);
  });

  test('fitTabStrip fits all tabs on desktop and windows around active tab on narrow phones', () => {
    const inv = {
      'Turnip Seeds': 1,
      Turnip: 1,
      'Bamboo Shoot': 1,
      'Small Fish': 1,
      Egg: 1,
      Salad: 1,
      Copper: 1,
    };
    const tabs = buildInventoryTabs(buildInventoryEntries(inv, null, 0, 30, def, isPreserve));
    const wide = fitTabStrip(tabs, 'food', 68, false);
    assert.equal(wide.chips.length, tabs.length);
    assert.equal(wide.leftArrow, false);
    assert.equal(wide.rightArrow, false);

    const narrow = fitTabStrip(tabs, 'food', 32, true);
    assert.ok(narrow.chips.some((c) => c.id === 'food' && c.active), 'active tab is always visible');
    assert.ok(narrow.leftArrow || narrow.rightArrow, 'overflow arrow shown on narrow strip');
    for (const c of narrow.chips) {
      assert.ok(c.x + c.w <= 32, `chip ${c.text} fits within 32 cols`);
    }
  });

  test('computeInventoryLayout splits on desktop (>64 map cols) and stacks on 80x24 and 50x24', () => {
    // 96x31 desktop with 24-col side panel -> divX = 71, divY = 29
    const desk = computeInventoryLayout(96, 31, 71, 29);
    assert.equal(desk.split, true);
    assert.ok(desk.bx + desk.bw <= 71, 'stays left of HUD side panel');
    assert.ok(desk.by + desk.bh <= 29, 'stays above bottom fence');
    assert.ok(desk.listW >= 26 && desk.detailW >= 24);

    // 80x24 smaller desktop -> divX = 55, divY = 22
    const smallDesk = computeInventoryLayout(80, 24, 55, 22);
    assert.equal(smallDesk.split, false);
    assert.ok(smallDesk.bx + smallDesk.bw <= 55);
    assert.ok(smallDesk.listH >= 5);

    // 50x24 mobile compact -> divX = 50, divY = 20
    const phone = computeInventoryLayout(50, 24, 50, 20);
    assert.equal(phone.split, false);
    assert.ok(phone.bx + phone.bw <= 50);
    assert.ok(phone.by + phone.bh <= 20);
    assert.ok(phone.listH >= 5);
  });

  test('formatListItemRow formats quantities, tags, and Basket neatly', () => {
    const entries = buildInventoryEntries(
      { 'Sweet Potato Seeds': 12, Basket: 1, Turnip: 4 },
      'Turnip',
      11,
      30,
      def,
      isPreserve,
    );
    const seedRow = formatListItemRow(entries[0], 28);
    assert.equal(seedRow.qtyStr, '×12');
    assert.ok(seedRow.nameStr.length <= 28);

    const basketRow = formatListItemRow(entries[1], 28);
    assert.equal(basketRow.qtyStr, '');
    assert.equal(basketRow.tagStr, '11/30');

    const turnipRow = formatListItemRow(entries[2], 28);
    assert.equal(turnipRow.heldMark, '*');
    assert.equal(turnipRow.tagStr, '60G');
  });
});
