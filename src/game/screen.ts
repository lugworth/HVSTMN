// Terminal screen buffer and async input handling for FURROW
import { COMPACT_MIN_COLS, MIN_ROWS } from './compact';

export type Cell = [char: string, fg: string, bg: string, bold: boolean];

/** A larger HUD heading, still drawn with the bundled monospace font. */
export type HudLabel = { text: string; scale: number; w: number; h: number };

/** Visual style used by the canvas renderer. 'classic' is kept for tests and development. */
export type VisualStyle = 'enhanced' | 'classic';

/** World colour treatment in the enhanced renderer: Contour Mono (default), Seasonal Duotone, or Full Isotope. */
export type PaletteMode = 'mono' | 'duotone' | 'isotope';

/** Optional presentation metadata for dialogs and broadcast modals. */
export type BoxStyle = {
  kind?: 'hud' | 'npc' | 'tv' | 'fest' | 'system';
  /** Isotope colour code ('08'..'0F' or '07') used to tint the header accent rule. */
  accent?: string;
  /** Fill interior with the darker wood signboard tone (used for active Valley Map cards). */
  fillBoard?: boolean;
};

/**
 * Semantic info about a screen cell, written by the engine so the enhanced
 * renderer can style terrain by what it *is* rather than guessing from glyphs.
 * Any plain `put()` over a cell clears its tag, so dialogs and menus drawn on
 * top of the map are always rendered as UI.
 */
export type CellTag = {
  /** Base tile name ('grass', 'roof', 'wall', 'mfloor', ...) or 'ui'. */
  t: string;
  /** Finer kind: 'obj:weed', 'crop:ripe', 'soil:wet', 'deco', 'box:tl', 'bar', ... */
  k?: string;
  /** Crop variety for growing/ripe field crops ('Turnip', 'Tomato', 'Corn', ...). */
  cropName?: string;
  /** Deco glyph/colour for roofs, signs and windows. */
  dch?: string;
  dfg?: string;
  /** World coordinates (map cells only). */
  wx?: number;
  wy?: number;
  /** Tool-target highlight. */
  hl?: boolean;
  /** Secondary cells covered by an upgraded tool's area of effect. */
  hlArea?: boolean;
  /** A seed-bag aim would put this cell in a companion pairing (task 17). */
  companion?: boolean;
  /** Tilled soil dressed with compost (task 18). */
  compost?: boolean;
  /** A distinctive fish habitat on this water cell (task 38). */
  fishPocket?: string;
  /** A farm-works fixture (lamp, orchard tree, barrel...): drawn as a plain full-size glyph. */
  fixture?: { ch: string; fg: string };
  /** Placement preview for an equipped placeable farm piece (task 41). */
  piecePreview?: { ch: string; fg: string };
  /** Outdoor villager winter cloak/scarf accent (feature G11). */
  winterCoat?: boolean;
  /** Soil under the greenhouse glass. */
  greenhouse?: boolean;
  /** The crab pot's float off the beach pier (task 39). */
  trap?: 'up' | 'set' | 'ready';
  /** Faced cell has a meaningful context action (interaction or WATER/DIG/CRACK/CAST). */
  actionTarget?: boolean;
  /** For zoomed tiles: which sub-cell of the tile this is, and the tile width in cells. */
  sub?: number;
  zw?: number;
  /** Entity standing on this cell: 'player', 'npc', 'animal', 'pet'. */
  ent?: string;
  /** Facing vector for directional entity tokens (e.g. player). */
  face?: [number, number];
  /** True when the player is mounted on horseback. */
  riding?: boolean;
  /** A heading anchored in this UI cell; its reserved rectangle contains no other text. */
  label?: HudLabel;
  /** Thin bottom-edge progress rule (e.g. Tool XP bar in the right-side HUD). */
  subBar?: { frac: number; pos: number; len: number; col: string; track: string };
};

export type FxKind = 'dust' | 'sparkle' | 'splash' | 'coin' | 'swing' | 'flash' | 'debris' | 'text' | 'emote';

export type EmoteKind = 'heart' | 'note' | 'alert' | 'cross' | 'sleep';

/** Optional detail for an effect: swing direction, tool tier colour, floating text, debris material, or emote bubble. */
export type FxExtra = {
  dir?: [number, number];
  tier?: number;
  text?: string;
  stuff?: 'stone' | 'wood' | 'plant';
  emote?: EmoteKind;
  delay?: number;
  seed?: number;
};

export type RenderFx = FxExtra & {
  kind: FxKind;
  x: number;
  y: number;
  age: number;
  life: number;
};

export type HudIcon = { x: number; y: number; icon: 'stamina' | 'fatigue' | 'gold' | 'bin' | 'tool' | 'weather' | 'season' | 'note' };

