// Pure inventory categorization, sorting, layout, and navigation helpers for GLADE's Rucksack.
import { isCompact, wrapLine } from './compact';

export type InvCategory = 'all' | 'seed' | 'crop' | 'forage' | 'fish' | 'ranch' | 'food' | 'goods';
export type InvSort = 'category' | 'value' | 'qty' | 'name';

export const INV_TABS: readonly {
  id: InvCategory;
  label: string;
  short: string;
  color: string;
  order: number;
}[] = [
  { id: 'all', label: 'All', short: 'All', color: '07', order: 0 },
  { id: 'seed', label: 'Seeds', short: 'Seed', color: '0B', order: 1 },
  { id: 'crop', label: 'Crops', short: 'Crop', color: '0B', order: 2 },
  { id: 'forage', label: 'Forage', short: 'Wild', color: '0B', order: 3 },
  { id: 'fish', label: 'Fish', short: 'Fish', color: '0C', order: 4 },
  { id: 'ranch', label: 'Ranch', short: 'Rnch', color: '09', order: 5 },
  { id: 'food', label: 'Kitchen', short: 'Food', color: '0A', order: 6 },
  { id: 'goods', label: 'Goods', short: 'Gear', color: '04', order: 7 },
];

const TAB_META = Object.fromEntries(INV_TABS.map((t) => [t.id, t])) as Record<InvCategory, (typeof INV_TABS)[number]>;

export const INV_SORT_ORDER: readonly InvSort[] = ['category', 'value', 'qty', 'name'];
export const INV_SORT_LABEL: Record<InvSort, string> = {
  category: 'Cat',
  value: 'Value',
  qty: 'Qty',
  name: 'A-Z',
};

export const INV_BADGE: Record<string, [string, string]> = {
  crop: ['❀', '0B'],
  seed: ['∴', '0B'],
  forage: ['☘', '0B'],
  fish: ['≈', '0C'],
  animal: ['●', '09'],
  ore: ['◆', '0C'],
  material: ['▪', '04'],
  special: ['✧', '0E'],
  food: ['✦', '09'],
  tool: ['▣', '09'],
  utensil: ['⚒', '04'],
  dish: ['✦', '0A'],
  ingredient: ['◈', '09'],
  relic: ['★', '09'],
  trash: ['×', '03'],
};

export interface InvItemEntry {
  name: string;
  qty: number;
  rawCat: string;
  tabCat: Exclude<InvCategory, 'all'>;
  glyph: string;
  glyphCol: string;
  sell: number;
  stamina: number;
  held: boolean;
  isPreserve: boolean;
  /** Compact right-hand metric text in the list row (e.g. "60G" or "12/30"). */
  tagText: string;
}

export interface InvTabSummary {
  id: InvCategory;
  label: string;
  short: string;
  color: string;
  count: number;
  totalQty: number;
}

export type InvDisplayRow =
  | { kind: 'header'; cat: Exclude<InvCategory, 'all'>; label: string; color: string; count: number }
  | { kind: 'item'; entry: InvItemEntry; itemIndex: number };

export function classifyInventoryItem(name: string, rawCat: string): Exclude<InvCategory, 'all'> {
  if (rawCat === 'seed' || name === 'Orchard Sapling') return 'seed';
  if (rawCat === 'crop') return 'crop';
  if (rawCat === 'forage') return 'forage';
  if (rawCat === 'fish') return 'fish';
  if (rawCat === 'animal') return 'ranch';
  if (rawCat === 'dish' || rawCat === 'food' || rawCat === 'ingredient') return 'food';
  return 'goods';
}

export function nextSortMode(cur: InvSort): InvSort {
  const idx = INV_SORT_ORDER.indexOf(cur);
  return INV_SORT_ORDER[(idx + 1) % INV_SORT_ORDER.length];
}

