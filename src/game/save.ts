import { SAVE_KEY, SEASONS, WEEKDAYS, fmt_time } from './constants';

export type SaveSlot = 'auto' | 1 | 2;

export const AUTOSAVE_KEY = 'hrvstmn-autosave';
export const SAVE_VERSION = 2;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveSummary {
  slot: SaveSlot;
  key: string;
  farmer: string;
  farm: string;
  year: number;
  season: number;
  seasonName: string;
  day: number;
  weekdayName: string;
  minutes: number;
  timeStr: string;
  gold: number;
  itemKinds: number;
  itemTotal: number;
  cropCount: number;
  tilledCount: number;
  wetCount: number;
  mapname: string;
  savedAt: number | null;
}

export interface WriteSaveResult {
  ok: boolean;
  error?: string;
}

export function slotStorageKey(slot: SaveSlot): string {
  if (slot === 'auto') return AUTOSAVE_KEY;
  return slot === 2 ? `${SAVE_KEY}-2` : SAVE_KEY;
}

export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      return localStorage;
    }
  } catch {
    // Storage access blocked (e.g. sandboxed iframe or privacy mode)
  }
  return null;
}

function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Set);
}

export function cloneSaveValue<T>(v: T): T {
  if (v === null || v === undefined || typeof v !== 'object') {
    return v;
  }
  if (v instanceof Set) {
    return Array.from(v).map((item) => cloneSaveValue(item)) as unknown as T;
  }
  if (Array.isArray(v)) {
    return v.map((item) => cloneSaveValue(item)) as unknown as T;
  }
  const out: Record<string, any> = {};
  for (const [k, val] of Object.entries(v as Record<string, any>)) {
    if (val !== undefined) {
      out[k] = cloneSaveValue(val);
    }
  }
  return out as T;
}

export function isValidSavePayload(raw: unknown): raw is Record<string, any> {
  if (!isPlainObject(raw)) return false;
  if (typeof raw.name !== 'string' || !raw.name.trim()) return false;
  if (raw.tilled !== undefined && !Array.isArray(raw.tilled)) return false;
  if (raw.wet !== undefined && !Array.isArray(raw.wet)) return false;
  if (raw.inv !== undefined && !isPlainObject(raw.inv)) return false;
  if (raw.crops !== undefined && !isPlainObject(raw.crops)) return false;
  if (raw.year !== undefined && (!Number.isFinite(Number(raw.year)) || Number(raw.year) < 1)) return false;
  if (raw.season !== undefined && (!Number.isFinite(Number(raw.season)) || Number(raw.season) < 0 || Number(raw.season) > 3)) {
    return false;
  }
  if (raw.day !== undefined && (!Number.isFinite(Number(raw.day)) || Number(raw.day) < 1 || Number(raw.day) > 30)) {
    return false;
  }
  return true;
}

export function parseSaveJson(jsonStr: string | null | undefined): Record<string, any> | null {
  if (!jsonStr || typeof jsonStr !== 'string') return null;
  try {
    const parsed = JSON.parse(jsonStr);
    return isValidSavePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readSaveSlot(storage: StorageLike | null, slot: SaveSlot): Record<string, any> | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(slotStorageKey(slot));
    return parseSaveJson(raw);
  } catch {
    return null;
  }
}

export function writeSaveSlot(
  storage: StorageLike | null,
  slot: SaveSlot,
  data: Record<string, any>,
): WriteSaveResult {
  if (!storage) {
    return { ok: false, error: 'Browser localStorage is unavailable.' };
  }
  try {
    storage.setItem(slotStorageKey(slot), JSON.stringify(data));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to write save to localStorage.' };
  }
}

export function deleteSaveSlot(storage: StorageLike | null, slot: SaveSlot): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(slotStorageKey(slot));
    return true;
  } catch {
    return false;
  }
}

