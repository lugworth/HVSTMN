// Procedural Web Audio chiptune synthesizer for GLADE (Feature V16)
// Zero external audio assets; safe no-op in headless/SSR/Node environments.

export type SfxKind =
  | 'tool'
  | 'hit'
  | 'harvest'
  | 'coin'
  | 'menu'
  | 'select'
  | 'fish_bite'
  | 'fish_catch'
  | 'fanfare'
  | 'emote';

export const SFX_KEY = 'hrvstmn-sfx';

type NoteStep = { freq: number; dur: number; type: OscillatorType; gain: number; delay?: number };

export const SFX_PATTERNS: Record<SfxKind, readonly NoteStep[]> = {
  tool: [{ freq: 220, dur: 0.055, type: 'triangle', gain: 0.07 }],
  hit: [
    { freq: 150, dur: 0.05, type: 'square', gain: 0.06 },
    { freq: 110, dur: 0.05, type: 'triangle', gain: 0.05, delay: 0.03 },
  ],
  harvest: [
    { freq: 523.25, dur: 0.06, type: 'sine', gain: 0.07 },
    { freq: 659.25, dur: 0.08, type: 'sine', gain: 0.07, delay: 0.055 },
  ],
  coin: [
    { freq: 880, dur: 0.055, type: 'square', gain: 0.05 },
    { freq: 1174.66, dur: 0.11, type: 'square', gain: 0.05, delay: 0.055 },
  ],
  menu: [{ freq: 440, dur: 0.025, type: 'triangle', gain: 0.04 }],
  select: [{ freq: 587.33, dur: 0.045, type: 'triangle', gain: 0.05 }],
  fish_bite: [
    { freq: 784, dur: 0.05, type: 'square', gain: 0.07 },
    { freq: 1046.5, dur: 0.07, type: 'square', gain: 0.07, delay: 0.06 },
  ],
  fish_catch: [
    { freq: 523.25, dur: 0.07, type: 'triangle', gain: 0.07 },
    { freq: 659.25, dur: 0.07, type: 'triangle', gain: 0.07, delay: 0.07 },
    { freq: 783.99, dur: 0.12, type: 'triangle', gain: 0.07, delay: 0.14 },
  ],
  fanfare: [
    { freq: 523.25, dur: 0.08, type: 'triangle', gain: 0.08 },
    { freq: 659.25, dur: 0.08, type: 'triangle', gain: 0.08, delay: 0.08 },
    { freq: 783.99, dur: 0.08, type: 'triangle', gain: 0.08, delay: 0.16 },
    { freq: 1046.5, dur: 0.18, type: 'triangle', gain: 0.08, delay: 0.24 },
  ],
  emote: [{ freq: 698.46, dur: 0.06, type: 'sine', gain: 0.05 }],
};

let audioCtx: AudioContext | null = null;
let sfxEnabled = true;

export function isSfxEnabled(): boolean {
  return sfxEnabled;
}

export function setSfxEnabled(on: boolean, storage?: Pick<Storage, 'setItem'> | null): void {
  sfxEnabled = on;
  try {
    storage?.setItem(SFX_KEY, on ? 'on' : 'off');
  } catch {
    // storage unavailable
  }
}

