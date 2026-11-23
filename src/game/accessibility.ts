// Accessibility, text scaling, map symbol/name pairing & key rebinding for FURROW
// Covers Task 56 (Readable prompts at small sizes) and feature G17 (Key rebinding & UI scale).

export type TextScale = 'normal' | 'large' | 'xlarge';

export const TEXT_SCALE_KEY = 'hrvstmn-text-scale';
export const HIGH_CONTRAST_KEY = 'hrvstmn-contrast';
export const KEYBINDS_KEY = 'hrvstmn-keybinds';

export const TEXT_SCALES: Record<TextScale, { label: string; boostPx: number; desc: string }> = {
  normal: { label: 'Normal', boostPx: 0, desc: 'Standard grid and prompt size.' },
  large: { label: 'Large', boostPx: 3, desc: 'Larger text and prompts; favors compact layout on small screens.' },
  xlarge: { label: 'Extra Large', boostPx: 6, desc: 'Maximum legibility for small screens and touch controls.' },
};

export function readTextScale(storage?: Pick<Storage, 'getItem'> | null): TextScale {
  try {
    const v = storage?.getItem(TEXT_SCALE_KEY);
    return v === 'large' || v === 'xlarge' ? v : 'normal';
  } catch {
    return 'normal';
  }
}

export function writeTextScale(storage: Pick<Storage, 'setItem'> | null | undefined, scale: TextScale): void {
  try {
    storage?.setItem(TEXT_SCALE_KEY, scale);
  } catch {
    // storage unavailable
  }
}

export function readHighContrast(storage?: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem(HIGH_CONTRAST_KEY) === 'on';
  } catch {
    return false;
  }
}

export function writeHighContrast(storage: Pick<Storage, 'setItem'> | null | undefined, on: boolean): void {
  try {
    storage?.setItem(HIGH_CONTRAST_KEY, on ? 'on' : 'off');
  } catch {
    // storage unavailable
  }
}

// ---------------------------------------------------------------- G17: Customizable Key Bindings
export type RebindableAction =
  | 'use'
  | 'act'
  | 'bag'
  | 'today'
  | 'notes'
  | 'minimap'
  | 'valley'
  | 'row'
  | 'seed_pouch'
  | 'diary';

export interface KeyActionSpec {
  id: RebindableAction;
  label: string;
  defaultKey: string; // canonical engine key name
  display: string;
}

export const KEY_ACTION_SPECS: readonly KeyActionSpec[] = [
  { id: 'use', label: 'Use Tool', defaultKey: 'space', display: 'Space' },
  { id: 'act', label: 'Interact / Talk', defaultKey: 'x', display: 'X' },
  { id: 'bag', label: 'Rucksack (Bag)', defaultKey: 'i', display: 'I' },
  { id: 'today', label: "Today's Plan", defaultKey: 'y', display: 'Y' },
  { id: 'notes', label: 'Villager Notes', defaultKey: 'r', display: 'R' },
  { id: 'minimap', label: 'Minimap', defaultKey: 'n', display: 'N' },
  { id: 'valley', label: 'Valley Map', defaultKey: 'g', display: 'G' },
  { id: 'row', label: 'Work Along Row', defaultKey: 'c', display: 'C' },
  { id: 'seed_pouch', label: 'Seed Pouch Shortcut', defaultKey: 'f', display: 'F' },
  { id: 'diary', label: 'Diary / Pause', defaultKey: 'esc', display: 'Esc' },
];

export type KeyBindings = Partial<Record<RebindableAction, string>>;

export function sanitizeKeyBindings(raw: unknown): KeyBindings {
  if (!raw || typeof raw !== 'object') return {};
  const out: KeyBindings = {};
  const reserved = new Set(['up', 'down', 'left', 'right', 'enter', 'backspace', 'tab', 'btab', 'ctrl-c']);
  for (const spec of KEY_ACTION_SPECS) {
    const v = (raw as Record<string, unknown>)[spec.id];
    if (typeof v === 'string' && v.length > 0 && v.length <= 10 && !reserved.has(v)) {
      out[spec.id] = v;
    }
  }
  return out;
}

export function readKeyBindings(storage?: Pick<Storage, 'getItem'> | null): KeyBindings {
  try {
    const raw = storage?.getItem(KEYBINDS_KEY);
    if (!raw) return {};
    return sanitizeKeyBindings(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function writeKeyBindings(storage: Pick<Storage, 'setItem'> | null | undefined, bindings: KeyBindings): void {
  try {
    storage?.setItem(KEYBINDS_KEY, JSON.stringify(sanitizeKeyBindings(bindings)));
  } catch {
    // storage unavailable
  }
}

/**
 * Translate a pressed key through custom user keybindings back to the canonical engine key.
 * While typing text, bindings are bypassed so every letter types normally.
 */
export function resolveKeyBinding(key: string, bindings: KeyBindings, typing: boolean): string {
  if (typing) return key;
  const low = key.length === 1 ? key.toLowerCase() : key;
  for (const spec of KEY_ACTION_SPECS) {
    const custom = bindings[spec.id];
    if (!custom) continue;
    const customLow = custom.length === 1 ? custom.toLowerCase() : custom;
    if (low === customLow) return spec.defaultKey;
  }
  return key;
}

/** Display label for a key binding (for toolbar/menu/help). */
export function keyLabelFor(action: RebindableAction, bindings: KeyBindings): string {
  const spec = KEY_ACTION_SPECS.find((s) => s.id === action);
  if (!spec) return '';
  const k = bindings[action];
  if (!k) return spec.display;
  if (k === 'space') return 'Space';
  if (k === 'esc') return 'Esc';
  return k.length === 1 ? k.toUpperCase() : k;
}

/** Map landmark category badge pairing symbol + text name (never colour alone, Task 56). */
export function mapSymbolLegend(): readonly { glyph: string; name: string; col: string }[] {
  return [
    { glyph: '$', name: 'Shop / Ship', col: '09' },
    { glyph: '♥', name: 'Home / Folk', col: '0A' },
    { glyph: '♠', name: 'Woods / Peak', col: '0B' },
    { glyph: '≈', name: 'Water / Fish', col: '0C' },
    { glyph: '⚒', name: 'Forge / Mine', col: '09' },
    { glyph: '★', name: 'Pinned Goal', col: '0E' },
    { glyph: '@', name: 'You', col: '0C' },
  ];
}
