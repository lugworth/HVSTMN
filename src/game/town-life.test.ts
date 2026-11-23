import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './engine';
import { Screen } from './screen';
import {
  GUEST_VENDOR_SPOT,
  PANTRY_SPOT,
  PANTRY_GOAL,
  PANTRY_RECIPE,
  TRAIL_ENCOUNTERS,
  activeGuestVendor,
  festivalVariant,
} from './town-life';

function fresh(): any {
  const g = new Game(new Screen(100, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  g.say = async () => {};
  g.show_lines = async () => {};
  g.save = () => true;
  return g;
}

describe('town life & events (tasks 11, 13, 15, 36 & G10, G16)', () => {
  test('task 11: guest vendors visit occasionally, then earn repeat spots after market success or public works', async () => {
    // Odd/even week guest visits
    const bramGuest = activeGuestVendor({ absday: 2, weekday: 2, minutes: 10 * 60, festival: false, regulars: [] });
    assert.equal(bramGuest?.id, 'bram');
    assert.equal(activeGuestVendor({ absday: 9, weekday: 2, minutes: 10 * 60, festival: false, regulars: [] }), null);
    // Once regular, Bram visits every Wed & Sat
    const bramSat = activeGuestVendor({ absday: 12, weekday: 5, minutes: 11 * 60, festival: false, regulars: ['bram'] });
    assert.equal(bramSat?.id, 'bram');

    const g = fresh();
    g.stall_earned = 600;
    g.public_works.built = true;
    await g.new_day('sleep');
    assert.ok(g.guest_regulars.includes('bram'));
    assert.ok(g.guest_regulars.includes('maren'));

    // Visible on town map when active and reachable
    g.mapname = 'town';
    g.day = 3; // Wed (absday 2)
    g.minutes = 10 * 60;
    assert.equal(g.current_guest_vendor()?.id, 'bram');
    assert.equal(g.walkable('town', GUEST_VENDOR_SPOT[0], GUEST_VENDOR_SPOT[1] + 1), true);
  });

  test('task 13 & G10: festival role selection (cook/setup/compete) and yearly festival variants', async () => {
    assert.notEqual(festivalVariant('cooking', 1).theme, festivalVariant('cooking', 2).theme);
    assert.notEqual(festivalVariant('harvest', 1).theme, festivalVariant('harvest', 2).theme);

    const g = fresh();
    g.inv['Turnip'] = 2;
    const goldBefore = g.gold;
    const gideonBefore = g.friend['Gideon'] || 0;
    // Choose role 1 = Cook for the festival table
    g.menu = async () => 1;
    await g.fest_run(['Cooking Festival', 10, 18, 'cooking']);
    assert.equal(g.fest_roles_done['1:cooking'], 'cook');
    assert.equal(g.inv['Turnip'], 1);
    assert.ok(g.gold > goldBefore);
    assert.ok(g.friend['Gideon'] > gideonBefore);
    assert.ok(g.souvenirs.some((s: any) => s.key === 'fest_role:cook'));

    // Choose role 2 = Help set up Market Cross in Year 2
    g.year = 2;
    g.fest_attended = false;
    g.menu = async () => 2;
    const ingridBefore = g.friend['Ingrid'] || 0;
    await g.fest_run(['Harvest Supper', 10, 18, 'harvest']);
    assert.equal(g.fest_roles_done['2:harvest'], 'setup');
    assert.ok(g.friend['Ingrid'] > ingridBefore);
    assert.ok(g.souvenirs.some((s: any) => s.key === 'fest_role:setup'));
  });

  test('task 15: community pantry turns surplus ingredients into a recurring shared meal and teaches a recipe', async () => {
    const g = fresh();
    assert.equal(g.maps.town.tile(PANTRY_SPOT[0], PANTRY_SPOT[1]), 'pantry');
    g.inv['Turnip'] = PANTRY_GOAL;

    // Donate 6 items
    for (let i = 0; i < PANTRY_GOAL; i++) {
      const picks: (number | null)[] = [0, 0, null]; // Donate -> Turnip -> Leave
      g.menu = async () => (picks.length ? picks.shift()! : null);
      await g.pantry_menu();
    }
    assert.equal(g.pantry.items.length, PANTRY_GOAL);
    assert.equal(g.inv['Turnip'] || 0, 0);

    // Hold shared meal -> stamina boost, friendship, learns Brackenford Potluck Stew
    g.stamina = 50;
    g.menu = async () => 1; // Hold Community Shared Meal!
    const tessBefore = g.friend['Tess'] || 0;
    await g.pantry_menu();
    assert.equal(g.pantry.meals, 1);
    assert.equal(g.pantry.items.length, 0);
    assert.equal(g.pantry.recipeLearned, true);
    assert.ok(g.recipes_discovered.includes(PANTRY_RECIPE));
    assert.ok(g.stamina >= 90);
    assert.ok(g.friend['Tess'] > tessBefore);
    assert.ok(g.souvenirs.some((s: any) => s.key === 'pantry_first_meal'));
  });

  test('task 36: people met along the trail include a one-screen detour (Margit scarf) and direct encounters', async () => {
    const g = fresh();
    // Test Margit's dropped scarf detour in Cedar Hollow
    const scarfDef = TRAIL_ENCOUNTERS.find((e) => e.id === 'woods_scarf')!;
    g.trail_encounter = { day: g.absday(), id: scarfDef.id, found: false, done: false };
    g.mapname = 'woods';

    // Talking before finding scarf prompts detour and leaves encounter open
    const beforeFriend = g.friend['Margit'] || 0;
    assert.equal(await g.trail_interact_at(scarfDef.pos[0], scarfDef.pos[1]), true);
    assert.equal(g.trail_encounter.done, false);

    // Pick up dropped scarf on the one-screen detour
    assert.equal(await g.trail_interact_at(scarfDef.itemPos![0], scarfDef.itemPos![1]), true);
    assert.equal(g.trail_encounter.found, true);

    // Return scarf to Margit -> reward, friendship, memory, complete
    assert.equal(await g.trail_interact_at(scarfDef.pos[0], scarfDef.pos[1]), true);
    assert.equal(g.trail_encounter.done, true);
    assert.equal(g.inv['Mending Tonic'], 1);
    assert.equal(g.friend['Margit'], beforeFriend + 5);
    assert.ok(g.memories.some((m: any) => m.npc === 'Margit' && m.text.includes('scarf')));
  });

  test('G16: Otto weekly shipping contracts credit shipments, pay bonus gold, and survive save/load', () => {
    const g = fresh();
    assert.ok(g.contracts.length >= 1);
    const c = g.contracts[0];
    g.bin[c.item] = c.need;
    const goldBefore = g.gold;
    const ottoBefore = g.friend['Otto'] || 0;
    const total = g.process_zack_pickup();
    assert.equal(c.done, true);
    assert.equal(c.shipped, c.need);
    assert.ok(total > c.bonusGold);
    assert.equal(g.gold, goldBefore + total);
    assert.equal(g.friend['Otto'], ottoBefore + 6);

    // Round-trip save & old save migration
    g.pantry.items = ['Turnip', 'Potato'];
    g.guest_regulars = ['bram'];
    const snap = JSON.parse(JSON.stringify(g.snapshot()));
    const h = fresh();
    h.applySaveData(snap);
    assert.deepEqual(h.pantry.items, ['Turnip', 'Potato']);
    assert.deepEqual(h.guest_regulars, ['bram']);
    delete snap.pantry;
    delete snap.guest_regulars;
    delete snap.contracts;
    delete snap.trail_encounter;
    h.applySaveData(snap);
    assert.deepEqual(h.pantry.items, []);
    assert.deepEqual(h.guest_regulars, []);
    assert.deepEqual(h.contracts, []);
  });
});