export function sanitizeStringRecordNumber(raw: unknown, allowZero = false): Record<string, number> {
  if (!isPlainObject(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = Number(v);
    if (Number.isFinite(n) && (allowZero ? n >= 0 : n > 0)) {
      out[k] = Math.floor(n);
    }
  }
  return out;
}

export function sanitizeCrops(raw: unknown): Record<string, [string, number]> {
  if (!isPlainObject(raw)) return {};
  const out: Record<string, [string, number]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v) && typeof v[0] === 'string' && Number.isFinite(Number(v[1]))) {
      out[k] = [v[0], Math.max(0, Math.floor(Number(v[1])))];
    }
  }
  return out;
}

export function sanitizeMapStringRecords(raw: unknown): Record<string, Record<string, string>> {
  if (!isPlainObject(raw)) return {};
  const out: Record<string, Record<string, string>> = {};
  for (const [mapKey, entries] of Object.entries(raw)) {
    if (!isPlainObject(entries)) continue;
    const clean: Record<string, string> = {};
    for (const [coord, val] of Object.entries(entries)) {
      if (typeof val === 'string') {
        clean[coord] = val;
      }
    }
    out[mapKey] = clean;
  }
  return out;
}

export function summarizeSave(slot: SaveSlot, d: Record<string, any>): SaveSummary {
  const year = Math.max(1, Math.floor(Number(d.year) || 1));
  const seasonIdx = Math.min(3, Math.max(0, Math.floor(Number(d.season) || 0)));
  const day = Math.min(30, Math.max(1, Math.floor(Number(d.day) || 1)));
  const absday = (year - 1) * 120 + seasonIdx * 30 + day - 1;
  const weekdayName = WEEKDAYS[absday % 7] || WEEKDAYS[0];
  const seasonName = SEASONS[seasonIdx] || SEASONS[0];
  const minutes = Number.isFinite(Number(d.minutes)) ? Math.max(0, Math.floor(Number(d.minutes))) : 360;
  const inv = sanitizeStringRecordNumber(d.inv);
  const itemKinds = Object.keys(inv).length;
  const itemTotal = Object.values(inv).reduce((sum, q) => sum + q, 0);
  const crops = sanitizeCrops(d.crops);
  const cropCount = Object.keys(crops).length;
  const tilledCount = Array.isArray(d.tilled) ? d.tilled.length : 0;
  const wetCount = Array.isArray(d.wet) ? d.wet.length : 0;
  const gold = Number.isFinite(Number(d.gold)) ? Math.max(0, Math.floor(Number(d.gold))) : 0;
  const savedAt = Number.isFinite(Number(d.savedAt)) ? Number(d.savedAt) : null;

  return {
    slot,
    key: slotStorageKey(slot),
    farmer: String(d.name || 'Pete'),
    farm: String(d.farm || 'Moon'),
    year,
    season: seasonIdx,
    seasonName,
    day,
    weekdayName,
    minutes,
    timeStr: fmt_time(minutes),
    gold,
    itemKinds,
    itemTotal,
    cropCount,
    tilledCount,
    wetCount,
    mapname: typeof d.mapname === 'string' ? d.mapname : 'house',
    savedAt,
  };
}

export function listSaveSlots(storage: StorageLike | null): {
  auto: SaveSummary | null;
  slot1: SaveSummary | null;
  slot2: SaveSummary | null;
} {
  const readSummary = (slot: SaveSlot): SaveSummary | null => {
    const data = readSaveSlot(storage, slot);
    return data ? summarizeSave(slot, data) : null;
  };
  return {
    auto: readSummary('auto'),
    slot1: readSummary(1),
    slot2: readSummary(2),
  };
}

export function formatSaveLine(s: SaveSummary): string {
  return `${s.farmer} · ${s.farm} Farm · ${s.seasonName} ${s.day} (${s.weekdayName}), Yr ${s.year} · ${s.timeStr}`;
}

export function formatSaveStatsLine(s: SaveSummary): string {
  return `${s.gold}G · Bag: ${s.itemKinds} kind${s.itemKinds === 1 ? '' : 's'} (${s.itemTotal}) · Crops: ${s.cropCount} · Tilled: ${s.tilledCount}`;
}

export function formatSlotBadge(s: SaveSummary | null): string {
  if (!s) return 'Empty';
  return `${s.seasonName.slice(0, 2)} ${s.day} · ${s.gold}G`;
}
