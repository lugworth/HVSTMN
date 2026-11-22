import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Screen } from './screen';
import { Game } from './engine';
import {
  AUTOSAVE_KEY,
  SAVE_VERSION,
  cloneSaveValue,
  deleteSaveSlot,
  formatSaveLine,
  formatSaveStatsLine,
  formatSlotBadge,
  isValidSavePayload,
  listSaveSlots,
  parseSaveJson,
  readSaveSlot,
  slotStorageKey,
  summarizeSave,
  writeSaveSlot,
  DAWN_KEY,
  DAWN_MAX,
  readDawnBackups,
  pushDawnBackup,
  clearDawnBackups,
  type StorageLike,
} from './save';
import { SAVE_KEY } from './constants';

function createMockStorage(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = String(v);
    },
    removeItem: (k: string) => {
      delete data[k];
    },
  };
}

let mockStorage = createMockStorage();

beforeEach(() => {
  mockStorage = createMockStorage();
  (globalThis as any).localStorage = mockStorage;
});

describe('save module pure helpers', () => {
  test('slotStorageKey maps auto, slot 1, and slot 2 to distinct keys', () => {
    assert.equal(slotStorageKey('auto'), AUTOSAVE_KEY);
    assert.equal(slotStorageKey(1), SAVE_KEY);
    assert.equal(slotStorageKey(2), `${SAVE_KEY}-2`);
  });

  test('isValidSavePayload and parseSaveJson reject corrupted or non-save payloads', () => {
    assert.equal(parseSaveJson(''), null);
    assert.equal(parseSaveJson('{bad json'), null);
    assert.equal(parseSaveJson('[]'), null);
    assert.equal(parseSaveJson(JSON.stringify({ gold: 500 })), null);
    assert.equal(isValidSavePayload({ name: '   ', tilled: [] }), false);
    assert.equal(isValidSavePayload({ name: 'Ash', tilled: 'not-array' }), false);
    assert.equal(isValidSavePayload({ name: 'Ash', season: 9 }), false);
    assert.equal(isValidSavePayload({ name: 'Ash', day: 35 }), false);
    assert.equal(isValidSavePayload({ name: 'Ash', inv: ['Turnip'] }), false);
    assert.equal(isValidSavePayload({ name: 'Ash', tilled: ['10,10'], inv: { Turnip: 2 }, crops: { '10,10': ['Turnip', 1] } }), true);
  });

  test('writeSaveSlot, readSaveSlot, and deleteSaveSlot handle storage errors gracefully', () => {
    const failingStorage: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const writeFail = writeSaveSlot(failingStorage, 'auto', { name: 'Ash' });
    assert.equal(writeFail.ok, false);
    assert.match(writeFail.error || '', /QuotaExceededError/);
    assert.equal(readSaveSlot(failingStorage, 1), null);
    assert.equal(deleteSaveSlot(failingStorage, 1), false);
    assert.equal(writeSaveSlot(null, 1, { name: 'Ash' }).ok, false);
  });

  test('summarizeSave and listSaveSlots compute accurate farm & inventory metadata', () => {
    const payload = {
      _v: SAVE_VERSION,
      name: 'Clara',
      farm: 'Sun',
      year: 2,
      season: 1,
      day: 12,
      minutes: 9 * 60 + 30,
      gold: 2450,
      inv: { 'Tomato Seeds': 4, 'Small Fish': 2, Pedometer: 1 },
      crops: { '10,10': ['Tomato', 3], '11,10': ['Corn', 1] },
      tilled: ['10,10', '11,10', '12,10'],
      wet: ['10,10'],
      mapname: 'farm',
      savedAt: 1700000000000,
    };
    writeSaveSlot(mockStorage, 'auto', payload);
    const slots = listSaveSlots(mockStorage);
    assert.ok(slots.auto);
    assert.equal(slots.slot1, null);
    assert.equal(slots.slot2, null);
    assert.equal(slots.auto!.farmer, 'Clara');
    assert.equal(slots.auto!.farm, 'Sun');
    assert.equal(slots.auto!.seasonName, 'Summer');
    assert.equal(slots.auto!.itemKinds, 3);
    assert.equal(slots.auto!.itemTotal, 7);
    assert.equal(slots.auto!.cropCount, 2);
    assert.equal(slots.auto!.tilledCount, 3);
    assert.match(formatSaveLine(slots.auto!), /Clara · Sun Farm · Summer 12/);
    assert.match(formatSaveStatsLine(slots.auto!), /2450G · Bag: 3 kinds \(7\) · Crops: 2 · Tilled: 3/);
    assert.equal(formatSlotBadge(slots.auto), 'Su 12 · 2450G');
    assert.equal(formatSlotBadge(null), 'Empty');

    deleteSaveSlot(mockStorage, 'auto');
    assert.equal(listSaveSlots(mockStorage).auto, null);
  });

  test('cloneSaveValue isolates nested objects and converts Sets to arrays', () => {
    const original = {
      inv: { Turnip: 3 },
      crops: { '10,10': ['Turnip', 2] },
      talked: new Set(['Tess', 'Juniper']),
    };
    const cloned = cloneSaveValue(original) as any;
    original.inv.Turnip = 99;
    original.crops['10,10'][1] = 0;
    assert.equal(cloned.inv.Turnip, 3);
    assert.equal(cloned.crops['10,10'][1], 2);
    assert.deepEqual(cloned.talked, ['Tess', 'Juniper']);
  });
});