export function buildInventoryEntries(
  inv: Record<string, number>,
  held: string | null,
  basketTotal: number,
  basketCap: number,
  getDef: (name: string) => [number, number, string] | undefined,
  isPreserve: (name: string) => boolean = () => false,
): InvItemEntry[] {
  const out: InvItemEntry[] = [];
  for (const [name, qty] of Object.entries(inv)) {
    if (!qty || qty <= 0) continue;
    const def = getDef(name);
    const sell = def?.[0] ?? 0;
    const stamina = def?.[1] ?? 0;
    const rawCat = def?.[2] ?? 'special';
    const tabCat = classifyInventoryItem(name, rawCat);
    const [glyph, glyphCol] = name === 'Basket' ? ['▣', '09'] : INV_BADGE[rawCat] || ['·', '05'];
    const tagText = name === 'Basket' ? `${basketTotal}/${basketCap}` : sell > 0 ? `${sell}G` : '';
    out.push({
      name,
      qty,
      rawCat,
      tabCat,
      glyph,
      glyphCol,
      sell,
      stamina,
      held: held === name,
      isPreserve: isPreserve(name),
      tagText,
    });
  }
  return out;
}

export function buildInventoryTabs(entries: InvItemEntry[]): InvTabSummary[] {
  const counts = new Map<InvCategory, { count: number; totalQty: number }>();
  for (const t of INV_TABS) counts.set(t.id, { count: 0, totalQty: 0 });
  for (const e of entries) {
    const all = counts.get('all')!;
    all.count += 1;
    all.totalQty += e.qty;
    const cat = counts.get(e.tabCat)!;
    cat.count += 1;
    cat.totalQty += e.qty;
  }
  const tabs: InvTabSummary[] = [];
  for (const meta of INV_TABS) {
    const stat = counts.get(meta.id)!;
    if (meta.id === 'all' || stat.count > 0) {
      tabs.push({
        id: meta.id,
        label: meta.label,
        short: meta.short,
        color: meta.color,
        count: stat.count,
        totalQty: stat.totalQty,
      });
    }
  }
  return tabs;
}

