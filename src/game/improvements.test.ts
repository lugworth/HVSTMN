import test from 'node:test';
import assert from 'node:assert/strict';

import {
  combinedPool,
  totalAvailable,
  consumeAcrossStorages,
  canAffordMaterials,
  storageSourceNote,
} from './global-storage';
import {
  fishBehaviorFor,
  createFishingState,
  stepFishingState,
  renderFishingBar,
  rollFishingTreasure,
} from './fishing-game';
import {
  mineBiomeFor,
  rollPitfallDrop,
  rollMineGeodeDrop,
  rollGeodeLoot,
  GEODE_MINERALS,
  CRACK_GEODE_FEE,
} from './mining-depth';
import {
  TOWN_RANKS,
  computeTownRank,
  beeHouseYield,
  mushroomLogYield,
} from './town-rank';
import {
  FARM_PIECES,
  FARM_PIECE_NAMES,
  emptyFarmWorks,
  restoreFarmWorks,
  sprinklerCoverage,
} from './farm-works';
import {
  MASTERY_PERKS,
  perksForDiscipline,
  sanitizeMasteryPerks,
} from './progression';
import {
  musicSceneFor,
  setMusicEnabled,
  isMusicEnabled,
  playHarvestChime,
} from './audio';
import { ITEMS, INN_SCENES } from './constants';
import { Game } from './engine';
import { Screen } from './screen';

function freshGame(): Game {
  const g = new Game(new Screen(100, 34));
  g.new_game('Ash', 'Bramble');
  return g;
}

// ---------------------------------------------------------------- Pillar 1: Global Storage
test('global-storage merges pockets, fridge, and cabinet cleanly', () => {
  const inv = { Lumber: 3, Egg: 1 };
  const fridge = { Egg: 2, Milk: 4 };
  const cabinet = { Lumber: 10, Stone: 5 };
  const pool = combinedPool(inv, fridge, cabinet);
  assert.equal(pool.Lumber, 13);
  assert.equal(pool.Egg, 3);
  assert.equal(pool.Milk, 4);
  assert.equal(pool.Stone, 5);
  assert.equal(totalAvailable('Lumber', inv, fridge, cabinet), 13);
  assert.equal(canAffordMaterials([['Lumber', 12], ['Egg', 3], ['Stone', 5]], inv, fridge, cabinet), true);
  assert.equal(canAffordMaterials([['Lumber', 14]], inv, fridge, cabinet), false);
});

test('consumeAcrossStorages pulls Pockets -> Fridge -> Cabinet and does not mutate on failure', () => {
  const inv = { Egg: 1 };
  const fridge = { Egg: 2 };
  const cabinet = { Egg: 3 };

  const fail = consumeAcrossStorages('Egg', 7, inv, fridge, cabinet);
  assert.equal(fail.ok, false);
  assert.equal(inv.Egg, 1);
  assert.equal(fridge.Egg, 2);
  assert.equal(cabinet.Egg, 3);

  const ok = consumeAcrossStorages('Egg', 5, inv, fridge, cabinet);
  assert.equal(ok.ok, true);
  assert.equal(ok.fromPockets, 1);
  assert.equal(ok.fromFridge, 2);
  assert.equal(ok.fromCabinet, 2);
  assert.equal(inv.Egg, undefined);
  assert.equal(fridge.Egg, undefined);
  assert.equal(cabinet.Egg, 1);
  assert.equal(storageSourceNote(ok.fromFridge, ok.fromCabinet), ' (pulled from Fridge & Cabinet)');
  assert.equal(storageSourceNote(0, 0), '');
});

test('engine ingredient_plan and pay_works pull seamlessly from Fridge and Cabinet', () => {
  const g = freshGame();
  g.inv = { 'Egg': 1 };
  g.fridge_inv = { 'Milk': 1 };
  g.cabinet_inv = { 'Lumber': 30, 'Copper': 4 };
  g.gold = 2000;

  // ingredient_plan finds Milk from Fridge alongside Egg in Pockets for Omelet
  const plan = g.ingredient_plan('Omelet');
  assert.ok(plan, 'Should satisfy Omelet ingredients across Pockets + Fridge');

  // pay_works pulls Lumber from Cabinet
  const paid = (g as unknown as { pay_works: (c: { gold: number; lumber: number }) => boolean }).pay_works({ gold: 500, lumber: 20 });
  assert.equal(paid, true);
  assert.equal(g.gold, 1500);
  assert.equal(g.cabinet_inv['Lumber'], 10);
});

// ---------------------------------------------------------------- Pillar 1: Tiered Sprinklers, Bee House, Mushroom Log & Rank 2 Perks
test('sprinklerCoverage handles Standard (4), Quality (8), and Starsteel (24) tiers', () => {
  assert.equal(sprinklerCoverage('10,10', 'Sprinkler').length, 4);
  assert.equal(sprinklerCoverage('10,10', 'Quality Sprinkler').length, 8);
  assert.equal(sprinklerCoverage('10,10', 'Starsteel Sprinkler').length, 24);
  assert.equal(sprinklerCoverage('10,10', 'Bee House').length, 0);
  assert.ok(FARM_PIECE_NAMES.includes('Quality Sprinkler'));
  assert.ok(FARM_PIECE_NAMES.includes('Starsteel Sprinkler'));
  assert.ok(FARM_PIECE_NAMES.includes('Bee House'));
  assert.ok(FARM_PIECE_NAMES.includes('Mushroom Log'));
  assert.ok(FARM_PIECES['Bee House']);
  assert.ok(FARM_PIECES['Mushroom Log']);
});

