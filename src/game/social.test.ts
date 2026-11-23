import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './engine';
import { Screen } from './screen';
import { computeFrame } from './enhanced';
import { SPOUSE_POS } from './constants';
import {
  OUTINGS,
  dinnerPairLines,
  dinnerDishReaction,
  classifyChildItem,
  matchTeaDrink,
  teaRegularFor,
  rollSpouseRoutine,
  composeStampPrint,
  reactiveNpcLine,
} from './social';

function fresh(): any {
  const g = new Game(new Screen(100, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  g.say = async () => {};
  g.show_lines = async () => {};
  g.save = () => true;
  return g;
}

describe('social & family mechanics (tasks 02, 06, 08, 43, 47, 48 & G11)', () => {
  test('task 02: short outings advance 10 minutes, grant bonus/friendship/memory, and respect weekly cooldown', async () => {
    const g = fresh();
    g.friend['Rowan'] = 25;
    g.minutes = 11 * 60;
    g.weather = 'Sunny';
    g.gray_quest = 3; // skip Rowan's copper quest intro
    g.day = 2; // not a festival

    const def = g.outing_available('Rowan');
    assert.ok(def && def.id === 'rowan_walk');
    const beforeMin = g.minutes;
    const beforeFriend = g.friend['Rowan'];
    await g.run_outing(def);

    assert.equal(g.minutes, beforeMin + 10);
    assert.equal(g.friend['Rowan'], beforeFriend + 6);
    assert.equal(g.inv['Copper'], 1);
    assert.ok(g.memories.some((m: any) => m.npc === 'Rowan' && m.text.includes('Ironwood')));
    // Cooldown prevents repeating the same week
    assert.equal(g.outing_available('Rowan'), null);

    // Nico summer fishing outing
    g.season = 1;
    g.day = 3;
    g.friend['Nico'] = 25;
    const nicoDef = g.outing_available('Nico');
    assert.ok(nicoDef && nicoDef.id === 'nico_fish');
    await g.run_outing(nicoDef);
    assert.equal(g.inv['Medium Fish'], 1);
    assert.ok(OUTINGS.length >= 3);
  });

  test('task 06: invite two neighbors to dinner with pair dialogue and dish-specific reactions', async () => {
    const g = fresh();
    g.house_flags.push('Kitchen');
    g.friend['Hilde'] = 30;
    g.friend['Rowan'] = 30;
    g.inv['Curry Rice'] = 1;

    // Pair exchange helper returns bespoke banter for Hilde + Rowan
    const lines = dinnerPairLines('Rowan', 'Hilde', 'Curry Rice');
    assert.equal(lines.length, 2);
    assert.match(lines[0][1], /Rowan/);
    assert.ok(dinnerDishReaction('Rowan', 'Curry Rice', 'love').pts > dinnerDishReaction('Rowan', 'Curry Rice', 'hate').pts);

    // Full dinner menu flow
    const eligible = Object.keys(g.friend).filter((n) => g.friend[n] >= 20 && n !== 'Wellkeeper' && n !== 'Reed Heron');
    const idx1 = eligible.indexOf('Hilde');
    const rest = eligible.filter((n) => n !== 'Hilde');
    const idx2 = rest.indexOf('Rowan');
    const picks = [idx1, idx2, 0];
    g.menu = async () => picks.shift() ?? 0;

    const minBefore = g.minutes;
    await g.dinner_menu();
    assert.equal(g.inv['Curry Rice'] || 0, 0);
    assert.equal(g.minutes, minBefore + 60);
    assert.equal(g.dinner_day, g.absday());
    assert.ok(g.friend['Hilde'] > 30 && g.friend['Rowan'] > 30);
    assert.ok(g.memories.some((m: any) => m.npc === 'Hilde' && m.text.includes('Curry Rice')));

    // Cannot host twice in one day
    g.inv['Salad'] = 1;
    const said: string[] = [];
    g.say = async (t: string) => { said.push(t); };
    await g.dinner_menu();
    assert.ok(said.some((s) => s.includes('already hosted dinner')));
  });

  test('task 08: child develops interests when shown fish, seeds, or relics and unlocks seasonal milestone scenes', async () => {
    const g = fresh();
    g.married = 'Odessa';
    g.child_name = 'Sprout';
    g.child_days = 0;
    g.mapname = 'house';

    assert.equal(classifyChildItem('Turnip Seeds', 'seed'), 'gardening');
    assert.equal(classifyChildItem('Small Fish', 'fish'), 'fishing');
    assert.equal(classifyChildItem('Clay Whistle', 'relic'), 'history');

    // Show a fish to the child
    g.inv['Small Fish'] = 1;
    g.held = 'Small Fish';
    await g.child_interact();
    assert.equal(g.child_state.points.fishing, 3);
    assert.equal(g.inv['Small Fish'], 1, 'showing a fish does not destroy it');

    // Advance seasons & trigger early + seasoned milestone scenes
    g.held = null;
    g.child_days = 16;
    const scenes: string[] = [];
    g.say = async (t: string) => { scenes.push(t); };
    await g.child_interact();
    assert.ok(g.child_state.scenes.includes('early:fishing'));
    assert.ok(scenes.some((s) => s.includes('willow chub')));

    g.child_days = 46;
    await g.child_interact();
    assert.ok(g.child_state.scenes.includes('season:fishing'));
    assert.ok(scenes.some((s) => s.includes('hook knot')));

    // new_day increments child_days
    const beforeDays = g.child_days;
    await g.new_day('sleep');
    assert.equal(g.child_days, beforeDays + 1);
  });

  test('task 43: rainy-night tea & coffee counter brews drinks and advances weekly regular stories', async () => {
    const g = fresh();
    g.weather = 'Rain';
    g.minutes = 19 * 60;
    assert.equal(g.tea_counter_now(), true);
    const innOpts = await g.shop_options('inn');
    assert.ok(innOpts.some(([label]: [string, unknown]) => label.includes('coffee & tea')));

    // Verify recipe matcher
    assert.equal(matchTeaDrink('roast_bean', 'warm_milk')?.id, 'cafe_au_lait');
    assert.equal(matchTeaDrink('tea_leaf', 'wild_honey')?.id, 'honey_tea');
    assert.equal(matchTeaDrink('tea_leaf', 'roast_bean'), null);

    // Serve the exact drink this week's regular wants
    const reg = teaRegularFor(g.absday());
    const ingIds = ['tea_leaf', 'roast_bean', 'wild_honey', 'warm_milk'];
    const drink = reg.drinkId === 'cafe_au_lait'
      ? [1, 3]
      : reg.drinkId === 'honey_tea'
        ? [0, 2]
        : reg.drinkId === 'milk_tea'
          ? [0, 3]
          : [1, 2];
    const picks = [...drink];
    g.menu = async () => picks.shift() ?? 0;
    const friendBefore = g.friend[reg.npc] || 0;
    await g.tea_counter_menu();
    assert.equal(g.tea_progress[reg.npc], 1);
    assert.equal(g.friend[reg.npc], friendBefore + 6);
    assert.equal(g.tea_last_day, g.absday());
    assert.ok(ingIds.length === 4);
  });

  test('task 47: spouse runs weather/season routines at home (breakfast, flowers, outing note)', async () => {
    const g = fresh();
    g.married = 'Margit';
    g.tomorrow = 'Rain';
    await g.new_day('sleep');
    assert.ok(g.spouse_routine);
    assert.equal(g.spouse_routine.kind, 'breakfast');
    assert.ok(g.spouse_routine.gift);

    // Claiming breakfast from the farmhouse table gives the cooked dish
    g.menu = async () => 0;
    await g.house_table_menu();
    assert.equal(g.spouse_routine.claimed, true);
    assert.ok((g.inv[g.spouse_routine.gift] || 0) >= 1);

    // Outing routine makes spouse temporarily away during afternoon hours and leaves a note
    const outing = rollSpouseRoutine('Margit', 5, 2, 'Sunny');
    assert.equal(outing.kind, 'outing');
    assert.ok(outing.note);
    g.spouse_routine = { ...outing, day: g.absday() };
    g.minutes = 13 * 60;
    assert.equal(g.spouse_is_away(), true);
    assert.equal(g.npc_at(SPOUSE_POS[0], SPOUSE_POS[1], 'house'), null);
    g.minutes = 18 * 60;
    assert.equal(g.spouse_is_away(), false);
    assert.equal(g.npc_at(SPOUSE_POS[0], SPOUSE_POS[1], 'house'), 'Margit');
  });

  test('task 48: indoor winter stamp-printing bench hangs prints on the wall or packs them to gift neighbors', async () => {
    const g = fresh();
    g.mapname = 'house';
    assert.equal(g.maps.house.tile(13, 8), 'stamp_bench');

    const sample = composeStampPrint([0, 1, 2], 0, 10);
    assert.equal(sample.marks, '▲ ◉ ≈');

    // Compose and hang on wall
    const wallPicks = [0, 0, 1, 4, 0, 0]; // compose, marks 0/1/4, ink 0, hang on wall
    g.menu = async () => wallPicks.shift() ?? 0;
    await g.stamp_bench_menu();
    assert.ok(g.wall_print);
    assert.equal(g.prints.length, 1);

    // Compose and pack as a giftable Block Print
    const giftPicks = [0, 3, 5, 7, 2, 1]; // compose, marks 3/5/7, ink 2, pack as Block Print
    g.menu = async () => giftPicks.shift() ?? 0;
    await g.stamp_bench_menu();
    assert.equal(g.inv['Block Print'], 1);

    // Gift Block Print to a neighbor
    g.held = 'Block Print';
    const before = g.friend['Odessa'] || 0;
    await g.talk('Odessa');
    assert.equal(g.inv['Block Print'] || 0, 0);
    assert.ok(g.friend['Odessa'] > before);
    assert.ok(g.memories.some((m: any) => m.npc === 'Odessa' && m.text.includes('block print')));
  });

  test('G11: reactive NPC dialogue and winter coat renderer tag, plus save/load & old-save compatibility', () => {
    const rainLine = reactiveNpcLine('Rowan', { weather: 'Rain', season: 0, married: null, recentFestWin: false });
    assert.ok(rainLine && rainLine.includes('forge'));
    const giftLine = reactiveNpcLine('Tess', { weather: 'Sunny', season: 1, married: null, recentFestWin: false, lastGift: 'Curry Rice' });
    assert.ok(giftLine && giftLine.includes('Curry Rice'));

    // Winter outdoor NPC gets winterCoat tag and warm scarf detail in computeFrame
    const g = fresh();
    g.season = 3;
    g.mapname = 'town';
    g.px = 34;
    g.py = 12;
    g.npc_pos['Ambrose'] = [35, 12];
    g.render();
    const npcTag = g.scr.tags.flat().find((t: any) => t?.ent === 'npc' && t?.winterCoat);
    assert.ok(npcTag, 'winter outdoor NPC should be tagged with winterCoat');
    const frame = computeFrame(g.scr, 0);
    assert.ok(frame.flat().some((c: any) => c.detail?.ch === '≈'));

    // Save/load round-trip + old save defaults
    g.outings_done = { rowan_walk: 5 };
    g.child_state.points.fishing = 9;
    g.tea_progress = { Rowan: 2 };
    g.wall_print = composeStampPrint([0, 2, 4], 1, 3);
    const snap = JSON.parse(JSON.stringify(g.snapshot()));
    const h = fresh();
    h.applySaveData(snap);
    assert.deepEqual(h.outings_done, { rowan_walk: 5 });
    assert.equal(h.child_state.points.fishing, 9);
    assert.equal(h.tea_progress.Rowan, 2);
    assert.equal(h.wall_print?.marks, '▲ ≈ ✦');

    delete snap.outings_done;
    delete snap.child_state;
    delete snap.tea_progress;
    delete snap.wall_print;
    delete snap.spouse_routine;
    h.applySaveData(snap);
    assert.deepEqual(h.outings_done, {});
    assert.equal(h.child_state.points.fishing, 0);
    assert.equal(h.wall_print, null);
  });
});
