import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseGrid } from './viewport';
import { Game } from './engine';
import { Screen } from './screen';
import { computeFrame, toIsotope } from './enhanced';
import {
  resolveKeyBinding,
  sanitizeKeyBindings,
  keyLabelFor,
  readKeyBindings,
  writeKeyBindings,
  readTextScale,
  writeTextScale,
  mapSymbolLegend,
} from './accessibility';
import { SFX_PATTERNS, isSfxEnabled, setSfxEnabled, loadSfxPreference, playSfx } from './audio';

const measure = (px: number) => px * 0.6;

describe('accessibility, readable prompts, key rebinding & audio (task 56, G17, V16)', () => {
  test('task 56: larger text settings increase readable font sizing on desktop and phone portrait/landscape', () => {
    const deskNorm = chooseGrid(1280, 720, measure, false, 'normal');
    const deskLarge = chooseGrid(1280, 720, measure, false, 'large');
    const deskXL = chooseGrid(1280, 720, measure, false, 'xlarge');
    assert.ok(deskLarge.fontPx >= deskNorm.fontPx);
    assert.ok(deskXL.fontPx >= deskLarge.fontPx);

    // Phone portrait (390x844) and tablet (768x1024) stay >= 50x24 and bump font/compact readability
    const portNorm = chooseGrid(390, 560, measure, true, 'normal');
    const portLarge = chooseGrid(390, 560, measure, true, 'large');
    assert.ok(portNorm.cols >= 50 && portNorm.rows >= 24);
    assert.ok(portLarge.cols >= 50 && portLarge.rows >= 24);
    assert.ok(portLarge.fontPx >= portNorm.fontPx);

    // Phone landscape (844x390 -> stage ~560x360) stays readable without breaking min bounds
    const landLarge = chooseGrid(560, 360, measure, true, 'large');
    assert.ok(landLarge.cols >= 50 && landLarge.rows >= 24);
    assert.ok(landLarge.fontPx >= 9);

    // Tablet prefers compact larger text when xlarge is requested on narrow width
    const tabNorm = chooseGrid(768, 700, measure, true, 'normal');
    const tabXL = chooseGrid(768, 700, measure, true, 'xlarge');
    assert.ok(tabXL.fontPx > tabNorm.fontPx);
  });

  test('task 56: Valley Map pairs colors with explicit symbols, names, and OPEN/CLOSED status at 80x24 and 50x24', () => {
    for (const [w, h] of [[80, 24], [50, 24]]) {
      const s = new Screen(w, h);
      const g = new Game(s, true) as any;
      g.new_game('Ash', 'Bramble');
      g.draw_valley(0);
      const text = s.buf.map((r) => r.map((c) => c[0]).join('')).join('\n');
      assert.match(text, /\[OPEN\]|\[CLOSED\]/, `status tag present at ${w}x${h}`);
      assert.ok(mapSymbolLegend().length >= 6);
    }
  });

  test('G17: key rebinding translates custom keys, blocks reserved keys, bypasses while typing, and persists', () => {
    const clean = sanitizeKeyBindings({ bag: 'b', act: 'f', use: 'enter', diary: 'q' });
    assert.equal(clean.bag, 'b');
    assert.equal(clean.act, 'f');
    assert.equal(clean.use, undefined, 'reserved key enter is rejected');

    assert.equal(resolveKeyBinding('b', clean, false), 'i');
    assert.equal(resolveKeyBinding('B', clean, false), 'i');
    assert.equal(resolveKeyBinding('b', clean, true), 'b', 'typing mode bypasses keybinds');
    assert.equal(keyLabelFor('bag', clean), 'B');
    assert.equal(keyLabelFor('today', clean), 'Y');

    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
    };
    writeKeyBindings(storage, clean);
    assert.deepEqual(readKeyBindings(storage), { bag: 'b', act: 'f', diary: 'q' });
    writeTextScale(storage, 'xlarge');
    assert.equal(readTextScale(storage), 'xlarge');
  });

  test('G17 & Isotope invariant: high-contrast mode keeps every rendered colour on the Isotope Dark ramps', () => {
    const s = new Screen(80, 24);
    const g = new Game(s, true) as any;
    g.new_game('Ash', 'Bramble');
    g.mapname = 'farm';
    s.highContrast = true;
    g.render();
    const frame = computeFrame(s, 0);
    for (const row of frame) {
      for (const cell of row) {
        assert.equal(cell.fg, toIsotope(cell.fg), `fg ${cell.fg} must stay on Isotope ramp`);
        assert.equal(cell.bg, toIsotope(cell.bg), `bg ${cell.bg} must stay on Isotope ramp`);
      }
    }
  });

  test('V16: procedural audio patterns are defined, preference persists, and playSfx safely no-ops without Web Audio', () => {
    assert.ok(Object.keys(SFX_PATTERNS).length >= 8);
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
    };
    setSfxEnabled(false, storage);
    assert.equal(isSfxEnabled(), false);
    assert.equal(loadSfxPreference(storage), false);
    assert.equal(playSfx('coin'), false);
    setSfxEnabled(true, storage);
    assert.equal(loadSfxPreference(storage), true);
    // In Node without window.AudioContext, playSfx returns false without throwing
    assert.equal(playSfx('harvest'), false);
  });
});
