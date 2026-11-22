import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRowRepeat, rowKeyboardKey } from '../../components/GameScreen';
import { Screen } from './screen';
import { REPEAT_DELAY_MS, REPEAT_MS } from './viewport';

test('keyboard row repeats cannot start another row, but typing and other keys are unchanged', () => {
  for (const key of ['c', 'C']) {
    assert.equal(rowKeyboardKey(key, false, false), key);
    assert.equal(rowKeyboardKey(key, true, false), 'row-repeat');
    assert.equal(rowKeyboardKey(key, true, true), key);
  }
  assert.equal(rowKeyboardKey('x', true, false), 'x');
});

test('row hold waits, repeats at the shared cadence, and never backs up the queue', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const screen = new Screen();
  const hold = createRowRepeat(() => screen, () => true);
  hold.start();
  t.mock.timers.tick(REPEAT_DELAY_MS - 1);
  assert.deepEqual(screen.keyQueue, []);
  t.mock.timers.tick(1);
  assert.deepEqual(screen.keyQueue, ['row-repeat']);
  t.mock.timers.tick(REPEAT_MS);
  assert.deepEqual(screen.keyQueue, ['row-repeat']);
  screen.keyQueue.shift();
  t.mock.timers.tick(REPEAT_MS);
  assert.deepEqual(screen.keyQueue, ['row-repeat']);
  hold.stop();
  assert.deepEqual(screen.keyQueue, [], 'release discards an unconsumed repeat');
  t.mock.timers.tick(REPEAT_MS * 5);
  assert.deepEqual(screen.keyQueue, []);
});

test('other queued input blocks repeats and stopping preserves it', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const screen = new Screen();
  const hold = createRowRepeat(() => screen, () => true);
  screen.pushKey('c');
  hold.start();
  t.mock.timers.tick(REPEAT_DELAY_MS);
  assert.deepEqual(screen.keyQueue, ['c']);
  hold.stop();
  assert.deepEqual(screen.keyQueue, ['c']);
});

test('a hold stops rather than resuming after a modal or menu interrupts it', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const screen = new Screen();
  let available = true;
  const hold = createRowRepeat(() => screen, () => available);
  hold.start();
  t.mock.timers.tick(REPEAT_DELAY_MS);
  assert.deepEqual(screen.keyQueue, ['row-repeat']);
  available = false;
  t.mock.timers.tick(REPEAT_MS);
  assert.deepEqual(screen.keyQueue, [], 'interruption clears the pending repeat');
  available = true;
  t.mock.timers.tick(REPEAT_MS * 5);
  assert.deepEqual(screen.keyQueue, [], 'a new press is required');
});