/** Per-frame scene context for the renderer (null on title/menus). */
export type RenderCtx = {
  mapName: string;
  indoor: boolean;
  /** Minutes since midnight. */
  minutes: number;
  /** 0 Spring, 1 Summer, 2 Fall, 3 Winter. */
  season: number;
  /** Day of the season (1..30) for late-season palette interpolation. */
  day?: number;
  weather: string;
  /** 0 = dry ground, 1 = fresh rain. Persists and fades after the rain stops. */
  wetness?: number;
  /** Colourblind-safe state glyphs (ripe !, wet ≈). */
  cues?: boolean;
  /** World colour treatment ('mono' default, 'duotone', or 'isotope'). */
  palette?: PaletteMode;
  /** Equipped tool upgrade tier (0..6) for AoE reticle tinting. */
  toolTier?: number;
  /** Screen cells per map tile horizontally. Always 1 now that large tiles are gone. */
  zoom: number;
  /** OS-level or user-chosen reduced motion. Freezes ambient animation. */
  reducedMotion?: boolean;
  /** Screen rectangle occupied by the map viewport. */
  view: { x: number; y: number; w: number; h: number };
  /** Column of the vertical divider and row of the horizontal divider. */
  divX: number;
  divY: number;
  icons: HudIcon[];
  /** Transient action-feedback glyphs, in screen cells. */
  fx?: RenderFx[];
  /** A heavy hit shakes the view: seconds since the hit and its strength (1 light, 2 heavy). */
  shake?: { age: number; strength: number };
  /**
   * The player's last step (engine.step_fx), for the slide and wall-bump animation: `at` is the
   * player's screen cell, (dx, dy) where the token starts (a slide) or leans (a bump), `born`
   * in performance-clock seconds.
   */
  step?: { kind: 'slide' | 'bump'; at: [number, number]; dx: number; dy: number; born: number };
  /** Radial lantern-iris map transition wipe when warping between maps. */
  wipe?: { age: number; duration: number; focus?: [number, number] };
};

/**
 * The one blank cell every cleared position shares. Cells are replaced (`put` writes a new tuple),
 * never mutated in place, so sharing is safe; it is frozen to keep it that way.
 */
export const BLANK_CELL: Cell = Object.freeze([' ', '05', '00', false]) as unknown as Cell;

export class Screen {
  w: number = 80;
  h: number = 24;
  buf: Cell[][] = [];
  tags: (CellTag | null)[][] = [];
  ctx: RenderCtx | null = null;
  /** Special full-screen scenes the renderer can dress up (currently 'title'). */
  scene: string | null = null;
  /** Rectangles of boxes (dialogs, menus) drawn this frame, top-most last. */
  boxes: { x: number; y: number; w: number; h: number; born?: number; kind?: BoxStyle['kind']; accent?: string; fillBoard?: boolean }[] = [];
  /** When each panel first appeared, so menus can ease in once. */
  private boxAges = new Map<string, number>();
  style: VisualStyle = 'enhanced';
  paletteMode: PaletteMode = 'mono';
  reducedMotion: boolean = false;
  /**
   * High-res detail: half-size texture glyphs and vector micro-detail (contoured roofs, cliffs,
   * walls, soil rows). Off by default, since the plain glyph look is cheaper to draw; a setting in
   * the F10 menu and the Diary turns it on, and the choice is remembered on this device.
   */
  hires: boolean = false;
  /** Colourblind-safe state cues: ripe/ wet/ ready markers in addition to colour. */
  accessibleCues: boolean = false;
  /** Optional CRT scanline and phosphor bloom pass over the canvas. */
  crt: boolean = false;
  /** High-contrast readability boost (still snapped to Isotope Dark, task 56 / G17). */
  highContrast: boolean = false;
  onHiresChange?: (hires: boolean) => void;
  onPaletteChange?: (mode: PaletteMode) => void;
  onCrtChange?: (crt: boolean) => void;
  onHighContrastChange?: (highContrast: boolean) => void;
  keyQueue: string[] = [];
  private keyWaiters: Array<{
    resolve: (key: string | null) => void;
    timer?: ReturnType<typeof setTimeout>;
  }> = [];
  onRender?: () => void;

  constructor(w: number = 80, h: number = 24) {
    this.setSize(w, h);
  }

  setSize(w: number, h: number) {
    // Phones get the compact layout down to COMPACT_MIN_COLS (see compact.ts).
    this.w = Math.max(COMPACT_MIN_COLS, Math.min(160, w));
    this.h = Math.max(MIN_ROWS, Math.min(50, h));
    this.clear();
  }

