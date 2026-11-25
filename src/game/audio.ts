// Procedural Web Audio chiptune synthesizer & looping seasonal soundtrack for GLADE
// Zero external audio assets; safe no-op in headless/SSR/Node environments.

export type SfxKind =
  | 'tool'
  | 'till'
  | 'water'
  | 'hit'
  | 'harvest'
  | 'coin'
  | 'menu'
  | 'select'
  | 'fish_bite'
  | 'fish_catch'
  | 'geode_crack'
  | 'pitfall'
  | 'rank_up'
  | 'fanfare'
  | 'emote';

export type MusicScene = 'spring' | 'summer' | 'fall' | 'winter' | 'town' | 'mine' | 'indoor';

export const SFX_KEY = 'hrvstmn-sfx';
export const MUSIC_KEY = 'hrvstmn-music';

type NoteStep = { freq: number; dur: number; type: OscillatorType; gain: number; delay?: number };

export const SFX_PATTERNS: Record<SfxKind, readonly NoteStep[]> = {
  tool: [{ freq: 220, dur: 0.055, type: 'triangle', gain: 0.07 }],
  till: [
    { freq: 185, dur: 0.045, type: 'triangle', gain: 0.07 },
    { freq: 130, dur: 0.05, type: 'sine', gain: 0.05, delay: 0.03 },
  ],
  water: [
    { freq: 440, dur: 0.04, type: 'sine', gain: 0.05 },
    { freq: 587.33, dur: 0.06, type: 'sine', gain: 0.05, delay: 0.035 },
  ],
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
  geode_crack: [
    { freq: 210, dur: 0.04, type: 'square', gain: 0.06 },
    { freq: 659.25, dur: 0.06, type: 'triangle', gain: 0.06, delay: 0.05 },
    { freq: 987.77, dur: 0.12, type: 'sine', gain: 0.07, delay: 0.11 },
  ],
  pitfall: [
    { freq: 392, dur: 0.07, type: 'triangle', gain: 0.06 },
    { freq: 293.66, dur: 0.08, type: 'triangle', gain: 0.06, delay: 0.06 },
    { freq: 196, dur: 0.12, type: 'sine', gain: 0.06, delay: 0.13 },
  ],
  rank_up: [
    { freq: 523.25, dur: 0.09, type: 'triangle', gain: 0.07 },
    { freq: 659.25, dur: 0.09, type: 'triangle', gain: 0.07, delay: 0.09 },
    { freq: 783.99, dur: 0.09, type: 'triangle', gain: 0.07, delay: 0.18 },
    { freq: 1046.5, dur: 0.14, type: 'sine', gain: 0.08, delay: 0.27 },
    { freq: 1318.5, dur: 0.24, type: 'sine', gain: 0.08, delay: 0.41 },
  ],
  fanfare: [
    { freq: 523.25, dur: 0.08, type: 'triangle', gain: 0.08 },
    { freq: 659.25, dur: 0.08, type: 'triangle', gain: 0.08, delay: 0.08 },
    { freq: 783.99, dur: 0.08, type: 'triangle', gain: 0.08, delay: 0.16 },
    { freq: 1046.5, dur: 0.18, type: 'triangle', gain: 0.08, delay: 0.24 },
  ],
  emote: [{ freq: 698.46, dur: 0.06, type: 'sine', gain: 0.05 }],
};

// Rising pentatonic harvest combo frequencies (C5 -> C6)
const HARVEST_SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5] as const;

let audioCtx: AudioContext | null = null;
let sfxEnabled = true;
let musicEnabled = true;

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

export function isMusicEnabled(): boolean {
  return musicEnabled;
}

export function setMusicEnabled(on: boolean, storage?: Pick<Storage, 'setItem'> | null): void {
  musicEnabled = on;
  try {
    storage?.setItem(MUSIC_KEY, on ? 'on' : 'off');
  } catch {
    // storage unavailable
  }
  if (!on) stopAmbientAudio();
}

