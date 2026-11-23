import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from './constants';
import {
  stallVisit,
  marketWants,
  plantingForecast,
  marketVisit,
  innSceneFor,
  innCardsWin,
  canUpgradeAdvice,
  nextRegion,
  nextRegions,
  compassWord,
  shopStatus,
  absdayLabel,
  worksNeeds,
  worksSummary,
  getMaxStamina,
  getToolArea,
  calculateStaminaSpend,
  getHeartInfo,
  calculateGiftPoints,
  getEggQuality,
  getMilkQuality,
  getWoolQuality,
  convertWithMaker,
  makerBatch,
  MAKER_INPUTS,
  rollSpringMineDrop,
  rollLakeMineDrop,
  checkSecretCropUnlock,
  getBasketTotal,
  BASKET_CAPACITY,
  rollRegionCatch,
  regionCatchOdds,
  valleyCatchOdds,
  rollCatch,
  rollStoneSkips,
  MAX_STONE_SKIPS,
} from './rules';
import { REGION_CATCH, UPGRADE, CAN_CAP, CROPS, SEASONS, FORAGE, REGION_FORAGE, MARKET_FLOWERS, PANTRY_STAPLES, MARKET_SHOPPERS } from './constants';

describe('GLADE rules & mechanics', () => {
  test('Heartseeds scale max stamina from 150 to 250 (+10 each)', () => {
    assert.equal(getMaxStamina(0), 150);
    assert.equal(getMaxStamina(5), 200);
    assert.equal(getMaxStamina(10), 250);
    assert.equal(getMaxStamina(15), 250); // Clamped at 10 Heartseeds
  });

  test('Tool area scales across all 8 tool tiers (Basic to Heirloom)', () => {
    // Hoe facing right [1, 0]
    assert.equal(getToolArea('Hoe', 0, 10, 10, [1, 0]).length, 1);
    assert.equal(getToolArea('Hoe', 1, 10, 10, [1, 0]).length, 2);
    assert.equal(getToolArea('Hoe', 2, 10, 10, [1, 0]).length, 3);
    assert.equal(getToolArea('Hoe', 3, 10, 10, [1, 0]).length, 4);
    assert.equal(getToolArea('Hoe', 4, 10, 10, [1, 0]).length, 6);
    assert.equal(getToolArea('Hoe', 6, 10, 10, [1, 0]).length, 36); // Hallowed 3x12
    assert.equal(getToolArea('Hoe', 7, 10, 10, [1, 0]).length, 90); // Heirloom 5x18

    // Watering Can
    assert.equal(getToolArea('Watering Can', 0, 10, 10, [0, 1]).length, 1);
    assert.equal(getToolArea('Watering Can', 1, 10, 10, [0, 1]).length, 3);
    assert.equal(getToolArea('Watering Can', 2, 10, 10, [0, 1]).length, 6);
    assert.equal(getToolArea('Watering Can', 3, 10, 10, [0, 1]).length, 9);
    assert.equal(getToolArea('Watering Can', 4, 10, 10, [0, 1]).length, 15);

    // Sickle centered area at Gold/Starsteel
    assert.equal(getToolArea('Sickle', 3, 10, 10, [0, 1]).length, 9);
    assert.equal(getToolArea('Sickle', 4, 10, 10, [0, 1]).length, 25);
  });

  test('Stamina, Fatigue, Mystic Berry and Fainting mechanics', () => {
    // Sunny daytime tool use only costs stamina
    const r1 = calculateStaminaSpend(100, 0, 5, { weather: 'Sunny', minutes: 12 * 60 });
    assert.equal(r1.stamina, 95);
    assert.equal(r1.fatigue, 0);
    assert.equal(r1.fainted, false);

    // Rainy late-night tool use adds environmental fatigue
    const r2 = calculateStaminaSpend(100, 10, 5, { weather: 'Rain', minutes: 23 * 60 });
    assert.equal(r2.stamina, 95);
    assert.equal(r2.fatigue, 12);

    // Mystic Berry halves environmental fatigue buildup
    const r3 = calculateStaminaSpend(100, 10, 5, {
      weather: 'Rain',
      minutes: 23 * 60,
      hasMysticBerry: true,
    });
    assert.equal(r3.fatigue, 11);

    // Zero stamina overflows into fatigue and faints at 100
    const r4 = calculateStaminaSpend(0, 96, 5, { weather: 'Sunny', minutes: 12 * 60 });
    assert.equal(r4.stamina, 0);
    assert.equal(r4.fatigue, 100);
    assert.equal(r4.fainted, true);
    assert.equal(r4.warning, 'fainted');
  });

  test('Heart color tiers and birthday gift multipliers', () => {
    assert.equal(getHeartInfo(5).label, 'Black');
    assert.equal(getHeartInfo(20).label, 'Purple');
    assert.equal(getHeartInfo(35).label, 'Blue');
    assert.equal(getHeartInfo(50).label, 'Green');
    assert.equal(getHeartInfo(65).label, 'Yellow');
    assert.equal(getHeartInfo(80).label, 'Orange');
    assert.equal(getHeartInfo(95).label, 'Red');

    assert.equal(calculateGiftPoints('love', false, false), 8);
    assert.equal(calculateGiftPoints('love', true, false), 40); // 5x on birthday
    assert.equal(calculateGiftPoints('love', true, true), 50); // 5x * 1.25 wrapped
  });

  test('Maker batches cover every tier and raise value at each step', () => {
    assert.equal(convertWithMaker('Milk'), null, 'shop milk must not become cheese');
    assert.deepEqual(makerBatch('Cheese Maker', { 'Small Milk': 2, 'P Milk': 1, Milk: 9, Egg: 4 }), [
      { input: 'P Milk', output: 'P Cheese', qty: 1 },
      { input: 'Small Milk', output: 'Small Cheese', qty: 2 },
    ]);
    for (const [maker, inputs] of Object.entries(MAKER_INPUTS)) {
      let lastIn = Infinity;
      let lastOut = Infinity;
      for (const input of inputs) {
        const res = convertWithMaker(input);
        assert.equal(res?.maker, maker, input);
        const pin = ITEMS[input][0] as number;
        const pout = ITEMS[res!.output][0] as number;
        assert.ok(pout > pin, `${res!.output} should be worth more than ${input}`);
        assert.ok(pin <= lastIn && pout <= lastOut, `${input} should not out-sell a better tier`);
        lastIn = pin;
        lastOut = pout;
      }
    }
  });

  test('Livestock quality grades and Maker conversions', () => {
    assert.equal(getEggQuality(20, false, 0), 'Egg');
    assert.equal(getEggQuality(50, false, 0), 'Good Egg');
    assert.equal(getEggQuality(80, false, 0), 'High Egg');
    assert.equal(getEggQuality(85, true, 10), 'Golden Egg');
    assert.equal(getEggQuality(95, true, 60, 0.5), 'P Egg');
    assert.equal(getEggQuality(95, true, 60, 0.001), 'X Egg');

    assert.equal(getMilkQuality(95, true, 60, 0.5), 'P Milk');
    assert.equal(getWoolQuality(95, true, 60, 0.5), 'P Wool');

    assert.deepEqual(convertWithMaker('Golden Egg'), {
      output: 'Golden Mayonnaise',
      maker: 'Mayonnaise Maker',
    });
    assert.deepEqual(convertWithMaker('Large Milk'), {
      output: 'Large Cheese',
      maker: 'Cheese Maker',
    });
    assert.deepEqual(convertWithMaker('P Wool'), {
      output: 'P Yarn',
      maker: 'Yarn Maker',
    });
  });

  test('Copperseam Mine and Mirewater Mine drop tables', () => {
    assert.equal(rollSpringMineDrop(60, true, 3), 'Heirloom Stone');
    assert.equal(rollSpringMineDrop(10, false, 3), 'Deepiron');
    assert.equal(rollLakeMineDrop(50, 2), 'Pink Diamond');
    assert.equal(rollLakeMineDrop(60, 2), 'Alexandrite');
    assert.equal(rollLakeMineDrop(10, 2), 'Diamond');
  });

  test('Secret crop shipment gates and Harvest Basket capacity', () => {
    const locked = checkSecretCropUnlock('Strawberry', { Turnip: 100, Potato: 45, Cucumber: 10 });
    assert.equal(locked.unlocked, false);
    assert.equal(locked.progressText, 'Turnip: 100/100, Potato: 45/100, Cucumber: 10/100');

    const unlocked = checkSecretCropUnlock('Strawberry', { Turnip: 120, Potato: 100, Cucumber: 105 });
    assert.equal(unlocked.unlocked, true);

    assert.equal(BASKET_CAPACITY, 30);
    assert.equal(getBasketTotal({ Turnip: 12, Copper: 8, Bamboo_Shoot: 5 }), 25);
  });
});