test('restoreFarmWorks preserves artisanDays alongside pieces and omits it when empty', () => {
  const fw = emptyFarmWorks();
  fw.pieces['8,8'] = 'Bee House';
  fw.artisanDays = { '8,8': 12 };
  const restored = restoreFarmWorks(fw, () => true, 20);
  assert.equal(restored.pieces['8,8'], 'Bee House');
  assert.equal(restored.artisanDays?.['8,8'], 12);

  const emptyRestored = restoreFarmWorks(emptyFarmWorks(), () => true, 20);
  assert.equal('artisanDays' in emptyRestored, false);
});

test('beeHouseYield produces flower-specific honey in bloom and sleeps in Winter', () => {
  const grow = () => 5;
  const crops: Record<string, [string, number]> = {
    '11,10': ['Emberbloom Flower', 6],
    '9,10': ['Duskbell Flower', 6],
  };
  const ready = beeHouseYield('10,10', crops, grow, 0, 5, 2);
  assert.equal(ready.ready, true);
  assert.equal(ready.item, 'Emberbloom Honey');

  const notYet = beeHouseYield('10,10', crops, grow, 0, 3, 2);
  assert.equal(notYet.ready, false);
  assert.equal(notYet.daysLeft, 2);

  const winter = beeHouseYield('10,10', crops, grow, 3, 10, 1);
  assert.equal(winter.ready, false);
  assert.equal(winter.dormant, true);
});

test('mushroomLogYield accelerates with adjacent trees and rain and yields Truffle/Morel/Mushroom', () => {
  const slow = mushroomLogYield(0, 0, 0, false, 3, 0, 7);
  assert.equal(slow.ready, false);
  assert.equal(slow.daysLeft, 1);

  const boosted = mushroomLogYield(2, 2, 1, true, 2, 0, 1);
  assert.equal(boosted.ready, true);
  assert.ok(['Mushroom', 'Morel', 'Truffle'].includes(boosted.item));
});

test('Rank 2 Expert mastery perks exist for all 5 disciplines and sanitize cleanly', () => {
  assert.equal(MASTERY_PERKS.length, 15);
  for (const d of ['farming', 'foraging', 'fishing', 'mining', 'ranching'] as const) {
    const r1 = perksForDiscipline(d, 1);
    const r2 = perksForDiscipline(d, 2);
    assert.equal(r1.length, 2, `${d} should have 2 rank-1 perks`);
    assert.equal(r2.length, 1, `${d} should have 1 rank-2 perk`);
  }
  const clean = sanitizeMasteryPerks({
    farming: 'farm_can',
    farming_2: 'farm_artisan',
    mining_2: 'bogus_perk',
  });
  assert.equal(clean.farming, 'farm_can');
  assert.equal(clean.farming_2, 'farm_artisan');
  assert.equal(clean.mining_2, undefined);
});

// ---------------------------------------------------------------- Pillar 2: Interactive Fishing Minigame & Mining Depth
test('fishing tension bar transitions to caught when kept on-target and escaped when off-target', () => {
  assert.equal(fishBehaviorFor('Coelacanth King'), 'king');
  assert.equal(fishBehaviorFor('River Trout'), 'dart');
  assert.equal(fishBehaviorFor('Pond Minnow'), 'calm');

  let s = createFishingState('Small Fish', { steadyFloat: true, masterAngler: true, rng: () => 0.1 });
  assert.equal(s.status, 'playing');
  assert.ok(s.chestPos !== null, 'low rng should spawn a treasure chest');
  const rendered = renderFishingBar(s);
  assert.ok(rendered.track.startsWith('[') && rendered.track.endsWith(']'));
  assert.ok(rendered.meter.includes('%'));

  // Force fish inside zone to verify caught state
  s = { ...s, fishPos: s.zonePos + 2, fishTarget: s.zonePos + 2, profile: { ...s.profile, speed: 0, dartChance: 0 } };
  for (let i = 0; i < 40 && s.status === 'playing'; i++) {
    s = stepFishingState(s, false, 0.1, () => 0.99);
    s = { ...s, fishPos: s.zonePos + 1, fishTarget: s.zonePos + 1 };
  }
  assert.equal(s.status, 'caught');

  // Force fish far outside zone to verify escape state
  let esc = createFishingState('Small Fish', { rng: () => 0.9 });
  esc = { ...esc, zonePos: 0, zoneVel: 0, fishPos: 20, fishTarget: 20, profile: { ...esc.profile, speed: 0, dartChance: 0 } };
  for (let i = 0; i < 40 && esc.status === 'playing'; i++) {
    esc = stepFishingState(esc, false, 0.1, () => 0.99);
  }
  assert.equal(esc.status, 'escaped');

  const treasure = rollFishingTreasure(3, 1, () => 0.95);
  assert.equal(treasure.item, 'Moonstone');
});

