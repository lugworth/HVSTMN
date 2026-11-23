import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './engine';
import { Screen } from './screen';
import {
  animalYardSpot,
  breedCoat,
  coatInfo,
  PASTURE_GATE_SPOT,
  PERCH_SPOT,
  SHADE_TREE_SPOT,
  CAT_SPOT,
  CAT_UNLOCK_DOG_AFF,
} from './ranch';

function fresh(): any {
  const g = new Game(new Screen(100, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  g.say = async () => {};
  g.show_lines = async () => {};
  g.save = () => true;
  return g;
}

describe('animals & ranching (tasks 25, 26, 27, 28 & G8, G15)', () => {
  test('task 25: animal personalities produce distinct grazing spots with comparable production', () => {
    const timidChicken = animalYardSpot('chicken', 'timid', 0, 2, { perch: false, shadeTree: false });
    const curiousChicken = animalYardSpot('chicken', 'curious', 0, 2, { perch: false, shadeTree: false });
    assert.notDeepEqual(timidChicken, curiousChicken);

    const curiousCow = animalYardSpot('cow', 'curious', 0, 0, { perch: false, shadeTree: false }, [28, 8]);
    const calmCow = animalYardSpot('cow', 'calm', 0, 0, { perch: false, shadeTree: false }, [28, 8]);
    assert.equal(curiousCow[0], 28, 'curious cow comes up to the gate');
    assert.notDeepEqual(curiousCow, calmCow);
  });

  test('task 26 & G8: breeding produces coat variants and records parents & birthdays in the Barn Book', async () => {
    // Low roll yields a rare variant
    const rareCow = breedCoat('cow', 'classic', 'honey', 0.05);
    assert.equal(coatInfo('cow', rareCow).rare, true);
    assert.ok(coatInfo('cow', rareCow).festBonus >= 10);

    const g = fresh();
    g.animals.push({
      name: 'Clover',
      kind: 'cow',
      aff: 50,
      fed: true,
      ready: false,
      wool: 0,
      talked: false,
      brushed: false,
      wonFestival: false,
      pregnantDays: 1,
      coat: 'starlight',
      personality: 'curious',
      bornDay: 2,
      parents: ['Highmeadow Herd', null],
    });
    const report: string[] = [];
    g.barn_new_day(report);
    assert.equal(g.animals.length, 2);
    const calf = g.animals[1];
    assert.equal(calf.name, 'CloverJr');
    assert.ok(calf.coat);
    assert.equal(calf.bornDay, g.absday());
    assert.equal(calf.parents[0], 'Clover');
    assert.ok(report.some((r) => r.includes('Clover gave birth')));

    // Barn book lists coats, personalities, birthdays & parents
    let bookLines: string[] = [];
    g.show_lines = async (_title: string, lines: string[]) => { bookLines = lines; };
    await g.barn_book();
    assert.ok(bookLines.some((l) => l.includes('Clover') && l.includes('Starlight Roan')));
    assert.ok(bookLines.some((l) => l.includes('CloverJr') && l.includes('Clover')));
  });

  test('task 27: rotating pasture tracks two meadows, drains active patch, regrows resting patch, and blocks grazing at 0%', async () => {
    const g = fresh();
    assert.equal(g.maps.farm.tile(PASTURE_GATE_SPOT[0], PASTURE_GATE_SPOT[1]), 'pasture_gate');
    g.animals.push({ name: 'Bess', kind: 'cow', aff: 30, fed: false, ready: false, wool: 0, talked: false, brushed: false, wonFestival: false, pregnantDays: 0 });
    g.weather = 'Sunny';

    // Graze West Meadow -> drops from 100% to 80%
    await g.graze_barn_pasture();
    assert.equal(g.pasture.west, 80);
    assert.equal(g.pasture.east, 100);
    assert.equal(g.animals[0].fed, true);

    // Switch to East Meadow via pasture_menu and rest overnight so West Meadow regrows
    const picks = [0, 2]; // Switch -> Leave
    g.menu = async () => picks.shift() ?? 2;
    await g.pasture_menu();
    assert.equal(g.pasture.active, 'east');
    await g.new_day('sleep');
    assert.equal(g.pasture.west, 100);

    // Grazing a 0% meadow refuses and asks to rotate
    g.pasture.east = 0;
    g.weather = 'Sunny';
    const warns: string[] = [];
    g.say = async (t: string) => { warns.push(t); };
    await g.graze_barn_pasture();
    assert.ok(warns.some((w) => w.includes('0% grass')));
  });

  test('task 28: chicken perch and pasture shade tree appear on farm and grant daily care benefits', async () => {
    const g = fresh();
    g.gold = 1000;
    g.inv['Lumber'] = 12;
    await g.build_enrichment('perch');
    await g.build_enrichment('shadeTree');
    assert.equal(g.enrichment.perch, true);
    assert.equal(g.enrichment.shadeTree, true);
    assert.equal(g.maps.farm.tile(PERCH_SPOT[0], PERCH_SPOT[1]), 'perch');
    assert.equal(g.maps.farm.tile(SHADE_TREE_SPOT[0], SHADE_TREE_SPOT[1]), 'shade_tree');

    // Observable enrichment positions
    assert.deepEqual(animalYardSpot('chicken', 'calm', 0, 0, g.enrichment), [17, 7]);
    assert.deepEqual(animalYardSpot('cow', 'calm', 0, 0, g.enrichment), [33, 7]);

    // Overnight Sunny care benefit
    g.chickens = 2;
    g.chicken_aff = 20;
    g.animals.push({ name: 'Bess', kind: 'cow', aff: 20, fed: true, ready: false, wool: 0, talked: false, brushed: false, wonFestival: false, pregnantDays: 0 });
    g.tomorrow = 'Sunny';
    await g.new_day('sleep');
    assert.equal(g.chicken_aff, 22);
    assert.equal(g.animals[0].aff, 22);
  });

  test('G15: Farm Cat unlocks at high dog affection, leaves morning pet bowl gifts and cat clues, and survives save/load', async () => {
    const g = fresh();
    g.dog_aff = CAT_UNLOCK_DOG_AFF;
    g.text_input = async () => 'Bramblecat';
    // Options: 0 Pet, 1 Fetch, 2 Frisbee, 3 Welcome Stray Farm Cat, 4 Leave
    g.menu = async () => 3;
    await g.dog_menu();
    assert.equal(g.pet_extras.cat, true);
    assert.equal(g.pet_extras.catName, 'Bramblecat');

    // Morning creates a pet bowl gift and a cat clue
    await g.new_day('sleep');
    assert.ok(g.pet_extras.bowlGift);
    assert.ok(g.pet_extras.catClue);
    const giftName = g.pet_extras.bowlGift;

    // Collect gift via cat menu
    g.menu = async () => 1;
    await g.cat_menu();
    assert.equal(g.pet_extras.bowlGift, null);
    assert.ok((g.inv[giftName] || 0) >= 1);
    assert.equal(CAT_SPOT[0], 20);

    // Save/load round-trip
    const snap = JSON.parse(JSON.stringify(g.snapshot()));
    const h = fresh();
    h.applySaveData(snap);
    assert.equal(h.pet_extras.cat, true);
    assert.equal(h.pet_extras.catName, 'Bramblecat');
    assert.deepEqual(h.pasture, g.pasture);
    assert.deepEqual(h.enrichment, g.enrichment);
  });
});