  clear() {
    if (this.boxAges.size) {
      const live = new Set(this.boxes.map((b) => `${b.x},${b.y},${b.w},${b.h}`));
      for (const key of this.boxAges.keys()) {
        if (!live.has(key)) this.boxAges.delete(key);
      }
    }
    if (this.buf.length === this.h && this.buf[0]?.length === this.w) {
      // same size: reuse the row arrays and the shared blank cell
      for (let y = 0; y < this.h; y++) {
        this.buf[y].fill(BLANK_CELL);
        this.tags[y].fill(null);
      }
    } else {
      this.buf = Array.from({ length: this.h }, () => new Array<Cell>(this.w).fill(BLANK_CELL));
      this.tags = Array.from({ length: this.h }, () => new Array<CellTag | null>(this.w).fill(null));
    }
    this.ctx = null;
    this.scene = null;
    this.boxes = [];
  }

  /** Attach semantic info to a cell (call after `put`). */
  tag(x: number, y: number, tag: CellTag | null) {
    if (y < 0 || y >= this.h || x < 0 || x >= this.w) return;
    this.tags[y][x] = tag;
  }

  /** Choose a renderer programmatically. The UI never exposes a style switch. */
  setStyle(style: VisualStyle) {
    this.style = style;
  }

  setHires(hires: boolean) {
    if (this.hires === hires) return;
    this.hires = hires;
    this.onHiresChange?.(hires);
  }

  setPaletteMode(mode: PaletteMode) {
    if (this.paletteMode === mode) return;
    this.paletteMode = mode;
    this.onPaletteChange?.(mode);
  }

  setCrt(crt: boolean) {
    if (this.crt === crt) return;
    this.crt = crt;
    this.onCrtChange?.(crt);
  }

  setHighContrast(hc: boolean) {
    if (this.highContrast === hc) return;
    this.highContrast = hc;
    this.onHighContrastChange?.(hc);
  }

  put(x: number, y: number, text: string, fg: string = '05', bg: string = '00', bold: boolean = false) {
    if (y < 0 || y >= this.h) return;
    const row = this.buf[y];
    const trow = this.tags[y];
    for (let i = 0; i < text.length; i++) {
      const col = x + i;
      if (col >= 0 && col < this.w) {
        row[col] = [text[i], fg, bg, bold];
        trow[col] = null;
      }
    }
  }

  box(
    x: number,
    y: number,
    w: number,
    h: number,
    fg: string = '03',
    bg: string = '00',
    title: string | null = null,
    tfg: string = '07',
    style?: BoxStyle
  ) {
    for (let j = 0; j < h; j++) {
      this.put(x, y + j, ' '.repeat(w), fg, bg);
    }
    const key = `${x},${y},${w},${h}`;
    let born = this.boxAges.get(key);
    if (born === undefined) {
      born = performance.now() / 1000;
      this.boxAges.set(key, born);
    }
    this.boxes.push({ x, y, w, h, born, kind: style?.kind, accent: style?.accent, fillBoard: style?.fillBoard });
    const edge = '+' + '-'.repeat(Math.max(0, w - 2)) + '+';
    this.put(x, y, edge, fg, bg);
    this.put(x, y + h - 1, edge, fg, bg);
    for (let j = 1; j < h - 1; j++) {
      this.put(x, y + j, '|', fg, bg);
      this.put(x + w - 1, y + j, '|', fg, bg);
    }
    const corner = (cx: number, cy: number, k: string) => this.tag(cx, cy, { t: 'ui', k });
    for (let i = 1; i < w - 1; i++) {
      corner(x + i, y, 'box:h');
      corner(x + i, y + h - 1, 'box:h');
    }
    for (let j = 1; j < h - 1; j++) {
      corner(x, y + j, 'box:v');
      corner(x + w - 1, y + j, 'box:v');
    }
    corner(x, y, 'box:tl');
    corner(x + w - 1, y, 'box:tr');
    corner(x, y + h - 1, 'box:bl');
    corner(x + w - 1, y + h - 1, 'box:br');
    if (title) {
      this.put(x + 2, y, ` ${title} `, tfg, bg, true);
    }
  }

  flush() {
    if (this.onRender) {
      this.onRender();
    }
  }

  pushKey(key: string) {
    if (this.keyWaiters.length > 0) {
      const waiter = this.keyWaiters.shift()!;
      if (waiter.timer) clearTimeout(waiter.timer);
      waiter.resolve(key);
    } else {
      if (this.keyQueue.length < 256) {
        this.keyQueue.push(key);
      }
    }
  }

  async getKey(timeoutSec?: number | null): Promise<string | null> {
    if (this.keyQueue.length > 0) {
      return this.keyQueue.shift()!;
    }
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const waiter: {
        resolve: (key: string | null) => void;
        timer?: ReturnType<typeof setTimeout>;
      } = { resolve };

      if (timeoutSec !== undefined && timeoutSec !== null && timeoutSec >= 0) {
        timer = setTimeout(() => {
          const idx = this.keyWaiters.indexOf(waiter);
          if (idx >= 0) this.keyWaiters.splice(idx, 1);
          resolve(null);
        }, Math.max(1, Math.round(timeoutSec * 1000)));
        waiter.timer = timer;
      }
      this.keyWaiters.push(waiter);
    });
  }
}