export function loadSfxPreference(storage?: Pick<Storage, 'getItem'> | null): boolean {
  try {
    sfxEnabled = storage?.getItem(SFX_KEY) !== 'off';
  } catch {
    sfxEnabled = true;
  }
  return sfxEnabled;
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const TRACKS: readonly { id: string; title: string; notes: readonly NoteStep[] }[] = [
  {
    id: 'spring',
    title: 'Spring Meadow',
    notes: [
      { freq: 523.25, dur: 0.14, type: 'triangle', gain: 0.06, delay: 0 },
      { freq: 659.25, dur: 0.14, type: 'triangle', gain: 0.06, delay: 0.15 },
      { freq: 783.99, dur: 0.16, type: 'triangle', gain: 0.06, delay: 0.3 },
      { freq: 659.25, dur: 0.14, type: 'triangle', gain: 0.05, delay: 0.48 },
      { freq: 880, dur: 0.18, type: 'triangle', gain: 0.06, delay: 0.64 },
      { freq: 783.99, dur: 0.24, type: 'sine', gain: 0.06, delay: 0.84 },
    ],
  },
  {
    id: 'summer',
    title: 'Summer Breeze',
    notes: [
      { freq: 587.33, dur: 0.13, type: 'square', gain: 0.04, delay: 0 },
      { freq: 739.99, dur: 0.13, type: 'square', gain: 0.04, delay: 0.14 },
      { freq: 880, dur: 0.15, type: 'triangle', gain: 0.06, delay: 0.28 },
      { freq: 987.77, dur: 0.16, type: 'triangle', gain: 0.06, delay: 0.45 },
      { freq: 880, dur: 0.14, type: 'triangle', gain: 0.05, delay: 0.63 },
      { freq: 1174.66, dur: 0.26, type: 'sine', gain: 0.06, delay: 0.8 },
    ],
  },
  {
    id: 'fall',
    title: 'Autumn Harvest',
    notes: [
      { freq: 440, dur: 0.16, type: 'triangle', gain: 0.06, delay: 0 },
      { freq: 523.25, dur: 0.16, type: 'triangle', gain: 0.06, delay: 0.17 },
      { freq: 659.25, dur: 0.18, type: 'sine', gain: 0.06, delay: 0.35 },
      { freq: 587.33, dur: 0.16, type: 'triangle', gain: 0.05, delay: 0.55 },
      { freq: 493.88, dur: 0.16, type: 'triangle', gain: 0.05, delay: 0.72 },
      { freq: 440, dur: 0.28, type: 'sine', gain: 0.06, delay: 0.9 },
    ],
  },
  {
    id: 'winter',
    title: 'Winter Hearth',
    notes: [
      { freq: 659.25, dur: 0.18, type: 'sine', gain: 0.06, delay: 0 },
      { freq: 587.33, dur: 0.18, type: 'sine', gain: 0.06, delay: 0.2 },
      { freq: 523.25, dur: 0.2, type: 'sine', gain: 0.06, delay: 0.4 },
      { freq: 493.88, dur: 0.18, type: 'sine', gain: 0.05, delay: 0.62 },
      { freq: 523.25, dur: 0.28, type: 'triangle', gain: 0.05, delay: 0.82 },
    ],
  },
  {
    id: 'town',
    title: 'Brackenford Town',
    notes: [
      { freq: 392, dur: 0.12, type: 'triangle', gain: 0.06, delay: 0 },
      { freq: 493.88, dur: 0.12, type: 'triangle', gain: 0.06, delay: 0.13 },
      { freq: 587.33, dur: 0.14, type: 'triangle', gain: 0.06, delay: 0.26 },
      { freq: 783.99, dur: 0.16, type: 'triangle', gain: 0.06, delay: 0.41 },
      { freq: 659.25, dur: 0.14, type: 'triangle', gain: 0.05, delay: 0.58 },
      { freq: 783.99, dur: 0.24, type: 'sine', gain: 0.06, delay: 0.74 },
    ],
  },
  {
    id: 'goddess',
    title: 'Wellkeeper Pond',
    notes: [
      { freq: 523.25, dur: 0.15, type: 'sine', gain: 0.06, delay: 0 },
      { freq: 659.25, dur: 0.15, type: 'sine', gain: 0.06, delay: 0.16 },
      { freq: 783.99, dur: 0.15, type: 'sine', gain: 0.06, delay: 0.32 },
      { freq: 1046.5, dur: 0.2, type: 'sine', gain: 0.06, delay: 0.48 },
      { freq: 987.77, dur: 0.16, type: 'sine', gain: 0.05, delay: 0.7 },
      { freq: 1046.5, dur: 0.3, type: 'sine', gain: 0.06, delay: 0.88 },
    ],
  },
];

function playSteps(steps: readonly NoteStep[]): boolean {
  if (!sfxEnabled) return false;
  const ctx = getContext();
  if (!ctx) return false;
  const base = ctx.currentTime;
  for (const step of steps) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = step.type;
      osc.frequency.setValueAtTime(step.freq, base + (step.delay ?? 0));
      gain.gain.setValueAtTime(step.gain, base + (step.delay ?? 0));
      gain.gain.exponentialRampToValueAtTime(0.0001, base + (step.delay ?? 0) + step.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(base + (step.delay ?? 0));
      osc.stop(base + (step.delay ?? 0) + step.dur + 0.01);
    } catch {
      return false;
    }
  }
  return true;
}

/** Play a brief synthesized sound cue if audio is enabled and available in the browser. */
export function playSfx(kind: SfxKind): boolean {
  const steps = SFX_PATTERNS[kind];
  return steps ? playSteps(steps) : false;
}

/** Play a short chiptune melody for the Record Player if audio is enabled. */
export function playMelody(trackId: string): boolean {
  const track = TRACKS.find((t) => t.id === trackId);
  return track ? playSteps(track.notes) : false;
}
