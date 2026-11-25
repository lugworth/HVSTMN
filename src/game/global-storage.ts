// Global storage helpers for GLADE: lets cooking, makers, and carpentry pull
// seamlessly from Pockets (inv), Farmhouse Fridge (fridge_inv), and Cabinet (cabinet_inv).

export type ItemBag = Record<string, number>;

export interface StorageTakeResult {
  ok: boolean;
  fromPockets: number;
  fromFridge: number;
  fromCabinet: number;
}

/** Merge counts from Pockets + optional Fridge + optional Cabinet into a fresh lookup map. */
export function combinedPool(inv: ItemBag, fridge?: ItemBag | null, cabinet?: ItemBag | null): ItemBag {
  const out: ItemBag = {};
  for (const bag of [inv, fridge, cabinet]) {
    if (!bag) continue;
    for (const [k, v] of Object.entries(bag)) {
      if (v > 0) out[k] = (out[k] || 0) + v;
    }
  }
  return out;
}

/** Total quantity of an item available across Pockets, Fridge, and Cabinet. */
export function totalAvailable(item: string, inv: ItemBag, fridge?: ItemBag | null, cabinet?: ItemBag | null): number {
  return (inv[item] || 0) + (fridge?.[item] || 0) + (cabinet?.[item] || 0);
}

/**
 * Consume `qty` of `item`, drawing from Pockets first, then Fridge, then Cabinet.
 * Never mutates any bag if the combined total is insufficient.
 */
export function consumeAcrossStorages(
  item: string,
  qty: number,
  inv: ItemBag,
  fridge?: ItemBag | null,
  cabinet?: ItemBag | null,
): StorageTakeResult {
  if (qty <= 0) return { ok: true, fromPockets: 0, fromFridge: 0, fromCabinet: 0 };
  if (totalAvailable(item, inv, fridge, cabinet) < qty) {
    return { ok: false, fromPockets: 0, fromFridge: 0, fromCabinet: 0 };
  }
  let rem = qty;
  const takeFrom = (bag: ItemBag | null | undefined): number => {
    if (!bag || rem <= 0) return 0;
    const have = bag[item] || 0;
    const use = Math.min(rem, have);
    if (use > 0) {
      bag[item] = have - use;
      if (bag[item] <= 0) delete bag[item];
      rem -= use;
    }
    return use;
  };
  const fromPockets = takeFrom(inv);
  const fromFridge = takeFrom(fridge);
  const fromCabinet = takeFrom(cabinet);
  return { ok: true, fromPockets, fromFridge, fromCabinet };
}

/** True when all required `[item, qty]` entries are satisfied across Pockets + Storage. */
export function canAffordMaterials(
  reqs: readonly [string, number][],
  inv: ItemBag,
  fridge?: ItemBag | null,
  cabinet?: ItemBag | null,
): boolean {
  const pool = combinedPool(inv, fridge, cabinet);
  for (const [item, qty] of reqs) {
    if ((pool[item] || 0) < qty) return false;
  }
  return true;
}

/** Short label summarizing where extra ingredients came from (empty if pockets-only). */
export function storageSourceNote(fromFridge: number, fromCabinet: number): string {
  const parts: string[] = [];
  if (fromFridge > 0) parts.push('Fridge');
  if (fromCabinet > 0) parts.push('Cabinet');
  return parts.length ? ` (pulled from ${parts.join(' & ')})` : '';
}