describe('Game localStorage persistence across sessions', () => {
  test('full inventory, farm state, multi-map objects, position, and Sets survive JSON round-trip', () => {
    const a = new Game(new Screen(132, 30), true);
    a.new_game('Aria', 'Cedar');
    a.warp('farm', 16, 12, [1, 0]);
    a.gold = 1875;
    a.give('Potato Seeds', 5);
    a.give('Medicinal Herb', 2);
    a.held = 'Medicinal Herb';
    a.tool = 'Watering Can';
    a.levels['Hoe'] = 2;
    a.water = 19;
    a.tv_order = ['Knife', a.absday() + 3];
    a.basket = { Turnip: 4 };
    a.bin = { Egg: 2 };
    a.tilled.add('17,12');
    a.tilled.add('18,12');
    a.wet.add('17,12');
    a.crops['17,12'] = ['Turnip', 2];
    a.objs.farm['19,12'] = 'stump';
    a.hp['19,12'] = 4;
    let woodsGrassKey = '12,12';
    for (let y = 1; y < a.maps.woods.h - 1; y++) {
      for (let x = 1; x < a.maps.woods.w - 1; x++) {
        if (a.maps.woods.tile(x, y) === 'grass') {
          woodsGrassKey = `${x},${y}`;
          break;
        }
      }
      if (a.maps.woods.tile(...woodsGrassKey.split(',').map(Number) as [number, number]) === 'grass') break;
    }
    a.objs.woods = { '10,10': 'dig' };
    a.forage.woods = { [woodsGrassKey]: 'Truffle' };
    a.talked.add('Margit');
    a.gifted.add('Margit');

    a.autosave(true);
    assert.ok(mockStorage.data[AUTOSAVE_KEY]);

    // Mutate original instance after saving to verify snapshot isolation
    a.inv['Medicinal Herb'] = 99;
    a.crops['17,12'][1] = 99;

    // Boot a brand-new Game instance simulating a new browser session
    const b = new Game(new Screen(132, 30), false);
    assert.equal(b.hasSave('auto'), true);
    b.load('auto');

    assert.equal(b.name, 'Aria');
    assert.equal(b.farm, 'Cedar');
    assert.equal(b.mapname, 'farm');
    assert.equal(b.px, 16);
    assert.equal(b.py, 12);
    assert.deepEqual(b.face, [1, 0]);
    assert.equal(b.gold, 1875);
    assert.equal(b.inv['Potato Seeds'], 5);
    assert.equal(b.inv['Medicinal Herb'], 2);
    assert.equal(b.held, 'Medicinal Herb');
    assert.equal(b.tool, 'Watering Can');
    assert.equal(b.levels['Hoe'], 2);
    assert.equal(b.water, 19);
    assert.deepEqual(b.tv_order, ['Knife', a.absday() + 3]);
    assert.deepEqual(b.basket, { Turnip: 4 });
    assert.deepEqual(b.bin, { Egg: 2 });
    assert.equal(b.tilled.has('17,12'), true);
    assert.equal(b.tilled.has('18,12'), true);
    assert.equal(b.wet.has('17,12'), true);
    assert.deepEqual(b.crops['17,12'], ['Turnip', 2]);
    assert.equal(b.objs.farm['19,12'], 'stump');
    assert.equal(b.hp['19,12'], 4);
    assert.equal(b.objs.woods['10,10'], 'dig');
    assert.equal(b.forage.woods[woodsGrassKey], 'Truffle');
    assert.ok(b.talked instanceof Set && b.talked.has('Margit'));
    assert.ok(b.gifted instanceof Set && b.gifted.has('Margit'));
    assert.doesNotThrow(() => b.talked.add('Odessa'));
  });

  test('autostart resumes from existing auto-save and falls back cleanly if corrupted', async () => {
    const a = new Game(new Screen(132, 30), true);
    a.new_game('Ash', 'Bramble');
    a.gold = 999;
    a.give('Turnip', 3);
    a.tilled.add('15,15');
    a.autosave(true);

    // Simulate reload with ?autostart=1
    const scr = new Screen(132, 30);
    const b = new Game(scr, true);
    scr.pushKey('Q');
    scr.pushKey('enter');
    // Override confirm so quit_prompt exits immediately
    b.confirm = async () => false;
    b.handle = async (k: string) => {
      if (k === 'Q') b.running = false;
    };
    await b.run();

    assert.equal(b.gold, 999);
    assert.equal(b.inv['Turnip'], 3);
    assert.equal(b.tilled.has('15,15'), true);

    // Corrupted localStorage falls back to a fresh new game instead of crashing
    mockStorage.data[AUTOSAVE_KEY] = '{not valid json!!!';
    const scr2 = new Screen(132, 30);
    const c = new Game(scr2, true);
    scr2.pushKey('Q');
    c.handle = async (k: string) => {
      if (k === 'Q') c.running = false;
    };
    await c.run();
    assert.equal(c.gold, 500);
    assert.equal(c.started, true);
  });

  test('manual save to Slot 1 or Slot 2 also updates Auto-Save and preserves independent slots', () => {
    const g = new Game(new Screen(132, 30), true);
    g.new_game('Ash', 'Bramble');
    g.gold = 700;
    assert.equal(g.save(1), true);
    g.gold = 1200;
    assert.equal(g.save(2), true);

    const slots = listSaveSlots(mockStorage);
    assert.equal(slots.slot1?.gold, 700);
    assert.equal(slots.slot2?.gold, 1200);
    assert.equal(slots.auto?.gold, 1200);
  });
});