describe('outer-region fishing and stone skipping', () => {
  /** Every result of the weighted draw, sweeping the roll across [0, 1). */
  const sweep = (region: string, season: number, rodLvl: number) => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const r = i / 400;
      seen.add(rollRegionCatch(REGION_CATCH[region], { season, weather: 'Sunny', rodLvl }, () => r));
    }
    return seen;
  };

  test('Willow Bend fish follow the seasons; the sturgeon needs a Silver rod', () => {
    const spring = sweep('river', 0, 0);
    assert.ok(spring.has('Willow Chub') && spring.has('Speckled Trout'));
    assert.ok(!spring.has('Burbot'), 'burbot only bite in winter');
    assert.ok(!spring.has('Elder Sturgeon'), 'no rare catch on a basic rod');
    const winter = sweep('river', 3, 0);
    assert.ok(winter.has('Burbot') && !winter.has('Speckled Trout'));
    const river = REGION_CATCH.river;
    assert.equal(rollRegionCatch(river, { season: 0, weather: 'Sunny', rodLvl: 1 }, () => 0), 'Small Fish');
    assert.equal(rollRegionCatch(river, { season: 0, weather: 'Sunny', rodLvl: 2 }, () => 0), 'Elder Sturgeon');
    assert.notEqual(rollRegionCatch(river, { season: 0, weather: 'Sunny', rodLvl: 2 }, () => 0.05), 'Elder Sturgeon');
  });

  test('the sea off Lighthouse Point has its own fish, and storms bring the marlin in', () => {
    const summer = sweep('point', 1, 0);
    assert.ok(summer.has('Mackerel') && summer.has('Sea Bass') && summer.has('Rockfish'));
    const winter = sweep('point', 3, 0);
    assert.ok(!winter.has('Mackerel') && !winter.has('Sea Bass') && winter.has('Rockfish'));
    const sea = REGION_CATCH.point;
    const at = (weather: string, rodLvl: number) => rollRegionCatch(sea, { season: 0, weather, rodLvl }, () => 0.05);
    assert.notEqual(at('Sunny', 3), 'Storm Marlin', '3% on a fair day');
    assert.equal(at('Rain', 3), 'Storm Marlin', 'tripled in the rain');
    assert.notEqual(at('Rain', 2), 'Storm Marlin', 'needs a Gold rod');
  });

  test('the odds the game shows are the odds it plays', () => {
    const near = (a: number, b: number) => Math.abs(a - b) < 0.02;
    for (const region of ['river', 'point']) {
      for (const [season, weather, rodLvl] of [[0, 'Sunny', 0], [3, 'Rain', 3], [1, 'Typhoon', 5]] as const) {
        const ctx = { season, weather, rodLvl };
        const odds = regionCatchOdds(REGION_CATCH[region], ctx);
        assert.ok(near(odds.reduce((sum, o) => sum + o[1], 0), 1), 'odds add up to 1');
        // every pair of rolls on an even grid, which is what two independent draws average out to
        const n = 120;
        const seen: Record<string, number> = {};
        for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
          const rolls = [(a + 0.5) / n, (b + 0.5) / n];
          const fish = rollRegionCatch(REGION_CATCH[region], ctx, () => rolls.shift() ?? 0);
          seen[fish] = (seen[fish] || 0) + 1 / (n * n);
        }
        for (const [item, chance] of odds) assert.ok(near(seen[item] || 0, chance), `${region} ${item}: ${seen[item]} vs ${chance}`);
      }
    }
  });

  test('valley waters: a basic rod finds plain fish, better rods find the special ones', () => {
    const of = (map: string, season: number, rodLvl: number) => Object.fromEntries(valleyCatchOdds({ map, season, rodLvl }));
    const basic = of('farm', 0, 0);
    assert.deepEqual(Object.keys(basic).sort(), ['Boot', 'Empty Can', 'Large Fish', 'Medium Fish', 'Small Fish']);
    assert.ok(Math.abs(basic['Large Fish'] - 0.19) < 1e-9 && Math.abs(basic['Small Fish'] - 0.4) < 1e-9);
    assert.ok(Math.abs(of('mountain', 0, 3)['Carp'] - 0.08) < 1e-9);
    assert.ok(!('Catfish' in of('mountain', 0, 3)) && 'Catfish' in of('town', 0, 3));
    assert.ok(Math.abs(of('beach', 0, 4)['Squid'] - 0.12) < 1e-9, 'squid off the beach in spring');
    assert.ok('Pirate Treasure' in of('beach', 1, 4) && !('Squid' in of('beach', 1, 4)));
    assert.ok(!('Squid' in of('beach', 0, 3)), 'needs a Starsteel rod');
    assert.ok(!('Squid' in of('farm', 0, 5)), 'only off the beach');
    for (const map of ['farm', 'beach', 'mountain']) for (let lvl = 0; lvl <= 7; lvl++) {
      const odds = valleyCatchOdds({ map, season: 3, rodLvl: lvl });
      assert.ok(Math.abs(odds.reduce((sum, o) => sum + o[1], 0) - 1) < 1e-9);
      assert.ok(odds.every((o) => o[1] > 0 && ITEMS[o[0]]), 'only real items with a real chance');
      assert.equal(rollCatch(odds, 0), odds[0][0]);
      assert.equal(rollCatch(odds, 0.999999), 'Small Fish');
    }
  });

  test('a better rod shifts the odds toward bigger fish', () => {
    // below the sturgeon's rod level the draw uses a single roll, so a sweep counts each fish's share
    const share = (rodLvl: number) => {
      let n = 0;
      for (let i = 0; i < 1000; i++) {
        if (rollRegionCatch(REGION_CATCH.river, { season: 0, weather: 'Sunny', rodLvl }, () => i / 1000) === 'Large Fish') n++;
      }
      return n;
    };
    assert.ok(share(1) > share(0));
  });

  test('stone skips: calm water skips further than rain-chopped water', () => {
    assert.equal(rollStoneSkips(() => 0), MAX_STONE_SKIPS);
    assert.equal(rollStoneSkips(() => 0.99), 1);
    assert.equal(rollStoneSkips(() => 0.6, true), MAX_STONE_SKIPS);
    assert.equal(rollStoneSkips(() => 0.6, false), 1);
  });
});