export function loadMusicPreference(storage?: Pick<Storage, 'getItem'> | null): boolean {
  try {
    musicEnabled = storage?.getItem(MUSIC_KEY) !== 'off';
  } catch {
    musicEnabled = true;
  }
  return musicEnabled;
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

// Gentle looping seasonal background motifs (melody + warm bass frequencies, 0 = rest)
export const AMBIENT_MOTIFS: Record<MusicScene, { tempoMs: number; wave: OscillatorType; melody: readonly number[]; bass: readonly number[] }> = {
  spring: {
    tempoMs: 420,
    wave: 'triangle',
    melody: [523.25, 0, 659.25, 783.99, 659.25, 0, 587.33, 523.25, 440, 0, 523.25, 659.25, 587.33, 0, 0, 0],
    bass: [261.63, 0, 0, 0, 196.0, 0, 0, 0, 220.0, 0, 0, 0, 196.0, 0, 0, 0],
  },
  summer: {
    tempoMs: 360,
    wave: 'triangle',
    melody: [587.33, 739.99, 880, 0, 739.99, 880, 987.77, 0, 880, 739.99, 659.25, 587.33, 659.25, 0, 0, 0],
    bass: [293.66, 0, 220, 0, 293.66, 0, 246.94, 0, 220, 0, 196, 0, 220, 0, 0, 0],
  },
  fall: {
    tempoMs: 460,
    wave: 'sine',
    melody: [440, 0, 523.25, 659.25, 587.33, 523.25, 493.88, 0, 440, 392, 440, 523.25, 440, 0, 0, 0],
    bass: [220, 0, 0, 0, 174.61, 0, 0, 0, 196, 0, 0, 0, 220, 0, 0, 0],
  },
  winter: {
    tempoMs: 520,
    wave: 'sine',
    melody: [659.25, 0, 587.33, 0, 523.25, 0, 493.88, 0, 523.25, 0, 659.25, 0, 587.33, 0, 0, 0],
    bass: [261.63, 0, 0, 0, 220, 0, 0, 0, 174.61, 0, 0, 0, 196, 0, 0, 0],
  },
  town: {
    tempoMs: 390,
    wave: 'triangle',
    melody: [392, 493.88, 587.33, 0, 659.25, 587.33, 493.88, 0, 523.25, 587.33, 659.25, 783.99, 587.33, 0, 0, 0],
    bass: [196, 0, 293.66, 0, 246.94, 0, 196, 0, 261.63, 0, 220, 0, 196, 0, 0, 0],
  },
  mine: {
    tempoMs: 560,
    wave: 'sine',
    melody: [293.66, 0, 0, 349.23, 0, 329.63, 0, 0, 261.63, 0, 0, 293.66, 0, 0, 0, 0],
    bass: [146.83, 0, 0, 0, 130.81, 0, 0, 0, 110, 0, 0, 0, 146.83, 0, 0, 0],
  },
  indoor: {
    tempoMs: 480,
    wave: 'sine',
    melody: [392, 0, 493.88, 523.25, 0, 493.88, 440, 0, 392, 0, 440, 493.88, 392, 0, 0, 0],
    bass: [196, 0, 0, 0, 164.81, 0, 0, 0, 174.61, 0, 0, 0, 196, 0, 0, 0],
  },
};

export function musicSceneFor(mapname: string, season: number, indoor: boolean): MusicScene {
  if (mapname === 'mine') return 'mine';
  if (indoor) return 'indoor';
  if (mapname === 'town') return 'town';
  return (['spring', 'summer', 'fall', 'winter'][season] as MusicScene) || 'spring';
}

let musicTimer: ReturnType<typeof setInterval> | null = null;
let currentScene: MusicScene | null = null;
let stepIdx = 0;

function playMusicNote(freq: number, dur: number, type: OscillatorType, gainAmt: number): void {
  const ctx = audioCtx;
  if (!ctx || ctx.state !== 'running') return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(gainAmt, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch {
    // ignore transient audio errors
  }
}

/** Keep gentle procedural background music aligned with the active map and season. */
export function syncAmbientAudio(scene: MusicScene): void {
  if (typeof window === 'undefined' || !musicEnabled) {
    stopAmbientAudio();
    return;
  }
  if (currentScene === scene && musicTimer !== null) return;
  stopAmbientAudio();
  currentScene = scene;
  stepIdx = 0;
  const motif = AMBIENT_MOTIFS[scene];
  musicTimer = setInterval(() => {
    if (!musicEnabled || !audioCtx || audioCtx.state !== 'running') return;
    const m = motif.melody[stepIdx % motif.melody.length];
    const b = motif.bass[stepIdx % motif.bass.length];
    const durSec = (motif.tempoMs / 1000) * 0.85;
    if (m > 0) playMusicNote(m, durSec, motif.wave, 0.018);
    if (b > 0) playMusicNote(b, durSec * 1.4, 'sine', 0.014);
    stepIdx = (stepIdx + 1) % motif.melody.length;
  }, motif.tempoMs);
}

export function stopAmbientAudio(): void {
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  currentScene = null;
}

/** Resume Web Audio context on first user gesture so ambient music starts cleanly. */
export function unlockAudio(): void {
  void getContext();
}

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

/** Play a rising pentatonic harvest chime based on consecutive harvest streak (0..5+). */
export function playHarvestChime(streak: number): boolean {
  const idx = Math.max(0, Math.min(HARVEST_SCALE.length - 1, streak));
  const f1 = HARVEST_SCALE[idx];
  const f2 = HARVEST_SCALE[Math.min(HARVEST_SCALE.length - 1, idx + 1)] * (idx === HARVEST_SCALE.length - 1 ? 1.25 : 1);
  return playSteps([
    { freq: f1, dur: 0.055, type: 'sine', gain: 0.065 },
    { freq: f2, dur: 0.085, type: 'triangle', gain: 0.065, delay: 0.045 },
  ]);
}

/** Play a short chiptune melody for the Record Player if audio is enabled. */
export function playMelody(trackId: string): boolean {
  const track = TRACKS.find((t) => t.id === trackId);
  return track ? playSteps(track.notes) : false;
}