export function sortAndFilterInventory(
  entries: InvItemEntry[],
  tab: InvCategory,
  sortMode: InvSort,
): InvItemEntry[] {
  const filtered = tab === 'all' ? [...entries] : entries.filter((e) => e.tabCat === tab);
  filtered.sort((a, b) => {
    if (sortMode === 'category') {
      const diff = TAB_META[a.tabCat].order - TAB_META[b.tabCat].order;
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    }
    if (sortMode === 'value') {
      return b.sell - a.sell || b.qty - a.qty || a.name.localeCompare(b.name);
    }
    if (sortMode === 'qty') {
      return b.qty - a.qty || b.sell - a.sell || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
  return filtered;
}

export function buildDisplayRows(
  filtered: InvItemEntry[],
  tab: InvCategory,
  sortMode: InvSort,
  showHeaders: boolean,
): InvDisplayRow[] {
  if (!filtered.length) return [];
  const distinctCats = new Set(filtered.map((e) => e.tabCat));
  const useHeaders = showHeaders && tab === 'all' && sortMode === 'category' && distinctCats.size >= 2;
  if (!useHeaders) {
    return filtered.map((entry, idx) => ({ kind: 'item', entry, itemIndex: idx }));
  }
  const catCounts = new Map<Exclude<InvCategory, 'all'>, number>();
  for (const e of filtered) catCounts.set(e.tabCat, (catCounts.get(e.tabCat) || 0) + 1);

  const rows: InvDisplayRow[] = [];
  let prevCat: Exclude<InvCategory, 'all'> | null = null;
  filtered.forEach((entry, idx) => {
    if (entry.tabCat !== prevCat) {
      prevCat = entry.tabCat;
      const meta = TAB_META[entry.tabCat];
      rows.push({
        kind: 'header',
        cat: entry.tabCat,
        label: meta.label.toUpperCase(),
        color: meta.color,
        count: catCounts.get(entry.tabCat) || 0,
      });
    }
    rows.push({ kind: 'item', entry, itemIndex: idx });
  });
  return rows;
}

export function findItemRowIndex(rows: InvDisplayRow[], itemName: string | null): number {
  if (itemName) {
    const exact = rows.findIndex((r) => r.kind === 'item' && r.entry.name === itemName);
    if (exact >= 0) return exact;
  }
  return rows.findIndex((r) => r.kind === 'item');
}

export function stepItemRow(rows: InvDisplayRow[], curRowIdx: number, delta: 1 | -1): number {
  const n = rows.length;
  if (n === 0) return -1;
  const start = curRowIdx >= 0 && curRowIdx < n ? curRowIdx : delta > 0 ? -1 : 0;
  for (let step = 1; step <= n; step++) {
    const idx = (((start + delta * step) % n) + n) % n;
    if (rows[idx].kind === 'item') return idx;
  }
  return -1;
}

export function pageItemRow(rows: InvDisplayRow[], curRowIdx: number, pageSize: number, dir: 1 | -1): number {
  const itemIndices: number[] = [];
  rows.forEach((r, i) => {
    if (r.kind === 'item') itemIndices.push(i);
  });
  if (!itemIndices.length) return -1;
  const pos = itemIndices.indexOf(curRowIdx);
  if (pos < 0) return itemIndices[0];
  const jump = Math.max(1, pageSize - 2);
  const nextPos = Math.max(0, Math.min(itemIndices.length - 1, pos + dir * jump));
  return itemIndices[nextPos];
}

export interface InvViewport {
  top: number;
  visRows: InvDisplayRow[];
  hasUp: boolean;
  hasDown: boolean;
  thumbTop: number;
  thumbHeight: number;
}

export function computeListViewport(rows: InvDisplayRow[], curRowIdx: number, listH: number): InvViewport {
  const total = rows.length;
  const h = Math.max(1, listH);
  if (total <= h) {
    return { top: 0, visRows: rows, hasUp: false, hasDown: false, thumbTop: 0, thumbHeight: h };
  }
  const safeCur = Math.max(0, Math.min(total - 1, curRowIdx));
  let top = Math.max(0, Math.min(total - h, safeCur - Math.floor(h / 2)));
  // Keep a section header just above its first item in view when near the top of that section.
  if (top > 0 && rows[top]?.kind === 'item' && rows[top - 1]?.kind === 'header' && safeCur - (top - 1) < h) {
    top -= 1;
  }
  const visRows = rows.slice(top, top + h);
  const thumbHeight = Math.max(1, Math.round((h * h) / total));
  const maxTop = Math.max(1, total - h);
  const thumbTop = Math.min(h - thumbHeight, Math.round((top / maxTop) * (h - thumbHeight)));
  return {
    top,
    visRows,
    hasUp: top > 0,
    hasDown: top + h < total,
    thumbTop,
    thumbHeight,
  };
}

export interface TabChipLayout {
  id: InvCategory;
  text: string;
  active: boolean;
  color: string;
  x: number;
  w: number;
}

export interface TabStripLayout {
  chips: TabChipLayout[];
  leftArrow: boolean;
  rightArrow: boolean;
}

export function fitTabStrip(
  tabs: InvTabSummary[],
  activeTab: InvCategory,
  maxW: number,
  compactLabels = false,
): TabStripLayout {
  if (!tabs.length || maxW < 8) return { chips: [], leftArrow: false, rightArrow: false };
  const activeIdx = Math.max(0, tabs.findIndex((t) => t.id === activeTab));
  const chipText = (t: InvTabSummary, active: boolean) => {
    const lbl = compactLabels ? t.short : t.label;
    return active ? `▸${lbl} ${t.count}` : `${lbl}·${t.count}`;
  };

  let start = 0;
  let end = tabs.length;
  const totalWidth = (s: number, e: number) => {
    let w = 0;
    for (let i = s; i < e; i++) {
      w += chipText(tabs[i], i === activeIdx).length + (i > s ? 1 : 0);
    }
    if (s > 0) w += 2;
    if (e < tabs.length) w += 2;
    return w;
  };

  if (totalWidth(start, end) > maxW) {
    start = activeIdx;
    end = activeIdx + 1;
    while (true) {
      let expanded = false;
      if (start > 0 && totalWidth(start - 1, end) <= maxW) {
        start--;
        expanded = true;
      }
      if (end < tabs.length && totalWidth(start, end + 1) <= maxW) {
        end++;
        expanded = true;
      }
      if (!expanded) break;
    }
  }

  const leftArrow = start > 0;
  const rightArrow = end < tabs.length;
  let cx = leftArrow ? 2 : 0;
  const chips: TabChipLayout[] = [];
  for (let i = start; i < end; i++) {
    const t = tabs[i];
    const active = i === activeIdx;
    let text = chipText(t, active);
    const limit = maxW - (rightArrow ? 2 : 0) - cx;
    if (text.length > limit && limit >= 4) {
      text = text.slice(0, limit - 1) + '…';
    }
    if (text.length <= limit) {
      chips.push({ id: t.id, text, active, color: t.color, x: cx, w: text.length });
      cx += text.length + 1;
    }
  }
  return { chips, leftArrow, rightArrow };
}

export interface InventoryLayout {
  bx: number;
  by: number;
  bw: number;
  bh: number;
  split: boolean;
  /** Width inside border on each side (bw - 2). */
  innerW: number;
  tabRowY: number;
  topFenceY: number;
  listX: number;
  listY: number;
  listW: number;
  listH: number;
  splitX: number;
  detailX: number;
  detailY: number;
  detailW: number;
  detailH: number;
  bottomFenceY: number;
  footerY: number;
}

export function computeInventoryLayout(
  scrW: number,
  scrH: number,
  divX: number,
  divY: number,
): InventoryLayout {
  const compact = isCompact(scrW);
  const regionW = !compact && divX < scrW ? divX : scrW;
  const regionH = divY < scrH ? divY : scrH;
  const split = regionW >= 64;

  const bw = split
    ? Math.min(regionW - 2, 74)
    : Math.min(regionW - 2, Math.max(44, regionW - 2));

  const maxH = Math.min(scrH - 2, Math.max(16, regionH - 1));
  const bh = split
    ? Math.max(18, Math.min(27, maxH))
    : Math.max(16, Math.min(24, maxH));

  const bx = Math.max(0, Math.floor((regionW - bw) / 2));
  const by = Math.max(1, Math.min(scrH - bh - 1, Math.floor((regionH - bh) / 2)));

  const tabRowY = by + 1;
  const topFenceY = by + 2;
  const bottomFenceY = by + bh - 3;
  const footerY = by + bh - 2;

  if (split) {
    const innerW = bw - 2;
    const listPaneW = Math.floor((innerW - 1) * 0.54);
    const splitX = bx + 1 + listPaneW;
    const detailX = splitX + 2;
    const detailW = bx + bw - 2 - detailX;
    const listY = topFenceY + 1;
    const listH = Math.max(6, bottomFenceY - listY);
    return {
      bx,
      by,
      bw,
      bh,
      split: true,
      innerW,
      tabRowY,
      topFenceY,
      listX: bx + 2,
      listY,
      listW: listPaneW - 2,
      listH,
      splitX,
      detailX,
      detailY: listY,
      detailW,
      detailH: listH,
      bottomFenceY,
      footerY,
    };
  }

  const innerW = bw - 2;
  const detailH = 4;
  const listY = topFenceY + 1;
  const detailFenceY = bottomFenceY - detailH - 1;
  const listH = Math.max(5, detailFenceY - listY);
  return {
    bx,
    by,
    bw,
    bh,
    split: false,
    innerW,
    tabRowY,
    topFenceY,
    listX: bx + 2,
    listY,
    listW: bw - 4,
    listH,
    splitX: -1,
    detailX: bx + 2,
    detailY: detailFenceY + 1,
    detailW: bw - 4,
    detailH,
    bottomFenceY,
    footerY,
  };
}

export function formatListItemRow(
  entry: InvItemEntry,
  rowW: number,
): { nameStr: string; qtyStr: string; tagStr: string; heldMark: string } {
  const heldMark = entry.held ? '*' : ' ';
  const qtyStr = entry.name === 'Basket' ? '' : `×${entry.qty}`;
  const tagStr = entry.tagText;
  const rightLen = (qtyStr ? qtyStr.length : 0) + (qtyStr && tagStr ? 1 : 0) + (tagStr ? tagStr.length : 0);
  // prefix: cursor(2) + icon(2) + name + heldMark(1) + gap(1) + right
  const maxNameW = Math.max(6, rowW - 4 - 2 - rightLen);
  const nameStr = entry.name.length > maxNameW ? entry.name.slice(0, maxNameW - 1) + '…' : entry.name;
  return { nameStr, qtyStr, tagStr, heldMark };
}

export function wrapNoteLines(notes: string[], width: number): string[] {
  const out: string[] = [];
  for (const n of notes) {
    if (!n) continue;
    out.push(...wrapLine(n, Math.max(12, width)));
  }
  return out;
}