describe('inn Friday scene rotation', () => {
  const ids = ['cards', 'recipes', 'story'];
  test('unseen scenes come first, starting from the week in the rotation', () => {
    assert.equal(innSceneFor(0, ids, []), 'cards');
    assert.equal(innSceneFor(1, ids, []), 'recipes');
    assert.equal(innSceneFor(1, ids, ['recipes']), 'story');
    assert.equal(innSceneFor(2, ids, ['story', 'cards']), 'recipes');
  });
  test('once everything is seen the rotation repeats', () => {
    assert.equal(innSceneFor(4, ids, ids), 'recipes');
    assert.equal(innSceneFor(0, [], []), null);
  });
  test('the card game is deterministic and winnable', () => {
    const wins = Array.from({ length: 30 }, (_, d) => innCardsWin(d));
    assert.ok(wins.some(Boolean) && wins.some((w) => !w));
    assert.equal(innCardsWin(11), innCardsWin(11));
  });
});

describe("Rowan's watering-can advice", () => {
  test('the next upgrade from Basic is Copper, and the big later jump is Starsteel', () => {
    const a = canUpgradeAdvice(0, UPGRADE, CAN_CAP)!;
    assert.deepEqual([a.now.tiles, a.next.level, a.next.cost, a.next.ore, a.next.tiles, a.next.cap], [1, 1, 1000, 'Copper', 3, 55]);
    assert.equal(a.big?.level, 4);
  });
  test('each level 0-3 points one step up; the big jump is always Starsteel when it is still ahead', () => {
    for (const lvl of [0, 1, 2, 3]) {
      const a = canUpgradeAdvice(lvl, UPGRADE, CAN_CAP)!;
      assert.equal(a.next.level, lvl + 1);
      assert.equal(a.next.cost, UPGRADE[lvl + 1][0]);
      assert.equal(a.big?.level ?? null, lvl + 1 < 4 ? 4 : null);
    }
  });
  test('Starsteel and beyond get no ore-upgrade advice', () => {
    for (const lvl of [4, 5, 6, 7]) assert.equal(canUpgradeAdvice(lvl, UPGRADE, CAN_CAP), null);
  });
});