test('mine biomes, pitfalls, and geodes work across floors and mine types', () => {
  assert.equal(mineBiomeFor(1, 'spring').id, 'earth');
  assert.equal(mineBiomeFor(25, 'spring').id, 'crystal');
  assert.equal(mineBiomeFor(50, 'spring').id, 'basalt');
  assert.equal(mineBiomeFor(50, 'lake').id, 'glacier');
  assert.equal(mineBiomeFor(100, 'spring').id, 'mythic');

  const dropNormal = rollPitfallDrop(10, false, false, () => 0.5); // rawDrop = 4
  const dropPerk = rollPitfallDrop(10, true, false, () => 0.5);
  assert.equal(dropNormal.targetFloor, 14);
  assert.ok(dropPerk.staminaCost < dropNormal.staminaCost, 'Deep Prospector reduces pitfall stamina cost');
  const dropClamp = rollPitfallDrop(253, false, false, () => 0.99);
  assert.equal(dropClamp.targetFloor, 255);

  const geode = rollMineGeodeDrop(55, 'spring', 1, true, () => 0.01);
  assert.equal(geode, 'Magma Geode');
  const loot = rollGeodeLoot('Magma Geode', 1, () => 0.95);
  assert.equal(loot.item, 'Star Shard');
  assert.equal(CRACK_GEODE_FEE, 25);

  // New minerals registered in ITEMS and eligible for Museum, while unopened geodes are excluded
  const g = freshGame();
  const pool = new Set(g.museum_pool());
  for (const m of GEODE_MINERALS) {
    assert.ok(ITEMS[m.name], `${m.name} must exist in ITEMS`);
    assert.ok(pool.has(m.name), `${m.name} must be Museum-donatable`);
  }
  assert.equal(pool.has('Geode'), false);
  assert.equal(pool.has('Frozen Geode'), false);
  assert.equal(pool.has('Magma Geode'), false);
});

// ---------------------------------------------------------------- Pillar 3: Audio & Music
test('audio music scene selector, preference toggle, and harvest chime are safe headless', () => {
  assert.equal(musicSceneFor('farm', 0, false), 'spring');
  assert.equal(musicSceneFor('farm', 1, false), 'summer');
  assert.equal(musicSceneFor('farm', 2, false), 'fall');
  assert.equal(musicSceneFor('farm', 3, false), 'winter');
  assert.equal(musicSceneFor('town', 0, false), 'town');
  assert.equal(musicSceneFor('mine', 2, false), 'mine');
  assert.equal(musicSceneFor('house', 0, true), 'indoor');

  setMusicEnabled(false);
  assert.equal(isMusicEnabled(), false);
  setMusicEnabled(true);
  assert.equal(isMusicEnabled(), true);
  assert.doesNotThrow(() => playHarvestChime(5));
});

// ---------------------------------------------------------------- Pillar 4: Town Rank & Seasonal Inn Banter
test('computeTownRank scales cleanly from E to S and boosts artisan bin prices in engine', () => {
  const rankE = computeTownRank({
    museumCount: 0,
    requestsDone: 0,
    publicWorksBuilt: false,
    shortcutsOpened: 0,
    pantryCompleted: 0,
    contractsDone: 0,
    festivalsWon: 0,
    goodFriends: 0,
    shippedKinds: 0,
  });
  assert.equal(rankE.tier.grade, 'E');
  assert.equal(rankE.next?.grade, 'D');

  const rankS = computeTownRank({
    museumCount: 30,
    requestsDone: 15,
    publicWorksBuilt: true,
    shortcutsOpened: 3,
    pantryCompleted: 3,
    contractsDone: 5,
    festivalsWon: 4,
    goodFriends: 8,
    shippedKinds: 30,
  });
  assert.equal(rankS.tier.grade, 'S');
  assert.equal(rankS.tier.visuals.goldenLanterns, true);
  assert.equal(rankS.tier.seedDiscount, 0.15);
  assert.equal(rankS.tier.artisanBonus, 0.15);
  assert.equal(TOWN_RANKS.length, 6);

  // Verify artisan bonus stacks cleanly with Rank 2 Artisan Master perk in Game.bin_price
  const g = freshGame();
  const baseHoney = g.bin_price('Emberbloom Honey');
  g.mastery_perks.farming_2 = 'farm_artisan';
  const perkHoney = g.bin_price('Emberbloom Honey');
  assert.ok(perkHoney > baseHoney, 'Artisan Master should increase Honey shipping value');

  // Verify 4 new seasonal Friday-night Inn scenes exist alongside classic scenes
  const ids = new Set(INN_SCENES.map((s) => s.id));
  for (const id of ['spring_herbs', 'summer_cider', 'fall_bakeoff', 'winter_forge']) {
    assert.ok(ids.has(id), `Expected seasonal Inn scene ${id}`);
  }
});