describe('morning backups (task 55)', () => {
  const morning = (day: number, extra: Record<string, any> = {}) => ({ name: 'Ash', farm: 'Bramble', year: 1, season: 0, day, minutes: 360, gold: day * 100, ...extra });

  test('newest first, at most DAWN_MAX, and a second save of the same morning replaces the first', () => {
    for (let d = 1; d <= DAWN_MAX + 2; d++) assert.ok(pushDawnBackup(mockStorage, morning(d)).ok);
    let list = readDawnBackups(mockStorage);
    assert.deepEqual(list.map((d) => d.day), [5, 4, 3].slice(0, DAWN_MAX));
    pushDawnBackup(mockStorage, morning(5, { gold: 1 }));
    list = readDawnBackups(mockStorage);
    assert.equal(list.length, DAWN_MAX);
    assert.equal(list.filter((d) => d.day === 5).length, 1);
    assert.equal(list[0].gold, 1);
    pushDawnBackup(mockStorage, morning(5, { farm: 'Cedar' }));
    assert.deepEqual(readDawnBackups(mockStorage).map((d) => d.farm), ['Cedar', 'Bramble', 'Bramble'], 'another farm is another backup');
  });

  test('unreadable entries are skipped, a full store sheds the oldest, and clearing removes them all', () => {
    mockStorage.data[DAWN_KEY] = JSON.stringify([morning(2), { gold: 5 }, 'junk']);
    assert.deepEqual(readDawnBackups(mockStorage).map((d) => d.day), [2]);
    mockStorage.data[DAWN_KEY] = '{not json';
    assert.deepEqual(readDawnBackups(mockStorage), []);

    for (let d = 1; d <= 3; d++) pushDawnBackup(mockStorage, morning(d));
    const tight: StorageLike = {
      getItem: (k) => mockStorage.getItem(k),
      setItem: (k, v) => {
        if (JSON.parse(v).length > 1) throw new Error('QuotaExceededError');
        mockStorage.setItem(k, v);
      },
      removeItem: (k) => mockStorage.removeItem(k),
    };
    assert.ok(pushDawnBackup(tight, morning(4)).ok);
    assert.deepEqual(readDawnBackups(mockStorage).map((d) => d.day), [4], 'keeps the newest when space is short');
    assert.equal(pushDawnBackup(null, morning(5)).ok, false);

    assert.ok(clearDawnBackups(mockStorage));
    assert.deepEqual(readDawnBackups(mockStorage), []);
  });

  test('waking up keeps a backup; the Diary restores one after showing the farm and date', async () => {
    const g = new Game(new Screen(132, 30), true) as any;
    g.new_game('Aria', 'Cedar');
    g.started = true;
    g.say = async () => {};
    await g.new_day('passout');
    const first = readDawnBackups(mockStorage);
    assert.equal(first.length, 1);
    assert.equal(first[0].day, 2);
    assert.equal(first[0].minutes, 6 * 60);

    g.gold = 12345;
    g.minutes = 15 * 60;
    const shown: string[][] = [];
    const titles: string[] = [];
    g.menu = async (title: string, opts: string[], _sel: number, info: any) => {
      titles.push(title);
      if (title === 'Morning Backups') {
        shown.push(opts, info(0));
        return 0;
      }
      return 1; // "No" at the confirm
    };
    await g.dawn_menu();
    assert.equal(shown[0][0], 'Cedar Farm · Spring 2, Yr 1');
    assert.match(shown[1][0], /Aria · Cedar Farm · Spring 2 \(Tue\), Yr 1 · +6:00 ?AM/i);
    assert.match(titles[1], /^Restore Aria's Cedar Farm to the morning of Spring 2, Year 1\?/);
    assert.equal(g.gold, 12345, 'declining changes nothing');

    g.menu = async (title: string) => (title === 'Morning Backups' ? 0 : 0);
    await g.dawn_menu();
    assert.equal(g.minutes, 6 * 60);
    assert.notEqual(g.gold, 12345);
    assert.equal(readSaveSlot(mockStorage, 'auto')?.minutes, 6 * 60, 'the auto-save holds the restored morning');
  });

  test('no backups yet: the Diary has no restore entry and the menu says why', async () => {
    const g = new Game(new Screen(132, 30), true) as any;
    g.new_game('Aria', 'Cedar');
    const said: string[] = [];
    g.say = async (t: string) => { said.push(t); };
    await g.dawn_menu();
    assert.match(said[0], /No morning backups yet/);
  });
});