describe('valley map rules (task 33)', () => {
  const links = {
    farm: ['town', 'woods', 'grove'], town: ['farm', 'mountain', 'beach', 'river'], mountain: ['town', 'ridge'],
    ridge: ['mountain'], beach: ['town', 'point'], point: ['beach'], river: ['town'], woods: ['farm'], grove: ['farm'],
  };
  test('the next region follows the shortest walk', () => {
    assert.equal(nextRegion(links, 'farm', 'grove'), 'grove');
    assert.equal(nextRegion(links, 'grove', 'ridge'), 'farm');
    assert.equal(nextRegion(links, 'woods', 'point'), 'farm');
    assert.equal(nextRegion(links, 'town', 'ridge'), 'mountain');
    assert.equal(nextRegion(links, 'town', 'town'), null);
    assert.equal(nextRegion({ a: [] }, 'a', 'b'), null);
  });
  test('every neighbour that starts a shortest walk is offered, so callers can break ties', () => {
    const gated = { ...links, woods: ['farm', 'beach'], beach: ['town', 'point', 'woods'] };
    assert.deepEqual(nextRegions(gated, 'woods', 'town'), ['beach', 'farm']);
    assert.deepEqual(nextRegions(gated, 'woods', 'point'), ['beach']);
    assert.deepEqual(nextRegions(gated, 'town', 'woods'), ['beach', 'farm']);
    assert.deepEqual(nextRegions(links, 'woods', 'point'), ['farm']);
    assert.deepEqual(nextRegions(links, 'town', 'town'), []);
    assert.deepEqual(nextRegions({ a: [] }, 'a', 'b'), []);
  });
  test('compass words', () => {
    assert.equal(compassWord(-5, 0), 'west');
    assert.equal(compassWord(4, 4), 'south-east');
    assert.equal(compassWord(10, -1), 'east');
    assert.equal(compassWord(0, 0), 'here');
  });
  test('shop status: open, before opening, after closing, closed day, festival', () => {
    const forge: [number, number, number[]] = [10, 16, [3]];
    assert.deepEqual(shopStatus(forge, 0, 12 * 60), { open: true, text: 'open until 4PM' });
    assert.equal(shopStatus(forge, 0, 9 * 60).text, 'opens at 10AM today');
    assert.equal(shopStatus(forge, 0, 16 * 60).text, 'closed for the day; opens tomorrow 10AM');
    assert.equal(shopStatus(forge, 2, 17 * 60).text, 'closed for the day; opens Fri 10AM', 'Wednesday evening skips closed Thursday');
    assert.equal(shopStatus(forge, 3, 12 * 60).open, false);
    assert.equal(shopStatus(forge, 3, 12 * 60).text, 'closed today (Thu); opens tomorrow 10AM');
    assert.deepEqual(shopStatus(forge, 0, 12 * 60, (d) => d === 0), { open: false, text: 'closed for the festival; opens tomorrow 10AM' });
    // festival eve: tomorrow is a festival, so the forge next opens the day after
    assert.equal(shopStatus(forge, 0, 17 * 60, (d) => d === 1).text, 'closed for the day; opens Wed 10AM');
    // a closed Thursday before a Friday festival
    assert.equal(shopStatus(forge, 3, 12 * 60, (d) => d === 1).text, 'closed today (Thu); opens Sat 10AM');
  });

  test('absday labels: season and day, with or without the year', () => {
    assert.equal(absdayLabel(0), 'Spring 1, Year 1');
    assert.equal(absdayLabel(31, false), 'Summer 2');
    assert.equal(absdayLabel(120 + 89), 'Fall 30, Year 2');
    assert.equal(absdayLabel(119, false), 'Winter 30');
  });
  test('public works needs: materials capped at what is needed, the crop slot last', () => {
    const needs = { Lumber: 12, Copper: 2 };
    let rows = worksNeeds(needs, 3, {}, null);
    assert.deepEqual(rows, [
      { item: 'Lumber', got: 0, need: 12 },
      { item: 'Copper', got: 0, need: 2 },
      { item: null, got: 0, need: 3 },
    ]);
    assert.equal(worksSummary(rows, true), '12 Lumber, 2 Copper, 3 of one farm crop');
    rows = worksNeeds(needs, 3, { Lumber: 15, Copper: 1, Turnip: 3 }, 'Turnip');
    assert.deepEqual(rows.map((r) => r.got), [12, 1, 3]);
    assert.equal(worksSummary(rows), 'Lumber 12/12, Copper 1/2, Turnip 3/3');
    assert.equal(worksSummary(rows, true), '1 Copper');
  });
});

