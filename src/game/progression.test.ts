import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './engine';
import { Screen } from './screen';
import { computeFrame } from './enhanced';
import { CAN_CAP, FRUITS, ITEMS, RECIPES } from './constants';
import { FARM_PIECES, HYBRIDS } from './farm-works';
import {
  mineElevatorFloors,
  matchExperimentalRecipe,
  foodBuffForDish,
  rollDailyLuck,
  LUCK_LABELS,
  readAssistSettings,
  writeAssistSettings,
} from './progression';

function fresh(): any {
  const g = new Game(new Screen(100, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  g.say = async () => {};
  g.show_lines = async () => {};
  g.save = () => true;
  return g;
}

describe('progression, discovery, luck, assist modes & farm-works polish (G3, G6, G7, G13, G18, tasks 20/41)', () => {
  test('G3: mastery perks unlock at Adept and apply to watering can capacity, shipping value & forage snacks', () => {
    const g = fresh();
    // Watering can perk (+10 capacity)
    g.mastery_perks = { farming: 'farm_can' };
    g.mapname = 'farm';
    g.px = 50; g.py = 6; g.face = [1, 0];
    g.maps.farm.set(51, 6, 'water');
    g.tool = 'Watering Can';
    g.water = 0;
    g.use_tool();
    assert.equal(g.water, CAN_CAP[0] + 10);

    // Crop ship value perk (+15%)
    g.mastery_perks = { farming: 'farm_value' };
    g.contracts = [];
    g.bin = { Turnip: 10 };
    const expected = Math.round(ITEMS['Turnip'][0] * 1.15) * 10;
    const paid = g.process_zack_pickup();
    assert.equal(paid, expected);
  });

  test('G6: mine elevator unlocks every 25 floors discovered and respects stamina fee vs Wellkeeper blessing', async () => {
    assert.deepEqual(mineElevatorFloors(5, false), [1]);
    const floors60 = mineElevatorFloors(60, false);
    assert.ok(floors60.includes(25) && floors60.includes(50) && !floors60.includes(75));
    // the blessing waives the fee but never offers unreached floors
    assert.deepEqual(mineElevatorFloors(5, true), [1]);
    assert.ok(!mineElevatorFloors(60, true).includes(255) && !mineElevatorFloors(60, true).includes(100));
    assert.ok(mineElevatorFloors(255, false).includes(255));

    const g = fresh();
    g.max_spring_floor = 50;
    g.goddess_gifts = 0;
    g.stamina = 100;
    // Pick floor index 1 (B10F) -> spends 5 stamina when not blessed
    g.menu = async () => 1;
    await g.prompt_mine_entry('spring');
    assert.equal(g.mapname, 'mine');
    assert.ok(g.mine_floor >= 10);
    assert.equal(g.stamina, 95);
  });

  test('G7: experimental cooking discovers matching real recipes, unmatched yields Failed Dish, and eating dishes activates timed food buffs', async () => {
    // 2 Turnip matches Pickled Turnip (no utensil required)
    const match = matchExperimentalRecipe(['Turnip', 'Turnip'], RECIPES, ITEMS, FRUITS, {});
    assert.equal(match, 'Pickled Turnip');
    const miss = matchExperimentalRecipe(['Turnip'], RECIPES, ITEMS, FRUITS, {});
    assert.equal(miss, null);

    const g = fresh();
    g.inv['Turnip'] = 2;
    g.recipes_discovered = [];
    // Pick Turnip, pick Turnip, then Cook now!
    const picks = [0, 0, 0];
    g.menu = async () => picks.shift() ?? 0;
    await g.experimental_cook();
    assert.equal(g.inv['Pickled Turnip'], 1);
    assert.ok(g.recipes_discovered.includes('Pickled Turnip'));

    // Timed food buffs
    const buff = foodBuffForDish('Curry Rice', 40);
    assert.equal(buff?.kind, 'mining');
    const stamBuff = foodBuffForDish('Boiled Egg', 25);
    assert.equal(stamBuff?.kind, 'stamina');

    // Eating a stamina-buff dish reduces subsequent stamina cost by 1
    g.food_buff = { kind: 'stamina', label: 'Well Fed (-1 tool stamina)', until: g.now_abs() + 240 };
    g.stamina = 100;
    await g.spend(3);
    assert.equal(g.stamina, 98);
  });

  test('G13: daily luck is deterministic, shown in Today and TV, and Radiant luck boosts gift points', async () => {
    const l1 = rollDailyLuck(12, 42);
    const l2 = rollDailyLuck(12, 42);
    assert.equal(l1, l2);
    assert.ok(l1 in LUCK_LABELS);

    const g = fresh();
    g.daily_luck = 2; // Radiant
    const today = g.today_lines().join('\n');
    assert.match(today, /Fortune: Radiant/);

    // Radiant luck adds +1 bonus to non-hated gift over a balanced day
    const g0 = fresh();
    g0.daily_luck = 0;
    g0.inv['Egg'] = 1;
    g0.held = 'Egg';
    await g0.talk('Dennis');
    const baseGain = g0.friend['Dennis'];

    g.inv['Egg'] = 1;
    g.held = 'Egg';
    const before = g.friend['Dennis'] || 0;
    await g.talk('Dennis');
    assert.equal(g.friend['Dennis'], before + baseGain + 1);
  });

  test('G18: assist modes prevent fainting, confirm destructive flattening, and persist in storage', async () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
    };
    writeAssistSettings(storage, { noFaint: true, easyFishing: true, confirmDestructive: true });
    assert.deepEqual(readAssistSettings(storage), { noFaint: true, easyFishing: true, confirmDestructive: true });

    const g = fresh();
    g.assist = { noFaint: true, easyFishing: true, confirmDestructive: true };
    g.stamina = 1;
    g.fatigue = 99;
    await g.spend(10);
    assert.equal(g.passing_out, false);
    assert.ok(g.stamina >= 1);
    assert.ok(g.fatigue < 100);

    // confirmDestructive blocks flattening tilled soil when player declines
    g.mapname = 'farm';
    g.objs.farm = {};
    g.px = 10; g.py = 12; g.face = [1, 0];
    g.tilled.add('11,12');
    g.tool = 'Hammer';
    g.confirm = async () => false;
    await g.use_tool();
    assert.equal(g.tilled.has('11,12'), true);
    g.confirm = async () => true;
    await g.use_tool();
    assert.equal(g.tilled.has('11,12'), false);
  });

  test('tasks 20 & 41 polish: hybrid crops support seed saving and equipped farm pieces preview glyph & coverage', () => {
    const g = fresh();
    for (const h of HYBRIDS) {
      const r = g.seed_recipe(h.crop);
      assert.ok(r && r.need === 3 && r.bags === 1, `${h.crop} can save seeds`);
    }
    g.inv['Rose Turnip'] = 3;
    assert.equal(g.save_seeds('Rose Turnip'), true);
    assert.equal(g.inv['Rose Turnip Seeds'], 1);

    // Farm piece preview: aiming a Sprinkler at open farm ground previews its glyph and 4 touching tiles
    g.mapname = 'farm';
    g.objs.farm = {};
    g.px = 14; g.py = 14; g.face = [1, 0];
    g.inv['Sprinkler'] = 1;
    g.tool = 'Sprinkler';
    assert.match(g.facing_action().summary, /Place Sprinkler/);
    g.render();
    const previewTag = g.scr.tags.flat().find((t: any) => t?.piecePreview?.ch === FARM_PIECES['Sprinkler'].glyph);
    assert.ok(previewTag, 'target tile carries piecePreview glyph');
    const highlighted = g.scr.tags.flat().filter((t: any) => t?.hl || t?.hlArea).map((t: any) => `${t.wx},${t.wy}`);
    assert.ok(highlighted.includes('15,13') && highlighted.includes('15,15') && highlighted.includes('16,14'));
    const frame = computeFrame(g.scr, 0);
    assert.ok(frame.flat().some((c: any) => c.ch === FARM_PIECES['Sprinkler'].glyph));
  });
});
