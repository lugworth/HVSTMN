import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { Screen } from './screen';
import { Game } from './engine';
import { NPCS } from './constants';
import { LEGACY_NAMES, migrateLegacySave, renameLegacy } from './legacy_names';

before(() => {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
  };
});

const fresh = () => {
  const g = new Game(new Screen(132, 30), true) as any;
  g.new_game('Ash', 'Bramble');
  return g;
};

describe('the Brackenford rename keeps old saves', () => {
  test('a save from before the rename loads with its friends, items and tools', () => {
    const g = fresh();
    const old = JSON.parse(JSON.stringify(g.snapshot()));
    old.friend = { ...old.friend, Gray: 40, Popuri: 12, Doctor: 7 };
    old.inv = { ...old.inv, 'Moondrop Flower': 2, Mystrile: 3, 'Power Berry': 1 };
    old.married = 'Popuri';

    const h = fresh();
    h.applySaveData(old);
    assert.equal(h.friend['Rowan'], 40);
    assert.equal(h.friend['Dr. Sayer'], 7);
    assert.equal(h.married, 'Juniper');
    assert.equal(h.inv['Duskbell Flower'], 2);
    assert.equal(h.inv['Starsteel'], 3);
    assert.equal(h.inv['Heartseed'], 1);
    for (const gone of ['Gray', 'Popuri', 'Doctor']) assert.equal(h.friend[gone], undefined);
    assert.equal(h.inv['Mystrile'], undefined);
  });

  test('a save already in the new names comes back as the same object', () => {
    const snap = JSON.parse(JSON.stringify(fresh().snapshot()));
    assert.equal(migrateLegacySave(snap), snap);
  });

  test('every villager key is a new name, and none of them is renamed again', () => {
    for (const name of Object.keys(NPCS)) assert.equal(renameLegacy(name), name, name);
    for (const [, now] of LEGACY_NAMES) assert.equal(renameLegacy(now), now, now);
  });

  test('ordinary words that share a name are left alone', () => {
    assert.equal(renameLegacy('May the Wellkeeper bless you. Ann & May!'), 'May the Wellkeeper bless you. Tess & Pip!');
    assert.equal(renameLegacy('Anniversary at the Grayling Cliffside'), 'Anniversary at the Grayling Cliffside');
  });
});