describe('Saturday stall shoppers (task 09)', () => {
  const price = (item: string) => ({ Turnip: 60, Egg: 50, 'Small Fish': 50 })[item] ?? 0;
  const markup = { love: 1.5, like: 1.25, neutral: 1.1 };
  const tastes = { loves: ['Egg'], likes: ['Turnip'], hates: ['Small Fish'] };
  const stock = () => [
    { item: 'Small Fish', qty: 2, sold: 0 },
    { item: 'Turnip', qty: 3, sold: 0 },
    { item: 'Egg', qty: 3, sold: 0 },
  ];

  test('a shopper takes two of what they love, at the best price', () => {
    assert.deepEqual(stallVisit(stock(), tastes, price, markup, 0.99), { kind: 'sale', index: 2, qty: 2, gold: 150, pref: 'love' });
    const oneLeft = stock();
    oneLeft[2].sold = 2;
    assert.deepEqual(stallVisit(oneLeft, tastes, price, markup, 0.99), { kind: 'sale', index: 2, qty: 1, gold: 75, pref: 'love' });
  });

  test('with their favourite gone they settle for one of something they like', () => {
    const goods = stock();
    goods[2].sold = 3;
    assert.deepEqual(stallVisit(goods, tastes, price, markup, 0.99), { kind: 'sale', index: 1, qty: 1, gold: 75, pref: 'like' });
  });

  test('plain goods sell about six times in ten, a little over the shipping price', () => {
    const plain = { loves: [], likes: [], hates: [] };
    assert.deepEqual(stallVisit(stock(), plain, price, markup, 0.59), { kind: 'sale', index: 0, qty: 1, gold: 55, pref: 'neutral' });
    assert.deepEqual(stallVisit(stock(), plain, price, markup, 0.6), { kind: 'pass', reason: 'browse' });
  });

  test('nobody buys what they hate, and a bare stall sells nothing', () => {
    const onlyFish = [{ item: 'Small Fish', qty: 2, sold: 0 }];
    assert.deepEqual(stallVisit(onlyFish, tastes, price, markup, 0), { kind: 'pass', reason: 'hate' });
    assert.deepEqual(stallVisit([{ item: 'Egg', qty: 2, sold: 2 }], tastes, price, markup, 0), { kind: 'pass', reason: 'empty' });
    assert.deepEqual(stallVisit([], tastes, price, markup, 0), { kind: 'pass', reason: 'empty' });
  });
});

