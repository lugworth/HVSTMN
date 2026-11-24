import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './engine';
import { Screen } from './screen';
import { COTTAGE_DOOR } from './map';
import { PASTURE_GATE_SPOT } from './ranch';
import { TRACKS, playMelody } from './audio';

function fresh(): any {
  const g = new Game(new Screen(100, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  g.say = async () => {};
  g.show_lines = async () => {};
  g.save = () => true;
  return g;
}

describe('missing mechanics & pasture gate removal', () => {
  test('pasture gate tile is removed from farm and never shows GATE action', () => {
    const g = fresh();
    assert.equal(g.maps.farm.tile(PASTURE_GATE_SPOT[0], PASTURE_GATE_SPOT[1]), 'grass');
    g.mapname = 'farm';
    g.px = PASTURE_GATE_SPOT[0];
    g.py = PASTURE_GATE_SPOT[1] + 1;
    g.face = [0, -1];
    assert.notEqual(g.facing_action().label, 'GATE');
    assert.notEqual(g.context_action().label, 'GATE');
  });

  test('10th Heartseed: Ancient Cedar Spirit on Beacon Hill summit', async () => {
    const g = fresh();
    assert.equal(g.maps.mountain.tile(26, 2), 'tree');
    assert.equal(g.maps.mountain.signs['26,2'], 'cedar_spirit');
    g.mapname = 'mountain';
    g.px = 25;
    g.py = 2;
    g.face = [1, 0];
    g.tool = 'Axe';

    // Choosing to chop anyway costs stamina/fatigue and leaves the event active
    g.menu = async () => 1;
    await g.use_tool();
    assert.equal(g.power_berries, 0);
    assert.ok(g.fatigue > 0);

    // Choosing to spare awards the 10th Heartseed
    g.menu = async () => 0;
    await g.interact();
    assert.equal(g.power_berries, 1);
    assert.ok(g.berry_sources.includes('mountain_tree'));

    // Re-triggering does not award a duplicate
    await g.interact();
    assert.equal(g.power_berries, 1);
  });

  test('TV Shopping furniture installs in Farmhouse, stores items across save/load, and Rug boosts recovery', async () => {
    const g = fresh();
    const items = ['Clock', 'Mirror', 'Refrigerator', 'Cabinet', 'Rug'];
    for (const item of items) {
      g.tv_order = [item, g.absday() + 1];
      await g.new_day('sleep');
      assert.ok(g.house_flags.includes(item), `${item} installed`);
      assert.equal(g.inv[item] || 0, 0, `${item} not left uselessly in rucksack`);
    }

    assert.equal(g.maps.house.tile(6, 1), 'clock');
    assert.equal(g.maps.house.tile(7, 1), 'mirror');
    assert.equal(g.maps.house.tile(9, 1), 'fridge');
    assert.equal(g.maps.house.tile(13, 1), 'cabinet');
    assert.equal(g.maps.house.tile(7, 4), 'rug');

    // Legacy save migration moves old rucksack furniture into house_flags
    const legacy = JSON.parse(JSON.stringify(g.snapshot()));
    legacy.house_flags = [];
    legacy.inv['Clock'] = 1;
    legacy.inv['Rug'] = 1;
    const h = fresh();
    h.applySaveData(legacy);
    assert.ok(h.house_flags.includes('Clock'));
    assert.ok(h.house_flags.includes('Rug'));
    assert.equal(h.inv['Clock'] || 0, 0);
    assert.equal(h.maps.house.tile(6, 1), 'clock');
    assert.equal(h.maps.house.tile(7, 4), 'rug');

    // Refrigerator & Cabinet store/withdraw and persist
    g.inv['Turnip'] = 5;
    g.inv['Agate'] = 3;
    let fridgeStage = 0;
    g.menu = async (_t: string, opts: string[]) => {
      if (fridgeStage === 0) { fridgeStage++; return 0; }
      if (fridgeStage === 1) { fridgeStage++; return opts.findIndex((o) => o.startsWith('Turnip ')); }
      return opts.length - 1;
    };
    g.ask_qty = async () => 2;
    await g.storage_menu('fridge');
    assert.equal(g.inv['Turnip'], 3);
    assert.equal(g.fridge_inv['Turnip'], 2);

    // Cabinet interaction awards truth:cabinet jewel and stores Agate
    g.mapname = 'house';
    g.px = 13;
    g.py = 2;
    g.face = [0, -1];
    let cabStage = 0;
    g.menu = async (_t: string, opts: string[]) => {
      if (cabStage === 0) { cabStage++; return 0; }
      if (cabStage === 1) { cabStage++; return opts.findIndex((o) => o.startsWith('Agate ')); }
      return opts.length - 1;
    };
    await g.interact();
    assert.ok(g.berry_sources.includes('truth:cabinet'));
    assert.equal(g.inv['Agate'], 1);
    assert.equal(g.cabinet_inv['Agate'], 2);

    // Save/load preserves fridge_inv and cabinet_inv
    const snap = JSON.parse(JSON.stringify(g.snapshot()));
    const restored = fresh();
    restored.applySaveData(snap);
    assert.equal(restored.fridge_inv['Turnip'], 2);
    assert.equal(restored.cabinet_inv['Agate'], 2);

    // Rug grants +5 extra overnight fatigue recovery (50 base + 5 rug = 55)
    g.fatigue = 60;
    g.vase_flower = null;
    g.fireplace_lit = false;
    await g.new_day('sleep');
    assert.equal(g.fatigue, 5);
  });

  test('Record Player installs in Farmhouse and plays Mineral Valley tracks', async () => {
    const g = fresh();
    g.gold = 5000;
    g.ask_qty = async () => 1;
    await g.buy('Record Player', 2000, 1);
    assert.equal(g.maps.house.tile(5, 4), 'record_player');
    assert.equal(TRACKS.length, 6);
    assert.equal(playMelody('nonexistent'), false);

    g.mapname = 'house';
    g.px = 6;
    g.py = 4;
    g.face = [-1, 0];
    assert.equal(g.facing_action().label, 'MUSIC');
    g.menu = async () => 0;
    await g.interact();
    assert.ok(g.msgs.some(([txt]: [string]) => txt.includes(TRACKS[0].title)));
  });

  test('Town Cottage builds in town, opens anytime including festivals, plays Gameshow TV, and completes all 9 Truth Jewels -> Gem of Truth', async () => {
    const g = fresh();
    assert.equal(g.maps.town.signs[`${COTTAGE_DOOR[0]},${COTTAGE_DOOR[1]}`], 'cottage_plot');

    g.project = ['Town Cottage', g.absday()];
    await g.new_day('sleep');
    assert.ok(g.house_flags.includes('Town Cottage'));
    assert.equal(g.maps.town.doors[`${COTTAGE_DOOR[0]},${COTTAGE_DOOR[1]}`], 'cottage');
    assert.ok(g.interiors['cottage']);
    assert.equal(await g.fest_closed('cottage'), false);

    g.enter_interior('cottage');
    assert.equal(g.mapname, 'in_cottage');
    g.season = 2;
    g.day = 15;
    g.menu = async () => 2; // Ch 3 -> Gameshow
    const said: string[] = [];
    g.say = async (txt: string) => { said.push(txt); };
    await g.tv_menu();
    assert.ok(said.some((s) => s.includes('Gameshow')));

    // Collect all 9 Truth Jewels:
    g.menu = async () => 2; // Leave calendar
    await g.calendar_menu();
    g.mapname = 'town';
    g.px = 61;
    g.py = 7;
    g.face = [0, 1];
    await g.interact();
    g.enter_interior('mayor');
    g.px = 1;
    g.py = 2;
    g.face = [0, -1];
    await g.interact();
    g.house_flags.push('Cabinet');
    g.rebuild_house();
    g.mapname = 'house';
    g.px = 13;
    g.py = 2;
    g.face = [0, -1];
    g.menu = async () => 2;
    await g.interact();
    g.give_truth_jewel('doghouse');
    g.give_truth_jewel('stable');
    g.give_truth_jewel('library');
    g.give_truth_jewel('won_shop');
    g.give_truth_jewel('medals_1000');

    assert.equal(g.truth_jewels, 9);
    assert.equal(g.inv['Truth Jewel'] || 0, 0);
    assert.equal(g.inv['Gem of Truth'], 1);

    // HUD displays exact Fatigue & Truth marker even when fatigue < 50
    g.fatigue = 12;
    g.render();
    const hudRows = g.scr.buf.map((r: any) => r.map((c: any) => c[0]).join('')).join('\n');
    assert.match(hudRows, /FATIGUE ★\s+12\/100/);
  });
});
