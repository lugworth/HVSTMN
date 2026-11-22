import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HeldDirections, turnKey } from './held';
import { REPEAT_DELAY_MS, REPEAT_MS } from './viewport';

const map = (face: [number, number] = [0, 1], idle = true) => ({ modal: false, idle, face });
const menu = { modal: true, idle: true, face: [0, 1] as [number, number] };

describe('held directions walk at one rhythm on every input', () => {
  test('a tap of the facing direction steps; another direction only turns', () => {
    const h = new HeldDirections();
    assert.equal(h.press('down', 'down', 0, map([0, 1])), 'down');
    h.release('down', 10);
    assert.equal(h.press('left', 'left', 20, map([0, 1])), turnKey('left'));
    h.release('left', 30);
    assert.equal(h.tick(1000, map([-1, 0])), null, 'a released key never walks on');
  });

  test('a hold walks after the delay, one step per interval, and only once the last step is taken', () => {
    const h = new HeldDirections();
    h.press('right', 'right', 0, map([0, 1]));
    assert.equal(h.tick(REPEAT_DELAY_MS - 1, map([1, 0])), null);
    assert.equal(h.tick(REPEAT_DELAY_MS, map([1, 0])), 'right');
    assert.equal(h.tick(REPEAT_DELAY_MS + REPEAT_MS - 1, map([1, 0])), null);
    assert.equal(h.tick(REPEAT_DELAY_MS + REPEAT_MS, map([1, 0], false)), null, 'busy: no step queued');
    assert.equal(h.tick(REPEAT_DELAY_MS + REPEAT_MS + 5, map([1, 0])), 'right');
  });

  test('100 seconds of holding is 10 steps a second, however fast the clock ticks', () => {
    const h = new HeldDirections();
    h.press('up', 'up', 0, map([0, -1]));
    let steps = 0;
    for (let t = 0; t <= 100_000; t += 7) if (h.tick(t, map([0, -1]))) steps++;
    assert.ok(Math.abs(steps - (100_000 - REPEAT_DELAY_MS) / REPEAT_MS) <= 1, `${steps} steps`);
  });

  test('the newest direction wins, and letting it go falls back to the one still held', () => {
    const h = new HeldDirections();
    h.press('up', 'up', 0, map([0, -1]));
    assert.equal(h.press('left', 'left', 50, map([0, -1])), turnKey('left'));
    assert.equal(h.tick(REPEAT_DELAY_MS + 50, map([-1, 0])), 'left');
    h.release('left', 400);
    assert.equal(h.tick(400, map([-1, 0])), 'up');
    h.release('up', 450);
    assert.equal(h.active, false);
  });

  test('in a menu a direction moves the selection at once and repeats', () => {
    const h = new HeldDirections();
    assert.equal(h.press('down', 'down', 0, menu), 'down');
    assert.equal(h.tick(REPEAT_DELAY_MS, menu), 'down');
  });

  test('a walk pauses when a dialog opens, so the held key does not page through it', () => {
    const h = new HeldDirections();
    h.press('down', 'down', 0, map([0, 1]));
    assert.equal(h.tick(REPEAT_DELAY_MS, menu), null);
    assert.equal(h.tick(REPEAT_DELAY_MS + 1, map([0, 1])), 'down');
  });
});

test('a hold can send a different key from its name (the D-pad sends plain directions)', () => {
  const h = new HeldDirections();
  assert.equal(h.press('pad-up', 'up', 0, { modal: false, idle: true, face: [0, -1] }, 'up'), 'up');
  assert.equal(h.tick(REPEAT_DELAY_MS, { modal: false, idle: true, face: [0, -1] }), 'up');
});