describe('market regulars and their lists (task 10)', () => {
  const inSeason = (season: number) => (i: string) => CROPS[i]?.[0] === SEASONS[season];
  const wants = (day: number, season: number) => marketWants(day, season, PANTRY_STAPLES, inSeason(season), MARKET_FLOWERS, 2);

  test('one list per market day: the same every time it is asked for, and it changes from week to week', () => {
    assert.deepEqual(wants(5, 0), wants(5, 0));
    const lists = new Set<string>();
    for (let week = 0; week < 4; week++) lists.add(JSON.stringify(wants(5 + week * 7, 0)));
    assert.ok(lists.size >= 3, `four spring Saturdays give varied lists (${lists.size})`);
  });

  test('Gideon asks for two different staples: eggs, or crops in their own season', () => {
    for (let season = 0; season < 3; season++) {
      for (let day = 0; day < 400; day += 7) {
        const { pantry } = wants(day, season);
        assert.equal(pantry.length, 2);
        assert.notEqual(pantry[0], pantry[1]);
        for (const item of pantry) assert.ok(item === 'Egg' || CROPS[item][0] === SEASONS[season], `${item} in ${SEASONS[season]}`);
      }
    }
    // nothing grows in winter, so eggs are all he can ask for
    assert.deepEqual(wants(117, 3).pantry, ['Egg']);
  });

  test('with preserves to keep (task 31), the first pick is always one of them and the rest are staples', () => {
    const keeps = ['Pickled Turnip', 'Dried Herbs', 'Strawberry Jam'];
    for (const season of [2, 3]) {
      for (let day = 0; day < 400; day += 7) {
        const { pantry } = marketWants(day, season, PANTRY_STAPLES, inSeason(season), MARKET_FLOWERS, 2, keeps);
        assert.equal(pantry.length, 2);
        assert.ok(keeps.includes(pantry[0]), pantry.join(', '));
        assert.ok(!keeps.includes(pantry[1]) && (pantry[1] === 'Egg' || CROPS[pantry[1]][0] === SEASONS[season]), pantry.join(', '));
      }
    }
    assert.deepEqual(marketWants(5, 3, PANTRY_STAPLES, inSeason(3), MARKET_FLOWERS, 0, keeps).pantry, []);
  });

  test("Rosalind's flower can always be had that season, and she wants none in winter", () => {
    const grows = (flower: string, season: number) =>
      CROPS[flower]?.[0] === SEASONS[season] ||
      (FORAGE[SEASONS[season]] || []).includes(flower) ||
      Object.values(REGION_FORAGE).some((r) => (r[SEASONS[season]] || []).includes(flower));
    for (let season = 0; season < 3; season++) {
      const seen = new Set<string>();
      for (let day = 0; day < 400; day += 7) seen.add(wants(day, season).flower!);
      assert.deepEqual([...seen].sort(), [...MARKET_FLOWERS[season]].sort(), `every ${SEASONS[season]} flower turns up`);
      for (const f of seen) assert.ok(grows(f, season), `${f} grows or can be foraged in ${SEASONS[season]}`);
    }
    assert.equal(wants(117, 3).flower, null);
  });

  test('a regular buys only from the list, up to their limit of each, at their markup', () => {
    const price = (item: string) => ({ Potato: 80, Egg: 50, Turnip: 60 })[item] ?? 0;
    const goods = [
      { item: 'Turnip', qty: 5, sold: 0 },
      { item: 'Potato', qty: 5, sold: 1 },
      { item: 'Egg', qty: 2, sold: 0 },
    ];
    const { markup, each } = MARKET_SHOPPERS.pantry;
    assert.deepEqual(marketVisit(goods, ['Potato', 'Egg'], price, markup, each), [
      { index: 1, qty: 3, gold: Math.round(80 * markup) * 3 },
      { index: 2, qty: 2, gold: Math.round(50 * markup) * 2 },
    ]);
    goods[1].sold = 5;
    goods[2].sold = 2;
    assert.deepEqual(marketVisit(goods, ['Potato', 'Egg'], price, markup, each), [], 'sold out of everything on the list');
    assert.deepEqual(marketVisit(goods, ['Cabbage'], price, markup, each), [], 'nothing on the list was put out');
    assert.ok(markup > 1.5 && MARKET_SHOPPERS.flower.markup > markup, 'regulars pay more than any villager, Rosalind most of all');
  });
});

describe('planting forecast (task 24)', () => {
  test('first harvest after the growing days, then every regrowth until the season ends', () => {
    assert.deepEqual(plantingForecast(1, 4, 0), { first: 5, repeats: [] }, 'turnips sown on the 1st');
    assert.deepEqual(plantingForecast(10, 9, 5), { first: 19, repeats: [24, 29] }, 'cucumbers sown on the 10th');
    assert.deepEqual(plantingForecast(1, 8, 2), { first: 9, repeats: [11, 13, 15, 17, 19, 21, 23, 25, 27, 29] });
  });

  test('the season edge: ready on the 30th counts, a day later does not', () => {
    assert.deepEqual(plantingForecast(26, 4, 0), { first: 30, repeats: [] });
    assert.deepEqual(plantingForecast(27, 4, 0), { first: null, repeats: [] }, 'withers at the change of season');
    assert.deepEqual(plantingForecast(21, 9, 5), { first: 30, repeats: [] }, 'no time to regrow');
  });
});
