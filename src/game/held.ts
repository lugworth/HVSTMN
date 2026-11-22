// Held direction keys for the keyboard and the D-pad: one walking rhythm for every input.
//
// The browser's own key repeat runs at whatever rate the operating system is set to, and
// every repeat used to queue a step, so a held arrow walked at a different speed on every
// machine and kept going after the key came up. Here the game owns the rhythm instead:
//
// - A quick tap of a direction the player is not facing only turns them (so a tool or a
//   talk can be aimed without stepping onto the tile). A tap of the facing direction steps.
// - Held past REPEAT_DELAY_MS, the direction walks at one step per REPEAT_MS, and only once
//   the previous step has been taken (nothing piles up, so the player stops on release).
// - The newest held direction wins; letting it go falls back to one still held.
// - In menus and dialogs a direction moves the selection right away and repeats the same
//   way, and a hold that began on the map pauses if a dialog opens (and the reverse), so a
//   held key never skips through pages.
import { REPEAT_DELAY_MS, REPEAT_MS, type Dir } from './viewport';

export const DIR_VECTORS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** The key name the engine turns the player with, without stepping. */
export const turnKey = (dir: Dir): string => `turn-${dir}`;

/** What the hold needs to know about the game at that moment. */
export type HeldContext = {
  /** A menu, dialog or the title screen has the keys. */
  modal: boolean;
  /** Earlier keys have all been handled. */
  idle: boolean;
  /** The player's facing vector. */
  face: [number, number];
};

type Hold = { name: string; key: string; dir: Dir; modal: boolean; next: number };

export class HeldDirections {
  private holds: Hold[] = [];

  constructor(
    private readonly delayMs = REPEAT_DELAY_MS,
    private readonly everyMs = REPEAT_MS,
  ) {}

  /** True while any direction is held. */
  get active(): boolean {
    return this.holds.length > 0;
  }

  /**
   * A direction went down: `name` tells this hold apart (a keyboard key, a D-pad arm), `dir` is
   * where it points and `key` the key the engine knows it by (the name, unless given).
   * Returns the key to send now: the direction itself, or a turn when the player faces elsewhere.
   */
  press(name: string, dir: Dir, now: number, ctx: HeldContext, key: string = name): string {
    this.holds = this.holds.filter((h) => h.name !== name);
    this.holds.push({ name, key, dir, modal: ctx.modal, next: now + this.delayMs });
    if (ctx.modal) return key;
    const [fx, fy] = DIR_VECTORS[dir];
    return ctx.face[0] === fx && ctx.face[1] === fy ? key : turnKey(dir);
  }

  /** A direction came up. The one held before it, if any, carries on from the next tick. */
  release(name: string, now: number): void {
    const top = this.holds[this.holds.length - 1];
    this.holds = this.holds.filter((h) => h.name !== name);
    const next = this.holds[this.holds.length - 1];
    if (next && top?.name === name) next.next = Math.min(next.next, now);
  }

  /** Every key came up at once (the window lost focus, or the pad was let go). */
  releaseAll(): void {
    this.holds = [];
  }

  /** Called often while a direction is held: the key to send now, or null. */
  tick(now: number, ctx: HeldContext): string | null {
    const h = this.holds[this.holds.length - 1];
    if (!h || now < h.next || !ctx.idle || ctx.modal !== h.modal) return null;
    // keep to the beat rather than counting from whenever this tick landed; after a long wait
    // (a slow step, a busy engine) start over from now instead of rushing to catch up
    h.next = Math.max(h.next + this.everyMs, now);
    return h.key;
  }
}
