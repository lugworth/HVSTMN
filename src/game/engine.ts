// GLADE — a farming tale in ASCII: the complete engine

import { Screen, CellTag, FxExtra, FxKind, BoxStyle, EmoteKind, PaletteMode, type RenderCtx } from './screen';
import { COMPACT_MIN_COLS, MIN_ROWS, isCompact, fitMessages, fitText, reflowPages, wrapLine, wrapLines } from './compact';
import { fencePost, SEASON_GLYPHS } from './chrome';
import {
  GameMap,
  build_valley,
  open_shortcut,
  SHORTCUT_IDS,
  HEDGE_GATE,
  COTTAGE_DOOR,
  applyTownCottagePlot,
  build_house,
  build_interior,
  build_house_upgraded,
  build_mine,
  edgeEntrances,
  footbridge_cells,
} from './map';
import {
  SECS_PER_10MIN,
  DAY_PACES,
  PACE_KEY,
  SAVE_KEY,
  SEASONS,
  WEEKDAYS,
  SEASON_COL,
  WEATHER_COL,
  CROPS,
  FORAGE,
  FORAGE_GLYPH,
  ITEMS,
  BARN_CAP,
  ANIMALS,
  WOOL_DAYS,
  COW_NAMES,
  SHEEP_NAMES,
  TOOLS,
  UPGRADABLE,
  LEVELS,
  LEVEL_COL,
  UPGRADE,
  CAN_CAP,
  OBJ_GLYPH,
  HOURS,
  BUILDINGS,
  NPCS,
  SPOUSE_LINES,
  FESTIVALS,
  BIRTHDAYS,
  FEST_SPOTS,
  TILES,
  INTERIOR_LAYOUTS,
  EXPANSIONS,
  BUILD_DAYS,
  UTENSILS,
  FRUITS,
  RECIPES,
  DIRS,
  OK_KEYS,
  CANCEL_KEYS,
  SPOUSE_POS,
  HOUSE_WAKE,
  LOGO,
  pkey,
  clamp,
  fmt_time,
  fmt_hour,
  BOOKS,
  HELP,
  SPRITES,
  TV_SHOPPING_ITEMS,
  HEART_EVENTS,
  RIVAL_PAIRS,
  REGION_FORAGE,
  REGION_CATCH,
  FISH_POCKETS,
  LOOKOUT_VIEW,
  LOOKOUT_STAMINA,
  LOOKOUT_FATIGUE,
  HOLLOW_LUCK_CHANCE,
  DIG_CAP,
  DIG_MAPS,
  DIG_ORES,
  DIG_RELICS,
  NIGHT_SURPRISE_CHANCE,
  STAR_GEMS,
  LIGHTHOUSE_INTRO,
  LIGHTHOUSE_LOG,
  TIDE_POOL_TEXT,
  INN_SCENES,
  INN_EVENING_DAY,
  STALL_DAY,
  STALL_STOCK_BY,
  STALL_CLOSE,
  STALL_SLOTS,
  STALL_SLOT_MAX,
  STALL_SPOT,
  STALL_CATEGORIES,
  STALL_MARKUP,
  STALL_SIGN,
  COMPANION,
  SEED_SAVING,
  COMPOST_SCRAPS,
  COMPOST_BONUS,
  TRAP_SPOT,
  MUSHROOM_FLUSH,
  FLUSH_COUNT,
  DOG_CLUE_AFF,
  MILESTONE_LINES,
  HIVE_SPOT,
  HIVE_RANGE,
  HONEY_FLAVOURS,
  SEATS,
  SEAT_REST,
  PLOT_RADIUS,
  PLOT_MAX,
  PLOT_SIGN_PRICE,
  PLOT_NAME_MAX,
  EXHIBITS,
  POCKETS,
  POCKET_CHANCE,
  POCKET_MIN_FLOOR,
  POCKET_MINUTES,
  POCKET_STAMINA,
  type PocketKind,
  ORDERS,
  ORDER_DAYS,
  ORDER_GAP,
  MAKER_SPOTS,
  MARKET_SHOPPERS,
  PANTRY_STAPLES,
  PRESERVES,
  PRESERVE_SEASONS,
  MARKET_FLOWERS,
  INN_EVENING_HOURS,
  INN_LISTEN_FRIEND,
  INN_JOIN_FRIEND,
  INN_CARDS_POT,
  GRAY_COPPER_QTY,
  GRAY_COPPER_REWARD,
  GRAY_QUEST_FRIEND,
  VALLEY_GRID,
  VALLEY_SHORT,
  VALLEY_LANDMARKS,
  PUBLIC_WORKS,
  POSTCARD_MAX,
  CONTEST_MAP,
  CONTEST_WEEKDAY,
  CONTEST_HOURS,
  CONTEST_GOAL,
  ROW_MAX,
  ROW_STAMINA_RESERVE,
  ROW_RESERVES,
  ROW_STEP_STAMINA,
  ROW_TOOLS,
  CONTEST_SEASONS,
  FAVORS,
  FAVOR_FRIENDSHIP,
  FAVOR_HOURS,
  FAVOR_GAP,
  FAVOR_WATER_MAX,
  FAVOR_SHOPS,
} from './constants';
import type { ValleyLandmark, DayPace } from './constants';
import { migrateLegacySave } from './legacy_names';
import type { CatchOdds, MakerStep } from './rules';
import {
  HYBRIDS, HYBRID_CROPS, HYBRID_RECROSS_FEE, ORCHARD_SPOTS, SAPLING, SAPLING_PRICE, TREE_DAYS, FRUIT_DAYS, BARREL_SPOT, CHANNEL_CELLS, BARREL_CAP, CHANNEL_COST,
  GLASS_SPOT, GLASS_CELLS, GLASS_SET, GLASS_COST, PIECE_LIMIT, FARM_PIECES, FARM_PIECE_NAMES, FARM_USE_TILES, isFarmPiece, emptyFarmWorks, restoreFarmWorks, fixtureCoverage, sprinklerCoverage,
} from './farm-works';
import type { FarmWorks } from './farm-works';
import {
  CASK_RACK, CASK_CAP, WINE_FRUIT, AGE_TIERS, caskPhase, caskItem, caskNextIn, caskMilestone,
  wineBatch, cheeseBatch, sanitiseCasks,
} from './cask-rack';
import type { Cask } from './cask-rack';
import {
  CoordSet,
  parseCoordKey,
  py_len,
  py_range,
  py_slice,
  py_item,
  py_in,
  py_dict_get,
  py_dict_items,
  py_del,
  py_pop,
  py_rng,
  py_sum,
  py_sorted,
  py_next,
  py_add,
  py_eq,
  enumerate,
  py_iter,
  py_wrap,
  py_mult,
} from './runtime_helpers';
import {
  getMaxStamina,
  getToolArea,
  calculateStaminaSpend,
  getHeartInfo,
  calculateGiftPoints,
  getEggQuality,
  getMilkQuality,
  getWoolQuality,
  makerBatch,
  plantingForecast,
  rollSpringMineDrop,
  rollLakeMineDrop,
  FEY_TOOL_FLOORS,
  GODDESS_JEWEL_FLOORS,
  KAPPA_JEWEL_FLOORS,
  checkSecretCropUnlock,
  WON_EXCLUSIVE_CROPS,
  BASKET_CAPACITY,
  getBasketTotal,
  rollRegionCatch,
  regionCatchOdds,
  valleyCatchOdds,
  rollCatch,
  rollStoneSkips,
  innSceneFor,
  stallVisit,
  marketWants,
  marketVisit,
  type StallGood,
  type MarketWants,
  innCardsWin,
  canUpgradeAdvice,
  nextRegions,
  compassWord,
  shopStatus,
  absdayLabel,
  worksNeeds,
  worksSummary,
} from './rules';
import {
  type InvCategory,
  type InvSort,
  type InvItemEntry,
  INV_SORT_LABEL,
  INV_TABS,
  nextSortMode,
  buildInventoryEntries,
  buildInventoryTabs,
  sortAndFilterInventory,
  buildDisplayRows,
  findItemRowIndex,
  stepItemRow,
  pageItemRow,
  computeListViewport,
  fitTabStrip,
  computeInventoryLayout,
  formatListItemRow,
  wrapNoteLines,
} from './inventory-ui';
import {
  SAVE_VERSION,
  type SaveSlot,
  type SaveSummary,
  cloneSaveValue,
  deleteSaveSlot,
  formatSaveLine,
  formatSaveStatsLine,
  formatSlotBadge,
  getBrowserStorage,
  isValidSavePayload,
  listSaveSlots,
  readSaveSlot,
  readDawnBackups,
  pushDawnBackup,
  clearDawnBackups,
  summarizeSave,
  sanitizeCrops,
  sanitizeMapStringRecords,
  sanitizeStringRecordNumber,
  writeSaveSlot,
} from './save';
import {
  OUTINGS, outingFor, DINNER_MIN_FRIEND, dinnerPairLines, dinnerDishReaction,
  CHILD_INTEREST_LABELS, emptyChildState, sanitizeChildState, classifyChildItem, childShowLine,
  topChildInterests, childMilestoneScene, type ChildState,
  TEA_HOURS, TEA_INGREDIENTS, matchTeaDrink, teaRegularFor,
  rollSpouseRoutine, sanitizeSpouseRoutine, type SpouseRoutine,
  STAMP_MARKS, STAMP_INKS, composeStampPrint, sanitizeStampPrint, type StampPrint,
  reactiveNpcLine,
} from './social';
import {
  GUEST_VENDOR_SPOT, GUEST_VENDORS, activeGuestVendor,
  festivalVariant, festivalRoleOutcome,
  PANTRY_SPOT, PANTRY_GOAL, PANTRY_RECIPE, PANTRY_CATEGORIES, emptyPantryState, sanitizePantryState, type PantryState,
  TRAIL_ENCOUNTERS, rollTrailEncounter, sanitizeTrailEncounter, type ActiveTrailEncounter,
  generateWeeklyContracts, sanitizeContracts, type ShippingContract,
} from './town-life';
import {
  PERSONALITY_NOTES, pickPersonality, coatInfo, breedCoat, ensureAnimalRecord, animalYardSpot,
  PASTURE_GRAZE_COST, emptyPastureState, sanitizePastureState, pastureMorning, type PastureState,
  PERCH_SPOT, SHADE_TREE_SPOT, PERCH_COST, SHADE_TREE_COST, emptyEnrichmentState, sanitizeEnrichmentState, type EnrichmentState,
  CAT_SPOT, CAT_UNLOCK_DOG_AFF, emptyPetExtras, sanitizePetExtras, rollPetGift, type PetExtrasState, type AnimalPersonality,
} from './ranch';
import {
  MASTERY_PERKS, perksForDiscipline, sanitizeMasteryPerks,
  ELEVATOR_STAMINA_FEE, mineElevatorFloors,
  FOOD_BUFF_MINUTES, STARTER_RECIPES, foodBuffForDish, sanitizeFoodBuff, matchExperimentalRecipe, type FoodBuff,
  LUCK_LABELS, rollDailyLuck, sanitizeLuck, type LuckLevel,
  defaultAssist, readAssistSettings, writeAssistSettings, type AssistSettings,
} from './progression';
import {
  FORTNIGHT_GOALS,
  FORTNIGHT_KEEPSAKE,
  achNewly,
  fortnightNewly,
  newFortnight,
  payoutLine,
  sanitizeAchSeen,
  sanitizeFortnight,
  type FortnightCtx,
  type FortnightState,
  type Payout,
} from './goals';
import {
  TEXT_SCALES, readTextScale, writeTextScale, readHighContrast, writeHighContrast,
  KEY_ACTION_SPECS, readKeyBindings, writeKeyBindings, keyLabelFor, mapSymbolLegend,
  type TextScale, type KeyBindings,
} from './accessibility';
import {
  playSfx, playHarvestChime, isSfxEnabled, setSfxEnabled, loadSfxPreference,
  isMusicEnabled, setMusicEnabled, loadMusicPreference, musicSceneFor, syncAmbientAudio,
  playMelody, TRACKS,
} from './audio';
import { combinedPool, totalAvailable, consumeAcrossStorages, storageSourceNote } from './global-storage';
import { createFishingState, stepFishingState, renderFishingBar, rollFishingTreasure } from './fishing-game';
import { mineBiomeFor, rollPitfallDrop, rollMineGeodeDrop, rollGeodeLoot, GEODE_KINDS, CRACK_GEODE_FEE, type GeodeKind } from './mining-depth';
import { computeTownRank, beeHouseYield, mushroomLogYield, type TownRankStatus } from './town-rank';

type HudSpan = { text: string; fg?: string; bold?: boolean };
type HudPageLine =
  | { kind: 'fence' }
  | { kind: 'spans'; spans: HudSpan[]; plainText?: string }
  | {
      kind: 'ledger';
      prefix?: string;
      prefixCol?: string;
      label: string;
      labelCol?: string;
      labelBold?: boolean;
      value: string;
      valueCol?: string;
    };
type HudMenuEntry = {
  label: string;
  icon?: string;
  iconCol?: string;
  right?: string;
  rightCol?: string;
  hotkey?: string;
};
type HudMenuCfg = {
  style?: BoxStyle;
  alignToMap?: boolean;
  banner?: () => { left: string; leftCol?: string; right?: string; rightCol?: string };
  entries?: HudMenuEntry[];
  footerHint?: string;
  /** Turn off the 1-9 shortcuts, for prompts where a stray number must not pick an answer. */
  noDigits?: boolean;
};

const ITEM_BADGE: Record<string, [string, string]> = {
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

/** Task 12: the Willow Bend footbridge project. done_day is the absday it opens (set once everything is in). */
/** A valley postcard (task 46): the map view as text plus colour codes, and where and when. */
export interface Postcard {
  map: string;
  place: string;
  day: number;
  minutes: number;
  weather: string;
  rows: string[];
  /** Per row, two hex digits (an Isotope base16 code) for each cell. */
  fg: string[];
}

/** Keep only well-formed postcards (at most POSTCARD_MAX, the newest), clipped to a sane size. */
export function sanitizePostcards(raw: unknown): Postcard[] {
  if (!Array.isArray(raw)) return [];
  const out: Postcard[] = [];
  for (const p of raw as any[]) {
    if (!p || typeof p !== 'object' || typeof p.place !== 'string' || !Number.isInteger(p.day) || !Number.isFinite(p.minutes)) continue;
    if (!Array.isArray(p.rows) || !p.rows.length || p.rows.length > 80 || !p.rows.every((r: unknown) => typeof r === 'string' && r.length <= 200)) continue;
    const fg = Array.isArray(p.fg) ? p.fg.map((f: unknown) => (typeof f === 'string' && /^([0-9A-F]{2})*$/.test(f) ? f : '')) : [];
    out.push({
      map: typeof p.map === 'string' ? p.map : '',
      place: p.place.slice(0, 40),
      day: p.day,
      minutes: p.minutes,
      weather: typeof p.weather === 'string' ? p.weather.slice(0, 20) : '',
      rows: p.rows,
      fg: p.rows.map((_: string, i: number) => fg[i] ?? ''),
    });
  }
  return out.slice(-POSTCARD_MAX);
}

export interface PublicWorks {
  delivered: Record<string, number>;
  crop: string | null;
  done_day: number | null;
  built: boolean;
}

/** A fresh (or copied, filled-in) public works state; older saves have none. */
export function worksState(d: Partial<PublicWorks> | null | undefined = null): PublicWorks {
  return { delivered: { ...(d?.delivered || {}) }, crop: d?.crop ?? null, done_day: d?.done_day ?? null, built: !!d?.built };
}

/** An order from a save, or null if its template is gone or the data is broken. */
function sanitizeOrder(raw: any): VillagerOrder | null {
  const t = raw && ORDERS.find((o) => o.id === raw.id);
  if (!t || !Number.isFinite(raw.deadline)) return null;
  const delivered = t.pieces.map((p, i) => clamp(Math.floor(Number(raw.delivered?.[i]) || 0), 0, p.qty));
  return { id: t.id, delivered, deadline: raw.deadline };
}

/** How many shared memories Villager Notes keeps (the oldest go first). */
export const MEMORY_MAX = 40;

/** Memories from a save: well-formed entries for known villagers, at most MEMORY_MAX. */
function sanitizeMemories(raw: unknown): { day: number; npc: string; text: string; key?: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && Number.isInteger(m.day) && typeof m.npc === 'string' && NPCS[m.npc] && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({ day: m.day, npc: m.npc, text: String(m.text).slice(0, 120), ...(typeof m.key === 'string' ? { key: m.key } : {}) }))
    .slice(-MEMORY_MAX);
}

/** Keep only well-formed batches for installed Makers (a save may be old, edited or cut short). */
function sanitizeMakerJobs(raw: unknown, makers: string[]): Record<string, { steps: MakerStep[]; ready: number }> {
  const out: Record<string, { steps: MakerStep[]; ready: number }> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [name, job] of Object.entries(raw as Record<string, any>)) {
    if (!makers.includes(name) || !job || !Array.isArray(job.steps) || !Number.isFinite(job.ready)) continue;
    const steps = job.steps.filter(
      (st: any) => st && typeof st.input === 'string' && typeof st.output === 'string' && ITEMS[st.output] && Number.isInteger(st.qty) && st.qty > 0,
    );
    if (steps.length) out[name] = { steps: steps.map((st: any) => ({ input: st.input, output: st.output, qty: st.qty })), ready: job.ready };
  }
  return out;
}

/** [input noun, output noun, message colour] per Maker. */
const MAKER_NOUNS: Record<string, [string, string, string]> = {
  'Mayonnaise Maker': ['eggs', 'mayonnaise', '0A'],
  'Cheese Maker': ['milk', 'cheese', '09'],
  'Yarn Maker': ['wool', 'yarn', '0E'],
};

/** 'Potato', 'Potato and Egg', 'Potato, Egg and Corn'. */
/** True when a record has at least one key (cheaper than Object.keys on the per-cell path). */
function anyKey(o: object): boolean {
  for (const _ in o) return true;
  return false;
}

function andList(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** 'a' or 'an' for a following word. */
function aOrAn(word: string): string {
  return /^[AEIOU]/i.test(word) ? 'an' : 'a';
}

/** Total items and sell value added by a Maker batch. */
function makerGain(steps: { input: string; output: string; qty: number }[]): [number, number] {
  let n = 0;
  let gain = 0;
  for (const st of steps) {
    n += st.qty;
    gain += ((ITEMS[st.output]?.[0] || 0) - (ITEMS[st.input]?.[0] || 0)) * st.qty;
  }
  return [n, gain];
}

/** Thrown out of an open menu or dialog once the page has let go of the engine, so its loop ends. */
class EngineStopped extends Error {}

/** After a cast, how long a still-held cast key is ignored, and the longest gap between its repeats. */
const FISH_CAST_GRACE = 0.6;
const FISH_REPEAT_GAP = 0.2;
/** The board only asks for a fish that is at least this likely per catch; scarcer ones are asked for singly. */
const REQUEST_MIN_CATCH = 0.1;
const REQUEST_SCARCE_CATCH = 0.2;
/** Maps where forage grows overnight. */
const FORAGE_MAPS = ['mountain', 'beach', 'woods', 'ridge', 'river', 'point', 'grove'];

export interface VillagerRequest {
  id: number;
  npc: string;
  item: string;
  qty: number;
  reward: number;
  deadline: number;
}

/** A finished-goods order on the board (task 32): which template, what has been handed over, until when. */
export interface VillagerOrder {
  id: string;
  delivered: number[];
  deadline: number;
}

/** A day pinned on the calendar (task 51): an absolute day and what it is for. */
export interface CalendarReminder {
  day: number;
  text: string;
}
/** How many reminders the calendar holds at once. */
export const REMINDER_MAX = 6;

/** Reminders from a save: well-formed, not yet past, at most REMINDER_MAX, in date order. */
function sanitizeReminders(raw: unknown, today: number): CalendarReminder[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && Number.isInteger(r.day) && r.day >= today && typeof r.text === 'string' && r.text.trim())
    .map((r) => ({ day: r.day, text: String(r.text).slice(0, 60) }))
    .sort((a, b) => a.day - b.day)
    .slice(0, REMINDER_MAX);
}

export const MASTERY_DISCIPLINES = ['farming', 'foraging', 'fishing', 'mining', 'ranching'] as const;
export type MasteryDiscipline = (typeof MASTERY_DISCIPLINES)[number];
export const MASTERY_RANKS = [
  { name: 'Novice', xp: 0 },
  { name: 'Adept', xp: 25 },
  { name: 'Expert', xp: 75 },
  { name: 'Master', xp: 175 },
  { name: 'Legend', xp: 350 },
] as const;
export const MASTERY_LABELS: Record<MasteryDiscipline, string> = {
  farming: 'Farming',
  foraging: 'Foraging',
  fishing: 'Fishing',
  mining: 'Mining',
  ranching: 'Ranching',
};
export const MASTERY_REWARD_ITEMS: Record<MasteryDiscipline, string> = {
  farming: 'Turnip Seeds',
  foraging: 'Nightshade',
  fishing: 'Large Fish',
  mining: 'Copper',
  ranching: 'Chicken Feed',
};

/** Every outdoor map, for weather and wetness bookkeeping. */
const OUTDOOR_MAPS = ['farm', 'town', 'mountain', 'beach', 'woods', 'ridge', 'river', 'point', 'grove'];
/** Forage spots spawned per map each day (winter thins the inland ones). */
const FORAGE_TARGET: Record<string, number> = { mountain: 11, beach: 4, woods: 10, ridge: 8, river: 6, point: 4, grove: 8 };

/** Pristine NPC positions, captured at load before any festival rearranges the shared NPCS table. */
const NPC_HOME: Record<string, any> = Object.fromEntries(Object.entries(NPCS).map(([n, d]) => [n, d.where]));

export class Game {
  [key: string]: any;

  scr!: Screen;
  started: boolean = false;
  /** Set by "Save & quit": play stops and the title screen comes back. */
  to_title: boolean = false;
  running: boolean = true;
  autostart: boolean = false;
  msgs: [string, string][] = [];
  maps: Record<string, GameMap> = {};
  last: number = 0;
  acc: number = 0.0;
  npc_acc: number = 0.0;
  passing_out: boolean = false;
  interiors: Record<string, any> = {};
  interior_bid: Record<string, string> = {};
  indoor_npcs: Record<string, any> = {};
  _fest_saved: Record<string, any> | null = null;
  modal_depth: number = 0;
  /** True while text_input() waits for typed text (touch UI shows a keyboard field). */
  typing: boolean = false;
  /**
   * Called the moment a text prompt opens. The key that opens a prompt reaches it through promise
   * steps only, so this still runs inside the player's tap: iOS opens the keyboard only for a
   * focus() made there.
   */
  onTyping: (() => void) | null = null;
  /** Compact (phone) layout only: show the status panel as an overlay ('p'). */
  show_panel: boolean = false;
  /** Set while the game menu is open: the clock, crops and villagers wait. */
  paused: boolean = false;

  name: string = 'Ash';
  farm: string = 'Bramble';
  year: number = 1;
  season: number = 0;
  day: number = 1;
  minutes: number = 360;
  weather: string = 'Sunny';
  tomorrow: string = 'Sunny';
  gold: number = 500;
  stamina: number = 150;
  max_stamina: number = 150;
  fatigue: number = 0;
  power_berries: number = 0;
  berry_sources: string[] = [];
  has_mystic_berry: boolean = false;

  inv: Record<string, number> = {};
  held: string | null = null;
  tool: string = 'Hoe';
  /** A quick seed bag chosen for planting convenience; press S to pin or toggle back to the previous tool. */
  favorite_seed: string | null = null;
  /** The first-morning checklist (task 50): which steps are done, or null once it is finished or hidden. */
  first_steps: { till: boolean; sow: boolean; water: boolean } | null = null;
  fortnight: FortnightState = newFortnight();
  ach_seen: string[] = [];
  ach_unread = false;
  /** The tool active before the current seed-bag shortcut toggled in. */
  previous_tool: string | null = null;
  /** A row being worked (task 54), set by the first C press and not saved: the tiles still ahead, each walked onto in turn. */
  row: { map: string; tool: string; dir: [number, number]; tiles: [number, number][]; stopReason?: string } | null = null;
  row_reserve: number = ROW_STAMINA_RESERVE;
  levels: Record<string, number> = {};
  tool_exp: Record<string, number> = {};
  confessed_day = -1;
  cursed_uses: Record<string, number> = {};
  cursed_days: Record<string, number> = {};
  cursed_blesses: Record<string, number> = {};
  water: number = 30;
  upgrading: [string, number] | null = null;

  tilled: CoordSet = new CoordSet();
  wet: CoordSet = new CoordSet();
  crops: Record<string, [string, number]> = {};
  objs: Record<string, Record<string, string>> = { farm: {}, mine: {} };
  hp: Record<string, number> = {};
  forage: Record<string, Record<string, string>> = { mountain: {}, beach: {} };
  bin: Record<string, number> = {};
  basket: Record<string, number> = {};
  shipped_counts: Record<string, number> = {};
  zack_paid_today: boolean = false;

  chickens: number = 0;
  chicken_aff: number = 20;
  chicken_fest_won: boolean = false;
  outdoor_hours: number = 0;
  animals_grazing: boolean = false;
  incubator_days: number = 0;
  fed: number = 0;
  eggs: number = 0;

  dog_aff: number = 20;
  dog_frisbee_dist: number = 15;
  horse_aff: number = 20;
  horse_grown: boolean = true;
  riding_horse: boolean = false;
  medals: number = 50;

  friend: Record<string, number> = {};
  sprite_aff: Record<string, number> = {};
  sprite_jobs: Record<string, { task: string; days: number; skill: number }> = {};
  heart_events_seen: string[] = [];
  rival_events_seen: string[] = [];
  talked: Set<string> = new Set();
  gifted: Set<string> = new Set();

  married: string | null = null;
  marriage_day: number = -1;
  child_name: string | null = null;
  child_days: number = 0;

  shipped_total: number = 0;
  steps: number = 0;
  fish_caught: Record<string, number> = {};
  goddess_gifts: number = 0;
  kappa_gifts: number = 0;
  goddess_jewels: number = 0;
  kappa_jewels: number = 0;
  truth_jewels: number = 0;
  honey_picked: boolean = false;
  vase_flower: string | null = null;
  fireplace_lit: boolean = false;
  tv_watched_saturday: string | null = null;
  tv_order: [string, number] | null = null;
  fridge_inv: Record<string, number> = {};
  cabinet_inv: Record<string, number> = {};
  makers: string[] = [];
  /** A batch inside each walk-up Maker: what went in (grade by grade) and the absolute minute it is done. */
  maker_jobs: Record<string, { steps: MakerStep[]; ready: number }> = {};
  museum: string[] = [];
  museum_rewards: number[] = [];
  requests: VillagerRequest[] = [];
  order: VillagerOrder | null = null;
  reminders: CalendarReminder[] = [];
  /** Scraps on the compost heap, and the farm tiles dressed with compost (task 18). */
  compost_scraps: number = 0;
  composted: string[] = [];
  private compost_arr: string[] | null = null;
  private compost_len = -1;
  private compost_set = new Set<string>();
  /** The crab pot off the pier (task 39): the day it was set and its bait, or null while it is up. */
  trap: { day: number; bait: string | null } | null = null;
  /** The absolute day of the last mushroom flush in Cedar Hollow, and where it came up (task 35). */
  flush_day: number = -1;
  /** The absolute day the aurora last lit the sky (Fall only, one per day). */
  aurora_day: number = -1;
  flush_spots: string[] = [];
  /** This morning's scent from the dog (task 29): what it points at, and where. */
  dog_clue: { day: number; map: string; key: string; kind: 'dig' | 'mushroom' } | null = null;
  /** Milestone remarks already made, as 'who:what' keys (task 03). */
  milestones_said: string[] = [];
  /** Shared memories for Villager Notes (task 07): newest last; `key` keeps one-off moments from repeating. */
  memories: { day: number; npc: string; text: string; key?: string }[] = [];
  /** Keepsakes on the farmhouse mantel (task 45): what it is, the day, and a one-line memory. */
  souvenirs: { key: string; name: string; day: number; text: string }[] = [];
  /** The field notebook (task 37): where, in what weather and when each kind of fish was first caught. */
  notebook: { item: string; map: string; weather: string; minutes: number; day: number }[] = [];
  /** Seats rested at today (task 44): seat id → absolute day. */
  seats_rested: Record<string, number> = {};
  /** The postcard album (task 46): a text capture of the map view with where and when it was taken. */
  postcards: Postcard[] = [];
  /** True while a postcard is being captured: the map is drawn without overlays. */
  capturing: boolean = false;
  /** Tonight's Evening Catch (task 14): the day, fish landed and the best one; null when none is under way. */
  contest: { day: number; fish: number; best: string | null } | null = null;
  /** A favor a neighbor promised (task 05): who, and the absolute day it happens. */
  favor: { npc: string; day: number } | null = null;
  /** When each neighbor last offered a favor (absolute day), so offers stay occasional. */
  favor_offered: Record<string, number> = {};
  /** Named farm plots (task 42): where each sign stands, its name, and the tile it replaced. */
  plots: { key: string; name: string; tile: string }[] = [];
  /** Museum exhibits the curator has set out (task 16). */
  exhibits_done: string[] = [];
  /** This floor's sealed side chamber, if it has one (mechanics task 40). Opening it buries the way down. */
  pocket: { x: number; y: number; kind: PocketKind; opened: boolean } | null = null;
  /** Rock patterns the player has broken into before, so the next one reads as a clue. */
  pockets_read: PocketKind[] = [];
  /** Absolute day the board may post its next order. */
  order_next: number = 0;
  order_last: string | null = null;
  next_request_id: number = 1;
  requests_done: number = 0;
  mastery_xp: Record<string, number> = {};
  mastery_claimed: string[] = [];

  prayed: boolean = false;
  fest_wins: string[] = [];
  fest_attended: boolean = false;
  fest_declined: boolean = false;
  npc_pos: Record<string, [number, number]> = {};
  fx: (FxExtra & { kind: FxKind; map: string; x: number; y: number; born: number; life: number })[] = [];
  shake_fx: { born: number; strength: number } | null = null;
  /**
   * The player's last step for the renderer: 'slide' eases the token in from where it was
   * (dx, dy cells back), 'bump' nudges it toward a wall it walked into. `born` is in
   * performance-clock seconds, the same clock the renderer animates with.
   */
  step_fx: { kind: 'slide' | 'bump'; dx: number; dy: number; born: number; from?: [number, number] } | null = null;
  /** Where the player was drawn last frame, in screen cells, and on which map. */
  player_screen: { map: string; x: number; y: number } | null = null;
  warp_fx: { born: number; duration: number } | null = null;
  wetness: Record<string, number> = {};
  mine_type: 'spring' | 'lake' = 'spring';
  mine_floor: number = 0;
  max_spring_floor: number = 0;
  max_lake_floor: number = 0;
  ladder: [number, number] | null = null;
  mapname: string = 'house';
  show_minimap: boolean = false;
  px: number = 1;
  py: number = 2;
  face: [number, number] = [0, -1];
  /** Eased camera top-left, in map cells. Null means snap on the next frame. */
  cam_x: number | null = null;
  cam_y: number | null = null;
  /** The map the camera position belongs to. */
  cam_map: string | null = null;
  animals: any[] = [];
  house_flags: string[] = [];
  project: [string, number] | null = null;
  bathed: boolean = false;
  /** Outer-region landmarks. The *_day fields hold an absday(), so they lapse on their own overnight. */
  lookout_day: number = -1;
  hollow_luck_day: number = -1;
  skip_best: number = 0;
  lighthouse_log: number = 0;
  lighthouse_day: number = -1;
  /** Friday evenings at Gideon's Inn: scene ids seen so far, and the absday you last attended. */
  inn_scenes_seen: string[] = [];
  inn_evening_day: number = -1;
  /** Saturday stall (task 09): today's goods, takings and callers while it is open, else null. */
  stall: { day: number; goods: StallGood[]; gold: number; log: string[]; seen: string[]; callers?: string[] } | null = null;
  /** The last market day you traded on, and what you took. */
  stall_last: [number, number] = [-1, 0];
  stall_earned: number = 0;

  /** Rowan's two-chapter request: 0 not asked, 1 copper wanted, 2 note left, 3 finished. */
  gray_quest: number = 0;
  /** The watering-can level Rowan's note points at (chapter two ends when the can reaches it). */
  gray_note_level: number = 0;
  /** Task 33: the Valley Map landmark you pinned (a VALLEY_LANDMARKS id), or null. */
  map_pin: string | null = null;
  /** Task 12: the Willow Bend footbridge (materials delivered, chosen crop, finish day, built). */
  public_works: PublicWorks = worksState();
  farm_works: FarmWorks = emptyFarmWorks();
  /** One barrel per placed Cask Rack, keyed by the rack's 'x,y'. */
  casks: Record<string, Cask> = {};
  /** Task 34: shortcuts opened for good (ids from SHORTCUT_IDS, e.g. 'hollow_gate'), carved after the maps are built. */
  shortcuts: string[] = [];

  // Mechanics tasks 02, 06, 08, 11, 13, 15, 25-28, 36, 43, 47, 48 & features G3, G6, G7, G8, G10, G11, G13, G15, G16
  outings_done: Record<string, number> = {};
  dinner_day: number = -1;
  child_state: ChildState = emptyChildState();
  guest_regulars: string[] = [];
  fest_roles_done: Record<string, string> = {};
  pantry: PantryState = emptyPantryState();
  chicken_personalities: AnimalPersonality[] = [];
  pasture: PastureState = emptyPastureState();
  enrichment: EnrichmentState = emptyEnrichmentState();
  trail_encounter: ActiveTrailEncounter | null = null;
  tea_progress: Record<string, number> = {};
  tea_last_day: number = -1;
  spouse_routine: SpouseRoutine | null = null;
  prints: StampPrint[] = [];
  wall_print: StampPrint | null = null;
  last_loved_gift: Record<string, string> = {};
  pet_extras: PetExtrasState = emptyPetExtras();
  contracts: ShippingContract[] = [];
  mastery_perks: Record<string, string> = {};
  recipes_discovered: string[] = [...STARTER_RECIPES];
  food_buff: FoodBuff | null = null;
  daily_luck: LuckLevel = 0;

  // Per-browser accessibility, assist & audio preferences (tasks 56, G17, G18, V16)
  text_scale: TextScale = 'normal';
  assist: AssistSettings = defaultAssist();
  key_bindings: KeyBindings = {};
  onTextScale: ((s: TextScale) => void) | null = null;
  onAssist: ((a: AssistSettings) => void) | null = null;
  onKeyBindings: ((b: KeyBindings) => void) | null = null;
  onSfx: ((on: boolean) => void) | null = null;
  onMusic: ((on: boolean) => void) | null = null;
  town_rank_seen: string = 'E';
  private _harvestStreak: number = 0;
  private _lastHarvestAt: number = 0;

  private _hydrating: boolean = false;
  private _saveDirty: boolean = false;
  private _lastAutosaveAt: number = 0;

  SAVE_FIELDS = [
    'name', 'farm', 'year', 'season', 'day', 'minutes', 'weather', 'tomorrow', 'gold',
    'stamina', 'max_stamina', 'fatigue', 'power_berries', 'berry_sources', 'has_mystic_berry',
    'inv', 'held', 'tool', 'favorite_seed', 'first_steps', 'fortnight', 'ach_seen', 'ach_unread', 'previous_tool', 'row_reserve', 'levels', 'tool_exp', 'cursed_uses', 'cursed_days', 'cursed_blesses', 'confessed_day',
    'water', 'upgrading', 'bin', 'basket', 'shipped_counts', 'chickens', 'chicken_aff', 'chicken_fest_won',
    'outdoor_hours', 'animals_grazing', 'incubator_days', 'fed', 'eggs', 'dog_aff', 'dog_frisbee_dist',
    'horse_aff', 'horse_grown', 'riding_horse', 'medals', 'friend', 'sprite_aff', 'sprite_jobs',
    'heart_events_seen', 'rival_events_seen', 'married', 'marriage_day', 'child_name', 'child_days',
    'shipped_total', 'steps', 'fish_caught', 'goddess_gifts', 'kappa_gifts',
    'goddess_jewels', 'kappa_jewels', 'truth_jewels', 'vase_flower', 'tv_order', 'fridge_inv', 'cabinet_inv', 'makers', 'maker_jobs',
    'museum', 'museum_rewards',
    'requests', 'next_request_id', 'requests_done', 'order', 'order_next', 'order_last', 'reminders', 'compost_scraps', 'composted', 'trap', 'flush_day', 'flush_spots', 'aurora_day', 'dog_clue', 'milestones_said', 'memories', 'souvenirs', 'notebook', 'seats_rested', 'plots', 'exhibits_done', 'pocket', 'pockets_read', 'postcards', 'contest', 'favor', 'favor_offered',
    'mastery_xp', 'mastery_claimed',
    'fest_wins', 'house_flags', 'project', 'max_spring_floor', 'max_lake_floor',
    // barn animals, and today's once-per-day flags (a mid-day save/load must not reset them)
    'animals', 'talked', 'gifted', 'honey_picked', 'prayed', 'bathed', 'fireplace_lit',
    'tv_watched_saturday', 'zack_paid_today', 'fest_attended', 'fest_declined',
    // outer-region landmarks
    'lookout_day', 'hollow_luck_day', 'skip_best', 'lighthouse_log', 'lighthouse_day',
    'inn_scenes_seen', 'inn_evening_day',
    'stall', 'stall_last', 'stall_earned',
    'gray_quest', 'gray_note_level',
    'map_pin', 'public_works', 'shortcuts', 'farm_works', 'casks', 'town_rank_seen',
    'outings_done', 'dinner_day', 'child_state', 'guest_regulars', 'fest_roles_done',
    'pantry', 'chicken_personalities', 'pasture', 'enrichment', 'trail_encounter',
    'tea_progress', 'tea_last_day', 'spouse_routine', 'prints', 'wall_print',
    'last_loved_gift', 'pet_extras', 'contracts', 'mastery_perks', 'recipes_discovered',
    'food_buff', 'daily_luck',
    // player position, map, and world state
    'mapname', 'px', 'py', 'face', 'show_minimap', 'wetness',
    'mine_type', 'mine_floor', 'ladder',
  ];

  constructor(scr: Screen, autostart: boolean = false) {
    this.scr = scr;
    this.autostart = autostart;
    this.started = false;
    this.running = true;
    this.msgs = [];
    this.maps = { ...build_valley(), house: build_house() };
    this.hook_farm();
    this.last = Date.now() / 1000;
    this.acc = 0.0;
    this.npc_acc = 0.0;
    this.passing_out = false;
    this.build_interiors();
    this.pace = Game.stored_pace();
    const store = getBrowserStorage();
    this.text_scale = readTextScale(store);
    this.assist = readAssistSettings(store);
    this.key_bindings = readKeyBindings(store);
    this.scr.highContrast = readHighContrast(store);
    loadSfxPreference(store);
  }

  // ---------------------------------------------------------------- day pace (mechanics task 52)
  /** How fast the clock runs: a per-browser preference, never saved with the farm. */
  pace: DayPace = 'normal';
  /** Called when the pace changes, so the page's View menu can follow. */
  onPace: ((p: DayPace) => void) | null = null;

  static stored_pace(): DayPace {
    try {
      const v = getBrowserStorage()?.getItem(PACE_KEY);
      return v && v in DAY_PACES ? (v as DayPace) : 'normal';
    } catch {
      return 'normal';
    }
  }

  /** Real seconds per 10 in-game minutes at the chosen pace. */
  pace_secs(): number {
    return DAY_PACES[this.pace]?.secs ?? SECS_PER_10MIN;
  }

  /** Real time an in-game hour takes, as "36 s" or "1 min 12 s". */
  pace_hour(): string {
    const s = Math.round(this.pace_secs() * 6);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}`;
  }

  set_pace(p: DayPace): void {
    if (!(p in DAY_PACES)) return;
    this.pace = p;
    try {
      getBrowserStorage()?.setItem(PACE_KEY, p);
    } catch {
      // storage unavailable; the pace still applies this session
    }
    this.msg(`Day pace: ${DAY_PACES[p].label} (an in-game hour takes ${this.pace_hour()}).`, '0C');
    this.onPace?.(p);
  }

  set_text_scale(scale: TextScale): void {
    if (!(scale in TEXT_SCALES)) return;
    this.text_scale = scale;
    writeTextScale(getBrowserStorage(), scale);
    this.msg(`Text size: ${TEXT_SCALES[scale].label}.`, '0C');
    this.onTextScale?.(scale);
  }

  set_high_contrast(on: boolean): void {
    this.scr.setHighContrast(on);
    writeHighContrast(getBrowserStorage(), on);
    this.msg(`High-contrast mode: ${on ? 'On' : 'Off'}.`, '0C');
  }

  set_assist(next: Partial<AssistSettings>): void {
    this.assist = { ...this.assist, ...next };
    writeAssistSettings(getBrowserStorage(), this.assist);
    this.onAssist?.(this.assist);
  }

  set_key_bindings(bindings: KeyBindings): void {
    this.key_bindings = { ...bindings };
    writeKeyBindings(getBrowserStorage(), this.key_bindings);
    this.onKeyBindings?.(this.key_bindings);
  }

  set_sfx(on: boolean): void {
    setSfxEnabled(on, getBrowserStorage());
    this.msg(`Sound effects: ${on ? 'On' : 'Off'}.`, '0C');
    this.onSfx?.(on);
  }

  set_music(on: boolean): void {
    setMusicEnabled(on, getBrowserStorage());
    if (on && this.started) {
      syncAmbientAudio(musicSceneFor(this.mapname, this.season, !!this.map?.indoor));
    }
    this.msg(`Music: ${on ? 'On' : 'Off'}.`, '0C');
    this.onMusic?.(on);
  }

  town_rank(): TownRankStatus {
    const goodFriends = Object.values(this.friend || {}).filter((v) => v >= 40).length;
    const contractsDone = (this.contracts || []).filter((c) => c.done).length;
    const status = computeTownRank({
      museumCount: (this.museum || []).length,
      requestsDone: this.requests_done || 0,
      publicWorksBuilt: !!this.public_works?.built,
      shortcutsOpened: (this.shortcuts || []).length,
      pantryCompleted: this.pantry?.meals || 0,
      contractsDone,
      festivalsWon: (this.fest_wins || []).length,
      goodFriends,
      shippedKinds: Object.keys(this.shipped_counts || {}).length,
    });
    if (this.started && !this._hydrating && status.tier.grade !== this.town_rank_seen) {
      const order = ['E', 'D', 'C', 'B', 'A', 'S'];
      if (order.indexOf(status.tier.grade) > order.indexOf(this.town_rank_seen)) {
        this.town_rank_seen = status.tier.grade;
        playSfx('rank_up');
        this.msg(`★ Brackenford reached Town Rank ${status.tier.grade} (${status.tier.title})! ${status.tier.perkSummary}`, '0B');
      }
    }
    return status;
  }

  has_perk(id: string): boolean {
    return Object.values(this.mastery_perks).includes(id);
  }

  active_buff(): FoodBuff | null {
    if (!this.food_buff) return null;
    if (this.now_abs() >= this.food_buff.until) {
      this.food_buff = null;
      return null;
    }
    return this.food_buff;
  }

  effective_luck(): number {
    return this.daily_luck + (this.active_buff()?.kind === 'luck' ? 1 : 0);
  }

  sync_animal_records(): void {
    const today = this.absday();
    if (!Array.isArray(this.chicken_personalities)) this.chicken_personalities = [];
    while (this.chicken_personalities.length < this.chickens) {
      this.chicken_personalities.push(pickPersonality(this.chicken_personalities.length + today));
    }
    if (this.chicken_personalities.length > this.chickens) {
      this.chicken_personalities = this.chicken_personalities.slice(0, this.chickens);
    }
  }

  setBodyState(state: 'title' | 'playing' | 'paused') {
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.state = state;
    }
  }

  new_game(name: string, farm: string): void {
    const wasHydrating = this._hydrating;
    this._hydrating = true;
    try {
      this._init_new_game(name, farm);
    } finally {
      this._hydrating = wasHydrating;
      this._saveDirty = false;
    }
  }

  private _init_new_game(name: string, farm: string): void {
    this.name = name;
    this.farm = farm;
    this.year = 1;
    this.season = 0;
    this.day = 1;
    this.minutes = 6 * 60;
    this.weather = 'Sunny';
    this.tomorrow = this.roll_weather(0, 2);
    this.gold = 500;
    this.power_berries = 0;
    this.berry_sources = [];
    this.has_mystic_berry = false;
    this.max_stamina = getMaxStamina(0);
    this.stamina = this.max_stamina;
    this.fatigue = 0;
    this.inv = { 'Turnip Seeds': 2, 'Pedometer': 1 };
    this.held = null;
    this.tool = 'Hoe';
    this.favorite_seed = null;
    this.first_steps = { till: false, sow: false, water: false };
    this.fortnight = newFortnight();
    this.ach_seen = [];
    this.ach_unread = false;
    this.previous_tool = null;
    this.row = null;
    this.row_reserve = ROW_STAMINA_RESERVE;
    this.levels = Object.fromEntries(UPGRADABLE.map((t) => [t, 0]));
    this.tool_exp = Object.fromEntries(UPGRADABLE.map((t) => [t, 0]));
    this.cursed_uses = {};
    this.cursed_days = {};
    this.cursed_blesses = {};
    this.confessed_day = -1;
    this.water = CAN_CAP[0];
    this.upgrading = null;
    this.tilled = new CoordSet();
    this.wet = new CoordSet();
    this.crops = {};
    this.objs = { farm: {}, mine: {} };
    this.hp = {};
    this.forage = { mountain: {}, beach: {} };
    this.bin = {};
    this.basket = {};
    this.shipped_counts = {};
    this.zack_paid_today = false;
    this.chickens = 0;
    this.chicken_aff = 20;
    this.chicken_fest_won = false;
    this.outdoor_hours = 0;
    this.animals_grazing = false;
    this.incubator_days = 0;
    this.fed = 0;
    this.eggs = 0;
    this.dog_aff = 25;
    this.dog_frisbee_dist = 15;
    this.horse_aff = 25;
    this.horse_grown = true;
    this.riding_horse = false;
    this.medals = 50;
    this.friend = Object.fromEntries(Object.keys(NPCS).map((n) => [n, 0]));
    this.sprite_aff = Object.fromEntries(SPRITES.map((s) => [s.name, 15]));
    this.sprite_jobs = Object.fromEntries(
      SPRITES.map((s) => [s.name, { task: 'none', days: 0, skill: 10 }])
    );
    this.heart_events_seen = [];
    this.rival_events_seen = [];
    this.talked = new Set();
    this.gifted = new Set();
    this.married = null;
    this.marriage_day = -1;
    this.child_name = null;
    this.child_days = 0;
    this.shipped_total = 0;
    this.steps = 0;
    this.fish_caught = {};
    this.goddess_gifts = 0;
    this.kappa_gifts = 0;
    this.goddess_jewels = 0;
    this.kappa_jewels = 0;
    this.truth_jewels = 0;
    this.honey_picked = false;
    this.vase_flower = null;
    this.fireplace_lit = false;
    this.tv_watched_saturday = null;
    this.tv_order = null;
    this.fridge_inv = {};
    this.cabinet_inv = {};
    this.makers = [];
    this.maker_jobs = {};
    this.place_makers();
    this.museum = [];
    this.museum_rewards = [];
    this.requests = [];
    this.order = null;
    this.order_next = 0;
    this.reminders = [];
    this.compost_scraps = 0;
    this.composted = [];
    this.trap = null;
    this.flush_day = -1;
    this.flush_spots = [];
    this.dog_clue = null;
    this.milestones_said = [];
    this.memories = [];
    this.souvenirs = [];
    this.notebook = [];
    this.seats_rested = {};
    this.postcards = [];
    this.contest = null;
    this.favor = null;
    this.favor_offered = {};
    this.clear_plots();
    this.plots = [];
    this.exhibits_done = [];
    this.pocket = null;
    this.pockets_read = [];
    this.order_last = null;
    this.next_request_id = 1;
    this.requests_done = 0;
    this.mastery_xp = Object.fromEntries(MASTERY_DISCIPLINES.map((d) => [d, 0]));
    this.mastery_claimed = [];
    this.lookout_day = -1;
    this.hollow_luck_day = -1;
    this.skip_best = 0;
    this.lighthouse_log = 0;
    this.lighthouse_day = -1;
    this.inn_scenes_seen = [];
    this.inn_evening_day = -1;
    this.stall = null;
    this.stall_last = [-1, 0];
    this.stall_earned = 0;
    this.gray_quest = 0;
    this.gray_note_level = 0;
    this.map_pin = null;
    this.public_works = worksState();
    this.farm_works = emptyFarmWorks();
    this.casks = {};
    this.town_rank_seen = 'E';
    this.outings_done = {};
    this.dinner_day = -1;
    this.child_state = emptyChildState();
    this.guest_regulars = [];
    this.fest_roles_done = {};
    this.pantry = emptyPantryState();
    this.chicken_personalities = [];
    this.pasture = emptyPastureState();
    this.enrichment = emptyEnrichmentState();
    this.trail_encounter = rollTrailEncounter(0);
    this.tea_progress = {};
    this.tea_last_day = -1;
    this.spouse_routine = null;
    this.prints = [];
    this.wall_print = null;
    this.last_loved_gift = {};
    this.pet_extras = emptyPetExtras();
    this.contracts = generateWeeklyContracts(0, 0);
    this.mastery_perks = {};
    this.recipes_discovered = [...STARTER_RECIPES];
    this.food_buff = null;
    this.daily_luck = rollDailyLuck(0, farm.length * 13 + name.length);
    this.apply_public_works();
    // a carved shortcut lives in the maps, so a new farm gets a fresh valley
    if (this.shortcuts.length) { Object.assign(this.maps, build_valley()); this.hook_farm(); }
    this.shortcuts = [];
    this.house_flags = [];
    this.apply_town_cottage();
    this.prayed = false;
    this.fest_wins = [];
    this.fest_attended = false;
    this.fest_declined = false;
    this.npc_pos = {};
    this.fx = [];
    this.shake_fx = null;
    this.wetness = Object.fromEntries(OUTDOOR_MAPS.map((m) => [m, 0]));
    this.mine_type = 'spring';
    this.mine_floor = 0;
    this.max_spring_floor = 0;
    this.max_lake_floor = 0;
    this.ladder = null;
    this.mapname = 'house';
    this.show_minimap = false;
    [this.px, this.py] = HOUSE_WAKE;
    this.face = [0, 1]; // not toward the bed
    this.cam_x = null;
    this.cam_y = null;

    const rng = py_rng();
    const m = this.maps['farm'];
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        if (m.t[y][x] === 'field') {
          const r = rng.random();
          const kind =
            r < 0.12
              ? 'weed'
              : r < 0.19
                ? 'stone'
                : r < 0.25
                  ? 'branch'
                  : r < 0.262
                    ? 'stump'
                    : r < 0.274
                      ? 'boulder'
                      : null;
          if (kind) {
            this.objs['farm'][pkey(x, y)] = kind;
            if (kind === 'stump' || kind === 'boulder') {
              this.hp[pkey(x, y)] = 6;
            }
          }
        }
      }
    }
    this.spawn_forage();
    this.spawn_digs();
    this.animals = [];
    this.init_carpentry();
    this.started = true;
    this.setBodyState('playing');
  }

  get map(): GameMap {
    return this.maps[this.mapname];
  }

  absday(year: number | null = null, season: number | null = null, day: number | null = null): number {
    const y = year === null ? this.year : year;
    const s = season === null ? this.season : season;
    const d = day === null ? this.day : day;
    return (y - 1) * 120 + s * 30 + d - 1;
  }

  get weekday(): number {
    return this.absday() % 7;
  }

  get season_name(): string {
    return SEASONS[this.season];
  }

  date_str(): string {
    return `${this.season_name} ${this.day} (${WEEKDAYS[this.weekday]}), Year ${this.year}`;
  }

  roll_weather(season: number, day: number): string {
    if (day === 1 || FESTIVALS[`${season},${day}`]) {
      return 'Sunny';
    }
    const r = py_rng().random();
    if (season === 3) {
      if (r < 0.04) return 'Blizzard';
      return r < 0.28 ? 'Snow' : 'Sunny';
    }
    if (season === 1 && r < 0.04) {
      return 'Typhoon';
    }
    return r < [0.2, 0.12, 0.15][season] ? 'Rain' : 'Sunny';
  }

  msg(text: string, col: string = '05'): void {
    this.msgs.push([text, col]);
    this.msgs = py_slice(this.msgs, -30, null);
  }

  give(item: string, n: number = 1): void {
    if (n <= 0) return;
    this.inv[item] = (this.inv[item] || 0) + n;
    this.markDirty(false);
  }

  take(item: string, n: number = 1): void {
    if (!this.inv[item] || n <= 0) return;
    this.inv[item] -= n;
    if (this.inv[item] <= 0) {
      delete this.inv[item];
      if (this.held === item) {
        this.held = null;
      }
    }
    this.markDirty(false);
  }

  calc_max_stamina(): number {
    return getMaxStamina(this.power_berries || 0) + (this.house_flags.includes('Big Bed') ? 20 : 0);
  }

  /** Max stamina from Heartseeds plus the Big Bed; the one place that sums them. */
  recompute_max_stamina(): void {
    this.max_stamina = this.calc_max_stamina();
  }

  give_power_berry(source: string): boolean {
    if (this.berry_sources.includes(source) || this.power_berries >= 10) {
      return false;
    }
    this.berry_sources.push(source);
    this.power_berries += 1;
    this.recompute_max_stamina();
    this.stamina = this.max_stamina;
    this.fatigue = 0;
    this.msg(`You ate a Heartseed! Max Stamina +10 (${this.max_stamina})!`, '0A');
    return true;
  }

  give_truth_jewel(source: string): boolean {
    const key = `truth:${source}`;
    if (this.berry_sources.includes(key) || this.truth_jewels >= 9) {
      return false;
    }
    this.berry_sources.push(key);
    this.truth_jewels += 1;
    this.give('Truth Jewel', 1);
    if (this.truth_jewels >= 9) {
      this.take('Truth Jewel', 9);
      this.give('Gem of Truth', 1);
      this.msg('All 9 Jewels combined into the GEM OF TRUTH! Exact Stamina/Fatigue unlocked!', '0C');
    } else {
      this.msg(`Found a Jewel of Truth! (${this.truth_jewels}/9)`, '0C');
    }
    return true;
  }

  markDirty(immediate: boolean = false): void {
    if (this._hydrating || !this.started) return;
    this._saveDirty = true;
    if (immediate) {
      this.autosave(true);
    }
  }

  hasSave(slot: SaveSlot = 'auto'): boolean {
    return Boolean(readSaveSlot(getBrowserStorage(), slot));
  }

  autosave(force: boolean = false): boolean {
    if (this._hydrating || !this.started) return false;
    const now = Date.now();
    if (!force && (!this._saveDirty || now - this._lastAutosaveAt < 1500)) {
      return false;
    }
    const res = writeSaveSlot(getBrowserStorage(), 'auto', this.snapshot());
    if (res.ok) {
      this._saveDirty = false;
      this._lastAutosaveAt = now;
    }
    return res.ok;
  }

  flushAutosave(): void {
    if (this._hydrating || !this.started) return;
    this._saveDirty = true;
    this.autosave(true);
  }

  snapshot(): Record<string, any> {
    const d: Record<string, any> = {
      _v: SAVE_VERSION,
      savedAt: Date.now(),
    };
    for (const k of this.SAVE_FIELDS) {
      const val = (this as any)[k];
      d[k] = val instanceof Set ? Array.from(val) : cloneSaveValue(val);
    }
    d['tilled'] = Array.from(this.tilled);
    d['wet'] = Array.from(this.wet);
    d['talked'] = Array.from(this.talked || []);
    d['gifted'] = Array.from(this.gifted || []);
    d['crops'] = sanitizeCrops(this.crops);
    d['objs'] = { ...(this.objs.farm || {}) };
    d['map_objs'] = sanitizeMapStringRecords(this.objs);
    d['hp'] = sanitizeStringRecordNumber(this.hp);
    d['forage'] = sanitizeMapStringRecords(this.forage);
    return d;
  }

  save(slot: SaveSlot = 1): boolean {
    const d = this.snapshot();
    const storage = getBrowserStorage();
    const res = writeSaveSlot(storage, slot, d);
    if (!res.ok) {
      console.error('Save failed:', res.error);
      return false;
    }
    if (slot !== 'auto') {
      writeSaveSlot(storage, 'auto', d);
    }
    this._saveDirty = false;
    this._lastAutosaveAt = Date.now();
    return true;
  }

  /**
   * Morning backups (task 55): the last few dawn snapshots, newest first. Each shows the farm and
   * date before anything happens; restoring asks first and also rewrites the auto-save, so a
   * reload keeps the restored morning.
   */
  async dawn_menu(): Promise<void> {
    const backups = readDawnBackups(getBrowserStorage());
    if (!backups.length) {
      await this.say('No morning backups yet. One is kept each time you wake up.', null);
      return;
    }
    const sums = backups.map((d) => summarizeSave('auto', d));
    const opts = [...sums.map((s) => `${s.farm} Farm · ${s.seasonName} ${s.day}, Yr ${s.year}`), 'Back'];
    const info = (i: number) =>
      i < sums.length
        ? [formatSaveLine(sums[i]), formatSaveStatsLine(sums[i]), 'Restores the farm as it was that morning.']
        : ['Keep playing from now.'];
    const sel = await this.menu('Morning Backups', opts, 0, info);
    if (sel === null || sel >= sums.length) return;
    const s = sums[sel];
    if (!(await this.confirm(`Restore ${s.farmer}'s ${s.farm} Farm to the morning of ${s.seasonName} ${s.day}, Year ${s.year}? Anything since then is lost.`))) return;
    this.applySaveData(backups[sel]);
    this.update_npcs();
    this.flushAutosave();
    this.msg(`Restored the morning of ${s.seasonName} ${s.day}, Year ${s.year}.`, '0C');
  }

  export_save(): void {
    if (typeof document === 'undefined') {
      this.msg('Save export is only available in the browser.', '08');
      return;
    }
    const data = JSON.stringify(this.snapshot(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrvstmn-${this.farm.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-y${this.year}s${this.season + 1}d${this.day}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.msg('Farm exported as a save file.', '0B');
  }

  async import_save(): Promise<void> {
    if (typeof document === 'undefined') {
      this.msg('Save import is only available in the browser.', '08');
      return;
    }
    const file = await new Promise<File | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.style.display = 'none';
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.oncancel = () => resolve(null);
      document.body.appendChild(input);
      input.click();
    });
    if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      if (!isValidSavePayload(d)) {
        throw new Error('That does not look like a GLADE save file.');
      }
      this.applySaveData(d);
      this.save(1);
      this.msg('Farm imported into Diary Slot 1.', '0B');
    } catch (e: any) {
      await this.say(e?.message || 'Could not read that save file.', null);
    }
  }

  applySaveData(d: Record<string, any>): void {
    d = migrateLegacySave(d);
    this._hydrating = true;
    try {
      const farmer = typeof d.name === 'string' && d.name.trim() ? d.name : 'Ash';
      const farmName = typeof d.farm === 'string' && d.farm.trim() ? d.farm : 'Bramble';
      this._init_new_game(farmer, farmName);
      for (const k of this.SAVE_FIELDS) {
        if (k in d && d[k] !== undefined) {
          (this as any)[k] = cloneSaveValue(d[k]);
        }
      }
      this.farm_works = emptyFarmWorks();
      if (!Number.isInteger(this.confessed_day)) this.confessed_day = -1;
      if (!(ROW_RESERVES as readonly number[]).includes(this.row_reserve)) this.row_reserve = ROW_STAMINA_RESERVE;
      this.inv = sanitizeStringRecordNumber(this.inv);
      // an older save (no checklist saved) is an experienced farm: no first-morning checklist
      const fs = 'first_steps' in d ? d.first_steps : null;
      this.first_steps = fs && typeof fs === 'object' ? { till: !!fs.till, sow: !!fs.sow, water: !!fs.water } : null;
      this.fortnight = sanitizeFortnight(this.fortnight);
      if (this.first_steps) this.fortnight.active = false; // the ladder follows the checklist
      this.ach_unread = !!this.ach_unread;
      this.bin = sanitizeStringRecordNumber(this.bin);
      this.basket = sanitizeStringRecordNumber(this.basket);
      this.shipped_counts = sanitizeStringRecordNumber(this.shipped_counts);
      this.fish_caught = sanitizeStringRecordNumber(this.fish_caught);
      this.fridge_inv = sanitizeStringRecordNumber(this.fridge_inv);
      this.cabinet_inv = sanitizeStringRecordNumber(this.cabinet_inv);
      if (this.held && !this.inv[this.held]) {
        this.held = null;
      }
      for (const n of Object.keys(NPCS)) {
        if (!(n in this.friend)) {
          this.friend[n] = 0;
        }
      }
      for (const s of SPRITES) {
        if (!(s.name in this.sprite_aff)) {
          this.sprite_aff[s.name] = 15;
        }
        if (!(s.name in this.sprite_jobs)) {
          this.sprite_jobs[s.name] = { task: 'none', days: 0, skill: 10 };
        }
      }
      this.tilled = new CoordSet(Array.isArray(d.tilled) ? d.tilled : []);
      this.wet = new CoordSet(Array.isArray(d.wet) ? d.wet : []);
      this.talked = new Set(Array.isArray(d.talked) ? d.talked.filter((x: unknown) => typeof x === 'string') : []);
      this.gifted = new Set(Array.isArray(d.gifted) ? d.gifted.filter((x: unknown) => typeof x === 'string') : []);
      this.crops = sanitizeCrops(d.crops);
      if (d.map_objs && typeof d.map_objs === 'object') {
        const restored = sanitizeMapStringRecords(d.map_objs);
        this.objs = { farm: {}, mine: {}, ...restored };
      } else {
        this.objs = { farm: { ...(d.objs || {}) }, mine: {} };
      }
      this.farm_works = restoreFarmWorks(d.farm_works, (k, _p) => this.farm_can_place(k), this.absday());
      this.casks = sanitiseCasks(d.casks, (k) => this.farm_works.pieces[k] === CASK_RACK, this.absday());
      const todayAbs = this.absday();
      this.outings_done = Object.fromEntries(
        Object.entries(this.outings_done && typeof this.outings_done === 'object' ? this.outings_done : {}).filter(
          ([k, v]) => OUTINGS.some((o) => o.id === k) && Number.isInteger(v),
        ),
      ) as Record<string, number>;
      this.dinner_day = Number.isInteger(this.dinner_day) ? this.dinner_day : -1;
      this.child_state = sanitizeChildState(d.child_state);
      this.guest_regulars = Array.isArray(d.guest_regulars)
        ? [...new Set(d.guest_regulars.filter((id: unknown): id is string => typeof id === 'string' && GUEST_VENDORS.some((v) => v.id === id)))]
        : [];
      this.fest_roles_done = Object.fromEntries(
        Object.entries(this.fest_roles_done && typeof this.fest_roles_done === 'object' ? this.fest_roles_done : {}).filter(
          ([k, v]) => typeof k === 'string' && typeof v === 'string',
        ),
      ) as Record<string, string>;
      this.pantry = sanitizePantryState(d.pantry);
      this.pasture = sanitizePastureState(d.pasture);
      this.enrichment = sanitizeEnrichmentState(d.enrichment);
      this.trail_encounter = sanitizeTrailEncounter(d.trail_encounter, todayAbs);
      this.tea_progress = Object.fromEntries(
        Object.entries(this.tea_progress && typeof this.tea_progress === 'object' ? this.tea_progress : {}).filter(
          ([k, v]) => typeof k === 'string' && Number.isInteger(v) && (v as number) >= 0,
        ),
      ) as Record<string, number>;
      this.tea_last_day = Number.isInteger(this.tea_last_day) ? this.tea_last_day : -1;
      this.spouse_routine = sanitizeSpouseRoutine(d.spouse_routine);
      this.prints = Array.isArray(d.prints)
        ? d.prints.map((p: unknown) => sanitizeStampPrint(p)).filter((p: StampPrint | null): p is StampPrint => p !== null).slice(-12)
        : [];
      this.wall_print = sanitizeStampPrint(d.wall_print);
      this.last_loved_gift = Object.fromEntries(
        Object.entries(this.last_loved_gift && typeof this.last_loved_gift === 'object' ? this.last_loved_gift : {}).filter(
          ([k, v]) => k in NPCS && typeof v === 'string',
        ),
      ) as Record<string, string>;
      this.pet_extras = sanitizePetExtras(d.pet_extras);
      this.contracts = sanitizeContracts(d.contracts, todayAbs);
      this.mastery_perks = sanitizeMasteryPerks(d.mastery_perks);
      this.recipes_discovered = Array.isArray(d.recipes_discovered)
        ? [...new Set([...STARTER_RECIPES, ...d.recipes_discovered.filter((r: unknown): r is string => typeof r === 'string' && r in RECIPES)])]
        : [...STARTER_RECIPES];
      this.food_buff = sanitizeFoodBuff(d.food_buff, this.now_abs());
      this.daily_luck = sanitizeLuck(d.daily_luck);
      this.sync_animal_records();
      this.hp = sanitizeStringRecordNumber('hp' in d ? d.hp : this.hp);
      this.forage = { mountain: {}, beach: {}, ...sanitizeMapStringRecords(d.forage) };
      this.wetness = {
        ...Object.fromEntries(OUTDOOR_MAPS.map((m) => [m, 0])),
        ...(typeof d.wetness === 'object' && d.wetness !== null ? d.wetness : {}),
      };
      this.public_works = worksState(d.public_works);
      this.apply_public_works();
      this.makers = Array.isArray(this.makers) ? this.makers.filter((m) => m in MAKER_SPOTS) : [];
      this.maker_jobs = sanitizeMakerJobs(this.maker_jobs, this.makers);
      this.place_makers();
      this.shortcuts = Array.isArray(this.shortcuts) ? this.shortcuts.filter((id) => SHORTCUT_IDS.includes(id)) : [];
      for (const id of this.shortcuts) open_shortcut(this.maps, id);
      this.prune_forage();
      this.prune_requests();
      this.order = sanitizeOrder(this.order);
      this.reminders = sanitizeReminders(this.reminders, this.absday());
      this.compost_scraps = Math.max(0, Math.floor(Number(this.compost_scraps) || 0));
      this.flush_day = Number.isInteger(this.flush_day) ? this.flush_day : -1;
      this.flush_spots = Array.isArray(this.flush_spots) ? this.flush_spots.filter((k) => typeof k === 'string') : [];
      this.milestones_said = Array.isArray(this.milestones_said) ? this.milestones_said.filter((k) => typeof k === 'string') : [];
      this.memories = sanitizeMemories(this.memories);
      this.clear_plots();
      this.plots = Array.isArray(this.plots)
        ? this.plots
            .filter((p: any) => p && typeof p.key === 'string' && typeof p.name === 'string' && p.name.trim() && typeof p.tile === 'string' && TILES[p.tile])
            .map((p: any) => ({ key: p.key, name: p.name.slice(0, PLOT_NAME_MAX), tile: p.tile }))
            .slice(0, PLOT_MAX)
        : [];
      this.place_plots();
      this.exhibits_done = Array.isArray(this.exhibits_done) ? this.exhibits_done.filter((id) => EXHIBITS.some((e) => e.id === id)) : [];
      this.pockets_read = Array.isArray(this.pockets_read) ? [...new Set(this.pockets_read.filter((k) => k in POCKETS))] : [];
      const pk = this.pocket as { x?: unknown; y?: unknown; kind?: unknown; opened?: unknown } | null;
      this.pocket = pk && typeof pk === 'object' && Number.isInteger(pk.x) && Number.isInteger(pk.y) && typeof pk.kind === 'string' && pk.kind in POCKETS
        ? { x: pk.x as number, y: pk.y as number, kind: pk.kind as PocketKind, opened: !!pk.opened }
        : null;
      const fv: any = this.favor;
      this.favor = fv && typeof fv === 'object' && FAVORS[fv.npc] && Number.isInteger(fv.day) && fv.day >= this.absday() ? { npc: fv.npc, day: fv.day } : null;
      this.favor_offered = Object.fromEntries(
        Object.entries(this.favor_offered && typeof this.favor_offered === 'object' ? this.favor_offered : {}).filter(([k, v]) => FAVORS[k] && Number.isInteger(v)),
      ) as Record<string, number>;
      const ct: any = this.contest;
      this.contest = ct && typeof ct === 'object' && Number.isInteger(ct.day) && Number.isInteger(ct.fish) && ct.fish >= 0
        ? { day: ct.day, fish: ct.fish, best: typeof ct.best === 'string' && ITEMS[ct.best] ? ct.best : null }
        : null;
      this.postcards = sanitizePostcards(this.postcards);
      this.seats_rested = Object.fromEntries(
        Object.entries(this.seats_rested && typeof this.seats_rested === 'object' ? this.seats_rested : {}).filter(([k, v]) => SEATS[k] && Number.isInteger(v)),
      ) as Record<string, number>;
      this.notebook = Array.isArray(this.notebook)
        ? this.notebook.filter(
            (o: any) => o && typeof o.item === 'string' && ITEMS[o.item] && typeof o.map === 'string' && typeof o.weather === 'string' && Number.isInteger(o.minutes) && Number.isInteger(o.day),
          )
        : [];
      this.souvenirs = Array.isArray(this.souvenirs)
        ? this.souvenirs
            .filter((v: any) => v && typeof v.key === 'string' && typeof v.name === 'string' && typeof v.text === 'string' && Number.isInteger(v.day))
            .map((v: any) => ({ key: v.key, name: v.name.slice(0, 40), day: v.day, text: v.text.slice(0, 120) }))
        : [];
      const dc: any = this.dog_clue;
      this.dog_clue =
        dc && Number.isInteger(dc.day) && typeof dc.map === 'string' && this.maps[dc.map] && typeof dc.key === 'string' && (dc.kind === 'dig' || dc.kind === 'mushroom')
          ? { day: dc.day, map: dc.map, key: dc.key, kind: dc.kind }
          : null;
      const tr: any = this.trap;
      this.trap = tr && Number.isInteger(tr.day) ? { day: tr.day, bait: typeof tr.bait === 'string' && ITEMS[tr.bait] ? tr.bait : null } : null;
      this.composted = Array.isArray(this.composted) ? [...new Set(this.composted.filter((k) => typeof k === 'string' && this.tilled.has(k)))] : [];
      // an older farm has no announced list: its finished achievements are not news
      this.ach_seen = 'ach_seen' in d ? sanitizeAchSeen(this.ach_seen) : this.achievement_list().filter((a) => a.done).map((a) => a.name);
      this.recompute_max_stamina();
      this.stamina = Math.min(this.max_stamina, Math.max(0, d.stamina ?? this.max_stamina));

      if (this.mapname === 'mine') {
        this.mine_type = this.mine_type === 'lake' ? 'lake' : 'spring';
        this.mine_floor = Math.max(1, Math.min(255, Math.floor(Number(this.mine_floor) || 1)));
        const savedMineObjs = this.objs.mine ? { ...this.objs.mine } : null;
        const mineMap = build_mine(this.mine_floor, this.objs, this.mine_type);
        this.maps['mine'] = mineMap;
        if (savedMineObjs && Object.keys(savedMineObjs).length > 0) {
          this.objs.mine = savedMineObjs;
        }
        if (Array.isArray(this.ladder) && this.ladder.length === 2) {
          const [lx, ly] = this.ladder;
          for (let y = 0; y < mineMap.h; y++) {
            for (let x = 0; x < mineMap.w; x++) {
              if (mineMap.t[y][x] === 'down') mineMap.t[y][x] = 'mfloor';
            }
          }
          if (mineMap.inside(lx, ly) && !this.objs.mine[pkey(lx, ly)]) {
            mineMap.set(lx, ly, 'down');
          }
        }
        this.restore_pocket(mineMap);
      }
      const targetMap = this.maps[this.mapname];
      if (!targetMap || !targetMap.inside(this.px, this.py)) {
        this.mapname = 'house';
        [this.px, this.py] = HOUSE_WAKE;
        this.face = [0, -1];
      }
      if (this.mapname !== 'farm') {
        this.riding_horse = false;
      }
      if (!Array.isArray(this.face) || this.face.length !== 2) {
        this.face = [0, -1];
      }
      this.sync_house_furniture();
      this.apply_town_cottage();
      this.cam_x = null;
      this.cam_y = null;
      this._saveDirty = false;
      this.setBodyState('playing');
    } finally {
      this._hydrating = false;
    }
  }

  load(slot: SaveSlot = 1): void {
    const data = readSaveSlot(getBrowserStorage(), slot);
    if (!data) {
      const label = slot === 'auto' ? 'Auto-Save' : `Slot ${slot}`;
      throw new Error(`No save file in ${label}`);
    }
    this.applySaveData(data);
  }

  /**
   * One session after another: the title screen, then play until "Save & quit" brings the title
   * back. Nothing a player can press ends the loop; `running` only goes false when the page lets go.
   */
  async run(): Promise<void> {
    try {
      await this.sessions();
    } catch (e) {
      if (!(e instanceof EngineStopped)) throw e;
    }
  }

  private async sessions(): Promise<void> {
    let first = true;
    while (this.running) {
      if (first && this.autostart) {
        if (this.hasSave('auto')) {
          try {
            this.load('auto');
            this.update_npcs();
            this.msg(`Resumed ${this.farm} Farm (${this.date_str()}).`, '0B');
          } catch {
            this.new_game('Ash', 'Bramble');
            this.autosave(true);
            this.msg('Welcome to Brackenford! Use Arrows/WASD to move, SPACE to use tool, X to act.', '0B');
          }
        } else {
          this.new_game('Ash', 'Bramble');
          this.autosave(true);
          this.msg('Welcome to Brackenford! Use Arrows/WASD to move, SPACE to use tool, X to act.', '0B');
        }
        this.render();
        this.scr.flush();
      } else {
        this.started = false;
        this.setBodyState('title');
        await this.title();
      }
      first = false;
      this.to_title = false;
      this.last = Date.now() / 1000;
      while (this.running && !this.to_title) {
        let k = await this.scr.getKey(1 / 20);
        while (k && this.running && !this.to_title) {
          const prevMap = this.mapname;
          await this.handle(k);
          if (this.started && this.running && !this.to_title) {
            if ((k in DIRS || k === 'row-repeat') && this.mapname === prevMap) {
              this.markDirty(false);
              this.autosave(false);
            } else {
              this.autosave(true);
            }
          }
          k = await this.scr.getKey(0);
        }
        if (this.to_title) break;
        await this.update();
        this.autosave(false);
        this.render();
        this.scr.flush();
      }
    }
  }

  async update(): Promise<void> {
    const now = Date.now() / 1000;
    const dt = this.paused ? 0 : Math.min(now - this.last, 0.25);
    this.last = now;
    if (this.fx.length) this.fx = this.fx.filter((f) => now - f.born < f.life);
    if (!this.map.indoor) {
      this.acc += dt;
      const tick = this.pace_secs();
      while (this.acc >= tick) {
        this.acc -= tick;
        await this.advance(10);
      }
    }
    this.npc_acc += dt;
    if (this.npc_acc > 0.7) {
      this.npc_acc = 0;
      this.move_npcs();
    }
  }

  /** What Otto pays for one of `item` today (mastery perks & Town Rank included). */
  bin_price(item: string): number {
    let price = ITEMS[item] ? ITEMS[item][0] : 0;
    const cat = ITEMS[item]?.[2];
    const isArtisan = item.includes('Honey') || item.includes('Wine') || item.includes('Preserve') || item.includes('Cheese') || item.includes('Mayonnaise') || item.includes('Yarn');
    if (cat === 'crop' && this.has_perk('farm_value')) price = Math.round(price * 1.15);
    else if (cat === 'fish' && this.has_perk('fish_rare')) price = Math.round(price * 1.15);
    else if ((cat === 'animal' || item.includes('Mayonnaise') || item.includes('Cheese') || item.includes('Yarn')) && this.has_perk('ranch_value')) {
      price = Math.round(price * 1.15);
    }
    if (isArtisan && this.has_perk('farm_artisan')) price = Math.round(price * 1.2);
    if ((cat === 'animal' || item.includes('Milk') || item.includes('Cheese') || item.includes('Wool')) && this.has_perk('ranch_golden')) {
      price = Math.round(price * 1.1);
    }
    const rankBonus = this.town_rank().tier.artisanBonus;
    if (rankBonus > 0 && isArtisan) {
      price = Math.round(price * (1 + rankBonus));
    }
    return price;
  }

  process_zack_pickup(): Payout {
    let total = 0;
    let contractBonus = 0;
    const items: [string, number][] = [];
    for (const [item, qty] of Object.entries(this.bin)) {
      total += this.bin_price(item) * qty;
      if (qty > 0) items.push([item, qty]);
      this.shipped_counts[item] = (this.shipped_counts[item] || 0) + qty;
      // Credit weekly Otto shipping contracts (G16)
      for (const c of this.contracts) {
        if (!c.done && c.item === item) {
          c.shipped = Math.min(c.need, c.shipped + qty);
          if (c.shipped >= c.need) {
            c.done = true;
            contractBonus += c.bonusGold;
            this.friend['Otto'] = clamp((this.friend['Otto'] || 0) + 6, 0, 100);
            this.remember('Otto', `Completed Otto's shipping contract (${c.need} ${c.item}) for +${c.bonusGold}G.`, `contract:${c.id}`);
          }
        }
      }
    }
    total += contractBonus;
    if (total > 0) {
      this.gold += total;
      this.shipped_total += total;
      this.bin = {};
      playSfx('coin');
      this.markDirty(false);
    }
    return { total, items, bonus: contractBonus };
  }

  /** 4:30 PM nudge: goods still in the bin (or the Basket) are about to be collected. Nothing is taken. */
  bin_warning(): void {
    const waiting = Object.entries(this.bin).reduce((n, [i, q]) => n + this.bin_price(i) * q, 0);
    if (waiting > 0) {
      this.msg(`4:30 PM: Otto will be along at 5 PM, ${waiting.toLocaleString('en-US')}G waiting in the bin.`, '09');
      playSfx('menu');
    } else if (getBasketTotal(this.basket) > 0) {
      this.msg('4:30 PM: your Basket still holds goods. Empty it into the bin before Otto comes at 5 PM.', '09');
      playSfx('menu');
    }
  }

  async advance(mins: number): Promise<void> {
    const before = this.minutes;
    this.minutes += mins;
    this.markDirty(false);
    if (this.stall) await this.stall_tick(before);

    // Equipped Gem of the Wellkeeper / Gem of the Reed Heron passive regeneration
    if (this.held === 'Gem of the Wellkeeper' || this.inv['Gem of the Wellkeeper']) {
      this.stamina = Math.min(this.max_stamina, this.stamina + 2);
    }
    if (this.held === 'Gem of the Reed Heron' || this.inv['Gem of the Reed Heron']) {
      this.fatigue = Math.max(0, this.fatigue - 2);
    }

    // 5:00 PM (17:00) Otto shipping pickup
    if (before < 17 * 60 && this.minutes >= 17 * 60 && !this.zack_paid_today) {
      this.zack_paid_today = true;
      const pay = this.process_zack_pickup();
      if (pay.total > 0) this.msg(`5:00 PM: ${payoutLine(pay)}`, '09');
    }
    if (before < 16 * 60 + 30 && this.minutes >= 16 * 60 + 30) this.bin_warning();

    if (before < 18 * 60 && 18 * 60 <= this.minutes) {
      this.msg('The sun is setting. Shops are closing soon.', '09');
    }
    if (this.contest_today() && before < CONTEST_HOURS[0] * 60 && CONTEST_HOURS[0] * 60 <= this.minutes) {
      this.msg(`The Evening Catch has begun at Willow Bend: land ${CONTEST_GOAL} fish by ${fmt_hour(CONTEST_HOURS[1])}.`, '0D');
    }
    if (before < CONTEST_HOURS[1] * 60 && CONTEST_HOURS[1] * 60 <= this.minutes) {
      for (const line of this.contest_close()) this.msg(line, '0D');
    }
    if (before < 24 * 60 && 24 * 60 <= this.minutes) {
      this.fatigue = Math.min(100, this.fatigue + 10);
      this.msg("It's midnight. Staying up late builds Fatigue!", '08');
    }
    this.goals_tick();
    if (this.minutes >= 26 * 60) {
      await this.pass_out("It's 2:00 AM... you collapse from exhaustion where you stand.");
      return;
    }
    this.update_npcs();
  }

  /**
   * The step animation for the renderer, in screen cells. A slide starts where the token was
   * drawn last frame, not a tile back: the camera may have scrolled in between.
   */
  step_ctx(sx: number, sy: number): RenderCtx['step'] {
    const prev = this.player_screen;
    this.player_screen = { map: this.mapname, x: sx, y: sy };
    const st = this.step_fx;
    if (!st || this.scr.reducedMotion) return undefined;
    const born = st.born;
    const now = (globalThis.performance?.now() ?? Date.now()) / 1000;
    if (now - born > 0.3) {
      this.step_fx = null;
      return undefined;
    }
    if (st.kind === 'bump') return { kind: 'bump', at: [sx, sy], dx: st.dx, dy: st.dy, born };
    if (!st.from) st.from = prev && prev.map === this.mapname ? [prev.x - sx, prev.y - sy] : [0, 0];
    const [dx, dy] = st.from;
    return dx || dy ? { kind: 'slide', at: [sx, sy], dx, dy, born } : undefined;
  }

  /** Record a step for the slide animation, or a bump when a wall stopped it (same map only). */
  note_step(map: string, bx: number, by: number, dx: number, dy: number): void {
    if (this.mapname !== map || this.modal_depth > 0) {
      this.step_fx = null;
      return;
    }
    const born = (globalThis.performance?.now() ?? Date.now()) / 1000;
    const [mx, my] = [this.px - bx, this.py - by];
    this.step_fx = mx || my ? { kind: 'slide', dx: mx, dy: my, born } : { kind: 'bump', dx, dy, born };
  }

  async handle(k: string): Promise<void> {
    // Any key but C drops a planned row; C previews one, or works its next tile (task 54).
    if (k !== 'c' && k !== 'C' && k !== 'row-repeat') this.row = null;
    if (k === 'row-repeat') {
      if (this.row && this.row_current(this.row)) await this.row_step();
      else this.row = null;
    } else if (k === 'c' || k === 'C') {
      if (this.row && this.row_current(this.row)) await this.row_step();
      else this.row_preview();
    } else if (k in DIRS) {
      const [dx, dy] = DIRS[k];
      const [map, bx, by] = [this.mapname, this.px, this.py];
      await this.move(dx, dy);
      if (this.riding_horse && this.mapname === 'farm') {
        await this.move(dx, dy);
      }
      this.note_step(map, bx, by, dx, dy);
    } else if (k.startsWith('turn-') && k.slice(5) in DIRS) {
      // a tap of a new direction (see held.ts): face that way without stepping
      this.face = DIRS[k.slice(5)];
      this.step_fx = null;
      this.markDirty(false);
    } else if (k === 'space' || k === 'z') {
      await this.use_tool();
      this.first_steps_update();
      this.goals_tick();
    } else if (k === 'x' || k === 'e' || k === 'enter') {
      await this.interact();
      this.goals_tick();
    } else if (k === 'tab') {
      this.cycle_tool(1);
    } else if (k === 'btab') {
      this.cycle_tool(-1);
    } else if (k.length === 1 && '123456'.includes(k)) {
      const t = TOOLS[Number(k) - 1];
      if (this.levels[this.tool] === 5 && this.tool !== t) {
        this.msg(`Your ${this.tool} is FEY and cannot be unequipped! Visit Lucan at Church.`, '08');
      } else if (this.upgrading && this.upgrading[0] === t) {
        this.msg(`Hilde is still working on your ${t}.`, '08');
      } else {
        this.tool = t;
      }
    } else if (k === 'i') {
      await this.rucksack();
    } else if (k === 'm') {
      await this.ranch_summary();
    } else if (k === 'f' || k === 'F') {
      this.seed_pouch_shortcut();
    } else if (k === 'H') {
      // Shift+H: plain 'h' is vim-style movement (hjkl) and is handled above
      this.whistle_horse();
    } else if (k === 'b') {
      this.ring_grazing_bell();
    } else if (k === 't') {
      if (this.inv['Waystone']) {
        await this.use_teleport_stone();
      } else {
        this.msg('Unearth the Waystone on Floor 255 of the Copperseam Mine to warp anywhere!');
      }
    } else if (k === 'y' || k === 'Y') {
      await this.today_panel();
    } else if (k === 'g' || k === 'G') {
      await this.valley_map();
    } else if (k === 'n' || k === 'N') {
      this.show_minimap = !this.show_minimap;
      this.msg(`Minimap ${this.show_minimap ? 'shown' : 'hidden'}.`, '0C');
    } else if (k === 'V') {
      const order: PaletteMode[] = ['mono', 'duotone', 'isotope'];
      const labels: Record<PaletteMode, string> = {
        mono: 'Contour Mono',
        duotone: 'Seasonal Duotone',
        isotope: 'Seasonal Isotope',
      };
      const next = order[(order.indexOf(this.scr.paletteMode) + 1) % order.length];
      this.scr.setPaletteMode(next);
      this.msg(`Palette: ${labels[next]} (Shift+V)`, '0C');
    } else if (k === 'p') {
      // Narrow screens hide the side panel; 'p' (touch INFO) overlays it. Wide screens always show it.
      if (isCompact(this.scr.w)) this.show_panel = !this.show_panel;
    } else if (k === 'r' || k === 'R') {
      await this.relationships();
    } else if (k === '?') {
      await this.show_lines('Help & Controls', HELP);
    } else if (k === 'esc') {
      await this.pause_menu();
    } else if (k === 'Q') {
      await this.quit_prompt();
    }
  }

  whistle_horse(): void {
    if (this.mapname !== 'farm') {
      this.msg('Your horse stays on your farm. Whistle (Shift+H) while outdoors on your farm!');
      return;
    }
    this.riding_horse = !this.riding_horse;
    this.horse_aff = Math.min(100, this.horse_aff + 1);
    this.fx_add('emote', this.px, this.py, 0.9, { emote: this.riding_horse ? 'heart' : 'note' });
    if (this.riding_horse) {
      this.msg('Wheeeet! Your horse gallops to your side! Riding at 2x speed! (Press Shift+H to dismount)', '09');
    } else {
      this.msg('You dismount and pat your horse.', '0B');
    }
  }

  ring_grazing_bell(): void {
    if (this.mapname !== 'farm') {
      this.msg('Ring the Grazing Bell (B) while on your farm to call animals outside/inside!');
      return;
    }
    if (this.chickens === 0 && this.animals.length === 0) {
      this.msg('You do not have any chickens or barn livestock yet.');
      return;
    }
    if (!this.animals_grazing) {
      if (this.weather !== 'Sunny') {
        this.fx_add('emote', this.px, this.py, 0.9, { emote: 'alert' });
        this.msg('Keep your animals indoors during Rain or Snow so they stay happy!', '08');
        return;
      }
      this.animals_grazing = true;
      this.outdoor_hours += 10;
      this.fed = this.chickens;
      this.chicken_aff = Math.min(100, this.chicken_aff + 2);
      for (const a of this.animals) {
        a.fed = true;
        a.aff = Math.min(100, a.aff + 2);
      }
      this.fx_add('emote', this.px, this.py, 0.9, { emote: 'note' });
      this.msg(`Ding-a-ling! Your animals come outside to graze in the sunshine! (+Outdoor hours: ${this.outdoor_hours}h)`, '0B');
    } else {
      this.animals_grazing = false;
      this.fx_add('emote', this.px, this.py, 0.9, { emote: 'note' });
      this.msg('Ding-a-ling! Your chickens and livestock return safely to the Coop and Barn.', '0C');
    }
  }

  async pause_menu(): Promise<void> {
    this.setBodyState('paused');
    const achList = this.achievement_list();
    const achDone = achList.filter((a) => a.done).length;
    const bagKinds = Object.keys(this.inv).length;
    const slots = listSaveSlots(getBrowserStorage());
    const dawns = readDawnBackups(getBrowserStorage());
    const entries: (HudMenuEntry & { key: string; raw: string })[] = [
      { key: 'resume', raw: 'Resume', label: 'Resume', icon: '↩', iconCol: '0C', right: '[ESC]', rightCol: '0C' },
      { key: 'today', raw: 'Today’s Plan (y)', label: "Today's Plan", icon: '☀', iconCol: '09', right: '[Y]', rightCol: '0C', hotkey: 'y' },
      { key: 'notes', raw: 'Villager Notes (r)', label: 'Villager Notes', icon: '♥', iconCol: '0A', right: '[R]', rightCol: '0C', hotkey: 'r' },
      { key: 'postcard', raw: 'Take a Postcard', label: 'Take a Postcard', icon: '▭', iconCol: '0C', right: 'Snap', rightCol: '04' },
      ...(this.postcards.length
        ? [{ key: 'album', raw: 'Postcard Album', label: 'Postcard Album', icon: '▤', iconCol: '0C', right: `${this.postcards.length}/${POSTCARD_MAX}`, rightCol: '04' }]
        : []),
      { key: 'notebook', raw: 'Field Notebook', label: 'Field Notebook', icon: '✎', iconCol: '0C', right: `${this.notebook.length} noted`, rightCol: '04' },
      {
        key: 'bag',
        raw: 'Rucksack (i)',
        label: 'Rucksack',
        icon: '▣',
        iconCol: '09',
        right: bagKinds ? `[I] ${bagKinds}` : '[I] Empty',
        rightCol: bagKinds ? '09' : '04',
        hotkey: 'i',
      },
      { key: 'ranch', raw: 'Ranch Summary & Memo (m)', label: 'Ranch Summary & Memo', icon: '▤', iconCol: '0C', right: '[M]', rightCol: '0C', hotkey: 'm' },
      {
        key: 'ach',
        raw: 'Achievements & Journal',
        label: 'Achievements & Journal',
        icon: '✦',
        iconCol: '09',
        right: `${this.ach_unread ? '★ ' : ''}${achDone}/${achList.length}`,
        rightCol: achDone > 0 ? '0B' : '04',
      },
      { key: 'mastery', raw: 'Farm Mastery', label: 'Farm Mastery', icon: '★', iconCol: '0B', right: 'Ranks', rightCol: '04' },
      { key: 'save1', raw: 'Save Diary — Slot 1', label: 'Save Diary — Slot 1', icon: '❧', iconCol: '0B', right: formatSlotBadge(slots.slot1), rightCol: slots.slot1 ? '0B' : '04' },
      { key: 'save2', raw: 'Save Diary — Slot 2', label: 'Save Diary — Slot 2', icon: '❧', iconCol: '0B', right: formatSlotBadge(slots.slot2), rightCol: slots.slot2 ? '0B' : '04' },
      { key: 'load1', raw: 'Load Diary — Slot 1', label: 'Load Diary — Slot 1', icon: '◈', iconCol: '0D', right: formatSlotBadge(slots.slot1), rightCol: slots.slot1 ? '0D' : '03' },
      { key: 'load2', raw: 'Load Diary — Slot 2', label: 'Load Diary — Slot 2', icon: '◈', iconCol: '0D', right: formatSlotBadge(slots.slot2), rightCol: slots.slot2 ? '0D' : '03' },
      ...(slots.auto
        ? [{ key: 'loadauto', raw: 'Load Auto-Save', label: 'Load Auto-Save', icon: '◈', iconCol: '0C', right: formatSlotBadge(slots.auto), rightCol: '0C' }]
        : []),
      ...(dawns.length
        ? [{ key: 'dawn', raw: 'Restore a Morning Backup', label: 'Restore a Morning Backup', icon: '☼', iconCol: '0A', right: `${dawns.length} kept`, rightCol: '0A' }]
        : []),
      {
        key: 'cues',
        raw: `Accessible Cues: ${this.scr.accessibleCues ? 'On' : 'Off'}`,
        label: 'Accessible State Cues',
        icon: '◉',
        iconCol: '0C',
        right: this.scr.accessibleCues ? 'ON' : 'OFF',
        rightCol: this.scr.accessibleCues ? '0B' : '03',
      },
      { key: 'pace', raw: `Day Pace: ${DAY_PACES[this.pace].label}`, label: 'Day Pace', icon: '◷', iconCol: '0C', right: DAY_PACES[this.pace].label, rightCol: this.pace === 'normal' ? '04' : '0B' },
      { key: 'access', raw: 'Accessibility, Assist & Keys', label: 'Accessibility & Assist', icon: '◈', iconCol: '0C', right: TEXT_SCALES[this.text_scale].label, rightCol: this.text_scale === 'normal' ? '04' : '0B' },
      { key: 'rowreserve', raw: `Row Stamina Reserve: ${this.row_reserve}`, label: 'Row Stamina Reserve', icon: '◈', iconCol: '0C', right: `${this.row_reserve}`, rightCol: '0B' },
      ...(this.first_steps
        ? [{ key: 'firststeps', raw: 'Hide First-Morning Checklist', label: 'Hide First-Morning Checklist', icon: '✓', iconCol: '0B', right: 'Hide', rightCol: '04' }]
        : []),
      { key: 'export', raw: 'Export Save File', label: 'Export Save File', icon: '↗', iconCol: '04', right: 'JSON', rightCol: '03' },
      { key: 'import', raw: 'Import Save File', label: 'Import Save File', icon: '↙', iconCol: '04', right: 'JSON', rightCol: '03' },
    ];
    if (this.inv['Waystone']) {
      entries.push({ key: 'warp', raw: 'Use Waystone', label: 'Use Waystone', icon: '✧', iconCol: '0E', right: 'Warp', rightCol: '0E' });
    }
    entries.push(
      { key: 'help', raw: 'Help (?)', label: 'Help & Controls', icon: '?', iconCol: '0C', right: '[?]', rightCol: '0C', hotkey: '?' },
      { key: 'quit', raw: 'Quit', label: 'Save & Quit to Title', icon: '×', iconCol: '08', right: 'Title', rightCol: '08' },
    );

    const sel = await this.menu(
      '▤ Diary',
      entries.map((e) => e.raw),
      0,
      null,
      null,
      {
        style: { kind: 'hud', accent: SEASON_COL[this.season_name] },
        alignToMap: true,
        banner: () => ({
          left: `${SEASON_GLYPHS[this.season]} ${this.season_name} ${this.day} (${WEEKDAYS[this.weekday]}) · Yr ${this.year}`,
          leftCol: SEASON_COL[this.season_name],
          right: `${this.gold}G`,
          rightCol: '09',
        }),
        entries,
        footerHint: '↑↓ Move · Enter Open · Esc Close',
      }
    );
    this.setBodyState('playing');
    if (sel === null || entries[sel].key === 'resume') return;
    const key = entries[sel].key;
    if (key === 'bag') {
      await this.rucksack();
    } else if (key === 'today') {
      await this.today_panel();
    } else if (key === 'notes') {
      await this.relationships();
    } else if (key === 'postcard') {
      await this.take_postcard();
    } else if (key === 'album') {
      await this.postcard_album();
    } else if (key === 'notebook') {
      await this.field_notebook();
    } else if (key === 'ranch') {
      await this.ranch_summary();
    } else if (key === 'ach') {
      await this.achievements_page();
    } else if (key === 'mastery') {
      await this.mastery_page();
    } else if (key === 'save1') {
      if (this.save(1)) this.msg('Saved game in Diary Slot 1.', '0B');
      else this.msg('Could not write save to browser storage.', '08');
    } else if (key === 'save2') {
      if (this.save(2)) this.msg('Saved game in Diary Slot 2.', '0B');
      else this.msg('Could not write save to browser storage.', '08');
    } else if (key === 'load1') {
      try {
        this.load(1);
        this.update_npcs();
        this.msg('Loaded Diary Slot 1.', '0C');
      } catch (e: any) {
        await this.say(e.message || 'No save in Slot 1.');
      }
    } else if (key === 'load2') {
      try {
        this.load(2);
        this.update_npcs();
        this.msg('Loaded Diary Slot 2.', '0C');
      } catch (e: any) {
        await this.say(e.message || 'No save in Slot 2.');
      }
    } else if (key === 'loadauto') {
      try {
        this.load('auto');
        this.update_npcs();
        this.msg('Loaded Auto-Save.', '0C');
      } catch (e: any) {
        await this.say(e.message || 'No Auto-Save found.');
      }
    } else if (key === 'dawn') {
      await this.dawn_menu();
    } else if (key === 'export') {
      this.export_save();
    } else if (key === 'import') {
      await this.import_save();
    } else if (key === 'firststeps') {
      this.end_first_steps();
      this.msg('First-morning checklist hidden.', '0C');
    } else if (key === 'pace') {
      const all = Object.keys(DAY_PACES) as DayPace[];
      const sel = await this.menu(
        'Day Pace',
        all.map((p) => `${p === this.pace ? '● ' : '○ '}${DAY_PACES[p].label}`),
        all.indexOf(this.pace),
        (i) => [`An in-game hour takes ${Math.round(DAY_PACES[all[i]].secs * 6)} s of real time.`, 'Shop hours, the 5 PM pickup and festivals keep the in-game clock.'],
      );
      if (sel !== null) this.set_pace(all[sel]);
    } else if (key === 'access') {
      await this.accessibility_menu();
    } else if (key === 'rowreserve') {
      const selected = await this.menu('Row Stamina Reserve', ROW_RESERVES.map((n) => `Keep ${n} stamina`), ROW_RESERVES.indexOf(this.row_reserve as typeof ROW_RESERVES[number]), () => ['Row work stops before spending below this limit.']);
      if (selected !== null && ROW_RESERVES[selected] !== undefined) {
        this.row_reserve = ROW_RESERVES[selected];
        this.msg(`Row work keeps ${this.row_reserve} stamina in reserve.`, '0C');
      }
    } else if (key === 'cues') {
      this.scr.accessibleCues = !this.scr.accessibleCues;
      this.msg(`Accessible state cues: ${this.scr.accessibleCues ? 'On' : 'Off'}.`, '0C');
    } else if (key === 'warp') {
      await this.use_teleport_stone();
    } else if (key === 'help') {
      await this.show_lines('Help & Controls', HELP);
    } else if (key === 'quit') {
      await this.quit_prompt();
    }
  }

  async use_teleport_stone(): Promise<void> {
    const dests: [string, string, number, number][] = [
      ['Farmhouse', 'house', 7, 5],
      ['Farm Field', 'farm', 14, 10],
      ['Market Cross (Town)', 'town', 36, 14],
      ['Brackenford Beach Pier', 'beach', 32, 10],
      ["Beacon Hill Hot Spring", 'mountain', 8, 14],
      ['Wellkeeper Pond & Copperseam Mine', 'mountain', 50, 6],
      ['Mirewater Mine Island (Beacon Hill Lake)', 'mountain', 14, 6],
      ['Cedar Hollow Clearing', 'woods', 44, 19],
      ['Skyline Ridge Lookout', 'ridge', 32, 3],
      ['Willow Bend Bridge', 'river', 30, 12],
      ['Lighthouse Point', 'point', 40, 12],
      ["Ironwood Grove (Hilde's Forge)", 'grove', 22, 18],
    ];
    const sel = await this.menu(
      'Waystone — Warp Where?',
      dests.map((d) => d[0])
    );
    if (sel !== null) {
      const [label, mp, x, y] = dests[sel];
      this.riding_horse = false;
      this.warp(mp, x, y, [0, 1]);
      this.msg(`Warped to ${label}!`, '0C');
    }
  }

  /**
   * Leaving is never the highlighted answer and has no number shortcut, so a stray confirm key
   * (the same keys that use a tool or talk) keeps the game going. Quitting saves and returns to
   * the title screen.
   */
  async quit_prompt(): Promise<void> {
    const sel = await this.menu('Save and return to the title screen?', ['Keep playing', 'Save & quit to title'], 0, null, null, {
      noDigits: true,
    });
    if (sel === 1) {
      this.save(1);
      this.to_title = true;
    }
  }

  npc_at(x: number, y: number, mapname: string | null = null): string | null {
    const mp = mapname || this.mapname;
    for (const [n, p] of Object.entries(this.npc_pos)) {
      if (p[0] === x && p[1] === y && NPCS[n]?.where && NPCS[n].where[0] === mp) {
        return n;
      }
    }
    const indoor = this.indoor_npc_at(x, y, mp);
    if (indoor) return indoor;
    if (mp === 'house' && this.married && x === SPOUSE_POS[0] && y === SPOUSE_POS[1] && !this.spouse_is_away()) {
      return this.married;
    }
    return null;
  }

  spouse_is_away(): boolean {
    const r = this.spouse_routine;
    if (!this.married || !r || r.day !== this.absday() || r.kind !== 'outing' || !r.awayHours) return false;
    return this.minutes >= r.awayHours[0] * 60 && this.minutes < r.awayHours[1] * 60;
  }

  async accessibility_menu(): Promise<void> {
    while (true) {
      const opts = [
        `Text Size: ${TEXT_SCALES[this.text_scale].label}`,
        `High-Contrast Mode: ${this.scr.highContrast ? 'ON' : 'OFF'}`,
        `Accessible State Cues (! / ≈): ${this.scr.accessibleCues ? 'ON' : 'OFF'}`,
        `Sound Effects: ${isSfxEnabled() ? 'ON' : 'OFF'}`,
        `Assist — No-Faint Mode: ${this.assist.noFaint ? 'ON' : 'OFF'}`,
        `Assist — Easier Fishing Window: ${this.assist.easyFishing ? 'ON' : 'OFF'}`,
        `Assist — Confirm Destructive Actions: ${this.assist.confirmDestructive ? 'ON' : 'OFF'}`,
        'Customize Key Bindings',
        'Back',
      ];
      const sel = await this.menu('Accessibility, Assist & Keys', opts, 0, [
        '  Settings apply immediately and persist on this browser.',
        '  Text Size increases readable prompt & touch layout sizing.',
      ]);
      if (sel === null || sel < 0 || sel >= opts.length - 1) return;
      if (sel === 0) {
        const order: TextScale[] = ['normal', 'large', 'xlarge'];
        const next = order[(order.indexOf(this.text_scale) + 1) % order.length];
        this.set_text_scale(next);
      } else if (sel === 1) {
        this.set_high_contrast(!this.scr.highContrast);
      } else if (sel === 2) {
        this.scr.accessibleCues = !this.scr.accessibleCues;
        this.msg(`Accessible state cues: ${this.scr.accessibleCues ? 'On' : 'Off'}.`, '0C');
      } else if (sel === 3) {
        this.set_sfx(!isSfxEnabled());
      } else if (sel === 4) {
        this.set_assist({ noFaint: !this.assist.noFaint });
        this.msg(`No-faint mode: ${this.assist.noFaint ? 'On' : 'Off'}.`, '0C');
      } else if (sel === 5) {
        this.set_assist({ easyFishing: !this.assist.easyFishing });
        this.msg(`Easier fishing window: ${this.assist.easyFishing ? 'On' : 'Off'}.`, '0C');
      } else if (sel === 6) {
        this.set_assist({ confirmDestructive: !this.assist.confirmDestructive });
        this.msg(`Confirm destructive actions: ${this.assist.confirmDestructive ? 'On' : 'Off'}.`, '0C');
      } else if (sel === 7) {
        await this.keybinds_menu();
      }
    }
  }

  async keybinds_menu(): Promise<void> {
    while (true) {
      const opts = [
        ...KEY_ACTION_SPECS.map((s) => `${s.label.padEnd(22)} [${keyLabelFor(s.id, this.key_bindings)}]`),
        'Reset All to Defaults',
        'Back',
      ];
      const sel = await this.menu('Key Bindings', opts, 0, [
        '  Pick an action to assign a custom letter key (arrow keys & Enter stay fixed).',
      ]);
      if (sel === null || sel < 0 || sel >= opts.length - 1) return;
      if (sel === KEY_ACTION_SPECS.length) {
        this.set_key_bindings({});
        this.msg('Key bindings reset to defaults.', '0C');
        continue;
      }
      const spec = KEY_ACTION_SPECS[sel];
      const typed = (await this.text_input(`New single key for ${spec.label} (blank = default):`, '', 1)).trim();
      const next = { ...this.key_bindings };
      if (!typed) {
        delete next[spec.id];
      } else {
        next[spec.id] = typed.toLowerCase();
      }
      this.set_key_bindings(next);
      this.msg(`${spec.label} bound to [${keyLabelFor(spec.id, this.key_bindings)}].`, '0C');
    }
  }

  walkable(mapname: string, x: number, y: number, for_npc: boolean = false): boolean {
    const m = this.maps[mapname];
    if (!m || !m.inside(x, y)) return false;
    const t = m.tile(x, y);
    // In Winter, Beacon Hill Lake water forms a frozen ice bridge from the south shore to the Mirewater Mine island!
    if (mapname === 'mountain' && this.season === 3 && t === 'water' && x >= 13 && x <= 17 && y >= 7 && y <= 14) {
      return true;
    }
    if (!TILES[t] || !TILES[t][3]) {
      return false;
    }
    const key = pkey(x, y);
    if ((this.objs[mapname] && key in this.objs[mapname]) || (this.forage[mapname] && key in this.forage[mapname])) {
      return false;
    }
    if (for_npc && (key in m.warps || (this.tilled.has(key) && mapname === 'farm'))) {
      return false;
    }
    return true;
  }

  is_out(n: string): boolean {
    if (this.fest_is_out(n) !== null) {
      return true;
    }
    const d = NPCS[n];
    if (!d || !d.out || n === this.married) {
      return false;
    }
    // Nico is mainly around in Summer unless married or high hearts
    if (n === 'Nico' && this.season !== 1 && (this.friend['Nico'] || 0) < 60) {
      return false;
    }
    if (this.weather !== 'Sunny' && !d.rain) {
      return false;
    }
    const [a, b] = d.out;
    return a * 60 <= this.minutes && this.minutes < b * 60;
  }

  update_npcs(): void {
    this.fest_sync();
    for (const [n, d] of Object.entries(NPCS)) {
      if (this.is_out(n)) {
        if (!(n in this.npc_pos) && d.where) {
          const [mp, ax, ay] = d.where;
          const spot = this.free_spot(mp, ax, ay);
          if (spot) {
            this.npc_pos[n] = spot;
          }
        }
      } else {
        delete this.npc_pos[n];
      }
    }
    this.update_indoor_npcs();
  }

  free_spot(mp: string, x: number, y: number): [number, number] | null {
    for (let r = 0; r < 7; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (
            this.walkable(mp, px, py) &&
            !this.npc_at(px, py, mp) &&
            !(mp === this.mapname && px === this.px && py === this.py)
          ) {
            return [px, py];
          }
        }
      }
    }
    return null;
  }

  move_npcs(): void {
    for (const [n, [x, y]] of Object.entries(this.npc_pos)) {
      const where = NPCS[n]?.where;
      if (!where) continue;
      const [mp, ax, ay] = where;
      if (mp !== this.mapname || py_rng().random() > 0.45) continue;
      const [dx, dy] = py_rng().choice([
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]);
      const [nx, ny] = [x + dx, y + dy];
      if (Math.abs(nx - ax) > 4 || Math.abs(ny - ay) > 3) continue;
      if (this.walkable(mp, nx, ny, true) && !this.npc_at(nx, ny) && !(nx === this.px && ny === this.py)) {
        this.npc_pos[n] = [nx, ny];
      }
    }
    this.move_indoor_npcs();
  }

  fx_add(kind: FxKind, x: number, y: number, life: number = 0.55, extra: FxExtra = {}): void {
    const born = Date.now() / 1000;
    this.fx.push({ kind, map: this.mapname, x, y, born, life: life + (extra.delay ?? 0), seed: (this.fx_seq = (this.fx_seq + 1) % 997), ...extra });
    if (this.fx.length > 36) this.fx.shift();
  }

  fx_seq: number = 0;

  /** Game feel for a tool striking something: a flash, and for heavy blows a shake. */
  fx_hit(x: number, y: number, strength: number): void {
    this.fx_add('flash', x, y, 0.14);
    if (strength > 0) this.shake_fx = { born: Date.now() / 1000, strength };
  }

  /** Something breaks: a beat of hit-pause, then debris flies and the reward floats up. */
  fx_break(x: number, y: number, stuff: 'stone' | 'wood' | 'plant', text?: string, strength: number = 1): void {
    this.fx_hit(x, y, strength);
    this.fx_add('debris', x, y, 0.55, { stuff, delay: 0.12 });
    if (text) this.fx_add('text', x, y, 1.1, { text, delay: 0.12 });
  }

  target(): [number, number] {
    return [this.px + this.face[0], this.py + this.face[1]];
  }

  async move(dx: number, dy: number): Promise<void> {
    this.face = [dx, dy];
    const [nx, ny] = [this.px + dx, this.py + dy];
    const m = this.map;
    if (!m.inside(nx, ny)) return;
    const key = pkey(nx, ny);
    if (key in m.doors) {
      await this.enter(m.doors[key]);
      return;
    }
    if (!this.walkable(this.mapname, nx, ny) || this.npc_at(nx, ny)) {
      return;
    }
    this.px = nx;
    this.py = ny;
    this.steps += 1;
    if (this.steps === 1000 || this.steps === 10000) {
      this.msg(`Pedometer milestone: ${this.steps} steps! The Wellkeeper applauds your diligence!`, '0C');
    }
    await this.fest_check();
    if (key in m.warps) {
      const [mp, wx, wy] = m.warps[key];
      this.riding_horse = false;
      this.warp(mp, wx, wy);
    } else if (m.tile(nx, ny) === 'down') {
      this.enter_mine(this.mine_floor + 1, this.mine_type);
    } else if (m.tile(nx, ny) === 'pitfall') {
      const drop = rollPitfallDrop(this.mine_floor, this.has_perk('mine_prospector'), this.assist.noFaint, () => py_rng().random());
      playSfx('pitfall');
      this.enter_mine(drop.targetFloor, this.mine_type);
      await this.spend(drop.staminaCost);
      this.msg(`You plunged down a pitfall shaft (-${drop.dropFloors} floors to B${drop.targetFloor}F, -${drop.staminaCost} stamina)!`, '09');
    } else if (m.tile(nx, ny) === 'up') {
      if (this.mine_type === 'lake') {
        this.warp('mountain', 15, 9, [0, 1]);
      } else {
        this.warp('mountain', 52, 5, [0, 1]);
      }
      this.msg('You climb back out into the fresh air.');
    }
  }

  warp(mp: string, x: number, y: number, face: [number, number] | null = null): void {
    const prev = this.mapname;
    this.mapname = mp;
    this.px = x;
    this.py = y;
    if (face) this.face = face;
    this.cam_x = null;
    this.cam_y = null;
    if (this.started && prev !== mp) {
      this.warp_fx = { born: Date.now() / 1000, duration: 0.22 };
    }
    this.update_npcs();
    if (!this.map.indoor) {
      this.msg(`~ ${this.map.title} ~`, '0C');
    }
    this.markDirty(false);
  }

  async enter(door: string): Promise<void> {
    if (door === 'house_in') {
      this.riding_horse = false;
      this.warp('house', 7, 5, [0, -1]);
    } else if (door === 'house_out') {
      this.warp('farm', 8, 6, [0, 1]);
    } else if (door === 'coop') {
      await this.coop();
    } else if (door === 'barn') {
      await this.barn();
    } else if (door === 'mine') {
      await this.prompt_mine_entry('spring');
    } else if (door === 'lakemine') {
      await this.prompt_mine_entry('lake');
    } else if (door === 'sprites') {
      await this.sprite_hut_menu();
    } else if (door === 'kai_shack') {
      await this.kai_shack_menu();
    } else {
      await this.visit(door);
    }
  }

  async prompt_mine_entry(mineType: 'spring' | 'lake'): Promise<void> {
    const maxF = mineType === 'lake' ? this.max_lake_floor : this.max_spring_floor;
    const blessed = this.goddess_gifts >= 20;
    const floors = mineElevatorFloors(maxF, blessed);
    if (floors.length > 1) {
      const fee = blessed ? 0 : ELEVATOR_STAMINA_FEE;
      const sel = await this.menu(
        `${mineType === 'lake' ? 'Mirewater Mine' : 'Copperseam Mine'} Elevator`,
        floors.map((f) => (f === 1 ? 'Floor B1F (free)' : `Floor B${f}F${fee ? ` (-${fee} stamina)` : ' (blessed)'}`)),
        0,
        ['  Discover every 25th floor to unlock permanent elevator checkpoints.'],
      );
      if (sel !== null) {
        const target = floors[sel];
        const [map, mins] = [this.mapname, this.minutes];
        if (target > 1 && fee > 0) await this.spend(fee);
        if (this.passing_out || this.mapname !== map || this.minutes < mins) return;
        this.enter_mine(target, mineType);
      }
    } else {
      this.enter_mine(1, mineType);
    }
  }

  enter_mine(floor: number, mineType: 'spring' | 'lake' = 'spring'): void {
    this.mine_type = mineType;
    this.mine_floor = Math.min(255, floor);
    if (mineType === 'spring') {
      this.max_spring_floor = Math.max(this.max_spring_floor, this.mine_floor);
    } else {
      this.max_lake_floor = Math.max(this.max_lake_floor, this.mine_floor);
    }
    const m = build_mine(this.mine_floor, this.objs, mineType);
    this.maps['mine'] = m;
    // Find hidden ladder coordinate
    let ladderPos: [number, number] | null = null;
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        if (m.t[y][x] === 'down') {
          ladderPos = [x, y];
          break;
        }
      }
    }
    this.ladder = ladderPos;
    this.pocket = null;
    this.place_pocket(m);
    this.mapname = 'mine';
    this.px = 3;
    this.py = 3;
    this.face = [1, 0];
    const biome = mineBiomeFor(this.mine_floor, mineType);
    this.msg(`${m.title} — ${biome.name}. Smash rocks with Hammer or dig soil with Hoe!`, '0C');
  }

  tool_list(): string[] {
    const tools = TOOLS.filter((t) => !(this.upgrading && this.upgrading[0] === t));
    const seeds = py_sorted(Object.keys(this.inv).filter((i) => i.endsWith(' Seeds')));
    return [...tools, ...seeds, ...((this.inv['Compost'] || 0) > 0 ? ['Compost'] : []), ...((this.inv['Plot Sign'] || 0) > 0 ? ['Plot Sign'] : []), ...[SAPLING, ...FARM_PIECE_NAMES].filter((i) => (this.inv[i] || 0) > 0)];
  }

  cycle_tool(d: number): void {
    if (this.levels[this.tool] === 5) {
      this.msg(`Your ${this.tool} is FEY and stuck to your hand! Visit Lucan at the Church.`, '08');
      return;
    }
    const tl = this.tool_list();
    if (!tl.length) return;
    const i = tl.includes(this.tool) ? tl.indexOf(this.tool) : 0;
    const nextIdx = ((i + d) % tl.length + tl.length) % tl.length;
    this.tool = tl[nextIdx];
  }

  // ---------------------------------------------------------------- first-morning checklist (mechanics task 50)
  /** The checklist's three steps, in order, with whether each is done. */
  first_steps_rows(): { key: 'till' | 'sow' | 'water'; label: string; done: boolean }[] {
    const f = this.first_steps;
    if (!f) return [];
    return [
      { key: 'till', label: 'Till soil with the Hoe', done: f.till },
      { key: 'sow', label: 'Sow your Turnip Seeds', done: f.sow },
      { key: 'water', label: 'Water the seeds', done: f.water },
    ];
  }

  /** How to do the next step, in a line for messages and Today's Plan. */
  first_steps_hint(key: 'till' | 'sow' | 'water'): string {
    if (key === 'till') return 'Equip the Hoe (2) and press SPACE on the field south of your house.';
    if (key === 'sow') return 'Equip the Turnip Seeds (F) and press SPACE on the tilled soil.';
    return 'Equip the Watering Can (5) and press SPACE on the seeds; refill it at a pond.';
  }

  /** Tick off steps from what is on the farm; say what is next, and close the list when all are done. */
  first_steps_update(): void {
    const f = this.first_steps;
    if (!f) return;
    const crops = Object.entries(this.crops).filter(([, c]) => c[0] !== 'Grass');
    const now = {
      till: f.till || this.tilled.size > 0,
      sow: f.sow || crops.length > 0,
      water: f.water || crops.some(([k]) => this.wet.has(k)),
    };
    const newly = (['till', 'sow', 'water'] as const).filter((k) => now[k] && !f[k]);
    if (!newly.length) return;
    Object.assign(f, now);
    const next = this.first_steps_rows().find((r) => !r.done);
    if (!next) {
      this.end_first_steps();
      this.msg('✓ First morning done! Water them daily; turnips are ready in 4 days. Otto ships the bin at 5 PM.', '0B');
      return;
    }
    const did = { till: 'Tilled the soil', sow: 'Sowed your first seeds', water: 'Watered them' }[newly[newly.length - 1]];
    this.msg(`✓ ${did}. Next: ${next.label.toLowerCase()}${next.key === 'sow' ? ' (Tab selects the seeds)' : ''}.`, '0B');
  }

  /** The checklist is over (done or hidden): the First Fortnight ladder takes its place. */
  end_first_steps(): void {
    this.first_steps = null;
    if (!this.fortnight.done.length) this.fortnight.active = true;
  }

  fortnight_ctx(): FortnightCtx {
    return { state: this.fortnight, shipped_total: this.shipped_total, talked: this.talked.size, museum: this.museum.length };
  }

  /** Reward each First Fortnight goal as it is met; the last one puts a keepsake on the mantel. */
  fortnight_update(): void {
    for (const g of fortnightNewly(this.fortnight_ctx())) {
      this.fortnight.done.push(g.id);
      if (g.gold) this.gold += g.gold;
      if (g.seeds) this.give(g.seeds[0], g.seeds[1]);
      const prize = [g.gold ? `+${g.gold}G` : '', g.seeds ? `+${g.seeds[1]} ${g.seeds[0]}` : ''].filter(Boolean).join(' ');
      this.msg(`✓ Fortnight ${this.fortnight.done.length}/${FORTNIGHT_GOALS.length}: ${g.label} ${prize}`, '0B');
      this.fx_add('sparkle', this.px, this.py, 0.9);
      playSfx('coin');
    }
    if (this.fortnight.active && this.fortnight.done.length >= FORTNIGHT_GOALS.length) {
      this.fortnight.active = false;
      this.keepsake(FORTNIGHT_KEEPSAKE.key, FORTNIGHT_KEEPSAKE.name, FORTNIGHT_KEEPSAKE.text);
      this.msg(`★ First Fortnight complete! The ${FORTNIGHT_KEEPSAKE.name} is on your mantel.`, '0E');
    }
  }

  /** Announce achievements earned since the last check (once each). */
  ach_check(): void {
    for (const a of achNewly(this.achievement_list(), this.ach_seen)) {
      this.ach_seen.push(a.name);
      this.ach_unread = true;
      this.msg(`Achievement: ${a.name}`, '0E');
      this.msg(`  - ${a.desc}`, '0E');
      this.fx_add('sparkle', this.px, this.py, 0.9);
      playSfx('fanfare');
    }
  }

  goals_tick(): void {
    this.fortnight_update();
    this.ach_check();
  }

  /** Pin a seed bag for fast planting and return to the previous tool with one action. */
  seed_pouch_shortcut(): void {
    if (this.levels[this.tool] === 5) {
      this.msg(`Your ${this.tool} is FEY and cannot be unequipped! Visit Lucan at Church.`, '08');
      return;
    }
    const bags = this.tool_list().filter((t) => t.endsWith(' Seeds') && (this.inv[t] || 0) > 0);
    if (!bags.length) {
      this.msg('You do not have any seed bags ready in your rucksack.', '08');
      return;
    }

    const isSeedBag = this.tool.endsWith(' Seeds');
    if (isSeedBag && this.previous_tool && this.tool_list().includes(this.previous_tool)) {
      const previous = this.previous_tool;
      this.tool = previous;
      this.previous_tool = null;
      this.msg(`Back to ${previous}.`, '0C');
      return;
    }

    if (isSeedBag) {
      this.favorite_seed = this.tool;
      this.msg(`Pinned ${this.tool} as your seed pouch shortcut.`, '0C');
      return;
    }

    const bag = this.favorite_seed && (this.inv[this.favorite_seed] || 0) > 0 ? this.favorite_seed : bags[0];
    if (this.favorite_seed && this.tool !== this.favorite_seed && this.tool_list().includes(this.favorite_seed)) {
      this.previous_tool = this.tool;
      this.tool = this.favorite_seed;
      this.msg(`Seed pouch: ${this.favorite_seed}.`, '0C');
      return;
    }

    this.favorite_seed = bag;
    this.previous_tool = this.tool;
    this.tool = bag;
    this.msg(`Seed pouch: ${bag}.`, '0C');
  }

  area(): [number, number][] {
    const lvl = this.levels[this.tool] ?? 0;
    return getToolArea(this.tool, lvl, this.px, this.py, this.face);
  }

  record_tool_use(t: string): void {
    if (!UPGRADABLE.includes(t)) return;
    this.tool_exp[t] = Math.min(400, (this.tool_exp[t] || 0) + 5);
    if (this.levels[t] === 5 && (t === 'Fishing Rod' || t === 'Axe')) {
      this.cursed_uses[t] = (this.cursed_uses[t] || 0) + 1;
      if (this.cursed_uses[t] >= 25) {
        this.levels[t] = 6;
        this.msg(`A divine light lifts the curse! Your Fey ${t} is now a HALLOWED ${t}!`, '0B');
      }
    }
  }

  /** Stamina a swing of base cost n really takes, after food buffs and mastery perks. */
  swing_cost(n: number): number {
    let cost = n;
    if (this.active_buff()?.kind === 'stamina' && cost > 1) cost -= 1;
    if (this.mapname === 'mine' && this.has_perk('mine_stamina') && cost > 1 && this.steps % 2 === 0) cost -= 1;
    return cost;
  }

  async spend(n: number): Promise<void> {
    const cost = this.swing_cost(n);
    const isCursed = this.levels[this.tool] === 5;
    const res = calculateStaminaSpend(this.stamina, this.fatigue, cost, {
      weather: this.map.indoor ? 'Sunny' : this.weather,
      minutes: this.minutes,
      hasMysticBerry: this.has_mystic_berry,
      isCursedTool: isCursed,
    });
    const prevStam = this.stamina;
    const prevFat = this.fatigue;
    if (res.fainted && this.assist.noFaint) {
      this.stamina = Math.max(1, res.stamina);
      this.fatigue = Math.min(95, res.fatigue);
      this.msg('No-faint assist: you pause to catch your breath before overdoing it.', '0C');
      return;
    }
    this.stamina = res.stamina;
    this.fatigue = res.fatigue;

    if (res.fainted) {
      await this.pass_out('Your Fatigue hit 100! You turn blue and collapse from exhaustion...');
    } else if (res.warning === 'exhausted' && prevFat < 80 && this.fatigue >= 80) {
      this.msg("You're turning blue with Fatigue! Eat, visit the Hot Spring, or sleep!", '08');
    } else if (res.warning === 'tired' && prevStam > 30 && this.stamina <= 30) {
      this.msg("You're getting tired. Eat something or soak in the Hot Spring.", '09');
    }
  }

  /** Field tools do nothing inside a building (the mine is the exception), so a swing there is free. */
  tool_can_work_here(t: string, obj?: string): boolean {
    if (!this.map.indoor || this.mapname === 'mine' || obj) return true;
    return !['Hoe', 'Axe', 'Hammer', 'Sickle', 'Watering Can'].includes(t);
  }

  async use_tool(rowTarget?: [number, number]): Promise<void> {
    const t = this.tool;
    if (!this.tool_list().includes(t)) {
      this.tool = 'Hoe';
      return;
    }
    const [tx, ty] = this.target();
    const pKey = pkey(tx, ty);
    const m = this.map;
    const objs = this.objs[this.mapname] || {};
    const obj = objs[pKey];
    const tile = m.tile(tx, ty);

    if (t.endsWith(' Seeds')) {
      await this.sow(t, [tx, ty]);
      return;
    }
    if (t === 'Compost') {
      this.spread_compost(tx, ty);
      return;
    }
    if (t === 'Plot Sign') {
      await this.place_plot_sign(tx, ty);
      return;
    }
    if (t === SAPLING) {
      if (!this.plant_orchard(tx, ty)) this.msg('Saplings go on the marked orchard spots north of the farm.');
      return;
    }
    if (isFarmPiece(t)) {
      this.place_farm_piece(tx, ty, t);
      return;
    }

    if (!this.tool_can_work_here(t, obj)) {
      this.msg(`Nothing here for the ${t}. Use it outdoors on the farm.`);
      return;
    }
    this.record_tool_use(t);
    playSfx('tool');
    if (t === 'Watering Can') this.fx_add('splash', tx, ty);
    else if (['Hoe', 'Hammer', 'Axe', 'Sickle'].includes(t)) {
      this.fx_add('dust', tx, ty);
      // the swing itself, in the tool's tier colour (copper, silver, gold...)
      this.fx_add('swing', tx, ty, 0.2, { dir: [this.face[0], this.face[1]], tier: this.levels[t] || 0 });
    }

    if (t === 'Sickle') {
      let cutCount = 0;
      let fodderGained = 0;
      for (const [qx, qy] of this.area()) {
        const qk = pkey(qx, qy);
        if (objs[qk] === 'weed') {
          delete objs[qk];
          // each cut weed blinks, then scatters leaves after a beat
          this.fx_add('flash', qx, qy, 0.12);
          this.fx_add('debris', qx, qy, 0.45, { stuff: 'plant', delay: 0.08 });
          cutCount += 1;
        } else if (this.mapname === 'farm' && this.crops[qk] && this.crops[qk][0] === 'Grass') {
          const [, age] = this.crops[qk];
          if (age >= CROPS['Grass'][2]) {
            this.crops[qk][1] = CROPS['Grass'][2] - CROPS['Grass'][3];
            fodderGained += 1;
          }
        }
      }
      if (fodderGained > 0) {
        this.give('Fodder', fodderGained);
        this.msg(`Cut pasture grass! +${fodderGained} Fodder.`, '0B');
      } else if (cutCount > 0) {
        if (this.mapname === 'farm') {
          this.compost_scraps += cutCount;
          this.msg(`Swish! Cut ${cutCount} weed${cutCount > 1 ? 's' : ''} for the compost heap (${this.compost_heap_line()}).`);
        } else {
          this.msg(`Swish! Cut ${cutCount} weed${cutCount > 1 ? 's' : ''}.`);
        }
      } else if (this.mapname === 'farm' && this.crops[pKey]) {
        this.msg("Careful! That's a growing crop.");
        return;
      }
      await this.spend(2);
    } else if (t === 'Hoe') {
      if (obj === 'dig') {
        this.dig_up(tx, ty);
        await this.spend(2);
        return;
      }
      if (this.mapname === 'mine') {
        await this.mine_dig(tx, ty);
        await this.spend(2);
        return;
      }
      if (this.mapname !== 'farm') {
        this.msg('You can only till soil on your farm (or dig in the mines).');
        return;
      } else if (this.season === 3 && !this.farm_works.greenhouse) {
        this.msg('The ground is frozen solid in Winter.');
        return;
      } else {
        let n = 0;
        for (const [qx, qy] of rowTarget ? [rowTarget] : this.area()) {
          const qk = pkey(qx, qy);
          if (this.ground_frozen(qk)) continue;
          if (this.maps['farm'].tile(qx, qy) === 'field' && !objs[qk] && !this.tilled.has(qk)) {
            this.tilled.add(qk);
            if (this.weather === 'Rain' || this.weather === 'Typhoon') {
              this.wet.add(qk);
            }
            n += 1;
            // 2% chance to unearth the Farm Field Heartseed!
            if (!this.berry_sources.includes('farm_hoe') && py_rng().random() < 0.03) {
              this.give_power_berry('farm_hoe');
            }
          }
        }
        if (!n) {
          this.msg(obj ? `There's a ${obj} in the way.` : this.season === 3 ? 'The ground is frozen solid in Winter; only the greenhouse plot can be tilled.' : "Can't till there.");
          return;
        }
      }
      await this.spend(2);
    } else if (t === 'Hammer') {
      if (obj === 'starrock') {
        delete objs[pKey];
        const gem = py_rng().choice(STAR_GEMS);
        this.give('Star Fragment');
        this.give(gem);
        this.fx_break(tx, ty, 'stone', undefined, 1);
        this.fx_add('sparkle', tx, ty, 0.9);
        this.msg(`The fallen star cracks open: a Star Fragment and a ${gem}!`, '0A');
      } else if (obj === 'stone') {
        delete objs[pKey];
        this.fx_break(tx, ty, 'stone', undefined, 0);
        this.msg('Crack! The stone shatters.');
      } else if (obj === 'boulder') {
        if ((this.levels['Hammer'] || 0) < 1) {
          this.msg('This boulder is too big. Upgrade your Hammer.');
        } else {
          this.hp[pKey] = (this.hp[pKey] ?? 6) - (1 + (this.levels['Hammer'] || 0));
          if (this.hp[pKey] <= 0) {
            delete objs[pKey];
            delete this.hp[pKey];
            this.give('Stone', 1);
            this.fx_break(tx, ty, 'stone', '+1', 2);
            this.msg('BOOM! The boulder breaks apart.');
          } else {
            this.fx_hit(tx, ty, 1);
            this.msg('Clang! The boulder cracks.');
          }
        }
      } else if (obj === 'rock') {
        delete objs[pKey];
        this.fx_break(tx, ty, 'stone', undefined, 0);
        const drop = this.mine_drop();
        if (drop) {
          this.give(drop);
          this.msg(`You found ${drop}!`, '0C');
        }
        const geode = rollMineGeodeDrop(this.mine_floor, this.mine_type, this.effective_luck(), this.has_perk('mine_prospector'), () => py_rng().random());
        if (geode) {
          this.give(geode, 1);
          this.fx_add('sparkle', tx, ty, 0.7);
          this.msg(`Uncovered a ${geode}! Bring it to Rowan at the Forge to crack open!`, '0E');
        }
        if (this.ladder && tx === this.ladder[0] && ty === this.ladder[1]) {
          m.set(tx, ty, 'down');
          this.msg("There's a ladder hidden under the rock!", '0A');
        } else if (this.mine_floor < 255 && !this.pocket?.opened && py_rng().random() < 0.07) {
          m.set(tx, ty, 'pitfall');
          this.msg('A dark pitfall shaft (○) opened beneath the rubble!', '09');
        }
      } else if (this.mapname === 'farm' && this.tilled.has(pKey) && !this.crops[pKey]) {
        if (this.assist.confirmDestructive && !(await this.confirm('Flatten this tilled soil tile?'))) {
          return;
        }
        this.tilled.delete(pKey);
        this.wet.delete(pKey);
        this.composted = this.composted.filter((k) => k !== pKey);
        this.msg('You flattened the tilled soil.');
      }
      await this.spend(2);
    } else if (t === 'Axe') {
      if (obj === 'branch') {
        delete objs[pKey];
        this.give('Lumber');
        this.fx_break(tx, ty, 'wood', '+1', 0);
        this.msg('Chop! +1 Lumber.');
      } else if (obj === 'stump') {
        if ((this.levels['Axe'] || 0) < 1) {
          this.msg('This stump is too tough. Upgrade your Axe to Copper+.');
        } else {
          this.hp[pKey] = (this.hp[pKey] ?? 6) - (1 + (this.levels['Axe'] || 0));
          if (this.hp[pKey] <= 0) {
            delete objs[pKey];
            delete this.hp[pKey];
            this.give('Lumber', 6);
            this.fx_break(tx, ty, 'wood', '+6', 2);
            this.msg('The stump splits! +6 Lumber.', '09');
          } else {
            this.fx_hit(tx, ty, 1);
            this.msg('Thunk!');
          }
        }
      } else if (tile === 'tree') {
        if (m.signs[pKey] === 'cedar_spirit' && !this.berry_sources.includes('mountain_tree')) {
          await this.cedar_spirit_event();
          return;
        }
        this.msg('This tree is too big to chop down.');
      }
      await this.spend(2);
    } else if (t === 'Watering Can') {
      const cap = CAN_CAP[this.levels['Watering Can'] || 0] + (this.has_perk('farm_can') ? 10 : 0);
      if (tile === 'water' || tile === 'fountain' || tile === 'pond') {
        this.water = cap;
        this.msg(`You fill the watering can. (${cap}/${cap})`, '0D');
        return;
      }
      if (this.water <= 0) {
        this.msg('The watering can is empty. Refill it at a pond or stream.', '08');
        return;
      }
      this.water -= 1;
      if (this.mapname === 'farm') {
        for (const [qx, qy] of rowTarget ? [rowTarget] : this.area()) {
          const qk = pkey(qx, qy);
          if (this.tilled.has(qk)) {
            this.wet.add(qk);
          }
        }
      }
      await this.spend(2);
    } else if (t === 'Fishing Rod') {
      if (this.at_trap(tx, ty)) {
        this.msg("That's the crab pot's rope. Press X to check the pot, or cast to one side.", '08');
      } else if (tile === 'water' || tile === 'pond') {
        await this.fish();
      } else {
        this.msg('You need to face water to cast your Fishing Rod.');
      }
    }
  }

  async mine_dig(tx: number, ty: number): Promise<void> {
    const m = this.map;
    if (m.tile(tx, ty) !== 'mfloor') {
      this.msg('Nothing to dig here.');
      return;
    }
    const f = this.mine_floor;
    this.mastery_add('mining');
    // Check if Mirewater Mine floor has a Fey Tool
    if (this.mine_type === 'lake' && FEY_TOOL_FLOORS[f]) {
      const cTool = FEY_TOOL_FLOORS[f];
      if ((this.levels[cTool] || 0) === 4 && py_rng().random() < 0.35) {
        this.levels[cTool] = 5;
        this.msg(`Unearthed the FEY ${cTool.toUpperCase()}! Bring it to Lucan at the Church to bless!`, '0E');
        return;
      }
    }
    // Check Heartseeds in mines
    if (this.mine_type === 'spring' && f === 100 && !this.berry_sources.includes('spring_100')) {
      this.give_power_berry('spring_100');
      return;
    }
    if (this.mine_type === 'lake' && f === 19 && !this.berry_sources.includes('lake_19')) {
      this.give_power_berry('lake_19');
      return;
    }
    // Check Copperseam Mine Floor 255 Waystone
    if (this.mine_type === 'spring' && f === 255 && !this.inv['Waystone']) {
      this.give('Waystone', 1);
      this.msg('Unearthed the legendary WAYSTONE on Floor 255!', '0C');
      return;
    }
    // Check Wellkeeper / Reed Heron Jewels
    if (this.mine_type === 'spring' && (GODDESS_JEWEL_FLOORS as readonly number[]).includes(f) && this.goddess_jewels < 9 && py_rng().random() < 0.4) {
      this.goddess_jewels += 1;
      if (this.goddess_jewels >= 9) {
        this.give('Gem of the Wellkeeper', 1);
        this.msg('All 9 Wellkeeper Jewels united into the GEM OF THE WELLKEEPER!', '0C');
      } else {
        this.msg(`Found a Wellkeeper Jewel! (${this.goddess_jewels}/9)`, '0C');
      }
      return;
    }
    if (this.mine_type === 'lake' && (KAPPA_JEWEL_FLOORS as readonly number[]).includes(f) && this.kappa_jewels < 9 && py_rng().random() < 0.4) {
      this.kappa_jewels += 1;
      if (this.kappa_jewels >= 9) {
        this.give('Gem of the Reed Heron', 1);
        this.msg('All 9 Reed Heron Jewels united into the GEM OF THE REED HERON!', '0B');
      } else {
        this.msg(`Found a Reed Heron Jewel! (${this.kappa_jewels}/9)`, '0B');
      }
      return;
    }
    const r = py_rng().random();
    if (r < 0.22 && f < 255 && !this.pocket?.opened) {
      m.set(tx, ty, 'down');
      this.msg('Your Hoe uncovered a hidden staircase down (>)', '0A');
    } else if (r < 0.30 && f < 255 && !this.pocket?.opened) {
      m.set(tx, ty, 'pitfall');
      this.msg('Your Hoe opened a pitfall shaft (○)! Step in to drop multiple floors.', '09');
    } else if (r < 0.52) {
      this.give('Nightshade', 1);
      this.msg('Dug up Nightshade! (+15 Stamina if eaten)', '0B');
    } else if (r < 0.68) {
      const coins = py_rng().randint(10, 50);
      this.gold += coins;
      this.msg(`Dug up ${coins}G in old coins!`, '09');
    } else {
      this.msg('You dig the mine soil, but find nothing.');
    }
  }

  mine_drop(): string | null {
    const allBlessed = UPGRADABLE.every((t) => (this.levels[t] || 0) >= 6);
    let rngPct = py_rng().random() * 100;
    const luckShift = this.effective_luck() * 2 + (this.has_perk('mine_ore') ? 6 : 0) + (this.active_buff()?.kind === 'mining' ? 5 : 0);
    rngPct = clamp(rngPct - luckShift, 0, 99.9);
    if (this.mine_type === 'lake') {
      return rollLakeMineDrop(this.mine_floor, rngPct);
    }
    return rollSpringMineDrop(this.mine_floor, allBlessed, rngPct);
  }

  // ---------------------------------------------------------------- mine side chambers (mechanics task 40)
  /** Now and then, seal a side chamber into a wall beside open floor, away from the way in. */
  place_pocket(m: GameMap): void {
    const f = this.mine_floor;
    if (f < POCKET_MIN_FLOOR || f >= 255) return;
    const rng = py_rng();
    if (rng.random() >= POCKET_CHANCE) return;
    const spots: [number, number][] = [];
    for (let y = 1; y < m.h - 1; y++) {
      for (let x = 1; x < m.w - 1; x++) {
        // interior walls only: opening one must not hole the cave's outer edge
        if (m.tile(x, y) !== 'mwall' || Math.abs(x - 3) + Math.abs(y - 3) < 6) continue;
        const open = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).some(([dx, dy]) => m.tile(x + dx, y + dy) === 'mfloor');
        if (open) spots.push([x, y]);
      }
    }
    if (!spots.length) return;
    const [x, y] = spots[rng.randint(0, spots.length - 1)];
    const kinds = Object.keys(POCKETS) as PocketKind[];
    let roll = rng.random() * kinds.reduce((a, k) => a + POCKETS[k].weight, 0);
    let kind = kinds[0];
    for (const k of kinds) {
      roll -= POCKETS[k].weight;
      if (roll < 0) { kind = k; break; }
    }
    m.set(x, y, POCKETS[kind].tile);
    this.pocket = { x, y, kind, opened: false };
  }

  /** After loading a save on a mine floor: put the sealed wall back, or keep the shaft buried. */
  restore_pocket(m: GameMap): void {
    const p = this.pocket;
    if (!p || !m.inside(p.x, p.y)) {
      this.pocket = null;
      return;
    }
    if (!p.opened) {
      m.set(p.x, p.y, POCKETS[p.kind].tile);
      return;
    }
    this.bury_shaft(m);
  }

  /** Rubble fills the way down: no ladder, revealed or hidden. */
  bury_shaft(m: GameMap): void {
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        if (m.t[y][x] === 'down') m.t[y][x] = 'mfloor';
      }
    }
    this.ladder = null;
  }

  /** What a chamber of this kind holds on this floor. */
  pocket_loot(kind: PocketKind): { items: Record<string, number>; gold: number } {
    const f = this.mine_floor;
    const lake = this.mine_type === 'lake';
    const rng = py_rng();
    const items: Record<string, number> = {};
    let gold = 0;
    if (kind === 'seam') {
      for (let n = 0; n < 3; n++) {
        for (let t = 0; t < 40; t++) {
          const pct = rng.random() * 100;
          const it = lake ? rollLakeMineDrop(f, pct) : rollSpringMineDrop(f, false, pct);
          if (it && it !== 'Junk Ore') {
            items[it] = (items[it] || 0) + 1;
            break;
          }
        }
      }
    } else if (kind === 'geode') {
      // the rarest stone this floor can give: the first row of its drop table
      const it = lake ? rollLakeMineDrop(f, 0) : rollSpringMineDrop(f, false, 0);
      if (it) items[it] = 1;
    } else {
      items['Nightshade'] = 2;
      gold = rng.randint(40, 90);
    }
    return { items, gold };
  }

  /** The sealed wall: read its pattern, then choose between the pocket and the way down. */
  async pocket_menu(): Promise<void> {
    const p = this.pocket;
    if (!p || p.opened) return;
    const P = POCKETS[p.kind];
    const ladderSeen = !!this.ladder && this.map.tile(this.ladder[0], this.ladder[1]) === 'down' && !this.objs.mine?.[pkey(this.ladder[0], this.ladder[1])];
    const info = [
      `  ${P.look}`,
      this.pockets_read.includes(p.kind) ? `  Last time, a wall like this hid ${P.holds}.` : `  You haven't broken into a wall like this before.`,
      `  Breaking in takes ${POCKET_MINUTES} min and shakes the whole floor.`,
      ladderSeen ? '  The ladder you found would be buried. You would climb out after.' : '  The way down would be buried. You would climb out after.',
    ];
    const sel = await this.menu('Side chamber', ['Break in', 'Leave it for the ladder'], 1, info);
    if (sel !== 0) return;
    if (this.stamina < POCKET_STAMINA) {
      this.msg("You're too tired to break through. Rest first.", '0C');
      return;
    }
    this.stamina -= POCKET_STAMINA;
    await this.advance(POCKET_MINUTES);
    const loot = this.pocket_loot(p.kind);
    for (const [it, n] of Object.entries(loot.items)) this.give(it, n);
    this.gold += loot.gold;
    this.map.set(p.x, p.y, 'mfloor');
    p.opened = true;
    if (!this.pockets_read.includes(p.kind)) this.pockets_read.push(p.kind);
    this.bury_shaft(this.map);
    this.mastery_add('mining');
    this.fx_break(p.x, p.y, 'stone', undefined, 0);
    const got = [...Object.entries(loot.items).map(([it, n]) => (n > 1 ? `${n} ${it}` : it)), ...(loot.gold ? [`${loot.gold}G in old coins`] : [])];
    this.msg(`The wall gives way: ${got.join(', ') || 'nothing but dust'}.`, '0E');
    this.msg('Rock rumbles down the shaft. The way down is buried, so take the ladder up.', '0C');
    this.markDirty(false);
  }

  // ---------------------------------------------------------------- seed saving (mechanics task 19)
  seed_recipe(crop: string): { crop: string; need: number; bags: number } | null {
    return SEED_SAVING.find((r) => r.crop === crop) ?? (HYBRID_CROPS.has(crop) ? { crop, need: 3, bags: 1 } : null);
  }

  /** What saving seeds from this crop costs and gives, in lines for the preview. */
  seed_saving_preview(crop: string): string[] {
    const r = this.seed_recipe(crop);
    if (!r) return [];
    const d = CROPS[crop];
    const bag = `${crop} Seeds`;
    const regrow = d[3] ? `, regrows every ${d[3]}d` : '';
    return [
      `Gives ${r.bags} bag of ${bag}: sows 3x3, ${d[2]} days to grow${regrow}.`,
      `Hollis sells the bag for ${d[1] * r.bags}G; ${r.need} ${crop} would ship for ${ITEMS[crop][0] * r.need}G.`,
      `You have ${this.inv[crop] || 0} ${crop} and ${this.inv[bag] || 0} ${bag}. Sow in ${d[0]}.`,
    ];
  }

  /** Dry the seeds: take the crop, give the bag. False if there are too few or no recipe. */
  save_seeds(crop: string): boolean {
    const r = this.seed_recipe(crop);
    if (!r || (this.inv[crop] || 0) < r.need) return false;
    this.take(crop, r.need);
    if (this.held === crop && !this.inv[crop]) this.held = null;
    this.give(`${crop} Seeds`, r.bags);
    this.msg(`You set ${r.need} ${crop} aside and dried the seeds: +${r.bags} ${crop} Seeds.`, '0B');
    return true;
  }

  /** Preview first; the highlighted answer keeps the crop, so a stray key never uses it up. */
  async seed_saving_menu(crop: string): Promise<void> {
    const r = this.seed_recipe(crop);
    if (!r) return;
    if ((this.inv[crop] || 0) < r.need) {
      await this.say(`Seed saving takes ${r.need} ${crop}; you have ${this.inv[crop] || 0}. Harvest a few more and set them aside.`, null);
      return;
    }
    const opts = [`Keep the ${crop}`, `Save seeds from ${r.need} ${crop}`];
    const sel = await this.menu(`Save ${crop} seeds?`, opts, 0, this.seed_saving_preview(crop), null, {
      style: { kind: 'hud', accent: '0B' },
      alignToMap: true,
      noDigits: true,
    });
    if (sel === 1) this.save_seeds(crop);
  }

  // ---------------------------------------------------------------- planting forecast (mechanics task 24)
  /**
   * When a crop sown now (or on the first day of its season, if that is another season) would be
   * picked, watered every day. Null for Grass, which is cut for fodder rather than harvested.
   */
  crop_forecast(crop: string): { season: string; from: number; first: number | null; repeats: number[]; grow: number; regrow: number } | null {
    const d = CROPS[crop];
    if (!d || crop === 'Grass') return null;
    const season = d[0] === 'All' ? this.season_name : d[0];
    const from = season === this.season_name ? this.day : 1;
    return { season, from, grow: d[2], regrow: d[3], ...plantingForecast(from, d[2], d[3]) };
  }

  /** "Sown today: first harvest Spring 16, then every 5d: 21 and 26 (last Spring 26)." and the like. */
  crop_forecast_lines(crop: string): string[] {
    const f = this.crop_forecast(crop);
    if (!f) return [];
    const when = f.season === this.season_name ? 'Sown today' : `Sown on ${f.season} 1`;
    if (f.first === null) {
      return [`${when}: too late, it needs ${f.grow} days and ${f.season} ends on the 30th.`];
    }
    if (!f.regrow) return [`${when}: ready ${f.season} ${f.first}.`];
    if (!f.repeats.length) {
      return [`${when}: ready ${f.season} ${f.first}; no regrowth before ${f.season} ends.`];
    }
    const last = f.repeats[f.repeats.length - 1];
    return [`${when}: ready ${f.season} ${f.first}, then every ${f.regrow}d: ${f.repeats.length + 1} pickings, the last on ${f.season} ${last}.`];
  }

  /** A few words for the Facing row: "ready Spring 16" or "too late to ripen". */
  crop_forecast_short(crop: string): string | null {
    const f = this.crop_forecast(crop);
    if (!f || f.season !== this.season_name) return null;
    if (f.first === null) return 'too late to ripen';
    return f.repeats.length ? `ready ${f.season.slice(0, 3)} ${f.first}, ${f.repeats.length + 1} pickings` : `ready ${f.season.slice(0, 3)} ${f.first}`;
  }

  // ---------------------------------------------------------------- crab pot (mechanics task 39)
  at_trap(x: number, y: number): boolean {
    return this.mapname === TRAP_SPOT[0] && x === TRAP_SPOT[1] && y === TRAP_SPOT[2];
  }

  /** 'up' (on the pier, empty), 'set' (down, not yet a day), or 'ready' (set on an earlier day). */
  trap_state(): 'up' | 'set' | 'ready' {
    if (!this.trap) return 'up';
    return this.absday() > this.trap.day ? 'ready' : 'set';
  }

  /** The cheapest fish in the rucksack, for bait. */
  trap_bait(): string | null {
    const fish = Object.keys(this.inv).filter((i) => (this.inv[i] || 0) > 0 && ITEMS[i]?.[2] === 'fish');
    fish.sort((a, b) => (ITEMS[a][0] || 0) - (ITEMS[b][0] || 0) || a.localeCompare(b));
    return fish[0] ?? null;
  }

  /** Lower the pot, baited with a fish from the rucksack or not. */
  trap_set(bait: string | null): boolean {
    if (this.trap) return false;
    if (bait) {
      if ((this.inv[bait] || 0) <= 0 || ITEMS[bait]?.[2] !== 'fish') return false;
      this.take(bait, 1);
    }
    this.trap = { day: this.absday(), bait };
    this.msg(
      bait
        ? `You baited the crab pot with a ${bait} and lowered it. Haul it on your next trip.`
        : 'You lowered the crab pot without bait. Haul it on your next trip and see what wandered in.',
      '0B',
    );
    return true;
  }

  /** Pull the pot up: a baited pot holds two crabs (sometimes a mackerel too); an unbaited one is a gamble. */
  trap_haul(): string | null {
    if (this.trap_state() !== 'ready') return null;
    const baited = !!this.trap!.bait;
    this.trap = null;
    const r = py_rng().random();
    const got: [string, number][] = baited
      ? r < 0.3 ? [['Crab', 2], ['Mackerel', 1]] : [['Crab', 2]]
      : r < 0.4 ? [['Crab', 1]] : r < 0.8 ? [['Small Fish', 1]] : [];
    for (const [item, n] of got) {
      this.give(item, n);
      this.note_first(item);
      this.fish_caught[item] = (this.fish_caught[item] || 0) + n;
    }
    const line = got.length
      ? `You hauled up the crab pot: ${andList(got.map(([i, n]) => `${n} ${i}`))}!`
      : 'You hauled up the crab pot: just seaweed. A fish for bait would do better.';
    this.msg(line, got.length ? '0B' : '08');
    if (this.mapname === TRAP_SPOT[0]) this.fx_add('splash', TRAP_SPOT[1], TRAP_SPOT[2]);
    return line;
  }

  /** The pot at the end of the pier: set it with a bait decision, or haul it on a later day. */
  async trap_menu(): Promise<void> {
    while (true) {
      const st = this.trap_state();
      if (st === 'set') {
        const b = this.trap!.bait;
        await this.say(`The crab pot is down${b ? `, baited with a ${b}` : ', unbaited'}. Haul it tomorrow or on any later trip.`, null);
        return;
      }
      if (st === 'ready') {
        const line = this.trap_haul();
        if (line) await this.say(line, null);
        continue;
      }
      const bait = this.trap_bait();
      const info = [
        "  Nico's old crab pot hangs off the end of the pier.",
        '  Set it now and haul it on your next trip (tomorrow or later).',
        '  A fish for bait draws crabs: 2 Crab, sometimes a Mackerel too.',
        '  Unbaited it is a gamble: a Crab, a Small Fish, or seaweed.',
      ];
      const opts = [...(bait ? [`Bait with a ${bait} and lower it`] : []), 'Lower it without bait', 'Leave'];
      const sel = await this.menu('Crab Pot', opts, 0, bait ? info : [...info, '  (No fish in your rucksack to use as bait.)']);
      if (sel === null || opts[sel] === 'Leave') return;
      this.trap_set(opts[sel].startsWith('Bait') ? bait : null);
      return;
    }
  }

  // ---------------------------------------------------------------- compost (mechanics task 18)
  /** 'heap 3/5' or 'heap: 1 Compost by morning, 2/5 more' */
  compost_heap_line(): string {
    const ready = Math.floor(this.compost_scraps / COMPOST_SCRAPS);
    const rest = this.compost_scraps % COMPOST_SCRAPS;
    return ready ? `heap: ${ready} Compost by morning, ${rest}/${COMPOST_SCRAPS} more` : `heap ${rest}/${COMPOST_SCRAPS}`;
  }

  /** Set view of `composted` (the array stays the saved form); rebuilt when the array is replaced or grows. */
  compost_has(k: string): boolean {
    if (this.compost_arr !== this.composted || this.compost_len !== this.composted.length) {
      this.compost_arr = this.composted;
      this.compost_len = this.composted.length;
      this.compost_set = new Set(this.composted);
    }
    return this.compost_set.has(k);
  }

  /** Extra harvest from a composted tile (its next picking only). */
  compost_bonus(pKey: string): number {
    return this.compost_has(pKey) ? COMPOST_BONUS : 0;
  }

  /** Put crops from the rucksack on the heap. Returns how many went on. */
  compost_crop(item: string, qty: number): number {
    if (ITEMS[item]?.[2] !== 'crop') return 0;
    const n = Math.min(qty, this.inv[item] || 0);
    if (n <= 0) return 0;
    this.take(item, n);
    this.compost_scraps += n;
    this.msg(`${n} ${item} went on the compost heap (${this.compost_heap_line()}).`, '0B');
    return n;
  }

  /** Spread one Compost on the tilled tile ahead. */
  spread_compost(tx: number, ty: number): boolean {
    const k = pkey(tx, ty);
    if ((this.inv['Compost'] || 0) <= 0) return false;
    if (this.mapname !== 'farm' || !this.tilled.has(k)) {
      this.msg('Spread compost on tilled soil on your farm.', '08');
      return false;
    }
    if (this.compost_has(k)) {
      this.msg('That soil is already dressed with compost.', '08');
      return false;
    }
    this.take('Compost', 1);
    this.composted.push(k);
    this.fx_add('dust', tx, ty);
    const crop = this.crops[k]?.[0];
    this.msg(`You spread compost: ${crop ? `this ${crop}'s` : 'the'} next harvest here gives ${1 + COMPOST_BONUS}.`, '0B');
    if (!this.inv['Compost']) this.tool = 'Hoe';
    return true;
  }

  /** Overnight the heap rots down: every COMPOST_SCRAPS scraps make one Compost. */
  compost_day(report: string[]): void {
    const n = Math.floor(this.compost_scraps / COMPOST_SCRAPS);
    this.composted = this.composted.filter((k) => this.tilled.has(k));
    if (!n) return;
    this.compost_scraps -= n * COMPOST_SCRAPS;
    this.give('Compost', n);
    report.push(`The compost heap rotted down: +${n} Compost. Spread it on tilled soil for a bigger next harvest.`);
  }

  // ---------------------------------------------------------------- companion planting (mechanics task 17)
  /** The eight farm tiles that touch this one. */
  companion_ring(pKey: string): string[] {
    const [x, y] = parseCoordKey(pKey);
    const ring: string[] = [];
    for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) if (dx || dy) ring.push(pkey(x + dx, y + dy));
    return ring;
  }

  /** Extra harvest for the crop on this tile: a Cucumber with a Duskbell Flower in bloom beside it. */
  companion_bonus(pKey: string): number {
    const c = this.crops[pKey];
    if (!c || c[0] !== COMPANION.crop) return 0;
    const blooms = this.companion_ring(pKey).some((k) => {
      const n = this.crops[k];
      return !!n && n[0] === COMPANION.helper && n[1] >= CROPS[COMPANION.helper][2];
    });
    return blooms ? COMPANION.bonus : 0;
  }

  /** What checking a growing crop says about its companion, if it has one. */
  companion_note(pKey: string): string {
    const c = this.crops[pKey];
    if (!c || c[0] !== COMPANION.crop) return '';
    if (this.companion_bonus(pKey)) return ` A ${COMPANION.helper} in bloom beside it: ${1 + COMPANION.bonus} a picking.`;
    const planted = this.companion_ring(pKey).some((k) => this.crops[k]?.[0] === COMPANION.helper);
    return planted ? ` The ${COMPANION.helper} beside it will draw bees once it blooms.` : '';
  }

  /**
   * What a seed bag aimed at (tx, ty) would do for the pairing: the tiles to mark and a line for
   * FACING. Cucumber seeds: the tiles they would land on that touch a Duskbell. Duskbell seeds:
   * the Cucumber vines the new flowers would touch. Null for any other bag, or no pairing.
   */
  companion_preview(tool: string, tx: number, ty: number): { cells: string[]; text: string } | null {
    if (this.mapname !== 'farm' || !tool.endsWith(' Seeds')) return null;
    const crop = tool.slice(0, -6);
    if (crop !== COMPANION.crop && crop !== COMPANION.helper) return null;
    const sown: string[] = [];
    for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) {
      const k = pkey(tx + dx, ty + dy);
      if (this.tilled.has(k) && !this.crops[k]) sown.push(k);
    }
    const isCrop = (k: string, name: string) => this.crops[k]?.[0] === name;
    if (crop === COMPANION.crop) {
      const cells = sown.filter((k) => this.companion_ring(k).some((n) => isCrop(n, COMPANION.helper)));
      return cells.length ? { cells, text: `${cells.length} by ${COMPANION.helper.split(' ')[0]}: ${1 + COMPANION.bonus} a picking` } : null;
    }
    const sownSet = new Set(sown);
    const cells = Object.keys(this.crops).filter((k) => isCrop(k, COMPANION.crop) && this.companion_ring(k).some((n) => sownSet.has(n)));
    return cells.length ? { cells, text: `helps ${cells.length} ${COMPANION.crop}: +${COMPANION.bonus} a picking` } : null;
  }

  async sow(bag: string, p: [number, number]): Promise<void> {
    const crop = bag.slice(0, -6);
    if (this.mapname !== 'farm') {
      this.msg('You can only plant seeds on your farm.');
      return;
    }
    const cropSeason = CROPS[crop][0];
    const offSeason = crop !== 'Grass' && cropSeason !== this.season_name;
    if (offSeason && !this.farm_works.greenhouse) {
      this.msg(`${crop} won't grow in ${this.season_name}.`, '08');
      return;
    }
    let n = 0;
    const sowed: string[] = [];
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        const qk = pkey(p[0] + dx, p[1] + dy);
        if (offSeason && !GLASS_SET.has(qk)) continue;
        if (this.tilled.has(qk) && !this.crops[qk]) {
          this.crops[qk] = [crop, 0];
          sowed.push(qk);
          n += 1;
        }
      }
    }
    if (!n) {
      this.msg(offSeason ? `${crop} only grows in ${this.season_name} under glass. Sow inside the greenhouse.` : 'Seeds need empty tilled soil. Use the Hoe first.');
      return;
    }
    this.take(bag);
    const paired = crop === COMPANION.crop
      ? sowed.filter((k) => this.companion_ring(k).some((r) => this.crops[r]?.[0] === COMPANION.helper)).length
      : crop === COMPANION.helper
        ? Object.keys(this.crops).filter((k) => this.crops[k][0] === COMPANION.crop && this.companion_ring(k).some((r) => sowed.includes(r))).length
        : 0;
    this.msg(`You sowed ${crop} seeds on ${n} tile${n > 1 ? 's' : ''}.${paired ? ` ${paired} ${COMPANION.crop} ${paired > 1 ? 'plants are' : 'plant is'} paired with ${COMPANION.helper}.` : ''}`, '0B');
    if (!this.inv[bag]) {
      this.tool = 'Watering Can';
    }
    await this.spend(1);
  }

  async fish(): Promise<void> {
    const fastFactor = (this.has_perk('fish_bite') ? 0.75 : 1) * (this.active_buff()?.kind === 'fishing' ? 0.85 : 1) * (this.effective_luck() > 0 ? 0.9 : 1);
    const wait = Math.max(0.5, py_rng().uniform(1.0, 3.2) * fastFactor);
    const biteWindow = 0.95 + (this.assist.easyFishing ? 1.85 : 0) + (this.has_perk('fish_bite') ? 0.35 : 0) + (this.active_buff()?.kind === 'fishing' ? 0.25 : 0);
    const start = Date.now() / 1000;
    let bite: number | null = null;
    let result: string | null = null;
    // The key that cast the line is often still down, and a held key repeats. Those repeats are not
    // a reel: keys are ignored until the stream that started with the cast has gone quiet.
    let castHeldUntil = start + FISH_CAST_GRACE;
    while (result === null) {
      const now = Date.now() / 1000;
      if (bite === null && now - start >= wait) {
        bite = now;
        playSfx('fish_bite');
      }
      if (bite !== null && now - bite > biteWindow) {
        result = 'miss';
        break;
      }
      const [W, H] = [this.scr.w, this.scr.h];
      const draw = () => {
        const [bx, by] = [Math.floor((W - 34) / 2), Math.floor(H / 2) - 3];
        this.scr.box(bx, by, 34, 5, '0D', '00', 'Fishing');
        if (bite === null) {
          const dots = '.'.repeat(1 + (Math.floor((now - start) * 2) % 3));
          this.scr.put(bx + 3, by + 2, `~ ~ o ~ ~   waiting${dots}`, '0D');
        } else {
          this.scr.put(bx + 3, by + 2, '~ ~ O ~ ~   !! BITE !! SPACE', '08', '00', true);
        }
      };
      this.render();
      draw();
      this.scr.flush();
      const k = await this.scr.getKey(0.05);
      if (k) {
        const at = Date.now() / 1000;
        if (CANCEL_KEYS.has(k)) {
          result = 'quit';
        } else if (at < castHeldUntil) {
          castHeldUntil = at + FISH_REPEAT_GAP;
        } else if (!OK_KEYS.has(k)) {
          // moving a thumb across the pad or brushing another key does not pull the line in
        } else if (bite === null) {
          result = 'early';
        } else {
          result = 'catch';
        }
      }
    }
    let hookedTreasure = false;
    let caughtPreview: string | null = null;
    if (result === 'catch' && !this.assist.easyFishing) {
      caughtPreview = this.roll_catch();
      let fState = createFishingState(caughtPreview, {
        steadyFloat: this.has_perk('fish_bite'),
        masterAngler: this.has_perk('fish_angler'),
        anglerBuff: this.active_buff()?.kind === 'fishing',
        luck: this.effective_luck(),
        rng: () => py_rng().random(),
      });
      let lastTick = Date.now() / 1000;
      let reelUntil = lastTick + 0.16;
      while (fState.status === 'playing') {
        const now = Date.now() / 1000;
        const dt = now - lastTick;
        lastTick = now;
        const reelHeld = now < reelUntil;
        fState = stepFishingState(fState, reelHeld, dt, () => py_rng().random());
        const [W, H] = [this.scr.w, this.scr.h];
        const bar = renderFishingBar(fState);
        const [bx, by] = [Math.floor((W - 38) / 2), Math.floor(H / 2) - 4];
        this.render();
        this.scr.box(bx, by, 38, 7, '0D', '00', 'Reel It In!');
        this.scr.put(bx + 3, by + 2, bar.track, fState.onTarget ? '0B' : '08', '00', true);
        this.scr.put(bx + 3, by + 3, `Catch ${bar.meter}`, fState.onTarget ? '0B' : '09');
        this.scr.put(
          bx + 3,
          by + 4,
          bar.chestNote ? `Tap SPACE/RIGHT · ${bar.chestNote}` : 'Tap SPACE / RIGHT to reel!',
          bar.chestNote ? '0A' : '05',
        );
        this.scr.flush();
        const k = await this.scr.getKey(0.05);
        if (k) {
          if (CANCEL_KEYS.has(k)) {
            result = 'quit';
            break;
          }
          if (OK_KEYS.has(k) || k === 'RIGHT' || k === 'UP' || k === 'd' || k === 'D' || k === 'w' || k === 'W') {
            reelUntil = Date.now() / 1000 + 0.24;
          }
        }
      }
      if (result !== 'quit') {
        result = fState.status === 'caught' ? 'catch' : 'miss';
        hookedTreasure = fState.status === 'caught' && fState.chestClaimed;
      }
    }
    this.last = Date.now() / 1000;
    if (result === 'catch') {
      const caught = caughtPreview ?? this.roll_catch();
      const [tx, ty] = this.target();
      this.give(caught);
      playSfx('fish_catch');
      this.fx_add('splash', tx, ty, 0.7);
      if (ITEMS[caught]?.[2] === 'fish') {
        this.note_first(caught);
        this.contest_catch(caught);
        this.fish_caught[caught] = (this.fish_caught[caught] || 0) + 1;
        this.mastery_add('fishing');
      }
      let extra = '';
      if (hookedTreasure) {
        const loot = rollFishingTreasure(this.season, this.effective_luck(), () => py_rng().random());
        if (loot.gold) this.gold += loot.gold;
        if (loot.item) this.give(loot.item, loot.qty ?? 1);
        playSfx('fanfare');
        this.fx_add('coin', tx, ty, 0.9);
        extra = ` + Sunken Treasure: ${loot.label}!`;
      }
      if (caught === REGION_CATCH[this.mapname]?.rare) {
        this.fx_add('sparkle', tx, ty, 0.9);
        this.msg(`A rare catch: ${caught}!${extra}`, '0C');
      } else {
        this.msg(`You caught ${/^[AEIOU]/.test(caught) ? 'an' : 'a'} ${caught}!${extra}`, '0C');
      }
    } else if (result === 'early') {
      this.msg('You reeled in too early.');
    } else if (result === 'miss') {
      this.msg('It got away...');
    }
    await this.spend(3);
  }

  /** A recognizable pocket only applies when the faced tile is water. */
  fish_pocket(map: string, x: number, y: number): (typeof FISH_POCKETS)[number] | undefined {
    const tile = this.maps[map]?.tile(x, y);
    if (tile !== 'water' && tile !== 'pond') return undefined;
    return FISH_POCKETS.find((p) => p.map === map && p.x === x && p.y === y);
  }

  /** What bites here: Willow Bend and Lighthouse Point have their own tables; elsewhere the valley-wide odds. */
  roll_catch(): string {
    const rodLvl = this.levels['Fishing Rod'] || 0;
    const table = REGION_CATCH[this.mapname];
    if (table) {
      const [x, y] = this.target();
      const favored = this.fish_pocket(this.mapname, x, y)?.fish;
      return rollRegionCatch(table, { season: this.season, weather: this.weather, rodLvl, favored }, () => py_rng().random());
    }
    if (this.mapname === 'mine' && this.mine_type === 'lake' && this.mine_floor === 9) return 'Coelacanth';
    const odds = valleyCatchOdds({ map: this.mapname, season: this.season, rodLvl });
    const caught = rollCatch(odds, py_rng().random());
    // the beach's special catch (first in its odds) brings a Heartseed with it in winter
    if (this.mapname === 'beach' && rodLvl >= 4 && caught === odds[0][0] && this.season === 3 && !this.berry_sources.includes('ocean_fish')) {
      this.give_power_berry('ocean_fish');
    }
    return caught;
  }

  /** What a cast on this map can bring up today, with the chance of each per landed catch. */
  catch_odds(mapname: string): CatchOdds {
    const rodLvl = this.levels['Fishing Rod'] || 0;
    const table = REGION_CATCH[mapname];
    return table
      ? regionCatchOdds(table, { season: this.season, weather: this.weather, rodLvl })
      : valleyCatchOdds({ map: mapname, season: this.season, rodLvl });
  }

  /** Outdoor maps with water to cast into. */
  fishing_maps(): string[] {
    return Object.keys(this.maps).filter((name) => {
      const m = this.maps[name];
      if (m.indoor || name === 'mine') return false;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.tile(x, y) === 'water' || m.tile(x, y) === 'pond') return true;
      return false;
    });
  }

  /**
   * Every fish that bites somewhere today with the rod in hand: its best water and the chance per
   * landed catch there. The request board and its hints both read from this, so the board cannot
   * ask for a fish the valley will not give up.
   */
  fishing_guide(): { item: string; where: string; chance: number }[] {
    const best = new Map<string, { titles: string[]; chance: number }>();
    for (const name of this.fishing_maps()) {
      for (const [item, chance] of this.catch_odds(name)) {
        if (ITEMS[item]?.[2] !== 'fish') continue;
        const cur = best.get(item);
        if (!cur || chance > cur.chance + 1e-9) best.set(item, { titles: [this.maps[name].title], chance });
        else if (Math.abs(chance - cur.chance) <= 1e-9) cur.titles.push(this.maps[name].title);
      }
    }
    return [...best.entries()].map(([item, b]) => ({
      item,
      chance: b.chance,
      where: b.titles.length > 2 ? 'most ponds, lakes and shores' : b.titles.join(' or '),
    }));
  }

  async interact(): Promise<void> {
    const [tx, ty] = this.target();
    const pKey = pkey(tx, ty);
    const m = this.map;
    const n = this.npc_at(tx, ty);
    if (n) {
      await this.talk(n);
      return;
    }
    // Interact with your child in the farmhouse (Task 08)
    if (this.mapname === 'house' && this.married && this.child_name && tx === SPOUSE_POS[0] + 1 && ty === SPOUSE_POS[1]) {
      await this.child_interact();
      return;
    }
    // Guest vendor in Market Cross (Task 11)
    if (this.mapname === 'town' && tx === GUEST_VENDOR_SPOT[0] && ty === GUEST_VENDOR_SPOT[1]) {
      const gv = this.current_guest_vendor();
      if (gv) {
        await this.guest_vendor_menu(gv);
        return;
      }
    }
    // People you meet along the trail & dropped scarf (Task 36)
    if (await this.trail_interact_at(tx, ty)) return;
    if (pKey in m.doors) {
      await this.enter(m.doors[pKey]);
      return;
    }
    if (pKey in m.warps) {
      const [mp, wx, wy] = m.warps[pKey];
      this.riding_horse = false;
      this.warp(mp, wx, wy);
      return;
    }
    // Check if interacting with outdoor Dog, Farm Cat, or Horse on the farm
    if (this.mapname === 'farm') {
      if (tx === CAT_SPOT[0] && ty === CAT_SPOT[1] && this.pet_extras.cat) {
        await this.cat_menu();
        return;
      }
      if (tx === 21 && ty === 6) {
        await this.dog_menu();
        return;
      }
      if (!this.riding_horse && tx === 25 && ty === 6) {
        await this.horse_menu();
        return;
      }
      if (await this.farm_works_interact(tx, ty)) return;
    }
    const tile = m.tile(tx, ty);
    const here = this.objs[this.mapname]?.[pKey];
    if (here === 'dig') {
      this.msg('The soil here is wriggling. Something is buried! Dig it up with your Hoe.', '0A');
      return;
    }
    if (here === 'starrock') {
      this.msg('A fallen star, still warm to the touch. Crack it open with your Hammer.', '0A');
      return;
    }

    // Hot Spring on Beacon Hill (either standing in or facing 'spring')
    if (tile === 'spring' || m.tile(this.px, this.py) === 'spring') {
      if (this.held === 'Egg') {
        this.take('Egg', 1);
        this.give('Spa-Boiled Egg', 1);
        this.msg('You tossed an Egg into the Hot Spring: Spa-Boiled Egg!', '09');
        return;
      }
      this.stamina = Math.min(this.max_stamina, this.stamina + 80);
      this.fatigue = Math.max(0, this.fatigue - 40);
      await this.advance(60);
      await this.say('Ahh... you soak in the Beacon Hill Hot Spring for an hour. (+80 Stamina, -40 Fatigue!)', 'Hot Spring');
      return;
    }

    // Cedar Hollow's mossy pond and Lighthouse Point's tide pools are not the Wellkeeper Pond
    if (tile === 'pond' && this.mapname !== 'mountain') {
      if (this.mapname === 'woods') await this.hollow_offering();
      else await this.say(TIDE_POOL_TEXT, 'Tide Pool');
      return;
    }

    // Wellkeeper Pond Offering
    if (tile === 'pond') {
      if (!this.held) {
        await this.say('The Wellkeeper Pond shimmers. Hold an item from your Rucksack (i) and press X to make an offering!', 'Wellkeeper Pond');
        return;
      }
      const item = this.held;
      if (item === 'Promise Ribbon') {
        await this.propose('Wellkeeper');
        return;
      }
      this.take(item, 1);
      this.goddess_gifts += 1;
      this.friend['Wellkeeper'] = clamp((this.friend['Wellkeeper'] || 0) + 5, 0, 100);
      await this.say(`Tadaaa! Thank you for the ${item}! (Total offerings: ${this.goddess_gifts})`, 'Wellkeeper');
      if (this.goddess_gifts === 10) {
        this.give_power_berry('goddess_10');
        await this.say('For 10 offerings, please accept this Heartseed!', 'Wellkeeper');
      } else if (this.goddess_gifts === 20) {
        this.give('Frostwort', 1);
        await this.say('For 20 offerings, here is a sacred Frostwort and the Mine Elevator blessing!', 'Wellkeeper');
      }
      return;
    }

    // Beacon Hill Lake Cucumber Offering to Reed Heron
    if (this.mapname === 'mountain' && tile === 'water' && this.held === 'Cucumber') {
      this.take('Cucumber', 1);
      this.kappa_gifts += 1;
      if (this.kappa_gifts >= 10 && !this.has_mystic_berry) {
        this.has_mystic_berry = true;
        await this.say('...You brought 10 Cucumbers. Eat this Mystic Blue Berry. Rain and snow will never tire you again.', 'Reed Heron');
        this.msg("Obtained Reed Heron's Mystic Blue Berry! Zero fatigue from rain/snow!", '0C');
      } else {
        await this.say(`...Reed Heron emerges from the lake, munches your Cucumber, and vanishes. (${this.kappa_gifts}/10 for Mystic Berry)`, 'Reed Heron');
      }
      return;
    }

    if (this.at_trap(tx, ty)) {
      await this.trap_menu();
      return;
    }

    // Willow Bend: skip a flat stone across the river
    if (this.mapname === 'river' && tile === 'water') {
      await this.skip_stone();
      return;
    }

    // Farm Crop Harvesting
    if (this.mapname === 'farm' && pKey in this.crops) {
      const [crop, age] = this.crops[pKey];
      const [days, regrow] = [CROPS[crop][2], CROPS[crop][3]];
      if (age >= days) {
        if (crop === 'Grass') {
          this.msg('Use your Sickle to cut ripe pasture Grass into Fodder.');
          return;
        }
        const companion = this.companion_bonus(pKey);
        const compost = this.compost_bonus(pKey);
        const n = 1 + companion + compost;
        const helped =
          (companion ? ` The ${COMPANION.helper} beside it drew the bees.` : '') + (compost ? ' The compost paid off.' : '');
        if (compost) this.composted = this.composted.filter((k) => k !== pKey);
        if (this.held === 'Basket' && getBasketTotal(this.basket) < BASKET_CAPACITY) {
          const room = Math.min(n, BASKET_CAPACITY - getBasketTotal(this.basket));
          this.basket[crop] = (this.basket[crop] || 0) + room;
          if (n > room) this.give(crop, n - room);
          this.msg(`Harvested ${n > 1 ? `${n} ${crop}` : crop} into Basket (${getBasketTotal(this.basket)}/${BASKET_CAPACITY})!${helped}`, '0B');
        } else {
          this.give(crop, n);
          this.msg(n > 1 ? `You harvested ${n} ${crop}!${helped}` : `You harvested a ${crop}!`, '0B');
        }
        if (regrow) {
          this.crops[pKey][1] = days - regrow;
        } else {
          delete this.crops[pKey];
        }
        this.mastery_add('farming');
        if (crop === 'Turnip') this.fortnight.picked = true;
        const nowSec = Date.now() / 1000;
        this._harvestStreak = nowSec - this._lastHarvestAt < 2.2 ? Math.min(5, this._harvestStreak + 1) : 0;
        this._lastHarvestAt = nowSec;
        playHarvestChime(this._harvestStreak);
        this.fx_add('sparkle', tx, ty, 0.7);
        this.fx_add('text', tx, ty, 0.75, { text: `+${n}` });
      } else {
        this.msg(
          `${crop}: ${days - age} more day${days - age > 1 ? 's' : ''} to go.${this.wet.has(pKey) ? '' : ' (needs water)'}${this.companion_note(pKey)}${this.compost_bonus(pKey) ? ' Composted: +1 at the next picking.' : ''}`,
        );
      }
      return;
    }

    // Forage Pickup
    const fr = this.forage[this.mapname] || {};
    if (pKey in fr) {
      const item = py_pop(fr, pKey);
      this.give(item);
      playSfx('harvest');
      this.mastery_add('foraging');
      const bonusChance = (this.hollow_luck_day === this.absday() ? HOLLOW_LUCK_CHANCE : 0) + (this.has_perk('forage_double') ? 0.2 : 0);
      if (bonusChance > 0 && py_rng().random() < bonusChance) {
        this.give(item);
        this.fx_add('sparkle', tx, ty, 0.7);
        this.msg(`You picked up ${item}, and found a second one beside it!`, '0B');
      } else {
        this.msg(`You picked up ${item}.`, '0B');
      }
      return;
    }

    // Farm Honey/Apple Tree, Doghouse, Horse Stable, Mill, Trash Can, Inn Phone
    const signId = m.signs[pKey];
    if (signId === 'honey_tree' || (this.mapname === 'farm' && tile === 'tree' && tx === 7 && ty === 6)) {
      if (this.honey_picked) {
        await this.say(`Bees buzz around the hive in the farm tree. ${this.hive_note()} Come back tomorrow for more.`, 'Farm Tree');
      } else {
        this.honey_picked = true;
        const h = this.hive_honey();
        this.give(h.item, 1);
        let msgTxt = h.flower
          ? `You gathered ${h.item} from the hive! The bees found ${h.blooms} ${h.flower}${h.blooms === 1 ? '' : 's'} nearby.`
          : 'You gathered plain Honey. Flowers in bloom near the tree would flavour it.';
        if (this.season === 2) {
          const appleType = py_rng().random() < 0.15 ? 'SUGDW Apple' : 'Apple';
          this.give(appleType, 1);
          msgTxt += ` An ${appleType} also dropped!`;
        }
        this.msg(msgTxt, '09');
      }
      return;
    }
    if (signId === 'doghouse' || tile === 'doghouse') {
      await this.dog_menu();
      return;
    }
    if (signId === 'stable' || tile === 'stable') {
      await this.horse_menu();
      return;
    }
    if (signId === 'mill' || tile === 'mill') {
      await this.mill_menu();
      return;
    }
    if (tile === 'maker') {
      const maker = this.maker_at(tx, ty);
      if (maker) await this.maker_menu(maker);
      return;
    }
    if (signId === 'trash' || tile === 'trash') {
      await this.trash_can_menu();
      return;
    }
    if (signId === 'inn_phone' || tile === 'phone') {
      await this.inn_phone_menu();
      return;
    }
    if (signId === 'ridge_lookout') {
      await this.ridge_lookout();
      return;
    }
    if (signId === 'lighthouse_log') {
      await this.lighthouse_read();
      return;
    }
    if (signId === 'hedge_latch') {
      await this.hedge_latch();
      return;
    }
    if (signId === 'cedar_spirit') {
      await this.cedar_spirit_event();
      return;
    }
    if (signId === 'town_lamp') {
      if (!this.berry_sources.includes('truth:town_lamp')) {
        await this.say('You inspect the iron streetlight between Mayor Ambrose\'s Manor and the Church. A shimmering gem rests inside the lantern!', 'Streetlight');
        this.give_truth_jewel('town_lamp');
      } else {
        await this.say('The iron streetlight casts a steady golden glow down the avenue.', 'Streetlight');
      }
      return;
    }
    if (signId === 'cottage_plot') {
      await this.say("Town Cottage Lot — Commission Ingrid at her Beacon Hill workshop (100,000G + 999 Lumber after building the Bathroom) to raise your Town Cottage here!", 'Town Plot');
      return;
    }

    if (tile === 'bin') {
      await this.ship();
    } else if (tile === 'bed') {
      // Until the first-steps checklist is done, a stray press on the bed answers No.
      if (await this.confirm('Go to sleep for the night? (Saves to Slot 1)', this.first_steps !== null)) {
        await this.new_day('sleep');
      }
    } else if (tile === 'tv') {
      await this.tv_menu();
    } else if (tile === 'cal') {
      await this.calendar_menu();
    } else if (tile === 'counter' || tile === 'bookcase' || tile === 'furn') {
      await this.interior_interact(tile, [tx, ty]);
    } else if (tile === 'mantel') {
      await this.mantel_menu();
    } else if (tile === 'plotsign') {
      await this.plot_menu(pKey);
    } else if (tile.startsWith('pocket_')) {
      await this.pocket_menu();
    } else if (tile === 'bench') {
      const seat = Object.entries(SEATS).find(([, st]) => st.map === this.mapname && st.x === tx && st.y === ty);
      if (seat) await this.sit(seat[0]);
    } else if (tile === 'kitchen' || tile === 'bath' || tile === 'shelf' || tile === 'vase' || tile === 'fireplace') {
      await this.use_furniture(tile);
    } else if (tile === 'clock') {
      await this.say(`Exact Time: ${fmt_time(this.minutes)} (${this.date_str()}, ${this.weather}).`, 'Farmhouse Clock');
    } else if (tile === 'mirror') {
      const wear = this.fatigue >= 80 ? 'exhausted — rest or bathe soon!' : this.fatigue >= 50 ? 'getting tired.' : 'fresh and ready to farm!';
      await this.say(`You look in the Mirror: Stamina ${this.stamina}/${this.max_stamina}, Fatigue ${this.fatigue}/100. You look ${wear}`, 'Mirror');
    } else if (tile === 'fridge') {
      await this.storage_menu('fridge');
    } else if (tile === 'cabinet') {
      if (!this.berry_sources.includes('truth:cabinet')) {
        await this.say('Tucked in a secret cedar drawer inside your Cabinet lies a Jewel of Truth!', 'Cabinet');
        this.give_truth_jewel('cabinet');
      }
      await this.storage_menu('cabinet');
    } else if (tile === 'record_player') {
      await this.music_menu();
    } else if (tile === 'rug') {
      await this.say('A plush woven rug warms your farmhouse floor (+5 overnight Fatigue recovery).', 'Farmhouse Rug');
    } else if (tile === 'table' && this.mapname === 'house') {
      await this.house_table_menu();
    } else if (tile === 'stamp_bench' && this.mapname === 'house') {
      await this.stamp_bench_menu();
    } else if (tile === 'pantry') {
      await this.pantry_menu();
    } else if (tile === 'perch') {
      await this.say('A sturdy cedar perch by the coop. Your chickens love hopping onto it on sunny days (+2 daily chicken affection).', 'Chicken Perch');
    } else if (tile === 'shade_tree') {
      await this.say('A leafy pasture shade tree. Your cows and sheep gather under its boughs on warm afternoons (+2 daily affection).', 'Shade Tree');
    } else if (tile === 'stall') {
      await this.stall_menu();
    } else if (tile === 'sign') {
      let text = m.signs[pKey] || '';
      if (text === 'farm') {
        text = `${this.farm.toUpperCase()} FARM — Owner: ${this.name}`;
      } else if (text === 'request_board') {
        this.fortnight.board = true;
        await this.request_menu();
        return;
      } else if (text === 'footbridge') {
        text = this.footbridge_sign();
      }
      await this.say(text, 'Sign');
    } else if (this.held) {
      this.msg(`You're holding ${this.held}. Face someone and press X to give it.`);
    }
  }

  // ---------------------------------------------------------------- outer-region landmarks

  /** Task 34: the latch of the old hedge gate, on the Brackenford Beach side. Lifting it opens the way to Cedar Hollow for good. */
  async hedge_latch(): Promise<void> {
    // short lines, so the compact layout (44 columns of text at 50) wraps nothing mid-sentence
    const info = ['An old field gate in the hedge.', 'Its latch is on this side, stiff with salt.', 'Beyond it, the woods.'];
    if ((await this.menu('Lift the latch?', ['Yes', 'No'], 0, info)) !== 0) {
      this.msg('You leave the old gate latched.', '08');
      return;
    }
    this.shortcuts = [...this.shortcuts, 'hollow_gate'];
    open_shortcut(this.maps, 'hollow_gate');
    this.prune_forage();
    const mid = HEDGE_GATE.bAt + 1;
    this.fx_add('dust', 0, mid, 0.7);
    this.fx_add('sparkle', 1, mid, 0.9);
    this.msg('The latch gives with a creak and the old gate swings wide. A short way to Cedar Hollow, for good!', '0B');
  }

  /** Skyline Ridge lookout: the view reads tomorrow's weather, and once a day the cold air revives you. */
  async ridge_lookout(): Promise<void> {
    const sat = this.seat_scene('lookout');
    let text = `${sat?.scene ?? this.lookout_scene()} ${LOOKOUT_VIEW[this.tomorrow] || LOOKOUT_VIEW.Sunny}`;
    if (this.lookout_day !== this.absday()) {
      this.lookout_day = this.absday();
      this.stamina = Math.min(this.max_stamina, this.stamina + LOOKOUT_STAMINA);
      this.fatigue = Math.max(0, this.fatigue - LOOKOUT_FATIGUE);
      text += ` The thin, cold air clears your head. (+${LOOKOUT_STAMINA} Stamina, -${LOOKOUT_FATIGUE} Fatigue)`;
    }
    await this.say(text, 'Skyline Ridge Lookout');
    if (sat?.friend) await this.seat_friend('lookout', sat.friend);
  }

  lookout_scene(): string {
    const h = Math.floor(this.minutes / 60);
    if (h < 9) return 'Morning mist is lifting off the valley below.';
    if (h < 17) return 'The whole valley lies below you: the farm, the town, the river and the sea.';
    if (h < 20) return 'The valley glows gold in the evening light.';
    return 'Far below, the lights of town twinkle in the dark.';
  }

  /** Lighthouse Point: the old keeper's log, one new page a day. The last page leaves a keepsake. */
  async lighthouse_read(): Promise<void> {
    const total = LIGHTHOUSE_LOG.length;
    const fresh = this.lighthouse_log < total && this.lighthouse_day !== this.absday();
    if (fresh) {
      this.lighthouse_log += 1;
      this.lighthouse_day = this.absday();
    }
    const page = clamp(this.lighthouse_log, 1, total);
    const intro = page === 1 ? `${LIGHTHOUSE_INTRO}\n` : '';
    const more = this.lighthouse_log < total ? '\n(The next page is stuck fast with salt. Come back tomorrow.)' : '';
    const lamp = this.weather === 'Rain' || this.weather === 'Typhoon' ? '\nHigh above you, the old lamp is turning.' : '';
    await this.say(`${intro}${LIGHTHOUSE_LOG[page - 1]}${more}${lamp}`, `Keeper's Log ${page}/${total}`);
    if (fresh && this.lighthouse_log === total) {
      this.give('Sea Glass');
      this.msg('Tucked behind the last page: a smooth piece of green Sea Glass.', '0C');
    }
  }

  /** Cedar Hollow's mossy pond: give back something that grew wild for a lucky day of foraging. */
  async hollow_offering(): Promise<void> {
    if (this.hollow_luck_day === this.absday()) {
      await this.say('Rings are still spreading from your last gift. The Hollow is listening; come back tomorrow.', 'Mossy Pond');
      return;
    }
    const item = this.held;
    if (!item || ITEMS[item]?.[2] !== 'forage') {
      await this.say('Moss-green water, very still. Folk say the Hollow smiles on anyone who gives back something that grew wild. Hold a forage item and press X.', 'Mossy Pond');
      return;
    }
    this.take(item, 1);
    this.hollow_luck_day = this.absday();
    const [tx, ty] = this.target();
    this.fx_add('sparkle', tx, ty, 0.9);
    await this.say(`You drop the ${item} into the pond. It sinks without a ripple... then the whole pond shivers. Today, wild things seem to find you. (Lucky foraging until tonight)`, 'Mossy Pond');
  }

  /** Willow Bend: skip a flat stone across the river and try to beat your record. */
  async skip_stone(): Promise<void> {
    const calm = this.weather !== 'Rain' && this.weather !== 'Typhoon';
    const n = rollStoneSkips(() => py_rng().random(), calm);
    const [tx, ty] = this.target();
    this.fx_add('splash', tx, ty, 0.6);
    this.fx_add('text', tx, ty, 1.1, { text: `${n}x` });
    if (n > this.skip_best) {
      this.skip_best = n;
      this.msg(`Skip, skip, skip... ${n} skip${n === 1 ? '' : 's'}! A new Willow Bend record!`, '0C');
    } else {
      this.msg(`Your stone skips ${n} time${n === 1 ? '' : 's'}. (Record: ${this.skip_best})`, '0D');
    }
    await this.spend(1);
  }

  async dog_menu(): Promise<void> {
    if (!this.berry_sources.includes('truth:doghouse')) {
      this.give_truth_jewel('doghouse');
    }
    const h = Math.floor(this.dog_aff / 10);
    const bar = `[${'#'.repeat(h)}${'.'.repeat(10 - h)}]`;
    const opts = ['Pet & Hug Dog', 'Play Fetch with Dog Ball', 'Practice Beach Frisbee'];
    if (this.pet_extras.bowlGift) opts.push(`Collect Pet Bowl Gift (${this.pet_extras.bowlGift})`);
    if (!this.pet_extras.cat && this.dog_aff >= CAT_UNLOCK_DOG_AFF) opts.push('Welcome the Stray Farm Cat!');
    opts.push('Leave');
    const scent = this.dog_clue_live()
      ? [`  It keeps pointing its nose one way: ${this.dog_clue_text()}.`]
      : this.dog_aff < DOG_CLUE_AFF
        ? ['  A dog you spend time with will start sniffing out things in the valley.']
        : [];
    const sel = await this.menu(`Doghouse — Dog ${bar} (Max Frisbee: ${this.dog_frisbee_dist}m)`, opts, 0, scent);
    if (sel === null || opts[sel] === 'Leave') return;
    const choice = opts[sel];
    if (choice === 'Pet & Hug Dog') {
      this.dog_aff = Math.min(100, this.dog_aff + 3);
      this.fx_add('emote', 21, 6, 1.0, { emote: 'heart' });
      this.msg('Woof! Your dog wags its tail happily! (+Affection)', '0B');
    } else if (choice === 'Play Fetch with Dog Ball') {
      if (!this.inv['Dog Ball']) {
        await this.say('Buy a Dog Ball from Ferreira at Otto\'s Beach House to play fetch!', 'Doghouse');
      } else {
        this.dog_aff = Math.min(100, this.dog_aff + 5);
        this.fx_add('emote', 21, 6, 1.0, { emote: 'heart' });
        this.msg('Your dog chases the Dog Ball and brings it right back! Woof!', '0B');
      }
    } else if (choice === 'Practice Beach Frisbee') {
      if (!this.inv['Frisbee']) {
        await this.say('Buy a Frisbee from Ferreira at Otto\'s Beach House to train for Beach Day (Summer 1)!', 'Doghouse');
      } else {
        const gain = py_rng().randint(2, 6);
        this.dog_frisbee_dist = Math.min(95, this.dog_frisbee_dist + gain);
        this.dog_aff = Math.min(100, this.dog_aff + 4);
        this.fx_add('emote', 21, 6, 1.0, { emote: 'note' });
        this.msg(`Great catch! Your dog's Frisbee record is now ${this.dog_frisbee_dist}m!`, '0C');
      }
    } else if (choice.startsWith('Collect Pet Bowl Gift')) {
      const g = this.pet_extras.bowlGift;
      if (g) {
        this.pet_extras.bowlGift = null;
        this.give(g, 1);
        this.msg(`You collected ${g} left by your pets in the bowl!`, '0B');
      }
    } else if (choice.startsWith('Welcome the Stray Farm Cat')) {
      const catName = (await this.text_input('Name your new farm cat:', this.pet_extras.catName, 12)).trim() || 'Mallow';
      this.pet_extras.cat = true;
      this.pet_extras.catName = catName;
      this.pet_extras.catAff = 30;
      await this.say(`Purrrr! ${catName} settles right beside the doghouse and keeps an eye on the farm!`, catName);
    }
  }

  async horse_menu(): Promise<void> {
    if (!this.berry_sources.includes('truth:stable')) {
      this.give_truth_jewel('stable');
    }
    const h = Math.floor(this.horse_aff / 10);
    const bar = `[${'#'.repeat(h)}${'.'.repeat(10 - h)}]`;
    const opts = [
      'Talk & Pat Horse',
      'Brush Horse',
      this.riding_horse ? 'Dismount Horse' : 'Ride Horse (Fast Movement)',
      'Ship Items via Saddlebags',
      'Leave',
    ];
    const sel = await this.menu(`Horse Stable — Horse ${bar}`, opts);
    if (sel === 0) {
      this.horse_aff = Math.min(100, this.horse_aff + 3);
      this.fx_add('emote', 25, 6, 1.0, { emote: 'heart' });
      this.msg('Neigh! Your horse nuzzles your shoulder.', '0B');
    } else if (sel === 1) {
      if (!this.inv['Brush']) {
        await this.say('Buy a Brush from Hilde or Abel to groom your horse.', 'Stable');
      } else {
        this.horse_aff = Math.min(100, this.horse_aff + 5);
        this.fx_add('emote', 25, 6, 1.0, { emote: 'heart' });
        this.msg("You brushed your horse's coat until it gleams!", '0B');
      }
    } else if (sel === 2) {
      this.riding_horse = !this.riding_horse;
      this.fx_add('emote', this.px, this.py, 0.9, { emote: this.riding_horse ? 'heart' : 'note' });
      this.msg(this.riding_horse ? 'You mount your horse! Double speed on the farm!' : 'You dismount your horse.', '09');
    } else if (sel === 3) {
      await this.ship();
    }
  }

  async mill_menu(): Promise<void> {
    const cornCount = this.inv['Corn'] || 0;
    if (cornCount <= 0) {
      await this.say('Water Mill: Place 1 Corn here to grind it into 30 bags of Chicken Feed! (You have 0 Corn.)', 'Water Mill');
      return;
    }
    if (await this.confirm(`Grind 1 Corn into 30 Chicken Feed? (You have ${cornCount} Corn)`)) {
      this.take('Corn', 1);
      this.give('Chicken Feed', 30);
      this.msg('The millstone turns: 1 Corn ground into +30 Chicken Feed!', '09');
    }
  }

  async trash_can_menu(): Promise<void> {
    const trashItems = ['Boot', 'Empty Can', 'Fish Bones'].filter((i) => (this.inv[i] || 0) > 0);
    if (!trashItems.length) {
      await this.say('Market Cross Trash Can: Dispose of fished-up Boots and Empty Cans here so you never litter!', 'Trash Can');
      return;
    }
    for (const item of trashItems) {
      const q = this.inv[item];
      this.take(item, q);
    }
    this.msg('You properly disposed of your fishing trash in the plaza bin!', '0B');
  }

  async tv_menu(): Promise<void> {
    const is444 = Math.floor(this.minutes / 60) % 12 === 4 && this.minutes % 60 === 40;
    if (is444) {
      await this.say('4:44...4:44...4:44... The TV screen flickers with eerie static before returning to normal!', 'TV (4:44)');
    }
    const sel = await this.menu('Farmhouse Television — Choose Channel', [
      'Ch 1 (Left): Weather Forecast',
      'Ch 2 (Up): Brackenford News & Calendar',
      'Ch 3 (Right): Variety, Cooking Show (Tue) & TV Shopping (Sat)',
      'Ch 4 (Down): Life on the Farm Guide',
      'Turn Off',
    ]);
    if (sel === 0) {
      const lk = LUCK_LABELS[this.daily_luck];
      await this.say(
        `Tomorrow's weather forecast for Brackenford: ${this.tomorrow}! Today's fortune: ${lk.name} — ${lk.forecast}${this.flush_coming() ? " And after today's rain, look for mushrooms in Cedar Hollow tomorrow morning." : ''}`,
        'Weather & Fortune',
      );
    } else if (sel === 1) {
      await this.say(`Brackenford News:${this.fest_news() || ' All is peaceful in Brackenford today.'}`, 'News Channel');
    } else if (sel === 2) {
      if ((this.season === 0 && this.day <= 5) || this.mapname === 'in_cottage') {
        const win = py_rng().random() < 0.7;
        if (win) {
          this.give('Relaxation Tea Leaves', 1);
          await this.say('Wellkeeper New Year High-Low Gameshow! You guessed right and won Relaxation Tea Leaves!', 'TV Gameshow');
        } else {
          await this.say('Wellkeeper New Year High-Low Gameshow! So close—try again tomorrow!', 'TV Gameshow');
        }
        return;
      }
      if (this.weekday === 1) {
        // Tuesday: The Delicious Hour
        const unknown = Object.keys(RECIPES).filter((r) => !this.recipes_discovered.includes(r));
        const dish = py_rng().choice(unknown.length ? unknown : Object.keys(RECIPES));
        if (!this.recipes_discovered.includes(dish)) this.recipes_discovered.push(dish);
        await this.say(`Welcome to THE DELICIOUS HOUR! Today's featured recipe: ${this.recipe_line(dish)}! (Added to your discovered recipes!)`, 'Cooking Show');
      } else if (this.weekday === 5) {
        // Saturday: TV Shopping Network
        const nextItem = TV_SHOPPING_ITEMS.find(([name]) => {
          if (name === 'Heartseed') return !this.berry_sources.includes('tv_shopping');
          return !this.inv[name] && !this.house_flags.includes(name);
        });
        if (!nextItem) {
          await this.say('TV Shopping Network: You have bought every single item in our catalog! Thank you!', 'TV Shopping');
        } else {
          this.tv_watched_saturday = nextItem[0];
          await this.say(
            `Welcome to SATURDAY TV SHOPPING! Today's special is the ${nextItem[0]} for just ${nextItem[1]}G! (${nextItem[2]}) Use the Telephone at Gideon's Inn to order!`,
            'TV Shopping'
          );
        }
      } else {
        const show = py_rng().choice([
          'Star Rosalind: Space Princess',
          'Mechabot Ultror',
          'The Samurai Farmer Chronicles',
          'Fairy & Me: Episode 14',
        ]);
        await this.say(`You watch an exciting episode of '${show}'.`, 'Variety Channel');
      }
    } else if (sel === 3) {
      await this.say(py_rng().choice(BOOKS), 'Life on the Farm');
    }
  }

  async inn_phone_menu(): Promise<void> {
    if (this.tv_order) {
      await this.say(`Otto is already delivering your ${this.tv_order[0]} soon!`, 'Inn Telephone');
      return;
    }
    const nextItem = TV_SHOPPING_ITEMS.find(([name]) => {
      if (name === 'Heartseed') return !this.berry_sources.includes('tv_shopping');
      return !this.inv[name] && !this.house_flags.includes(name);
    });
    if (!nextItem) {
      await this.say('TV Shopping: You already own everything we sell!', 'Inn Telephone');
      return;
    }
    const [itemName, price, desc] = nextItem;
    if (await this.confirm(`Order ${itemName} (${price}G + 10G call)? ${desc}`)) {
      if (this.gold < price + 10) {
        await this.say(`You need ${price + 10}G total to place this order.`, 'Inn Telephone');
        return;
      }
      this.gold -= price + 10;
      this.tv_order = [itemName, this.absday() + 2];
      await this.say(`Thank you for ordering the ${itemName}! Otto will deliver it to your farmhouse in 2 days!`, 'TV Shopping');
    }
  }

  hearts(n: string): [string, string] {
    const info = getHeartInfo(this.friend[n] || 0);
    return [`${info.bar} ${info.label}`, info.color];
  }

  async check_heart_and_rival_events(n: string): Promise<void> {
    const aff = this.friend[n] || 0;
    const events = HEART_EVENTS[n];
    if (events) {
      const thresholds: [number, number][] = [
        [10, 0], // Black
        [25, 1], // Purple
        [45, 2], // Blue
        [65, 3], // Yellow
      ];
      for (const [req, idx] of thresholds) {
        const key = `${n}:${idx}`;
        if (aff >= req && !this.heart_events_seen.includes(key)) {
          this.heart_events_seen.push(key);
          this.friend[n] = clamp(aff + 5, 0, 100);
          await this.say(events[idx], `${n} — Heart Event`);
          if (n === 'Priya' && idx === 0) {
            this.give('Grass Seeds', 1);
          }
          break;
        }
      }
    }

    for (const [bride, rival, scene] of RIVAL_PAIRS) {
      if ((n === bride || n === rival) && this.married !== bride && this.married !== rival) {
        const rKey = `${bride}:${rival}`;
        if (!this.rival_events_seen.includes(rKey) && (this.friend[rival] || 0) >= 15) {
          this.rival_events_seen.push(rKey);
          await this.say(`Rival Event (${bride} & ${rival}): ${scene}`, 'Rival Event');
          break;
        }
      }
    }
  }

  async talk(n: string): Promise<void> {
    if (await this.fest_talk(n)) {
      return;
    }
    const d = NPCS[n];
    if (!d) return;
    const npcSpot: [number, number] | null =
      this.npc_pos[n] && NPCS[n]?.where?.[0] === this.mapname
        ? this.npc_pos[n]
        : this.indoor_npcs[n]?.map === this.mapname
          ? this.indoor_npcs[n].pos
          : n === this.married && this.mapname === 'house'
            ? SPOUSE_POS
            : null;
    const emitNpcEmote = (emote: EmoteKind) => {
      if (npcSpot) this.fx_add('emote', npcSpot[0], npcSpot[1], 1.1, { emote });
    };
    if (this.held) {
      const item = this.held;
      if (item === 'Promise Ribbon') {
        await this.propose(n);
        return;
      }
      if (this.gifted.has(n)) {
        emitNpcEmote('note');
        await this.say('You already gave me something today. Thank you, though!', n);
        return;
      }
      this.take(item);
      let pref: 'love' | 'like' | 'neutral' | 'hate' = 'neutral';
      let line = `Oh, a ${item}? For me? Thanks.`;
      const honeyFans = Object.values(HONEY_FLAVOURS).find((f) => f.item === item)?.fans;
      if (item === 'Block Print') {
        pref = 'love';
        const latest = this.prints[this.prints.length - 1];
        line = latest
          ? `You printed "${latest.title}" (${latest.marks}) by hand?! I'll hang this right on my wall!`
          : `A handmade block print! What a thoughtful winter keepsake — thank you!`;
      } else if (d.loves.includes(item) || honeyFans?.includes(n)) {
        pref = 'love';
        line = `Oh! ${item}! I love this! Thank you so much!`;
      } else if (d.likes.includes(item)) {
        pref = 'like';
        line = `A ${item}? Thank you, that's really nice.`;
      } else if (d.hates.includes(item)) {
        pref = 'hate';
        line = `...A ${item}? I don't really like this.`;
      }
      const isBday = this.birthdays().includes(n);
      const luckBonus = this.effective_luck() >= 2 && pref !== 'hate' ? 1 : 0;
      const pts = calculateGiftPoints(pref, isBday, false) + luckBonus;
      if (isBday) {
        line += pts > 0 ? ' And on my birthday! You remembered! (5x Bonus!)' : ' ...On my birthday, too.';
      }
      this.friend[n] = clamp((this.friend[n] || 0) + pts, 0, 100);
      this.gifted.add(n);
      if (pref === 'love') this.last_loved_gift[n] = item;
      if (isBday && pts > 0) this.remember(n, `${n}'s birthday: you remembered, with ${aOrAn(item)} ${item}.`, `${n}:bday:${this.year}`);
      else if (item === 'Block Print') this.remember(n, `Gave ${n} a handmade winter block print.`, `${n}:print:${this.year}`);
      else if (pref === 'love') this.remember(n, `${n} loved the ${item} you brought.`, `${n}:love:${item}`);
      playSfx('emote');
      emitNpcEmote(pref === 'love' ? 'heart' : pref === 'hate' ? 'cross' : 'note');
      await this.say(line, n);
      await this.check_heart_and_rival_events(n);
      return;
    }

    if (n === 'Rowan' && (await this.gray_quest_talk())) {
      if (!this.talked.has(n)) {
        this.talked.add(n);
        this.friend[n] = clamp((this.friend[n] || 0) + 2, 0, 100);
      }
      emitNpcEmote('note');
      await this.check_heart_and_rival_events(n);
      return;
    }

    // Task 02: Short outings with villagers (Rowan walk / Nico or Felix fishing)
    const outing = this.outing_available(n);
    if (outing && !this.milestone_line(n)) {
      const pick = await this.menu(`${n}: ${outing.title}?`, [`Join ${n} (10 min)`, 'Just chat for now'], 0, [
        `  A short ten-minute outing (${outing.where}).`,
      ]);
      if (pick === 0) {
        await this.run_outing(outing);
        return;
      }
    }

    if (n !== this.married && !this.milestone_line(n) && this.favor_available(n)) {
      emitNpcEmote('heart');
      if (!this.talked.has(n)) {
        this.talked.add(n);
        this.friend[n] = clamp((this.friend[n] || 0) + 2, 0, 100);
      }
      await this.offer_favor(n);
      await this.check_heart_and_rival_events(n);
      return;
    }

    let line = '';
    if (n === this.married && this.mapname === 'house') {
      line = py_rng().choice(SPOUSE_LINES);
      if (this.child_name) {
        line += ` Little ${this.child_name} is growing so fast!`;
      }
      emitNpcEmote('heart');
    } else {
      const f = this.friend[n] || 0;
      const tier = f < 30 ? 0 : f < 70 ? 1 : 2;
      const memory = this.milestone_line(n);
      if (memory) {
        line = memory.line;
        this.milestones_said.push(memory.key);
        this.remember(n, this.milestone_memory(memory.key), `said:${memory.key}`);
        if (memory.key.startsWith('Curator:case:')) {
          const c = memory.key.split(':')[2];
          this.keepsake(`letter:${c}`, `Curator's letter (${c})`, `The curator's thank-you letter for the finished ${c} case, with your name on the card.`);
        }
        emitNpcEmote('heart');
      } else {
        const reactive = reactiveNpcLine(n, {
          weather: this.weather,
          season: this.season,
          married: this.married,
          recentFestWin: this.fest_wins.length > 0 && !this.talked.has(n),
          lastGift: this.last_loved_gift[n] || null,
        });
        line = reactive && !this.talked.has(n) ? reactive : py_rng().choice(d.lines[tier]);
        emitNpcEmote(f >= 60 ? 'heart' : 'note');
      }
    }
    if (!this.talked.has(n)) {
      this.talked.add(n);
      this.friend[n] = clamp((this.friend[n] || 0) + 2, 0, 100);
    }
    await this.say(line, n);
    await this.check_heart_and_rival_events(n);
  }

  // ---------------------------------------------------------------- favors from close neighbors (mechanics task 05)
  /** Whether `n` would offer a favor if you talked now: a close friend, on a free afternoon, nothing already arranged. */
  favor_available(n: string): boolean {
    const f = FAVORS[n];
    if (!f || this.favor) return false;
    if ((this.friend[n] || 0) < FAVOR_FRIENDSHIP) return false;
    const [a, b] = FAVOR_HOURS;
    if (this.minutes < a * 60 || this.minutes >= b * 60) return false;
    if (this.fest_on() || this.fest_on(1)) return false;
    const last = this.favor_offered[n];
    if (last !== undefined && this.absday() - last < FAVOR_GAP) return false;
    if (f.kind === 'feed') return this.chickens > 0;
    if (f.kind === 'water') return Object.keys(this.crops).length > 0 && !['Rain', 'Typhoon'].includes(this.tomorrow);
    return true;
  }

  /** The neighbor offers; accepting books it for tomorrow. Declining is fine: they ask again another week. */
  async offer_favor(n: string): Promise<void> {
    const f = FAVORS[n];
    this.favor_offered[n] = this.absday();
    await this.say(f.offer, n);
    const sel = await this.menu(`${n} offers a favor`, ['Yes, thank you', "No, I'll manage"], 0, [`Tomorrow: ${f.plan}.`]);
    if (sel === 0) {
      this.favor = { npc: n, day: this.absday() + 1 };
      this.markDirty(false);
      await this.say("Then it's a promise. See you tomorrow!", n);
      this.msg(`Arranged: ${f.plan} tomorrow (see Today's Plan).`, '0A');
    } else {
      await this.say('All right. Just ask if you change your mind next week.', n);
    }
  }

  /** The morning a favor falls due: do it, report it, and keep it in Villager Notes. Old favors are cleared. */
  favor_morning(report: string[]): void {
    if (this.favor && this.favor.day < this.absday()) this.favor = null;
    const fv = this.favor;
    if (!fv || fv.day !== this.absday()) return;
    const f = FAVORS[fv.npc];
    if (f.kind === 'feed') {
      if (this.chickens <= 0) {
        report.push(`${fv.npc} came by at dawn, but your coop was empty.`);
        this.favor = null;
        return;
      }
      this.fed = this.chickens;
    } else if (f.kind === 'water') {
      const dry = Object.keys(this.crops).filter((k) => !this.wet.has(k)).slice(0, FAVOR_WATER_MAX);
      if (!dry.length) {
        report.push(`${fv.npc} came by early, but your field was already watered.`);
        this.favor = null;
        return;
      }
      for (const k of dry) this.wet.add(k);
    }
    report.push(f.done);
    this.remember(fv.npc, f.memory, `favor:${fv.npc}:${fv.day}`);
  }

  /** Today's hours for each shop on Odessa's note, for the whole day (not just from now). */
  favor_hours(): string[] {
    const fest = this.fest_on();
    return FAVOR_SHOPS.map((bid) => {
      const [o, c, closed] = HOURS[bid];
      const when = fest && !['church', 'sprites'].includes(bid)
        ? 'closed (festival)'
        : closed.includes(this.weekday)
          ? 'closed today'
          : `${fmt_hour(o)}–${fmt_hour(c)}`;
      return `${BUILDINGS[bid]}: ${when}`;
    });
  }

  /** The Today's Plan line for an arranged favor, or null. Odessa's note adds the hours on the day. */
  favor_line(): { text: string; hours: string[] } | null {
    const fv = this.favor;
    if (!fv) return null;
    const f = FAVORS[fv.npc];
    const d = fv.day - this.absday();
    if (d === 1) return { text: `Tomorrow: ${f.plan}.`, hours: [] };
    if (d !== 0) return null;
    if (f.kind === 'hours') return { text: `${fv.npc}'s note on today's shop hours:`, hours: this.favor_hours() };
    return { text: `Today: ${f.plan} (done this morning).`, hours: [] };
  }

  // ---------------------------------------------------------------- the Evening Catch (mechanics task 14)
  /** Whether today is an Evening Catch day (Wednesdays, Spring to Fall, not a festival). */
  contest_today(offset: number = 0): boolean {
    const d = this.absday() + offset;
    const season = Math.floor((d % 120) / 30);
    return d % 7 === CONTEST_WEEKDAY && CONTEST_SEASONS.includes(season) && !this.fest_on(offset);
  }

  /** Whether a catch right now, here, counts. */
  contest_live(): boolean {
    const [a, b] = CONTEST_HOURS;
    return this.contest_today() && this.mapname === CONTEST_MAP && this.minutes >= a * 60 && this.minutes < b * 60;
  }

  /** The key for this season's ribbon on the mantel. */
  contest_ribbon_key(): string {
    return `ribbon:evening_catch:${this.year}:${this.season}`;
  }

  /** Count a fish landed during the contest; say how far along you are. */
  contest_catch(item: string): void {
    if (!this.contest_live()) return;
    if (!this.contest || this.contest.day !== this.absday()) this.contest = { day: this.absday(), fish: 0, best: null };
    const c = this.contest;
    c.fish += 1;
    const price = (i: string | null) => (i ? ITEMS[i]?.[0] || 0 : -1);
    if (price(item) > price(c.best)) c.best = item;
    if (c.fish === CONTEST_GOAL && !this.souvenirs.some((s) => s.key === this.contest_ribbon_key())) {
      this.msg(`Evening Catch: ${CONTEST_GOAL} fish! The ribbon is yours at the ${fmt_hour(CONTEST_HOURS[1])} whistle.`, '0B');
    } else if (c.fish < CONTEST_GOAL) {
      this.msg(`Evening Catch: ${c.fish}/${CONTEST_GOAL} fish.`, '0D');
    }
  }

  /** End the contest (at 8 PM, or the next morning if you slept first): the result, and the ribbon if you won. */
  contest_close(): string[] {
    const c = this.contest;
    if (!c) return [];
    this.contest = null;
    const season = SEASONS[Math.floor((c.day % 120) / 30)];
    const year = Math.floor(c.day / 120) + 1;
    const best = c.best ? [`Your best catch: ${aOrAn(c.best)} ${c.best}.`] : [];
    if (c.fish < CONTEST_GOAL) {
      return [`Evening Catch over: ${c.fish} of ${CONTEST_GOAL} fish. Next Wednesday, then!`, ...best];
    }
    const key = `ribbon:evening_catch:${year}:${Math.floor((c.day % 120) / 30)}`;
    const fresh = this.keepsake(key, `Evening Catch ribbon (${season})`, `A green river ribbon from the Evening Catch at Willow Bend, ${season} Year ${year}: ${c.fish} fish landed${c.best ? `, the best ${aOrAn(c.best)} ${c.best}` : ''}.`);
    return [fresh
      ? `Evening Catch over: ${c.fish} fish! The ${season} ribbon goes on your mantel.`
      : `Evening Catch over: ${c.fish} fish. You already hold this season's ribbon.`, ...best];
  }

  /** Today's Plan line for the Evening Catch, or null. */
  contest_line(): string | null {
    const [a, b] = CONTEST_HOURS;
    const won = this.souvenirs.some((s) => s.key === this.contest_ribbon_key());
    if (this.contest_today()) {
      if (this.minutes >= b * 60) return null;
      const c = this.contest?.day === this.absday() ? this.contest : null;
      if (c) return `Evening Catch at Willow Bend until ${fmt_hour(b)}: ${c.fish}/${CONTEST_GOAL} fish${c.best ? ` (best: ${c.best})` : ''}.`;
      return `Evening Catch at Willow Bend, ${fmt_hour(a)}–${fmt_hour(b)}: land ${CONTEST_GOAL} fish for the ${this.season_name} ribbon${won ? ' (already won)' : ''}.`;
    }
    if (this.contest_today(1)) return `Tomorrow evening: the Evening Catch at Willow Bend (${fmt_hour(a)}–${fmt_hour(b)}).`;
    return null;
  }

  // ---------------------------------------------------------------- named farm plots (mechanics task 42)
  /** Put the plot signs back on the farm map (after a load or a new placement). */
  place_plots(): void {
    const m = this.maps['farm'];
    if (!m) return;
    for (const p of this.plots) {
      const [x, y] = parseCoordKey(p.key);
      m.set(x, y, 'plotsign');
    }
  }

  /** Take every plot sign off the farm map, restoring the ground under it. */
  clear_plots(): void {
    const m = this.maps?.['farm'];
    if (!m || !Array.isArray(this.plots)) return;
    for (const p of this.plots) {
      const [x, y] = parseCoordKey(p.key);
      if (m.tile(x, y) === 'plotsign') m.set(x, y, p.tile);
    }
  }

  /** A default name from where the sign stands: "North Field", "South-East Field". */
  plot_default_name(x: number, y: number): string {
    const m = this.maps['farm'];
    const ns = y < m.h / 3 + 4 ? 'North' : y >= (2 * m.h) / 3 ? 'South' : '';
    const ew = x < m.w / 3 ? 'West' : x >= (2 * m.w) / 3 ? 'East' : '';
    const part = ns && ew ? `${ns}-${ew}` : ns || ew || 'Middle';
    return `${part} Field`.slice(0, 12).trim();
  }

  /** Which plot a tilled tile belongs to: the nearest sign within PLOT_RADIUS (ties: the first placed). */
  plot_of(k: string): number {
    const [x, y] = parseCoordKey(k);
    let best = -1;
    let bestD = Infinity;
    this.plots.forEach((p, i) => {
      const [px, py] = parseCoordKey(p.key);
      const d = Math.max(Math.abs(px - x), Math.abs(py - y));
      if (d <= PLOT_RADIUS && d < bestD) [best, bestD] = [i, d];
    });
    return best;
  }

  /** Each plot's tilled tiles, dry growing crops and ripe crops. */
  plot_status(): { name: string; key: string; tiles: number; dry: number; ready: number }[] {
    const out = this.plots.map((p) => ({ name: p.name, key: p.key, tiles: 0, dry: 0, ready: 0 }));
    for (const k of this.tilled) {
      const i = this.plot_of(k);
      if (i < 0) continue;
      out[i].tiles += 1;
      const c = this.crops[k];
      if (!c || c[0] === 'Grass') continue;
      if (c[1] >= CROPS[c[0]][2]) out[i].ready += 1;
      else if (!this.wet.has(k)) out[i].dry += 1;
    }
    return out;
  }

  /** "North Turnips: 4 dry tiles, 2 ready to pick" (null when there is nothing to do there). */
  plot_line(st: { name: string; dry: number; ready: number }): string | null {
    const bits: string[] = [];
    if (st.dry) bits.push(`${st.dry} dry tile${st.dry === 1 ? '' : 's'}`);
    if (st.ready) bits.push(`${st.ready} ready to pick`);
    return bits.length ? `${st.name}: ${bits.join(', ')}` : null;
  }

  /** Stand a Plot Sign on open field ground ahead and name the plot. */
  async place_plot_sign(tx: number, ty: number): Promise<boolean> {
    const m = this.maps['farm'];
    const k = pkey(tx, ty);
    const tile = m.tile(tx, ty);
    if (this.mapname !== 'farm' || !['field', 'grass'].includes(tile) || this.tilled.has(k) || this.objs.farm?.[k] || this.crops[k]) {
      this.msg('Stand a Plot Sign on open ground beside your field (not on tilled soil).', '08');
      return false;
    }
    if (this.plots.length >= PLOT_MAX) {
      this.msg(`You already have ${PLOT_MAX} named plots. Take one sign down first.`, '08');
      return false;
    }
    const name = (await this.text_input('Name this plot', this.plot_default_name(tx, ty), PLOT_NAME_MAX)).trim().slice(0, PLOT_NAME_MAX);
    if (!name) return false;
    this.take('Plot Sign', 1);
    this.plots.push({ key: k, name, tile });
    this.place_plots();
    this.msg(`You put up a sign: "${name}". Today's Plan will call it by name.`, '0B');
    if (!this.inv['Plot Sign']) this.tool = 'Hoe';
    return true;
  }

  /** At a plot sign: how the plot is doing; rename it or take the sign down. */
  async plot_menu(k: string): Promise<void> {
    const i = this.plots.findIndex((p) => p.key === k);
    if (i < 0) return;
    const st = this.plot_status()[i];
    const info = [`  ${st.tiles} tilled tile${st.tiles === 1 ? '' : 's'} within ${PLOT_RADIUS} steps.`, `  ${this.plot_line(st) ?? 'Nothing needs you here today.'}`];
    const opts = ['Rename', 'Take the sign down', 'Leave'];
    const sel = await this.menu(`⚑ ${this.plots[i].name}`, opts, 2, info);
    if (sel === 0) {
      const name = (await this.text_input('Rename this plot', this.plots[i].name, PLOT_NAME_MAX)).trim().slice(0, PLOT_NAME_MAX);
      if (name) {
        this.plots[i].name = name;
        this.msg(`The sign now reads "${name}".`, '0B');
      }
    } else if (sel === 1) {
      const p = this.plots[i];
      const [x, y] = parseCoordKey(p.key);
      this.maps['farm'].set(x, y, p.tile);
      this.plots.splice(i, 1);
      this.give('Plot Sign', 1);
      this.msg(`You took down the "${p.name}" sign.`, '0B');
    }
  }

  // ---------------------------------------------------------------- places to stop and sit (mechanics task 44)
  /** The light at a seat now: 'sunset' (5-8 PM), 'rain' (a light rain), or null. */
  seat_moment(): 'sunset' | 'rain' | null {
    if (this.weather === 'Rain') return 'rain';
    if (this.weather === 'Sunny' && this.minutes >= 17 * 60 && this.minutes < 20 * 60) return 'sunset';
    return null;
  }

  /** The scene at a seat right now, and who is there with you, if anyone. */
  seat_scene(id: string): { scene: string; friend: { npc: string; line: string } | null } | null {
    const st = SEATS[id];
    const moment = this.seat_moment();
    if (!st || !moment) return null;
    let friend: { npc: string; line: string } | null = null;
    if (moment === 'sunset' && st.friend && this.weekday === st.friend.weekday && this.season !== 3) friend = st.friend;
    if (id === 'porch' && moment === 'sunset' && this.married) {
      friend = { npc: this.married, line: `${this.married} comes out with two cups of tea and sits close. Neither of you says much. You don't need to.` };
    }
    return { scene: st[moment], friend };
  }

  /** A friend at a seat: a line, a little friendship once a day, and a memory for Villager Notes. */
  async seat_friend(id: string, f: { npc: string; line: string }): Promise<void> {
    await this.say(f.line, f.npc);
    if (!this.talked.has(f.npc)) {
      this.talked.add(f.npc);
      this.friend[f.npc] = clamp((this.friend[f.npc] || 0) + 3, 0, 100);
    }
    this.remember(f.npc, `You watched the sunset from the ${SEATS[id].title} with ${f.npc}.`, `seat:${id}:${f.npc}`);
  }

  /** Sit a while: half an hour passes, a little stamina comes back once a day, and the scene plays. */
  async sit(id: string): Promise<void> {
    const st = SEATS[id];
    const sc = this.seat_scene(id);
    const rest = this.seats_rested[id] !== this.absday();
    if (rest) {
      this.seats_rested[id] = this.absday();
      this.stamina = Math.min(this.max_stamina, this.stamina + SEAT_REST);
    }
    await this.advance(30);
    const tail = rest ? ` (+${SEAT_REST} Stamina)` : '';
    if (!sc) {
      await this.say(`You sit a while on the ${st.title.toLowerCase()}. It's a nice spot. Come back at sunset, or when a light rain falls.${tail}`, st.title);
      return;
    }
    await this.say(`${sc.scene}${tail}`, st.title);
    if (sc.friend) await this.seat_friend(id, sc.friend);
    else if (id === 'porch' && this.seat_moment() === 'sunset' && this.dog_aff >= 50) {
      await this.say('Your dog pads over and leans against your legs, watching the field with you.', 'Porch bench');
    }
  }

  // ---------------------------------------------------------------- hives with seasonal honey (mechanics task 22)
  /** Flowers in bloom within reach of the hive, by kind. */
  hive_blooms(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, [crop, age]] of Object.entries(this.crops)) {
      if (!HONEY_FLAVOURS[crop] || age < CROPS[crop][2]) continue;
      const [x, y] = parseCoordKey(k);
      if (Math.max(Math.abs(x - HIVE_SPOT[0]), Math.abs(y - HIVE_SPOT[1])) > HIVE_RANGE) continue;
      out[crop] = (out[crop] || 0) + 1;
    }
    return out;
  }

  /** Today's honey: flavoured by the flower with the most blooms nearby (ties by name), or plain. */
  hive_honey(): { item: string; flower: string | null; blooms: number } {
    const best = Object.entries(this.hive_blooms()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (!best) return { item: 'Honey', flower: null, blooms: 0 };
    return { item: HONEY_FLAVOURS[best[0]].item, flower: best[0], blooms: best[1] };
  }

  /** "Tomorrow's honey will taste of Duskbell." or how to get a flavour. */
  hive_note(): string {
    const h = this.hive_honey();
    return h.flower
      ? `With ${h.blooms} ${h.flower}${h.blooms === 1 ? '' : 's'} in bloom nearby, it will be ${h.item}.`
      : `Flowers in bloom within ${HIVE_RANGE} steps of the tree would flavour the honey.`;
  }

  // ---------------------------------------------------------------- a field notebook (mechanics task 37)
  /** Note the first catch of a kind: here, in this weather, at this time. */
  note_first(item: string): boolean {
    if ((this.fish_caught[item] || 0) > 0 || this.notebook.some((o) => o.item === item)) return false;
    this.notebook.push({ item, map: this.mapname, weather: this.weather, minutes: this.minutes, day: this.absday() });
    this.msg(`Field notebook: first ${item}, noted.`, '0C');
    return true;
  }

  /** One observation as a line: "Willow Chub — Willow Bend, Rain, 7:40AM, Spring 3". */
  notebook_line(o: { item: string; map: string; weather: string; minutes: number; day: number }): string {
    return `${o.item} — ${this.maps[o.map]?.title || o.map}, ${o.weather}, ${fmt_time(o.minutes).trim()}, ${absdayLabel(o.day, false)}`;
  }

  /**
   * What to look for next, in words, from the regional catch tables: fish not caught yet, where they
   * bite, in which seasons, and what helps (a better rod, rain or storms). In-season ones first.
   */
  notebook_hints(): string[] {
    const seasonWords = (ss: number[]) => andList(ss.map((i) => SEASONS[i])).replace(/ and /, ' or ');
    const out: { now: boolean; text: string }[] = [];
    const seen = new Set<string>();
    for (const [map, table] of Object.entries(REGION_CATCH)) {
      const where = this.maps[map]?.title || map;
      for (const e of table.fish) {
        if (ITEMS[e.item]?.[2] !== 'fish' || this.fish_caught[e.item] || seen.has(e.item)) continue;
        seen.add(e.item);
        const parts = [where];
        if (e.seasons) parts.push(`in ${seasonWords(e.seasons)}`);
        if (e.rod) parts.push('bites more often on a better rod');
        out.push({ now: !e.seasons || e.seasons.includes(this.season), text: `${e.item}: ${parts.join(', ')}.` });
      }
      if (!this.fish_caught[table.rare] && !seen.has(table.rare)) {
        seen.add(table.rare);
        const rod = LEVELS[table.rareRod] ?? 'better';
        out.push({
          now: (this.levels['Fishing Rod'] || 0) >= table.rareRod,
          text: `${table.rare}: a rare bite off ${where}${table.stormBoost ? ', most often after rain or in a storm' : ''}; needs a ${rod} rod.`,
        });
      }
    }
    return [...out.filter((h) => h.now), ...out.filter((h) => !h.now)].map((h) => h.text);
  }

  /** The Field Notebook: observations, newest first, then what to look for next. */
  async field_notebook(): Promise<void> {
    const buildPages = (cw: number, pageMax: number): HudPageLine[][] => {
      const lines: HudPageLine[] = [];
      const head = (label: string, value: string): HudPageLine => ({ kind: 'ledger', prefix: '✎', prefixCol: '0C', label, labelCol: '07', labelBold: true, value, valueCol: '04' });
      const para = (text: string, fg: string) => {
        for (const l of wrapLines([text], Math.max(10, cw - 2))) lines.push({ kind: 'spans', spans: [{ text: `  ${l}`, fg }] });
      };
      lines.push(head('Observations', `${this.notebook.length} noted`), { kind: 'fence' });
      if (!this.notebook.length) para('Nothing noted yet. The first time you catch each kind of fish, it is written down here.', '04');
      for (const o of [...this.notebook].reverse()) para(this.notebook_line(o), '05');
      lines.push({ kind: 'fence' }, head('Reading the water', 'pockets'), { kind: 'fence' });
      for (const p of FISH_POCKETS) para(`${p.glyph} ${p.habitat} at ${this.maps[p.map]?.title || p.map}: ${p.fish} bite more often here.`, '0C');
      const hints = this.notebook_hints();
      lines.push({ kind: 'fence' }, head('Still to find', `${hints.length}`), { kind: 'fence' });
      if (!hints.length) para('Every fish in the valley is in the notebook.', '0B');
      for (const h of hints) para(h, '0C');
      const pages: HudPageLine[][] = [];
      for (let i = 0; i < lines.length; i += pageMax) pages.push(lines.slice(i, i + pageMax));
      return pages.length ? pages : [[]];
    };
    await this.show_hud_pages('✎ Field Notebook', buildPages, { style: { kind: 'hud', accent: '0C' }, alignToMap: true, minWidth: 48, maxWidth: 64 });
  }

  // ---------------------------------------------------------------- the mantel (mechanics task 45)
  /** Put a keepsake on the mantel (once per key). */
  keepsake(key: string, name: string, text: string): boolean {
    if (this.souvenirs.some((v) => v.key === key)) return false;
    this.souvenirs.push({ key, name, day: this.absday(), text });
    return true;
  }

  /** The farmhouse mantel: pick a keepsake to see its date and the day it remembers. */
  // ---------------------------------------------------------------- valley postcards (mechanics task 46)
  /** Draw the map view with no overlays and copy it out, trimmed to what is drawn. */
  capture_scene(): { rows: string[]; fg: string[] } {
    this.capturing = true;
    try {
      this.render();
    } finally {
      this.capturing = false;
    }
    const v = this.scr.ctx?.view;
    const buf = this.scr.buf;
    if (!v) return { rows: [], fg: [] };
    let [x0, y0, x1, y1] = [Infinity, Infinity, -1, -1];
    for (let y = v.y; y < v.y + v.h; y++) {
      for (let x = v.x; x < v.x + v.w; x++) {
        if ((buf[y]?.[x]?.[0] ?? ' ') === ' ') continue;
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
    const rows: string[] = [];
    const fg: string[] = [];
    for (let y = y0; y <= y1; y++) {
      let r = '';
      let f = '';
      for (let x = x0; x <= x1; x++) {
        const c = buf[y][x];
        r += c[0] || ' ';
        f += /^[0-9A-F]{2}$/.test(c[1]) ? c[1] : '05';
      }
      rows.push(r);
      fg.push(f);
    }
    return { rows, fg };
  }

  /** "Market Cross · Spring 3, Year 1 · 6:20 PM" */
  postcard_caption(p: Postcard): string {
    return `${p.place} · ${absdayLabel(p.day)} · ${fmt_time(p.minutes).trim()}`;
  }

  async take_postcard(): Promise<boolean> {
    if (this.postcards.length >= POSTCARD_MAX) {
      if (!(await this.confirm(`The album holds ${POSTCARD_MAX}. Make room by letting the oldest card go?`))) return false;
      this.postcards.shift();
    }
    const { rows, fg } = this.capture_scene();
    if (!rows.length) return false;
    const card: Postcard = { map: this.mapname, place: this.map.title, day: this.absday(), minutes: this.minutes, weather: this.map.indoor ? 'Indoors' : this.weather, rows, fg };
    this.postcards.push(card);
    this.markDirty(false);
    this.fx_add('sparkle', this.px, this.py, 0.6);
    this.msg(`Postcard: ${card.place}, ${absdayLabel(card.day, false)} (${this.postcards.length}/${POSTCARD_MAX}).`, '0C');
    return true;
  }

  /** The card as plain text with its caption, for a download. */
  postcard_text(p: Postcard): string {
    return [...p.rows.map((r) => r.trimEnd()), '', `${this.postcard_caption(p)} · ${p.weather}`, `${this.name} of ${this.farm} Farm`].join('\n') + '\n';
  }

  export_postcard(p: Postcard): boolean {
    const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return this.download_text(`hrvstmn-postcard-${slug(p.place)}-${slug(absdayLabel(p.day))}.txt`, this.postcard_text(p), 'text/plain');
  }

  /** Save a text file in the browser; false (with a message) elsewhere. */
  download_text(filename: string, text: string, type: string): boolean {
    if (typeof document === 'undefined') {
      this.msg('Saving files is only available in the browser.', '08');
      return false;
    }
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }

  /** Browse the album: newest first; open one to look at it, save it as a text file or let it go. */
  async postcard_album(): Promise<void> {
    while (this.postcards.length) {
      const order = this.postcards.map((_, i) => i).reverse();
      const opts = [...order.map((i) => `${this.postcards[i].place} · ${absdayLabel(this.postcards[i].day, false)}`), 'Back'];
      const sel = await this.menu(`▤ Postcards  (${this.postcards.length}/${POSTCARD_MAX})`, opts, 0, (k: number) =>
        k < order.length ? [this.postcard_caption(this.postcards[order[k]]), `${this.postcards[order[k]].weather}`] : []);
      if (sel === null || sel >= order.length) return;
      await this.view_postcard(order[sel]);
    }
  }

  async view_postcard(i: number): Promise<void> {
    while (i >= 0 && i < this.postcards.length) {
      const p = this.postcards[i];
      const k = await this.modal(() => this.draw_postcard(p, i));
      if (k === 'left' || k === 'a' || k === 'h') i = (i + this.postcards.length - 1) % this.postcards.length;
      else if (k === 'right' || k === 'd' || k === 'l') i = (i + 1) % this.postcards.length;
      else if (k === 's') {
        if (this.export_postcard(p)) this.msg(`Saved the ${p.place} postcard as a text file.`, '0B');
      } else if (k === 'x' || k === 'delete' || k === 'backspace') {
        if (await this.confirm(`Let the ${p.place} postcard go?`)) {
          this.postcards.splice(i, 1);
          this.markDirty(false);
          return;
        }
      } else return;
    }
  }

  /** The card centred in a box, cropped around its middle if the screen is smaller, with its caption. */
  draw_postcard(p: Postcard, i: number): void {
    const [W, H] = [this.scr.w, this.scr.h];
    const cw = Math.min(p.rows[0]?.length || 0, W - 4);
    const ch = Math.min(p.rows.length, H - 7);
    const sx = Math.floor(((p.rows[0]?.length || 0) - cw) / 2);
    const sy = Math.floor((p.rows.length - ch) / 2);
    const caption = fitText(W - 6, this.postcard_caption(p), `${p.place} · ${absdayLabel(p.day, false)}`);
    const hint = fitText(W - 6, '←/→ Browse · S Save .txt · X Remove · Esc Back', '←→ · S Save · X Remove');
    const bw = Math.max(cw, caption.length, hint.length) + 4;
    const bh = ch + 5;
    const [bx, by] = [Math.max(0, Math.floor((W - bw) / 2)), Math.max(0, Math.floor((H - bh) / 2))];
    this.scr.box(bx, by, bw, bh, '03', '00', `Postcard ${i + 1}/${this.postcards.length}`, '0C', { kind: 'hud', accent: '0C' });
    const ox = bx + Math.floor((bw - cw) / 2);
    for (let y = 0; y < ch; y++) {
      const row = p.rows[sy + y];
      const fg = p.fg[sy + y] || '';
      for (let x = 0; x < cw; x++) this.scr.put(ox + x, by + 1 + y, row[sx + x] ?? ' ', fg.slice((sx + x) * 2, (sx + x) * 2 + 2) || '05');
    }
    this.scr.put(bx + 2, by + ch + 2, caption, '0C');
    this.scr.put(bx + 2, by + ch + 3, hint, '03');
  }

  async mantel_menu(): Promise<void> {
    if (!this.souvenirs.length) {
      await this.say('An empty mantel. Festival ribbons and keepsakes from days you remember will stand here.', 'Mantel');
      return;
    }
    while (true) {
      const opts = [...this.souvenirs.map((v) => `${v.name}  (${absdayLabel(v.day, false)})`), 'Leave'];
      const sel = await this.menu(`♕ Mantel  (${this.souvenirs.length} keepsake${this.souvenirs.length === 1 ? '' : 's'})`, opts, 0, (i: number) => {
        const v = this.souvenirs[i];
        return v ? [`  ${absdayLabel(v.day)}`, `  ${v.text}`] : [];
      });
      if (sel === null || sel >= this.souvenirs.length) return;
      const v = this.souvenirs[sel];
      await this.say(`${absdayLabel(v.day)}: ${v.text}`, v.name);
    }
  }

  // ---------------------------------------------------------------- shared memories (mechanics task 07)
  /** Keep a moment with a villager for Villager Notes. With a key, the same moment is kept only once. */
  remember(npc: string, text: string, key?: string): boolean {
    if (!NPCS[npc]) return false;
    if (key && this.memories.some((m) => m.key === key)) return false;
    this.memories.push({ day: this.absday(), npc, text, ...(key ? { key } : {}) });
    if (this.memories.length > MEMORY_MAX) this.memories.splice(0, this.memories.length - MEMORY_MAX);
    return true;
  }

  // ---------------------------------------------------------------- villagers remember milestones (mechanics task 03)
  /** Museum cases (by label) where every piece has been donated. */
  museum_cases_done(): string[] {
    return this.museum_categories()
      .filter(([, cat]) => {
        const pool = this.museum_pool(cat);
        return pool.length > 0 && pool.every((i) => this.museum.includes(i));
      })
      .map(([label]) => label);
  }

  /** How a milestone remark reads in Villager Notes. */
  milestone_memory(key: string): string {
    const [who, what, extra] = key.split(':');
    if (what === 'first_shipment') return `${who} remembered picking up your very first shipment.`;
    if (what === 'case') return `${who} put your name on the finished ${extra} case at the museum.`;
    if (what === 'footbridge') return `${who} thanked you for the Willow Bend footbridge.`;
    return `${who} remembered something you did.`;
  }

  /** Something this villager has not yet said about what you've done, with its key; or null. */
  milestone_line(n: string): { key: string; line: string } | null {
    const said = (k: string) => this.milestones_said.includes(k);
    if (n === 'Otto' && this.shipped_total > 0 && !said('Otto:first_shipment')) {
      const top = Object.entries(this.shipped_counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? 'Turnips';
      return { key: 'Otto:first_shipment', line: MILESTONE_LINES.first_shipment.replace('{item}', top) };
    }
    if (n === 'Curator') {
      const done = this.museum_cases_done().find((c) => !said(`Curator:case:${c}`));
      if (done) return { key: `Curator:case:${done}`, line: MILESTONE_LINES.museum_case.replace('{case}', done) };
    }
    const bridge = MILESTONE_LINES.footbridge[n];
    if (bridge && this.public_works.built && !said(`${n}:footbridge`)) return { key: `${n}:footbridge`, line: bridge };
    return null;
  }

  /** Rowan's watering-can advice from the current can level, or null once it is past Hilde's ore upgrades. */
  gray_advice() {
    return canUpgradeAdvice(this.can_level_soon(), UPGRADE, CAN_CAP);
  }

  /** The watering can's level, counting an upgrade already paid for at Hilde's forge. */
  can_level_soon(): number {
    const lvl = this.levels['Watering Can'] || 0;
    return this.upgrading?.[0] === 'Watering Can' ? lvl + 1 : lvl;
  }

  /** The one-line next step Rowan's note gives (Today's Plan and his reminder). */
  gray_note(): string {
    const lvl = this.levels['Watering Can'] || 0;
    if (lvl >= this.gray_note_level) return 'Your can is ready; tell Rowan how it went.';
    if (this.can_level_soon() >= this.gray_note_level) return 'Hilde has your can; collect it, then tell Rowan.';
    const soon = this.can_level_soon();
    const [cost, ore] = UPGRADE[soon + 1] || [0, ''];
    return `Take Hilde ${cost}G + 1 ${ore} for a ${LEVELS[soon + 1]} can.`;
  }

  /** What Rowan says when Hilde's ore upgrades have nothing more for the can (Starsteel and up). */
  gray_past_ore_line(lvl: number): string {
    if (lvl >= 7) return "A Heirloom can? There's nothing left to forge. I just wanted to see it.";
    if (lvl === 6) {
      const [cost, ore] = UPGRADE[7];
      return `Hallowed, huh. The only step left is Heirloom: ${cost.toLocaleString('en-US')}G and a ${ore} from the deep Copperseam Mine.`;
    }
    if (lvl === 5) return 'That fey can needs Lucan at the church before anyone forges it again.';
    return "Starsteel's the last thing Hilde forges from ore. Past that, people talk about fey tools in the Mirewater Mine.";
  }

  /**
   * Task 04. Chapter one: Rowan asks for Copperseam Mine copper. Chapter two: after delivery he
   * explains which watering-can upgrade is worth saving for and leaves a note; it closes when
   * the can reaches that level. Returns false when the quest has nothing to say this time.
   */
  async gray_quest_talk(): Promise<boolean> {
    const have = this.inv['Copper'] || 0;
    if (this.gray_quest === 0) {
      this.gray_quest = 1;
      await this.say(
        `Got a minute? Hilde has me practising on scrap, and I'm out of copper. Bring me ${GRAY_COPPER_QTY} Copper from the Copperseam Mine and I'll make it worth your while.`,
        'Rowan'
      );
      return true;
    }
    if (this.gray_quest === 1) {
      if (have < GRAY_COPPER_QTY) {
        if (this.talked.has('Rowan')) return false;
        await this.say(`Still need ${GRAY_COPPER_QTY} Copper from the Copperseam Mine. You've got ${have}.`, 'Rowan');
        return true;
      }
      this.take('Copper', GRAY_COPPER_QTY);
      this.gold += GRAY_COPPER_REWARD;
      this.friend['Rowan'] = clamp((this.friend['Rowan'] || 0) + GRAY_QUEST_FRIEND, 0, 100);
      this.requests_done += 1;
      this.fx_add('coin', this.px, this.py, 0.8);
      this.fx_add('text', this.px, this.py, 1.1, { text: `+${GRAY_COPPER_REWARD}G` });
      await this.say(`That's good copper. Here's ${GRAY_COPPER_REWARD}G. Let me show you something about that watering can of yours.`, 'Rowan');
      const a = this.gray_advice();
      if (!a) {
        this.gray_quest = 3;
        await this.say(this.gray_past_ore_line(this.can_level_soon()), 'Rowan');
        return true;
      }
      const { now, next, big } = a;
      await this.say(
        `${this.upgrading?.[0] === 'Watering Can' ? "Once Hilde's done, it" : 'Right now it'} holds ${now.cap} and waters ${now.tiles} tile${now.tiles === 1 ? '' : 's'} a pour. ${LEVELS[next.level]} is the one to save for: ${next.cost}G + 1 ${next.ore}, and it holds ${next.cap} and waters ${next.tiles}.`,
        'Rowan'
      );
      if (big) {
        await this.say(
          big.level > next.level + 1
            ? `After that, skip worrying until ${LEVELS[big.level]}: that's the big jump, ${big.tiles} tiles a pour. Everything between is a small step.`
            : `After that, ${LEVELS[big.level]} is the big jump: ${big.tiles} tiles a pour.`,
          'Rowan'
        );
      }
      this.gray_quest = 2;
      this.gray_note_level = next.level;
      await this.say(`I wrote it down for you. "${this.gray_note()}" — Rowan`, 'Note');
      this.msg("Rowan's note was added to Today's Plan.", '0C');
      return true;
    }
    if (this.gray_quest === 2) {
      if ((this.levels['Watering Can'] || 0) >= this.gray_note_level) {
        this.gray_quest = 3;
        this.friend['Rowan'] = clamp((this.friend['Rowan'] || 0) + GRAY_QUEST_FRIEND, 0, 100);
        await this.say(
          `There it is, a ${LEVELS[this.levels['Watering Can'] || 0]} can. Feels lighter on the wrist than you'd think, right? Hilde even nodded at my copper. Thanks for that.`,
          'Rowan'
        );
        return true;
      }
      if (this.talked.has('Rowan')) return false;
      await this.say(`Remember my note: ${this.gray_note()}`, 'Rowan');
      return true;
    }
    return false;
  }

  async propose(n: string): Promise<void> {
    const d = NPCS[n];
    if (!d?.bach) {
      await this.say('What a beautiful Promise Ribbon! You should give it to someone special.', n);
    } else if (this.married) {
      await this.say("You're already married! Go home to your family.", n);
    } else if (!this.house_flags.includes('Big Bed')) {
      await this.say('A Promise Ribbon...? I care for you too, but your house needs a Big Bed before we can wed!', n);
    } else if ((this.friend[n] || 0) < 90) {
      await this.say("A Promise Ribbon...? I'm sorry. My heart isn't at Red yet—let's grow closer first.", n);
    } else {
      this.take('Promise Ribbon');
      await this.say('A Promise Ribbon...! Is this... a proposal? YES! Of course, yes!', n);
      await this.say('A week later, the whole town gathers at the Church.', null);
      await this.say(`Brother Lucan: Do you, ${this.name}, take ${n} to be your spouse?`, null);
      await this.say(`You say 'I do.' The bells of Brackenford ring out for ${this.name} and ${n}!`, null);
      this.married = n;
      this.marriage_day = this.absday();
      delete this.npc_pos[n];
      await this.say(`${n} has moved into your farmhouse. Congratulations!`, null);
    }
  }

  async ship(): Promise<void> {
    while (true) {
      const basketCount = getBasketTotal(this.basket);
      const items = py_sorted(Object.keys(this.inv)).filter((i) => ITEMS[i] && ITEMS[i][0] > 0);
      if (!items.length && basketCount === 0) {
        await this.say('You have nothing shippable in your rucksack or Basket.', 'Shipping Bin');
        return;
      }
      const opts: string[] = [];
      if (basketCount > 0) {
        const bVal = py_sum(
          Object.entries(this.basket).map(([i, q]) => (ITEMS[i] ? ITEMS[i][0] : 0) * q)
        );
        opts.push(`Empty Harvest Basket into Bin (${basketCount}/${BASKET_CAPACITY} items — ${bVal}G)`);
      }
      opts.push(...items.map((i) => `${i} x${this.inv[i]} (${ITEMS[i][0]}G each)`), 'Done');
      const pending = py_sum(
        Object.entries(this.bin).map(([i, q]) => (ITEMS[i] ? ITEMS[i][0] : 0) * q)
      );
      const contractInfo = this.contracts
        .filter((c) => !c.done)
        .map((c) => `  Otto contract: ship ${c.item} (${c.shipped}/${c.need}) for +${c.bonusGold}G by ${absdayLabel(c.deadline, false)}`);
      const sel = await this.menu(`Shipping Bin  (in bin: ${pending}G — pickup at 5PM)`, opts, 0, contractInfo.length ? contractInfo : null);
      if (sel === null || opts[sel] === 'Done') {
        return;
      }
      if (basketCount > 0 && sel === 0) {
        for (const [bItem, bQty] of Object.entries(this.basket)) {
          this.bin[bItem] = (this.bin[bItem] || 0) + bQty;
        }
        this.basket = {};
        this.msg(`Dumped all ${basketCount} items from your Basket into the Shipping Bin!`, '09');
        continue;
      }
      const itemIdx = basketCount > 0 ? sel - 1 : sel;
      const item = items[itemIdx];
      const q = await this.ask_qty(`Ship how many ${item}?`, this.inv[item], ITEMS[item][0], 'Value');
      if (q) {
        this.take(item, q);
        this.bin[item] = (this.bin[item] || 0) + q;
        this.msg(`Shipped ${q} ${item}. Otto collects at 5:00 PM.`, '09');
      }
    }
  }

  private rucksack_item_notes(item: string, basketTotal: number): { text: string; fg: string }[] {
    const notes: { text: string; fg: string }[] = [];
    if (item === 'Basket') {
      const contents = Object.entries(this.basket)
        .map(([k, v]) => `${k} ×${v}`)
        .join(', ');
      notes.push({
        text: `Holds up to ${BASKET_CAPACITY} shippable items (${basketTotal}/${BASKET_CAPACITY}).`,
        fg: '0C',
      });
      notes.push({
        text: contents ? `Inside: ${contents}` : 'Empty — Hold while harvesting crops with X to pack automatically.',
        fg: contents ? '05' : '04',
      });
      return notes;
    }

    const preserve = this.preserve_note(item);
    if (preserve) notes.push({ text: preserve, fg: '09' });

    if (item.endsWith(' Seeds')) {
      const crop = item.slice(0, -6);
      for (const ln of this.crop_forecast_lines(crop)) notes.push({ text: ln, fg: '0B' });
      if (item === `${COMPANION.helper} Seeds`) {
        notes.push({
          text: `Companion: bloom beside ${COMPANION.crop} gives ${1 + COMPANION.bonus} per picking.`,
          fg: '0A',
        });
      } else if (item === `${COMPANION.crop} Seeds`) {
        notes.push({
          text: `Companion: plant beside blooming ${COMPANION.helper} for +${COMPANION.bonus} yield.`,
          fg: '0A',
        });
      }
    }

    if (item === 'Compost') {
      notes.push({
        text: `Equip (Tab) and spread on tilled soil: +${COMPOST_BONUS} at next harvest.`,
        fg: '0B',
      });
    } else if (item === 'Waystone') {
      notes.push({ text: 'Use from actions to warp straight to any valley landmark.', fg: '0C' });
    } else if (item === SAPLING) {
      notes.push({ text: 'Equip & plant on orchard spots east of the farmhouse (Fall fruit).', fg: '0B' });
    } else if (isFarmPiece(item)) {
      notes.push({ text: FARM_PIECES[item].info, fg: '05' });
    }

    const recipe = this.seed_recipe(item);
    if (recipe) {
      notes.push({
        text: `Seed Saver: ${recipe.need} ${item} → ${recipe.bags} Seed Bag.`,
        fg: '0B',
      });
    }

    // Saturday market demand hint (avoid duplicating preserve note)
    if (!preserve) {
      const wants = this.market_wants();
      if (wants.pantry.includes(item)) {
        notes.push({ text: `Sat Market: Gideon seeks ${item} (${MARKET_SHOPPERS.pantry.markup}×).`, fg: '09' });
      } else if (wants.flower === item) {
        notes.push({ text: `Sat Market: Rosalind seeks ${item} (${MARKET_SHOPPERS.flower.markup}×).`, fg: '0A' });
      }
    }

    // Active Otto shipping contracts & weekly board order
    const contract = this.contracts.find((c) => !c.done && c.item === item);
    if (contract) {
      notes.push({
        text: `Otto Contract: ${contract.shipped}/${contract.need} shipped (+${contract.bonusGold}G bonus).`,
        fg: '0C',
      });
    }
    if (this.order) {
      const t = ORDERS.find((o) => o.id === this.order!.id);
      if (t) {
        const pieceIdx = t.pieces.findIndex((p) => p.any.includes(item));
        if (pieceIdx >= 0 && (this.order.delivered[pieceIdx] || 0) < t.pieces[pieceIdx].qty) {
          notes.push({
            text: `Board Order (${t.npc}): ${this.order.delivered[pieceIdx]}/${t.pieces[pieceIdx].qty} delivered.`,
            fg: '0E',
          });
        }
      }
    }

    const eat = ITEMS[item]?.[1] || 0;
    if (eat > 0 && (ITEMS[item]?.[2] === 'dish' || item in RECIPES)) {
      const b = foodBuffForDish(item, eat);
      if (b) notes.push({ text: `Meal Buff: ${b.label}`, fg: '0A' });
    } else if (item.includes('Brisk Tonic') || item === 'Hedgerow Tea' || item === 'Relaxation Tea' || item === 'Frostwort') {
      notes.push({ text: 'Also eases -35 Fatigue when consumed.', fg: '0C' });
    }

    if (ITEMS[item]?.[2] === 'crop') {
      notes.push({ text: 'Can also be tossed on the farm Compost Heap.', fg: '04' });
    }

    return notes;
  }

  private async rucksack_item_action(item: string, basketTotal: number): Promise<'continue' | 'close'> {
    const sub = [this.held === item ? 'Put away' : 'Hold (to gift / offer / use)'];
    if (ITEMS[item] && ITEMS[item][1] !== 0) {
      sub.push('Eat');
    }
    if (item !== 'Basket' && this.inv['Basket'] && ITEMS[item]?.[0] > 0 && basketTotal < BASKET_CAPACITY) {
      sub.push(`Put in Basket (${basketTotal}/${BASKET_CAPACITY})`);
    }
    if (item === 'Waystone') {
      sub.push('Teleport');
    }
    if (item === 'Record Player') {
      sub.push('Play Record');
    }
    const recipe = this.seed_recipe(item);
    if (recipe) sub.push(`Save seeds (${recipe.need} → ${recipe.bags} bag)`);
    if (ITEMS[item]?.[2] === 'crop') {
      sub.push('Compost one');
      if ((this.inv[item] || 0) > 1) sub.push(`Compost all ${this.inv[item]}`);
    }
    sub.push('Cancel');
    const s2 = await this.menu(
      `▣ ${item}`,
      sub,
      0,
      null,
      null,
      { style: { kind: 'hud', accent: '09' }, alignToMap: true },
    );
    if (s2 === null || sub[s2] === 'Cancel') return 'continue';
    if (sub[s2] === 'Eat') {
      this.take(item);
      const baseGain = ITEMS[item][1];
      const gain = ITEMS[item][2] === 'forage' && this.has_perk('forage_stamina') ? Math.round(baseGain * 1.25) : baseGain;
      this.stamina = clamp(this.stamina + gain, 0, this.max_stamina);
      if (item.includes('Brisk Tonic') || item === 'Hedgerow Tea' || item === 'Relaxation Tea' || item === 'Frostwort') {
        this.fatigue = Math.max(0, this.fatigue - 35);
      }
      let buffNote = '';
      if (ITEMS[item][2] === 'dish' || item in RECIPES) {
        const b = foodBuffForDish(item, gain);
        if (b) {
          this.food_buff = { kind: b.kind, label: b.label, until: this.now_abs() + FOOD_BUFF_MINUTES };
          buffNote = ` · Buff: ${b.label}`;
        }
      }
      this.msg(`You ate the ${item}. (${gain >= 0 ? '+' : ''}${gain} Stamina${buffNote})`, '0B');
    } else if (sub[s2].startsWith('Put in Basket')) {
      const space = BASKET_CAPACITY - basketTotal;
      const maxPut = Math.min(space, this.inv[item]);
      const q = maxPut === 1 ? 1 : await this.ask_qty(`Put how many ${item} in Basket?`, maxPut, ITEMS[item][0], 'Value');
      if (q > 0) {
        this.take(item, q);
        this.basket[item] = (this.basket[item] || 0) + q;
        this.msg(`Placed ${q} ${item} into your Basket (${getBasketTotal(this.basket)}/${BASKET_CAPACITY}).`, '09');
      }
    } else if (sub[s2] === 'Teleport') {
      await this.use_teleport_stone();
      return 'close';
    } else if (sub[s2] === 'Play Record') {
      await this.music_menu();
    } else if (sub[s2].startsWith('Save seeds')) {
      await this.seed_saving_menu(item);
    } else if (sub[s2] === 'Compost one') {
      this.compost_crop(item, 1);
    } else if (sub[s2].startsWith('Compost all')) {
      this.compost_crop(item, this.inv[item] || 0);
    } else if (sub[s2] === 'Put away') {
      this.held = null;
      this.msg(`You put away the ${item}.`);
    } else {
      this.held = item;
      this.msg(
        item === 'Basket'
          ? `Holding Basket (${basketTotal}/${BASKET_CAPACITY}). Harvest crops with X to fill it automatically!`
          : `You hold the ${item}. Face someone or a pond and press X.`,
      );
      return 'close';
    }
    return 'continue';
  }

  private async rucksack_legacy(): Promise<void> {
    while (true) {
      const items = py_sorted(Object.keys(this.inv));
      if (!items.length) return;
      const basketTotal = getBasketTotal(this.basket);
      const opts = items.map((i) => {
        if (i === 'Basket') {
          return `${i === this.held ? '>' : ' '} Basket (${basketTotal}/${BASKET_CAPACITY} items)`;
        }
        return `${i === this.held ? '>' : ' '} ${i} x${this.inv[i]}`;
      });
      const entries: HudMenuEntry[] = items.map((i) => {
        const isHeld = i === this.held;
        if (i === 'Basket') {
          return {
            icon: '▣',
            iconCol: '09',
            label: isHeld ? 'Basket [HELD]' : 'Basket',
            right: `${basketTotal}/${BASKET_CAPACITY}`,
            rightCol: '0C',
          };
        }
        const cat = ITEMS[i]?.[2] || 'item';
        const [glyph, gCol] = ITEM_BADGE[cat] || ['·', '05'];
        return {
          icon: glyph,
          iconCol: gCol,
          label: isHeld ? `${i} [HELD]` : i,
          right: `x${this.inv[i]}`,
          rightCol: isHeld ? '0A' : '09',
        };
      });
      const info = (s: number) => {
        const i = items[s];
        if (i === 'Basket') {
          const contents = Object.entries(this.basket)
            .map(([k, v]) => `${k} x${v}`)
            .join(', ');
          return [
            `Basket · Holds up to ${BASKET_CAPACITY} shippable items (${basketTotal}/${BASKET_CAPACITY})`,
            `${contents || 'Empty — Hold Basket while harvesting crops!'}`,
          ];
        }
        const [sell, eat, cat] = ITEMS[i] || [0, 0, 'item'];
        const parts = [PRESERVES.includes(i) ? 'PRESERVE' : cat.toUpperCase()];
        if (sell) parts.push(`Ships ${sell}G`);
        if (eat) parts.push(`${eat > 0 ? '+' : ''}${eat} Stamina`);
        const preserve = this.preserve_note(i);
        if (preserve) return [parts.join('  ·  '), preserve];
        const forecast = i.endsWith(' Seeds') ? this.crop_forecast_lines(i.slice(0, -6)) : [];
        if (i === 'Compost') forecast.push(`Equip it (Tab) and spread it on tilled soil: +${COMPOST_BONUS} at that tile's next harvest.`);
        return [parts.join('  ·  '), ...forecast];
      };
      const sel = await this.menu('▣ Rucksack', opts, 0, info, null, {
        style: { kind: 'hud', accent: '09' },
        alignToMap: true,
        banner: () => ({
          left: this.held ? `HELD: ${this.held}` : 'HELD: Empty hands',
          leftCol: this.held ? '0A' : '04',
          right: `${items.length} ${items.length === 1 ? 'kind' : 'kinds'}`,
          rightCol: '09',
        }),
        entries,
        footerHint: 'Enter: Action · Esc: Close',
      });
      if (sel === null) return;
      const res = await this.rucksack_item_action(items[sel], basketTotal);
      if (res === 'close') return;
    }
  }

  async rucksack(): Promise<void> {
    if (this.menu !== Game.prototype.menu) {
      return this.rucksack_legacy();
    }

    let activeTab: InvCategory = 'all';
    let sortMode: InvSort = 'category';
    let lastSelected: string | null = this.held;

    while (true) {
      const basketTotal = getBasketTotal(this.basket);
      const allEntries = buildInventoryEntries(
        this.inv,
        this.held,
        basketTotal,
        BASKET_CAPACITY,
        (n) => ITEMS[n],
        (n) => PRESERVES.includes(n),
      );
      if (!allEntries.length) {
        await this.show_hud_pages(
          '▣ Rucksack',
          (cw) => [
            [
              {
                kind: 'ledger',
                prefix: '▣',
                prefixCol: '09',
                label: 'HELD: Nothing',
                labelCol: '04',
                value: '0 kinds',
                valueCol: '03',
              },
              { kind: 'fence' },
              {
                kind: 'spans',
                spans: [{ text: 'Your rucksack is empty.', fg: '07', bold: true }],
              },
              ...wrapLine('Forage herbs & berries, harvest crops, or visit Hollis\'s Supermarket in town to stock up.', cw).map(
                (ln): HudPageLine => ({ kind: 'spans', spans: [{ text: ln, fg: '04' }] }),
              ),
            ],
          ],
          { style: { kind: 'hud', accent: '09' }, alignToMap: true, minWidth: 44, footerHint: 'Any key — Close' },
        );
        return;
      }

      const tabs = buildInventoryTabs(allEntries);
      if (!tabs.some((t) => t.id === activeTab)) activeTab = 'all';
      let filtered = sortAndFilterInventory(allEntries, activeTab, sortMode);

      const getRows = () => {
        const [W, H] = [this.scr.w, this.scr.h];
        const divX = this.scr.ctx?.divX ?? W;
        const divY = this.scr.ctx?.divY ?? H;
        const lay = computeInventoryLayout(W, H, divX, divY);
        const showHeaders = lay.listH >= 9;
        return { lay, rows: buildDisplayRows(filtered, activeTab, sortMode, showHeaders) };
      };

      let { rows } = getRows();
      let curRowIdx = findItemRowIndex(rows, lastSelected);

      const draw = () => {
        const { lay, rows: liveRows } = getRows();
        rows = liveRows;
        if (curRowIdx < 0 || curRowIdx >= rows.length || rows[curRowIdx]?.kind !== 'item') {
          curRowIdx = findItemRowIndex(rows, lastSelected);
        }
        const enhanced = this.scr.style === 'enhanced';
        this.scr.box(lay.bx, lay.by, lay.bw, lay.bh, '09', '00', '▣ Rucksack', '07', { kind: 'hud', accent: '09' });

        // Top-border Held badge
        const heldLabel = this.held ? `HELD: ${this.held}` : 'Empty hands';
        const maxTopRight = Math.max(6, lay.bw - 18);
        const topRight = heldLabel.length > maxTopRight ? heldLabel.slice(0, maxTopRight - 1) + '…' : heldLabel;
        const topRx = lay.bx + lay.bw - 2 - topRight.length;
        this.scr.put(topRx, lay.by, topRight, this.held ? '0A' : '03', '00', !!this.held);

        // Category tab strip + sort pill (row by + 1)
        const sortLabel = ` / ${INV_SORT_LABEL[sortMode]} `;
        const sortX = lay.bx + lay.bw - 2 - sortLabel.length;
        const tabAvailW = lay.split ? sortX - (lay.bx + 2) - 1 : lay.bw - 4;
        const fullStripW = tabs.reduce(
          (acc, t, idx) => acc + (t.id === activeTab ? t.label.length + 2 : t.label.length + 1) + String(t.count).length + (idx > 0 ? 1 : 0),
          0,
        );
        const useShortTabs = !lay.split || fullStripW > tabAvailW;
        const strip = fitTabStrip(tabs, activeTab, tabAvailW, useShortTabs);
        if (strip.leftArrow) {
          this.scr.put(lay.bx + 2, lay.tabRowY, '<', '0C', '00', true);
          this.scr.tag(lay.bx + 2, lay.tabRowY, { t: 'ui', hit: 'inv:tab-prev' });
        }
        for (const chip of strip.chips) {
          const cx = lay.bx + 2 + chip.x;
          if (chip.active) {
            this.scr.put(cx, lay.tabRowY, chip.text, '07', '00', true);
            this.scr.put(cx, lay.tabRowY, '▸', '0C', '00', true);
            for (let i = 0; i < chip.text.length; i++) {
              this.scr.tag(cx + i, lay.tabRowY, { t: 'ui', k: 'hud:sign', hit: `inv:tab:${chip.id}` });
            }
          } else {
            const dot = chip.text.indexOf('·');
            if (dot >= 0) {
              const namePart = chip.text.slice(0, dot);
              const countPart = chip.text.slice(dot);
              this.scr.put(cx, lay.tabRowY, namePart, '04', '00', false);
              this.scr.put(cx + namePart.length, lay.tabRowY, countPart, '03', '00', false);
            } else {
              this.scr.put(cx, lay.tabRowY, chip.text, '04', '00', false);
            }
            for (let i = 0; i < chip.text.length; i++) {
              this.scr.tag(cx + i, lay.tabRowY, { t: 'ui', hit: `inv:tab:${chip.id}` });
            }
          }
        }
        if (strip.rightArrow) {
          const rx = lay.bx + 2 + tabAvailW - 1;
          this.scr.put(rx, lay.tabRowY, '>', '0C', '00', true);
          this.scr.tag(rx, lay.tabRowY, { t: 'ui', hit: 'inv:tab-next' });
        }
        if (lay.split) {
          this.scr.put(sortX, lay.tabRowY, ' / ', '0C', '00', true);
          this.scr.put(sortX + 3, lay.tabRowY, `${INV_SORT_LABEL[sortMode]} `, '07', '00', false);
          for (let i = 0; i < sortLabel.length; i++) {
            this.scr.tag(sortX + i, lay.tabRowY, { t: 'ui', k: 'hud:sign', hit: 'inv:sort' });
          }
        }

        // Fence beneath tabs
        this.draw_hud_fence(lay.bx, lay.topFenceY, lay.bw);

        // Item list viewport
        const vp = computeListViewport(rows, curRowIdx, lay.listH);
        const hasScroll = rows.length > lay.listH;
        const itemRowW = hasScroll ? lay.listW - 1 : lay.listW;
        const scrollX = lay.listX + lay.listW - 1;

        for (let r = 0; r < lay.listH; r++) {
          const ry = lay.listY + r;
          const row = vp.visRows[r];
          if (hasScroll) {
            const onThumb = r >= vp.thumbTop && r < vp.thumbTop + vp.thumbHeight;
            this.scr.put(scrollX, ry, onThumb ? '█' : '│', onThumb ? '09' : '01');
          }
          if (!row) continue;

          if (row.kind === 'header') {
            const title = `── ${row.label} (${row.count}) `;
            const ruleLen = Math.max(0, itemRowW - title.length);
            const clippedTitle = title.slice(0, itemRowW);
            this.scr.put(lay.listX, ry, clippedTitle, row.color, '00', true);
            if (ruleLen > 0) {
              this.scr.put(lay.listX + clippedTitle.length, ry, '─'.repeat(ruleLen), '01');
            }
            continue;
          }

          const rowAbsIdx = vp.top + r;
          const active = rowAbsIdx === curRowIdx;
          const rowBg = active ? '0D' : '00';
          const entry = row.entry;
          const fmt = formatListItemRow(entry, itemRowW);

          this.scr.put(lay.listX - 1, ry, ' '.repeat(itemRowW + 1), active ? '07' : '05', rowBg, active);
          this.scr.put(lay.listX, ry, active ? '>' : ' ', active ? (enhanced ? '0C' : '00') : '03', rowBg, active);
          this.scr.put(lay.listX + 2, ry, entry.glyph, active ? (enhanced ? entry.glyphCol : '00') : entry.glyphCol, rowBg, active);
          this.scr.put(lay.listX + 4, ry, fmt.nameStr, active ? (enhanced ? '07' : '00') : '05', rowBg, active);
          if (entry.held) {
            this.scr.put(lay.listX + 4 + fmt.nameStr.length, ry, '*', active ? (enhanced ? '0A' : '00') : '0A', rowBg, true);
          }

          let rightCursor = lay.listX + itemRowW;
          if (fmt.tagStr) {
            rightCursor -= fmt.tagStr.length;
            const tCol = active
              ? enhanced
                ? entry.name === 'Basket'
                  ? '0C'
                  : '04'
                : '00'
              : entry.name === 'Basket'
                ? '0C'
                : '03';
            this.scr.put(rightCursor, ry, fmt.tagStr, tCol, rowBg, active && entry.name === 'Basket');
            rightCursor -= 1;
          }
          if (fmt.qtyStr) {
            const qx = rightCursor - fmt.qtyStr.length;
            const qCol = active ? (enhanced ? '09' : '00') : entry.held ? '0A' : '09';
            this.scr.put(qx, ry, fmt.qtyStr, qCol, rowBg, active);
          }

          for (let x = lay.listX - 1; x < lay.listX + itemRowW; x++) {
            this.scr.tag(x, ry, { t: 'ui', hit: `inv:pick:${rowAbsIdx}` });
          }
        }

        // Selected item for inspector
        const activeRow = rows[curRowIdx];
        const selEntry: InvItemEntry | null = activeRow?.kind === 'item' ? activeRow.entry : null;

        if (lay.split) {
          for (let r = 0; r < lay.listH; r++) {
            this.scr.put(lay.splitX, lay.listY + r, '│', '01');
          }
          if (selEntry) {
            this.draw_rucksack_detail_split(selEntry, lay.detailX, lay.detailY, lay.detailW, lay.detailH, basketTotal);
          }
        } else {
          this.draw_hud_fence(lay.bx, lay.detailY - 1, lay.bw);
          if (selEntry) {
            this.draw_rucksack_detail_stacked(selEntry, lay.detailX, lay.detailY, lay.detailW, lay.detailH, basketTotal);
          }
        }

        // Footer fence & controls
        this.draw_hud_fence(lay.bx, lay.bottomFenceY, lay.bw);
        const itemPos = activeRow?.kind === 'item' ? activeRow.itemIndex + 1 : 0;
        const countTxt = `${itemPos}/${filtered.length}`;
        const rightBtn = lay.split ? `${countTxt}  [Esc]` : `${countTxt}`;
        const footAvail = Math.max(10, lay.bw - 5 - rightBtn.length);
        const sortTag = `/ ${INV_SORT_LABEL[sortMode]}`;
        const leftHint = lay.split
          ? fitText(
              footAvail,
              '↑↓ Move · ←→ Tab · / Sort · Enter Use',
              '↑↓ · ←→ Tab · / Sort · Enter Use',
              'Enter Use · Esc Close',
            )
          : fitText(
              footAvail,
              `↑↓ · ←→ Tab · ${sortTag} · Enter Use`,
              `←→ Tab · ${sortTag} · Enter`,
            );
        const clippedHint = leftHint.slice(0, footAvail);
        this.scr.put(lay.bx + 2, lay.footerY, clippedHint, '04');
        const sortPos = clippedHint.indexOf(lay.split ? '/ Sort' : sortTag);
        if (sortPos >= 0) {
          const sLen = (lay.split ? '/ Sort' : sortTag).length;
          this.scr.put(lay.bx + 2 + sortPos, lay.footerY, '/', '0C', '00', true);
          for (let i = 0; i < sLen; i++) {
            this.scr.tag(lay.bx + 2 + sortPos + i, lay.footerY, { t: 'ui', hit: 'inv:sort' });
          }
        }
        const usePos = clippedHint.indexOf('Enter Use');
        if (usePos >= 0) {
          this.scr.put(lay.bx + 2 + usePos, lay.footerY, 'Enter', '0C', '00', true);
          for (let i = 0; i < 9; i++) {
            this.scr.tag(lay.bx + 2 + usePos + i, lay.footerY, { t: 'ui', hit: 'inv:act' });
          }
        }
        const rightStart = lay.bx + lay.bw - 2 - rightBtn.length;
        this.scr.put(rightStart, lay.footerY, countTxt, '0C', '00', true);
        if (lay.split) {
          this.scr.put(rightStart + countTxt.length + 2, lay.footerY, '[Esc]', '04', '00', false);
          for (let i = 0; i < 5; i++) {
            this.scr.tag(rightStart + countTxt.length + 2 + i, lay.footerY, { t: 'ui', hit: 'inv:close' });
          }
        }
      };

      let actionItem: string | null = null;
      while (true) {
        const k = await this.modal(draw);
        const activeRow = rows[curRowIdx];
        const currentEntry = activeRow?.kind === 'item' ? activeRow.entry : null;
        if (currentEntry) lastSelected = currentEntry.name;

        if (['up', 'w', 'k'].includes(k)) {
          curRowIdx = stepItemRow(rows, curRowIdx, -1);
        } else if (['down', 's', 'j'].includes(k)) {
          curRowIdx = stepItemRow(rows, curRowIdx, 1);
        } else if (k === 'pgup') {
          const { lay } = getRows();
          curRowIdx = pageItemRow(rows, curRowIdx, lay.listH, -1);
        } else if (k === 'pgdn') {
          const { lay } = getRows();
          curRowIdx = pageItemRow(rows, curRowIdx, lay.listH, 1);
        } else if (k === 'home') {
          curRowIdx = findItemRowIndex(rows, null);
        } else if (k === 'end') {
          for (let i = rows.length - 1; i >= 0; i--) {
            if (rows[i].kind === 'item') {
              curRowIdx = i;
              break;
            }
          }
        } else if (['left', 'a', 'h', 'btab', '['].includes(k) || k === 'inv:tab-prev') {
          const tIdx = tabs.findIndex((t) => t.id === activeTab);
          activeTab = tabs[(tIdx - 1 + tabs.length) % tabs.length].id;
          filtered = sortAndFilterInventory(allEntries, activeTab, sortMode);
          rows = getRows().rows;
          curRowIdx = findItemRowIndex(rows, lastSelected);
        } else if (['right', 'd', 'l', 'tab', ']'].includes(k) || k === 'inv:tab-next') {
          const tIdx = tabs.findIndex((t) => t.id === activeTab);
          activeTab = tabs[(tIdx + 1) % tabs.length].id;
          filtered = sortAndFilterInventory(allEntries, activeTab, sortMode);
          rows = getRows().rows;
          curRowIdx = findItemRowIndex(rows, lastSelected);
        } else if (k.length === 1 && /^[1-8]$/.test(k)) {
          const target = tabs[Number(k) - 1];
          if (target) {
            activeTab = target.id;
            filtered = sortAndFilterInventory(allEntries, activeTab, sortMode);
            rows = getRows().rows;
            curRowIdx = findItemRowIndex(rows, lastSelected);
          }
        } else if (['/', 'o', 'O', 'f', 'F'].includes(k) || k === 'inv:sort') {
          sortMode = nextSortMode(sortMode);
          filtered = sortAndFilterInventory(allEntries, activeTab, sortMode);
          rows = getRows().rows;
          curRowIdx = findItemRowIndex(rows, lastSelected);
        } else if (k.startsWith('inv:tab:')) {
          const want = k.slice('inv:tab:'.length) as InvCategory;
          if (tabs.some((t) => t.id === want)) {
            activeTab = want;
            filtered = sortAndFilterInventory(allEntries, activeTab, sortMode);
            rows = getRows().rows;
            curRowIdx = findItemRowIndex(rows, lastSelected);
          }
        } else if (k.startsWith('inv:pick:')) {
          const idx = Number(k.slice('inv:pick:'.length));
          if (Number.isInteger(idx) && rows[idx]?.kind === 'item') {
            if (idx === curRowIdx) {
              actionItem = (rows[idx] as { kind: 'item'; entry: InvItemEntry }).entry.name;
              break;
            }
            curRowIdx = idx;
          }
        } else if (OK_KEYS.has(k) || k === 'inv:act') {
          if (currentEntry) {
            actionItem = currentEntry.name;
            break;
          }
        } else if (CANCEL_KEYS.has(k) || k === 'i' || k === 'I' || k === 'inv:close') {
          return;
        }
      }

      if (actionItem) {
        const res = await this.rucksack_item_action(actionItem, basketTotal);
        if (res === 'close') return;
      }
    }
  }

  private draw_rucksack_detail_split(
    entry: InvItemEntry,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    basketTotal: number,
  ): void {
    const tabMeta = INV_TABS.find((t) => t.id === entry.tabCat)!;
    // Title line
    this.scr.put(dx, dy, entry.glyph, entry.glyphCol, '00', true);
    const titleStr = entry.name.length > dw - 2 ? entry.name.slice(0, dw - 3) + '…' : entry.name;
    this.scr.put(dx + 2, dy, titleStr, '07', '00', true);

    // Subtitle / category + [HELD]
    const subTag = entry.isPreserve
      ? 'PRESERVE'
      : HYBRID_CROPS.has(entry.name)
        ? 'HYBRID CROP'
        : entry.rawCat.toUpperCase();
    this.scr.put(dx, dy + 1, subTag.slice(0, dw - (entry.held ? 7 : 0)), tabMeta.color, '00', false);
    if (entry.held && dw >= 10) {
      const heldBadge = ' HELD ';
      const hx = dx + dw - heldBadge.length;
      this.scr.put(hx, dy + 1, heldBadge, '0A', '00', true);
      for (let i = 0; i < heldBadge.length; i++) this.scr.tag(hx + i, dy + 1, { t: 'ui', k: 'hud:sign' });
    }
    this.scr.put(dx, dy + 2, '─'.repeat(dw), '01');

    // Ledger stats
    let r = dy + 3;
    const putLedger = (label: string, val: string, vCol: string) => {
      if (r >= dy + dh - 1) return;
      this.scr.put(dx, r, label, '04');
      const vClip = val.slice(0, Math.max(4, dw - label.length - 1));
      this.scr.put(dx + dw - vClip.length, r, vClip, vCol, '00', true);
      r++;
    };

    putLedger(
      'In Bag',
      entry.name === 'Basket' ? `${basketTotal}/${BASKET_CAPACITY} slots` : `×${entry.qty}`,
      entry.name === 'Basket' ? '0C' : '09',
    );
    putLedger(
      'Ships',
      entry.sell > 0
        ? entry.qty > 1
          ? `${entry.sell}G (${entry.sell * entry.qty}G)`
          : `${entry.sell}G`
        : 'Not shippable',
      entry.sell > 0 ? '09' : '03',
    );
    putLedger(
      'Energy',
      entry.stamina !== 0 ? `${entry.stamina > 0 ? '+' : ''}${entry.stamina} Stamina` : '—',
      entry.stamina > 0 ? '0B' : entry.stamina < 0 ? '08' : '03',
    );

    const cropKey = entry.name.endsWith(' Seeds') ? entry.name.slice(0, -6) : entry.name;
    const cropDef = CROPS[cropKey];
    if (cropDef && cropKey !== 'Grass') {
      const [season, , grow, regrow] = cropDef;
      const gStr = `${season} · ${grow}d${regrow ? ` (+${regrow}d)` : ''}`;
      putLedger('Grow', gStr, SEASON_COL[season] || '0B');
    }

    // Contextual notes
    const notes = this.rucksack_item_notes(entry.name, basketTotal);
    if (notes.length && r < dy + dh - 2) {
      r++;
      for (const note of notes) {
        for (const ln of wrapLine(note.text, dw)) {
          if (r >= dy + dh - 1) break;
          this.scr.put(dx, r, ln.slice(0, dw), note.fg);
          r++;
        }
        if (r >= dy + dh - 1) break;
      }
    }

    // Bottom action CTA pill
    if (dh >= 6) {
      const btn = ' [Enter] Actions ▸ ';
      const bx = dx + Math.max(0, Math.floor((dw - btn.length) / 2));
      const by = dy + dh - 1;
      const clipBtn = btn.slice(0, dw);
      this.scr.put(bx, by, clipBtn, '07', '00', true);
      if (clipBtn.includes('[Enter]')) {
        const idx = clipBtn.indexOf('[Enter]');
        this.scr.put(bx + idx, by, '[Enter]', '0C', '00', true);
      }
      for (let i = 0; i < clipBtn.length; i++) {
        this.scr.tag(bx + i, by, { t: 'ui', k: 'hud:sign', hit: 'inv:act' });
      }
    }
  }

  private draw_rucksack_detail_stacked(
    entry: InvItemEntry,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    basketTotal: number,
  ): void {
    const tabMeta = INV_TABS.find((t) => t.id === entry.tabCat)!;
    const badge = entry.isPreserve ? '[PRESERVE]' : `[${tabMeta.label.toUpperCase()}]`;
    const heldTxt = entry.held ? ' [HELD]' : '';
    const rightMeta = `${badge}${heldTxt}`;
    const maxName = Math.max(8, dw - 3 - rightMeta.length);
    const title = entry.name.length > maxName ? entry.name.slice(0, maxName - 1) + '…' : entry.name;
    this.scr.put(dx, dy, entry.glyph, entry.glyphCol, '00', true);
    this.scr.put(dx + 2, dy, title, '07', '00', true);
    const rx = dx + dw - rightMeta.length;
    this.scr.put(rx, dy, badge, tabMeta.color);
    if (entry.held) this.scr.put(rx + badge.length, dy, heldTxt, '0A', '00', true);

    const stats: string[] = [];
    if (entry.name === 'Basket') {
      stats.push(`Basket ${basketTotal}/${BASKET_CAPACITY}`);
    } else {
      stats.push(entry.sell > 0 ? `Ships ${entry.sell}G${entry.qty > 1 ? ` (${entry.sell * entry.qty}G)` : ''}` : 'Not shippable');
      if (entry.stamina !== 0) stats.push(`${entry.stamina > 0 ? '+' : ''}${entry.stamina} Stam`);
    }
    const cropKey = entry.name.endsWith(' Seeds') ? entry.name.slice(0, -6) : entry.name;
    if (CROPS[cropKey] && cropKey !== 'Grass') {
      stats.push(`${CROPS[cropKey][0]} ${CROPS[cropKey][2]}d`);
    }
    this.scr.put(dx, dy + 1, stats.join(' · ').slice(0, dw), '05');

    const notes = this.rucksack_item_notes(entry.name, basketTotal);
    const wrapped = wrapNoteLines(
      notes.slice(0, 2).map((n) => n.text),
      dw,
    );
    const noteCol = notes[0]?.fg || '04';
    for (let i = 0; i < Math.min(dh - 2, wrapped.length); i++) {
      this.scr.put(dx, dy + 2 + i, wrapped[i].slice(0, dw), noteCol);
    }
  }

  async coop(): Promise<void> {
    this.sync_animal_records();
    while (true) {
      const flockSummary = this.chicken_personalities.length
        ? `  Flock temperaments: ${this.chicken_personalities.slice(0, 6).join(', ')}`
        : '';
      const info = [
        `  Chickens: ${this.chickens}/${this.coop_cap()}   Fed: ${this.fed}   Affection: ${this.chicken_aff}/100`,
        `  Eggs waiting: ${this.eggs}   Incubator: ${this.incubator_days > 0 ? `${this.incubator_days}d left` : 'Empty'}   Feed: ${this.inv['Chicken Feed'] || 0}`,
        ...(flockSummary ? [flockSummary] : []),
        ...(this.enrichment.perch ? ['  Cedar Perch installed (+2 daily affection on fair days).'] : []),
        ...(this.makers.includes('Mayonnaise Maker')
          ? [`  Mayonnaise Maker (outside, west of the door): ${this.maker_status('Mayonnaise Maker')}`]
          : []),
      ];
      const opts = [
        'Fill feed boxes',
        'Collect eggs (Quality based on affection)',
        'Place Egg in Incubator (3 days to hatch)',
      ];
      opts.push('Grazing / Outdoor Bell (+Outdoor Hours)', 'Leave');
      const sel = await this.menu('Chicken Coop', opts, 0, info);
      if (sel === null || opts[sel] === 'Leave') return;
      const act = opts[sel];
      if (act === 'Fill feed boxes') {
        if (!this.chickens) {
          await this.say('The coop is empty. Rosalind sells chickens at the Feathercote.', null);
          continue;
        }
        const n = Math.min(this.chickens - this.fed, this.inv['Chicken Feed'] || 0);
        if (this.fed >= this.chickens) {
          await this.say('Every feed box is already full.', null);
        } else if (!n) {
          await this.say("You're out of Chicken Feed. Buy it at the Feathercote or grind Corn in the Mill!", null);
        } else {
          this.take('Chicken Feed', n);
          this.fed += n;
          this.chicken_aff = Math.min(100, this.chicken_aff + 2);
          this.msg(`You filled ${n} feed box${n > 1 ? 'es' : ''}. Cluck cluck!`, '09');
        }
      } else if (act.startsWith('Collect eggs')) {
        if (this.eggs > 0) {
          const eggType = getEggQuality(this.chicken_aff, this.chicken_fest_won, this.outdoor_hours, py_rng().random());
          this.give(eggType, this.eggs);
          playSfx('harvest');
          this.msg(`Collected ${this.eggs} x ${eggType}!`, '07');
          this.mastery_add('ranching');
          this.eggs = 0;
        } else {
          await this.say('No eggs waiting right now.', null);
        }
      } else if (act.startsWith('Place Egg in Incubator')) {
        if (this.incubator_days > 0) {
          await this.say(`An egg is already incubating (${this.incubator_days} day(s) until it hatches!).`, null);
        } else if (this.chickens >= this.coop_cap()) {
          await this.say('Your coop is at full capacity!', null);
        } else {
          const eggItem = ['Egg', 'Good Egg', 'High Egg', 'Golden Egg', 'P Egg'].find((e) => (this.inv[e] || 0) > 0);
          if (!eggItem) {
            await this.say('You need an Egg in your rucksack to place on the Incubator.', null);
          } else {
            this.take(eggItem, 1);
            this.incubator_days = 3;
            this.msg(`Placed ${eggItem} in the Incubator! A chick will hatch in 3 days.`, '09');
          }
        }
      } else if (act.startsWith('Grazing')) {
        if (this.weather !== 'Sunny') {
          await this.say('Only let chickens outside on Sunny days! Rain makes them unhappy.', null);
        } else {
          this.animals_grazing = true;
          this.outdoor_hours += 10;
          this.chicken_aff = Math.min(100, this.chicken_aff + 3 + (this.enrichment.perch ? 1 : 0));
          this.fed = this.chickens;
          const note = this.chicken_personalities[0] ? ` A ${this.chicken_personalities[0]} hen ${PERSONALITY_NOTES[this.chicken_personalities[0]].chicken}.` : '';
          this.msg(`Your chickens grazed outside! (Outdoor hours: ${this.outdoor_hours}h, all fed!)${note}`, '0B');
        }
      }
    }
  }

  /** Minutes since the start of the game's calendar; it runs on through the night. */
  now_abs(): number {
    return this.absday() * 1440 + this.minutes;
  }

  /** Stand each installed Maker on the farm (and take away any the current farm doesn't own). */
  place_makers(): void {
    const m = this.maps['farm'];
    if (!m) return;
    for (const [name, spot] of Object.entries(MAKER_SPOTS)) {
      if (this.makers.includes(name)) m.set(spot.x, spot.y, 'maker');
      else if (m.tile(spot.x, spot.y) === 'maker') m.set(spot.x, spot.y, 'grass');
    }
  }

  /** The installed Maker standing at a farm tile, if any. */
  maker_at(x: number, y: number): string | null {
    if (this.mapname !== 'farm') return null;
    const hit = Object.entries(MAKER_SPOTS).find(([name, sp]) => sp.x === x && sp.y === y && this.makers.includes(name));
    return hit ? hit[0] : null;
  }

  /** 'idle' (empty), 'working' (a batch inside, not done yet) or 'ready' (a batch waiting to be collected). */
  maker_state(maker: string): 'idle' | 'working' | 'ready' {
    const job = this.maker_jobs[maker];
    if (!job) return 'idle';
    return this.now_abs() >= job.ready ? 'ready' : 'working';
  }

  /** When a batch finishing at absolute minute `ready` is done: 'at 2:00PM', 'by morning', 'tomorrow at 9:00AM'. */
  maker_when(ready: number): string {
    const day = Math.floor(ready / 1440);
    const at = fmt_time(ready % 1440).trim();
    const today = this.absday();
    if (day <= today) return `at ${at}`;
    if (day === today + 1 && ready % 1440 <= 6 * 60) return 'by morning';
    if (day === today + 1) return `tomorrow at ${at}`;
    return `on ${absdayLabel(day, false)} at ${at}`;
  }

  /** '1h 20m' until a batch is done. */
  maker_left(ready: number): string {
    const left = Math.max(0, ready - this.now_abs());
    const h = Math.floor(left / 60);
    const mm = left % 60;
    return h ? `${h}h ${mm.toString().padStart(2, '0')}m` : `${mm}m`;
  }

  /**
   * Put every grade of a Maker's raw goods from the rucksack into it. The batch keeps each grade
   * apart, so a Golden Egg still comes out as Golden Mayonnaise. Returns the message, or null if the
   * Maker isn't installed, already holds a batch, or there is nothing to load.
   */
  load_maker(maker: string): string | null {
    if (!this.makers.includes(maker) || this.maker_jobs[maker]) return null;
    const steps = makerBatch(maker, this.inv);
    if (!steps.length) return null;
    for (const st of steps) this.take(st.input, st.qty);
    const ready = this.now_abs() + MAKER_SPOTS[maker].hours * 60;
    this.maker_jobs[maker] = { steps, ready };
    const [n] = makerGain(steps);
    const line = `Loaded ${n} ${MAKER_NOUNS[maker][0]} into the ${maker}: ready ${this.maker_when(ready)}.`;
    this.msg(line, MAKER_NOUNS[maker][2]);
    return line;
  }

  /**
   * Take a finished batch out, grade by grade. The message stays one short line (it must fit the
   * single desktop message row): a lone grade is named, several are summarised; the machine's menu
   * listed each grade before collecting, and the rucksack shows them after.
   */
  collect_maker(maker: string): string | null {
    if (this.maker_state(maker) !== 'ready') return null;
    const { steps } = this.maker_jobs[maker];
    delete this.maker_jobs[maker];
    for (const st of steps) this.give(st.output, st.qty);
    const [n, gain] = makerGain(steps);
    const line =
      steps.length === 1
        ? `Collected ${n} x ${steps[0].output} from the ${maker}! (+${gain}G)`
        : `Collected ${n} ${MAKER_NOUNS[maker][1]} in ${steps.length} grades! (+${gain}G)`;
    this.msg(line, MAKER_NOUNS[maker][2]);
    return line;
  }

  /** One line per grade, for the machine's menu: '3 x Golden Egg → Golden Mayonnaise'. */
  maker_grade_lines(steps: MakerStep[], done: boolean): string[] {
    return steps.map((st) => (done ? `    ${st.qty} x ${st.output}` : `    ${st.qty} x ${st.input} → ${st.output}`));
  }

  /** A Maker's status in a few words, for the coop and barn menus and Today's Plan. */
  maker_status(maker: string, short: boolean = false): string {
    const job = this.maker_jobs[maker];
    const st = this.maker_state(maker);
    const noun = MAKER_NOUNS[maker];
    const head = short ? `${maker.replace(/ Maker$/, '')}: ` : '';
    if (st === 'ready') return `${head}ready to collect`;
    if (job) return `${head}${makerGain(job.steps)[0]} ${noun[0]} in, ready ${this.maker_when(job.ready)}`;
    const [n] = makerGain(makerBatch(maker, this.inv));
    if (short) return `${head}${n} ${noun[0]} to load`;
    return n ? `empty (${n} ${noun[0]} in your rucksack to load)` : 'empty';
  }

  /** Walk up to a Maker on the farm: load a batch, see when it is done, collect it there. */
  async maker_menu(maker: string): Promise<void> {
    const noun = MAKER_NOUNS[maker];
    while (true) {
      const st = this.maker_state(maker);
      const job = this.maker_jobs[maker];
      if (st === 'ready') {
        const [n, gain] = makerGain(job.steps);
        const info = ['  Done! Ready to collect:', ...this.maker_grade_lines(job.steps, true), `  Adds ${gain}G over the raw ${noun[0]}.`];
        const opts = [`Collect ${n} ${noun[1]}`, 'Leave'];
        const sel = await this.menu(maker, opts, 0, info);
        if (sel !== 0) return;
        this.collect_maker(maker);
        if (!makerBatch(maker, this.inv).length) return;
        continue;
      }
      if (st === 'working') {
        const info = [
          `  Working: ready ${this.maker_when(job.ready)} (${this.maker_left(job.ready)} left).`,
          ...this.maker_grade_lines(job.steps, false),
        ];
        await this.menu(maker, ['Leave'], 0, info);
        return;
      }
      const steps = makerBatch(maker, this.inv);
      if (!steps.length) {
        await this.say(
          `The ${maker} is empty. It takes every grade of ${noun[0]} in your rucksack and needs ${MAKER_SPOTS[maker].hours} hours.`,
          null,
        );
        return;
      }
      const [n, gain] = makerGain(steps);
      const ready = this.now_abs() + MAKER_SPOTS[maker].hours * 60;
      const info = [
        `  From your rucksack (each grade stays apart):`,
        ...this.maker_grade_lines(steps, false),
        `  Takes ${MAKER_SPOTS[maker].hours} hours: ready ${this.maker_when(ready)}, +${gain}G.`,
      ];
      const sel = await this.menu(maker, [`Load ${n} ${noun[0]}`, 'Leave'], 0, info);
      if (sel !== 0) return;
      this.load_maker(maker);
      return;
    }
  }

  /** Makers that want the player: batches ready to collect, plus raw goods an empty Maker could take. */
  maker_ready_count(): number {
    let n = 0;
    for (const m of this.makers) {
      const st = this.maker_state(m);
      if (st === 'ready') n += makerGain(this.maker_jobs[m].steps)[0];
      else if (st === 'idle') n += makerGain(makerBatch(m, this.inv))[0];
    }
    return n;
  }

  barn_cap(): number {
    return this.house_flags.includes('Barn Expansion') ? 16 : BARN_CAP;
  }

  animal_line(a: any): string {
    const h = Math.floor(a.aff / 10);
    const status: string[] = [];
    if (!a.fed) status.push('hungry');
    if (a.kind === 'cow' && a.ready) status.push('milk ready');
    if (a.kind === 'sheep' && a.wool >= WOOL_DAYS) status.push('wool ready');
    if (a.pregnantDays > 0) status.push(`pregnant (${a.pregnantDays}d)`);
    const kind = ANIMALS[a.kind][0];
    const coat = coatInfo(a.kind, a.coat);
    const pers = a.personality ? `, ${a.personality}` : '';
    return `${a.name} (${coat.label}${pers}) ${kind} [${'#'.repeat(h)}${'.'.repeat(10 - h)}] ${status.join(', ')}`;
  }

  async barn(): Promise<void> {
    this.sync_animal_records();
    while (true) {
      const unfed = this.animals.filter((a) => !a.fed).length;
      const tools = ['Milker', 'Clippers', 'Brush', 'Bell', 'Miracle Potion']
        .filter((t) => this.inv[t])
        .join(', ');
      const activePatch = this.pasture.active === 'west' ? 'West' : 'East';
      const activeGrass = this.pasture[this.pasture.active];
      const info = [
        `  Animals: ${this.animals.length}/${this.barn_cap()}   Hungry: ${unfed}   Fodder: ${this.inv['Fodder'] || 0}`,
        `  Pasture (${activePatch} Meadow active: ${activeGrass}% grass)   Tools: ${tools || 'none'}`,
        ...(this.enrichment.shadeTree ? ['  Pasture Shade Tree planted (+2 daily affection on fair days).'] : []),
        ...['Cheese Maker', 'Yarn Maker']
          .filter((m) => this.makers.includes(m))
          .map((m) => `  ${m} (outside the door): ${this.maker_status(m)}`),
      ];
      const opts = [
        'Fill fodder boxes',
        'Ring Grazing Bell (Graze Active Pasture)',
        'Barn Book (Coats & Family Records)',
        'Manage Rotating Pasture',
        ...this.animals.map((a) => this.animal_line(a)),
      ];
      opts.push('Leave');
      const sel = await this.menu('Livestock Barn', opts, 0, info);
      if (sel === null || opts[sel] === 'Leave') return;
      const choice = opts[sel];
      if (choice === 'Fill fodder boxes') {
        await this.barn_feed();
      } else if (choice.startsWith('Ring Grazing Bell')) {
        await this.graze_barn_pasture();
      } else if (choice.startsWith('Barn Book')) {
        await this.barn_book();
      } else if (choice.startsWith('Manage Rotating Pasture')) {
        await this.pasture_menu();
      } else {
        const animalIdx = sel - 4;
        if (this.animals[animalIdx]) {
          await this.animal_care(this.animals[animalIdx]);
        }
      }
    }
  }

  async graze_barn_pasture(): Promise<void> {
    if (this.weather !== 'Sunny') {
      await this.say('Keep cows and sheep inside during bad weather!', null);
      return;
    }
    const patch = this.pasture.active;
    const grass = this.pasture[patch];
    const patchName = patch === 'west' ? 'West Meadow' : 'East Meadow';
    if (grass <= 0) {
      await this.say(`${patchName} is grazed bare (0% grass)! Open Manage Rotating Pasture in the Barn Menu to switch patches.`, null);
      return;
    }
    this.animals_grazing = true;
    this.outdoor_hours += 10;
    const lush = grass >= 40;
    if (this.pasture.grazedDay !== this.absday()) {
      this.pasture[patch] = Math.max(0, grass - PASTURE_GRAZE_COST);
      this.pasture.grazedDay = this.absday();
    }
    for (const a of this.animals) {
      a.fed = true;
      a.aff = Math.min(100, a.aff + (lush ? 3 : 2) + (this.enrichment.shadeTree ? 1 : 0));
    }
    this.msg(`Livestock grazed in ${patchName} (${this.pasture[patch]}% grass left; Outdoor hours: ${this.outdoor_hours}h)`, '0B');
  }

  async barn_feed(): Promise<void> {
    if (!this.animals.length) {
      await this.say('The barn is empty. Abel sells cows and sheep at Highmeadow Dairy.', null);
      return;
    }
    const hungry = this.animals.filter((a) => !a.fed);
    if (!hungry.length) {
      await this.say('Every fodder box is already full.', null);
      return;
    }
    const n = Math.min(hungry.length, this.inv['Fodder'] || 0);
    if (!n) {
      await this.say("You're out of Fodder. Buy it at Highmeadow Dairy or cut pasture Grass with your Sickle!", null);
      return;
    }
    this.take('Fodder', n);
    for (const a of hungry.slice(0, n)) {
      a.fed = true;
    }
    this.msg(`You filled ${n} fodder box${n > 1 ? 'es' : ''}. Moo!`, '09');
  }

  async animal_care(a: any): Promise<void> {
    while (true) {
      const name = a.name;
      const opts = ['Talk'];
      if (this.inv['Brush']) opts.push('Brush');
      if (a.kind === 'cow' && this.inv['Milker']) opts.push('Milk');
      if (a.kind === 'sheep' && this.inv['Clippers']) opts.push('Shear');
      if (this.inv['Miracle Potion'] && !a.pregnantDays) opts.push('Use Miracle Potion (Breed)');
      opts.push('Back');
      const sel = await this.menu(this.animal_line(a), opts);
      if (sel === null || opts[sel] === 'Back') return;
      const act = opts[sel];
      if (act === 'Talk') {
        if (a.talked) {
          await this.say(`${name} looks at you contentedly.`, name);
        } else {
          a.talked = true;
          a.aff = Math.min(100, a.aff + 2);
          const sound = a.kind === 'cow' ? 'Moooo!' : 'Baaaa!';
          const pers: AnimalPersonality = a.personality || 'calm';
          this.mastery_add('ranching');
          await this.say(`${sound} ${name} (${pers}) ${PERSONALITY_NOTES[pers].talk}`, name);
        }
      } else if (act === 'Brush') {
        if (a.brushed) {
          await this.say(`${name}'s coat is already shiny.`, name);
        } else {
          a.brushed = true;
          a.aff = Math.min(100, a.aff + 3);
          this.msg(`You brushed ${name}. ${name} looks pleased!`, '0B');
          this.mastery_add('ranching');
          await this.spend(1);
        }
      } else if (act === 'Milk') {
        if (!a.ready) {
          await this.say(`${name} has no milk right now. Feed ${name} today and try tomorrow.`, null);
        } else {
          a.ready = false;
          a.aff = Math.min(100, a.aff + 2);
          const item = getMilkQuality(a.aff, Boolean(a.wonFestival), this.outdoor_hours, py_rng().random());
          this.give(item);
          this.msg(`You milked ${name}: ${item}!`, '07');
          this.mastery_add('ranching');
          await this.spend(2);
        }
      } else if (act === 'Shear') {
        if (a.wool < WOOL_DAYS) {
          const left = WOOL_DAYS - a.wool;
          await this.say(`${name}'s wool needs ${left} more well-fed day${left > 1 ? 's' : ''} to grow back.`, null);
        } else {
          a.wool = 0;
          a.aff = Math.min(100, a.aff + 2);
          const item = getWoolQuality(a.aff, Boolean(a.wonFestival), this.outdoor_hours, py_rng().random());
          this.give(item);
          this.msg(`You sheared ${name}: ${item}!`, '07');
          this.mastery_add('ranching');
          await this.spend(2);
        }
      } else if (act.startsWith('Use Miracle Potion')) {
        if (this.animals.length >= this.barn_cap()) {
          await this.say('Your barn is full!', null);
        } else {
          this.take('Miracle Potion', 1);
          a.pregnantDays = 7;
          this.msg(`${name} is now expecting! A newborn will arrive in 7 days!`, '0A');
        }
      }
      if (this.mapname === 'house') return;
    }
  }

  async buy_animal(kind: string): Promise<void> {
    const [label, price] = ANIMALS[kind];
    if (this.animals.length >= this.barn_cap()) {
      await this.say('Your barn is full!', 'Abel');
      return;
    }
    if (this.gold < price) {
      await this.say(`A ${label.toLowerCase()} is ${price}G. Come back when you've saved up.`, 'Abel');
      return;
    }
    if (!(await this.confirm(`Buy a ${label.toLowerCase()} for ${price}G?`))) return;
    const names = kind === 'cow' ? COW_NAMES : SHEEP_NAMES;
    const taken = new Set(this.animals.map((a) => a.name));
    const defName = names.find((n) => !taken.has(n)) || `${label}${this.animals.length + 1}`;
    const name = (await this.text_input(`Name your ${label.toLowerCase()}:`, defName)).slice(0, 10);
    this.gold -= price;
    const coat = breedCoat(kind, undefined, undefined, py_rng().random());
    const personality = pickPersonality(this.animals.length + this.absday() + name.charCodeAt(0));
    this.animals.push({
      name,
      kind,
      aff: 15,
      fed: false,
      ready: false,
      wool: 0,
      talked: false,
      brushed: false,
      wonFestival: false,
      pregnantDays: 0,
      coat,
      personality,
      bornDay: this.absday(),
      parents: ['Highmeadow Herd', null],
    });
    const coatLabel = coatInfo(kind, coat).label;
    await this.say(`${name} (${coatLabel}, ${personality}) will be waiting in your barn. Fill the fodder box every day!`, 'Abel');
  }

  async buy_barn_tool(item: string, price: number): Promise<void> {
    if (this.inv[item]) {
      await this.say(`You already have a ${item}.`, 'Abel');
    } else if (this.gold < price) {
      await this.say(`The ${item} is ${price}G.`, 'Abel');
    } else if (await this.confirm(`Buy a ${item} for ${price}G?`)) {
      this.gold -= price;
      this.give(item);
      this.msg(`Bought a ${item}.`, '09');
    }
  }

  barn_new_day(report: string[]): void {
    let hungry = 0;
    const newBabies: any[] = [];
    for (const a of this.animals) {
      if (a.pregnantDays > 0) {
        a.pregnantDays -= 1;
        if (a.pregnantDays === 0 && this.animals.length + newBabies.length < this.barn_cap()) {
          const babyName = `${a.name}Jr`.slice(0, 10);
          const mate = this.animals.find((o) => o !== a && o.kind === a.kind);
          const babyCoat = breedCoat(a.kind, a.coat, mate?.coat, py_rng().random());
          const babyPers = pickPersonality(this.absday() + this.animals.length + newBabies.length);
          const coatObj = coatInfo(a.kind, babyCoat);
          newBabies.push({
            name: babyName,
            kind: a.kind,
            aff: 30,
            fed: true,
            ready: false,
            wool: 0,
            talked: false,
            brushed: false,
            wonFestival: false,
            pregnantDays: 0,
            coat: babyCoat,
            personality: babyPers,
            bornDay: this.absday(),
            parents: [a.name, mate ? mate.name : 'Highmeadow Sire'],
          });
          report.push(`${a.name} gave birth to ${babyName} (${coatObj.label}${coatObj.rare ? ' — rare coat!' : ''}) in the barn!`);
        }
      }
      if (a.fed) {
        if (this.has_perk('ranch_aff')) a.aff = Math.min(100, a.aff + 2);
        if (this.enrichment.shadeTree && this.weather === 'Sunny') a.aff = Math.min(100, a.aff + 2);
        if (a.kind === 'cow') {
          a.ready = true;
        } else {
          a.wool = Math.min(WOOL_DAYS, a.wool + 1);
        }
      } else {
        hungry += 1;
        a.aff = Math.max(0, a.aff - 5);
      }
      a.fed = false;
      a.talked = false;
      a.brushed = false;
    }
    this.animals.push(...newBabies);
    if (hungry) {
      report.push(`${hungry} barn animal${hungry > 1 ? 's' : ''} went hungry yesterday.`);
    }
  }

  async sprite_hut_menu(): Promise<void> {
    while (true) {
      const opts = [
        ...SPRITES.map((s) => {
          const aff = this.sprite_aff[s.name] || 0;
          const hearts = Math.floor(aff / 10);
          const job = this.sprite_jobs[s.name] || { task: 'none', days: 0, skill: 10 };
          const jobTxt = job.days > 0 ? `${job.task} (${job.days}d)` : 'idle';
          return `${s.name} (${s.colorName}) [${'#'.repeat(hearts)}${'.'.repeat(10 - hearts)}] — ${jobTxt}`;
        }),
        'Leave Hearthfolk Hut',
      ];
      const sel = await this.menu('Hearthfolk Hut (Willow Bend)', opts);
      if (sel === null || sel === SPRITES.length) return;
      const sp = SPRITES[sel];
      await this.sprite_interact(sp);
    }
  }

  async sprite_interact(sp: (typeof SPRITES)[number]): Promise<void> {
    const sName = sp.name;
    while (true) {
      const aff = this.sprite_aff[sName] || 0;
      const job = this.sprite_jobs[sName] || { task: 'none', days: 0, skill: 10 };
      const opts = [
        'Talk',
        `Give Held Item (${this.held || 'none'})`,
        'Give Flour from Rucksack (+8 Affection)',
        'Hire for Farm Work (Requires 3+ Hearts)',
        'Play Hearthfolk Mini-Game (+Skill & Affection)',
        'Back',
      ];
      const sel = await this.menu(`${sName} (${sp.colorName} Sprite) — Skill: ${job.skill}%`, opts);
      if (sel === null || opts[sel] === 'Back') return;
      if (sel === 0) {
        this.sprite_aff[sName] = Math.min(100, aff + 2);
        await this.say(
          `Budum! I'm ${sName}! I love Flour, Honey, Bread, and ${sp.grass}! At 3 hearts I can help on your farm!`,
          sName
        );
      } else if (sel === 1) {
        if (!this.held) {
          await this.say('Hold an item in your Rucksack first, or choose Give Flour!', sName);
        } else {
          const item = this.held;
          this.take(item, 1);
          const bonus = item === sp.grass || item === 'Flour' || item === 'Honey' ? 10 : 4;
          this.sprite_aff[sName] = Math.min(100, aff + bonus);
          await this.say(`Yay! Thank you for the ${item}! (+${bonus} Friendship!)`, sName);
        }
      } else if (sel === 2) {
        if (!this.inv['Flour']) {
          await this.say('Buy Flour at Hollis\'s Supermarket (50G) to gift the Hearthfolk!', sName);
        } else {
          this.take('Flour', 1);
          this.sprite_aff[sName] = Math.min(100, aff + 10);
          this.msg(`${sName} loves the Flour! (+10 Friendship)`, '0B');
        }
      } else if (sel === 3) {
        if ((this.sprite_aff[sName] || 0) < 30) {
          await this.say(`You need at least 3 Hearts (30 Friendship) before ${sName} will work on your farm!`, sName);
          continue;
        }
        const taskSel = await this.menu(`Hire ${sName} for which task?`, [
          'Water Crops (1, 3, or 7 days)',
          'Harvest Crops to Bin (1, 3, or 7 days)',
          'Care for Animals (1, 3, or 7 days)',
          'Cancel',
        ]);
        if (taskSel === null || taskSel === 3) continue;
        const durSel = await this.menu('Hire for how many days?', ['1 Day', '3 Days', '7 Days']);
        if (durSel === null) continue;
        const days = [1, 3, 7][durSel];
        const task = ['Watering', 'Harvesting', 'Animals'][taskSel];
        this.sprite_jobs[sName] = { task, days, skill: job.skill };
        await this.say(`Leave the ${task.toLowerCase()} to me for the next ${days} day(s), boss! Budum!`, sName);
      } else if (sel === 4) {
        const score = await this.fest_mash(3.5, 14, `${sName}'s Farm Training Game`);
        job.skill = Math.min(100, job.skill + (score >= 14 ? 8 : 3));
        this.sprite_aff[sName] = Math.min(100, (this.sprite_aff[sName] || 0) + 4);
        await this.say(
          `That was fun! My work skill is now ${job.skill}%! (${score} pts)`,
          sName
        );
      }
    }
  }

  async kai_shack_menu(): Promise<void> {
    if (this.season !== 1) {
      await this.say("Nico's Seaside Lodge is closed until Summer.", null);
      return;
    }
    const sel = await this.menu(`Nico's Seaside Lodge   ${this.gold}G`, [
      'Eat Roasted Corn (150G, +35 Stamina)',
      'Eat Nico\'s Baked Pineapple (300G, +70 Stamina)',
      'Talk to Nico',
      'Leave',
    ]);
    if (sel === 0 && this.gold >= 150) {
      this.gold -= 150;
      this.stamina = Math.min(this.max_stamina, this.stamina + 35);
      await this.say('Hot off the grill! (+35 Stamina)', 'Nico');
    } else if (sel === 1 && this.gold >= 300) {
      this.gold -= 300;
      this.stamina = Math.min(this.max_stamina, this.stamina + 70);
      await this.say('Sweet tropical pineapple! (+70 Stamina)', 'Nico');
    } else if (sel === 2) {
      await this.talk('Nico');
    }
  }

  async visit(bid: string): Promise<void> {
    if (!(await this.building_open(bid))) return;
    if (bid in this.interiors) {
      this.enter_interior(bid);
      return;
    }
    await this.shop_menu(bid);
  }

  async building_open(bid: string): Promise<boolean> {
    if (await this.fest_closed(bid)) return false;
    const name = BUILDINGS[bid];
    const [o, c, closed] = HOURS[bid];
    if (closed.includes(this.weekday) || !(o * 60 <= this.minutes && this.minutes < c * 60)) {
      const days = py_sorted(closed)
        .map((d: number) => WEEKDAYS[d])
        .join(', ');
      await this.say(
        `The ${name} is closed. Open ${fmt_hour(o)} - ${fmt_hour(c)}${days ? `, closed ${days}` : ''}.`,
        null
      );
      return false;
    }
    return true;
  }

  async shop_menu(bid: string, people_fn: (() => string[]) | null = null): Promise<void> {
    const name = BUILDINGS[bid];
    while (true) {
      const people = people_fn
        ? people_fn()
        : Object.entries(NPCS)
            .filter(([n, d]) => d.home === bid && !this.is_out(n) && n !== this.married)
            .map(([n]) => n);
      const shop = await this.shop_options(bid);
      const opts = [...shop.map((s: any) => s[0]), ...people.map((p) => `Talk to ${p}`), 'Leave'];
      const sel = await this.menu(`${name}   ${this.gold}G`, opts);
      if (sel === null || sel === opts.length - 1) return;
      if (sel < shop.length) {
        await shop[sel][1]();
      } else {
        await this.talk(people[sel - shop.length]);
      }
    }
  }

  build_interiors(): void {
    this.interiors = {};
    this.interior_bid = {};
    this.indoor_npcs = {};
    for (const [mname, m] of Object.entries(this.maps)) {
      for (const [coordKey, bid] of Object.entries(m.doors)) {
        if (!(bid in INTERIOR_LAYOUTS) || bid in this.interiors) continue;
        const [dx, dy] = parseCoordKey(coordKey);
        const front =
          ([
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
          ] as [number, number][])
            .map(([ox, oy]): [number, number] => [dx + ox, dy + oy])
            .find(([fx, fy]) => TILES[m.tile(fx, fy)]?.[3]) || [dx, dy + 1];
        const [im, entry, spots] = build_interior(bid, [mname, front[0], front[1]]);
        this.maps[im.name] = im;
        this.interiors[bid] = { map: im.name, entry, spots };
        this.interior_bid[im.name] = bid;
      }
    }
  }

  enter_interior(bid: string): void {
    const info = this.interiors[bid];
    this.riding_horse = false;
    this.warp(info.map, info.entry[0], info.entry[1], [0, -1]);
    this.msg(`You step into the ${BUILDINGS[bid]}.`, '0C');
  }

  keeper_of(bid: string): string | null {
    return (
      Object.entries(NPCS)
        .filter(([, d]) => d.home === bid && !d.out)
        .map(([n]) => n)[0] || null
    );
  }

  update_indoor_npcs(): void {
    for (const [n, d] of Object.entries(NPCS)) {
      const info = this.interiors[d.home];
      if (!info || this.is_out(n) || n === this.married) {
        delete this.indoor_npcs[n];
        continue;
      }
      if (n in this.indoor_npcs) continue;
      const bid = d.home;
      const keeper = this.keeper_of(bid);
      const residents = Object.entries(NPCS)
        .filter(([r, rd]) => rd.home === bid && r !== keeper)
        .map(([r]) => r);
      const spots = info.spots;
      let pos: [number, number] | null = null;
      let fixed = false;
      if (n === keeper && 'k' in spots) {
        pos = spots['k'];
        fixed = true;
      } else {
        const i = residents.indexOf(n);
        pos = spots[String(i + 1)] || null;
        if (!pos || this.npc_at(pos[0], pos[1], info.map)) {
          const anchor = spots['1'] || info.entry;
          pos = this.free_spot(info.map, anchor[0], anchor[1]);
        }
        fixed = false;
      }
      if (pos) {
        this.indoor_npcs[n] = { map: info.map, pos, home: pos, fixed };
      }
    }
  }

  indoor_npc_at(x: number, y: number, mapname: string): string | null {
    for (const [n, d] of Object.entries(this.indoor_npcs)) {
      if (d.map === mapname && d.pos[0] === x && d.pos[1] === y && n !== this.married) {
        return n;
      }
    }
    return null;
  }

  move_indoor_npcs(): void {
    for (const [, d] of Object.entries(this.indoor_npcs)) {
      if (d.map !== this.mapname || d.fixed || py_rng().random() > 0.35) continue;
      const [[x, y], [hx, hy]] = [d.pos, d.home];
      const [dx, dy] = py_rng().choice([
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]);
      const [nx, ny] = [x + dx, y + dy];
      if (Math.abs(nx - hx) > 2 || Math.abs(ny - hy) > 2) continue;
      const entry = this.interiors[this.interior_bid[d.map]]?.entry;
      if (entry && nx === entry[0] && ny === entry[1]) continue;
      if (this.walkable(d.map, nx, ny, true) && !this.npc_at(nx, ny) && !(nx === this.px && ny === this.py)) {
        d.pos = [nx, ny];
      }
    }
  }

  async interior_interact(tile: string, p: [number, number]): Promise<void> {
    const bid = this.interior_bid[this.mapname];
    if (tile === 'bookcase') {
      if (bid === 'library' && !this.berry_sources.includes('truth:library')) {
        this.give_truth_jewel('library');
      }
      await this.say(py_rng().choice(BOOKS), 'Book');
      return;
    }
    if (tile === 'furn') {
      if (bid === 'mayor' && p[0] === 1 && p[1] === 1) {
        if (!this.berry_sources.includes('truth:mayor_fridge')) {
          await this.say("You peek inside Mayor Ambrose's pantry shelf... Something glints behind the jars!", "Ambrose's Manor");
          this.give_truth_jewel('mayor_fridge');
        } else {
          await this.say("Mayor Ambrose's pantry shelves are neat and well-stocked.", "Ambrose's Manor");
        }
        return;
      }
      await this.say('Nothing unusual here.', BUILDINGS[bid] || null);
      return;
    }
    if (!bid) return;
    const behind = this.npc_at(p[0] + this.face[0], p[1] + this.face[1]);
    await this.shop_menu(bid, () => (behind ? [behind] : []));
  }

  async shop_options(bid: string): Promise<[string, () => Promise<void>][]> {
    if (bid === 'supermarket') {
      return [
        ['Buy seasonal seeds', () => this.buy_seeds()],
        ['Buy Flour (50G)', () => this.buy('Flour', 50)],
        ['Buy Oil (50G)', () => this.buy('Oil', 50)],
        ['Buy Curry Powder (50G)', () => this.buy('Curry Powder', 50)],
        ['Buy Rice (100G)', () => this.buy('Rice', 100)],
        ['Buy Bread (100G)', () => this.buy('Bread', 100)],
        [`Buy Plot Sign (${PLOT_SIGN_PRICE}G)`, () => this.buy('Plot Sign', PLOT_SIGN_PRICE, PLOT_MAX)],
        ['Buy Chocolate (100G)', () => this.buy('Chocolate', 100)],
        ['Buy Basket (5000G)', () => this.buy('Basket', 5000, 1)],
        ['Buy Promise Ribbon (1000G)', () => this.buy('Promise Ribbon', 1000, 1)],
        ['Buy Kitchen Utensils', () => this.buy_kitchen_goods()],
      ];
    }
    if (bid === 'zack') {
      return [
        ["Ferreira's Rare Seeds & Exotic Goods", () => this.won_shop()],
      ];
    }
    if (bid === 'winery') {
      return [
        ['Buy Wine (300G)', () => this.buy('Wine', 300)],
        ['Buy Grape Juice (200G)', () => this.buy('Grape Juice', 200)],
      ];
    }
    if (bid === 'carpenter') {
      return [
        ...(this.public_works.built
          ? []
          : ([[`Village project: ${PUBLIC_WORKS.name}`, () => this.works_menu()]] as [string, () => Promise<void>][])),
        ['Buy Lumber (50G)', () => this.buy('Lumber', 50)],
        ['Buy Golden Lumber (100,000G)', () => this.buy('Golden Lumber', 100000)],
        ['Order a House / Farm Expansion', () => this.order_expansion()],
        ...(!this.enrichment.perch ? ([[`Build Chicken Perch (${PERCH_COST.gold}G + ${PERCH_COST.lumber} Lumber)`, () => this.build_enrichment('perch')]] as [string, () => Promise<void>][]) : []),
        ...(!this.enrichment.shadeTree ? ([[`Plant Pasture Shade Tree (${SHADE_TREE_COST.gold}G + ${SHADE_TREE_COST.lumber} Lumber)`, () => this.build_enrichment('shadeTree')]] as [string, () => Promise<void>][]) : []),
        [`Buy Orchard Sapling (${SAPLING_PRICE}G)`, () => this.buy(SAPLING, SAPLING_PRICE, 3)],
        ...FARM_PIECE_NAMES.map((n) => [`Buy ${n} (${FARM_PIECES[n].price}G)`, () => this.buy_piece(n)] as [string, () => Promise<void>]),
      ];
    }
    if (bid === 'poultry') {
      return [
        ['Buy a Chicken (1500G)', () => this.buy_chicken()],
        ['Buy Chicken Feed (10G)', () => this.buy('Chicken Feed', 10)],
        ['Buy Animal Medicine (1000G)', () => this.buy('Animal Medicine', 1000)],
      ];
    }
    if (bid === 'blacksmith') {
      const geodeTotal = GEODE_KINDS.reduce((s, g) => s + (this.inv[g] || 0), 0);
      return [
        ['Upgrade a Tool (Copper -> Heirloom)', () => this.upgrade_tool()],
        [`Crack Geodes (${CRACK_GEODE_FEE}G each${geodeTotal ? ` · ${geodeTotal} ready` : ''})`, () => this.crack_geodes()],
        ['Order Maker Machine (20,000G + Deepiron)', () => this.order_maker()],
        ['Forge Sunbrass Jewelry (1000G + Sunbrass)', () => this.forge_jewelry()],
      ];
    }
    if (bid === 'inn') {
      const scene = this.inn_evening_now() ? this.inn_scene() : null;
      return [
        ...(scene && this.inn_evening_day !== this.absday()
          ? ([[`Friday evening: ${scene.title}`, () => this.inn_evening()]] as [string, () => Promise<void>][])
          : []),
        ...(this.tea_counter_now()
          ? ([['Rainy-night coffee & tea counter', () => this.tea_counter_menu()]] as [string, () => Promise<void>][])
          : []),
        ['Eat Gideon\'s Lunch (300G, +50 Stamina)', () => this.inn_lunch()],
        ['Use Inn Telephone (Order Saturday TV Shopping)', () => this.inn_phone_menu()],
      ];
    }
    if (bid === 'clinic') {
      return [
        ['Get a Medical Checkup (10G)', () => this.checkup()],
        ['Buy Mending Tonic (500G, +100 Stamina)', () => this.buy('Mending Tonic', 500)],
        ['Buy Mending Tonic XL (1000G, +150 Stamina)', () => this.buy('Mending Tonic XL', 1000)],
        ['Buy Brisk Tonic (1000G, -50 Fatigue)', () => this.buy('Brisk Tonic', 1000)],
        ['Buy Brisk Tonic XL (2000G, -100 Fatigue)', () => this.buy('Brisk Tonic XL', 2000)],
      ];
    }
    if (bid === 'library') {
      return [
        ['Read a Farming Book', () => this.say(py_rng().choice(BOOKS), 'Book')],
        ['Silas: seed crossing', () => this.hybrid_menu()],
      ];
    }
    if (bid === 'museum') {
      return [
        ['Donate an item', () => this.museum_donate()],
        ['View the collection', () => this.museum_book()],
      ];
    }
    if (bid === 'church') {
      return [
        ['Pray at the Altar', () => this.pray()],
        ['Enter Confession Booth (Bless Fey Tools / Confess)', () => this.confession_booth()],
      ];
    }
    if (bid === 'mayor') {
      return [
        ['Ask about your Farm & Exchange Medals', () => this.farm_report()],
      ];
    }
    if (bid === 'yodel') {
      return [
        ['Buy a Cow (5000G)', () => this.buy_animal('cow')],
        ['Buy a Sheep (4000G)', () => this.buy_animal('sheep')],
        ['Buy Fodder (20G)', () => this.buy('Fodder', 20)],
        ['Buy Milk (150G)', () => this.buy('Milk', 150)],
        ['Buy Milker (2000G)', () => this.buy_barn_tool('Milker', 2000)],
        ['Buy Clippers (1800G)', () => this.buy_barn_tool('Clippers', 1800)],
        ['Buy Brush (800G)', () => this.buy_barn_tool('Brush', 800)],
        ['Buy Bell (500G)', () => this.buy_barn_tool('Bell', 500)],
        ['Buy Miracle Potion (3000G)', () => this.buy('Miracle Potion', 3000)],
      ];
    }
    return [];
  }

  async won_shop(): Promise<void> {
    const items: [string, number, number][] = [
      ['Cabbage Seeds', 500, 99],
      ['Pineapple Seeds', 1000, 99],
      ['Green Pepper Seeds', 150, 99],
      ['Duskbell Flower Seeds', 300, 99],
      ['Pinwheel Daisy Seeds', 400, 99],
      ['Rosecap Flower Seeds', 300, 99],
      ['Emberbloom Flower Seeds', 600, 99],
      ['Dog Ball', 100, 1],
      ['Frisbee', 5000, 1],
      ['Record Player', 2000, 1],
      ['SUGDW Apple', 500, 10],
      ['Jewel of Truth (50,000G)', 50000, 1],
    ];
    const sel = await this.menu(
      `Ferreira's Exotic Shop   ${this.gold}G`,
      items.map(([name, p]) => (name.startsWith('Jewel of Truth') && this.berry_sources.includes('truth:won_shop') ? 'Jewel of Truth (owned)' : `${name} (${p}G)`)),
      0,
      (s) => {
        const name = items[s]?.[0] || '';
        const crop = name.endsWith(' Seeds') ? name.slice(0, -6) : '';
        const lines = crop ? this.crop_forecast_lines(crop) : [];
        if (name === `${COMPANION.helper} Seeds`) {
          lines.push(`Companion: a ${COMPANION.helper} in bloom beside a ${COMPANION.crop}`, `gives ${1 + COMPANION.bonus} a picking.`);
        }
        return lines;
      },
    );
    if (sel === null) return;
    const [name, price, lim] = items[sel];
    if (name.startsWith('Jewel of Truth')) {
      if (this.berry_sources.includes('truth:won_shop') || this.truth_jewels >= 9) {
        await this.say('Hehehe! Sold out, friend. You already own my Jewel of Truth.', 'Ferreira');
      } else if (this.gold < price) {
        await this.say('Hehehe! Come back when you have 50,000G!', 'Ferreira');
      } else if (this.give_truth_jewel('won_shop')) {
        this.gold -= price;
      }
      return;
    }
    await this.buy(name, price, lim);
  }

  async order_maker(): Promise<void> {
    const makers = [
      ['Mayonnaise Maker', 'Coop Expansion', 'Load eggs at the machine; mayonnaise is ready 4 hours later.'],
      ['Cheese Maker', 'Barn Expansion', 'Load milk at the machine; cheese is ready 8 hours later.'],
      ['Yarn Maker', 'Barn Expansion', 'Load wool at the machine; yarn is ready 6 hours later.'],
    ];
    const sel = await this.menu(
      'Hilde — Order Maker (20,000G + 1 Deepiron)',
      makers.map(([m, req]) =>
        this.makers.includes(m)
          ? `${m} (Built)`
          : `${m} ${this.house_flags.includes(req) ? '(ready to order)' : `(needs ${req})`}`
      ),
      0,
      [`  Gold: ${this.gold}G   Deepiron: ${this.inv['Deepiron'] || 0}`]
    );
    if (sel === null) return;
    const [mName, req, desc] = makers[sel];
    if (this.makers.includes(mName)) {
      await this.say(`You already have a ${mName}.`, 'Hilde');
    } else if (!this.house_flags.includes(req)) {
      await this.say(`Have Ingrid build the ${req} first so there's room for the ${mName}!`, 'Hilde');
    } else if (this.gold < 20000 || (this.inv['Deepiron'] || 0) < 1) {
      const missing = [
        this.gold < 20000 ? `${20000 - this.gold}G more` : '',
        (this.inv['Deepiron'] || 0) < 1 ? '1 Deepiron from the Copperseam Mine (Floor 10+)' : '',
      ].filter(Boolean);
      await this.say(`It costs 20,000G and 1 Deepiron. You still need ${missing.join(' and ')}.`, 'Hilde');
    } else {
      this.gold -= 20000;
      this.take('Deepiron', 1);
      this.makers.push(mName);
      this.place_makers();
      await this.say(`Done! I set the ${mName} up outside your ${MAKER_SPOTS[mName].by}. (${desc})`, 'Hilde');
    }
  }

  async forge_jewelry(): Promise<void> {
    const pieces = ['Necklace', 'Earrings', 'Bracelet', 'Brooch'];
    const sel = await this.menu(
      'Hilde — Forge Sunbrass Jewelry (1000G + 1 Sunbrass)',
      pieces.map((p) => `${p} (1000G + 1 Sunbrass)`)
    );
    if (sel === null) return;
    const piece = pieces[sel];
    if (this.gold < 1000 || (this.inv['Sunbrass'] || 0) < 1) {
      await this.say('Bring me 1000G and 1 Sunbrass from the Copperseam Mine (Floor 10+).', 'Hilde');
    } else {
      this.gold -= 1000;
      this.take('Sunbrass', 1);
      this.give(piece, 1);
      this.msg(`Hilde forged a ${piece}! Bachelorettes love jewelry!`, '0A');
    }
  }

  async crack_geodes(): Promise<void> {
    while (true) {
      const held = GEODE_KINDS.filter((g) => (this.inv[g] || 0) > 0);
      if (!held.length) {
        await this.say('Bring any Geode, Frozen Geode, or Magma Geode from the mines or fishing — I will crack it open for 25G!', 'Rowan');
        return;
      }
      const opts = [...held.map((g) => `Crack ${g} (x${this.inv[g]}) — ${CRACK_GEODE_FEE}G`), 'Done'];
      const sel = await this.menu(`Rowan's Anvil — Crack Geodes   ${this.gold}G`, opts);
      if (sel === null || sel >= held.length) return;
      if (this.gold < CRACK_GEODE_FEE) {
        await this.say(`You need ${CRACK_GEODE_FEE}G to crack a geode.`, 'Rowan');
        return;
      }
      const kind = held[sel] as GeodeKind;
      this.gold -= CRACK_GEODE_FEE;
      this.take(kind, 1);
      const loot = rollGeodeLoot(kind, this.effective_luck(), () => py_rng().random());
      this.give(loot.item, loot.qty);
      playSfx('geode_crack');
      this.msg(`CLANG! Rowan cracked the ${kind}: ${loot.qty > 1 ? `${loot.qty}x ` : ''}${loot.item}!${loot.rare ? ' (Museum-worthy!)' : ''}`, loot.rare ? '0B' : '0C');
    }
  }

  async confession_booth(): Promise<void> {
    const opts = [
      'Remove Equipped Fey Tool (1000G)',
      'Bless Fey Hoe or Watering Can (1000G)',
      'Confess: Forgive me for littering / neglecting animals',
      'Confess: I want to marry the Wellkeeper',
      'Leave Booth',
    ];
    const sel = await this.menu('Church Confession Booth', opts);
    if (sel === null || sel === 4) return;
    if (sel === 0) {
      if (this.levels[this.tool] !== 5) {
        await this.say('You do not currently have a Fey Tool stuck to your hand.', 'Lucan');
      } else if (['Hoe', 'Watering Can'].includes(this.tool)) {
        await this.say(`I cannot lift the curse from your Fey ${this.tool}; bless it instead (option 2). No charge.`, 'Lucan');
      } else if (this.gold < 1000) {
        await this.say('A 1000G donation is required to lift the binding curse.', 'Lucan');
      } else {
        this.gold -= 1000;
        this.tool = TOOLS.find((t) => this.levels[t] !== 5 && this.tool_list().includes(t)) || 'Hoe';
        await this.say('May the Wellkeeper cleanse this curse! You can freely switch tools again.', 'Lucan');
      }
    } else if (sel === 1) {
      const cursedTarget = ['Hoe', 'Watering Can'].find((t) => this.levels[t] === 5);
      if (!cursedTarget) {
        await this.say('You have no Fey Hoe or Fey Watering Can needing blessing. (Sickle/Hammer bless after 10 days; Rod/Axe after 25 uses!)', 'Lucan');
      } else if (this.gold < 1000) {
        await this.say('Blessing requires a 1000G offering.', 'Lucan');
      } else {
        this.gold -= 1000;
        this.cursed_blesses[cursedTarget] = (this.cursed_blesses[cursedTarget] || 0) + 5;
        if (this.cursed_blesses[cursedTarget] >= 10) {
          this.levels[cursedTarget] = 6;
          await this.say(`The curse is gone forever! Your ${cursedTarget} is now a HALLOWED ${cursedTarget}!`, 'Lucan');
        } else {
          await this.say(`I have prayed over your ${cursedTarget} (${this.cursed_blesses[cursedTarget]}/10 blessings). Bless it once more to complete the ritual!`, 'Lucan');
        }
      }
    } else if ((sel === 2 || sel === 3) && this.confessed_day === this.absday()) {
      await this.say('You have already confessed today. Come back tomorrow.', 'Lucan');
    } else if (sel === 2) {
      this.confessed_day = this.absday();
      for (const n of Object.keys(this.friend)) {
        this.friend[n] = clamp(this.friend[n] + 2, 0, 100);
      }
      await this.say('The Wellkeeper forgives you. (+2 Villager Friendship!)', 'Lucan');
    } else if (sel === 3) {
      this.confessed_day = this.absday();
      this.friend['Wellkeeper'] = clamp((this.friend['Wellkeeper'] || 0) + 10, 0, 100);
      await this.say('You have my blessing! Present the Promise Ribbon at the Wellkeeper Pond when her heart is Red!', 'Lucan');
    }
  }

  // ---------------------------------------------------------------- farm works (fields task)
  /** Farm pieces, orchard trees and the barrel/greenhouse frames are drawn over the stored farm tiles. */
  hook_farm(): void {
    this.maps.farm.overlay = (x, y, k) => this.farm_overlay(x, y, k);
    if (this.maps.town) {
      this.maps.town.overlay = (x, y) => this.town_overlay(x, y);
    }
  }

  /** Visible Market Cross upgrades as Brackenford Town Rank climbs (lanterns at D+, flower boxes at C+). */
  town_overlay(x: number, y: number): string | undefined {
    const visuals = this.town_rank().tier.visuals;
    if (!visuals.lanterns && !visuals.flowerBoxes) return undefined;
    const base = this.maps.town?.t[y]?.[x];
    if (base !== 'path' && base !== 'grass') return undefined;
    if (visuals.lanterns && ((x === 33 || x === 39) && (y === 11 || y === 16))) return 'town_lantern';
    if (visuals.flowerBoxes && (((x === 34 || x === 38) && y === 15) || ((x === 32 || x === 40) && y === 19))) return 'town_flowerbox';
    return undefined;
  }

  /** Count trees/orchard tiles adjacent to a farm cell for Mushroom Log growth speed & rarity. */
  private adjacent_farm_trees(key: string): number {
    const [x, y] = key.split(',').map(Number);
    const m = this.maps.farm;
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const t = m.t[y + dy]?.[x + dx];
        if (t === 'tree' || this.farm_works.orchard[pkey(x + dx, y + dy)]) n += 1;
      }
    }
    return n;
  }

  private artisan_yield(key: string, piece: 'Bee House' | 'Mushroom Log') {
    const fw = this.farm_works;
    const last = fw.artisanDays?.[key] ?? Math.max(0, this.absday() - 3);
    if (piece === 'Bee House') {
      return beeHouseYield(key, this.crops, (c) => CROPS[c]?.[2] ?? 4, this.season, this.absday(), last);
    }
    const [x, y] = key.split(',').map(Number);
    const rainBoost = this.weather === 'Rain' || this.weather === 'Typhoon' ? 1 : 0;
    return mushroomLogYield(this.adjacent_farm_trees(key), this.season, rainBoost, this.has_perk('forage_bounty'), this.absday(), last, x * 13 + y * 29);
  }

  farm_overlay(x: number, y: number, key?: string): string | undefined {
    const fw = this.farm_works;
    // fixed spots are tested numerically; a key is only built when pieces or orchard trees exist
    if (anyKey(fw.pieces) || anyKey(fw.orchard)) {
      const k = key ?? pkey(x, y);
      const piece = fw.pieces[k];
      if (piece === CASK_RACK) return this.cask_tile(k);
      if (piece === 'Bee House') return this.artisan_yield(k, 'Bee House').ready ? 'farm_bee_ready' : 'farm_bee';
      if (piece === 'Mushroom Log') return this.artisan_yield(k, 'Mushroom Log').ready ? 'farm_mlog_ready' : 'farm_mlog';
      if (piece) return FARM_PIECES[piece].tile;
      if (fw.orchard[k]) return 'orchard_tree';
    }
    if (this.enrichment.perch && x === PERCH_SPOT[0] && y === PERCH_SPOT[1]) return 'perch';
    if (this.enrichment.shadeTree && x === SHADE_TREE_SPOT[0] && y === SHADE_TREE_SPOT[1]) return 'shade_tree';
    if (x === BARREL_SPOT[0] && y === BARREL_SPOT[1]) return 'rain_barrel';
    if (x === GLASS_SPOT[0] && y === GLASS_SPOT[1]) return 'greenhouse_frame';
    return undefined;
  }

  farm_tile(x: number, y: number, base: string): string {
    return this.farm_overlay(x, y) ?? base;
  }

  /** Open, untouched base soil: the only ground a piece may stand on. */
  private farm_can_place(key: string): boolean {
    const [x, y] = key.split(',').map(Number);
    const m = this.maps.farm;
    if (!Number.isInteger(x) || !Number.isInteger(y) || !m.inside(x, y) || m.t[y][x] !== 'field') return false;
    if (Object.keys(m.warps).some((w) => { const [wx, wy] = w.split(',').map(Number); return Math.abs(wx - x) <= 1 && Math.abs(wy - y) <= 1; })) return false;
    return !this.tilled.has(key) && !this.crops[key] && !this.objs.farm?.[key] && !GLASS_SET.has(key) && !CHANNEL_CELLS.includes(key) &&
      !ORCHARD_SPOTS.includes(key) && key !== pkey(...BARREL_SPOT) && key !== pkey(...GLASS_SPOT);
  }

  place_farm_piece(x: number, y: number, name: string): boolean {
    const k = pkey(x, y);
    const fw = this.farm_works;
    if (this.mapname !== 'farm' || !isFarmPiece(name) || !(this.inv[name] > 0)) return false;
    if (!this.farm_can_place(k) || this.farm_overlay(x, y)) {
      this.msg('Pieces need open, untilled farm ground (not the greenhouse, channel or orchard).', '08');
      return false;
    }
    if (Object.keys(fw.pieces).length >= PIECE_LIMIT) {
      this.msg(`The farm already holds ${PIECE_LIMIT} pieces.`, '08');
      return false;
    }
    if (name === 'Auto-Feeder' && Object.values(fw.pieces).includes(name)) {
      this.msg('One Auto-Feeder is enough for the farm.', '08');
      return false;
    }
    this.take(name);
    fw.pieces[k] = name;
    if (name === 'Bee House' || name === 'Mushroom Log') {
      fw.artisanDays = fw.artisanDays ?? {};
      fw.artisanDays[k] = this.absday();
    }
    this.msg(`Placed the ${name}. Face it and press X to interact or pick it up.`, '0B');
    return true;
  }

  /** One Auto-Feeder per farm: owned or already placed means no second purchase. */
  async buy_piece(name: string): Promise<void> {
    if (name === 'Auto-Feeder' && ((this.inv[name] || 0) > 0 || Object.values(this.farm_works.pieces).includes(name))) {
      await this.say('One Auto-Feeder is enough for the farm.', 'Ingrid');
      return;
    }
    await this.buy(name, FARM_PIECES[name as keyof typeof FARM_PIECES].price, name === 'Auto-Feeder' ? 1 : 10);
  }

  plant_orchard(x: number, y: number): boolean {
    const k = pkey(x, y);
    if (this.mapname !== 'farm' || !(this.inv[SAPLING] > 0) || !ORCHARD_SPOTS.includes(k) || this.farm_works.orchard[k]) return false;
    if (this.objs.farm?.[k]) {
      this.msg('Clear the spot first.', '08');
      return false;
    }
    this.take(SAPLING);
    this.farm_works.orchard[k] = { planted: this.absday(), picked: -1 };
    this.msg(`You planted an Orchard Pear sapling. It bears fruit after ${TREE_DAYS} days, each Fall.`, '0B');
    return true;
  }

  /** The first fruit day this Fall that is ripe and not yet picked, else null. */
  orchard_due(key: string): number | null {
    const tree = this.farm_works.orchard[key];
    const today = this.absday();
    if (!tree || today - tree.planted < TREE_DAYS || (this.season !== 2 && this.season !== 3)) return null;
    for (const d of FRUIT_DAYS) {
      const when = this.absday(this.year, 2, d);
      if (when >= tree.planted + TREE_DAYS && when > tree.picked && when <= today) return when;
    }
    return null;
  }

  async farm_works_interact(x: number, y: number): Promise<boolean> {
    const k = pkey(x, y);
    const fw = this.farm_works;
    if (fw.orchard[k]) {
      const due = this.orchard_due(k);
      if (due === null) {
        const age = this.absday() - fw.orchard[k].planted;
        this.msg(age < TREE_DAYS ? `The sapling is still settling in (${TREE_DAYS - age} more days).` : 'No ripe pears. They come in Fall (days 5, 15 and 25).');
        return true;
      }
      fw.orchard[k].picked = due;
      this.give('Orchard Pear');
      this.msg('You picked a ripe Orchard Pear.', '0A');
      return true;
    }
    const piece = fw.pieces[k];
    if (piece === CASK_RACK) {
      await this.cask_menu(k);
      return true;
    }
    if (piece === 'Bee House' || piece === 'Mushroom Log') {
      const yld = this.artisan_yield(k, piece);
      const status = yld.dormant
        ? '  Dormant in Winter. Bees wake again in Spring.'
        : yld.ready
          ? `  Ready to harvest: ${yld.item} (${ITEMS[yld.item]?.[0] ?? 150}G)!`
          : `  Working on ${yld.item} (${yld.daysLeft} more day${yld.daysLeft === 1 ? '' : 's'}).`;
      const opts = [...(yld.ready ? [`Harvest ${yld.item}`] : []), 'Pick it up', 'Leave it'];
      const sel = await this.menu(piece, opts, 0, [status, `  ${FARM_PIECES[piece].info}`]);
      const choice = sel === null ? 'Leave it' : opts[sel];
      if (choice.startsWith('Harvest')) {
        fw.artisanDays = fw.artisanDays ?? {};
        fw.artisanDays[k] = this.absday();
        this.give(yld.item, 1);
        playHarvestChime(2);
        this.fx_add('sparkle', x, y, 0.7);
        this.mastery_add(piece === 'Bee House' ? 'farming' : 'foraging');
        this.msg(`Harvested fresh ${yld.item} from the ${piece}!`, '0A');
      } else if (choice === 'Pick it up') {
        delete fw.pieces[k];
        if (fw.artisanDays) delete fw.artisanDays[k];
        this.give(piece);
        this.msg(`Picked up the ${piece}.`);
      }
      return true;
    }
    if (piece) {
      if ((await this.menu(piece, ['Pick it up', 'Leave it'], 0, [`  ${FARM_PIECES[piece].info}`])) === 0) {
        delete fw.pieces[k];
        this.give(piece);
        this.msg(`Picked up the ${piece}.`);
      }
      return true;
    }
    if (x === BARREL_SPOT[0] && y === BARREL_SPOT[1]) {
      await this.channel_menu();
      return true;
    }
    if (x === GLASS_SPOT[0] && y === GLASS_SPOT[1]) {
      await this.greenhouse_menu();
      return true;
    }
    return false;
  }

  /** Charge gold and lumber together (pulling Lumber from Pockets + Cabinet), or nothing at all. */
  private pay_works(cost: { gold: number; lumber: number }): boolean {
    if (this.gold < cost.gold || totalAvailable('Lumber', this.inv, null, this.cabinet_inv) < cost.lumber) {
      this.msg(`You need ${cost.gold}G and ${cost.lumber} Lumber.`, '08');
      return false;
    }
    this.gold -= cost.gold;
    consumeAcrossStorages('Lumber', cost.lumber, this.inv, null, this.cabinet_inv);
    return true;
  }

  async channel_menu(): Promise<void> {
    const fw = this.farm_works;
    if (fw.channel) {
      await this.say(`The rain barrel holds ${fw.water}/${BARREL_CAP} days of rain. On a dry morning it waters the channel soil to its south.`, 'Rain Barrel');
      return;
    }
    const sel = await this.menu('Rain Barrel', [`Repair it (${CHANNEL_COST.gold}G + ${CHANNEL_COST.lumber} Lumber)`, 'Leave it'], 0, ['  A cracked barrel and a stone channel. Mended, it stores rain for dry mornings.']);
    if (sel === 0 && this.pay_works(CHANNEL_COST)) {
      fw.channel = true;
      this.msg('The barrel is mended. It will store up to 3 days of rain.', '0A');
    }
  }

  async greenhouse_menu(): Promise<void> {
    const fw = this.farm_works;
    if (fw.greenhouse) {
      await this.say('Your greenhouse keeps the glass-covered soil warm: sow any seed there, and crops survive the turn of the season and typhoons.', 'Greenhouse');
      return;
    }
    const sel = await this.menu('Greenhouse Frame', [`Build it (${GLASS_COST.gold}G + ${GLASS_COST.lumber} Lumber)`, 'Leave it'], 0, ['  Covers the 4x3 plot beside it: off-season seeds grow, and storms pass over.']);
    if (sel === 0 && this.pay_works(GLASS_COST)) {
      fw.greenhouse = true;
      this.msg('The greenhouse is glazed! Sow any season in the marked plot.', '0A');
    }
  }

  /** True when no seed, planted crop or bin item of this hybrid remains anywhere. */
  hybrid_lost(crop: string): boolean {
    return !(this.inv[`${crop} Seeds`] > 0) && !(this.inv[crop] > 0) && !Object.values(this.crops).some((c) => c[0] === crop) &&
      !((this.bin[crop] || 0) > 0 || (this.bin[`${crop} Seeds`] || 0) > 0);
  }

  async hybrid_menu(): Promise<void> {
    const fw = this.farm_works;
    const sel = await this.menu(
      'Silas: seed crossing',
      HYBRIDS.map((h) => `${h.crop}: ${h.parents.join(' + ')} (${h.season})${fw.hybrids.includes(h.crop) ? ' - known' : ''}`),
      0,
      (i) => [`  Trade one ${HYBRIDS[i].parents[0]} Seeds and one ${HYBRIDS[i].parents[1]} Seeds for one ${HYBRIDS[i].crop} Seeds.`, `  Grows in ${HYBRIDS[i].season}, ${HYBRIDS[i].grow} days, ships for ${HYBRIDS[i].value}G.`],
    );
    if (sel === null) return;
    const h = HYBRIDS[sel];
    const known = fw.hybrids.includes(h.crop);
    if (known && !this.hybrid_lost(h.crop)) {
      this.msg(`Silas has already crossed ${h.crop} for you; save seed from your harvest to grow more.`, '08');
      return;
    }
    const [a, b] = h.parents.map((p) => `${p} Seeds`);
    const fee = known ? HYBRID_RECROSS_FEE : 0;
    if (!(this.inv[a] > 0) || !(this.inv[b] > 0)) {
      this.msg(`Silas needs one ${a} and one ${b}${fee ? ` and ${fee}G` : ''}.`, '08');
      return;
    }
    if (this.gold < fee) {
      this.msg(`Silas charges ${fee}G to cross ${h.crop} again.`, '08');
      return;
    }
    this.gold -= fee;
    this.take(a);
    this.take(b);
    this.give(`${h.crop} Seeds`);
    if (!known) fw.hybrids.push(h.crop);
    this.msg(known ? `Silas crossed ${h.crop} Seeds again for ${fee}G.` : `Silas crossed a new seed: ${h.crop} Seeds!`, '0A');
  }

  /** Morning work: sprinklers (Standard/Quality/Starsteel), artisan readiness, rain channel, then typhoon damage. */
  farm_works_morning(report: string[]): void {
    const fw = this.farm_works;
    const stormy = this.weather === 'Typhoon';
    let readyBees = 0;
    let readyLogs = 0;
    for (const [k, piece] of Object.entries(fw.pieces)) {
      const cells = sprinklerCoverage(k, piece);
      if (cells.length) {
        for (const c of cells) if (this.tilled.has(c)) this.wet.add(c);
      } else if (piece === 'Bee House' && this.artisan_yield(k, 'Bee House').ready) {
        readyBees += 1;
      } else if (piece === 'Mushroom Log' && this.artisan_yield(k, 'Mushroom Log').ready) {
        readyLogs += 1;
      }
    }
    if (readyBees) report.push(`${readyBees} Bee House${readyBees > 1 ? 's have' : ' has'} fresh honey ready to collect.`);
    if (readyLogs) report.push(`${readyLogs} Mushroom Log${readyLogs > 1 ? 's have' : ' has'} mushrooms ready to pick.`);
    if (fw.channel) {
      const dry = CHANNEL_CELLS.filter((c) => this.tilled.has(c));
      if (this.weather === 'Rain' || stormy) fw.water = BARREL_CAP;
      else if (fw.water > 0 && dry.some((c) => !this.wet.has(c))) {
        fw.water -= 1;
        for (const c of dry) this.wet.add(c);
        report.push('The rain barrel watered the channel rows.');
      }
    }
    if (!stormy) return;
    const guarded = new Set<string>();
    for (const [k, piece] of Object.entries(fw.pieces)) {
      if (piece === 'Scarecrow') fixtureCoverage(k, true).forEach((c) => guarded.add(c));
    }
    let lost = 0;
    for (const k of Object.keys(this.crops)) {
      const [x, y] = k.split(',').map(Number);
      if ((x * 17 + y * 31 + this.absday() * 13) % 4 !== 0 || guarded.has(k) || (fw.greenhouse && GLASS_SET.has(k))) continue;
      delete this.crops[k];
      lost += 1;
    }
    if (lost) report.push(`The typhoon flattened ${lost} crop${lost > 1 ? 's' : ''}. A Scarecrow or the greenhouse shelters nearby plants.`);
  }

  // ---------------------------------------------------------------- Cellar Cask Rack (cask-rack.ts)
  /** Rack tile by state, reusing the maker colours: grey empty, orange fermenting, green ready. */
  cask_tile(key: string): string {
    const c = this.casks[key];
    if (!c) return FARM_PIECES[CASK_RACK].tile;
    return caskPhase(c, this.absday()) === 'ready' ? 'farm_cask_ready' : 'farm_cask_work';
  }

  /** What a barrel holds and when it improves, in a few words. */
  cask_line(c: Cask): string {
    const today = this.absday();
    const next = caskNextIn(c, today);
    const name = caskPhase(c, today) === 'ready' ? `${c.qty} x ${caskItem(c, today)}` : `${c.qty} Young Wine fermenting`;
    return `${name}${next === null ? ', fully aged' : `, better in ${next}d`}`;
  }

  /** Today's Plan wording for all racks: ready barrels first, or null with none standing. */
  cask_status(): string | null {
    const racks = Object.keys(this.farm_works.pieces).filter((k) => this.farm_works.pieces[k] === CASK_RACK);
    if (!racks.length) return null;
    const held = racks.filter((k) => this.casks[k]);
    const ready = held.filter((k) => caskPhase(this.casks[k], this.absday()) === 'ready').length;
    return `${racks.length} rack${racks.length > 1 ? 's' : ''}: ${ready} ready, ${held.length - ready} working, ${racks.length - held.length} empty`;
  }

  /** Dawn report for barrels that finished fermenting or reached a better tier today. */
  cask_morning(report: string[]): void {
    const n = Object.values(this.casks).filter((c) => caskMilestone(c, this.absday())).length;
    if (n) report.push(`${n} cask${n > 1 ? 's' : ''} in the Cask Rack ${n > 1 ? 'have' : 'has'} aged a grade. Worth a look!`);
  }

  load_cask(key: string, kind: 'wine' | 'cheese'): boolean {
    if (this.farm_works.pieces[key] !== CASK_RACK || this.casks[key]) return false;
    let qty: number;
    if (kind === 'wine') {
      const b = wineBatch(this.inv);
      qty = b.qty;
      if (!qty) return false;
      for (const [f, n] of Object.entries(b.take)) this.take(f, n);
    } else {
      qty = cheeseBatch(this.inv);
      if (!qty) return false;
      this.take('Small Cheese', qty);
    }
    this.casks[key] = { kind, start: this.absday(), qty };
    this.msg(`Filled the cask: ${this.cask_line(this.casks[key])}.`, '0C');
    return true;
  }

  collect_cask(key: string): string | null {
    const c = this.casks[key];
    if (!c || caskPhase(c, this.absday()) !== 'ready') return null;
    const item = caskItem(c, this.absday());
    delete this.casks[key];
    this.give(item, c.qty);
    const line = `Took ${c.qty} x ${item} from the cask (${ITEMS[item][0]}G each).`;
    this.msg(line, '0A');
    return line;
  }

  async cask_menu(key: string): Promise<void> {
    const c = this.casks[key];
    const info = [`  ${FARM_PIECES[CASK_RACK].info}`];
    const opts: string[] = [];
    if (c) {
      info.unshift(`  ${this.cask_line(c)}.`);
      if (caskPhase(c, this.absday()) === 'ready') opts.push(`Take ${c.qty} ${caskItem(c, this.absday())} now`);
      else info.push('  Fermenting: nothing to take yet.');
      info.push(`  Ageing tiers: ${AGE_TIERS.map((t) => `${t.days}d x${t.mult}`).join(', ')}.`);
    } else {
      const wine = wineBatch(this.inv).qty;
      const cheese = cheeseBatch(this.inv);
      if (wine) opts.push(`Ferment ${wine} Young Wine (${wine * WINE_FRUIT} fruit)`);
      if (cheese) opts.push(`Age ${cheese} Small Cheese`);
      info.unshift(`  Empty. Needs ${WINE_FRUIT} Wild Grape/Pear/Apple per wine (up to ${CASK_CAP}), or Small Cheese.`);
      opts.push('Pick it up');
    }
    opts.push('Leave');
    const sel = await this.menu(CASK_RACK, opts, 0, info);
    const choice = sel === null ? 'Leave' : opts[sel];
    if (choice.startsWith('Take')) this.collect_cask(key);
    else if (choice.startsWith('Ferment')) this.load_cask(key, 'wine');
    else if (choice.startsWith('Age')) this.load_cask(key, 'cheese');
    else if (choice === 'Pick it up') {
      delete this.farm_works.pieces[key];
      this.give(CASK_RACK);
      this.msg(`Picked up the ${CASK_RACK}.`);
    }
  }

  farm_auto_feed(report: string[]): void {
    if (!Object.values(this.farm_works.pieces).includes('Auto-Feeder')) return;
    const feedAvail = totalAvailable('Chicken Feed', this.inv, null, this.cabinet_inv);
    const feed = Math.min(Math.max(0, this.chickens - this.fed), feedAvail);
    if (feed > 0) {
      consumeAcrossStorages('Chicken Feed', feed, this.inv, null, this.cabinet_inv);
      this.fed += feed;
    }
    const fodderAvail = totalAvailable('Fodder', this.inv, null, this.cabinet_inv);
    const hungry = this.animals.filter((a) => !a.fed).slice(0, fodderAvail);
    if (hungry.length) {
      consumeAcrossStorages('Fodder', hungry.length, this.inv, null, this.cabinet_inv);
      hungry.forEach((a) => (a.fed = true));
    }
    if (feed || hungry.length) report.push(`The Auto-Feeder filled the troughs (${feed} chickens, ${hungry.length} barn animals).`);
  }

  async buy(item: string, price: number, limit: number = 99): Promise<void> {
    const maxq = Math.min(limit, Math.floor(this.gold / price));
    if (maxq <= 0) {
      await this.say("You can't afford that.", null);
      return;
    }
    const q = await this.ask_qty(`Buy how many ${item}?`, maxq, price, 'Cost');
    if (q) {
      this.gold -= q * price;
      this.give(item, q);
      if (item === 'Record Player') {
        this.sync_house_furniture();
      }
      this.msg(`Bought ${q} ${item} for ${q * price}G.`, '09');
    }
  }

  async buy_seeds(): Promise<void> {
    const crops = Object.entries(CROPS)
      .filter(([c, d]) => (d[0] === this.season_name || d[0] === 'All') && !WON_EXCLUSIVE_CROPS.has(c) && !HYBRID_CROPS.has(c))
      .map(([c]) => c);
    if (!crops.length) {
      await this.say('Nothing grows outdoors in Winter, dear. Come back in Spring!', 'Hollis');
      return;
    }
    const discount = this.town_rank().tier.seedDiscount;
    const seedPrice = (c: string) => Math.max(10, Math.round(CROPS[c][1] * (1 - discount)));
    const opts = crops.map((c) => {
      const gate = checkSecretCropUnlock(c, this.shipped_counts);
      return `${c} Seeds (${seedPrice(c)}G)${gate.unlocked ? '' : ' [LOCKED — Ship 100 each]'}`;
    });
    const info = (s: number) => {
      const c = crops[s];
      const d = CROPS[c];
      const regrow = d[3] ? `, regrows every ${d[3]}d` : '';
      const gate = checkSecretCropUnlock(c, this.shipped_counts);
      const lines = [`  ${d[2]} days to grow${regrow} — ships for ${d[4]}G each (sows 3x3)`];
      if (discount > 0) lines.push(`  Town Rank ${this.town_rank().tier.grade} discount applied: ${Math.round(discount * 100)}% off seeds!`);
      lines.push(...this.crop_forecast_lines(c).map((l) => `  ${l}`));
      if (c === COMPANION.crop || c === COMPANION.helper) {
        lines.push(`  Companion: a ${COMPANION.helper} in bloom beside a ${COMPANION.crop} gives ${1 + COMPANION.bonus} a picking.`);
      }
      const saved = this.seed_recipe(c);
      if (saved) lines.push(`  Or save your own: ${saved.need} ${c} make ${saved.bags} bag (Rucksack).`);
      if (gate.progressText) {
        lines.push(`  Unlock Gate: ${gate.progressText}`);
      } else {
        lines.push('  Rare exotic & flower seeds are also sold by Ferreira at Brackenford Beach!');
      }
      return lines;
    };
    const sel = await this.menu(`Hollis's Supermarket Seeds${discount > 0 ? ` (-${Math.round(discount * 100)}%)` : ''}   ${this.gold}G`, opts, 0, info);
    if (sel !== null) {
      const c = crops[sel];
      const gate = checkSecretCropUnlock(c, this.shipped_counts);
      if (!gate.unlocked) {
        await this.say(
          `We will stock ${c} Seeds as soon as you ship 100 of each seasonal crop! (${gate.progressText})`,
          'Hollis'
        );
        return;
      }
      await this.buy(`${c} Seeds`, seedPrice(c));
    }
  }

  /** Add one hen and its temperament together so the two lists stay aligned. */
  add_chicken(): void {
    this.chickens += 1;
    this.chicken_personalities.push(pickPersonality(this.absday() + this.chickens));
  }

  async buy_chicken(): Promise<void> {
    if (this.chickens >= this.coop_cap()) {
      await this.say('Your coop is full!', 'Rosalind');
    } else if (this.gold < 1500) {
      await this.say("A chicken is 1500G. Come back when you've saved up.", 'Rosalind');
    } else if (await this.confirm('Buy a chicken for 1500G?')) {
      this.gold -= 1500;
      this.add_chicken();
      await this.say('Dennis will bring it to your coop. Remember to fill its feed box!', 'Rosalind');
    }
  }

  async upgrade_tool(): Promise<void> {
    if (this.upgrading) {
      await this.say(`I'm still working on your ${this.upgrading[0]}. Hmph. Patience.`, 'Hilde');
      return;
    }
    const opts: string[] = [];
    for (const t of UPGRADABLE) {
      const lvl = this.levels[t] || 0;
      const exp = this.tool_exp[t] || 0;
      if (lvl >= 7) {
        opts.push(`${t} (Heirloom — MAXED)`);
      } else if (lvl === 6) {
        opts.push(`${t} (Hallowed) -> Heirloom (50,000G + 1 Heirloom Stone)`);
      } else if (lvl === 5) {
        opts.push(`${t} (Fey — Bless at Church first)`);
      } else if (lvl === 4) {
        opts.push(`${t} (Starsteel — Find Fey in Mirewater Mine)`);
      } else {
        const [cost, ore] = UPGRADE[lvl + 1];
        opts.push(`${t} -> ${LEVELS[lvl + 1]} (${cost}G + 1 ${ore}, Exp: ${exp}%)`);
      }
    }
    const sel = await this.menu('Hilde — Upgrade Which Tool?', opts);
    if (sel === null) return;
    const t = UPGRADABLE[sel];
    const lvl = this.levels[t] || 0;
    if (lvl === 6) {
      if (this.gold < 50000 || (this.inv['Heirloom Stone'] || 0) < 1) {
        await this.say('To forge a Heirloom tool I need 50,000G and 1 Heirloom Stone from the Copperseam Mine!', 'Hilde');
        return;
      }
      this.gold -= 50000;
      this.take('Heirloom Stone', 1);
      this.levels[t] = 7;
      await this.say(`Behold my masterwork! Your ${t} is now an HEIRLOOM ${t}!`, 'Hilde');
      return;
    }
    if (lvl >= 4) {
      await this.say('To go beyond Starsteel, unearth the Fey Tools in the Winter Mirewater Mine and have Lucan bless them!', 'Hilde');
      return;
    }
    const [cost, ore] = UPGRADE[lvl + 1];
    if (this.gold < cost || (this.inv[ore] || 0) < 1) {
      await this.say(`I need ${cost}G and ${ore} ore from the Copperseam Mine on Beacon Hill.`, 'Hilde');
      return;
    }
    this.gold -= cost;
    this.take(ore, 1);
    this.upgrading = [t, this.absday() + 1];
    if (this.tool === t) {
      this.tool = TOOLS.find((other) => other !== t) || 'Sickle';
    }
    await this.say(`Leave your ${t} with me. It'll be ready tomorrow morning. Hmph.`, 'Hilde');
  }

  /** True during the Friday-evening window at the inn. */
  inn_evening_now(): boolean {
    const [o, c] = INN_EVENING_HOURS;
    return this.weekday === INN_EVENING_DAY && o * 60 <= this.minutes && this.minutes < c * 60;
  }

  /** This week's Friday scene: an unseen one if any are left, otherwise the rotation's pick. */
  inn_scene(): (typeof INN_SCENES)[number] {
    const week = Math.floor(this.absday() / 7);
    const id = innSceneFor(week, INN_SCENES.map((s) => s.id), this.inn_scenes_seen || []);
    return INN_SCENES.find((s) => s.id === id) || INN_SCENES[0];
  }

  /** One Friday scene per evening: listen in, or take part for a little more. */
  async inn_evening(): Promise<void> {
    const scene = this.inn_scene();
    const sel = await this.menu(scene.title, ['Listen', scene.join, 'Not tonight']);
    if (sel === null || sel === 2) return;
    const joined = sel === 1;
    for (const [who, line] of scene.listen) await this.say(line, who);
    if (joined) {
      for (const [who, line] of scene.joined) await this.say(line, who);
      await this.inn_join_payoff(scene.id);
    }
    const pts = joined ? INN_JOIN_FRIEND : INN_LISTEN_FRIEND;
    for (const n of scene.cast) {
      if (n in NPCS) this.friend[n] = clamp((this.friend[n] || 0) + pts, 0, 100);
    }
    this.inn_evening_day = this.absday();
    if (!this.inn_scenes_seen.includes(scene.id)) this.inn_scenes_seen.push(scene.id);
    this.msg(`${joined ? 'You joined in' : 'You listened'}: ${scene.cast.join(', ')} +${pts} friendship.`, '0C');
  }

  async inn_join_payoff(id: string): Promise<void> {
    if (id === 'cards') {
      if (innCardsWin(this.absday())) {
        this.gold += INN_CARDS_POT;
        await this.say(`A full house! You take the pot. (+${INN_CARDS_POT}G)`, 'Ingrid');
      } else {
        await this.say('Gideon lays down four aces and grins. Better luck next Friday.', 'Gideon');
      }
    } else if (id === 'recipes') {
      this.give('Cookies', 1);
      this.msg('Tess gave you a plate of Cookies.', '0B');
    }
  }

  async inn_lunch(): Promise<void> {
    if (this.gold < 300) {
      await this.say('Lunch is 300G, friend.', 'Gideon');
      return;
    }
    this.gold -= 300;
    this.stamina = Math.min(this.max_stamina, this.stamina + 50);
    this.fatigue = Math.max(0, this.fatigue - 15);
    await this.say("Here you go — Gideon's special! (+50 Stamina, -15 Fatigue)", 'Gideon');
  }

  async checkup(): Promise<void> {
    if (this.gold >= 10) this.gold -= 10;
    const s = this.stamina;
    const f = this.fatigue;
    const verdict =
      s > 90 && f < 25
        ? "You're in peak physical condition!"
        : f < 60
          ? "You're a bit fatigued. Don't overwork in the rain."
          : "You're dangerously exhausted! Take a Brisk Tonic or soak in the Hot Spring!";
    await this.say(`Strength: ${s}/${this.max_stamina} | Fatigue: ${f}/100. ${verdict}`, 'Dr. Sayer');
  }

  async pray(): Promise<void> {
    if (this.prayed) {
      await this.say('You sit quietly in the pews. Your mind is at peace.', null);
      return;
    }
    this.prayed = true;
    this.stamina = Math.min(this.max_stamina, this.stamina + 15);
    this.fatigue = Math.max(0, this.fatigue - 10);
    await this.say('You pray at the altar. You feel a gentle warmth. (+15 Stamina, -10 Fatigue)', null);
  }

  async farm_report(): Promise<void> {
    const sel = await this.menu(`Mayor Ambrose   (Your Medals: ${this.medals})`, [
      'View Farm & Villager Report',
      'Exchange 900 Medals for Heartseed',
      'Exchange 1000 Medals for Jewel of Truth',
      'Back',
    ]);
    if (sel === 0) {
      await this.ranch_summary();
    } else if (sel === 1) {
      if (this.medals < 900) {
        await this.say(`You have ${this.medals} medals. Win more at the Spring & Fall Horse Races!`, 'Ambrose');
      } else if (this.give_power_berry('medals_900')) {
        this.medals -= 900;
      } else {
        await this.say('You already claimed the Medal Heartseed!', 'Ambrose');
      }
    } else if (sel === 2) {
      if (this.medals < 1000) {
        await this.say(`You need 1000 medals (you have ${this.medals}).`, 'Ambrose');
      } else if (this.give_truth_jewel('medals_1000')) {
        this.medals -= 1000;
      } else {
        await this.say('You already claimed this Jewel of Truth!', 'Ambrose');
      }
    }
  }

  crop_water_count(): number {
    return Object.keys(this.crops).filter((k) => !this.wet.has(k)).length;
  }

  animal_feed_count(): number {
    return this.animals.filter((a) => !a.fed).length + Math.max(0, this.chickens - this.fed);
  }

  ready_livestock_count(): number {
    return (
      this.animals.filter((a) => (a.kind === 'cow' && a.ready) || (a.kind === 'sheep' && a.wool >= WOOL_DAYS)).length +
      (this.eggs > 0 ? 1 : 0)
    );
  }

  today_lines(): string[] {
    const lines: string[] = [];
    const now = this.minutes;
    const binValue = py_sum(Object.entries(this.bin).map(([i, q]) => (ITEMS[i] ? ITEMS[i][0] : 0) * q));
    const cutoff = 17 * 60;
    const until = Math.max(0, cutoff - now);
    const hh = Math.floor(until / 60);
    const mm = until % 60;
    const ship =
      this.zack_paid_today
        ? 'Otto already collected today’s shipment.'
        : now >= cutoff
          ? 'Otto has gone home; shipments roll over to tomorrow.'
          : `Otto collects at 5:00 PM (${hh}h ${mm.toString().padStart(2, '0')}m from now).`;

    lines.push(`  ${this.date_str()} — ${this.weather}`);
    lines.push(`  Tomorrow: ${this.tomorrow}   Fortune: ${LUCK_LABELS[this.daily_luck].name}`);
    const tr = this.town_rank();
    lines.push(`  Town   Rank ${tr.tier.grade} (${tr.tier.title}) · ${tr.points} pts${tr.next ? ` (${tr.pointsToNext} to Rank ${tr.next.grade})` : ' (MAX)'}`);
    const buff = this.active_buff();
    if (buff) lines.push(`  Buff   ${buff.label}`);
    if (this.spouse_routine && this.spouse_routine.day === this.absday()) {
      lines.push(`  Home   ${this.spouse_routine.text}`);
    }
    if (this.pet_extras.cat && this.pet_extras.catClue) {
      lines.push(`  Cat    ${this.pet_extras.catName}: ${this.pet_extras.catClue}`);
    }
    lines.push('');
    if (this.first_steps) {
      const rows = this.first_steps_rows();
      lines.push(`  First morning  ${rows.map((r) => `[${r.done ? '✓' : ' '}] ${r.label.split(' ')[0]}`).join('  ')}`);
      const next = rows.find((r) => !r.done);
      if (next) lines.push(`         ${this.first_steps_hint(next.key)}`);
      lines.push('         (Hide this list in the Diary.)');
      lines.push('');
    }
    if (this.fortnight.active) {
      lines.push(`  First fortnight  ${this.fortnight.done.length}/${FORTNIGHT_GOALS.length}`);
      for (const g of FORTNIGHT_GOALS) lines.push(`    [${this.fortnight.done.includes(g.id) ? '✓' : ' '}] ${g.label}`);
      const next = FORTNIGHT_GOALS.find((g) => !this.fortnight.done.includes(g.id));
      if (next) lines.push(`    ${next.hint}`);
      lines.push('');
    }
    const soon = this.reminders.filter((r) => r.day - this.absday() <= 7);
    for (const r of soon.slice(0, 3)) {
      const when = this.day_from_now(r.day);
      lines.push(`  ★ ${when === 'today' ? 'Today' : when === 'tomorrow' ? 'Tomorrow' : `${absdayLabel(r.day, false)} (${when})`}: ${r.text}`);
    }
    if (soon.length) lines.push('');
    if (this.dog_clue_live()) {
      lines.push(`  Dog    Picked up a scent: ${this.dog_clue_text()}.`);
      lines.push('');
    }
    const flush = this.flush_left();
    if (flush) {
      lines.push(`  Hollow ${flush} mushroom${flush === 1 ? '' : 's'} came up in Cedar Hollow after the rain.`);
      lines.push('');
    } else if (this.flush_coming()) {
      lines.push('  Rain   Mushrooms will come up in Cedar Hollow tomorrow morning.');
      lines.push('');
    }
    const pot = this.trap_state();
    if (pot !== 'up') {
      lines.push(pot === 'ready' ? '  Pot    The crab pot off the beach pier is ready to haul.' : '  Pot    Crab pot set off the beach pier: haul it tomorrow.');
      lines.push('');
    }
    lines.push(`  Ship   ${binValue ? `${binValue}G waiting` : 'empty'}`);
    lines.push(`         ${ship}`);
    lines.push(`  Water  ${this.crop_water_count()} crop${this.crop_water_count() === 1 ? '' : 's'} still dry`);
    for (const st of this.plot_status()) {
      const pl = this.plot_line(st);
      if (pl) lines.push(`  Plot   ${pl}`);
    }
    lines.push(`  Feed   ${this.animal_feed_count()} animal${this.animal_feed_count() === 1 ? '' : 's'} still hungry`);
    lines.push(`  Ready  ${this.ready_livestock_count()} product${this.ready_livestock_count() === 1 ? '' : 's'} to collect`);
    for (const mk of this.makers) {
      const st = this.maker_state(mk);
      if (st !== 'idle' || makerBatch(mk, this.inv).length) lines.push(`  Makers ${this.maker_status(mk, true)}`);
    }
    const casks = this.cask_status();
    if (casks) lines.push(`  Casks  ${casks}`);
    lines.push(`  Museum ${this.museum.length}/${this.museum_total()} donated`);
    if (this.requests.length) {
      const r = this.requests[0];
      const extra = this.requests.length > 1 ? ` (+${this.requests.length - 1} more)` : '';
      lines.push(`  Board  ${r.npc} needs ${r.qty} × ${r.item}${extra}`);
    }
    const ordT = this.order_template();
    if (ordT) {
      const days = Math.max(0, this.order!.deadline - this.absday());
      lines.push(`  Order  ${ordT.npc}: ${andList(this.order_still_needed())} (${days}d)`);
    }
    if (this.gray_quest === 1) {
      lines.push(`  Rowan   wants ${GRAY_COPPER_QTY} × Copper from the Copperseam Mine (have ${this.inv['Copper'] || 0})`);
    } else if (this.gray_quest === 2) {
      lines.push(`  Note   ${this.gray_note()}`);
    }
    const favor = this.favor_line();
    if (favor) {
      lines.push(`  Favor  ${favor.text}`);
      for (const h of favor.hours) lines.push(`         ${h}`);
    }
    const contest = this.contest_line();
    if (contest) lines.push(`  Catch  ${contest}`);
    const works = this.works_line();
    if (works) lines.push(`  Bridge ${works}`);
    const pinRoute = this.pin_route();
    if (pinRoute) lines.push(`  Pin    ${pinRoute.landmark.name}: ${pinRoute.text}`);
    const openContracts = this.contracts.filter((c) => !c.done);
    if (openContracts.length) {
      const c = openContracts[0];
      lines.push(`  Ship   Contract: ${c.item} (${c.shipped}/${c.need}) for +${c.bonusGold}G by ${absdayLabel(c.deadline, false)}`);
    }
    const gv = this.current_guest_vendor();
    if (gv) lines.push(`  Cart   ${gv.title} is in Market Cross today!`);
    if (this.pantry.items.length >= PANTRY_GOAL) {
      lines.push('  Pantry Community pantry is stocked — ready for a shared meal in Market Cross!');
    } else if (this.pantry.items.length > 0) {
      lines.push(`  Pantry Community pantry: ${this.pantry.items.length}/${PANTRY_GOAL} ingredients donated.`);
    }
    if (this.trail_encounter && this.trail_encounter.day === this.absday() && !this.trail_encounter.done) {
      const te = TRAIL_ENCOUNTERS.find((e) => e.id === this.trail_encounter!.id);
      if (te) lines.push(`  Trail  ${te.npc} was spotted along the trail in ${this.maps[te.map]?.title || te.map}.`);
    }
    if (this.animals.length > 0) {
      const pName = this.pasture.active === 'west' ? 'West' : 'East';
      lines.push(`  Grass  Pasture (${pName}): ${this.pasture[this.pasture.active]}% · Resting: ${this.pasture[this.pasture.active === 'west' ? 'east' : 'west']}%`);
    }
    lines.push(`  Forge  ${this.forge_status().text}`);
    lines.push('');
    const bdays = this.birthdays();
    if (bdays.length) lines.push(`  Birthday today: ${bdays.join(', ')} (5× gift bonus!)`);
    const bdayTomorrow = this.birthdays(1);
    if (bdayTomorrow.length) lines.push(`  Birthday tomorrow: ${bdayTomorrow.join(', ')}`);
    const fest = this.fest_on();
    if (fest) lines.push(`  Festival: ${fest[0]} at Market Cross (${fmt_hour(fest[1])}–${fmt_hour(fest[2])})`);
    const festTomorrow = this.fest_on(1);
    if (festTomorrow) lines.push(`  Tomorrow’s festival: ${festTomorrow[0]}`);
    if (!bdays.length && !bdayTomorrow.length && !fest && !festTomorrow) lines.push('  No birthdays or festivals today.');
    if (this.weekday === INN_EVENING_DAY) {
      const [o, c] = INN_EVENING_HOURS;
      lines.push(
        this.inn_evening_day === this.absday()
          ? '  Inn: you spent this Friday evening at Gideon\'s.'
          : `  Inn ${fmt_hour(o)}–${fmt_hour(c)}: ${this.inn_scene().title}`
      );
    }
    if (this.weekday === STALL_DAY) {
      const st = this.stall_state();
      lines.push(
        st === 'open'
          ? `  Market: your stall is open until ${fmt_hour(STALL_CLOSE)} (${this.stall!.gold}G so far).`
          : st === 'ready'
            ? `  Market: stock your stall in Market Cross before ${fmt_hour(STALL_STOCK_BY)} (up to ${STALL_SLOTS} goods).`
            : st === 'done'
              ? `  Market: you took ${this.stall_last[1]}G at your stall today.`
              : this.fest_on()
                ? '  Market: no stall today, it is a festival.'
                : '  Market: too late to set up your stall today.',
      );
    } else if ((this.weekday + 1) % 7 === STALL_DAY && !this.fest_on(1)) {
      lines.push('  Tomorrow: Saturday market in Market Cross. Set aside up to three goods to sell.');
    }
    const marketClue = this.weekday !== STALL_DAY || ['ready', 'open'].includes(this.stall_state()) ? this.market_clue() : null;
    if (marketClue) lines.push(`  Saturday regulars: ${marketClue}`);
    lines.push('');
    if (this.stamina <= 30 || this.fatigue >= 80) {
      lines.push('  Rest: stamina is low. Eat, soak at the Hot Spring, or sleep early.');
    } else {
      lines.push('  Plan: clear weeds, water crops, care for animals, then ship before 5 PM.');
    }
    return lines;
  }

  async today_panel(): Promise<void> {
    const seasonCol = SEASON_COL[this.season_name];
    const seasonGlyph = SEASON_GLYPHS[this.season];
    const weatherGlyph = this.weather === 'Rain' || this.weather === 'Typhoon' ? '☂' : this.weather === 'Snow' || this.weather === 'Blizzard' ? '❄' : '☀';
    const wCol = WEATHER_COL[this.weather] || '09';
    const tomCol = WEATHER_COL[this.tomorrow] || '05';
    const now = this.minutes;
    const binValue = py_sum(Object.entries(this.bin).map(([i, q]) => (ITEMS[i] ? ITEMS[i][0] : 0) * q));
    const cutoff = 17 * 60;
    const until = Math.max(0, cutoff - now);
    const hh = Math.floor(until / 60);
    const mm = until % 60;
    const shipNote = this.zack_paid_today
      ? 'Otto collected today’s shipment.'
      : now >= cutoff
        ? 'Otto went home; rolls to tomorrow.'
        : `Pickup at 5:00 PM (${hh}h ${mm.toString().padStart(2, '0')}m)`;
    const dry = this.crop_water_count();
    const hungry = this.animal_feed_count();
    const ready = this.ready_livestock_count();
    const makerReady = this.maker_ready_count();
    const bdays = this.birthdays();
    const bdayTomorrow = this.birthdays(1);
    const fest = this.fest_on();
    const festTomorrow = this.fest_on(1);
    const works = this.works_line();
    const pinRoute = this.pin_route();
    const forge = this.forge_status().text;
    const low = this.stamina <= 30 || this.fatigue >= 80;
    const planText = low
      ? 'Stamina is low. Eat, soak at the Hot Spring, or sleep early.'
      : 'Clear weeds, water crops, tend animals, ship before 5 PM.';

    const buildPages = (cw: number, pageMax: number): HudPageLine[][] => {
      const wrapLabeled = (tag: string, tagCol: string, body: string, bodyCol = '05'): HudPageLine[] => {
        const prefix = `  ${tag}  `;
        const wrapped = wrapLine(body, Math.max(12, cw - prefix.length));
        return wrapped.map((chunk, idx): HudPageLine => ({
          kind: 'spans',
          spans: idx === 0
            ? [{ text: `${tag} `, fg: tagCol, bold: true }, { text: chunk, fg: bodyCol }]
            : [{ text: ' '.repeat(tag.length + 1) + chunk, fg: bodyCol }],
        }));
      };
      const all: HudPageLine[] = [
        {
          kind: 'ledger',
          prefix: seasonGlyph,
          prefixCol: seasonCol,
          label: this.date_str(),
          labelCol: seasonCol,
          labelBold: true,
          value: `${weatherGlyph} ${this.weather}`,
          valueCol: wCol,
        },
        {
          kind: 'ledger',
          label: 'Tomorrow Forecast',
          labelCol: '04',
          value: `→ ${this.tomorrow}`,
          valueCol: tomCol,
        },
        { kind: 'fence' },
        {
          kind: 'ledger',
          prefix: '▣',
          prefixCol: binValue ? '09' : '04',
          label: 'Shipping Bin',
          labelCol: '04',
          value: binValue ? `${binValue}G waiting` : 'empty',
          valueCol: binValue ? '09' : '04',
        },
        ...wrapLine(shipNote, Math.max(14, cw - 2)).map(
          (ln): HudPageLine => ({ kind: 'spans', spans: [{ text: `  ${ln}`, fg: '03' }] }),
        ),
        {
          kind: 'ledger',
          prefix: '≈',
          prefixCol: dry ? '09' : '0B',
          label: 'Watering',
          labelCol: '04',
          value: `${dry} crop${dry === 1 ? '' : 's'} dry`,
          valueCol: dry ? '09' : '0B',
        },
        {
          kind: 'ledger',
          prefix: '♥',
          prefixCol: hungry ? '08' : '0B',
          label: 'Livestock',
          labelCol: '04',
          value: `${hungry} animal${hungry === 1 ? '' : 's'} hungry`,
          valueCol: hungry ? '08' : '0B',
        },
        {
          kind: 'ledger',
          prefix: '●',
          prefixCol: ready ? '09' : '04',
          label: 'Produce Ready',
          labelCol: '04',
          value: `${ready} item${ready === 1 ? '' : 's'}`,
          valueCol: ready ? '09' : '04',
        },
        ...(makerReady
          ? [{
              kind: 'ledger' as const,
              prefix: '⚙',
              prefixCol: '0C',
              label: 'Makers',
              labelCol: '04',
              value: `${makerReady} ready`,
              valueCol: '0C',
            }]
          : []),
        {
          kind: 'ledger',
          prefix: '◈',
          prefixCol: '0C',
          label: 'Museum',
          labelCol: '04',
          value: `${this.museum.length}/${this.museum_total()} donated`,
          valueCol: '0C',
        },
        ...wrapLabeled('⚒ Forge ', '09', forge, '05'),
      ];
      if (this.requests.length) {
        const r = this.requests[0];
        const extra = this.requests.length > 1 ? ` (+${this.requests.length - 1})` : '';
        all.push(...wrapLabeled('✦ Board ', '0E', `${r.npc} needs ${r.qty} × ${r.item}${extra}`, '05'));
      }
      if (this.order_template()) {
        all.push(...wrapLabeled('★ Order ', '0E', `${this.order_template()!.npc}: ${andList(this.order_still_needed())}`, '05'));
      }
      const pinned = this.reminders.find((r) => r.day - this.absday() <= 1);
      if (pinned) all.push(...wrapLabeled('★ Pinned', '0C', `${this.day_from_now(pinned.day) === 'today' ? 'Today' : 'Tomorrow'}: ${pinned.text}`, '05'));
      if (this.gray_quest === 1) {
        all.push(...wrapLabeled('◆ Rowan  ', '0C', `Wants ${GRAY_COPPER_QTY}×Copper (have ${this.inv['Copper'] || 0})`, '05'));
      } else if (this.gray_quest === 2) {
        all.push(...wrapLabeled('◆ Forge ', '0C', this.gray_note(), '05'));
      }
      const favor = this.favor_line();
      if (favor) {
        all.push(...wrapLabeled('♥ Favor ', '0A', favor.text, '05'));
        for (const h of favor.hours) all.push(...wrapLabeled('        ', '04', h, '05'));
      }
      const contest = this.contest_line();
      if (contest) all.push(...wrapLabeled('≈ Catch ', '0D', contest, '05'));
      if (works) all.push(...wrapLabeled('═ Bridge', '09', works, '05'));
      if (pinRoute) all.push(...wrapLabeled('◈ Pin   ', '0E', `${pinRoute.landmark.name}: ${pinRoute.text}`, '05'));

      all.push({ kind: 'fence' });

      if (bdays.length) all.push(...wrapLabeled('♥ B-Day ', '0A', `${bdays.join(', ')} (5× gift!)`, '0A'));
      if (bdayTomorrow.length) all.push(...wrapLabeled('♡ Next  ', '0C', `Birthday tomorrow: ${bdayTomorrow.join(', ')}`, '04'));
      if (fest) all.push(...wrapLabeled('✦ Fest  ', '0B', `${fest[0]} · Rose Sq (${fmt_hour(fest[1])}–${fmt_hour(fest[2])})`, '0B'));
      if (festTomorrow) all.push(...wrapLabeled('✦ Next  ', '0C', `Tomorrow’s festival: ${festTomorrow[0]}`, '05'));
      if (!bdays.length && !bdayTomorrow.length && !fest && !festTomorrow) {
        all.push({ kind: 'spans', spans: [{ text: '· No birthdays or festivals today.', fg: '03' }] });
      }
      if (this.weekday === INN_EVENING_DAY) {
        const [o, c] = INN_EVENING_HOURS;
        const txt = this.inn_evening_day === this.absday()
          ? "Spent Friday evening at Gideon's Inn."
          : `${fmt_hour(o)}–${fmt_hour(c)}: ${this.inn_scene().title}`;
        all.push(...wrapLabeled('♪ Inn   ', '09', txt, '05'));
      }
      if (this.weekday === STALL_DAY) {
        const st = this.stall_state();
        const stTxt = st === 'open'
          ? `Stall open until ${fmt_hour(STALL_CLOSE)} (${this.stall!.gold}G so far).`
          : st === 'ready'
            ? `Stock Rose Sq stall before ${fmt_hour(STALL_STOCK_BY)} (${STALL_SLOTS} max).`
            : st === 'done'
              ? `Took ${this.stall_last[1]}G at your stall today.`
              : this.fest_on() ? 'No stall today (festival).' : 'Too late to set up stall.';
        all.push(...wrapLabeled('▣ Stall ', '09', stTxt, '05'));
      } else if ((this.weekday + 1) % 7 === STALL_DAY && !this.fest_on(1)) {
        all.push(...wrapLabeled('▣ Next  ', '04', 'Saturday market in Market Cross.', '04'));
      }
      const wantClue = this.weekday !== STALL_DAY || ['ready', 'open'].includes(this.stall_state()) ? this.market_clue() : null;
      if (wantClue) all.push(...wrapLabeled('▣ Wants ', '09', wantClue, '05'));

      all.push({ kind: 'fence' });
      all.push(...wrapLabeled(low ? '! Rest  ' : '❧ Plan  ', low ? '08' : '0C', planText, low ? '08' : '05'));

      const pages: HudPageLine[][] = [];
      for (let i = 0; i < all.length; i += pageMax) {
        pages.push(all.slice(i, i + pageMax));
      }
      return pages.length ? pages : [[]];
    };

    await this.show_hud_pages('☀ Today on the Farm', buildPages, {
      style: { kind: 'hud', accent: seasonCol },
      alignToMap: true,
      minWidth: 48,
      maxWidth: 64,
    });
  }

  /** The "Shared Memories" pages at the back of Villager Notes, newest first. */
  memory_pages(cw: number, pageMax: number): HudPageLine[][] {
    const head = (): HudPageLine[] => [
      {
        kind: 'ledger',
        prefix: '❧',
        prefixCol: '0A',
        label: 'Shared Memories',
        labelCol: '07',
        labelBold: true,
        value: `${this.memories.length} kept`,
        valueCol: '04',
      },
      { kind: 'fence' },
    ];
    const pages: HudPageLine[][] = [];
    let page = head();
    if (!this.memories.length) {
      for (const l of wrapLines(['Nothing yet. Gifts they love, requests you fill and the moments people bring up are kept here.'], Math.max(10, cw - 2))) {
        page.push({ kind: 'spans', spans: [{ text: `  ${l}`, fg: '04' }] });
      }
      return [page];
    }
    for (const m of [...this.memories].reverse()) {
      const when = absdayLabel(m.day);
      const body = wrapLines([m.text], Math.max(10, cw - 4));
      if (page.length + 1 + body.length > pageMax && page.length > 2) {
        pages.push(page);
        page = head();
      }
      page.push({ kind: 'spans', spans: [{ text: '● ', fg: NPCS[m.npc]?.col || '05', bold: true }, { text: when, fg: '04' }] });
      for (const l of body) page.push({ kind: 'spans', spans: [{ text: `    ${l}`, fg: '05' }] });
    }
    pages.push(page);
    return pages;
  }

  async relationships(): Promise<void> {
    const names = Object.keys(NPCS).sort((a, b) => (this.friend[b] || 0) - (this.friend[a] || 0));
    const buildPages = (cw: number, pageMax: number): HudPageLine[][] => {
      const perPage = Math.max(3, Math.min(6, Math.floor((pageMax - 2) / 3)));
      const pages: HudPageLine[][] = [];
      for (let p = 0; p < names.length; p += perPage) {
        const slice = names.slice(p, p + perPage);
        const page: HudPageLine[] = [
          {
            kind: 'ledger',
            prefix: '♥',
            prefixCol: '0A',
            label: 'Brackenford Directory',
            labelCol: '07',
            labelBold: true,
            value: 'Sorted by ♥',
            valueCol: '04',
          },
          { kind: 'fence' },
        ];
        for (const n of slice) {
          const d = NPCS[n];
          const aff = this.friend[n] || 0;
          const info = getHeartInfo(aff);
          const hearts = Math.floor(Math.max(0, Math.min(100, aff)) / 10);
          const heartCol = info.color === '03' ? '04' : info.color;
          const where = d.where ? this.maps[d.where[0]]?.title || d.where[0] : 'Indoors';
          const hours = d.out ? `${fmt_hour(d.out[0])}–${fmt_hour(d.out[1])}` : 'all day';
          const loves = (d.loves || []).slice(0, 3).join(', ') || '—';

          // Line 1: ● Name ····· ♥♥◦◦◦◦◦◦◦◦ Purple ♡
          const leftStr = `● ${n}`;
          const tierTag = `${info.label}${d.bach ? ' ♡' : ''}`;
          const pipStr = `${'♥'.repeat(hearts)}${'◦'.repeat(10 - hearts)}`;
          const rightStr = `${pipStr} ${tierTag}`;
          const gap = cw - leftStr.length - rightStr.length;
          const dots = gap >= 3 ? ` ${'·'.repeat(gap - 2)} ` : ' '.repeat(Math.max(1, gap));
          const headerSpans: HudSpan[] = [
            { text: '● ', fg: d.col, bold: true },
            { text: n, fg: '07', bold: true },
            { text: dots, fg: '01' },
          ];
          if (hearts > 0) headerSpans.push({ text: '♥'.repeat(hearts), fg: heartCol, bold: true });
          if (hearts < 10) headerSpans.push({ text: '◦'.repeat(10 - hearts), fg: '03' });
          headerSpans.push({ text: ` ${info.label}`, fg: heartCol });
          if (d.bach) headerSpans.push({ text: ' ♡', fg: '0A', bold: true });
          page.push({ kind: 'spans', spans: headerSpans });

          // Line 2: Loves (clipped cleanly to content width)
          const loveAvail = Math.max(8, cw - 8);
          const loveTxt = loves.length > loveAvail ? loves.slice(0, loveAvail - 1) + '…' : loves;
          page.push({
            kind: 'spans',
            spans: [
              { text: '  Loves ', fg: '03' },
              { text: loveTxt, fg: '05' },
            ],
          });

          // Line 3: Schedule
          const schedTxt = `${where}, ${hours}`;
          const schedAvail = Math.max(8, cw - 8);
          const schedClip = schedTxt.length > schedAvail ? schedTxt.slice(0, schedAvail - 1) + '…' : schedTxt;
          page.push({
            kind: 'spans',
            spans: [
              { text: '  Finds ', fg: '03' },
              { text: schedClip.startsWith(where) ? where : schedClip, fg: '0C' },
              ...(schedClip.startsWith(where) ? [{ text: schedClip.slice(where.length), fg: '04' }] : []),
            ],
          });
        }
        pages.push(page);
      }
      pages.push(...this.memory_pages(cw, pageMax));
      return pages.length ? pages : [[]];
    };

    await this.show_hud_pages('♥ Villager Notes', buildPages, {
      style: { kind: 'hud', accent: '0A' },
      alignToMap: true,
      minWidth: 48,
      maxWidth: 64,
    });
  }

  /** Winter ground is frozen except under glass once the greenhouse is built. */
  ground_frozen(key: string): boolean {
    return this.season === 3 && !(this.farm_works.greenhouse && GLASS_CELLS.includes(key));
  }

  /** What the row tool does on a tile the player walks past (task 54): work it, walk over what is done, or stop. */
  row_tile(x: number, y: number): 'work' | 'pass' | 'stop' {
    if (this.mapname !== 'farm' || !this.walkable(this.mapname, x, y) || this.npc_at(x, y)) return 'stop';
    const key = pkey(x, y);
    if (key in this.map.doors || key in this.map.warps) return 'stop';
    if (this.tool === 'Hoe') {
      if (this.tilled.has(key)) return 'pass';
      const untilled = !this.ground_frozen(key) && this.map.tile(x, y) === 'field' && !(key in this.crops);
      return untilled ? 'work' : 'stop';
    }
    if (this.tool === 'Watering Can') {
      if (!this.tilled.has(key)) return 'stop';
      return this.wet.has(key) ? 'pass' : 'work';
    }
    return 'stop';
  }

  /** Predict the same cost and weather penalties as a normal swing, without allowing collapse. */
  row_cost(stamina: number, fatigue: number): { stamina: number; fatigue: number } | null {
    const step = this.swing_cost(ROW_STEP_STAMINA);
    if (stamina - step * (this.levels[this.tool] === 5 ? 3 : 1) < this.row_reserve) return null;
    const result = calculateStaminaSpend(stamina, fatigue, step, {
      weather: this.weather, minutes: this.minutes, hasMysticBerry: this.has_mystic_berry,
      isCursedTool: this.levels[this.tool] === 5,
    });
    return result.fainted ? null : result;
  }

  /** C, first press: plan the row ahead and show it. Nothing is used until the next press. */
  row_preview(): void {
    this.row = null;
    if (this.mapname !== 'farm') {
      this.msg('Rows are worked on your farm, with the Hoe or the Watering Can.');
      return;
    }
    if (!ROW_TOOLS.includes(this.tool)) {
      this.msg(`Work a row with the Hoe or the Watering Can, not the ${this.tool}.`);
      return;
    }
    if (!this.tool_list().includes(this.tool) || this.riding_horse) {
      this.msg('Dismount and equip an available Hoe or Watering Can to work a row.');
      return;
    }
    const [dx, dy] = this.face;
    const tiles: [number, number][] = [];
    const kinds: ('work' | 'pass')[] = [];
    let stopReason: string | undefined;
    let stamina = this.stamina;
    let fatigue = this.fatigue;
    let water = this.tool === 'Watering Can' ? this.water : Infinity;
    for (let i = 1; i <= ROW_MAX; i++) {
      const x = this.px + dx * i;
      const y = this.py + dy * i;
      const kind = this.row_tile(x, y);
      if (kind === 'stop') {
        stopReason = 'The row stops at an obstacle.';
        break;
      }
      if (kind === 'work') {
        const cost = this.row_cost(stamina, fatigue);
        if (!cost || water <= 0) {
          stopReason = water <= 0 ? 'The watering can is empty. Refill it at a pond or stream.' : `The row stops: keep ${this.row_reserve} stamina and avoid fainting.`;
          break;
        }
        stamina = cost.stamina;
        fatigue = cost.fatigue;
        water -= 1;
      }
      tiles.push([x, y]);
      kinds.push(kind);
    }
    // A row ends on its last tile the tool works; finished ground after that is not worth the walk.
    while (kinds.length && kinds[kinds.length - 1] === 'pass') {
      kinds.pop();
      tiles.pop();
    }
    const works = kinds.filter((k) => k === 'work').length;
    if (!works) {
      if (this.tool === 'Watering Can' && this.water <= 0) {
        this.msg('The watering can is empty. Refill it at a pond or stream.', '08');
      } else if (!this.row_cost(this.stamina, this.fatigue)) {
        this.msg(`Not enough stamina to work a row: keep ${this.row_reserve} in reserve, and avoid fainting.`, '08');
      } else {
        this.msg(this.tool === 'Hoe' ? 'Face a row of untilled field to work it with the Hoe.' : 'Face a row of tilled soil that is not wet yet to water it.');
      }
      return;
    }
    this.row = { map: this.mapname, tool: this.tool, dir: [dx, dy], tiles, stopReason };
    const way = dx > 0 ? 'east' : dx < 0 ? 'west' : dy > 0 ? 'south' : 'north';
    const verb = this.tool === 'Hoe' ? 'till' : 'water';
    this.msg(`Row: ${works} tile${works === 1 ? '' : 's'} ${way}. Press C again, or hold it, to ${verb} the row.`, '0C');
  }

  /** Is the planned row still the one in front of the player: same map, tool and facing, and its next tile ahead? */
  row_current(row: NonNullable<Game['row']>): boolean {
    const next = row.tiles[0];
    const [tx, ty] = this.target();
    return !!next && row.map === this.mapname && row.tool === this.tool && this.tool_list().includes(this.tool) && !this.riding_horse && this.face[0] === row.dir[0] && this.face[1] === row.dir[1] && tx === next[0] && ty === next[1] && !this.typing && this.modal_depth === 0;
  }

  /** C again: work the tile ahead if the tool acts on it, then step onto it. The row ends at an obstacle, an empty can, or the stamina reserve. */
  async row_step(): Promise<void> {
    const row = this.row!;
    const [dx, dy] = row.dir;
    const [x, y] = row.tiles[0];
    const previousMessage = this.msgs.at(-1);
    const kind = this.row_tile(x, y);
    if (kind === 'stop') {
      this.row = null;
      this.msg('The row stops at an obstacle.', '08');
      return;
    }
    if (kind === 'work') {
      if (this.tool === 'Watering Can' && this.water <= 0) {
        this.row = null;
        this.msg('The watering can is empty. Refill it at a pond or stream.', '08');
        return;
      }
      if (!this.row_cost(this.stamina, this.fatigue)) {
        this.row = null;
        this.msg(`The row stops: keep ${this.row_reserve} stamina and avoid fainting.`, '09');
        return;
      }
      const [px, py] = [this.px, this.py];
      await this.use_tool([x, y]);
      this.first_steps_update();
      this.goals_tick();
      if (this.mapname !== row.map || this.px !== px || this.py !== py) {
        this.row = null;
        return;
      }
    }
    row.tiles.shift();
    await this.move(dx, dy);
    if (!row.tiles.length) {
      this.row = null;
      // Do not hide a berry, checklist, or other event message with a completion notice.
      if (this.msgs.at(-1) === previousMessage) this.msg(row.stopReason ?? 'The row is done.', row.stopReason ? '09' : '0B');
      return;
    }
    if (!this.row_current(row)) this.row = null;
  }

  tool_cost(): number {
    const [tx, ty] = this.target();
    const tile = this.map.tile(tx, ty);
    if (this.tool.endsWith(' Seeds')) return 1;
    if (this.tool === 'Fishing Rod') return tile === 'water' || tile === 'pond' ? 3 : 0;
    if (this.tool === 'Watering Can') {
      if (tile === 'water' || tile === 'fountain' || tile === 'pond') return 0;
      if (this.water <= 0) return 0;
    }
    return 2;
  }

  action_preview(): { cost: number; faint: boolean } {
    const cost = this.tool_cost();
    if (cost <= 0) return { cost, faint: false };
    const res = calculateStaminaSpend(this.stamina, this.fatigue, cost, {
      weather: this.map.indoor ? 'Sunny' : this.weather,
      minutes: this.minutes,
      hasMysticBerry: this.has_mystic_berry,
      isCursedTool: this.levels[this.tool] === 5,
    });
    return { cost, faint: res.fainted };
  }

  facing_action(): { label: string; summary: string } {
    const [tx, ty] = this.target();
    const pKey = pkey(tx, ty);
    const m = this.map;
    const cost = this.action_preview().cost;
    const stamina = cost > 0 ? ` · ${cost} stamina` : '';
    const withTarget = (verb: string, target: string, actionLabel: string, includeCost = true) => ({
      label: actionLabel,
      summary: `${verb} ${target}${includeCost && cost > 0 ? stamina : ''}`,
    });
    if (this.typing) return { label: 'DONE', summary: 'Done' };
    if (this.modal_depth > 0) return { label: 'OK', summary: 'OK' };
    if (this.npc_at(tx, ty)) {
      const name = this.npc_at(tx, ty)!;
      return { label: 'TALK', summary: `Talk to ${NPCS[name]?.name || name}` };
    }
    if (this.mapname === 'house' && this.married && this.child_name && tx === SPOUSE_POS[0] + 1 && ty === SPOUSE_POS[1]) {
      return { label: 'TALK', summary: this.held ? `Show ${this.held} to ${this.child_name}` : `Talk to ${this.child_name}` };
    }
    if (this.mapname === 'town' && tx === GUEST_VENDOR_SPOT[0] && ty === GUEST_VENDOR_SPOT[1] && this.current_guest_vendor()) {
      return { label: 'SHOP', summary: `Visit ${this.current_guest_vendor()!.title}` };
    }
    const teHit = this.trail_at(tx, ty);
    if (teHit) {
      return teHit.kind === 'item'
        ? { label: 'PICK', summary: `Pick up ${teHit.def.itemName || 'lost item'}` }
        : { label: 'TALK', summary: `Talk to ${teHit.def.npc} on the trail` };
    }
    if (pKey in m.doors || pKey in m.warps) return { label: 'ENTER', summary: 'Enter' };
    if (this.mapname === 'farm' && ((tx === 21 && ty === 6) || (this.pet_extras.cat && tx === CAT_SPOT[0] && ty === CAT_SPOT[1]) || (!this.riding_horse && tx === 25 && ty === 6))) {
      return { label: 'CARE', summary: 'Care for the farm' };
    }
    const tile = m.tile(tx, ty);
    if (tile === 'spring') return { label: 'SOAK', summary: 'Soak in the spring' };
    if (tile === 'pond') return { label: this.mapname === 'point' ? 'LOOK' : 'OFFER', summary: this.mapname === 'point' ? 'Look at the water' : 'Offer to the pond' };
    if (this.mapname === 'farm' && pKey in this.crops) {
      const [crop, age] = this.crops[pKey];
      const name = crop.toLowerCase();
      if (age < CROPS[crop][2] && this.tool === 'Watering Can' && !this.wet.has(pKey)) {
        return withTarget('Water', name, 'WATER');
      }
      if (this.tool === 'Compost' && !this.compost_has(pKey)) {
        return { label: 'SPREAD', summary: `Compost the ${name} · +${COMPOST_BONUS} next harvest` };
      }
      const hasCrop = age >= CROPS[crop][2];
      return withTarget(hasCrop ? 'Harvest' : 'Check', name, hasCrop ? 'HARVEST' : 'CHECK', false);
    }
    if (pKey in (this.forage[this.mapname] || {})) return { label: 'PICK', summary: 'Pick forage' };
    const obj = this.objs[this.mapname]?.[pKey];
    if (obj === 'dig') return this.tool === 'Hoe' ? { label: 'DIG', summary: `Dig up ${this.tool.toLowerCase()}${stamina}` } : { label: 'LOOK', summary: 'Look at the soil' };
    if (obj === 'starrock') return this.tool === 'Hammer' ? { label: 'CRACK', summary: `Crack the starrock${stamina}` } : { label: 'LOOK', summary: 'Look at the stone' };
    if (tile === 'bin') return { label: 'SHIP', summary: 'Ship produce' };
    if (tile === 'bed') return { label: 'SLEEP', summary: 'Sleep' };
    if (tile === 'tv') return { label: 'WATCH', summary: 'Watch the TV' };
    if (tile === 'cal') return { label: 'CALENDAR', summary: 'Check the calendar' };
    if (tile === 'stall') {
      const st = this.stall_state();
      return { label: 'STALL', summary: st === 'ready' ? 'Stock your stall' : st === 'open' ? 'Check your stall' : 'Read the market sign' };
    }
    if (this.at_trap(tx, ty)) {
      const st = this.trap_state();
      return st === 'ready'
        ? { label: 'HAUL', summary: 'Haul the crab pot' }
        : st === 'set'
          ? { label: 'CHECK', summary: 'Crab pot: haul it tomorrow' }
          : { label: 'SET', summary: 'Set the crab pot' };
    }
    if (tile === 'maker') {
      const maker = this.maker_at(tx, ty);
      if (maker) {
        const st = this.maker_state(maker);
        const job = this.maker_jobs[maker];
        if (st === 'ready') return { label: 'COLLECT', summary: `Collect from the ${maker}` };
        if (st === 'working') return { label: 'CHECK', summary: `${maker}: ready ${this.maker_when(job.ready)}` };
        return { label: 'LOAD', summary: `Load the ${maker}` };
      }
    }
    if (tile.startsWith('pocket_')) return { label: 'LOOK', summary: 'Look at the sealed side chamber' };
    if (tile === 'pantry') return { label: 'PANTRY', summary: `Community Pantry (${this.pantry.items.length}/${PANTRY_GOAL})` };
    if (tile === 'stamp_bench') return { label: 'PRINT', summary: 'Stamp-printing bench (winter hobby)' };
    if (tile === 'clock') return { label: 'CLOCK', summary: 'Farmhouse Clock' };
    if (tile === 'mirror') return { label: 'MIRROR', summary: 'Mirror (check self)' };
    if (tile === 'fridge') return { label: 'FRIDGE', summary: 'Refrigerator (store food)' };
    if (tile === 'cabinet') return { label: 'CABINET', summary: 'Cabinet (store gear & ores)' };
    if (tile === 'record_player') return { label: 'MUSIC', summary: 'Record Player (play tracks)' };
    if (tile === 'rug') return { label: 'LOOK', summary: 'Plush Farmhouse Rug (+5 recovery)' };
    if (tile === 'lamp') return { label: 'LOOK', summary: 'Inspect the streetlight' };
    if (tile === 'perch') return { label: 'LOOK', summary: 'Chicken Perch (+2 daily affection)' };
    if (tile === 'shade_tree') return { label: 'LOOK', summary: 'Pasture Shade Tree (+2 daily affection)' };
    if (tile === 'table' && this.mapname === 'house') return { label: 'TABLE', summary: 'Farmhouse Table (notes & dinner)' };
    if (tile === 'orchard_tree') return { label: this.orchard_due(pKey) !== null ? 'PICK' : 'CHECK', summary: this.orchard_due(pKey) !== null ? 'Pick ripe Orchard Pear' : 'Check orchard pear tree' };
    if (tile === 'rain_barrel') return { label: 'BARREL', summary: this.farm_works.channel ? `Rain Barrel (${this.farm_works.water}/${BARREL_CAP}d stored)` : 'Inspect / repair rain barrel' };
    if (tile === 'greenhouse_frame') return { label: 'GLASS', summary: this.farm_works.greenhouse ? 'Inspect greenhouse' : 'Build greenhouse frame' };
    if (['counter', 'bookcase', 'furn', 'kitchen', 'bath', 'shelf', 'vase', 'fireplace', 'sign', 'doghouse', 'stable', 'mill', 'trash', 'phone', 'mantel', 'bench', 'plotsign', ...FARM_USE_TILES].includes(tile)) {
      return { label: 'USE', summary: 'Use the object' };
    }
    if (isFarmPiece(this.tool) && this.mapname === 'farm') {
      const ok = this.farm_can_place(pKey) && !this.farm_overlay(tx, ty);
      return { label: 'PLACE', summary: ok ? `Place ${this.tool} (${FARM_PIECES[this.tool].glyph})` : `Cannot place ${this.tool} here` };
    }
    if (this.tool === 'Fishing Rod' && (tile === 'water' || tile === 'pond')) {
      const pocket = this.fish_pocket(this.mapname, tx, ty);
      return pocket
        ? { label: 'CAST', summary: `Cast · ${pocket.glyph} ${pocket.fish} water${stamina}` }
        : withTarget('Cast', 'your line', 'CAST');
    }
    if (this.mapname === 'river' && tile === 'water' && this.tool !== 'Watering Can') return { label: 'SKIP', summary: 'Skip the water' };
    const short = this.tool.endsWith(' Seeds') ? this.tool.slice(0, -6) : this.tool;
    const pairing = this.companion_preview(this.tool, tx, ty);
    if (pairing) return { label: 'SOW', summary: `Sow ${short.toLowerCase()} · ${pairing.text}` };
    if (this.tool === 'Compost') {
      if (this.compost_has(pKey)) return { label: 'SPREAD', summary: 'Already composted' };
      const ok = this.mapname === 'farm' && this.tilled.has(pKey);
      return { label: 'SPREAD', summary: ok ? `Spread compost · +${COMPOST_BONUS} next harvest` : 'Spread compost on tilled soil' };
    }
    if (this.tool.endsWith(' Seeds') && this.mapname === 'farm' && this.tilled.has(pKey) && !this.crops[pKey]) {
      const when = this.crop_forecast_short(short);
      if (when) return { label: 'SOW', summary: `Sow ${short.toLowerCase()} · ${when}` };
    }
    return withTarget('Use', short.length > 7 ? short.toLowerCase() : short.toLowerCase(), short.length > 7 ? 'USE' : `USE ${short.toUpperCase()}`);
  }

  /** What the big touch button should do for the tile the player is facing. */
  context_action(): { key: 'x' | 'space' | 'enter'; label: string } {
    if (this.typing) return { key: 'enter', label: 'DONE' };
    if (this.modal_depth > 0) return { key: 'space', label: 'OK' };
    const [tx, ty] = this.target();
    const pKey = pkey(tx, ty);
    const m = this.map;
    if (this.npc_at(tx, ty)) return { key: 'x', label: 'TALK' };
    if (this.mapname === 'house' && this.married && this.child_name && tx === SPOUSE_POS[0] + 1 && ty === SPOUSE_POS[1]) {
      return { key: 'x', label: 'TALK' };
    }
    if (this.mapname === 'town' && tx === GUEST_VENDOR_SPOT[0] && ty === GUEST_VENDOR_SPOT[1] && this.current_guest_vendor()) {
      return { key: 'x', label: 'SHOP' };
    }
    const teHit = this.trail_at(tx, ty);
    if (teHit) return { key: 'x', label: teHit.kind === 'item' ? 'PICK' : 'TALK' };
    if (pKey in m.doors || pKey in m.warps) return { key: 'x', label: 'ENTER' };
    if (this.mapname === 'farm' && ((tx === 21 && ty === 6) || (this.pet_extras.cat && tx === CAT_SPOT[0] && ty === CAT_SPOT[1]) || (!this.riding_horse && tx === 25 && ty === 6))) {
      return { key: 'x', label: 'CARE' };
    }
    const tile = m.tile(tx, ty);
    if (tile === 'spring') return { key: 'x', label: 'SOAK' };
    if (tile === 'pond') return { key: 'x', label: this.mapname === 'point' ? 'LOOK' : 'OFFER' };
    if (this.mapname === 'farm' && pKey in this.crops) {
      const [crop, age] = this.crops[pKey];
      if (age < CROPS[crop][2] && this.tool === 'Watering Can' && !this.wet.has(pKey)) return { key: 'space', label: 'WATER' };
      if (this.tool === 'Compost' && !this.compost_has(pKey)) return { key: 'space', label: 'SPREAD' };
      return { key: 'x', label: age >= CROPS[crop][2] ? 'HARVEST' : 'CHECK' };
    }
    if (pKey in (this.forage[this.mapname] || {})) return { key: 'x', label: 'PICK' };
    const obj = this.objs[this.mapname]?.[pKey];
    if (obj === 'dig') return this.tool === 'Hoe' ? { key: 'space', label: 'DIG' } : { key: 'x', label: 'LOOK' };
    if (obj === 'starrock') return this.tool === 'Hammer' ? { key: 'space', label: 'CRACK' } : { key: 'x', label: 'LOOK' };
    if (tile === 'bin') return { key: 'x', label: 'SHIP' };
    if (tile === 'bed') return { key: 'x', label: 'SLEEP' };
    if (tile === 'tv') return { key: 'x', label: 'WATCH' };
    if (tile === 'cal') return { key: 'x', label: 'CALENDAR' };
    if (tile === 'stall') return { key: 'x', label: 'STALL' };
    if (this.at_trap(tx, ty)) {
      const st = this.trap_state();
      return { key: 'x', label: st === 'ready' ? 'HAUL' : st === 'set' ? 'CHECK' : 'SET' };
    }
    if (tile === 'maker') {
      const maker = this.maker_at(tx, ty);
      if (maker) {
        const st = this.maker_state(maker);
        return { key: 'x', label: st === 'ready' ? 'COLLECT' : st === 'working' ? 'CHECK' : 'LOAD' };
      }
    }
    if (tile.startsWith('pocket_')) return { key: 'x', label: 'LOOK' };
    if (tile === 'pantry') return { key: 'x', label: 'PANTRY' };
    if (tile === 'stamp_bench') return { key: 'x', label: 'PRINT' };
    if (tile === 'clock') return { key: 'x', label: 'CLOCK' };
    if (tile === 'mirror') return { key: 'x', label: 'MIRROR' };
    if (tile === 'fridge') return { key: 'x', label: 'FRIDGE' };
    if (tile === 'cabinet') return { key: 'x', label: 'CABINET' };
    if (tile === 'record_player') return { key: 'x', label: 'MUSIC' };
    if (tile === 'rug' || tile === 'lamp') return { key: 'x', label: 'LOOK' };
    if (tile === 'perch' || tile === 'shade_tree') return { key: 'x', label: 'LOOK' };
    if (tile === 'table' && this.mapname === 'house') return { key: 'x', label: 'TABLE' };
    if (['counter', 'bookcase', 'furn', 'kitchen', 'bath', 'shelf', 'vase', 'fireplace', 'sign', 'doghouse', 'stable', 'mill', 'trash', 'phone', 'mantel', 'bench', 'plotsign', ...FARM_USE_TILES].includes(tile)) {
      return { key: 'x', label: 'USE' };
    }
    if (this.tool === 'Fishing Rod' && (tile === 'water' || tile === 'pond')) return { key: 'space', label: 'CAST' };
    if (this.mapname === 'river' && tile === 'water' && this.tool !== 'Watering Can') return { key: 'x', label: 'SKIP' };
    if (this.tool === 'Compost') return { key: 'space', label: 'SPREAD' };
    if (!this.tool_can_work_here(this.tool, obj)) return { key: 'x', label: 'LOOK' };
    const short = this.tool.endsWith(' Seeds') ? this.tool.slice(0, -6) : this.tool;
    return { key: 'space', label: short.length > 7 ? 'USE' : `USE ${short.toUpperCase()}` };
  }

  museum_categories(): [string, string][] {
    return [
      ['Fish', 'fish'],
      ['Ore', 'ore'],
      ['Forage', 'forage'],
      ['Crops', 'crop'],
      ['Relics', 'relic'],
    ];
  }

  museum_pool(category: string | null = null): string[] {
    const excluded = new Set(['Junk Ore', 'Boot', 'Empty Can', 'Failed Dish', 'Geode', 'Frozen Geode', 'Magma Geode']);
    const cats = this.museum_categories();
    const allowed = new Set(category ? cats.filter(([, c]) => c === category).map(([, c]) => c) : cats.map(([, c]) => c));
    return py_sorted(
      Object.entries(ITEMS)
        .filter(([name, d]) => allowed.has(d[2]) && !excluded.has(name))
        .map(([name]) => name)
    );
  }

  museum_total(): number {
    return this.museum_pool().length;
  }

  async museum_reward_check(): Promise<void> {
    const milestones: [number, number, string, number][] = [
      [5, 500, 'Flour', 3],
      [10, 1000, 'Basket', 1],
      [20, 2000, 'Diamond', 1],
      [30, 5000, 'Diamond', 2],
    ];
    for (const [need, gold, item, qty] of milestones) {
      if (this.museum.length >= need && !this.museum_rewards.includes(need)) {
        this.museum_rewards.push(need);
        this.gold += gold;
        this.give(item, qty);
        await this.say(
          `Museum milestone: ${need} donations! The town fund awards ${gold}G and ${qty} × ${item}.`,
          'Curator'
        );
      }
    }
  }

  async museum_donate(): Promise<void> {
    const pool = new Set(this.museum_pool());
    const items = py_sorted(
      Object.keys(this.inv).filter((i) => pool.has(i) && !this.museum.includes(i) && (this.inv[i] || 0) > 0)
    );
    if (!items.length) {
      await this.say(
        this.museum.length >= this.museum_total()
          ? 'The collection is complete! Every fish, ore, forage item and crop is on display.'
          : 'Bring me a fish, ore, forage item or crop that is not already on display.',
        'Curator'
      );
      return;
    }
    const sel = await this.menu(
      `Donate to the Museum   ${this.museum.length}/${this.museum_total()}`,
      [...items.map((i) => `${i}  x${this.inv[i]}`), 'Leave']
    );
    if (sel === null || sel >= items.length) return;
    const item = items[sel];
    this.take(item, 1);
    this.museum.push(item);
    this.msg(`${item} added to the museum collection! (${this.museum.length}/${this.museum_total()})`, '0B');
    this.goals_tick();
    await this.museum_reward_check();
    await this.exhibit_check();
  }

  /** Exhibits whose three pieces are all on display but not yet set out. */
  exhibits_ready(): (typeof EXHIBITS)[number][] {
    return EXHIBITS.filter((e) => !this.exhibits_done.includes(e.id) && e.pieces.every((p) => this.museum.includes(p)));
  }

  /** After a donation: the curator sets out any exhibit that is now complete, with its note and a lead. */
  async exhibit_check(): Promise<void> {
    for (const e of this.exhibits_ready()) {
      this.exhibits_done.push(e.id);
      await this.say(`A new exhibit: "${e.title}". ${e.note}`, 'Curator');
      await this.say(`Here's a lead for you: ${e.lead}`, 'Curator');
      this.keepsake(`exhibit:${e.id}`, 'Exhibit card', `The curator's card for "${e.title}", the exhibit your donations made.`);
      this.remember('Curator', `The curator set out "${e.title}" from your donations.`, `exhibit:${e.id}`);
    }
  }

  /** The museum book's Exhibits page: each story, its pieces, and the note once it is set out. */
  exhibit_page(): string[] {
    const page = ['  Exhibits — one region, told in an ore, a fish and a relic'];
    for (const e of EXHIBITS) {
      const done = this.exhibits_done.includes(e.id);
      page.push('', `  ${done ? '★' : '·'} ${e.title}`);
      page.push(`    ${e.pieces.map((p) => `${this.museum.includes(p) ? '[x]' : '[ ]'} ${p}`).join('  ')}`);
      if (done) page.push(...wrapLines([`Lead: ${e.lead}`], 60).map((l) => `    ${l}`));
    }
    return page;
  }

  async museum_book(): Promise<void> {
    const pages: string[][] = [this.exhibit_page()];
    for (const [label, category] of this.museum_categories()) {
      const all = this.museum_pool(category);
      const got = new Set(this.museum.filter((i) => all.includes(i)));
      let page = [`  ${label} — ${got.size}/${all.length} donated`];
      for (const item of all) {
        if (page.length >= 18) {
          pages.push(page);
          page = [`  ${label} (continued)`];
        }
        page.push(`    ${got.has(item) ? '[x]' : '[ ]'} ${item}`);
      }
      pages.push(page);
    }
    await this.show_pages('Museum Collection', pages);
  }

  /**
   * What villagers may ask for: only things that can be had before a request runs out. Crops that
   * are in season and already in the ground or the rucksack, forage growing somewhere today, and
   * fish that bite today with the rod in hand.
   */
  request_pool(): string[] {
    const growing = new Set(Object.values(this.crops).map((c) => c[0]));
    const crops = Object.keys(CROPS).filter(
      (c) => c !== 'Grass' && CROPS[c][0] === this.season_name && ITEMS[c] && (growing.has(c) || (this.inv[c] || 0) > 0),
    );
    const forage = FORAGE_MAPS.flatMap((m) => (this.maps[m] ? this.forage_pool(m) : [])).filter((i) => ITEMS[i]?.[2] === 'forage');
    const fish = this.fishing_guide()
      .filter((f) => f.chance >= REQUEST_MIN_CATCH)
      .map((f) => f.item);
    return py_sorted([...new Set([...crops, ...forage, ...fish])]);
  }

  /**
   * Older saves can hold requests for things nothing in the valley gives (a fish that never bit, or
   * forage out of season). Drop the ones that cannot be filled; the board refills in the morning.
   */
  prune_requests(): void {
    if (!Array.isArray(this.requests)) this.requests = [];
    this.requests = this.requests.filter((r) => (this.inv[r.item] || 0) >= r.qty || this.request_source(r.item) !== null);
  }

  /** Where a requested item comes from today, in a line for the board. Null if nothing in the valley gives it now. */
  request_source(item: string): string | null {
    const kind = ITEMS[item]?.[2];
    if (kind === 'fish') {
      const f = this.fishing_guide().find((g) => g.item === item);
      if (!f) return null;
      const inTen = Math.max(1, Math.round(f.chance * 10));
      return `Fish: ${f.where}, about ${inTen} in 10 catches.`;
    }
    if (kind === 'forage') {
      const maps = FORAGE_MAPS.filter((m) => this.maps[m] && this.forage_pool(m).includes(item));
      if (!maps.length) return null;
      return maps.length > 3 ? 'Forage: grows all over the valley this season.' : `Forage: ${maps.map((m) => this.maps[m].title).join(', ')}.`;
    }
    if (CROPS[item]) return CROPS[item][0] === this.season_name ? 'Crop: in season on your farm.' : null;
    return null;
  }

  request_refresh(count: number = 3): number {
    const rng = py_rng();
    const npcs = py_sorted(Object.keys(NPCS).filter((n) => n !== 'Curator'));
    const pool = this.request_pool();
    const guide = this.fishing_guide();
    let added = 0;
    while (this.requests.length < count && this.requests.length < 3) {
      const used = new Set(this.requests.map((r) => r.npc));
      const available = npcs.filter((n) => !used.has(n));
      const npc = rng.choice(available.length ? available : npcs);
      const item = rng.choice(pool);
      if (!npc || !item) break;
      const scarce = guide.some((f) => f.item === item && f.chance < REQUEST_SCARCE_CATCH);
      const qty = scarce ? 1 : rng.randint(1, 3);
      const price = Math.max(1, Number(ITEMS[item]?.[0]) || 40);
      this.requests.push({
        id: this.next_request_id++,
        npc,
        item,
        qty,
        reward: Math.max(100, price * qty * 2 + 50),
        deadline: this.absday() + 3,
      });
      added++;
    }
    return added;
  }

  // ---------------------------------------------------------------- orders for finished goods (mechanics task 32)
  order_template(): (typeof ORDERS)[number] | null {
    return this.order ? (ORDERS.find((o) => o.id === this.order!.id) ?? null) : null;
  }

  /** Can everything in this order be made now? (a Kitchen, and any Maker it names) */
  order_possible(t: (typeof ORDERS)[number]): boolean {
    if (t.needs.kitchen && !this.house_flags.includes('Kitchen')) return false;
    return (t.needs.makers || []).every((m) => this.makers.includes(m));
  }

  /** Post a new order when the board is ready for one and something can be made. Returns it, or null. */
  order_refresh(): VillagerOrder | null {
    if (this.order || this.absday() < this.order_next) return null;
    const open = ORDERS.filter((t) => this.order_possible(t));
    if (!open.length) return null;
    const fresh = open.filter((t) => t.id !== this.order_last);
    const t = py_rng().choice(fresh.length ? fresh : open);
    this.order = { id: t.id, delivered: t.pieces.map(() => 0), deadline: this.absday() + ORDER_DAYS };
    this.order_last = t.id;
    return this.order;
  }

  /** Per piece: handed over so far, what the rucksack holds toward it, and how many are still missing. */
  order_rows(): { label: string; qty: number; got: number; have: number; missing: number; where: string }[] {
    const t = this.order_template();
    if (!t || !this.order) return [];
    return t.pieces.map((p, i) => {
      const got = this.order!.delivered[i] || 0;
      const have = py_sum(p.any.map((it) => this.inv[it] || 0));
      return { label: p.label, qty: p.qty, got, have, missing: Math.max(0, p.qty - got - have), where: p.where };
    });
  }

  /** "Bread, Dried Herbs" — the pieces not yet handed over. */
  order_still_needed(): string[] {
    return this.order_rows()
      .filter((r) => r.got < r.qty)
      .map((r) => (r.qty - r.got > 1 ? `${r.qty - r.got} ${r.label}` : r.label));
  }

  /**
   * Hand over whatever the rucksack holds toward the order (lowest grade first). Pays out when the
   * bundle is complete. Returns the message, or null if there was nothing to give.
   */
  order_deliver(): string | null {
    const t = this.order_template();
    const o = this.order;
    if (!t || !o) return null;
    const given: string[] = [];
    t.pieces.forEach((p, i) => {
      let want = p.qty - o.delivered[i];
      const grades = [...p.any].sort((a, b) => (ITEMS[a]?.[0] || 0) - (ITEMS[b]?.[0] || 0));
      for (const it of grades) {
        if (want <= 0) break;
        const n = Math.min(want, this.inv[it] || 0);
        if (n <= 0) continue;
        this.take(it, n);
        o.delivered[i] += n;
        want -= n;
        given.push(`${n} ${it}`);
      }
    });
    if (!given.length) return null;
    const left = this.order_still_needed();
    if (left.length) {
      const line = `You handed ${t.npc} ${andList(given)}. Still needed: ${andList(left)}.`;
      this.msg(line, '0B');
      return line;
    }
    this.gold += t.reward;
    this.friend[t.npc] = clamp((this.friend[t.npc] || 0) + 8, 0, 100);
    this.requests_done += 1;
    this.order = null;
    this.order_next = this.absday() + ORDER_GAP;
    this.remember(t.npc, `You put together ${t.title} for ${t.npc}.`);
    this.fx_add('coin', this.px, this.py, 0.8);
    this.fx_add('text', this.px, this.py, 1.1, { text: `+${t.reward}G` });
    const line = `${t.npc} has ${t.title}! You earned ${t.reward}G and +8 friendship.`;
    this.msg(line, '0B');
    return line;
  }

  /** The order's page on the board: each piece, handed over or missing, and where it comes from. */
  async order_menu(): Promise<void> {
    const t = this.order_template();
    const o = this.order;
    if (!t || !o) return;
    const days = Math.max(0, o.deadline - this.absday());
    const rows = this.order_rows();
    const info = [
      `  ${t.npc} would like ${t.title}: ${t.reward}G (${days}d left).`,
      ...rows.map((r) => {
        if (r.got >= r.qty) return `  ✓ ${r.label} ${r.qty}/${r.qty}`;
        const status = r.missing ? `missing ${r.missing}` : 'in your rucksack';
        return `  · ${r.label} ${r.got}/${r.qty}, ${status} (${r.where})`;
      }),
    ];
    const ready = rows.some((r) => r.got < r.qty && r.have > 0);
    const opts = ready ? ['Hand over what you have', 'Leave'] : ['Leave'];
    const sel = await this.menu(`Order: ${t.title}`, opts, 0, info);
    if (!ready || sel !== 0) return;
    const line = this.order_deliver();
    if (line) await this.say(line, t.npc);
  }

  request_day(report: string[]): void {
    const today = this.absday();
    const expired = this.requests.filter((r) => r.deadline < today);
    this.requests = this.requests.filter((r) => r.deadline >= today);
    if (expired.length) {
      report.push(`${expired.length} request${expired.length === 1 ? '' : 's'} expired at the Market Cross board.`);
    }
    if (this.requests.length < 3) {
      const added = this.request_refresh(3);
      if (added) report.push(`${added} new request${added === 1 ? '' : 's'} appeared at the Market Cross board.`);
    }
    const t = this.order_template();
    if (t && this.order!.deadline < today) {
      report.push(`${t.npc}'s order for ${t.title} lapsed at the Market Cross board.`);
      this.order = null;
      this.order_next = today + ORDER_GAP;
    }
    const posted = this.order_refresh();
    if (posted) {
      const nt = this.order_template()!;
      report.push(`${nt.npc} posted an order at the Market Cross board: ${nt.title}.`);
    }
  }

  request_deliver(index: number): string | null {
    const request = this.requests[index];
    if (!request) return null;
    if ((this.inv[request.item] || 0) < request.qty) {
      return `You need ${request.qty} × ${request.item} for ${request.npc}.`;
    }
    this.take(request.item, request.qty);
    this.gold += request.reward;
    this.friend[request.npc] = clamp((this.friend[request.npc] || 0) + 5, 0, 100);
    this.requests_done += 1;
    this.fx_add('coin', this.px, this.py, 0.8);
    this.fx_add('text', this.px, this.py, 1.1, { text: `+${request.reward}G` });
    this.requests.splice(index, 1);
    this.remember(request.npc, `You brought ${request.npc} ${request.qty} × ${request.item} for the request board.`);
    return `${request.npc} got ${request.qty} × ${request.item}! You earned ${request.reward}G and +5 friendship.`;
  }

  // ---------------------------------------------------------------- Saturday stall (mechanics task 09)
  /** Market day: every Saturday that is not a festival. */
  stall_day(): boolean {
    return this.weekday === STALL_DAY && !this.fest_on();
  }

  /** shut (not today, or past noon), ready (can be stocked), open (trading) or done (packed up today). */
  stall_state(): 'shut' | 'ready' | 'open' | 'done' {
    if (this.stall) return 'open';
    if (!this.stall_day()) return 'shut';
    if (this.stall_last[0] === this.absday()) return 'done';
    return this.minutes < STALL_STOCK_BY * 60 ? 'ready' : 'shut';
  }

  // ---------------------------------------------------------------- market regulars (mechanics task 10)
  /** Absolute day of the next market Saturday: today on a Saturday. */
  market_next(): number {
    const d = this.absday();
    return d + ((STALL_DAY - (d % 7) + 7) % 7);
  }

  /** The regulars' lists for the market on absolute day `day` (the same all week). */
  market_wants(day: number = this.market_next()): MarketWants {
    const season = Math.floor((((day % 120) + 120) % 120) / 30);
    const keeps = PRESERVE_SEASONS.includes(season) ? PRESERVES : [];
    return marketWants(day, season, PANTRY_STAPLES, (i) => CROPS[i]?.[0] === SEASONS[season], MARKET_FLOWERS, MARKET_SHOPPERS.pantry.wants, keeps);
  }

  /** "Gideon wants Potato and Egg; Rosalind wants a Pinwheel Daisy." Null when that Saturday is a festival. */
  market_clue(day: number = this.market_next()): string | null {
    if (this.fest_on(day - this.absday())) return null;
    const w = this.market_wants(day);
    const parts = [`${MARKET_SHOPPERS.pantry.name} wants ${andList(w.pantry)}`];
    if (w.flower) parts.push(`${MARKET_SHOPPERS.flower.name} wants ${aOrAn(w.flower)} ${w.flower}`);
    return parts.join('; ') + '.';
  }

  /**
   * The line that tells a preserve apart (task 31): who wants it at the coming market, or when Gideon
   * starts asking for preserves. Null for anything that isn't a preserve.
   */
  preserve_note(item: string): string | null {
    if (!PRESERVES.includes(item)) return null;
    const who = this.market_clue() ? this.market_wanted_by(item) : null;
    if (who) return `Keeps for winter. ${who} wants ${item} at this Saturday's market.`;
    return `Keeps for winter. ${MARKET_SHOPPERS.pantry.name} buys preserves for the inn in Fall and Winter.`;
  }

  /** Which regular is after this good at the coming market, if any. */
  market_wanted_by(item: string, day: number = this.market_next()): string | null {
    const w = this.market_wants(day);
    if (w.pantry.includes(item)) return MARKET_SHOPPERS.pantry.name;
    if (w.flower === item) return MARKET_SHOPPERS.flower.name;
    return null;
  }

  /** A regular comes by at their hour and buys only from their list, or leaves without. */
  stall_regular(kind: 'pantry' | 'flower'): void {
    const st = this.stall;
    if (!st) return;
    const who = MARKET_SHOPPERS[kind];
    const w = this.market_wants(st.day);
    const list = kind === 'pantry' ? w.pantry : w.flower ? [w.flower] : [];
    if (!list.length) return; // no flowers in winter, so Rosalind stays home
    (st.callers ||= []).push(who.name);
    const buys = marketVisit(st.goods, list, (item) => ITEMS[item]?.[0] || 0, who.markup, who.each);
    if (!buys.length) {
      st.log.push(
        kind === 'pantry'
          ? `${who.name} came for ${andList(list)} for the inn, and left without.`
          : `${who.name} hoped for ${aOrAn(list[0])} ${list[0]}, and left without.`,
      );
      return;
    }
    let gold = 0;
    for (const b of buys) {
      st.goods[b.index].sold += b.qty;
      gold += b.gold;
    }
    st.gold += gold;
    this.friend[who.name] = clamp((this.friend[who.name] || 0) + 3, 0, 100);
    const got = andList(buys.map((b) => `${b.qty} ${st.goods[b.index].item}`));
    st.log.push(
      kind === 'pantry'
        ? `${who.name}: "Just what the inn's kitchen needs." Bought ${got}.`
        : `${who.name}: "You found one! I've been looking all season." Bought ${got}.`,
    );
    this.msg(`Market: ${who.name} bought ${got} (+${gold}G).`, '09');
    if (this.mapname === 'town') this.fx_add('coin', STALL_SPOT[0], STALL_SPOT[1], 0.8);
  }

  /** Goods in the rucksack that can go on the stall: produce and food with a shipping price. */
  stall_pool(): string[] {
    return py_sorted(Object.keys(this.inv).filter((i) => (this.inv[i] || 0) > 0 && ITEMS[i] && ITEMS[i][0] > 0 && STALL_CATEGORIES.includes(ITEMS[i][2])));
  }

  /** Put the chosen goods out (up to three kinds, five of each) and open for the day. */
  stall_open(picks: [string, number][]): boolean {
    if (this.stall_state() !== 'ready') return false;
    const goods: StallGood[] = [];
    const pool = this.stall_pool();
    for (const [item, n] of picks) {
      if (goods.length >= STALL_SLOTS || !pool.includes(item) || goods.some((g) => g.item === item)) continue;
      const qty = Math.min(n, STALL_SLOT_MAX, this.inv[item] || 0);
      if (qty <= 0) continue;
      this.take(item, qty);
      goods.push({ item, qty, sold: 0 });
    }
    if (!goods.length) return false;
    this.stall = { day: this.absday(), goods, gold: 0, log: [], seen: [] };
    this.msg(`Your stall is open with ${goods.length} good${goods.length > 1 ? 's' : ''}. Shoppers come by on the hour until ${fmt_hour(STALL_CLOSE)}.`, '0B');
    return true;
  }

  /** One villager stops at the stall (each comes by once a market; a wet square is a quiet one). */
  stall_shopper(): void {
    const st = this.stall;
    if (!st) return;
    const rng = py_rng();
    if (this.weather !== 'Sunny' && rng.random() < 0.5) return;
    const crowd = py_sorted(Object.keys(NPCS).filter((n) => NPCS[n].out && NPCS[n].where?.[0] !== 'mountain' && n !== this.married && !st.seen.includes(n)));
    if (!crowd.length) return;
    const who: string = rng.choice(crowd);
    st.seen.push(who);
    const visit = stallVisit(st.goods, NPCS[who], (item) => ITEMS[item]?.[0] || 0, STALL_MARKUP, rng.random());
    if (visit.kind === 'pass') {
      if (visit.reason !== 'empty') st.log.push(visit.reason === 'hate' ? `${who} looked your goods over and walked on.` : `${who} browsed a while, then kept walking.`);
      return;
    }
    const good = st.goods[visit.index];
    good.sold += visit.qty;
    st.gold += visit.gold;
    if (visit.pref === 'love') this.friend[who] = clamp((this.friend[who] || 0) + 2, 0, 100);
    st.log.push(
      visit.pref === 'love'
        ? `${who}: "${good.item}! My favourite. I'll take ${visit.qty === 2 ? 'two' : 'it'}."`
        : visit.pref === 'like'
          ? `${who}: "That ${good.item} looks good. One, please."`
          : `${who}: "I'll take a ${good.item}."`,
    );
    this.msg(`Market: ${who} bought ${visit.qty} ${good.item} (+${visit.gold}G).`, '09');
    if (this.mapname === 'town') this.fx_add('coin', STALL_SPOT[0], STALL_SPOT[1], 0.8);
  }

  /** Shoppers come by on the hour while the stall is open; at closing time it pays out and reports. */
  async stall_tick(before: number): Promise<void> {
    for (let h = Math.floor(before / 60) + 1; h <= Math.floor(this.minutes / 60) && this.stall; h++) {
      if (h >= STALL_CLOSE) {
        await this.show_lines('Saturday Stall — Closing Time', this.stall_close());
        return;
      }
      this.stall_shopper();
      if (h === MARKET_SHOPPERS.pantry.hour) this.stall_regular('pantry');
      if (h === MARKET_SHOPPERS.flower.hour) this.stall_regular('flower');
    }
  }

  /** Close the stall: bank the takings, take unsold goods back, and return the closing report. */
  stall_close(): string[] {
    const st = this.stall;
    if (!st) return [];
    const lines: string[] = [];
    let sold = 0;
    let unsold = 0;
    for (const g of st.goods) {
      sold += g.sold;
      unsold += g.qty - g.sold;
      lines.push(`  ${g.item}: sold ${g.sold} of ${g.qty}`);
      if (g.qty > g.sold) this.give(g.item, g.qty - g.sold);
    }
    this.gold += st.gold;
    this.stall_earned += st.gold;
    this.stall_last = [st.day, st.gold];
    this.stall = null;
    lines.push('', `  Takings: ${st.gold}G`);
    if (st.log.length) lines.push('', ...st.log.slice(-6).map((l) => `  ${l}`));
    if (unsold) lines.push('', '  Unsold goods are back in your rucksack.');
    this.msg(`Market closed: ${sold} sold, +${st.gold}G.`, '09');
    return lines;
  }

  async stall_menu(): Promise<void> {
    const state = this.stall_state();
    if (state === 'open') {
      const st = this.stall!;
      await this.show_lines('Your Stall', [
        ...st.goods.map((g) => `  ${g.item}: sold ${g.sold} of ${g.qty}`),
        '',
        `  Takings so far: ${st.gold}G. Closing at ${fmt_hour(STALL_CLOSE)}.`,
        ...(st.log.length ? ['', ...st.log.slice(-5).map((l) => `  ${l}`)] : []),
      ]);
      if (await this.confirm('Pack up the stall now?')) await this.show_lines('Saturday Stall — Closing Time', this.stall_close());
      return;
    }
    if (state === 'done') {
      await this.say(`You have packed up for today, with ${this.stall_last[1]}G in takings. See you next Saturday.`, 'Market Stall');
      return;
    }
    if (state === 'shut') {
      const why = this.weekday !== STALL_DAY ? '' : this.fest_on() ? ' No market today: it is a festival.' : ' It is past noon: too late to set up today.';
      const clue = this.weekday !== STALL_DAY ? this.market_clue() : null;
      await this.say(STALL_SIGN + why + (clue ? `\nThis Saturday: ${clue}` : ''), 'Market Stall');
      return;
    }
    if (!this.stall_pool().length) {
      await this.say('Market day! You have nothing to put out, though. Bring crops, forage, fish, animal goods or cooked food before noon.', 'Market Stall');
      return;
    }
    const picks: [string, number][] = [];
    while (true) {
      const pool = this.stall_pool().filter((i) => !picks.some(([p]) => p === i));
      const opts = [
        ...picks.map(([i, n]) => `Take back: ${i} x${n}`),
        ...(picks.length < STALL_SLOTS && pool.length ? ['Put out a good...'] : []),
        ...(picks.length ? ['Open the stall'] : []),
        'Leave it for now',
      ];
      const clue = this.market_clue();
      const sel = await this.menu(`Your Stall: ${picks.length}/${STALL_SLOTS} goods`, opts, Math.min(picks.length, opts.length - 1), [
        'Shoppers pay a little over the shipping price,',
        `more for things they love. Up to ${STALL_SLOT_MAX} of each.`,
        ...(clue ? ['', `Regulars: ${clue}`] : []),
      ]);
      if (sel === null || opts[sel] === 'Leave it for now') return;
      if (opts[sel] === 'Open the stall') {
        this.stall_open(picks);
        return;
      }
      if (sel < picks.length) {
        picks.splice(sel, 1);
        continue;
      }
      const isel = await this.menu(
        'Put out which good?',
        pool.map((i) => {
          const fan = this.market_wanted_by(i);
          return `${i} x${this.inv[i]}  (ships for ${ITEMS[i][0]}G)${fan ? `  ${fan} wants this` : ''}`;
        }),
      );
      if (isel === null) continue;
      const item = pool[isel];
      const max = Math.min(STALL_SLOT_MAX, this.inv[item]);
      const qsel = max > 1 ? await this.menu(`How many ${item}?`, Array.from({ length: max }, (_, k) => String(k + 1)), max - 1) : 0;
      if (qsel === null) continue;
      picks.push([item, qsel + 1]);
    }
  }

  async request_menu(): Promise<void> {
    if (!this.requests.length) this.request_refresh(3);
    this.order_refresh();
    const ot = this.order_template();
    if (!this.requests.length && !ot) {
      await this.say('The request board is empty today. Check again tomorrow morning.', 'Market Cross');
      return;
    }
    const orderLabel = ot
      ? [`★ ${ot.npc}'s order: ${ot.title} — ${ot.reward}G (${Math.max(0, this.order!.deadline - this.absday())}d left)`]
      : [];
    const labels = [
      ...orderLabel,
      ...this.requests.map((r) => {
        const days = Math.max(0, r.deadline - this.absday());
        return `${r.npc}: ${r.qty} × ${r.item} — ${r.reward}G (${days}d left)`;
      }),
    ];
    const off = orderLabel.length;
    const info = (s: number): string[] => {
      if (off && s === 0) {
        const left = this.order_still_needed();
        return [`A bundle of finished goods. Still needed: ${andList(left)}.`, 'Hand pieces over as you make them; paid when it is complete.'];
      }
      const r = this.requests[s - off];
      if (!r) return ['', ''];
      const have = this.inv[r.item] || 0;
      return [
        have >= r.qty ? `You have ${have}. Hand ${r.qty} over?` : `You have ${have} of ${r.qty}.`,
        this.request_source(r.item) ?? 'Not to be found in the valley today.',
      ];
    };
    const sel = await this.menu('Market Cross Request Board', [...labels, 'Leave'], 0, info);
    if (sel === null || sel >= labels.length) return;
    if (off && sel === 0) {
      await this.order_menu();
      return;
    }
    const request = this.requests[sel - off];
    const result = this.request_deliver(sel - off);
    if (result === null) return;
    if (result.startsWith('You need')) {
      await this.say(result, 'Market Cross');
      return;
    }
    await this.say(result, request.npc);
  }

  achievement_list(): { name: string; desc: string; done: boolean; progress: string }[] {
    const fish = py_sum(Object.values(this.fish_caught));
    const maxFriend = Math.max(0, ...Object.values(this.friend));
    const gems = this.goddess_jewels + this.kappa_jewels + this.truth_jewels;
    return [
      { name: 'First Shipment', desc: 'Ship your first item to Otto', done: this.shipped_total > 0, progress: `${this.shipped_total}G shipped` },
      { name: 'Market Regular', desc: 'Ship 10,000G worth of goods', done: this.shipped_total >= 10000, progress: `${Math.min(10000, this.shipped_total)}/10000G` },
      { name: 'Angler', desc: 'Catch 10 fish', done: fish >= 10, progress: `${Math.min(10, fish)}/10 fish` },
      { name: 'Mine Explorer', desc: 'Reach floor 25 of the Copperseam Mine', done: this.max_spring_floor >= 25, progress: `floor ${Math.min(25, this.max_spring_floor)}/25` },
      { name: 'Deep Earth', desc: 'Reach floor 100 of the Copperseam Mine', done: this.max_spring_floor >= 100, progress: `floor ${Math.min(100, this.max_spring_floor)}/100` },
      { name: 'Museum Patron', desc: 'Donate 10 items to the museum', done: this.museum.length >= 10, progress: `${Math.min(10, this.museum.length)}/10 donated` },
      { name: 'Complete Collection', desc: 'Complete the museum collection', done: this.museum.length >= this.museum_total(), progress: `${this.museum.length}/${this.museum_total()} donated` },
      { name: 'Good Neighbor', desc: 'Complete 5 Market Cross requests', done: this.requests_done >= 5, progress: `${Math.min(5, this.requests_done)}/5 requests` },
      { name: 'Beloved', desc: 'Reach 80 friendship with a villager', done: maxFriend >= 80, progress: `${maxFriend}/80 hearts` },
      { name: 'Festival Star', desc: 'Win 3 festivals', done: this.fest_wins.length >= 3, progress: `${Math.min(3, this.fest_wins.length)}/3 wins` },
      { name: 'Homestead', desc: 'Complete 3 house or farm upgrades', done: this.house_flags.length >= 3, progress: `${Math.min(3, this.house_flags.length)}/3 upgrades` },
      { name: 'Family', desc: 'Marry and welcome a child', done: !!this.married && !!this.child_name, progress: this.child_name ? 'family complete' : this.married ? 'married' : 'not yet' },
      { name: 'Rancher', desc: 'Own 8 animals', done: this.animals.length >= 8, progress: `${Math.min(8, this.animals.length)}/8 animals` },
      { name: 'Gem Hunter', desc: 'Collect 9 gems across the mines', done: gems >= 9, progress: `${Math.min(9, gems)}/9 gems` },
    ];
  }

  async achievements_page(): Promise<void> {
    const list = this.achievement_list();
    const done = list.filter((a) => a.done).length;
    this.ach_unread = false;
    const pages: string[][] = [];
    let page = [`  ${done}/${list.length} unlocked`];
    for (const a of list) {
      if (page.length >= 18) {
        pages.push(page);
        page = ['  Achievements (continued)'];
      }
      page.push(`  ${a.done ? '[x]' : '[ ]'} ${a.name} — ${a.desc}  (${a.progress})`);
    }
    pages.push(page);
    await this.show_pages('Achievements & Journal', pages);
  }

  mastery_level(discipline: MasteryDiscipline): number {
    const xp = this.mastery_xp[discipline] || 0;
    let level = 0;
    for (let i = 0; i < MASTERY_RANKS.length; i++) {
      if (xp >= MASTERY_RANKS[i].xp) level = i;
    }
    return level;
  }

  mastery_add(discipline: MasteryDiscipline, amount: number = 1): void {
    if (!MASTERY_DISCIPLINES.includes(discipline)) return;
    const before = this.mastery_level(discipline);
    this.mastery_xp[discipline] = (this.mastery_xp[discipline] || 0) + amount;
    const after = this.mastery_level(discipline);
    for (let level = before + 1; level <= after; level++) {
      const key = `${discipline}:${level}`;
      if (this.mastery_claimed.includes(key)) continue;
      this.mastery_claimed.push(key);
      this.mastery_reward(discipline, level);
    }
  }

  mastery_reward(discipline: MasteryDiscipline, level: number): void {
    const gold = [0, 250, 500, 1000, 2000][level] || 0;
    const item = MASTERY_REWARD_ITEMS[discipline];
    const qty = level >= 3 ? 2 : 1;
    this.gold += gold;
    this.give(item, qty);
    this.msg(
      `Mastery: ${MASTERY_LABELS[discipline]} reached ${MASTERY_RANKS[level].name}! +${gold}G and ${qty} × ${item}.`,
      '0C'
    );
  }

  async mastery_page(): Promise<void> {
    while (true) {
      const opts = [
        ...MASTERY_DISCIPLINES.map((discipline) => {
          const level = this.mastery_level(discipline);
          const xp = this.mastery_xp[discipline] || 0;
          const next = MASTERY_RANKS[level + 1];
          const progress = next ? `${Math.min(xp, next.xp)}/${next.xp} XP` : `${xp} XP (max)`;
          const p1 = MASTERY_PERKS.find((p) => p.id === this.mastery_perks[discipline]);
          const p2 = MASTERY_PERKS.find((p) => p.id === this.mastery_perks[`${discipline}_2`]);
          const badge = [p1?.name, p2?.name].filter(Boolean).join(' + ');
          const needPick = (level >= 1 && !p1) || (level >= 2 && !p2);
          return `${MASTERY_LABELS[discipline].padEnd(9)} ${MASTERY_RANKS[level].name.padEnd(7)} ${progress}${badge ? ` · [${badge}]` : ''}${needPick ? ' · [Pick Perk!]' : ''}`;
        }),
        'Back',
      ];
      const sel = await this.menu(
        '★ Farm Mastery & Perks',
        opts,
        0,
        (i) => {
          if (i >= MASTERY_DISCIPLINES.length) return ['  Reach Adept (Rank 1) & Expert (Rank 2) in any discipline to choose permanent perks.'];
          const d = MASTERY_DISCIPLINES[i];
          const level = this.mastery_level(d);
          const p1 = MASTERY_PERKS.find((p) => p.id === this.mastery_perks[d]);
          const p2 = MASTERY_PERKS.find((p) => p.id === this.mastery_perks[`${d}_2`]);
          return [
            p1 ? `  Adept Perk: ${p1.name} — ${p1.desc}` : level >= 1 ? '  Adept Perk unlocked! Press Enter to choose.' : '  Reach Adept (Rank 1) to unlock Tier 1 perks.',
            p2 ? `  Expert Perk: ${p2.name} — ${p2.desc}` : level >= 2 ? '  Expert Perk unlocked! Press Enter to activate.' : '  Reach Expert (Rank 2) to unlock Tier 2 perks.',
          ];
        },
      );
      if (sel === null || sel >= MASTERY_DISCIPLINES.length) return;
      const disc = MASTERY_DISCIPLINES[sel];
      const lvl = this.mastery_level(disc);
      if (lvl < 1) {
        await this.say(`Reach Adept rank in ${MASTERY_LABELS[disc]} first to choose a mastery perk.`, 'Farm Mastery');
        continue;
      }
      const choices = perksForDiscipline(disc).filter((p) => p.rank <= lvl);
      const pSel = await this.menu(
        `Choose ${MASTERY_LABELS[disc]} Perk (Tier 1 & Tier 2)`,
        [...choices.map((p) => {
          const slot = p.rank === 2 ? `${disc}_2` : disc;
          return `${this.mastery_perks[slot] === p.id ? '● ' : '○ '}[T${p.rank}] ${p.name} — ${p.desc}`;
        }), 'Cancel'],
      );
      if (pSel !== null && pSel < choices.length) {
        const picked = choices[pSel];
        const slot = picked.rank === 2 ? `${disc}_2` : disc;
        this.mastery_perks[slot] = picked.id;
        this.msg(`${MASTERY_LABELS[disc]} Tier ${picked.rank} perk active: ${picked.name}!`, '0B');
      }
    }
  }

  async ranch_summary(): Promise<void> {
    const degPts =
      this.shipped_total / 100 +
      this.power_berries * 100 +
      Object.values(this.friend).reduce((a, b) => a + b, 0) +
      this.fest_wins.length * 150 +
      this.steps / 10;
    const rankTitle =
      degPts >= 5000
        ? 'Supreme Farm King'
        : degPts >= 2000
          ? 'Veteran Ranch Master'
          : degPts >= 800
            ? 'Skilled Brackenford Farmer'
            : 'Apprentice Farmer';

    const toolLines = UPGRADABLE.map(
      (t) => `  ${t.padEnd(13)}: ${LEVELS[this.levels[t] || 0].padEnd(9)} (Exp: ${this.tool_exp[t] || 0}%)`
    );
    const spriteLines = SPRITES.map((s) => {
      const j = this.sprite_jobs[s.name] || { task: 'none', days: 0, skill: 10 };
      return `  ${s.name.padEnd(7)} (${s.colorName.padEnd(6)}): ${this.sprite_aff[s.name] || 0}/100 Aff | Skill ${j.skill}% | ${j.days ? `${j.task} (${j.days}d)` : 'Idle'}`;
    });
    const bestFriends = py_sorted(
      Object.entries(this.friend).map(([n, v]): [number, string] => [-v, n])
    )
      .slice(0, 6)
      .map(([, n]) => `  ${n.padEnd(16)} ${this.hearts(n)[0]}`);

    const lines = [
      `  Rank: ${rankTitle} (${Math.floor(degPts)} pts)   Steps: ${this.steps}`,
      `  Strength: ${this.stamina}/${this.max_stamina}   Fatigue: ${this.fatigue}/100   Heartseeds: ${this.power_berries}/10 ${this.has_mystic_berry ? '+ Mystic Berry' : ''}`,
      `  Gold: ${this.gold}G   Total Shipped: ${this.shipped_total}G   Medals: ${this.medals}`,
      `  Jewels — Wellkeeper: ${this.goddess_jewels}/9 | Reed Heron: ${this.kappa_jewels}/9 | Truth: ${this.truth_jewels}/9`,
      `  Mines — Spring B${this.max_spring_floor}F | Lake B${this.max_lake_floor}F | Fish Caught: ${Object.keys(this.fish_caught).length} types`,
      `  Spouse: ${this.married || 'Unmarried'}   Child: ${this.child_name || '-'}   Heart Events: ${this.heart_events_seen.length}`,
      '  --- Tools ---',
      ...toolLines,
      '  --- Hearthfolk ---',
      ...spriteLines,
      '  --- Top Relationships ---',
      ...bestFriends,
    ];
    await this.show_lines('Ranch Summary & Completion Memo', lines);
  }

  fest_date(offset: number = 0): [number, number] {
    const n = this.day - 1 + offset;
    return [(this.season + Math.floor(n / 30)) % 4, (n % 30) + 1];
  }

  fest_on(offset: number = 0): [string, number, number, string] | null {
    const [s, d] = this.fest_date(offset);
    return FESTIVALS[`${s},${d}`] || null;
  }

  fest_active(): [string, number, number, string] | null {
    const f = this.fest_on();
    return f && f[1] * 60 <= this.minutes && this.minutes < f[2] * 60 ? f : null;
  }

  birthdays(offset: number = 0): string[] {
    const when = this.fest_date(offset);
    return Object.entries(BIRTHDAYS)
      .filter(([, d]) => d[0] === when[0] && d[1] === when[1])
      .map(([n]) => n);
  }

  fest_sync(): void {
    const f = this.fest_active();
    const saved = this._fest_saved;
    if (f && saved === null) {
      this._fest_saved = { ...NPC_HOME };
      const names = Object.keys(NPCS);
      for (let i = 0; i < names.length; i++) {
        const n = names[i];
        const [x, y] = FEST_SPOTS[i % FEST_SPOTS.length];
        NPCS[n].where = ['town', x, y];
      }
      this.npc_pos = {};
      if (!this.fest_attended) {
        this.msg(`The ${f[0]} has begun in Market Cross!`, '0A');
      }
    } else if (!f && (saved !== null || Object.entries(NPC_HOME).some(([n, w]) => NPCS[n]?.where !== w))) {
      // NPCS is module-level: a festival synced by another Game must not leak into this one.
      for (const [n, w] of Object.entries(NPC_HOME)) NPCS[n].where = w;
      this._fest_saved = null;
      this.npc_pos = {};
    }
  }

  fest_is_out(n: string): boolean | null {
    if (n === this.married || !this.fest_active()) {
      return null;
    }
    return true;
  }

  async fest_check(): Promise<void> {
    const f = this.fest_active();
    if (!f || this.mapname !== 'town' || this.fest_attended || this.fest_declined) {
      return;
    }
    if (!(29 <= this.px && this.px <= 43 && 8 <= this.py && this.py <= 19)) {
      return;
    }
    if (await this.confirm(`The ${f[0]} is underway! Join in?`)) {
      await this.fest_run(f);
    } else {
      this.fest_declined = true;
      this.msg("Talk to Mayor Ambrose when you're ready to join in.");
    }
  }

  async fest_talk(n: string): Promise<boolean> {
    const f = this.fest_active();
    if (n !== 'Ambrose' || !f || this.held || this.fest_attended) {
      return false;
    }
    if (await this.confirm(`Join the ${f[0]}?`)) {
      await this.fest_run(f);
      return true;
    }
    return false;
  }

  async fest_run(f: [string, number, number, string]): Promise<void> {
    const [name, , end, kind] = f;
    this.fest_attended = true;
    playSfx('fanfare');
    this.keepsake('first_festival', `${name} program`, `The printed program from the ${name}: your first festival in the valley.`);
    const variant = festivalVariant(kind, this.year);
    await this.say(`Welcome, everyone, to the ${name}! (${variant.theme}) ${variant.intro}`, 'Ambrose');
    // Task 13: Pick a festival role (join main event / cook for the table / help set up the square)
    const rolePick = await this.menu(
      `${name} — Choose your role`,
      ['Join the main event / competition', 'Cook for the festival table', 'Help set up Market Cross'],
      0,
      ['  Every festival lets you compete, cook with Gideon & Tess, or decorate with Ingrid & Ambrose.'],
    );
    const roleKey = rolePick === 1 ? 'cook' : rolePick === 2 ? 'setup' : 'compete';
    this.fest_roles_done[`${this.year}:${kind}`] = roleKey;
    if (roleKey === 'cook' || roleKey === 'setup') {
      const donated = roleKey === 'cook' ? Object.keys(this.inv).find((i) => ['crop', 'dish', 'forage'].includes(ITEMS[i]?.[2])) ?? null : null;
      if (donated) this.take(donated, 1);
      const out = festivalRoleOutcome(name, roleKey, donated);
      for (const [who, line] of out.lines) await this.say(line, who);
      this.gold += out.gold;
      for (const fr of out.friends) {
        if (fr in NPCS) this.friend[fr] = clamp((this.friend[fr] || 0) + out.friendPts, 0, 100);
      }
      if (out.keepsake) this.keepsake(out.keepsake.key, out.keepsake.name, out.keepsake.text);
      this.remember(out.friends[0], `Helped as ${out.title} at the ${name}.`, `festrole:${this.year}:${kind}`);
      this.msg(`${out.title}: +${out.gold}G and +${out.friendPts} friendship with ${out.friends.join(', ')}.`, '0B');
    } else {
      const fn = (this as any)[`fest_ev_${kind}`];
      if (typeof fn === 'function') {
        await fn.call(this);
      }
    }
    this.minutes = Math.max(this.minutes, end * 60);
    await this.say(`The ${name} draws to a close, and everyone heads home.`, null);
    this.update_npcs();
    this.last = Date.now() / 1000;
  }

  fest_new_day(report: string[]): void {
    this.fest_attended = false;
    this.fest_declined = false;
    const f = this.fest_on();
    if (f) {
      report.push(`Today is the ${f[0]}! Head to Market Cross between ${fmt_hour(f[1])} and ${fmt_hour(f[2])}.`);
    }
    const t = this.fest_on(1);
    if (t) {
      report.push(`Tomorrow is the ${t[0]}.`);
    }
    for (const n of this.birthdays()) {
      report.push(`It's ${n}'s birthday today! A gift gives 5x Friendship!`);
    }
  }

  async fest_closed(bid: string): Promise<boolean> {
    const f = this.fest_on();
    if (!f || bid === 'church' || bid === 'sprites' || bid === 'cottage') {
      return false;
    }
    await this.say(`A sign on the door: 'Closed today for the ${f[0]}. See you in Market Cross!'`, null);
    return true;
  }

  fest_news(): string {
    const parts: string[] = [];
    const f = this.fest_on();
    if (f) {
      parts.push(`Today: ${f[0]} in Market Cross, ${fmt_hour(f[1])}-${fmt_hour(f[2])}.`);
    }
    const t = this.fest_on(1);
    if (t) {
      parts.push(`Tomorrow: ${t[0]}.`);
    }
    for (const n of this.birthdays()) {
      parts.push(`Happy birthday to ${n}!`);
    }
    for (const n of this.birthdays(1)) {
      parts.push(`Tomorrow is ${n}'s birthday.`);
    }
    return parts.length ? '  ' + parts.join(' ') : '';
  }

  // ---------------------------------------------------------------- calendar reminders (mechanics task 51)
  /** 'today', 'tomorrow', 'in 3d' for an absolute day. */
  day_from_now(day: number): string {
    const off = day - this.absday();
    return off <= 0 ? 'today' : off === 1 ? 'tomorrow' : `in ${off}d`;
  }

  /**
   * What can be pinned: festivals and birthdays in the next 30 days, the next Saturday market, and
   * the day each crop on the farm is first ready (if it is watered every day and beats the season).
   */
  reminder_options(): CalendarReminder[] {
    const today = this.absday();
    const out: CalendarReminder[] = [];
    for (let off = 0; off < 30; off++) {
      const [ss, dd] = this.fest_date(off);
      const f = FESTIVALS[`${ss},${dd}`];
      if (f) out.push({ day: today + off, text: f[0] });
      for (const n of this.birthdays(off)) out.push({ day: today + off, text: `${n}'s birthday` });
    }
    let market = this.market_next();
    if (market === today && this.stall_state() !== 'ready' && this.stall_state() !== 'open') market += 7;
    if (!this.fest_on(market - today)) out.push({ day: market, text: 'Saturday market' });
    const ready: Record<string, { day: number; n: number }> = {};
    for (const [crop, age] of Object.values(this.crops)) {
      if (crop === 'Grass') continue;
      const left = CROPS[crop][2] - age;
      if (left <= 0 || this.day + left > 30) continue;
      const day = today + left;
      const r = (ready[crop] ||= { day, n: 0 });
      r.day = Math.min(r.day, day);
      r.n += 1;
    }
    for (const [crop, r] of Object.entries(ready)) out.push({ day: r.day, text: `${crop} ready (${r.n} tile${r.n === 1 ? '' : 's'})` });
    out.sort((a, b) => a.day - b.day || a.text.localeCompare(b.text));
    return out.filter((o) => !this.reminders.some((r) => r.day === o.day && r.text === o.text));
  }

  /** Pin a day; false if the calendar is full or it is already pinned. */
  reminder_add(r: CalendarReminder): boolean {
    if (this.reminders.length >= REMINDER_MAX) return false;
    if (this.reminders.some((x) => x.day === r.day && x.text === r.text)) return false;
    this.reminders.push({ day: r.day, text: r.text });
    this.reminders.sort((a, b) => a.day - b.day);
    return true;
  }

  /** The morning: say what is pinned for today, then drop days that have passed. */
  reminder_day(report: string[]): void {
    const today = this.absday();
    for (const r of this.reminders) if (r.day === today) report.push(`Reminder: ${r.text} today.`);
    this.reminders = this.reminders.filter((r) => r.day >= today);
  }

  /** The calendar on the wall: the date, what's coming up, and the days you pinned. */
  async calendar_menu(): Promise<void> {
    if (this.mapname === 'in_cottage' && !this.berry_sources.includes('truth:cottage_cal')) {
      await this.say('Tucked behind your Town Cottage wall calendar is a hidden Jewel of Truth!', 'Town Cottage');
      this.give_truth_jewel('cottage_cal');
    }
    while (true) {
      const left = 30 - this.day;
      const nxt = SEASONS[(this.season + 1) % 4];
      const info = [
        `  Today is ${this.date_str()}. ${left} day${left !== 1 ? 's' : ''} until ${nxt}.`,
        ...(this.reminders.length
          ? this.reminders.map((r) => `  ★ ${absdayLabel(r.day, false)} (${this.day_from_now(r.day)}): ${r.text}`)
          : ['  Nothing pinned yet. Pinned days show in Today\'s Plan.']),
      ];
      const opts = [
        'Upcoming events & birthdays',
        `Pin a reminder (${this.reminders.length}/${REMINDER_MAX})`,
        ...(this.reminders.length ? ['Unpin a reminder'] : []),
        'Leave',
      ];
      const sel = await this.menu('Calendar', opts, 0, info);
      if (sel === null || opts[sel] === 'Leave') return;
      const choice = opts[sel];
      if (choice.startsWith('Upcoming')) {
        await this.fest_calendar();
      } else if (choice.startsWith('Pin')) {
        if (this.reminders.length >= REMINDER_MAX) {
          await this.say(`The calendar holds ${REMINDER_MAX} reminders. Unpin one first.`, 'Calendar');
          continue;
        }
        const pool = this.reminder_options().slice(0, 12);
        if (!pool.length) {
          await this.say('Nothing coming up to pin right now.', 'Calendar');
          continue;
        }
        const pick = await this.menu(
          'Pin which day?',
          pool.map((r) => `${absdayLabel(r.day, false)} (${this.day_from_now(r.day)}): ${r.text}`),
        );
        if (pick !== null && this.reminder_add(pool[pick])) {
          this.msg(`Pinned: ${pool[pick].text}, ${absdayLabel(pool[pick].day, false)}.`, '0C');
        }
      } else if (choice.startsWith('Unpin')) {
        const pick = await this.menu(
          'Unpin which day?',
          this.reminders.map((r) => `${absdayLabel(r.day, false)}: ${r.text}`),
        );
        if (pick !== null) {
          const [gone] = this.reminders.splice(pick, 1);
          this.msg(`Unpinned: ${gone.text}.`, '0C');
        }
      }
    }
  }

  async fest_calendar(): Promise<void> {
    const lines: string[] = [];
    for (let off = 0; off < 31; off++) {
      const [s, d] = this.fest_date(off);
      const when = off === 0 ? 'today' : off === 1 ? 'tomorrow' : `in ${off}d`;
      const f = FESTIVALS[`${s},${d}`];
      if (f) {
        lines.push(` ${SEASONS[s]} ${d}  ${when}  ${f[0]}`);
      }
      for (const n of this.birthdays(off)) {
        lines.push(` ${SEASONS[s]} ${d}  ${when}  ${n}'s birthday`);
      }
    }
    await this.show_lines('Upcoming Events & Birthdays', lines.slice(0, 14));
  }

  fest_bachs(): string[] {
    return Object.entries(NPCS)
      .filter(([, d]) => d.bach)
      .map(([n]) => n);
  }

  fest_bond(n: string, pts: number): void {
    this.friend[n] = clamp((this.friend[n] || 0) + pts, 0, 100);
  }

  async fest_pick(title: string, names: string[]): Promise<string | null> {
    const opts = [...names.map((n) => `${n} ${this.hearts(n)[0]}`), 'No one'];
    const sel = await this.menu(title, opts);
    return sel !== null && sel < names.length ? names[sel] : null;
  }

  fest_win(name: string): void {
    this.keepsake(`ribbon:${name}:${this.year}`, `${name} ribbon`, `A blue ribbon from the ${name}. You won it, Year ${this.year}.`);
    if (!this.fest_wins.includes(name)) {
      this.fest_wins.push(name);
    }
  }

  async fest_ev_newyear(): Promise<void> {
    await this.say("Let's welcome the new year together! Gideon made rice cakes (mochi) for everyone!", 'Ambrose');
    this.stamina = this.max_stamina;
    this.fatigue = 0;
    this.give('Rice', 3);
    for (const n of Object.keys(NPCS)) {
      this.fest_bond(n, 3);
    }
    await this.say('You share rice cakes and good wishes with the whole town. (+3 Rice, Stamina restored!)', null);
  }

  async fest_ev_goddess(): Promise<void> {
    await this.say('Every spring the young women of town dance to thank the Wellkeeper.', 'Ambrose');
    const n = await this.fest_pick('Who do you dance with / cheer for?', this.fest_bachs());
    if (n) {
      this.fest_bond(n, 8);
      await this.say(`You share the Spring Wellkeeper Dance with ${n}!`, null);
    }
    this.give('Strawberry Seeds');
    await this.say("A warm breeze carries the Wellkeeper's blessing. You receive Strawberry Seeds!", null);
  }

  async fest_ev_spring_thanks(): Promise<void> {
    await this.say('Spring Thanksgiving! Give homemade Cookies or Chocolate to someone special!', 'Ambrose');
    const n = await this.fest_pick('Give a Thanksgiving treat to...', this.fest_bachs());
    if (n) {
      this.fest_bond(n, 10);
      await this.say(`Thank you so much! These are delicious! (+10 Friendship with ${n})`, n);
    }
  }

  async fest_ev_horserace(): Promise<void> {
    await this.say('Welcome to the Brackenford Horse Races! Bet on horses for Medals or race your own steed!', 'Ambrose');
    const sel = await this.menu('Horse Race Options', [
      'Race Your Own Horse (Win a Heartseed + 200 Medals!)',
      'Bet 100G on Favorite (Win 150 Medals)',
      'Bet 500G on Longshot (Win 600 Medals)',
    ]);
    if (sel === 0) {
      const rival = py_rng().randint(14, 24);
      const score = await this.fest_mash(4.5, rival, 'Brackenford Derby');
      if (score >= rival) {
        this.medals += 200;
        this.fest_win('Horse Race');
        this.give_power_berry('horse_race');
        await this.say(`Your horse thunders across the finish line in 1st place! (+200 Medals & Heartseed!)`, 'Ambrose');
      } else {
        this.medals += 30;
        await this.say(`A close race! You take 2nd place and earn 30 Medals. (${score} vs ${rival})`, 'Ambrose');
      }
    } else if (sel === 1 && this.gold >= 100) {
      this.gold -= 100;
      this.medals += 150;
      await this.say('Your horse won! You collect +150 Medals!', 'Ambrose');
    } else if (sel === 2 && this.gold >= 500) {
      this.gold -= 500;
      this.medals += 600;
      await this.say('What an upset! The longshot wins! You collect +600 Medals!', 'Ambrose');
    }
  }

  async fest_ev_cooking(): Promise<void> {
    await this.say('Welcome to the Cooking Festival! The renowned Gourmet will judge your finest dish!', 'Ambrose');
    const dishes = Object.keys(this.inv).filter((i) => ITEMS[i]?.[2] === 'dish' && i !== 'Failed Dish');
    if (!dishes.length) {
      await this.say('You have no cooked dishes in your rucksack to enter. Next year, cook something in your Kitchen!', 'Gourmet');
      return;
    }
    const sel = await this.menu('Enter which dish for the Gourmet?', dishes);
    if (sel === null) return;
    const dish = dishes[sel];
    this.take(dish, 1);
    const staminaVal = ITEMS[dish][1] || 20;
    if (staminaVal >= 30 || py_rng().random() < 0.7) {
      this.fest_win('Cooking Festival');
      this.gold += 1000;
      for (const n of Object.keys(NPCS)) this.fest_bond(n, 5);
      await this.say(`Gourmet: 'MAGNIFICENT! The aroma of ${this.name}'s ${dish} is divine! First prize!' (+1000G)`, 'Gourmet');
    } else {
      await this.say(`Gourmet: 'Hmm, a decent ${dish}, though Tess's entry edges it out today!'`, 'Gourmet');
    }
  }

  async fest_ev_beach(): Promise<void> {
    await this.say('Beach Day & the Dog Frisbee Contest! Let us see how far your dog can catch the Frisbee!', 'Ambrose');
    if (!this.inv['Frisbee']) {
      await this.say('You need a Frisbee (sold by Ferreira at Otto\'s Beach House) to compete!', 'Ambrose');
      return;
    }
    const throwDist = this.dog_frisbee_dist + py_rng().randint(10, 35);
    if (throwDist >= 45) {
      this.fest_win('Beach Frisbee');
      this.give_power_berry('beach_frisbee');
      await this.say(`Incredible! Your dog leaps and catches the Frisbee at ${throwDist}m! First Prize: Heartseed!`, 'Ambrose');
    } else {
      this.dog_frisbee_dist += 10;
      await this.say(`Your dog catches it at ${throwDist}m! Practice at your Doghouse to beat the 45m record!`, 'Ambrose');
    }
  }

  async fest_ev_cowfest(): Promise<void> {
    await this.say('The Cow Festival! Abel and I will judge the healthiest, happiest cow in Brackenford!', 'Ambrose');
    const cows = this.animals.filter((a) => a.kind === 'cow');
    if (!cows.length) {
      await this.say('You have no cows to enter this year.', null);
      return;
    }
    const bestCow = cows.reduce((a, b) =>
      a.aff + coatInfo('cow', a.coat).festBonus >= b.aff + coatInfo('cow', b.coat).festBonus ? a : b,
    );
    const cowScore = bestCow.aff + coatInfo('cow', bestCow.coat).festBonus;
    if (cowScore >= 70 || py_rng().random() < 0.6) {
      bestCow.wonFestival = true;
      bestCow.aff = 100;
      this.fest_win('Cow Festival');
      await this.say(`First Prize goes to ${bestCow.name}! ${bestCow.name} will now produce GOLDEN MILK (and P/X Milk with outdoor grazing)!`, 'Ambrose');
    } else {
      bestCow.aff = Math.min(100, bestCow.aff + 15);
      await this.say(`${bestCow.name} takes 2nd place! Brush and talk to her daily to win next year!`, 'Abel');
    }
  }

  async fest_ev_sheepfest(): Promise<void> {
    await this.say('The Sheep Festival! Let us judge the fluffiest wool in Brackenford!', 'Ambrose');
    const sheep = this.animals.filter((a) => a.kind === 'sheep');
    if (!sheep.length) {
      await this.say('You have no sheep to enter this year.', null);
      return;
    }
    const bestSheep = sheep.reduce((a, b) =>
      a.aff + coatInfo('sheep', a.coat).festBonus >= b.aff + coatInfo('sheep', b.coat).festBonus ? a : b,
    );
    const sheepScore = bestSheep.aff + coatInfo('sheep', bestSheep.coat).festBonus;
    if (sheepScore >= 70 || py_rng().random() < 0.6) {
      bestSheep.wonFestival = true;
      bestSheep.aff = 100;
      this.fest_win('Sheep Festival');
      await this.say(`First Prize goes to ${bestSheep.name}! ${bestSheep.name} will now produce GOLDEN WOOL (and P/X Wool with grazing)!`, 'Ambrose');
    } else {
      bestSheep.aff = Math.min(100, bestSheep.aff + 15);
      await this.say(`${bestSheep.name} takes runner-up honors!`, 'Abel');
    }
  }

  async fest_ev_music(): Promise<void> {
    await this.say('Everyone gathers at the Church for the Autumn Music Festival!', 'Lucan');
    const n = await this.fest_pick('Perform alongside...', this.fest_bachs());
    if (n) {
      this.fest_bond(n, 8);
      await this.say(`The ocarina, organ, and flute fill the sanctuary with gentle harmony alongside ${n}.`, null);
    }
  }

  async fest_ev_pumpkin(): Promise<void> {
    await this.say('Happy Pumpkin Festival! Pip and Toby knock on your door hoping for sweet treats!', 'Pip');
    if (this.inv['Chocolate'] || this.inv['Cake'] || this.inv['Cookies']) {
      this.fest_bond('Pip', 8);
      this.fest_bond('Juniper', 5);
      await this.say('Yay! Thank you for the sweets!', 'Pip');
    } else {
      this.give('Chocolate', 2);
      await this.say('Crumb of the Hearthfolk shares Chocolate with you and the kids!', null);
    }
  }

  async fest_ev_winter_req(): Promise<void> {
    await this.say("Ho ho! It's my annual Winter Request! Can you share a gift from your rucksack?", 'Ambrose');
    const items = Object.keys(this.inv);
    if (items.length > 0) {
      this.give('Golden Lumber', 1);
      this.gold += 500;
      await this.say('Splendid! As promised, here is a piece of GOLDEN LUMBER and 500G! Ho ho!', 'Ambrose');
    } else {
      await this.say('Ah, your rucksack is empty! Next year, keep a crop or forage item handy!', 'Ambrose');
    }
  }

  async fest_ev_stocking(): Promise<void> {
    await this.say('On Lantern Night Eve, Mayor Ambrose sneaks down the chimney while you sleep...', null);
    const gift = py_rng().choice(['Diamond', 'Pink Diamond', 'Alexandrite', 'Heirloom Stone']);
    this.give(gift, 1);
    await this.say(`You check your Stocking on Winter 25 morning and find a ${gift}!`, null);
  }

  async fest_mash(duration: number, rival: number, title: string): Promise<number> {
    const start = Date.now() / 1000;
    let n = 0;
    let last: string | null = null;
    const [W, H] = [this.scr.w, this.scr.h];
    while (true) {
      const el = Date.now() / 1000 - start;
      if (el >= duration) break;
      const draw = () => {
        const [bx, by] = [Math.floor((W - 50) / 2), Math.floor(H / 2) - 4];
        this.scr.box(bx, by, 50, 7, '0D', '00', title);
        const bar = 32;
        const you = Math.min(bar, Math.floor((n * bar) / Math.max(1, rival + 8)));
        const them = Math.min(bar, Math.floor((Math.floor((rival * el) / duration) * bar) / Math.max(1, rival + 8)));
        this.scr.put(bx + 2, by + 2, `You   [${'#'.repeat(you)}${'.'.repeat(bar - you)}]`, '0B');
        this.scr.put(bx + 2, by + 3, `Rival [${'#'.repeat(them)}${'.'.repeat(bar - them)}]`, '08');
        this.scr.put(bx + 2, by + 5, `LEFT / RIGHT or SPACE!   ${(duration - el).toFixed(1)}s`, '07', '00', true);
      };
      this.render();
      draw();
      this.scr.flush();
      const k = await this.scr.getKey(0.03);
      if (k && ['left', 'a', 'h', 'right', 'd', 'l', 'space', 'x'].includes(k)) {
        const side = ['left', 'a', 'h'].includes(k) ? 'L' : k === 'space' || k === 'x' ? (last === 'L' ? 'R' : 'L') : 'R';
        if (side !== last) {
          n += 1;
          last = side;
        }
      }
    }
    this.last = Date.now() / 1000;
    return n;
  }

  async fest_ev_sumo(): Promise<void> {
    await this.say("Hen Show! Each farmer's hen tries to push the other out of the ring!", 'Ambrose');
    if (!this.chickens) {
      await this.say("You don't have a chicken to enter, so you watch Dennis's hen win again.", null);
      return;
    }
    const rival = py_rng().randint(14, 24);
    await this.say('Cheer your hen on by pressing LEFT/RIGHT or SPACE rapidly!', 'Dennis');
    const score = await this.fest_mash(4.5, rival, 'Hen Show');
    if (score >= rival) {
      this.gold += 500;
      this.chicken_fest_won = true;
      this.chicken_aff = 100;
      this.give('Chicken Feed', 10);
      this.fest_win('Hen Show');
      this.fest_bond('Dennis', 4);
      await this.say(
        `Your hen shoves Dennis's hen clean out of the ring! Your hens now lay GOLDEN EGGS! (+500G)`,
        'Ambrose'
      );
    } else {
      this.fest_bond('Dennis', 1);
      await this.say(`Dennis's hen holds the ring. Better luck next year! (${score} vs ${rival})`, 'Dennis');
    }
  }

  async fest_ev_egghunt(): Promise<void> {
    await this.say('Eggs are hidden in nine flower bushes around the square. You get three peeks. Find two or more to win!', 'Ambrose');
    const eggs = new Set(py_rng().sample(py_range(9), 3));
    const opened = new Set<number>();
    let cur = 4;
    let tries = 3;
    let found = 0;
    const [W, H] = [this.scr.w, this.scr.h];
    while (tries > 0) {
      const draw = () => {
        const [bx, by] = [Math.floor((W - 36) / 2), Math.floor(H / 2) - 6];
        this.scr.box(bx, by, 36, 11, '0D', '00', `Egg Hunt  peeks left: ${tries}`);
        for (let i = 0; i < 9; i++) {
          const [cx, cy] = [bx + 5 + (i % 3) * 10, by + 2 + Math.floor(i / 3) * 2];
          const [txt, fg] = opened.has(i) ? (eggs.has(i) ? ['( o )', '07'] : ['(   )', '02']) : ['(***)', '0B'];
          this.scr.put(cx, cy, txt, fg, i === cur ? '01' : '00', i === cur);
        }
        this.scr.put(bx + 3, by + 9, 'arrows move, X to search', '02');
      };
      const k = await this.modal(draw);
      if (k in DIRS) {
        const [dx, dy] = DIRS[k];
        cur = clamp((cur % 3) + dx, 0, 2) + 3 * clamp(Math.floor(cur / 3) + dy, 0, 2);
      } else if (OK_KEYS.has(k) && !opened.has(cur)) {
        opened.add(cur);
        tries -= 1;
        if (eggs.has(cur)) {
          found += 1;
          this.msg('You found an egg!', '07');
        }
      } else if (CANCEL_KEYS.has(k)) {
        break;
      }
    }
    if (found) this.give('Egg', found);
    if (found >= 2) {
      this.gold += 300;
      this.fest_win('Egg Hunt');
      await this.say(`You found ${found} eggs! First prize: 300G — and you keep the eggs!`, 'Ambrose');
    } else {
      this.fest_bond('Pip', 2);
      await this.say(`You found ${found} egg${found !== 1 ? 's' : ''}. Pip found the most and wins this year!`, 'Ambrose');
    }
  }

  async fest_companion(ask: string, scene: string, line: string): Promise<void> {
    const names = this.fest_bachs().filter((n) => n !== this.married);
    if (this.married) {
      names.unshift(this.married);
    }
    const n = await this.fest_pick(ask, names);
    if (!n) {
      await this.say(scene, null);
    } else if ((this.friend[n] || 0) >= 10 || n === this.married) {
      this.fest_bond(n, 8);
      await this.say(`${scene} ${n} stays by your side the whole time.`, null);
      await this.say(line, n);
    } else {
      this.fest_bond(n, 1);
      await this.say('Sorry, I promised to spend tonight with my family.', n);
      await this.say(scene, null);
    }
  }

  async fest_ev_fireworks(): Promise<void> {
    await this.fest_companion(
      'Watch the fireworks with...',
      'BOOM! Fireworks bloom over Brackenford Beach in red, blue and pink.',
      "Wow... they're beautiful. I'm glad I'm watching them with you."
    );
  }

  async fest_ev_moon(): Promise<void> {
    await this.fest_companion(
      'View the full moon on Beacon Hill with...',
      "The full autumn moon rises over Beacon Hill, round and bright.",
      'The moon is so pretty tonight. ...So is the company.'
    );
  }

  async fest_ev_harvest(): Promise<void> {
    await this.say('Everyone adds an ingredient to the giant pot! Then we all share the Harvest Stew!', 'Ambrose');
    const items = py_sorted(Object.keys(this.inv)).filter((i) =>
      ['crop', 'forage', 'fish', 'animal', 'dish'].includes(ITEMS[i]?.[2])
    );
    const sel = items.length ? await this.menu('Add what to the pot?', [...items, 'Nothing']) : null;
    if (sel === null || sel >= items.length) {
      await this.say("Everyone else's ingredients make a fine stew anyway.", null);
    } else {
      const item = items[sel];
      this.take(item);
      const pts = (ITEMS[item]?.[0] || 0) >= 100 ? 4 : 2;
      for (const n of Object.keys(NPCS)) {
        this.fest_bond(n, pts);
      }
      await this.say(`Your ${item} makes the stew delicious! Everyone in town thanks you.`, null);
    }
    this.stamina = this.max_stamina;
    this.fatigue = 0;
    await this.say("You eat until you're full. (Stamina & Fatigue restored)", null);
  }

  async fest_ev_thanks(): Promise<void> {
    await this.say("Winter Thanksgiving! People who care about you bring homemade treats!", 'Ambrose');
    const givers = this.fest_bachs().filter((n) => (this.friend[n] || 0) >= 25 || n === this.married);
    for (const n of givers) {
      const treat = (this.friend[n] || 0) >= 50 ? 'Chocolate Cake' : 'Chocolate';
      this.give(treat);
      await this.say(`Happy Thanksgiving! I brought you ${treat}!`, n);
    }
    if (!givers.length) {
      await this.say('No one brought you a cake this year... Befriend the villagers for next year!', null);
    }
  }

  async fest_ev_starry(): Promise<void> {
    await this.fest_companion(
      'Spend Lantern Night dinner with...',
      'Snow falls softly outside as candles glow around the dinner table.',
      "They say a wish made on Lantern Night always comes true. I already know what I'll wish for."
    );
  }

  async fest_ev_nye(): Promise<void> {
    await this.say(`Another year in Brackenford comes to an end! Let's eat buckwheat noodles, ${this.name}!`, 'Ambrose');
    this.stamina = this.max_stamina;
    this.fatigue = 0;
    this.give('Flour', 5);
    for (const n of Object.keys(NPCS)) {
      this.fest_bond(n, 2);
    }
    await this.show_lines(`Year ${this.year} in Review`, [
      `  Gold: ${this.gold}G`,
      `  Total shipped: ${this.shipped_total}G`,
      `  Heartseeds: ${this.power_berries}/10`,
      `  Chickens: ${this.chickens}   Barn Animals: ${this.animals.length}`,
      `  Spouse: ${this.married || '-'}   Child: ${this.child_name || '-'}`,
      `  Festival prizes: ${this.fest_wins.join(', ') || 'none yet'}`,
    ]);
  }

  async pass_out(text: string): Promise<void> {
    if (this.passing_out) return;
    this.passing_out = true;
    await this.say(text, null);
    await this.say('Dr. Sayer: You pushed yourself until you collapsed! Margit and I brought you home. Please take care of your Fatigue!', 'Dr. Sayer');
    await this.new_day('passout');
    this.passing_out = false;
  }

  run_sprites_work(report: string[]): boolean {
    let watered = 0;
    let harvested = 0;
    let animalsCared = 0;
    for (const s of SPRITES) {
      const job = this.sprite_jobs[s.name];
      if (!job || job.days <= 0 || job.task === 'none') continue;
      job.days -= 1;
      job.skill = Math.min(100, job.skill + 2);
      if (job.task === 'Watering') {
        for (const k of this.tilled) {
          this.wet.add(k);
          watered += 1;
        }
      } else if (job.task === 'Harvesting') {
        // settle companion bonuses first, so picking a flower in the same pass does not cancel them
        const bonus = Object.fromEntries(Object.keys(this.crops).map((k) => [k, this.companion_bonus(k) + this.compost_bonus(k)]));
        for (const [k, [crop, age]] of Object.entries(this.crops)) {
          const [days, regrow] = [CROPS[crop][2], CROPS[crop][3]];
          if (age >= days && crop !== 'Grass') {
            this.bin[crop] = (this.bin[crop] || 0) + 1 + bonus[k];
            if (this.compost_bonus(k)) this.composted = this.composted.filter((c) => c !== k);
            harvested += 1;
            if (regrow) {
              this.crops[k][1] = days - regrow;
            } else {
              delete this.crops[k];
            }
          }
        }
      } else if (job.task === 'Animals') {
        animalsCared += 1;
      }
      if (job.days === 0) {
        report.push(`${s.name} finished their ${job.task} contract.`);
        job.task = 'none';
      }
    }
    if (watered > 0) report.push(`Hearthfolk watered your tilled field!`);
    if (harvested > 0) report.push(`Hearthfolk harvested ${harvested} ripe crop(s) into the Shipping Bin!`);
    return animalsCared > 0;
  }

  /** Hired Animals sprites feed after the barn/egg night step, so the fed state survives into the day. */
  sprite_feed_animals(report: string[]): void {
    this.fed = this.chickens;
    for (const a of this.animals) {
      a.fed = true;
      a.aff = Math.min(100, a.aff + 1);
    }
    report.push(`Hearthfolk fed and brushed your livestock!`);
  }

  async new_day(reason: string): Promise<void> {
    const late = this.minutes >= 24 * 60;
    const report: string[] = [];

    // Collect any remaining items in shipping bin
    const pay = this.process_zack_pickup();
    if (pay.total > 0) report.push(payoutLine(pay, 'Otto settled your shipment:'));
    this.zack_paid_today = false;
    this.goals_tick();
    this.honey_picked = false;
    // Turned in before closing time: the stall packs up with whatever it sold.
    if (this.stall) report.push('You packed up your stall early.', ...this.stall_close().map((l) => l.trim()).filter(Boolean));

    // Advance crops that were watered yesterday
    for (const [pKey, c] of Object.entries(this.crops)) {
      if (this.wet.has(pKey) && c[1] < CROPS[c[0]][2]) {
        c[1] += 1;
      }
    }
    this.wet = new CoordSet();

    // Advance calendar
    this.day += 1;
    if (this.day > 30) {
      this.day = 1;
      this.season += 1;
      if (this.season > 3) {
        this.season = 0;
        this.year += 1;
      }
      report.push(`${this.season_name} has arrived!`);
      // Keep perennial Grass in Spring/Summer/Fall; wither seasonal crops
      const surviving: Record<string, [string, number]> = {};
      for (const [k, [crop, age]] of Object.entries(this.crops)) {
        if ((crop === 'Grass' && this.season !== 3) || (this.farm_works.greenhouse && GLASS_SET.has(k))) {
          surviving[k] = [crop, age];
        }
      }
      if (Object.keys(this.crops).length > Object.keys(surviving).length) {
        report.push('The change of season withered your old seasonal crops.');
      }
      this.crops = surviving;
    }

    // Fey Sickle / Hammer 10-day blessing progression
    for (const t of ['Sickle', 'Hammer']) {
      if (this.levels[t] !== 5) continue;
      this.cursed_days[t] = (this.cursed_days[t] || 0) + 1;
      if (this.cursed_days[t] >= 10) {
        this.levels[t] = 6;
        report.push(`Miracle! Keeping the Fey ${t} for 10 days turned it into a HALLOWED ${t}!`);
      }
    }

    const rainedYesterday = this.weather === 'Rain' || this.weather === 'Typhoon';
    this.weather = this.tomorrow;
    for (const map of OUTDOOR_MAPS) {
      const wet = this.weather === 'Rain' || this.weather === 'Typhoon' ? 1 : (this.wetness[map] || 0) * 0.55;
      this.wetness[map] = wet < 0.06 ? 0 : wet;
    }
    let [nd, ns] = [this.day + 1, this.season];
    if (nd > 30) {
      nd = 1;
      ns = (ns + 1) % 4;
    }
    this.tomorrow = this.roll_weather(ns, nd);

    // Run hired Hearthfolk
    const spritesFeed = this.run_sprites_work(report);

    if (this.weather === 'Rain' || this.weather === 'Typhoon') {
      for (const k of this.tilled) {
        this.wet.add(k);
      }
      report.push("It's raining — your fields are watered.");
    }
    if (this.weather === 'Typhoon' || this.weather === 'Blizzard') {
      report.push(`A fierce ${this.weather} sweeps through Brackenford! Stay safe!`);
    }
    this.farm_works_morning(report);
    this.cask_morning(report);
    if (reason === 'sleep') {
      this.night_surprise(report);
      this.night_sky(report); // aurora over the valley tonight, reported at dawn
    }

    // Incubator & Chickens
    if (this.incubator_days > 0) {
      this.incubator_days -= 1;
      if (this.incubator_days === 0) {
        if (this.chickens < this.coop_cap()) {
          this.add_chicken();
          report.push('Cheep cheep! A new baby chick hatched in your Incubator!');
        } else {
          this.incubator_days = 1; // keep the egg warm until the coop has room
          report.push('The egg is ready to hatch, but your coop is full. It stays in the Incubator until there is room.');
        }
      }
    }
    if (this.fed) {
      if (this.has_perk('ranch_aff')) this.chicken_aff = Math.min(100, this.chicken_aff + 2);
      this.eggs += this.fed;
      report.push(`Your chickens laid ${this.fed} egg${this.fed > 1 ? 's' : ''}.`);
    }
    if (this.enrichment.perch && this.chickens > 0 && this.weather === 'Sunny') {
      this.chicken_aff = Math.min(100, this.chicken_aff + 2);
    }
    this.fed = 0;

    this.barn_new_day(report);
    if (spritesFeed) this.sprite_feed_animals(report);
    this.farm_auto_feed(report);
    const pastureMsg = pastureMorning(this.pasture, this.season);
    if (pastureMsg) report.push(pastureMsg);
    report.push(...this.contest_close());
    this.favor_morning(report);

    // Blacksmith completion
    if (this.upgrading && this.absday() >= this.upgrading[1]) {
      const t = this.upgrading[0];
      this.levels[t] = (this.levels[t] || 0) + 1;
      if (t === 'Watering Can') {
        this.water = CAN_CAP[this.levels[t]];
      }
      report.push(`Hilde finished your ${LEVELS[this.levels[t]]} ${t}!`);
      this.upgrading = null;
    }

    // TV Shopping delivery
    if (this.tv_order && this.absday() >= this.tv_order[1]) {
      const item = this.tv_order[0];
      this.tv_order = null;
      if (item === 'Heartseed') {
        this.give_power_berry('tv_shopping');
        report.push('Otto delivered your TV Shopping Heartseed!');
      } else if (['Clock', 'Mirror', 'Refrigerator', 'Cabinet', 'Rug'].includes(item)) {
        if (!this.house_flags.includes(item)) this.house_flags.push(item);
        this.rebuild_house();
        report.push(`Otto delivered & installed your ${item} in the Farmhouse!`);
      } else {
        this.give(item, 1);
        report.push(`Otto delivered your ${item} from TV Shopping!`);
      }
    }

    // Carpentry completion
    report.push(...this.carpentry_day());
    report.push(...this.works_day());

    // Marriage & Child Birth milestone + child growth over seasons (Task 08)
    if (this.married && !this.child_name && this.marriage_day >= 0 && this.absday() - this.marriage_day >= 30) {
      this.child_name = 'Sprout';
      report.push(`Joyous news! ${this.married} and you welcomed a healthy baby into your family!`);
    } else if (this.child_name) {
      this.child_days += 1;
    }

    // Guest vendors becoming regulars (Task 11)
    if (this.stall_earned >= 500 && !this.guest_regulars.includes('bram')) {
      this.guest_regulars.push('bram');
      report.push('Bram’s Traveling Seed Cart is now a Market Cross regular (Wed & Sat)!');
    }
    if ((this.public_works.built || this.house_flags.length > 0) && !this.guest_regulars.includes('maren')) {
      this.guest_regulars.push('maren');
      report.push('Maren’s Traveling Joinery is now a Market Cross regular (Mon & Thu)!');
    }

    // Family routines at home (Task 47)
    if (this.married) {
      this.spouse_routine = rollSpouseRoutine(this.married, this.absday(), this.season, this.weather);
      report.push(this.spouse_routine.text);
      if (this.spouse_routine.kind === 'flowers' && this.spouse_routine.gift && !this.vase_flower) {
        this.vase_flower = this.spouse_routine.gift;
      }
    } else {
      this.spouse_routine = null;
    }

    // Daily trail encounter (Task 36), daily luck (G13), weekly shipping contracts (G16)
    this.trail_encounter = rollTrailEncounter(this.absday());
    this.daily_luck = rollDailyLuck(this.absday(), this.farm.length * 13 + this.name.length);
    this.contracts = this.contracts.filter((c) => !c.done && c.deadline >= this.absday());
    if (this.weekday === 0 || this.contracts.length === 0) {
      this.contracts = generateWeeklyContracts(this.absday(), this.season);
    }
    this.food_buff = sanitizeFoodBuff(this.food_buff, this.absday() * 1440 + 6 * 60);

    // Multiple pets & morning bowl gifts + cat clue (G15 & Task 29)
    if (this.dog_aff >= 50 || (this.pet_extras.cat && this.pet_extras.catAff >= 30)) {
      if (!this.pet_extras.bowlGift) {
        const gift = rollPetGift(this.season, this.absday());
        this.pet_extras.bowlGift = gift;
        report.push(`Your pet${this.pet_extras.cat ? 's' : ''} left a ${gift} by the pet bowl!`);
      }
    }
    if (this.pet_extras.cat) {
      const ripeCount = Object.values(this.crops).filter(([crop, age]) => CROPS[crop] && age >= CROPS[crop][2]).length;
      if (ripeCount > 0) {
        this.pet_extras.catClue = `sitting proudly by your ripe crops (${ripeCount} ready to pick).`;
      } else {
        const p = FISH_POCKETS[this.absday() % FISH_POCKETS.length];
        this.pet_extras.catClue = `staring toward ${this.maps[p.map]?.title || p.map} (${p.glyph} ${p.fish} water).`;
      }
    }

    // Market Cross request board
    this.request_day(report);
    this.reminder_day(report);
    this.compost_day(report);

    // Spawn daily weeds & mountain/beach forage
    if (this.season !== 3) {
      const m = this.maps['farm'];
      const objs = this.objs['farm'];
      for (let i = 0; i < 3; i++) {
        const [x, y] = [py_rng().randint(3, 60), py_rng().randint(9, 26)];
        const k = pkey(x, y);
        if (m.tile(x, y) === 'field' && !this.tilled.has(k) && !objs[k]) {
          objs[k] = 'weed';
        }
      }
    }
    this.spawn_forage();
    if (rainedYesterday) this.mushroom_flush(report);
    this.spawn_digs();
    this.dog_morning(report);
    this.talked = new Set();
    this.gifted = new Set();
    this.prayed = false;
    this.fest_new_day(report);

    // Sleep Stamina & Fatigue Recovery (with Vase flower, Rug & Fireplace bonuses)
    const vaseBonus = this.vase_flower ? 15 : 0;
    const rugBonus = this.house_flags.includes('Rug') ? 5 : 0;
    const fireBonus = this.fireplace_lit && this.season === 3 ? 20 : 0;
    this.fireplace_lit = false;
    if (reason === 'passout') {
      this.stamina = Math.floor(this.max_stamina / 2);
      this.fatigue = 30;
      report.push('You woke up aching from collapsing yesterday. (Half Stamina, 30 Fatigue)');
    } else if (late) {
      this.stamina = Math.min(this.max_stamina, Math.floor((this.max_stamina * 3) / 4) + vaseBonus + rugBonus);
      this.fatigue = Math.max(0, this.fatigue - 25 - rugBonus - fireBonus);
      report.push('You stayed up past midnight, so you did not fully recover.');
    } else {
      this.stamina = this.max_stamina;
      this.fatigue = Math.max(0, this.fatigue - 50 - vaseBonus - rugBonus - fireBonus);
    }

    this.minutes = 6 * 60;
    this.acc = 0;
    this.riding_horse = false;
    this.mapname = 'house';
    [this.px, this.py] = HOUSE_WAKE;
    this.face = [0, -1];
    this.npc_pos = {};
    this.save(1);
    pushDawnBackup(getBrowserStorage(), this.snapshot());
    this.msgs = [];
    await this.say(`Good morning! ${this.date_str()}.  Weather: ${this.weather}.`, null);
    for (const r of report) {
      await this.say(r, null);
    }
    this.msg('Game saved to Diary Slot 1.', '03');
    this.last = Date.now() / 1000;
  }

  /** Drop saved forage that no longer lies on open ground (buildings have moved since older saves). */
  prune_forage(): void {
    for (const [name, items] of Object.entries(this.forage)) {
      const m = this.maps[name];
      if (!m) continue;
      for (const k of Object.keys(items)) {
        const [x, y] = parseCoordKey(k);
        const t = m.tile(x, y);
        if (t !== 'grass' && t !== 'sand') delete items[k];
      }
    }
  }

  /** Today's forage list for a map: an outer region's own pool, or the valley-wide seasonal list. */
  forage_pool(mapKey: string): string[] {
    return REGION_FORAGE[mapKey]?.[this.season_name] || FORAGE[this.season_name] || ['Bluewort'];
  }

  spawn_forage(): void {
    const rng = py_rng();
    for (const mapKey of FORAGE_MAPS) {
      const m = this.maps[mapKey];
      if (!m) continue;
      const items = this.forage_pool(mapKey);
      const fr: Record<string, string> = {};
      let tries = 0;
      const target = (FORAGE_TARGET[mapKey] ?? 6) * (this.season === 3 && mapKey !== 'beach' && mapKey !== 'point' ? 0.55 : 1);
      while (Object.keys(fr).length < target && tries < 400) {
        tries += 1;
        const [x, y] = [rng.randint(2, m.w - 3), rng.randint(2, m.h - 3)];
        const tile = m.tile(x, y);
        if ((tile === 'grass' || tile === 'sand') && !m.near(x, y, ['path', 'door', 'spring', 'pond'], 0)) {
          fr[pkey(x, y)] = rng.choice(items);
        }
      }
      this.forage[mapKey] = fr;
    }
    // fallen branches gather in Cedar Hollow overnight (a renewable lumber source)
    const woods = this.maps['woods'];
    if (woods) {
      const objs = (this.objs['woods'] ||= {});
      let tries = 0;
      while (Object.keys(objs).length < 9 && tries < 300) {
        tries += 1;
        const [x, y] = [rng.randint(2, woods.w - 3), rng.randint(2, woods.h - 3)];
        const k = pkey(x, y);
        if (woods.tile(x, y) === 'grass' && !woods.near(x, y, ['path', 'bridge'], 0) && !(k in (this.forage['woods'] || {}))) objs[k] = 'branch';
      }
    }
  }

  // ---------------------------------------------------------------- weather worth exploring (mechanics task 35)
  /** Mushrooms that come up in Cedar Hollow after rain this season (none in winter). */
  flush_pool(season: string = this.season_name): string[] {
    return MUSHROOM_FLUSH[season] ?? [];
  }

  /** The morning after rain: extra mushrooms come up in Cedar Hollow. Returns how many. */
  mushroom_flush(report: string[]): number {
    const pool = this.flush_pool();
    const woods = this.maps['woods'];
    if (!pool.length || !woods) return 0;
    const rng = py_rng();
    const fr = (this.forage['woods'] ||= {});
    const objs = this.objs['woods'] || {};
    const spots: string[] = [];
    for (let tries = 0; spots.length < FLUSH_COUNT && tries < 400; tries++) {
      const [x, y] = [rng.randint(2, woods.w - 3), rng.randint(2, woods.h - 3)];
      const k = pkey(x, y);
      if (woods.tile(x, y) !== 'grass' || woods.near(x, y, ['path', 'bridge', 'pond'], 0) || k in fr || k in objs) continue;
      fr[k] = rng.choice(pool);
      spots.push(k);
    }
    if (!spots.length) return 0;
    this.flush_day = this.absday();
    this.flush_spots = spots;
    report.push(`After yesterday's rain, mushrooms have come up in Cedar Hollow (${spots.length} to pick).`);
    return spots.length;
  }

  /** Flush mushrooms still waiting in Cedar Hollow today. */
  flush_left(): number {
    if (this.flush_day !== this.absday()) return 0;
    const fr = this.forage['woods'] || {};
    return this.flush_spots.filter((k) => this.flush_pool().includes(fr[k])).length;
  }

  /** Rain today, and tomorrow is not winter: the flush is coming. */
  flush_coming(): boolean {
    const [s] = this.fest_date(1);
    return (this.weather === 'Rain' || this.weather === 'Typhoon') && this.flush_pool(SEASONS[s]).length > 0;
  }

  // ---------------------------------------------------------------- a pet's morning clue (mechanics task 29)
  /** Is the thing the dog smelled still out there today? */
  dog_clue_live(): boolean {
    const c = this.dog_clue;
    if (!c || c.day !== this.absday()) return false;
    if (c.kind === 'dig') return this.objs[c.map]?.[c.key] === 'dig';
    return !!this.forage[c.map]?.[c.key];
  }

  /** "the north-east of Cedar Hollow" for a tile, by thirds of the map. */
  area_name(map: string, key: string): string {
    const m = this.maps[map];
    const [x, y] = parseCoordKey(key);
    const ns = y < m.h / 3 ? 'north' : y >= (2 * m.h) / 3 ? 'south' : '';
    const ew = x < m.w / 3 ? 'west' : x >= (2 * m.w) / 3 ? 'east' : '';
    const part = ns && ew ? `${ns}-${ew}` : ns || ew;
    return part ? `the ${part} of ${m.title}` : `the middle of ${m.title}`;
  }

  /** "mushrooms after the rain, in the north-east of Cedar Hollow" */
  dog_clue_text(): string | null {
    const c = this.dog_clue;
    if (!c) return null;
    const what = c.kind === 'mushroom' ? 'mushrooms after the rain' : 'a fresh dig spot';
    return `${what}, in ${this.area_name(c.map, c.key)}`;
  }

  /**
   * Each morning a well-loved dog picks up a scent: a flush mushroom if there are any, else a fresh
   * dig spot away from the farm. Nothing is made up: the clue points at something already there.
   */
  dog_morning(report: string[]): void {
    this.dog_clue = null;
    if (this.dog_aff < DOG_CLUE_AFF) return;
    const today = this.absday();
    const flush = this.flush_day === today ? this.flush_spots.filter((k) => this.forage['woods']?.[k]) : [];
    const rng = py_rng();
    if (flush.length) {
      this.dog_clue = { day: today, map: 'woods', key: rng.choice(flush), kind: 'mushroom' };
    } else {
      const digs: [string, string][] = [];
      for (const map of DIG_MAPS) {
        if (map === 'farm' || !this.maps[map]) continue;
        for (const [k, o] of Object.entries(this.objs[map] || {})) if (o === 'dig') digs.push([map, k]);
      }
      if (!digs.length) return;
      const [map, key] = rng.choice(digs.sort());
      this.dog_clue = { day: today, map, key, kind: 'dig' };
    }
    report.push(`Your dog kept its nose to the ground this morning: ${this.dog_clue_text()}.`);
  }

  /** A free patch of open field on the farm (no soil, crop or object), or null. */
  free_field(): [number, number] | null {
    const m = this.maps['farm'];
    const objs = (this.objs['farm'] ||= {});
    const rng = py_rng();
    for (let tries = 0; tries < 200; tries++) {
      const [x, y] = [rng.randint(3, 60), rng.randint(9, 26)];
      const k = pkey(x, y);
      if (m.tile(x, y) === 'field' && !this.tilled.has(k) && !objs[k] && !this.crops[k]) return [x, y];
    }
    return null;
  }

  /** Wriggling soil: each morning a few dig spots appear across the valley (at most DIG_CAP per map). */
  spawn_digs(): void {
    const rng = py_rng();
    for (const mapKey of DIG_MAPS) {
      const m = this.maps[mapKey];
      if (!m || rng.random() < 0.45) continue;
      const objs = (this.objs[mapKey] ||= {});
      if (Object.values(objs).filter((o) => o === 'dig').length >= DIG_CAP) continue;
      if (mapKey === 'farm') {
        if (this.season === 3) continue; // frozen ground
        const spot = this.free_field();
        if (spot) objs[pkey(...spot)] = 'dig';
        continue;
      }
      const forage = this.forage[mapKey] || {};
      for (let tries = 0; tries < 80; tries++) {
        const [x, y] = [rng.randint(2, m.w - 3), rng.randint(2, m.h - 3)];
        const k = pkey(x, y);
        const tile = m.tile(x, y);
        if ((tile === 'grass' || tile === 'sand') && !objs[k] && !(k in forage) && !m.near(x, y, ['path', 'door', 'spring', 'pond', 'bridge'], 0)) {
          objs[k] = 'dig';
          break;
        }
      }
    }
  }

  /** Dig up a dig spot: coins, ore, seeds, local forage or, now and then, a relic for the museum. */
  dig_up(tx: number, ty: number): void {
    delete this.objs[this.mapname][pkey(tx, ty)];
    const rng = py_rng();
    const r = rng.random();
    const seeds = Object.keys(CROPS)
      .filter((c) => CROPS[c][0] === this.season_name && `${c} Seeds` in ITEMS && !HYBRID_CROPS.has(c))
      .map((c) => `${c} Seeds`);
    let found: string;
    if (r < 0.12) {
      const item = rng.choice(DIG_RELICS);
      this.give(item);
      found = `a ${item}! An old relic; the museum would treasure it.`;
      this.fx_add('sparkle', tx, ty, 0.9);
      this.mastery_add('foraging', 2);
    } else if (r < 0.37) {
      const item = rng.choice(DIG_ORES);
      this.give(item);
      found = `a chunk of ${item}.`;
    } else if (r < 0.55 && seeds.length) {
      const item = rng.choice(seeds);
      const n = rng.randint(1, 3);
      this.give(item, n);
      found = `${n} ${item}, still good!`;
    } else if (r < 0.75) {
      const item = rng.choice(this.forage_pool(this.mapname));
      this.give(item, 2);
      found = `2 ${item}.`;
    } else {
      const g = 30 + rng.randint(0, 17) * 10;
      this.gold += g;
      found = `an old purse with ${g}G inside!`;
      this.fx_add('coin', tx, ty, 0.8);
    }
    this.fx_add('debris', tx, ty, 0.45, { stuff: 'plant', delay: 0.05 });
    this.mastery_add('foraging', 1);
    this.msg(`You dug up ${found}`, '0B');
  }

  /** Now and then something happens while you sleep: one roll a night, most nights are quiet. */
  night_surprise(report: string[]): void {
    const rng = py_rng();
    if (rng.random() >= NIGHT_SURPRISE_CHANCE) return;
    const growing = Object.values(this.crops).filter(([c, age]) => c !== 'Grass' && age < CROPS[c][2]);
    const kinds = ['star', 'parcel'];
    if (this.season !== 3 && growing.length >= 3) kinds.push('moths', 'moths');
    const kind = rng.choice(kinds);
    if (kind === 'moths') {
      const lucky = rng.sample(growing, Math.min(6, growing.length));
      for (const c of lucky) c[1] += 1;
      report.push(`Glowmoths drifted over your field in the night. ${lucky.length} crops grew a little extra!`);
      return;
    }
    if (kind === 'star') {
      const spot = this.free_field();
      if (spot) {
        this.objs['farm'][pkey(...spot)] = 'starrock';
        report.push('A falling star streaked over the valley and landed on your farm! Find it and crack it open with your Hammer.');
        return;
      }
    }
    const friends = py_sorted(Object.keys(this.friend).filter((n) => NPCS[n] && (this.friend[n] || 0) >= 30));
    const from = friends.length ? rng.choice(friends) : 'Someone';
    const item = rng.choice(this.forage_pool(rng.choice(['mountain', 'beach', 'woods'])));
    this.give(item, 2);
    report.push(`${from} left a parcel by your door: 2 ${item}.`);
  }

  /** Aurora Borealis — a clear Fall night paints the valley in green curtains (task 57-style next-tier event). One showing per day at most. */
  night_sky(report: string[]): void {
    if (this.season !== 2) return; // aurora season: Fall
    if (this.weather === 'Rain' || this.weather === 'Typhoon' || this.weather === 'Snow' || this.weather === 'Blizzard') return;
    if (this.aurora_day === this.absday()) return;
    this.aurora_day = this.absday();
    report.push('The sky over Brackenford blushed to green tonight: the aurora came out over the valley. Walk the fields tonight if you dare!');
  }

  /** Semantic tag for a map cell, mirroring the precedence used by glyph(). */
  cell_tag(m: GameMap, x: number, y: number, t: string, hl: boolean, hlArea: boolean = false, pKey: string = pkey(x, y)): CellTag {
    const name = m.name;
    const tag: CellTag = { t, wx: x, wy: y, hl };
    if (hlArea) tag.hlArea = true;
    if (name === 'farm') {
      if (this.farm_works.greenhouse && GLASS_SET.has(pKey)) tag.greenhouse = true;
      if (this.farm_overlay(x, y, pKey)) {
        const [ch, fg] = this.glyph(m, x, y, t, pKey);
        tag.fixture = { ch, fg };
      }
    }
    const obj = this.objs[name]?.[pKey];
    if (obj && OBJ_GLYPH[obj]) {
      tag.k = `obj:${obj}`;
      return tag;
    }
    const fr = this.forage[name]?.[pKey];
    if (fr && FORAGE_GLYPH[fr]) {
      tag.k = 'forage';
      return tag;
    }
    if (name === 'farm' && this.tilled.has(pKey)) {
      const wet = this.wet.has(pKey);
      const c = this.crops[pKey];
      if (!c) {
        tag.k = wet ? 'soil:wet' : 'soil';
      } else {
        const [crop, age] = c;
        const d = CROPS[crop];
        const stage = age >= d[2] ? 'ripe' : age === 0 ? 'seed' : age < d[2] / 2 ? 'sprout' : 'young';
        tag.k = `crop:${stage}${wet ? ':wet' : ''}`;
        tag.cropName = crop;
      }
      if (this.compost_has(pKey)) tag.compost = true;
      return tag;
    }
    if ((t === 'water' || t === 'pond') && (name === 'river' || name === 'point')) {
      const pocket = this.fish_pocket(name, x, y);
      if (pocket) tag.fishPocket = pocket.glyph;
    }
    if (name === TRAP_SPOT[0] && x === TRAP_SPOT[1] && y === TRAP_SPOT[2]) {
      tag.trap = this.trap_state();
      return tag;
    }
    if (name === 'mountain' && this.season === 3 && t === 'water' && x >= 13 && x <= 17 && y >= 7 && y <= 14) {
      tag.t = 'ice';
      return tag;
    }
    if (pKey in m.deco) {
      const [ch, fg] = m.deco[pKey];
      tag.k = 'deco';
      tag.dch = ch;
      tag.dfg = fg;
    } else if (t === 'tree' && !m.indoor && (x === 0 || x === m.w - 1 || y === 0 || y === m.h - 1)) {
      tag.k = 'tree:edge';
    }
    return tag;
  }

  glyph(m: GameMap, x: number, y: number, t: string, pKey: string = pkey(x, y)): [string, string, string, boolean] {
    const name = m.name;
    const fishPocket = (t === 'water' || t === 'pond') ? this.fish_pocket(name, x, y) : undefined;
    if (fishPocket) return [fishPocket.glyph, '0C', '00', true];
    if (t === 'orchard_tree') {
      const age = this.absday() - (this.farm_works.orchard[pKey]?.planted ?? 0);
      if (age < TREE_DAYS) return ['!', '0A', '00', false];
      return ['♣', this.orchard_due(pKey) !== null ? '09' : '0A', '00', this.orchard_due(pKey) !== null];
    }
    if (t === 'stall') {
      // grey when shut, orange while it can be stocked, green while it is trading
      const st = this.stall_state();
      return [TILES.stall[0], st === 'open' ? '0B' : st === 'ready' ? '09' : '03', TILES.stall[2], st === 'open' || st === 'ready'];
    }
    if (t === 'mantel') {
      // gold with keepsakes on it, plain wood while it is bare
      return [TILES.mantel[0], this.souvenirs.length ? '0A' : '03', TILES.mantel[2], this.souvenirs.length > 0];
    }
    if (name === TRAP_SPOT[0] && x === TRAP_SPOT[1] && y === TRAP_SPOT[2]) {
      // the pot's float: grey while the pot is up on the pier, orange while it soaks, green when it is ready
      const st = this.trap_state();
      return ['¤', st === 'ready' ? '0B' : st === 'set' ? '09' : '03', '00', st !== 'up'];
    }
    if (t === 'maker') {
      // grey when empty, orange while a batch works, green once it is ready to collect
      const maker = name === 'farm' ? Object.keys(MAKER_SPOTS).find((mk) => MAKER_SPOTS[mk].x === x && MAKER_SPOTS[mk].y === y) : null;
      const st = maker ? this.maker_state(maker) : 'idle';
      return [TILES.maker[0], st === 'ready' ? '0B' : st === 'working' ? '09' : '03', TILES.maker[2], st !== 'idle'];
    }
    const obj = this.objs[name]?.[pKey];
    if (obj && OBJ_GLYPH[obj]) {
      let [ch, fg] = OBJ_GLYPH[obj];
      if (this.season === 3 && name === 'farm' && obj === 'weed') {
        fg = '07';
      }
      return [ch, fg, '00', false];
    }
    const fr = this.forage[name]?.[pKey];
    if (fr && FORAGE_GLYPH[fr]) {
      const [ch, fg] = FORAGE_GLYPH[fr];
      return [ch, fg, '00', true];
    }
    if (name === 'farm' && this.tilled.has(pKey)) {
      const bg = this.wet.has(pKey) ? '01' : '00';
      const c = this.crops[pKey];
      if (!c) {
        return ['=', '09', bg, false];
      }
      const [crop, age] = c;
      const d = CROPS[crop];
      if (age >= d[2]) {
        return [d[5], d[6], bg, true];
      }
      if (age === 0) {
        return [':', '09', bg, false];
      }
      if (age < d[2] / 2) {
        return [',', '0B', bg, false];
      }
      return ['"', '0B', bg, false];
    }
    // Frozen Lake ice in Winter around Mirewater Mine island
    if (name === 'mountain' && this.season === 3 && t === 'water' && x >= 13 && x <= 17 && y >= 7 && y <= 14) {
      return ['=', '0C', '01', false];
    }
    if (pKey in m.deco) {
      const [ch, fg] = m.deco[pKey];
      return [ch, fg, TILES[t]?.[2] || '00', false];
    }
    const [ch0, fg0, bg, ] = TILES[t] || [' ', '00', '00', false];
    let ch = ch0;
    let fg = fg0;
    const season = this.season;
    const h = (x * 7 + y * 13 + x * y) % 11;
    if (t === 'grass') {
      if (season === 3) {
        return [h < 4 ? '.' : ' ', '05', '00', false];
      }
      if (h < 3) {
        return [h ? ',' : '"', season === 2 && h !== 1 ? '09' : '0B', '00', false];
      }
      return [' ', fg, bg, false];
    }
    if (t === 'field' && season === 3) {
      return ['.', '05', '00', false];
    }
    if (t === 'tree') {
      return ['T', ['0B', '0B', '09', '04'][season], '00', true];
    }
    if (t === 'flower') {
      if (season === 3) {
        return ['.', '05', '00', false];
      }
      return ['*', ['0A', '0E', '08', '0C', '07'][h % 5], '00', false];
    }
    if (t === 'water' || t === 'fountain' || t === 'spring' || t === 'pond') {
      if (!this.scr.reducedMotion && (x + y + Math.floor((Date.now() / 1000) * 1.5)) % 7 === 0) {
        ch = '-';
      }
      if (season === 3 && t === 'water' && m.name !== 'mine') {
        fg = '0C';
      }
    }
    return [ch, fg, bg, false];
  }

  render(): void {
    const s = this.scr;
    s.clear();
    if (!this.started) {
      this.draw_title();
      return;
    }
    const [W, H] = [s.w, s.h];
    if (W < COMPACT_MIN_COLS || H < MIN_ROWS) {
      s.put(0, 0, `Terminal too small: need ${COMPACT_MIN_COLS}x${MIN_ROWS}, have ${W}x${H}`, '08');
      return;
    }
    // Narrow (phone) grids drop the side panel: the map takes the full width and the
    // panel's essentials move into the divider row (draw_status); 'p' overlays the panel.
    const compact = isCompact(W);
    const contour = s.style === 'enhanced' && !compact;
    const side = compact ? 0 : contour ? clamp(Math.round(W * 0.23), 24, 36) : 29;
    const mapY = contour ? 0 : 1;
    const dividerY = contour ? H - 2 : H - 4;
    const [vw, vh] = [compact ? W : W - side - 1, dividerY - mapY];
    const rankGrade = this.town_rank().tier.grade;
    if (this.started && isMusicEnabled()) {
      syncAmbientAudio(musicSceneFor(this.mapname, this.season, !!this.map.indoor));
    }
    s.ctx = {
      mapName: this.mapname,
      indoor: !!this.map.indoor,
      minutes: this.minutes,
      season: this.season,
      day: this.day,
      weather: this.map.indoor ? 'Sunny' : this.weather,
      wetness: this.wetness[this.mapname] || 0,
      cues: s.accessibleCues,
      palette: s.paletteMode,
      mineFloor: this.mapname === 'mine' ? this.mine_floor : undefined,
      mineType: this.mapname === 'mine' ? this.mine_type : undefined,
      townRank: rankGrade,
      toolTier: UPGRADABLE.includes(this.tool) ? (this.levels[this.tool] || 0) : 0,
      zoom: 1,
      reducedMotion: s.reducedMotion,
      view: { x: 0, y: mapY, w: vw, h: vh },
      divX: vw,
      divY: dividerY,
      icons: [],
    };
    if (!contour) this.draw_topbar(W);
    this.draw_map(0, mapY, vw, vh);
    if (this.capturing) return;
    if (contour && this.map.indoor && this.mapname !== 'mine') this.draw_indoor_legend(vw, vh, mapY);
    if (this.show_minimap) this.draw_minimap(vw, vh);
    this.draw_pin_hint(vw, mapY);
    if (compact) {
      s.put(0, H - 4, '-'.repeat(W), '01');
      this.draw_status(H - 4, W);
      if (this.show_panel) this.draw_compact_almanac();
      this.draw_msgs(H - 3);
      return;
    }
    s.put(0, dividerY, '-'.repeat(W), '01');
    if (contour) {
      this.draw_almanac_frame(vw, 0, side + 1, dividerY);
      this.draw_contour_side(vw + 3, 1, side - 5);
    } else {
      for (let y = mapY; y < dividerY; y++) s.put(vw, y, '|', '01');
      this.draw_side(vw + 2, 2, side - 2);
    }
    this.draw_msgs(dividerY + 1);
  }

  /** Compact Room Legend plaque beneath small indoor rooms so wide viewports feel grounded. */
  draw_indoor_legend(vw: number, vh: number, mapY: number): void {
    const m = this.map;
    if (m.w >= vw - 4 || m.h >= vh - 5) return;
    const roomTop = mapY + Math.floor((vh - m.h) / 2);
    const roomBottom = roomTop + m.h;
    const availBelow = mapY + vh - (roomBottom + 2);
    if (availBelow < 4) return;

    const seen = new Set<string>();
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        seen.add(m.tile(x, y));
      }
    }
    const items: string[] = [];
    if (seen.has('bed')) items.push('Bed: Sleep & Save');
    if (seen.has('tv')) items.push('TV: Weather');
    if (seen.has('kitchen')) items.push('Kitchen: Cook');
    if (seen.has('cal')) items.push('Calendar');
    if (seen.has('bin')) items.push('$: Ledger');
    if (seen.has('bath')) items.push('Bath: Rest');
    if (seen.has('fireplace')) items.push('Hearth');
    if (seen.has('counter')) items.push('Counter: Shop / Talk');
    if (seen.has('incub')) items.push('Incubator');
    if (seen.has('bookcase') || seen.has('shelf')) items.push('Shelves: Read');
    if (seen.has('mantel')) items.push('♕: Keepsakes');
    if (seen.has('maker')) items.push('Makers');
    items.push('+ Door: Step Outside');

    const lineA = items.slice(0, Math.ceil(items.length / 2)).join('  ·  ');
    const lineB = items.slice(Math.ceil(items.length / 2)).join('  ·  ');
    const maxW = Math.min(vw - 4, Math.max(lineA.length, lineB.length, m.title.length + 6, 26) + 6);
    if (maxW < 22) return;
    const lx = Math.max(1, Math.floor((vw - maxW) / 2));
    const ly = roomBottom + 2;
    const rows = lineB ? 4 : 3;
    if (ly + rows > mapY + vh) return;

    const s = this.scr;
    const inner = maxW - 2;
    const titleStr = ` ${m.title} `;
    const topFill = Math.max(0, inner - 1 - titleStr.length);
    s.put(lx, ly, '╭─', '09', '00');
    s.put(lx + 2, ly, titleStr, '07', '00', true);
    s.put(lx + 2 + titleStr.length, ly, `${'─'.repeat(topFill)}╮`, '09', '00');
    const fillRow = (ry: number, text: string, col: string) => {
      s.put(lx, ry, '│', '09', '00');
      s.put(lx + 1, ry, `  ${text}`.padEnd(inner).slice(0, inner), col, '00');
      s.put(lx + maxW - 1, ry, '│', '09', '00');
    };
    fillRow(ly + 1, lineA.slice(0, maxW - 6), '05');
    if (lineB) fillRow(ly + 2, lineB.slice(0, maxW - 6), '04');
    s.put(lx, ly + rows - 1, `╰${'─'.repeat(inner)}╯`, '09', '00');
    for (let cy = ly; cy < ly + rows; cy++) {
      for (let cx = lx; cx < lx + maxW; cx++) {
        s.tag(cx, cy, { t: 'ui', k: 'hud:legend' });
      }
    }
  }

  /** The right-side Contour Farm HUD. Grid bounds also cover short/touch viewports. */
  draw_contour_side(x: number, y: number, w: number): void {
    const s = this.scr;
    const end = s.ctx?.divY ?? s.h - 2;
    const compact = s.h < 30;
    const gap = s.h >= 38 ? 2 : 1;
    const clip = (text: string, width = w) =>
      text.length > width && width >= 3 ? text.slice(0, width - 3) + '...' : text.slice(0, width);
    const line = (row: number, text: string, col = '05', bold = false) => {
      if (row < end) s.put(x, row, clip(text), col, '00', bold);
    };
    const pair = (row: number, name: string, value: string, col = '05') => {
      if (row >= end) return;
      const val = clip(value, Math.max(1, w - name.length - 1));
      line(row, name, '04');
      s.put(x + w - val.length, row, val, col);
    };
    const label = (row: number, text: string, scale: number, width: number, h: number) => {
      s.put(x, row, text[0], '07', '00', true);
      s.tag(x, row, { t: 'ui', k: 'hud:label', label: { text, scale, w: width, h } });
    };
    // Farm chrome: a post-and-rail fence between blocks, and ledger rows with dot leaders.
    const rail = (row: number) => {
      if (row >= end) return;
      for (let i = 0; i < w; i++) {
        s.put(x + i, row, fencePost(i, w) ? '+' : '-', '01');
        s.tag(x + i, row, { t: 'ui', k: 'hud:fence' });
      }
    };
    const ledger = (row: number, name: string, value: string, col = '05') => {
      if (row >= end) return;
      pair(row, name, value, col);
      const from = name.length + 1;
      const to = w - Math.min(value.length, Math.max(1, w - name.length - 1)) - 1;
      if (to - from >= 3) s.put(x + from, row, '.'.repeat(to - from), '01');
    };

    const titleH = compact ? 1 : 2;
    label(y, 'GLADE', compact ? 1 : 1.45, w, titleH);
    line(y + titleH, `${this.name} of ${this.farm} Farm`, '04');
    rail(y + titleH + 1);
    y += titleH + 1 + gap;
    line(y++, `${this.season_name.toUpperCase()} / YEAR ${this.year}`, '0C', true);
    const dayH = compact ? 2 : 3;
    if (y < end) {
      label(y, String(this.day).padStart(2, '0'), compact ? 1.8 : 2.6, 7, dayH);
      s.put(x + 8, y, WEEKDAYS[this.weekday].toUpperCase(), '07', '00', true);
      if (y + 1 < end) s.put(x + 8, y + 1, fmt_time(this.minutes).replace(/(AM|PM)$/, ' $1'), '05');
    }
    y += dayH;
    const weatherMark = this.weather === 'Sunny' ? '*' : this.weather === 'Rain' ? '~' : this.weather === 'Snow' ? '.' : '!';
    line(y, `${weatherMark} ${this.weather.toUpperCase()}`, WEATHER_COL[this.weather] || '09');
    y += 1 + gap;

    const tool = this.tool;
    const preview = this.action_preview();
    const facing = this.facing_action().summary.replace(' · ', ' / ');
    const cost = preview.cost > 0 ? `${w >= 20 ? 'COST ' : ''}-${preview.cost}st${preview.faint ? '!' : ''}` : '';
    pair(y++, 'EQUIPPED', cost, preview.faint ? '08' : '04');
    const idx = TOOLS.includes(tool) ? `[${TOOLS.indexOf(tool) + 1}] ` : '';
    // the equipped tool is a painted sign: one board the full width of the panel
    if (y < end) {
      s.put(x, y, ' '.repeat(w), '07');
      s.put(x + 1, y, clip(idx + tool.toUpperCase(), w - 2), '07', '00', true);
      if (idx) s.put(x + 1, y, idx.trimEnd(), '0C', '00', true);
      for (let i = 0; i < w; i++) s.tag(x + i, y, { t: 'ui', k: 'hud:sign' });
    }
    y++;
    if (UPGRADABLE.includes(tool)) {
      const level = this.levels[tool] || 0;
      const exp = clamp(this.tool_exp[tool] || 0, 0, 100);
      const detail = `${LEVELS[level]} / ${exp}%`;
      if (tool === 'Watering Can') pair(y, detail, `${this.water}/${CAN_CAP[level]}`, '0C');
      else line(y, detail, '04');
      if (y < end) {
        for (let i = 0; i < w; i++) {
          const prev = s.tags[y]?.[x + i];
          s.tag(x + i, y, {
            ...(prev ?? { t: 'ui' }),
            subBar: { frac: exp / 100, pos: i, len: w, col: '0C', track: '01' },
          });
        }
      }
    } else if (tool.endsWith(' Seeds')) {
      const crop = tool.slice(0, -6);
      const inSeason = crop === 'Grass' || CROPS[crop]?.[0] === this.season_name;
      pair(y, `${this.inv[tool] || 0} bags`, inSeason ? 'IN SEASON' : 'OFF-SEASON', inSeason ? '0B' : '08');
    }
    y++;
    rail(y++);
    y += gap - 1;

    const fraction = clamp(this.stamina / this.max_stamina, 0, 1);
    const staminaCol = fraction > 0.5 ? '0B' : fraction > 0.2 ? '09' : '08';
    pair(y++, 'STAMINA', `${this.stamina}/${this.max_stamina}`, staminaCol);
    if (y < end) this.draw_almanac_meter(x, y, w, fraction, staminaCol);
    y++;
    const hasTruthGem = Boolean(this.inv['Gem of Truth'] || this.truth_jewels >= 9);
    pair(
      y++,
      hasTruthGem ? 'FATIGUE ★' : 'FATIGUE',
      `${this.fatigue}/100`,
      this.fatigue < 50 ? (hasTruthGem ? '0C' : '04') : this.fatigue < 80 ? '09' : '08',
    );
    y += gap;
    ledger(y++, 'GOLD', `${this.gold}G`, '09');
    const binValue = py_sum(Object.entries(this.bin).map(([item, qty]) => (ITEMS[item] ? ITEMS[item][0] : 0) * qty));
    ledger(y++, 'BIN', `${binValue}G`, binValue ? '09' : '04');
    const basket = getBasketTotal(this.basket);
    const held = this.held === 'Basket' ? `Basket ${basket}/${BASKET_CAPACITY}`
      : this.held ? `${this.held} x${this.inv[this.held] || 0}`
      : basket ? `Basket ${basket}/${BASKET_CAPACITY}` : '-';
    ledger(y++, 'HELD', held, this.held ? '0A' : basket ? '09' : '04');
    y += gap;
    if (this.upgrading) line(y++, `FORGE  ${this.upgrading[0]}`, '09');
    if (this.riding_horse) line(y++, 'RIDING HORSE / 2x', '09');
    if (this.chickens) ledger(y++, 'COOP', `${this.chickens} hens/${this.eggs} eggs`);
    if (this.animals.length) {
      const hungry = this.animals.filter((animal) => !animal.fed).length;
      ledger(y++, 'BARN', hungry ? `${hungry} hungry` : `${this.animals.length} fed`, hungry ? '08' : '04');
    }
    if (this.power_berries || this.has_mystic_berry) ledger(y++, 'BERRIES', `${this.power_berries}${this.has_mystic_berry ? ' + Mystic' : ''}`);
    if (!compact || y + 1 < end) {
      const tr = this.town_rank();
      ledger(y++, 'TOWN', `Rank ${tr.tier.grade}`, tr.tier.grade === 'S' ? '0A' : '0C');
    }
    if (y < end) {
      if (facing.length <= w - 7) {
        pair(y++, 'FACING', facing, '0E');
      } else if (y + 3 < end) {
        line(y++, 'FACING', '04');
        const wrapped = wrapLines([facing], w);
        for (let i = 0; i < Math.min(2, wrapped.length) && y + 1 < end; i++) {
          line(y++, wrapped[i], '0E');
        }
      } else {
        pair(y++, 'FACING', facing.replace(' / ', ' ').replace(' stamina', 'st'), '0E');
      }
    }
    if (this.first_steps && y + 2 < end - 1) {
      // two rows: the heading, then "✓ Till ○ Sow ○ Water" with each step lit once done
      y += 1;
      line(y++, 'FIRST MORNING', '0C');
      let cx = x;
      for (const r of this.first_steps_rows()) {
        const seg = `${r.done ? '✓' : '○'} ${r.label.split(' ')[0]} `;
        if (cx + seg.trimEnd().length > x + w) break;
        s.put(cx, y, seg, r.done ? '0B' : '04', '00', r.done);
        cx += seg.length;
      }
      y++;
    }
    if (this.fortnight.active && !this.first_steps && y + 2 < end - 1) {
      // two rows: the heading with the count, then the next goal
      y += 1;
      const next = FORTNIGHT_GOALS.find((g) => !this.fortnight.done.includes(g.id));
      line(y++, `FORTNIGHT ${this.fortnight.done.length}/${FORTNIGHT_GOALS.length}`, '0C');
      if (next) line(y++, `○ ${next.short}`, '04');
    }
    const locFull = this.map.title + (this.map.indoor ? ' / Indoors' : '');
    if (y + 1 < end) {
      if (locFull.length <= w) {
        line(end - 1, locFull, '04');
      } else if (this.map.indoor && y <= end - 3) {
        line(end - 2, this.map.title, '04');
        line(end - 1, 'Indoors', '03');
      } else {
        line(end - 1, locFull, '04');
      }
    }
  }

  private draw_almanac_frame(x: number, top: number, w: number, bottom: number): void {
    const s = this.scr;
    const right = x + w - 1;
    const rail = '+' + '-'.repeat(w - 2) + '+';
    for (const y of [top, bottom]) {
      s.put(x, y, rail, '01');
      for (let cx = x; cx <= right; cx++) s.tag(cx, y, { t: 'ui', k: 'hud:fence' });
    }
    for (let y = top + 1; y < bottom; y++) {
      for (const cx of [x, right]) {
        s.put(cx, y, '|', '01');
        s.tag(cx, y, { t: 'ui', k: 'hud:fence' });
      }
    }
  }

  private draw_almanac_meter(x: number, y: number, w: number, fraction: number, col: string): void {
    const s = this.scr;
    const filled = Math.round(fraction * (w - 2));
    s.put(x, y, '[', '04');
    s.put(x + 1, y, '#'.repeat(filled), col, '00', true);
    s.put(x + 1 + filled, y, '.'.repeat(w - 2 - filled), '03');
    s.put(x + w - 1, y, ']', '04');
  }

  /** Compact INFO almanac bounded above the message rail. */
  private draw_compact_almanac(): void {
    const s = this.scr;
    const w = 32;
    const x = s.w - w - 1;
    const right = x + w - 1;
    const limit = Math.min(s.h - 5, 19);
    const blank = ' '.repeat(w - 2);
    let row = 2;
    const clear = () => s.put(x + 1, row, blank, '05');
    const line = (label: string, value: string, color = '05') => {
      if (row >= limit) return;
      const labelEnd = x + 2 + label.length;
      const start = Math.max(labelEnd + 1, right - value.length - 1);
      clear();
      s.put(x + 2, row, label, '04');
      const dots = start - labelEnd - 2;
      if (dots >= 2) s.put(labelEnd + 1, row, '.'.repeat(dots), '01');
      s.put(start, row++, value.slice(0, right - start), color, '00', true);
    };
    line('Farmer', this.name, '07');
    line('Farm', this.farm, '05');
    const preview = this.action_preview();
    line('Tool', `${this.tool}${preview.cost ? ` -${preview.cost}st${preview.faint ? '!' : ''}` : ''}`, preview.faint ? '08' : '07');
    if (UPGRADABLE.includes(this.tool)) {
      const level = this.levels[this.tool] || 0;
      const exp = clamp(this.tool_exp[this.tool] || 0, 0, 100);
      line(LEVELS[level], this.tool === 'Watering Can' ? `${exp}% ${this.water}/${CAN_CAP[level]}` : `${exp}%`, '0C');
    } else if (this.tool.endsWith(' Seeds')) {
      const crop = this.tool.slice(0, -6);
      const inSeason = crop === 'Grass' || CROPS[crop]?.[0] === this.season_name;
      line('Seeds', `${this.inv[this.tool] || 0} bags${inSeason ? '' : ' (off-season)'}`, inSeason ? '0B' : '08');
    }
    const facing = this.facing_action().summary.replace(' · ', ' / ').replace(' stamina', 'st');
    if (facing.length <= w - 11) line('Facing', facing, '0E');
    else {
      clear();
      s.put(x + 2, row++, 'Facing', '04');
      for (const text of wrapLines([facing], w - 4).slice(0, 2)) {
        clear();
        s.put(x + 2, row++, text, '0E');
      }
    }
    const basket = getBasketTotal(this.basket);
    const held = this.held === 'Basket' ? `Basket ${basket}/${BASKET_CAPACITY}` : this.held ? `${this.held} x${this.inv[this.held] || 0}` : basket ? `Basket ${basket}/${BASKET_CAPACITY}` : '-';
    line('Held', held, this.held ? '0A' : '04');
    const fraction = clamp(this.stamina / this.max_stamina, 0, 1);
    const staminaCol = fraction > 0.5 ? '0B' : fraction > 0.2 ? '09' : '08';
    line('Stamina', `${this.stamina}/${this.max_stamina}`, staminaCol);
    clear();
    this.draw_almanac_meter(x + 2, row++, w - 4, fraction, staminaCol);
    line('Fatigue', `${this.fatigue}/100`, '05');
    line('Gold', `${this.gold}G`, '09');
    const binValue = py_sum(Object.entries(this.bin).map(([item, qty]) => (ITEMS[item] ? ITEMS[item][0] : 0) * qty));
    line('Bin', `${binValue}G`, binValue ? '09' : '04');
    if (this.upgrading) line('Forge', this.upgrading[0], '09');
    else if (this.riding_horse) line('Riding', 'Horse / 2x', '09');
    if (this.power_berries || this.has_mystic_berry) line('Berries', `${this.power_berries}${this.has_mystic_berry ? ' + Mystic' : ''}`, '0C');
    if (this.chickens) line('Coop', `${this.chickens} hens / ${this.eggs} eggs`, '05');
    if (this.animals.length) {
      const hungry = this.animals.filter((animal) => !animal.fed).length;
      line('Barn', hungry ? `${hungry} hungry` : `${this.animals.length} fed`, hungry ? '08' : '05');
    }
    this.draw_almanac_frame(x, 1, w, row);
    for (let y = 2; y < row; y++) {
      for (let cx = x + 1; cx < right; cx++) s.tag(cx, y, { t: 'ui' });
    }
  }

  draw_topbar(W: number): void {
    const s = this.scr;
    s.put(0, 0, ' '.repeat(W), '05', '01');
    const sn = this.season_name;
    const compact = isCompact(W);
    const sep = compact ? ' ' : '  ';
    let x = 1;
    if (s.style === 'enhanced') {
      // the renderer draws the season glyph into this blank cell, like the weather icon
      s.ctx?.icons.push({ x, y: 0, icon: 'season' });
      x = 2;
    }
    const segments: [string, string][] = [
      [`${sn} ${this.day}`, SEASON_COL[sn]],
      [` ${WEEKDAYS[this.weekday]}`, '05'],
      [compact ? ` Y${this.year}` : `  Yr ${this.year}`, '04'],
      [`${sep}${fmt_time(this.minutes)}`, '07'],
      [`  ${this.weather}`, WEATHER_COL[this.weather] || '09'],
      [`${sep}${this.gold}G`, '09'],
    ];
    for (const [text, fg] of segments) {
      s.put(x, 0, text, fg, '01', true);
      if (text === `  ${this.weather}`) s.ctx?.icons.push({ x: x + 1, y: 0, icon: 'weather' });
      x += text.length;
    }
    let loc = this.map.title + (this.map.indoor && !compact ? ' (indoors)' : '');
    // Narrow screens: shorten the place name rather than let it run off the edge.
    if (compact && x + 1 + loc.length > W - 1) loc = loc.slice(0, Math.max(0, W - x - 3)) + '…';
    s.put(Math.max(x + 1, W - loc.length - 2), 0, loc, '0C', '01');
  }

  draw_map(ox: number, oy: number, vw: number, vh: number): void {
    const s = this.scr;
    const m = this.map;
    const cellW = vw;
    let targetX = 0;
    let targetY = 0;
    if (m.w <= vw) {
      ox += Math.floor((cellW - m.w) / 2);
    } else {
      targetX = clamp(this.px - Math.floor(vw / 2), 0, m.w - vw);
    }
    if (m.h <= vh) {
      oy += Math.floor((vh - m.h) / 2);
    } else {
      targetY = clamp(this.py - Math.floor(vh / 2), 0, m.h - vh);
    }
    // The camera eases toward the player, but only within one map: a position left over from
    // another map (waking at home after collapsing outdoors, a mine floor change) snaps instead.
    if (
      s.reducedMotion ||
      this.cam_map !== this.mapname ||
      this.cam_x === null ||
      this.cam_y === null ||
      Math.abs(targetX - this.cam_x) > 6 ||
      Math.abs(targetY - this.cam_y) > 6
    ) {
      this.cam_x = targetX;
      this.cam_y = targetY;
    } else {
      this.cam_x += (targetX - this.cam_x) * 0.28;
      this.cam_y += (targetY - this.cam_y) * 0.28;
    }
    this.cam_map = this.mapname;
    // Never look past the edge of the map, whatever the camera was doing before.
    const cx = clamp(Math.round(this.cam_x), 0, Math.max(0, m.w - vw));
    const cy = clamp(Math.round(this.cam_y), 0, Math.max(0, m.h - vh));
    if (s.ctx) {
      const now = Date.now() / 1000;
      s.ctx.fx = this.fx
        .filter((f) => f.map === this.mapname)
        .map((f) => ({ ...f, x: ox + f.x - cx, y: oy + f.y - cy, age: now - f.born, life: f.life }));
      s.ctx.shake = this.shake_fx && now - this.shake_fx.born < 0.3 ? { age: now - this.shake_fx.born, strength: this.shake_fx.strength } : undefined;
      s.ctx.step = this.step_ctx(ox + this.px - cx, oy + this.py - cy);
      s.ctx.wipe =
        this.warp_fx && now - this.warp_fx.born < this.warp_fx.duration
          ? { age: now - this.warp_fx.born, duration: this.warp_fx.duration, focus: [ox + this.px - cx, oy + this.py - cy] }
          : undefined;
    }
    const hour = this.minutes / 60;
    const classic = s.style === 'classic';
    const night = classic && !m.indoor && m.name !== 'mine' && (hour >= 19 || hour < 5);
    const dusk = classic && !m.indoor && m.name !== 'mine' && 17.5 <= hour && hour < 19;
    if (s.ctx) s.ctx.view = { x: ox, y: oy, w: Math.min(vw, m.w), h: Math.min(vh, m.h) };
    const [tx, ty] = this.target();
    // Resolve once so the touch action and map marker describe the same faced cell.
    const action = this.context_action();
    const actionReticle = action.key === 'x' ||
      (action.key === 'space' && ['WATER', 'DIG', 'CRACK', 'CAST'].includes(action.label));
    const aoeSet = new Set<string>();
    aoeSet.add(pkey(tx, ty));
    if (this.mapname === 'farm' && !(this.row && this.row_current(this.row))) {
      if (['Hoe', 'Watering Can', 'Sickle'].includes(this.tool)) {
        for (const [qx, qy] of this.area()) {
          aoeSet.add(pkey(qx, qy));
        }
      } else if (this.tool.endsWith(' Seeds')) {
        for (const dx of [-1, 0, 1]) {
          for (const dy of [-1, 0, 1]) {
            aoeSet.add(pkey(tx + dx, ty + dy));
          }
        }
      } else if (this.tool === SAPLING) {
        ORCHARD_SPOTS.forEach((k) => aoeSet.add(k));
      } else if (this.tool === 'Sprinkler') {
        fixtureCoverage(pkey(tx, ty), false).forEach((k) => aoeSet.add(k));
      } else if (this.tool === 'Scarecrow') {
        fixtureCoverage(pkey(tx, ty), true).forEach((k) => aoeSet.add(k));
      }
      if (tx === BARREL_SPOT[0] && ty === BARREL_SPOT[1]) CHANNEL_CELLS.forEach((k) => aoeSet.add(k));
    }

    // A planned row (task 54) lights its tiles like a tool area, until the player moves or switches tools.
    if (this.row && this.row_current(this.row)) for (const [rx, ry] of this.row.tiles) aoeSet.add(pkey(rx, ry));

    const companion = new Set(this.companion_preview(this.tool, tx, ty)?.cells ?? []);

    for (let sy = 0; sy < Math.min(vh, m.h); sy++) {
      const y = cy + sy;
      for (let sx = 0; sx < Math.min(vw, m.w); sx++) {
        const x = cx + sx;
        const key = pkey(x, y);
        const tile = m.tile(x, y, key);
        let [ch, fg, bg, bold] = this.glyph(m, x, y, tile, key);
        if (night && fg !== '00' && fg !== '01') {
          fg = fg === '0D' || fg === '0C' ? '0F' : fg === '02' || fg === '03' ? '02' : '03';
        } else if (dusk && fg === '0B') {
          fg = '09';
        }
        const hl = aoeSet.has(key);
        if (hl) {
          bg = bg === '01' ? '02' : '01';
        }
        const tag = this.cell_tag(m, x, y, tile, hl, hl && !(x === tx && y === ty), key);
        if (actionReticle && x === tx && y === ty) tag.actionTarget = true;
        if (companion.has(key)) tag.companion = true;
        // Task 41: Preview equipped placeable farm piece with its one-cell glyph on allowed ground
        if (this.mapname === 'farm' && x === tx && y === ty && isFarmPiece(this.tool) && this.farm_can_place(key) && !this.farm_overlay(x, y, key)) {
          const piece = FARM_PIECES[this.tool];
          ch = piece.glyph;
          fg = '0C';
          bold = true;
          tag.piecePreview = { ch: piece.glyph, fg: '0C' };
        }
        const px = ox + sx;
        s.put(px, oy + sy, ch, fg, bg, bold);
        s.tag(px, oy + sy, tag);
      }
    }
    const at = (x: number, y: number, ch: string, fg: string, bold = true, ent = 'npc', extra?: Partial<CellTag>) => {
      const [sx, sy] = [x - cx, y - cy];
      if (0 <= sx && sx < Math.min(vw, m.w) && 0 <= sy && sy < Math.min(vh, m.h)) {
        const px = ox + sx;
        const bg = s.buf[oy + sy][px][2];
        const under = s.tags[oy + sy][px];
        s.put(px, oy + sy, ch, fg, bg, bold);
        if (under) s.tag(px, oy + sy, { ...under, ent, ...extra });
      }
    };
    // Draw outdoor Dog, Farm Cat, Horse, and grazing Chickens/Cows/Sheep on the Farm
    if (this.mapname === 'farm') {
      if (this.pet_extras.cat) {
        at(CAT_SPOT[0], CAT_SPOT[1], 'f', '0A', true, 'pet'); // Farm Cat beside Doghouse (G15)
      }
      at(21, 6, 'd', '09', true, 'pet'); // Faithful Dog by Doghouse
      if (!this.riding_horse) {
        at(25, 6, 'H', '04', true, 'pet'); // Horse by Stable
      }
      if (this.animals_grazing && this.weather === 'Sunny') {
        const tick = Math.floor(Date.now() / 1500);
        this.sync_animal_records();
        for (let i = 0; i < Math.min(6, this.chickens); i++) {
          const pers = this.chicken_personalities[i] || 'calm';
          const [gx, gy] = animalYardSpot('chicken', pers, i, tick, this.enrichment, [this.px, this.py]);
          if (!(gx === this.px && gy === this.py)) at(gx, gy, 'c', pers === 'curious' ? '09' : '07', true, 'animal');
        }
        for (let i = 0; i < Math.min(8, this.animals.length); i++) {
          const a = this.animals[i];
          const pers: AnimalPersonality = a.personality || 'calm';
          const [gx, gy] = animalYardSpot(a.kind === 'sheep' ? 'sheep' : 'cow', pers, i, tick, this.enrichment, [this.px, this.py]);
          if (!(gx === this.px && gy === this.py)) {
            const sheepCh = (a.wool ?? WOOL_DAYS) >= WOOL_DAYS ? 'S' : 's';
            const coat = coatInfo(a.kind, a.coat);
            at(gx, gy, a.kind === 'cow' ? 'C' : sheepCh, coat.col, true, 'animal');
          }
        }
      }
    }
    // Guest vendor in Market Cross (Task 11)
    if (this.mapname === 'town') {
      const gv = this.current_guest_vendor();
      if (gv) at(GUEST_VENDOR_SPOT[0], GUEST_VENDOR_SPOT[1], gv.glyph, gv.col, true, 'npc', { winterCoat: this.season === 3 });
    }
    // Trail neighbor & dropped scarf (Task 36)
    if (this.trail_encounter && this.trail_encounter.day === this.absday() && !this.trail_encounter.done) {
      const te = TRAIL_ENCOUNTERS.find((e) => e.id === this.trail_encounter!.id);
      if (te && te.map === this.mapname) {
        const nd = NPCS[te.npc];
        at(te.pos[0], te.pos[1], nd?.g || te.npc[0], nd?.col || '0C', true, 'npc', { winterCoat: this.season === 3 });
        if (te.itemPos && !this.trail_encounter.found) {
          at(te.itemPos[0], te.itemPos[1], '≈', '08', true, 'animal');
        }
      }
    }
    for (const [n, [x, y]] of Object.entries(this.npc_pos)) {
      if (NPCS[n]?.where?.[0] === this.mapname) {
        at(x, y, NPCS[n].g, NPCS[n].col, true, 'npc', { winterCoat: this.season === 3 && !m.indoor });
      }
    }
    for (const [n, d] of Object.entries(this.indoor_npcs)) {
      if (d.map === this.mapname && n !== this.married) {
        at(d.pos[0], d.pos[1], NPCS[n].g, NPCS[n].col);
      }
    }
    if (this.mapname === 'house' && this.married) {
      if (!this.spouse_is_away()) {
        at(SPOUSE_POS[0], SPOUSE_POS[1], NPCS[this.married].g, NPCS[this.married].col);
      }
      if (this.child_name) {
        at(SPOUSE_POS[0] + 1, SPOUSE_POS[1], 'c', '0A', true, 'npc');
      }
    }
    if (this.mapname === 'house' && this.wall_print) {
      at(9, 1, this.wall_print.marks[0] || '✦', this.wall_print.ink || '0C', true, 'animal');
    }
    // Player glyph color reflects Stamina & Fatigue state (White -> Orange -> Red -> Blue when exhausted!)
    const playerCol =
      this.fatigue >= 80 || this.stamina === 0
        ? '0D'
        : this.stamina <= this.max_stamina * 0.2
          ? '08'
          : this.stamina <= this.max_stamina * 0.5 || this.fatigue >= 50
            ? '09'
            : this.riding_horse
              ? '0A'
              : '07';
    at(this.px, this.py, '@', playerCol, true, 'player', {
      face: [this.face[0], this.face[1]],
      riding: this.riding_horse,
    });

    if (classic && !m.indoor && m.name !== 'mine' && this.weather !== 'Sunny' && !s.reducedMotion) {
      const rng = py_rng(Math.floor((Date.now() / 1000) * 8));
      const isRain = this.weather === 'Rain' || this.weather === 'Typhoon';
      const drops = Math.floor((vw * vh) / (isRain ? 22 : 40));
      for (let i = 0; i < drops; i++) {
        const [sx, sy] = [rng.randrange(Math.min(vw, m.w)), rng.randrange(Math.min(vh, m.h))];
        if (sx + cx === this.px && sy + cy === this.py) continue;
        const cell = s.buf[oy + sy][ox + sx];
        if (isRain) {
          s.put(ox + sx, oy + sy, '/', '0D', cell[2]);
        } else {
          s.put(ox + sx, oy + sy, rng.choice('*.'), '07', cell[2]);
        }
      }
    }
  }

  /** Region links between the outdoor maps, read from their edge warps. */
  valley_links(): Record<string, string[]> {
    const links: Record<string, string[]> = {};
    for (const name of OUTDOOR_MAPS) {
      const m = this.maps[name];
      if (!m) continue;
      links[name] = [...new Set(Object.values(m.warps).map((w) => w[0]).filter((d) => OUTDOOR_MAPS.includes(d) && d !== name))];
    }
    return links;
  }

  /** Hilde's Forge today: open now, or when it next opens (festivals close it too). */
  forge_status(): { open: boolean; text: string } {
    return this.shop_status('blacksmith');
  }

  /** Any shop's hours from here, skipping festival days the way fest_closed() does. */
  shop_status(bid: string): { open: boolean; text: string } {
    const festShut = (d: number) => !['church', 'sprites'].includes(bid) && !!this.fest_on(d);
    return shopStatus(HOURS[bid], this.weekday, this.minutes, festShut);
  }

  /** The Valley Map's landmarks today: project landmarks appear once built. */
  valley_landmarks(): ValleyLandmark[] {
    return VALLEY_LANDMARKS.filter((l) => !l.when || this.public_works.built);
  }

  /** Where the pinned landmark is from here: the exit to take next, or the way to walk. */
  pin_route(): {
    landmark: (typeof VALLEY_LANDMARKS)[number];
    /** The cell to head for on this map (an exit, or the landmark itself), if any. */
    cell: [number, number] | null;
    arrow: string;
    short: string;
    text: string;
    /** A short form for narrow screens. */
    brief: string;
  } | null {
    const lm = this.valley_landmarks().find((l) => l.id === this.map_pin);
    if (!lm) return null;
    const m = this.map;
    const arrowFor = (dx: number, dy: number) =>
      dx === 0 && dy === 0 ? '·' : Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? '<' : '>') : dy < 0 ? '^' : 'v';
    const nearestWarp = (pred: (dest: string) => boolean): [number, number] | null => {
      let best: [number, number] | null = null;
      let bestD = Infinity;
      for (const [k, w] of Object.entries(m.warps)) {
        if (!pred(w[0])) continue;
        const [x, y] = parseCoordKey(k);
        const d = Math.abs(x - this.px) + Math.abs(y - this.py);
        if (d < bestD) [best, bestD] = [[x, y], d];
      }
      return best;
    };
    const towards = (cell: [number, number] | null, short: string, text: string, brief: string = text) => {
      const [dx, dy] = cell ? [cell[0] - this.px, cell[1] - this.py] : [0, 0];
      return { landmark: lm, cell, arrow: arrowFor(dx, dy), short, text, brief };
    };
    const inside = this.interior_bid[this.mapname];
    if ((inside && inside === lm.bid) || (this.mapname === 'house' && lm.id === 'farmhouse')) {
      return towards(null, lm.name, "you're there");
    }
    if (this.mapname === 'mine') {
      let up: [number, number] | null = null;
      for (let y = 0; y < m.h && !up; y++) for (let x = 0; x < m.w && !up; x++) if (m.tile(x, y) === 'up') up = [x, y];
      return towards(up, "Beacon Hill", up ? "climb out to Beacon Hill" : 'find your way out first', 'climb out');
    }
    if (!OUTDOOR_MAPS.includes(this.mapname)) {
      const out = nearestWarp((d) => OUTDOOR_MAPS.includes(d));
      if (!out) return towards(null, 'way out', 'find your way out first');
      const dest = m.warps[pkey(out[0], out[1])][0];
      return towards(out, 'outside', dest === lm.map ? 'step outside' : `step outside to ${this.maps[dest].title}`, 'step outside');
    }
    if (this.mapname === lm.map) {
      const [dx, dy] = [lm.x - this.px, lm.y - this.py];
      const dist = Math.abs(dx) + Math.abs(dy);
      return towards(dist <= 1 ? null : [lm.x, lm.y], lm.name, dist <= 1 ? "you're there" : `${dist} steps ${compassWord(dx, dy)}`);
    }
    // of the neighbours on a shortest region walk, take the one whose exit is nearest you
    const options = nextRegions(this.valley_links(), this.mapname, lm.map);
    if (!options.length) return towards(null, lm.name, 'no path from here');
    const exitDist = (n: string) => {
      const c = nearestWarp((d) => d === n);
      return c ? Math.abs(c[0] - this.px) + Math.abs(c[1] - this.py) : Infinity;
    };
    const next = options.reduce((best, n) => (exitDist(n) < exitDist(best) ? n : best));
    const cell = nearestWarp((d) => d === next);
    const side = !cell ? '' : cell[0] === 0 ? 'west' : cell[0] === m.w - 1 ? 'east' : cell[1] === 0 ? 'north' : cell[1] === m.h - 1 ? 'south' : compassWord(cell[0] - this.px, cell[1] - this.py);
    const title = this.maps[next].title;
    const exitWord = side ? `${side} exit` : 'exit';
    return towards(cell, title, `${exitWord} to ${title}${next === lm.map ? '' : `, toward ${this.maps[lm.map].title}`}`, `${exitWord}: ${title}`);
  }

  /** One short pointer line at the top-left of the map view while something is pinned. */
  draw_pin_hint(vw: number, y: number): void {
    const r = this.pin_route();
    if (!r || this.show_minimap) return;
    const text = isCompact(this.scr.w) ? ` ${r.arrow} ${r.landmark.glyph} ${r.brief} ` : ` ${r.arrow} ${r.landmark.glyph} ${r.landmark.name}: ${r.text} `;
    const clip = text.length > vw - 2 ? text.slice(0, Math.max(0, vw - 3)) + '…' : text;
    this.scr.put(1, y, clip, '0E', '00');
    for (let i = 0; i < clip.length; i++) this.scr.tag(1 + i, y, { t: 'ui', k: 'hud:pin' });
  }

  /** Task 33: the labeled Valley Map. Arrows choose a landmark, Enter pins it, Esc closes. */
  async valley_map(): Promise<void> {
    const lms = this.valley_landmarks();
    let sel = Math.max(0, lms.findIndex((l) => l.id === this.map_pin));
    if (!this.map_pin) {
      const here = lms.findIndex((l) => l.map === this.mapname);
      if (here >= 0) sel = here;
    }
    const n = lms.length;
    const regionStep = (dir: 1 | -1): number => {
      const cur = lms[sel].map;
      for (let i = 1; i <= n; i++) {
        const j = (((sel + dir * i) % n) + n) % n;
        if (lms[j].map !== cur) {
          // land on the first landmark of that region
          let k = j;
          while (lms[(k - 1 + n) % n].map === lms[j].map && (k - 1 + n) % n !== j) k = (k - 1 + n) % n;
          return k;
        }
      }
      return sel;
    };
    while (true) {
      const k = await this.modal(() => this.draw_valley(sel));
      if (['left', 'a', 'h', 'btab'].includes(k)) sel = (sel - 1 + n) % n;
      else if (['right', 'd', 'l', 'tab'].includes(k)) sel = (sel + 1) % n;
      else if (['up', 'w', 'k'].includes(k)) sel = regionStep(-1);
      else if (['down', 's', 'j'].includes(k)) sel = regionStep(1);
      else if (OK_KEYS.has(k)) {
        const lm = lms[sel];
        this.map_pin = this.map_pin === lm.id ? null : lm.id;
        this.msg(this.map_pin ? `Pinned ${lm.name} on your map.` : 'Map pin cleared.', '0E');
      } else if (CANCEL_KEYS.has(k) || k === 'g' || k === 'G') return;
    }
  }

  /** Draw the Valley Map overlay: region boxes in their real arrangement, then the Almanac & legend. */
  draw_valley(sel: number): void {
    const lms = this.valley_landmarks();
    const s = this.scr;
    const [W, H] = [s.w, s.h];
    const mapHeader = W >= 54 ? `Valley Map — ${this.season_name}, Year ${this.year}` : 'Valley Map';
    s.box(0, 0, W, H, '09', '00', mapHeader, '07', { kind: 'hud', accent: '09' });
    const cw = Math.min(24, Math.floor((W - 2) / 4));
    const bw = cw - 1;
    const iw = bw - 2;
    const ox = 1 + Math.floor((W - 2 - cw * 4 + 1) / 2);
    const oy = 1;
    const regionH = 4;
    const at = (name: string): [number, number] => {
      const [c, r] = VALLEY_GRID[name];
      return [ox + c * cw, oy + r * regionH];
    };
    const picked = lms[sel];
    const curRegion = OUTDOOR_MAPS.includes(this.mapname) ? this.mapname : null;
    const glyphCol = (glyph: string): string => {
      if (glyph === '$' || glyph === '⚒') return '09';
      if (glyph === '♥' || glyph === '●' || glyph === '✿') return '0A';
      if (glyph === '♠' || glyph === '♣' || glyph === '▲') return '0B';
      if (glyph === '≈' || glyph === '☾') return '0C';
      return '0E';
    };
    const links = this.valley_links();
    for (const name of Object.keys(VALLEY_GRID)) {
      const m = this.maps[name];
      if (!m) continue;
      const [x, y] = at(name);
      const title = m.title.length <= iw ? m.title : (VALLEY_SHORT[name] || name).slice(0, iw);
      const hot = name === picked.map;
      s.box(
        x,
        y,
        bw,
        regionH,
        hot ? '0C' : name === curRegion ? '0C' : '03',
        '00',
        null,
        '07',
        { kind: 'hud', accent: hot || name === curRegion ? '0C' : undefined, fillBoard: hot },
      );
      s.put(x + 1, y + 1, title, hot ? '07' : name === curRegion ? '0C' : '05', '00', hot);
      const used = new Set<number>();
      const place = (wx: number) => {
        let gx = Math.round((wx * (iw - 1)) / Math.max(1, m.w - 1));
        for (let d = 0; d < iw; d++) {
          for (const c of [gx + d, gx - d]) {
            if (c >= 0 && c < iw && !used.has(c)) {
              used.add(c);
              return c;
            }
          }
        }
        return null;
      };
      for (const lm of lms.filter((l) => l.map === name)) {
        const gx = place(lm.x);
        if (gx === null) continue;
        const isSel = lm === picked;
        const pinned = lm.id === this.map_pin;
        s.put(x + 1 + gx, y + 2, lm.glyph, isSel ? '00' : pinned ? '0E' : glyphCol(lm.glyph), isSel ? '0D' : '00', isSel || pinned);
      }
      if (name === curRegion) {
        const gx = place(this.px);
        if (gx !== null) s.put(x + 1 + gx, y + 2, '@', '0C', '00', true);
      }
    }
    // Draw the trail into each card's frame, clear of the interior labels.
    const trail = (x: number, y: number, ch: string) => {
      s.put(x, y, ch, '09');
      s.tag(x, y, { t: 'ui', k: 'valley:link' });
    };
    for (const [a, neighbors] of Object.entries(links)) {
      for (const b of neighbors) {
        if (!(a in VALLEY_GRID) || !(b in VALLEY_GRID) || a > b) continue;
        const [[ax, ay], [bx, by]] = [at(a), at(b)];
        if (ay === by) {
          const x = Math.max(ax, bx);
          trail(x - 2, ay + 2, '├');
          trail(x - 1, ay + 2, '─');
          trail(x, ay + 2, '┤');
        } else if (ax === bx) {
          const x = ax + Math.floor(bw / 2);
          const y = Math.max(ay, by);
          trail(x, y - 1, '┬');
          trail(x, y, '┴');
        }
      }
    }
    // Almanac detail & landmark legend
    const region = this.maps[picked.map]?.title || picked.map;
    const f = this.forge_status();
    const r = this.pin_route();
    const pinWord = picked.id === this.map_pin ? 'unpin' : 'pin';
    const hintText = isCompact(W) ? `<> pick  ^v region  Enter ${pinWord}  Esc` : `Left/Right landmark  Up/Down region  Enter ${pinWord}  Esc close`;
    const top = oy + 4 * regionH;
    const room = H - 1 - top;

    if (W >= 74 && room >= 7) {
      const cardH = Math.min(8, room - 1);
      const leftW = Math.floor((W - 6) * 0.56);
      const rightX = 2 + leftW + 2;
      const rightW = W - 2 - rightX;
      s.box(2, top, leftW, cardH, '09', '00', `ALMANAC: ${region}`.slice(0, leftW - 4), '07', { kind: 'hud', accent: '09' });
      const info: [string, string, boolean][] = [
        [`▸ ${picked.glyph} ${picked.name}${picked.id === this.map_pin ? ' [pinned]' : ''}`, '07', true],
      ];
      if (picked.bid && HOURS[picked.bid] && picked.bid !== 'blacksmith') {
        info.push([this.shop_status(picked.bid).text, '05', false]);
      }
      info.push([`⚒ Forge [${f.open ? 'OPEN' : 'CLOSED'}] ${f.text}`, f.open ? '0B' : '08', false]);
      if (r) info.push([`★ Pin: ${r.landmark.glyph} ${r.landmark.name} — ${r.text}`, '0E', false]);
      info.push([lms.filter((l) => l.map === picked.map).map((l) => `${l.glyph} ${l.name}`).join(' · '), '04', false]);
      for (let i = 0; i < info.length && i < cardH - 2; i++) {
        const [txt, col, b] = info[i];
        s.put(4, top + 1 + i, txt.slice(0, leftW - 4), col, '00', b);
      }

      if (rightW >= 24) {
        s.box(rightX, top, rightW, cardH, '09', '00', 'LANDMARK LEGEND', '07', { kind: 'hud', accent: '09' });
        const leg = mapSymbolLegend();
        for (let i = 0; i < leg.length && i < cardH - 2; i++) {
          const item = leg[i];
          s.put(rightX + 2, top + 1 + i, item.glyph, item.col, '00', true);
          s.put(rightX + 4, top + 1 + i, `: ${item.name}`.slice(0, rightW - 6), '05');
        }
      }
      s.put(3, top + cardH, hintText.slice(0, W - 6), '04');
      return;
    }

    const lines: [string, string][] = [];
    lines.push([`> ${picked.glyph} ${picked.name}, ${region}${picked.id === this.map_pin ? '  [★ PIN]' : ''}`, '07']);
    if (picked.bid && HOURS[picked.bid] && picked.bid !== 'blacksmith') {
      const st = this.shop_status(picked.bid);
      lines.push([`  [${st.open ? 'OPEN' : 'CLOSED'}] ${st.text}`, '04']);
    }
    lines.push([`  ⚒ Forge [${f.open ? 'OPEN' : 'CLOSED'}] ${f.text}`, f.open ? '0B' : '08']);
    if (r) lines.push([`  ★ Pin: ${r.landmark.glyph} ${r.landmark.name}: ${r.text}`, '0E']);
    lines.push([`  ${mapSymbolLegend().slice(0, 5).map((l) => `${l.glyph}=${l.name.split('/')[0].trim()}`).join(' ')}`, '04']);
    lines.push([`  ${lms.filter((l) => l.map === picked.map).map((l) => `${l.glyph} ${l.name}`).join('  ')}`, '05']);
    const wrap = (items: [string, string][]) => items.flatMap(([text, col]) => wrapLines([text], W - 4).map((ln): [string, string] => [ln, col]));
    // the key hint always shows in full; the body drops its later lines (the region list first) when space runs out
    const hint = wrap([[`  ${hintText}`, '04']]);
    const body = wrap(lines).slice(0, Math.max(0, room - hint.length));
    [...body, ...hint].forEach(([text, col], i) => s.put(2, top + i, text.slice(0, W - 4), col));
  }

  draw_minimap(vw: number, vh: number): void {
    if (vw < 30 || vh < 12) return;
    const s = this.scr;
    const m = this.map;
    const gw = Math.min(19, vw - 4);
    const gh = Math.min(7, vh - 6);
    const bx = vw - gw - 3;
    const by = 2;
    if (bx < 0 || by + gh + 2 > s.h) return;
    const route = this.pin_route();
    // box() draws the title as ' title ' from two cells in, so it has gw - 3 cells before the corner
    const room = gw - 3;
    const pinTitle = route ? `${route.arrow} ${route.short}` : 'Map';
    const title = pinTitle.length > room ? pinTitle.slice(0, room - 1) + '…' : pinTitle;
    s.box(bx, by, gw + 2, gh + 2, '0C', '00', title, '07', { accent: '0C' });
    // Shrink both axes by the same factor. Interiors that fit stay 1:1.
    const scale = Math.min(1, gw / m.w, gh / m.h);
    const drawW = Math.max(1, Math.round(m.w * scale));
    const drawH = Math.max(1, Math.round(m.h * scale));
    const offX = Math.floor((gw - drawW) / 2);
    const offY = Math.floor((gh - drawH) / 2);
    const isWater = (t: string) => t === 'water' || t === 'fountain' || t === 'spring' || t === 'pond';
    const glyph = (tx: number, ty: number, t: string): [string, string, string | null] => {
      if (t === 'void') return [' ', '00', null];
      if (t === 'path' || t === 'bridge') return ['·', '05', 'minimap:path'];
      if (this.mapname === 'farm') {
        const pk = pkey(tx, ty);
        if (this.tilled.has(pk)) {
          const c = this.crops[pk];
          if (c) {
            const d = CROPS[c[0]];
            if (d && c[1] >= d[2]) return ['*', '0A', 'minimap:crop_ripe'];
            return ['•', '0B', 'minimap:crop'];
          }
          return ['=', '09', 'minimap:soil'];
        }
      }
      if (isWater(t)) return ['≈', '0A', 'minimap:water'];
      if (t === 'tree') return ['♣', '0B', 'minimap:tree'];
      if (t === 'field') return ['▒', '04', 'minimap:field'];
      if (t === 'cliff') return ['▲', '08', 'minimap:cliff'];
      if (t === 'door' || t === 'exit') return ['+', '09', 'minimap:door'];
      if (t === 'roof' || t === 'wall' || t === 'iwall' || t === 'mwall') return ['▮', '09', 'minimap:roof'];
      if (t === 'flower') return ['*', '0A', 'minimap:ground'];
      return ['·', '02', 'minimap:ground'];
    };
    // Sample the whole footprint so thin roads and the edges of ponds survive shrinking.
    const terrain = (left: number, top: number, right: number, bottom: number, center: string) => {
      let water = 0;
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const t = m.t[y][x];
          if (t === 'path' || t === 'bridge') return 'path';
          if (isWater(t)) water++;
        }
      }
      return water * 3 >= (right - left) * (bottom - top) ? 'water' : center;
    };
    for (let gy = 0; gy < drawH; gy++) {
      const top = Math.ceil((gy * m.h) / drawH);
      const bottom = Math.ceil(((gy + 1) * m.h) / drawH);
      const ty = Math.floor((top + bottom - 1) / 2);
      for (let gx = 0; gx < drawW; gx++) {
        const left = Math.ceil((gx * m.w) / drawW);
        const right = Math.ceil(((gx + 1) * m.w) / drawW);
        const tx = Math.floor((left + right - 1) / 2);
        const tile = terrain(left, top, right, bottom, m.t[ty][tx]);
        const [ch, col, mk] = glyph(tx, ty, tile);
        const sx = bx + 1 + offX + gx;
        const sy = by + 1 + offY + gy;
        s.put(sx, sy, ch, col, '00');
        if (mk) s.tag(sx, sy, { t: 'ui', k: mk });
      }
    }
    const mark = (wx: number, wy: number, ch: string, col: string, mk: string) => {
      if (!m.inb(wx, wy)) return;
      const gx = offX + Math.floor((wx * drawW) / m.w);
      const gy = offY + Math.floor((wy * drawH) / m.h);
      const sx = bx + 1 + gx;
      const sy = by + 1 + gy;
      s.put(sx, sy, ch, col, '00', true);
      s.tag(sx, sy, { t: 'ui', k: mk });
    };
    for (const k of Object.keys(m.doors)) {
      mark(...parseCoordKey(k), '+', '09', 'minimap:door');
    }
    for (const [n, [x, y]] of Object.entries(this.npc_pos)) {
      if (NPCS[n]?.where?.[0] === this.mapname) mark(x, y, 'o', '0C', 'minimap:npc');
    }
    if (!m.indoor) {
      for (const { mid, inward: [dx, dy] } of edgeEntrances(m)) {
        const arrow = dx > 0 ? '<' : dx < 0 ? '>' : dy > 0 ? '^' : 'v';
        mark(...mid, arrow, '0C', 'minimap:exit');
      }
    }
    if (route?.cell) {
      const [ex, ey] = route.cell;
      mark(ex, ey, route.arrow, '0E', 'minimap:pin');
    }
    mark(this.px, this.py, '@', '0D', 'minimap:player');
  }

  /**
   * Compact layout status line, drawn into the divider row: tool (+cost, can level or seed
   * bags), stamina bar, and fatigue/held item when there is room.
   */
  draw_status(y: number, W: number): void {
    const s = this.scr;
    const t = this.tool;
    const preview = this.action_preview();
    const action = this.context_action();
    const facing = this.facing_action();
    let x = 1;
    const seg = (text: string, fg: string, bold = false): boolean => {
      if (x + text.length > W - 1) return false;
      s.put(x, y, text, fg, '00', bold);
      // tag as UI so the divider pass doesn't turn hyphens ("-2st") into rule lines
      for (let i = 0; i < text.length; i++) if (text[i] !== ' ') s.tag(x + i, y, { t: 'ui' });
      x += text.length;
      return true;
    };
    const idx = TOOLS.includes(t) ? `[${TOOLS.indexOf(t) + 1}] ` : '';
    s.ctx?.icons.push({ x, y, icon: 'tool' });
    seg(' ', '02');
    const signX = x;
    if (seg(`${idx}${t} `, '07', true)) {
      for (let i = signX; i < x; i++) s.tag(i, y, { t: 'ui', k: 'hud:sign' });
    }
    if (t === 'Watering Can') seg(`${this.water}/${CAN_CAP[this.levels[t] || 0]} `, '0D');
    else if (t.endsWith(' Seeds')) {
      const crop = t.slice(0, -6);
      const ok = crop === 'Grass' || CROPS[crop]?.[0] === this.season_name;
      seg(`x${this.inv[t] || 0}${ok ? '' : ' off-season'} `, ok ? '0B' : '08');
    }
    if (preview.cost > 0) seg(`-${preview.cost}st${preview.faint ? '!' : ''} `, preview.faint ? '08' : '03');
    const compactFacing = facing.summary.length > 13 ? action.label : facing.summary;
    const num = ` ${this.stamina}/${this.max_stamina}`;
    // the stamina read-out has priority: the facing hint only gets what is left of the row
    if (compactFacing && !this.modal_depth && x + compactFacing.length + 1 + num.length + 9 < W) {
      seg(` ${compactFacing} `, '0E');
    }
    x += 1;
    const frac = this.stamina / this.max_stamina;
    const col = frac > 0.5 ? '0B' : frac > 0.2 ? '09' : '08';
    const bw = Math.max(4, Math.min(10, W - x - num.length - 9));
    const filled = Math.round(frac * bw);
    s.ctx?.icons.push({ x, y, icon: 'stamina' });
    seg(' ', '02');
    s.put(x, y, '#'.repeat(filled), col, '00', true);
    s.put(x + filled, y, '.'.repeat(bw - filled), '01');
    for (let i = 0; i < bw; i++) s.tag(x + i, y, { t: 'ui', k: i < filled ? 'bar' : 'bar:empty' });
    x += bw;
    seg(`${num} `, col);
    const hasTruthGem = Boolean(this.inv['Gem of Truth'] || this.truth_jewels >= 9);
    if (hasTruthGem || this.fatigue >= 50) {
      x += 1;
      seg(` Fatg ${this.fatigue} `, this.fatigue < 50 ? '0C' : this.fatigue < 80 ? '09' : '08');
    }
    const bCount = getBasketTotal(this.basket);
    const held = this.held === 'Basket' ? `Basket ${bCount}/${BASKET_CAPACITY}` : this.held ? `${this.held} x${this.inv[this.held] || 0}` : '';
    if (held) {
      x += 1;
      if (!seg(` ${held} `, '0A')) seg(` ${held.slice(0, Math.max(0, W - x - 3))} `, '0A');
    }
  }

  draw_side(x: number, y: number, w: number, hints = true): void {
    const s = this.scr;
    const sn = this.season_name;
    s.put(x, y, 'H R V S T M N', SEASON_COL[sn], '00', true);
    s.put(x, y + 1, `${this.name} of ${this.farm} Farm`.slice(0, w), '04');
    y += 3;

    const t = this.tool;
    const preview = this.action_preview();
    const facing = this.facing_action();
    const costTxt = preview.cost > 0 ? `-${preview.cost}st` : '';
    const icon = (iy: number, kind: 'stamina' | 'fatigue' | 'gold' | 'bin' | 'tool') => s.ctx?.icons.push({ x: x - 1, y: iy, icon: kind });
    icon(y, 'tool');
    s.put(x, y, 'Tool', '02');
    const idx = TOOLS.includes(t) ? `[${TOOLS.indexOf(t) + 1}] ` : '    ';
    s.put(x + 6, y, (idx + t).slice(0, Math.max(4, w - 6 - costTxt.length - 1)), '07', '00', true);
    if (costTxt) s.put(x + w - costTxt.length, y, costTxt, preview.faint ? '08' : '03');
    y += 1;
    if (UPGRADABLE.includes(t)) {
      const lvl = this.levels[t] || 0;
      const exp = this.tool_exp[t] || 0;
      s.put(x + 6, y, `${LEVELS[lvl]} (${exp}%)`, LEVEL_COL[lvl]);
      if (t === 'Watering Can') {
        s.put(x + 19, y, `${this.water}/${CAN_CAP[lvl]}`, '0D');
      }
      if (preview.faint) s.put(x + w - 1, y, '!', '08', '00', true);
    } else if (t.endsWith(' Seeds')) {
      const crop = t.slice(0, -6);
      const ok = crop === 'Grass' || CROPS[crop]?.[0] === sn;
      s.put(x + 6, y, `x${this.inv[t] || 0} bags`, ok ? '0B' : '08');
      if (!ok) {
        s.put(x + 15, y, '(off-season)', '08');
      }
    }
    y += 1;
    s.put(x, y, 'Facing', '02');
    s.put(x + 7, y, facing.summary.slice(0, Math.max(0, w - 7)), '0E');
    y += 1;
    if (this.upgrading) {
      s.put(x, y, `Forge: ${this.upgrading[0]}`.slice(0, w), '02');
    } else if (this.riding_horse) {
      s.put(x, y, 'Riding Horse (2x speed)', '09');
    }
    y += 1;

    s.put(x, y, 'Held', '02');
    const bCount = getBasketTotal(this.basket);
    const held =
      this.held === 'Basket'
        ? `Basket (${bCount}/${BASKET_CAPACITY})`
        : this.held
          ? `${this.held} x${this.inv[this.held] || 0}`
          : bCount > 0
            ? `Basket: ${bCount}/${BASKET_CAPACITY}`
            : '-';
    s.put(x + 6, y, held.slice(0, w - 6), this.held ? '0A' : bCount > 0 ? '09' : '02');
    y += 2;

    // Stamina Bar + Numerical readout
    const frac = this.stamina / this.max_stamina;
    const col = frac > 0.5 ? '0B' : frac > 0.2 ? '09' : '08';
    const bw = Math.max(6, w - 14);
    const filled = Math.round(frac * bw);
    icon(y, 'stamina');
    s.put(x, y, 'Stam', '02');
    s.put(x + 5, y, '#'.repeat(filled), col, '00', true);
    s.put(x + 5 + filled, y, '.'.repeat(bw - filled), '01');
    for (let i = 0; i < bw; i++) s.tag(x + 5 + i, y, { t: 'ui', k: i < filled ? 'bar' : 'bar:empty' });
    s.put(x + 6 + bw, y, `${this.stamina}/${this.max_stamina}`, col);
    y += 1;

    // Fatigue Bar + Berries
    const hasTruthGem = Boolean(this.inv['Gem of Truth'] || this.truth_jewels >= 9);
    const fatCol = this.fatigue < 50 ? '0C' : this.fatigue < 80 ? '09' : '08';
    icon(y, 'fatigue');
    s.put(x, y, 'Fatg', '02');
    s.put(
      x + 5,
      y,
      `${this.fatigue}/100  Berries:${this.power_berries}${this.has_mystic_berry ? '+B' : ''}${hasTruthGem ? ' ★Truth' : ''}`.slice(0, w - 5),
      fatCol
    );
    y += 2;

    icon(y, 'gold');
    s.put(x, y, 'Gold', '02');
    s.put(x + 6, y, `${this.gold}G`, '09', '00', true);
    y += 1;
    const binv = py_sum(
      Object.entries(this.bin).map(([i, q]) => (ITEMS[i] ? ITEMS[i][0] : 0) * q)
    );
    icon(y, 'bin');
    s.put(x, y, 'Bin', '02');
    s.put(x + 6, y, `${binv}G (5PM pickup)`, binv ? '09' : '02');
    y += 1;

    if (this.chickens) {
      s.put(x, y, 'Coop', '02');
      s.put(x + 6, y, `${this.chickens} hens, ${this.eggs} eggs`, '07');
      y += 1;
    }
    if (this.animals.length) {
      const hungry = this.animals.filter((a) => !a.fed).length;
      s.put(x, y, 'Barn', '02');
      s.put(
        x + 6,
        y,
        `${this.animals.length} head${hungry ? `, ${hungry} hungry` : ', all fed'}`.slice(0, w - 6),
        hungry ? '08' : '07'
      );
      y += 1;
    }

    y += 1;
    const help_lines = [
      ['SPC', 'use tool'],
      ['X', 'act / talk'],
      ['TAB', 'next tool'],
      ['I/M', 'bag / memo'],
      ['Y/R', 'today / notes'],
      ['⇧H', 'horse  B bell'],
      ['ESC', 'diary/save'],
      ['?', 'help'],
    ];
    for (const [k, d] of help_lines) {
      if (!hints || y >= s.h - 4) break;
      s.put(x, y, k, '0D', '00', true);
      s.put(x + 4, y, d, '02');
      y += 1;
    }
  }

  draw_msgs(y0: number): void {
    const cols = ['02', '03', null];
    const count = Math.min(3, this.scr.h - y0);
    if (count <= 0) return;
    const recent = this.msgs.slice(-count);
    const enhanced = this.scr.style === 'enhanced';
    if (isCompact(this.scr.w)) {
      // Narrow screens wrap messages instead of cutting them off; the newest always shows.
      const lines = fitMessages(recent.map(([text]) => text), this.scr.w - 2, count);
      const newest = lines.findIndex(({ age }) => age === 0);
      lines.forEach(({ text, age }, i) => {
        const fg = age === 0 ? recent[recent.length - 1][1] : age === 1 ? cols[1]! : cols[0]!;
        this.scr.put(1, y0 + i, text, fg);
      });
      // no column to spare on a phone: the bullet takes the blank left margin
      if (enhanced && newest >= 0) this.scr.ctx?.icons.push({ x: 0, y: y0 + newest, icon: 'note' });
      return;
    }
    const x0 = enhanced ? 3 : 1;
    for (let i = 0; i < recent.length; i++) {
      const [text, col] = recent[i];
      const age = recent.length - 1 - i;
      const fg = age === 0 ? col : age === 1 ? cols[1]! : cols[0]!;
      this.scr.put(x0, y0 + i, text.slice(0, this.scr.w - x0 - 1), fg);
      if (enhanced && age === 0) this.scr.ctx?.icons.push({ x: 1, y: y0 + i, icon: 'note' });
    }
  }

  draw_title(): void {
    const s = this.scr;
    const [W, H] = [s.w, s.h];
    const lw = LOGO[0].length;
    const x0 = Math.max(0, Math.floor((W - lw) / 2));
    const cols = ['0A', '0E', '0D', '0C', '0B'];
    s.scene = 'title';
    for (let i = 0; i < LOGO.length; i++) {
      s.put(x0, 2 + i, LOGO[i], cols[i], '00', true);
      for (let j = 0; j < LOGO[i].length; j++) if (LOGO[i][j] !== ' ') s.tag(x0 + j, 2 + i, { t: 'ui', k: 'logo' });
    }
    const sub = fitText(W, '~ a farming tale in ASCII ~', '~ a farming tale ~');
    s.put(Math.max(0, Math.floor((W - sub.length) / 2)), 8, sub, '04');
    const scene_y = 10;
    const hillsFull = '   T   T  .-^-.   T   [Hot Spring]   T   .-^-.   T   ';
    const hills = fitText(W, hillsFull, hillsFull.trim());
    s.put(Math.max(0, Math.floor((W - hills.length) / 2)), scene_y, hills, '0B');
    const field = ' o * j o Y * o v d o * j O o * A o v * o j ';
    const fx = Math.max(0, Math.floor((W - field.length) / 2));
    const palette = ['07', '08', '0B', '09', '0E', '0A'];
    for (let i = 0; i < field.length; i++) {
      const ch = field[i];
      s.put(fx + i, scene_y + 1, ch, ch !== ' ' ? palette[i % palette.length] : '00', '00', true);
    }
    for (let i = 0; i < field.length; i++) {
      s.put(fx + i, scene_y + 2, fencePost(i, field.length) ? '╪' : '═', '09');
      s.tag(fx + i, scene_y + 2, { t: 'ui', k: 'hud:fence' });
    }
    const tag = fitText(
      W,
      'A Quiet Valley of Seasons, Crops & Old Friends',
      'Seasons, Crops & Old Friends',
    );
    s.put(Math.max(0, Math.floor((W - tag.length) / 2)), H - 2, tag, '04');
  }

  async modal(draw: () => void): Promise<string> {
    this.modal_depth += 1;
    try {
      while (true) {
        if (!this.running) throw new EngineStopped();
        this.render();
        draw();
        this.scr.flush();
        const k = await this.scr.getKey(0.25);
        if (k) {
          this.last = Date.now() / 1000;
          return k;
        }
      }
    } finally {
      this.modal_depth = Math.max(0, this.modal_depth - 1);
    }
  }

  async say(text: string, who: string | null = null): Promise<void> {
    const [W, H] = [this.scr.w, this.scr.h];
    const divX = this.scr.ctx?.divX ?? W;
    const paneW = !isCompact(W) && divX < W && divX >= 40 ? divX : W; // keep the box over the map, off the side panel
    const bw = Math.min(paneW - 4, 74);
    const lines: string[] = [];
    for (const para of String(text).split('\n')) {
      lines.push(...(py_wrap(para, bw - 4) || ['']));
    }
    const pages: string[][] = [];
    for (let i = 0; i < lines.length; i += 3) {
      pages.push(lines.slice(i, i + 3));
    }
    let title: string | null = null;
    let tcol = '07';
    let hearts: [string, string] | null = null;
    let boxStyle: BoxStyle | undefined;
    if (who && who in NPCS) {
      title = `● ${who}`;
      tcol = NPCS[who].col;
      hearts = [getHeartInfo(this.friend[who] || 0).bar, getHeartInfo(this.friend[who] || 0).color];
      boxStyle = { kind: 'npc', accent: NPCS[who].col };
    } else if (who && /(TV|Channel|Cooking Show|Variety|Life on the Farm)/i.test(who)) {
      title = `▣ ${who}`;
      tcol = '0C';
      boxStyle = { kind: 'tv', accent: '0C' };
    } else if (who && /(Wellkeeper|Festival|Heart Event|Rival Event)/i.test(who)) {
      title = `✦ ${who}`;
      tcol = '0B';
      boxStyle = { kind: 'fest', accent: '0B' };
    } else if (who === 'Shipping Bin') {
      title = `▣ ${who}`;
      tcol = '09';
      boxStyle = { kind: 'system', accent: '09' };
    } else if (who) {
      title = who;
      boxStyle = { kind: 'system', accent: '0D' };
    }
    for (const page of pages) {
      const draw = () => {
        const [bx, by] = [Math.floor((paneW - bw) / 2), H - 8];
        this.scr.box(bx, by, bw, 6, '0D', '00', title || undefined, tcol, boxStyle);
        if (hearts && title) {
          const hx = bx + title.length + 5;
          const room = bx + bw - 2 - hx;
          if (room >= 4) {
            this.scr.put(hx, by, hearts[0].slice(0, room), hearts[1]);
          }
        }
        for (let i = 0; i < page.length; i++) {
          this.scr.put(bx + 2, by + 1 + i, page[i], '06');
        }
        if (Math.floor((Date.now() / 1000) * 2) % 2) {
          this.scr.put(bx + bw - 3, by + 4, 'v', '0A', '00', true);
        }
      };
      await this.modal(draw);
    }
  }

  async show_lines(title: string, lines: string[]): Promise<void> {
    const pageSize = Math.max(4, this.scr.h - 5);
    const pages: string[][] = [];
    for (let i = 0; i < lines.length; i += pageSize) {
      pages.push(lines.slice(i, i + pageSize));
    }
    if (!pages.length) pages.push([]);
    await this.show_pages(title, pages);
  }

  private hud_rect(bw: number, bh: number, alignToMap = false, yOverride: number | null = null): [number, number] {
    const [W, H] = [this.scr.w, this.scr.h];
    const divX = this.scr.ctx?.divX ?? W;
    const divY = this.scr.ctx?.divY ?? H;
    const regionW = alignToMap && !isCompact(W) && divX < W && bw <= divX - 2 ? divX : W;
    const bx = Math.max(0, Math.floor((regionW - bw) / 2));
    const regionH = divY < H && bh <= divY - 2 ? divY : H;
    const by = yOverride !== null ? yOverride : Math.max(1, Math.min(H - bh - 1, Math.floor((regionH - bh) / 2)));
    return [bx, by];
  }

  private draw_hud_fence(bx: number, ry: number, bw: number): void {
    const inner = bw - 2;
    for (let i = 0; i < inner; i++) {
      const ch = i > 0 && i < inner - 1 && fencePost(i, inner) ? '╪' : '═';
      this.scr.put(bx + 1 + i, ry, ch, '01');
      this.scr.tag(bx + 1 + i, ry, { t: 'ui', k: 'hud:fence' });
    }
  }

  async show_pages(title: string, pages: string[][]): Promise<void> {
    const [W, H] = [this.scr.w, this.scr.h];
    if (!pages.length) pages.push([]);
    if (isCompact(W)) pages = reflowPages(pages, W - 6, Math.max(4, H - 5));
    const maxLn = Math.max(
      title.length + 6,
      ...pages.flat().map((ln) => ln.length + 4),
    );
    const bw = Math.min(W - 2, maxLn);
    let p = 0;
    while (p < pages.length) {
      const page = pages[p];
      const bh = Math.min(H - 2, page.length + 3);
      const pageTitle = pages.length > 1 ? `${title} (${p + 1}/${pages.length})` : title;
      const draw = () => {
        const [bx, by] = this.hud_rect(bw, bh, false);
        this.scr.box(bx, by, bw, bh, '09', '00', pageTitle.slice(0, bw - 4), '07', { kind: 'hud', accent: '09' });
        for (let i = 0; i < page.length; i++) {
          this.scr.put(bx + 2, by + 1 + i, page[i].slice(0, bw - 4), '05');
        }
        const foot = pages.length > 1 ? '[←/→] Page · [Esc] Close' : 'press any key — close';
        this.scr.put(bx + 2, by + bh - 2, foot.slice(0, bw - 4), '04');
      };
      const k = await this.modal(draw);
      if (k === 'esc' || k === 'q' || k === 'ctrl-c') return;
      if (pages.length > 1 && (k === 'left' || k === 'a' || k === 'backspace')) {
        p = Math.max(0, p - 1);
      } else {
        p++;
      }
    }
  }

  async show_hud_pages(
    title: string,
    buildPages: (contentW: number, pageMax: number) => HudPageLine[][],
    opts?: { style?: BoxStyle; alignToMap?: boolean; minWidth?: number; maxWidth?: number; footerHint?: string },
  ): Promise<void> {
    let p = 0;
    while (true) {
      const [W, H] = [this.scr.w, this.scr.h];
      const divX = this.scr.ctx?.divX ?? W;
      const divY = this.scr.ctx?.divY ?? H;
      const regionW = opts?.alignToMap && !isCompact(W) && divX < W ? divX : W;
      const bw = Math.min(regionW - 2, Math.max(title.length + 12, Math.min(opts?.maxWidth ?? 56, Math.max(opts?.minWidth ?? 46, regionW - 4))));
      const contentW = Math.max(20, bw - 4);
      const availH = Math.min(H - 2, divY < H ? Math.max(10, divY) : H - 2);
      const pageMax = Math.max(4, availH - 4); // top/bottom frame + footer fence + footer hint
      const pages = buildPages(contentW, pageMax);
      if (p >= pages.length) return;
      const page = pages[p];
      const bh = Math.min(H - 2, page.length + 4);
      const pageTitle = pages.length > 1 ? `${title} (${p + 1}/${pages.length})` : title;
      const draw = () => {
        const [bx, by] = this.hud_rect(bw, bh, !!opts?.alignToMap);
        this.scr.box(bx, by, bw, bh, '09', '00', pageTitle.slice(0, bw - 4), '07', opts?.style ?? { kind: 'hud' });
        for (let i = 0; i < page.length; i++) {
          const ry = by + 1 + i;
          const row = page[i];
          if (row.kind === 'fence') {
            this.draw_hud_fence(bx, ry, bw);
          } else if (row.kind === 'ledger') {
            const pfx = row.prefix ? `${row.prefix} ` : '';
            const maxLeft = Math.max(6, contentW - row.value.length - 2 - pfx.length);
            const lbl = row.label.length > maxLeft ? row.label.slice(0, maxLeft - 1) + '…' : row.label;
            let cx = bx + 2;
            if (pfx) {
              this.scr.put(cx, ry, pfx, row.prefixCol || '0C', '00', true);
              cx += pfx.length;
            }
            this.scr.put(cx, ry, lbl, row.labelCol || '05', '00', !!row.labelBold);
            const leftEnd = cx + lbl.length;
            const valClip = row.value.slice(0, Math.max(1, bx + bw - 2 - leftEnd - 1));
            const rightStart = bx + bw - 2 - valClip.length;
            if (rightStart - leftEnd >= 3) {
              this.scr.put(leftEnd + 1, ry, '·'.repeat(rightStart - leftEnd - 2), '01');
            }
            this.scr.put(rightStart, ry, valClip, row.valueCol || '05', '00', true);
          } else {
            let cx = bx + 2;
            const limit = bx + bw - 2;
            for (const sp of row.spans) {
              if (cx >= limit) break;
              const txt = sp.text.slice(0, limit - cx);
              this.scr.put(cx, ry, txt, sp.fg || '05', '00', !!sp.bold);
              cx += txt.length;
            }
          }
        }
        this.draw_hud_fence(bx, by + bh - 3, bw);
        const leftFoot = opts?.footerHint ?? (pages.length > 1 ? '[←/→] Page · [Space] Next' : 'Any key — Close');
        const rightFoot = pages.length > 1 ? '[ESC] Close' : '';
        this.scr.put(bx + 2, by + bh - 2, leftFoot.slice(0, contentW - rightFoot.length - 1), '04');
        if (rightFoot) {
          this.scr.put(bx + bw - 2 - rightFoot.length, by + bh - 2, rightFoot, '0C', '00', true);
        }
      };
      const k = await this.modal(draw);
      if (k === 'esc' || k === 'q' || k === 'ctrl-c') return;
      if (pages.length > 1 && (k === 'left' || k === 'a' || k === 'backspace')) {
        p = Math.max(0, p - 1);
      } else {
        p++;
      }
    }
  }

  async menu(
    title: string,
    opts: string[],
    sel: number = 0,
    info: ((s: number) => string[]) | string[] | null = null,
    y: number | null = null,
    cfg?: HudMenuCfg,
  ): Promise<number | null> {
    const n = opts.length;
    if (n === 0) return null;
    while (true) {
      const boxStyle: BoxStyle = cfg?.style ?? { kind: 'hud', accent: '09' };
      const isHud = boxStyle.kind === 'hud';
      const draw = () => {
        const [W, H] = [this.scr.w, this.scr.h];
        const info_raw = typeof info === 'function' ? info(sel) : info || [];
        const info_lines = isCompact(W) ? wrapLines(info_raw, W - 6) : info_raw;
        const hasBanner = !!cfg?.banner;
        const hasFooter = !!cfg?.footerHint;
        const bannerRows = hasBanner ? 2 : 0;
        const footerRows = hasFooter ? 2 : 0;
        const maxvis = Math.max(3, H - 6 - bannerRows - footerRows - (info_lines.length ? info_lines.length + 1 : 0));
        const vis = Math.min(n, maxvis);
        const top = clamp(sel - Math.floor(vis / 2), 0, Math.max(0, n - vis));
        const divX = this.scr.ctx?.divX ?? W;
        const mapLimit = cfg?.alignToMap && !isCompact(W) && divX < W ? divX - 2 : W - 2;
        const bannerData = cfg?.banner ? cfg.banner() : null;
        const entryW = cfg?.entries
          ? Math.max(...cfg.entries.map((e) => (e.icon ? 2 : 0) + e.label.length + (e.right ? e.right.length + 4 : 0) + 7))
          : 0;
        const bannerW = bannerData ? bannerData.left.length + (bannerData.right?.length || 0) + 7 : 0;
        const footerW = cfg?.footerHint ? cfg.footerHint.length + 6 : 0;
        const w = Math.min(
          mapLimit,
          Math.max(
            title.length + 8,
            entryW,
            bannerW,
            footerW,
            ...opts.map((o) => o.length + 7),
            ...info_lines.map((ln) => ln.length + 4)
          )
        );
        const bh = vis + 2 + bannerRows + footerRows + (info_lines.length ? info_lines.length + 1 : 0);
        const enhanced = this.scr.style === 'enhanced';
        const [bx, by] = cfg?.alignToMap
          ? this.hud_rect(w, bh, true, y)
          : [Math.floor((W - w) / 2), y !== null ? Math.min(y, Math.max(1, H - bh)) : Math.max(1, Math.floor((H - bh) / 2))];
        this.scr.box(bx, by, w, bh, isHud ? '09' : '0D', '00', title, '07', boxStyle);
        if (bannerData) {
          const bRight = bannerData.right || '';
          const bLeft = bannerData.left.slice(0, Math.max(4, w - 5 - bRight.length));
          this.scr.put(bx + 2, by + 1, bLeft, bannerData.leftCol || '0C', '00', true);
          if (bRight) {
            this.scr.put(bx + w - 2 - bRight.length, by + 1, bRight, bannerData.rightCol || '09', '00', true);
          }
          this.draw_hud_fence(bx, by + 2, w);
        }
        const listY = by + 1 + bannerRows;
        const padRight = n > vis ? 3 : 2;
        for (let i = 0; i < vis; i++) {
          const j = top + i;
          const ry = listY + i;
          const active = j === sel;
          const rowBg = active ? '0D' : '00';
          const entry = cfg?.entries?.[j];
          if (entry) {
            this.scr.put(bx + 1, ry, ' '.repeat(w - 2), active ? '00' : '05', rowBg, active);
            this.scr.put(bx + 2, ry, active ? '>' : ' ', active ? '00' : '03', rowBg, active);
            let cx = bx + 4;
            if (entry.icon) {
              const iconFg = active ? (enhanced ? entry.iconCol || '0C' : '00') : entry.iconCol || '04';
              this.scr.put(cx, ry, entry.icon, iconFg, rowBg, active);
              cx += 2;
            }
            const rightStr = entry.right || '';
            const rightStart = bx + w - padRight - rightStr.length;
            const maxLabelW = Math.max(4, (rightStr ? rightStart - 2 : bx + w - padRight) - cx);
            const lbl = entry.label.length > maxLabelW ? entry.label.slice(0, maxLabelW - 1) + '…' : entry.label;
            const lblFg = active ? (enhanced ? '07' : '00') : '05';
            this.scr.put(cx, ry, lbl, lblFg, rowBg, active);
            if (rightStr) {
              const labelEnd = cx + lbl.length;
              if (rightStart - labelEnd >= 3) {
                const dotFg = active ? (enhanced ? '03' : '00') : '01';
                this.scr.put(labelEnd + 1, ry, '·'.repeat(rightStart - labelEnd - 2), dotFg, rowBg, false);
              }
              const rFg = active ? (enhanced ? entry.rightCol || '0C' : '00') : entry.rightCol || '04';
              this.scr.put(rightStart, ry, rightStr, rFg, rowBg, active);
            }
          } else if (active) {
            this.scr.put(bx + 1, ry, (' > ' + opts[j]).slice(0, w - 2).padEnd(w - 2), '00', '0D', true);
          } else {
            this.scr.put(bx + 1, ry, ('   ' + opts[j]).slice(0, w - 2), '05');
          }
        }
        if (top > 0) {
          this.scr.put(bx + w - 2, listY, '^', '0C', '00', true);
        }
        if (top + vis < n) {
          this.scr.put(bx + w - 2, listY + vis - 1, 'v', '0C', '00', true);
        }
        let nextY = listY + vis;
        if (info_lines.length) {
          if (isHud) this.draw_hud_fence(bx, nextY, w);
          else this.scr.put(bx + 1, nextY, '-'.repeat(w - 2), '01');
          for (let i = 0; i < info_lines.length; i++) {
            this.scr.put(bx + (isHud ? 2 : 1), nextY + 1 + i, info_lines[i].slice(0, w - (isHud ? 4 : 2)), isHud ? '05' : '04');
          }
          nextY += 1 + info_lines.length;
        }
        if (cfg?.footerHint) {
          this.draw_hud_fence(bx, nextY, w);
          this.scr.put(bx + 2, nextY + 1, cfg.footerHint.slice(0, w - 4), '04');
        }
      };
      const k = await this.modal(draw);
      if (['up', 'w', 'k'].includes(k)) {
        sel = ((sel - 1) % n + n) % n;
      } else if (['down', 's', 'j', 'tab'].includes(k)) {
        sel = (sel + 1) % n;
      } else if (OK_KEYS.has(k)) {
        return sel;
      } else if (CANCEL_KEYS.has(k)) {
        return null;
      } else if (cfg?.entries) {
        const hk = cfg.entries.findIndex((e) => e.hotkey && e.hotkey === k);
        if (hk >= 0) return hk;
      }
      if (!cfg?.noDigits && k.length === 1 && /^\d$/.test(k) && 1 <= Number(k) && Number(k) <= Math.min(n, 9)) {
        return Number(k) - 1;
      }
    }
  }

  async confirm(question: string, defaultNo = false): Promise<boolean> {
    return (await this.menu(question, ['Yes', 'No'], defaultNo ? 1 : 0)) === 0;
  }

  async ask_qty(prompt: string, maxq: number, price: number | null = null, label: string = 'Total'): Promise<number> {
    if (maxq <= 0) return 0;
    let q = 1;
    while (true) {
      const [W, H] = [this.scr.w, this.scr.h];
      const bw = Math.max(prompt.length + 8, 46);
      const draw = () => {
        const [bx, by] = [Math.floor((W - bw) / 2), Math.floor(H / 2) - 3];
        this.scr.box(bx, by, bw, 6, '09', '00', prompt, '07', { kind: 'hud', accent: '09' });
        this.scr.put(bx + 3, by + 2, `<  ${q}  >`, '07', '00', true);
        this.scr.put(bx + 16, by + 2, `of ${maxq}`, '04');
        if (price) {
          this.scr.put(bx + 26, by + 2, `${label}: ${q * price}G`, '09');
        }
        this.scr.put(bx + 3, by + 4, 'left/right +-1  up/down +-10  enter', '04');
      };
      const k = await this.modal(draw);
      if (['left', 'a', 'h'].includes(k)) {
        q = q > 1 ? q - 1 : maxq;
      } else if (['right', 'd', 'l'].includes(k)) {
        q = q < maxq ? q + 1 : 1;
      } else if (['up', 'w', 'k'].includes(k)) {
        q = Math.min(maxq, q + 10);
      } else if (['down', 's', 'j'].includes(k)) {
        q = Math.max(1, q - 10);
      } else if (OK_KEYS.has(k)) {
        return q;
      } else if (CANCEL_KEYS.has(k)) {
        return 0;
      }
    }
  }

  async text_input(prompt: string, py_default: string = '', max: number = 12): Promise<string> {
    this.typing = true;
    this.onTyping?.();
    try {
      return await this.read_text(prompt, py_default, max);
    } finally {
      this.typing = false;
    }
  }

  async read_text(prompt: string, py_default: string = '', max: number = 12): Promise<string> {
    let text = '';
    while (true) {
      const [W] = [this.scr.w, this.scr.h];
      const draw = () => {
        const bw = 44;
        const [bx, by] = [Math.floor((W - bw) / 2), 15];
        this.scr.box(bx, by, bw, 5, '09', '00', prompt, '07', { kind: 'hud', accent: '09' });
        this.scr.put(bx + 2, by + 2, '▸', '0C', '00', true);
        this.scr.put(
          bx + 4,
          by + 2,
          text + (Math.floor((Date.now() / 1000) * 2) % 2 ? '_' : ' '),
          '07',
          '00',
          true
        );
        if (!text) {
          this.scr.put(bx + 5, by + 2, py_default, '03');
        }
        this.scr.put(bx + 2, by + 3, `Type, then Enter (blank = ${py_default})`, '04');
      };
      const k = await this.modal(draw);
      if (k === 'enter') {
        return text.trim() || py_default;
      }
      if (k === 'backspace') {
        text = text.slice(0, -1);
      } else if (k === 'space' && text.length < max) {
        text += ' ';
      } else if (k === 'esc' || k === 'ctrl-c') {
        return py_default;
      } else if (k.length === 1 && /^[\x20-\x7E]$/.test(k) && text.length < max) {
        text += k;
      }
    }
  }

  async manage_saves_menu(): Promise<void> {
    while (true) {
      const storage = getBrowserStorage();
      const slots = listSaveSlots(storage);
      const entries: { label: string; slot?: SaveSlot; action?: 'clear_all' }[] = [];
      if (slots.auto) entries.push({ label: `Delete Auto-Save (${formatSlotBadge(slots.auto)})`, slot: 'auto' });
      if (slots.slot1) entries.push({ label: `Delete Diary Slot 1 (${formatSlotBadge(slots.slot1)})`, slot: 1 });
      if (slots.slot2) entries.push({ label: `Delete Diary Slot 2 (${formatSlotBadge(slots.slot2)})`, slot: 2 });
      if (entries.length > 1) entries.push({ label: 'Delete All Browser Saves', action: 'clear_all' });
      entries.push({ label: 'Back' });
      const sel = await this.menu('Manage Saves', entries.map((e) => e.label), 0, null, 13);
      if (sel === null || entries[sel].label === 'Back') return;
      const picked = entries[sel];
      if (picked.action === 'clear_all') {
        if (await this.confirm('Delete ALL saved farms in this browser?')) {
          deleteSaveSlot(storage, 'auto');
          deleteSaveSlot(storage, 1);
          deleteSaveSlot(storage, 2);
          clearDawnBackups(storage);
          await this.say('All browser save data cleared.', null);
          return;
        }
      } else if (picked.slot !== undefined) {
        const slotName = picked.slot === 'auto' ? 'Auto-Save' : `Diary Slot ${picked.slot}`;
        if (await this.confirm(`Delete ${slotName}?`)) {
          deleteSaveSlot(storage, picked.slot);
          await this.say(`${slotName} deleted.`, null);
        }
      }
    }
  }

  async title(): Promise<void> {
    while (true) {
      const storage = getBrowserStorage();
      const slots = listSaveSlots(storage);
      const opts: string[] = [];
      const meta: (SaveSummary | null)[] = [];
      if (slots.auto) {
        opts.push('Continue (Auto-Save)');
        meta.push(slots.auto);
      }
      if (slots.slot1) {
        opts.push('Continue (Diary Slot 1)');
        meta.push(slots.slot1);
      }
      if (slots.slot2) {
        opts.push('Continue (Diary Slot 2)');
        meta.push(slots.slot2);
      }
      const hasAny = opts.length > 0;
      opts.push('New Game');
      meta.push(null);
      if (hasAny) {
        opts.push('Manage Saves');
        meta.push(null);
      }

      const info = (sIdx: number) => {
        const s = meta[sIdx];
        if (s) {
          return this.scr.h < 27
            ? [`${s.farmer} · ${s.farm} Farm · ${s.seasonName} ${s.day}, Yr ${s.year} · ${s.gold}G · ${s.itemKinds} items`]
            : [formatSaveLine(s), formatSaveStatsLine(s)];
        }
        if (opts[sIdx] === 'New Game') {
          return hasAny
            ? ['Start a new farm (Auto-Save will update once you begin).']
            : ['Start your new life in Brackenford.'];
        }
        if (opts[sIdx] === 'Manage Saves') {
          return ['Inspect or remove saved farms stored in localStorage.'];
        }
        return [];
      };

      // The title has no way out: Esc, Q and Backspace just leave the menu where it is.
      const sel = await this.menu('Menu', opts, 0, info, 13);
      if (sel === null) continue;
      const choice = opts[sel];
      if (choice.startsWith('Continue')) {
        const slot: SaveSlot = choice.includes('Auto-Save') ? 'auto' : choice.includes('Slot 2') ? 2 : 1;
        try {
          this.load(slot);
        } catch (e: any) {
          await this.say(`Couldn't load the save file: ${e?.message || e}`, null);
          this.started = false;
          continue;
        }
        this.update_npcs();
        await this.say(`Welcome back! ${this.date_str()}.  Weather: ${this.weather}.`, null);
        return;
      }
      if (choice === 'Manage Saves') {
        await this.manage_saves_menu();
        continue;
      }
      if (hasAny && !(await this.confirm('Start a New Game?'))) {
        continue;
      }
      const name = await this.text_input("What's your name?", 'Ash');
      const farm = await this.text_input('Name your farm:', 'Bramble');
      this.new_game(name, farm);
      await this.intro();
      this.autosave(true);
      return;
    }
  }

  async intro(): Promise<void> {
    const t = 'Ambrose';
    await this.say(`Ho ho! You must be ${this.name}! Welcome to Brackenford! I'm Mayor Ambrose.`, t);
    await this.say(
      `Your grandfather left you this farm. Clear the field, till soil with your Hoe, sow seeds, and water them daily. Otto picks up your shipping bin ($) at 5:00 PM sharp!`,
      t
    );
    await this.say(
      `Visit the 7 Hearthfolk at Willow Bend, soak in the Hot Spring on Beacon Hill, explore the 255-floor Spring & Lake Mines, and press M anytime for your Ranch Summary!`,
      t
    );
  }

  init_carpentry(): void {
    this.house_flags = [];
    this.project = null;
    this.bathed = false;
    this.rebuild_house();
  }

  rebuild_house(): void {
    this.maps['house'] = build_house_upgraded(this.house_flags);
  }

  sync_house_furniture(): void {
    const furnishings = ['Clock', 'Mirror', 'Refrigerator', 'Cabinet', 'Rug'] as const;
    for (const item of furnishings) {
      if ((this.inv[item] || 0) > 0) {
        delete this.inv[item];
        if (!this.house_flags.includes(item)) this.house_flags.push(item);
      }
    }
    if ((this.inv['Record Player'] || 0) > 0 && !this.house_flags.includes('Record Player')) {
      this.house_flags.push('Record Player');
    }
    this.rebuild_house();
  }

  apply_town_cottage(): void {
    const m = this.maps['town'];
    if (!m) return;
    const built = this.house_flags.includes('Town Cottage');
    applyTownCottagePlot(m, built);
    if (built && !this.interiors['cottage']) {
      const [im, entry, spots] = build_interior('cottage', ['town', COTTAGE_DOOR[0], COTTAGE_DOOR[1] + 1]);
      this.maps[im.name] = im;
      this.interiors['cottage'] = { map: im.name, entry, spots };
      this.interior_bid[im.name] = 'cottage';
    }
  }

  coop_cap(): number {
    return this.house_flags.includes('Coop Expansion') ? 16 : 8;
  }

  carpentry_day(): string[] {
    this.bathed = false;
    if (!this.project || this.absday() < this.project[1]) {
      return [];
    }
    const name = this.project[0];
    this.project = null;
    if (!this.house_flags.includes(name)) {
      this.house_flags.push(name);
    }
    if (name === 'Big Bed') this.recompute_max_stamina();
    if (name === 'Town Cottage') this.apply_town_cottage();
    this.rebuild_house();
    return [`Ingrid finished building your ${name}! ${EXPANSIONS[name]?.[3] || ''}`];
  }

  // ---------------------------------------------------------------- task 12: the Willow Bend footbridge

  /** Lay the footbridge planks over the washed-out water once built; put the water back otherwise (a fresh game). */
  apply_public_works(): void {
    const m = this.maps['river'];
    if (!m) return;
    for (const [x, y] of footbridge_cells()) m.set(x, y, this.public_works.built ? 'bridge' : 'water');
  }

  works_rows(): { item: string | null; got: number; need: number }[] {
    const w = this.public_works;
    return worksNeeds(PUBLIC_WORKS.needs, PUBLIC_WORKS.crop_qty, w.delivered, w.crop);
  }

  /** The footbridge's line in Today's Plan, or null once it's open. */
  works_line(): string | null {
    const w = this.public_works;
    if (w.built) return null;
    if (w.done_day !== null) return `Ingrid and Silas are building the footbridge (done ${absdayLabel(w.done_day, false)})`;
    return `Ingrid needs ${worksSummary(this.works_rows(), true)}`;
  }

  footbridge_sign(): string {
    const w = this.public_works;
    if (w.built && w.done_day !== null) {
      return `Willow Bend footbridge — Rebuilt by Ingrid, Silas and ${this.name}, ${absdayLabel(w.done_day)}.`;
    }
    const base = 'Footbridge (washed out) — The spring flood took the planks. Ingrid could rebuild it with help from the valley; ask at her workshop on Beacon Hill.';
    return w.done_day === null ? base : `${base} Ingrid and Silas are at work: it opens ${absdayLabel(w.done_day, false)}.`;
  }

  /** What the rucksack can put toward the project: [item, how many it would hand over]. */
  works_offers(): [string, number][] {
    const out: [string, number][] = [];
    for (const r of this.works_rows()) {
      if (r.got >= r.need) continue;
      const items = r.item ? [r.item] : Object.keys(this.inv).filter((i) => i in CROPS && i !== 'Grass');
      for (const i of items) if (this.inv[i]) out.push([i, Math.min(this.inv[i], r.need - r.got)]);
    }
    return out;
  }

  /** Hand over what you carry of one material (partial deliveries count). Returns how many went in. */
  works_deliver(item: string): number {
    const w = this.public_works;
    if (w.done_day !== null) return 0;
    const offer = this.works_offers().find(([i]) => i === item);
    if (!offer) return 0;
    if (!(item in PUBLIC_WORKS.needs)) w.crop = item;
    this.take(item, offer[1]);
    w.delivered[item] = (w.delivered[item] || 0) + offer[1];
    if (this.works_rows().every((r) => r.got >= r.need)) w.done_day = this.absday() + PUBLIC_WORKS.days;
    return offer[1];
  }

  /** Ingrid's village project: what's needed, what's in, and hand over what you carry. */
  async works_menu(): Promise<void> {
    const w = this.public_works;
    if (w.done_day !== null) {
      await this.say(`Silas and I are out at Willow Bend every morning. It'll be open ${absdayLabel(w.done_day, false)}.`, 'Ingrid');
      return;
    }
    if (!Object.keys(w.delivered).length) {
      await this.say(
        `The footbridge below the Willow Bend dock washed out in the spring flood. Silas keeps asking after it: his maps stop at the river, and the best of the far bank is on the other side. I'll rebuild it if the valley chips in: ${PUBLIC_WORKS.needs.Lumber} Lumber for the deck, ${PUBLIC_WORKS.needs.Copper} Copper for the fittings, and ${PUBLIC_WORKS.crop_qty} of any one crop from your farm to feed the crew.`,
        'Ingrid'
      );
    }
    while (w.done_day === null) {
      const offers = this.works_offers();
      const opts = [...offers.map(([i, n]) => `Hand over ${n} ${i}`), 'Leave'];
      const info = [`  Delivered: ${worksSummary(this.works_rows())}`, `  Still needed: ${worksSummary(this.works_rows(), true)}`];
      if (!offers.length) info.push('  Nothing in your rucksack for it yet: Lumber, Copper or a farm crop.');
      const sel = await this.menu(`Village project: ${PUBLIC_WORKS.name}`, opts, 0, info);
      if (sel === null || sel >= offers.length) return;
      const n = this.works_deliver(offers[sel][0]);
      this.msg(`You handed Ingrid ${n} ${offers[sel][0]} for the footbridge.`, '0B');
    }
    await this.say(
      `That's everything. Silas's been itching to get across, so he and I start in the morning. Give us ${PUBLIC_WORKS.days} days: it'll be open ${absdayLabel(w.done_day!, false)}.`,
      'Ingrid'
    );
  }

  /** Overnight: the crew finishes the footbridge on its day. */
  works_day(): string[] {
    const w = this.public_works;
    if (w.built || w.done_day === null || this.absday() < w.done_day) return [];
    w.built = true;
    this.apply_public_works();
    this.keepsake('footbridge', 'Carved plank', 'Ingrid carved a spare plank from the Willow Bend footbridge into a little river otter for you.');
    for (const n of PUBLIC_WORKS.helpers) this.friend[n] = clamp((this.friend[n] || 0) + PUBLIC_WORKS.friend, 0, 100);
    return ['Ingrid and Silas finished the Willow Bend footbridge! You can cross the river below the dock now.'];
  }

  async order_expansion(): Promise<void> {
    if (this.project) {
      const left = Math.max(1, this.project[1] - this.absday());
      await this.say(`I'm still building your ${this.project[0]}. ${left} more day${left > 1 ? 's' : ''}.`, 'Ingrid');
      return;
    }
    const names = Object.keys(EXPANSIONS);
    const opts = names.map((n) => {
      const [gold, lumber] = EXPANSIONS[n];
      return this.house_flags.includes(n) ? `${n} (built)` : `${n} (${gold}G + ${lumber} Lumber)`;
    });
    const info = (s: number) => {
      const [gold, lumber, req, desc] = EXPANSIONS[names[s]];
      const lines = [`  ${desc}`];
      if (req && !this.house_flags.includes(req)) {
        lines.push(`  Requires: ${req}`);
      }
      lines.push(`  You have ${this.gold}G and ${this.inv['Lumber'] || 0} Lumber`);
      return lines;
    };
    const sel = await this.menu('Ingrid Carpentry — Expansions', opts, 0, info);
    if (sel === null) return;
    const n = names[sel];
    const [gold, lumber, req] = EXPANSIONS[n];
    if (this.house_flags.includes(n)) {
      await this.say('Already built that one. Solid work, if I say so myself.', 'Ingrid');
    } else if (req && !this.house_flags.includes(req)) {
      await this.say(`I need to build the ${req} first.`, 'Ingrid');
    } else if (this.gold < gold || (this.inv['Lumber'] || 0) < lumber) {
      await this.say(`That'll be ${gold}G and ${lumber} Lumber. Come back when you have it.`, 'Ingrid');
    } else if (await this.confirm(`Build the ${n} for ${gold}G + ${lumber} Lumber?`)) {
      this.gold -= gold;
      this.take('Lumber', lumber);
      this.project = [n, this.absday() + BUILD_DAYS];
      await this.say(`Right. I'll have your ${n} done in ${BUILD_DAYS} days.`, 'Ingrid');
    }
  }

  async buy_kitchen_goods(): Promise<void> {
    const goods = [...Object.keys(UTENSILS), 'Rice'];
    const prices: Record<string, number> = { ...UTENSILS, Rice: 100 };
    const opts = goods.map(
      (g) => `${g} ${prices[g]}G${g in UTENSILS && g in this.inv ? '  (owned)' : ''}`
    );
    const sel = await this.menu(`Kitchen Utensils & Goods   ${this.gold}G`, opts);
    if (sel === null) return;
    const g = goods[sel];
    if (g in UTENSILS && g in this.inv) {
      await this.say(`You already have a ${g}.`, null);
    } else {
      await this.buy(g, prices[g], g in UTENSILS ? 1 : 99);
    }
  }

  async use_furniture(tile: string): Promise<void> {
    if (tile === 'kitchen') {
      await this.cook();
    } else if (tile === 'bath') {
      if (this.bathed) {
        await this.say('You already had a bath today.', null);
      } else {
        this.bathed = true;
        this.stamina = Math.min(this.max_stamina, this.stamina + 40);
        this.fatigue = Math.max(0, this.fatigue - 25);
        await this.advance(30);
        await this.say('Ahh... a hot bath in your Bathroom. (+40 Stamina, -25 Fatigue)', null);
      }
    } else if (tile === 'vase') {
      const flowers = ['Duskbell Flower', 'Rosecap Flower', 'Pinwheel Daisy', 'Emberbloom Flower', 'Wishing Moss'].filter(
        (f) => (this.inv[f] || 0) > 0
      );
      if (!flowers.length) {
        await this.say(
          `Flower Vase (${this.vase_flower || 'Empty'}): Place a Duskbell, Rosecap, or Pinwheel Daisy here to boost overnight Stamina & Fatigue recovery!`,
          'Vase'
        );
      } else {
        const sel = await this.menu('Place which flower in the Vase?', flowers);
        if (sel !== null) {
          const fl = flowers[sel];
          this.take(fl, 1);
          this.vase_flower = fl;
          this.msg(`Placed ${fl} in the Vase! Better overnight recovery!`, '0A');
        }
      }
    } else if (tile === 'fireplace') {
      if ((this.inv['Lumber'] || 0) < 1) {
        await this.say('Fireplace: Bring 1 Lumber in Winter to light a warm fire and reduce overnight Fatigue!', 'Fireplace');
      } else if (await this.confirm('Light the Fireplace with 1 Lumber?')) {
        this.take('Lumber', 1);
        this.fireplace_lit = true;
        this.msg('A warm fire crackles in the fireplace!', '09');
      }
    } else {
      await this.show_lines(
        'Recipe Book (108 Dishes & Specialties)',
        Object.keys(RECIPES).map((r) => this.recipe_line(r))
      );
    }
  }

  recipe_line(dish: string): string {
    const [ing, ut] = RECIPES[dish];
    const parts = ing.map(([t, q]: [string, number]) => (t.startsWith('any:') ? `${q} any ${t.slice(4)}` : `${q} ${t}`));
    return `${dish}: ${parts.join(', ')}${ut ? ` [${ut}]` : ''}`;
  }

  ingredient_plan(dish: string): Record<string, number> | null {
    const left = combinedPool(this.inv, this.fridge_inv, this.cabinet_inv);
    const plan: Record<string, number> = {};
    for (let [tok, q] of py_sorted(RECIPES[dish][0])) {
      let pool: string[] = [];
      if (tok.startsWith('any:')) {
        const kind = tok.slice(4);
        pool = py_sorted(
          Object.keys(left).filter(
            (i) => left[i] > 0 && (kind === 'fruit' ? FRUITS.has(i) : (ITEMS[i]?.[2] || '') === kind)
          )
        );
      } else {
        pool = (left[tok] || 0) > 0 ? [tok] : [];
      }
      for (const i of pool) {
        const use = Math.min(q, left[i]);
        left[i] -= use;
        plan[i] = (plan[i] || 0) + use;
        q -= use;
        if (!q) break;
      }
      if (q) return null;
    }
    return plan;
  }

  async cook(): Promise<void> {
    while (true) {
      const dishes = Object.keys(RECIPES);
      const opts: string[] = ['[Experimental Free-Form Cooking]', '[Host Dinner for Two Neighbors]'];
      for (const d of dishes) {
        const ut = RECIPES[d][1];
        const ok = (!ut || totalAvailable(ut, this.inv, this.fridge_inv, this.cabinet_inv) > 0) && this.ingredient_plan(d) !== null;
        const known = this.recipes_discovered.includes(d);
        opts.push(`${ok ? '*' : ' '} ${d}${known ? '' : ' (new)'}`);
      }
      const info = (s: number) => {
        if (s === 0) {
          return [
            '  Combine 1–3 ingredients from Pockets, Fridge, or Cabinet to discover new recipes!',
            '  Matching a real recipe discovers & cooks it; unmatched combos yield a Failed Dish.',
          ];
        }
        if (s === 1) {
          return [
            '  Pick two neighbors (20+ friendship) and serve any cooked dish from your rucksack.',
            '  Each pairing shares a dinner conversation and reacts to what you serve!',
          ];
        }
        const d = dishes[s - 2];
        const [, ut, st, sell] = RECIPES[d];
        const buff = foodBuffForDish(d, st);
        const lines = [
          `  ${this.recipe_line(d)}`,
          `  +${st} Stamina, ships ${sell}G${buff ? ` · Buff: ${buff.label}` : ''}`,
        ];
        const preserve = this.preserve_note(d);
        if (preserve) lines.push(`  ${preserve}`);
        if (ut && totalAvailable(ut, this.inv, this.fridge_inv, this.cabinet_inv) <= 0) {
          lines.push(`  Needs a ${ut} (Supermarket / TV Shopping)`);
        }
        const plan = this.ingredient_plan(d);
        if (plan) {
          lines.push(
            '  Uses (Pockets + Fridge/Cabinet): ' +
              Object.entries(plan)
                .map(([i, q]) => `${q} ${i}`)
                .join(', ')
          );
        }
        return lines;
      };
      const sel = await this.menu(`Kitchen (${this.recipes_discovered.length}/${dishes.length} · Pockets+Fridge+Cabinet)`, opts, 0, info);
      if (sel === null) return;
      if (sel === 0) {
        await this.experimental_cook();
        continue;
      }
      if (sel === 1) {
        await this.dinner_menu();
        continue;
      }
      const d = dishes[sel - 2];
      const ut = RECIPES[d][1];
      const plan = this.ingredient_plan(d);
      if (ut && totalAvailable(ut, this.inv, this.fridge_inv, this.cabinet_inv) <= 0) {
        await this.say(`You need a ${ut} to make ${d}.`, null);
      } else if (plan === null) {
        await this.say(`You don't have the ingredients for ${d}.`, null);
      } else {
        let usedFridge = 0;
        let usedCab = 0;
        for (const [i, q] of Object.entries(plan)) {
          const res = consumeAcrossStorages(i, q, this.inv, this.fridge_inv, this.cabinet_inv);
          usedFridge += res.fromFridge;
          usedCab += res.fromCabinet;
        }
        this.give(d);
        if (!this.recipes_discovered.includes(d)) this.recipes_discovered.push(d);
        playSfx('harvest');
        this.msg(`You cooked ${d}${storageSourceNote(usedFridge, usedCab)}!`, '0A');
      }
    }
  }

  async experimental_cook(): Promise<void> {
    const picked: string[] = [];
    const tempInv: Record<string, number> = combinedPool(this.inv, this.fridge_inv, this.cabinet_inv);
    while (picked.length < 3) {
      const usable = Object.keys(tempInv).filter(
        (i) => tempInv[i] > 0 && ['crop', 'forage', 'fish', 'animal', 'ingredient', 'food'].includes(ITEMS[i]?.[2]),
      );
      if (!usable.length) {
        if (!picked.length) {
          await this.say('You have no food ingredients in your rucksack, Fridge, or Cabinet to experiment with.', null);
          return;
        }
        break;
      }
      const opts = [...usable.map((i) => `${i} (x${tempInv[i]})`), ...(picked.length ? ['Cook now!'] : []), 'Cancel'];
      const sel = await this.menu(`Experiment (${picked.length ? picked.join(' + ') : 'pick 1–3 ingredients'})`, opts);
      if (sel === null || opts[sel] === 'Cancel') return;
      if (opts[sel] === 'Cook now!') break;
      const chosen = usable[sel];
      picked.push(chosen);
      tempInv[chosen] -= 1;
    }
    if (!picked.length) return;
    let usedFridge = 0;
    let usedCab = 0;
    for (const p of picked) {
      const res = consumeAcrossStorages(p, 1, this.inv, this.fridge_inv, this.cabinet_inv);
      usedFridge += res.fromFridge;
      usedCab += res.fromCabinet;
    }
    const allUtensils = combinedPool(this.inv, this.fridge_inv, this.cabinet_inv);
    const matched = matchExperimentalRecipe(picked, RECIPES, ITEMS, FRUITS, allUtensils);
    if (matched) {
      this.give(matched, 1);
      const fresh = !this.recipes_discovered.includes(matched);
      if (fresh) this.recipes_discovered.push(matched);
      playSfx('fanfare');
      const note = storageSourceNote(usedFridge, usedCab);
      this.msg(fresh ? `Recipe discovered! You cooked ${matched}${note}!` : `You cooked ${matched}${note}!`, '0B');
    } else {
      this.give('Failed Dish', 1);
      this.msg(`You experimented with ${picked.join(' + ')} and made a Failed Dish! (Used in Hedgerow Tea!)`, '0E');
    }
  }

  // ---------------------------------------------------------------- Task 02: Short outings with villagers
  outing_available(n: string) {
    return outingFor(n, {
      friend: this.friend[n] || 0,
      minutes: this.minutes,
      season: this.season,
      weather: this.weather,
      absday: this.absday(),
      lastDone: this.outings_done,
      festival: Boolean(this.fest_on()),
    });
  }

  async run_outing(def: (typeof OUTINGS)[number]): Promise<void> {
    await this.advance(def.minutes);
    for (const [who, line] of def.dialogue) await this.say(line, who);
    if (def.bonusItem) this.give(def.bonusItem, 1);
    this.friend[def.npc] = clamp((this.friend[def.npc] || 0) + 6, 0, 100);
    this.talked.add(def.npc);
    this.outings_done[def.id] = this.absday();
    this.remember(def.npc, def.memory, `outing:${def.id}:${Math.floor(this.absday() / 7)}`);
    playSfx('emote');
    this.msg(`${def.bonusText} (+6 ${def.npc} friendship)`, '0B');
  }

  // ---------------------------------------------------------------- Task 06 & Task 47: Farmhouse table, dinner & routines
  async house_table_menu(): Promise<void> {
    const r = this.spouse_routine && this.spouse_routine.day === this.absday() ? this.spouse_routine : null;
    const opts: string[] = [];
    if (r && !r.claimed && r.gift) opts.push(`Take ${this.married}'s ${r.gift} from the table`);
    if (r?.note) opts.push(`Read ${this.married}'s note`);
    if (this.house_flags.includes('Kitchen')) opts.push('Invite two neighbors to dinner');
    if (this.wall_print) opts.push(`Admire wall print: ${this.wall_print.title}`);
    opts.push('Leave');
    if (opts.length === 1) {
      await this.say('Your sturdy farmhouse table. Add a Kitchen expansion to invite neighbors over for dinner!', 'Table');
      return;
    }
    const sel = await this.menu('Farmhouse Table', opts);
    if (sel === null || opts[sel] === 'Leave') return;
    const pick = opts[sel];
    if (r && !r.claimed && r.gift && pick.startsWith('Take ')) {
      r.claimed = true;
      this.give(r.gift, 1);
      playSfx('harvest');
      this.msg(`Picked up ${r.gift} that ${this.married} left on the table!`, '0B');
    } else if (r?.note && pick.startsWith('Read ')) {
      await this.say(r.note, this.married || 'Note');
    } else if (pick === 'Invite two neighbors to dinner') {
      await this.dinner_menu();
    } else if (this.wall_print && pick.startsWith('Admire ')) {
      await this.say(`"${this.wall_print.title}" [ ${this.wall_print.marks} ] — printed on ${absdayLabel(this.wall_print.day)}.`, 'Wall Print');
    }
  }

  async dinner_menu(): Promise<void> {
    if (this.dinner_day === this.absday()) {
      await this.say('You already hosted dinner tonight. Invite friends again tomorrow!', 'Dinner');
      return;
    }
    const dishes = Object.keys(this.inv).filter((i) => this.inv[i] > 0 && (ITEMS[i]?.[2] === 'dish' || i in RECIPES));
    if (!dishes.length) {
      await this.say('Cook a dish in your Kitchen first so you have something to serve your guests!', 'Dinner');
      return;
    }
    const eligible = Object.keys(NPCS).filter(
      (n) => (this.friend[n] || 0) >= DINNER_MIN_FRIEND && n !== 'Wellkeeper' && n !== 'Reed Heron',
    );
    if (eligible.length < 2) {
      await this.say(`Make friends with at least two villagers (${DINNER_MIN_FRIEND}+ friendship) before hosting dinner.`, 'Dinner');
      return;
    }
    const g1Sel = await this.menu('Invite Guest #1', [...eligible, 'Cancel']);
    if (g1Sel === null || g1Sel >= eligible.length) return;
    const guest1 = eligible[g1Sel];
    const rest = eligible.filter((n) => n !== guest1);
    const g2Sel = await this.menu(`Invite Guest #2 (with ${guest1})`, [...rest, 'Cancel']);
    if (g2Sel === null || g2Sel >= rest.length) return;
    const guest2 = rest[g2Sel];
    const dSel = await this.menu('Serve which dish?', [...dishes.map((d) => `${d} (x${this.inv[d]})`), 'Cancel']);
    if (dSel === null || dSel >= dishes.length) return;
    const dish = dishes[dSel];
    this.take(dish, 1);
    this.dinner_day = this.absday();
    await this.advance(60);
    for (const [who, line] of dinnerPairLines(guest1, guest2, dish)) {
      await this.say(line, who);
    }
    for (const g of [guest1, guest2]) {
      const d = NPCS[g];
      const pref = d.loves.includes(dish) ? 'love' : d.likes.includes(dish) ? 'like' : d.hates.includes(dish) ? 'hate' : 'neutral';
      const react = dinnerDishReaction(g, dish, pref);
      this.friend[g] = clamp((this.friend[g] || 0) + react.pts, 0, 100);
      await this.say(react.line, g);
      this.remember(g, `Shared ${dish} at your farmhouse dinner with ${g === guest1 ? guest2 : guest1}.`, `dinner:${this.absday()}:${g}`);
    }
    playSfx('fanfare');
    this.msg(`Hosted ${guest1} & ${guest2} for ${dish}!`, '0B');
  }

  // ---------------------------------------------------------------- Task 08: Child's interests over seasons
  async child_interact(): Promise<void> {
    if (!this.child_name) return;
    const cname = this.child_name;
    if (this.held) {
      const item = this.held;
      const interest = classifyChildItem(item, ITEMS[item]?.[2]);
      if (interest) {
        const gain = this.child_state.shown_day === this.absday() ? 1 : 3;
        this.child_state.points[interest] = (this.child_state.points[interest] || 0) + gain;
        this.child_state.shown_day = this.absday();
        playSfx('emote');
        await this.say(childShowLine(cname, item, interest), cname);
        this.msg(`${cname} grew more curious about ${CHILD_INTEREST_LABELS[interest]}!`, '0A');
        return;
      }
      await this.say(`${cname} giggles at the ${item}. Try showing a fish, seed packet, relic, ore, or flower!`, cname);
      return;
    }
    const scene = childMilestoneScene(cname, this.child_days, this.child_state);
    if (scene) {
      this.child_state.scenes.push(scene.id);
      playSfx('fanfare');
      await this.say(scene.text, cname);
      return;
    }
    const top = topChildInterests(this.child_state);
    if (top.length) {
      const favs = top.slice(0, 2).map((k) => CHILD_INTEREST_LABELS[k]).join(' and ');
      await this.say(`${cname} beams at you! Lately ${cname} is fascinated by ${favs}. (Day ${this.child_days} growing up)`, cname);
    } else {
      await this.say(`${cname} waves cheerfully! Hold a fish, seed bag, or relic and press X to show it to ${cname}.`, cname);
    }
  }

  // ---------------------------------------------------------------- Task 43: Rainy-night coffee & tea counter
  tea_counter_now(): boolean {
    const rainy = this.weather === 'Rain' || this.weather === 'Typhoon' || this.weather === 'Snow' || this.weather === 'Blizzard';
    return rainy && this.minutes >= TEA_HOURS[0] * 60 && this.minutes < TEA_HOURS[1] * 60;
  }

  async tea_counter_menu(): Promise<void> {
    if (this.tea_last_day === this.absday()) {
      await this.say('The kettle is quiet now — you already poured drinks at the rainy-night counter tonight.', "Gideon's Inn");
      return;
    }
    const reg = teaRegularFor(this.absday());
    const chap = this.tea_progress[reg.npc] || 0;
    await this.say(reg.orderLine, reg.npc);
    const ingOpts = TEA_INGREDIENTS.map((ing) => `${ing.name}${(this.inv[ing.item] || 0) > 0 ? ` (using your ${ing.item})` : ' (inn pantry)'}`);
    const first = await this.menu('Brew Step 1 — Pick base ingredient', [...ingOpts, 'Cancel']);
    if (first === null || first >= TEA_INGREDIENTS.length) return;
    const second = await this.menu('Brew Step 2 — Pick pairing ingredient', [...ingOpts, 'Cancel']);
    if (second === null || second >= TEA_INGREDIENTS.length) return;
    const a = TEA_INGREDIENTS[first];
    const b = TEA_INGREDIENTS[second];
    const drink = matchTeaDrink(a.id, b.id);
    if (!drink) {
      await this.say('Those two ingredients don’t steep into a drink — try pairing a tea leaf or roast bean with honey or milk!', 'Gideon');
      return;
    }
    if ((this.inv[a.item] || 0) > 0) this.take(a.item, 1);
    if (b.item !== a.item && (this.inv[b.item] || 0) > 0) this.take(b.item, 1);
    this.tea_last_day = this.absday();
    await this.advance(20);
    if (drink.id === reg.drinkId) {
      const idx = Math.min(chap, reg.chapters.length - 1);
      await this.say(`Mmm — ${drink.name}, just what I hoped for!`, reg.npc);
      await this.say(reg.chapters[idx], reg.npc);
      this.tea_progress[reg.npc] = Math.min(reg.chapters.length, chap + 1);
      this.friend[reg.npc] = clamp((this.friend[reg.npc] || 0) + 6, 0, 100);
      this.remember(reg.npc, `Shared a rainy-night ${drink.name} at Gideon's Inn.`, `tea:${reg.npc}:${idx}`);
      playSfx('emote');
      this.msg(`Served ${reg.npc} ${drink.name} (+6 friendship; chapter ${idx + 1}/${reg.chapters.length}).`, '0C');
    } else {
      this.friend[reg.npc] = clamp((this.friend[reg.npc] || 0) + 2, 0, 100);
      await this.say(`Warm ${drink.name} — not quite what I ordered, but appreciated on a wet night!`, reg.npc);
      this.msg(`Served ${drink.name} (+2 ${reg.npc} friendship).`, '09');
    }
  }

  // ---------------------------------------------------------------- Task 48: Indoor winter hobby (stamp-printing bench)
  async stamp_bench_menu(): Promise<void> {
    const opts = ['Compose a New Block Print', ...(this.wall_print ? [`Inspect Wall Print (${this.wall_print.title})`] : []), 'Leave'];
    const sel = await this.menu('⊞ Stamp-Printing Bench (Winter Hobby)', opts, 0, [
      '  Combine geometric woodblock marks and ink to make a print for your wall or a neighbor.',
    ]);
    if (sel === null || opts[sel] === 'Leave') return;
    if (opts[sel].startsWith('Inspect')) {
      const wp = this.wall_print!;
      await this.say(`"${wp.title}" [ ${wp.marks} ] — hanging proudly on your farmhouse wall.`, 'Wall Print');
      return;
    }
    const markNames = STAMP_MARKS.map((m) => `${m.glyph} ${m.name}`);
    const m1 = await this.menu('Pick Mark #1', [...markNames, 'Cancel']);
    if (m1 === null || m1 >= STAMP_MARKS.length) return;
    const m2 = await this.menu('Pick Mark #2', [...markNames, 'Cancel']);
    if (m2 === null || m2 >= STAMP_MARKS.length) return;
    const m3 = await this.menu('Pick Mark #3', [...markNames, 'Cancel']);
    if (m3 === null || m3 >= STAMP_MARKS.length) return;
    const inkSel = await this.menu('Pick Ink Accent', STAMP_INKS.map((i) => i.name));
    if (inkSel === null) return;
    const print = composeStampPrint([m1, m2, m3], inkSel, this.absday());
    this.prints.push(print);
    if (this.prints.length > 12) this.prints.shift();
    await this.advance(30);
    const dest = await this.menu(`Finished: ${print.title} [ ${print.marks} ]`, [
      'Hang it on your farmhouse wall',
      'Pack as a Block Print to gift a neighbor',
    ]);
    if (dest === 0) {
      this.wall_print = print;
      this.keepsake(`print:${print.title}`, print.title, `Hand-stamped winter print [ ${print.marks} ].`);
      playSfx('harvest');
      this.msg(`Hung "${print.title}" [ ${print.marks} ] on your farmhouse wall!`, '0C');
    } else if (dest === 1) {
      this.give('Block Print', 1);
      playSfx('harvest');
      this.msg(`Packed "${print.title}" as a Block Print in your rucksack — hold and gift it to any neighbor!`, '0C');
    }
  }

  // ---------------------------------------------------------------- Task 11: Guest vendors who become regulars
  current_guest_vendor() {
    return activeGuestVendor({
      absday: this.absday(),
      weekday: this.weekday,
      minutes: this.minutes,
      festival: Boolean(this.fest_on()),
      regulars: this.guest_regulars,
    });
  }

  async guest_vendor_menu(v: (typeof GUEST_VENDORS)[number]): Promise<void> {
    const isReg = this.guest_regulars.includes(v.id);
    while (true) {
      const opts = [
        ...v.stock.map((s) => `${s.item} (${s.price}G)`),
        `Talk to ${v.name}`,
        'Leave',
      ];
      const info = (i: number) => {
        if (i < v.stock.length) return [`  ${v.stock[i].desc}`, `  Status: ${isReg ? 'Brackenford Regular' : v.unlockHint}`];
        return [`  ${isReg ? v.regularGreeting : v.greeting}`];
      };
      const sel = await this.menu(`${v.title}   ${this.gold}G`, opts, 0, info);
      if (sel === null || sel < 0 || sel >= opts.length || opts[sel] === 'Leave') return;
      if (sel === v.stock.length) {
        await this.say(isReg ? v.regularGreeting : v.greeting, v.name);
      } else {
        const s = v.stock[sel];
        await this.buy(s.item, s.price, s.limit);
      }
    }
  }

  // ---------------------------------------------------------------- Task 15: Community pantry
  async pantry_menu(): Promise<void> {
    while (true) {
      const count = this.pantry.items.length;
      const ready = count >= PANTRY_GOAL;
      const info = [
        `  Pantry stock: ${count}/${PANTRY_GOAL} surplus ingredients   Shared meals held: ${this.pantry.meals}`,
        ...(this.pantry.items.length ? [`  In the chest: ${this.pantry.items.slice(-6).join(', ')}`] : ['  Donate surplus crops, forage, fish, or farm goods.']),
        ...(this.pantry.recipeLearned ? [`  Learned recipe: ${PANTRY_RECIPE}`] : ['  Hold your first shared meal to learn a neighbor’s special recipe!']),
      ];
      const opts = [
        'Donate a surplus ingredient',
        ...(ready ? ['Hold Community Shared Meal!'] : []),
        'Leave',
      ];
      const sel = await this.menu('▤ Market Cross Community Pantry', opts, 0, info);
      if (sel === null || sel < 0 || sel >= opts.length || opts[sel] === 'Leave') return;
      if (opts[sel] === 'Donate a surplus ingredient') {
        const usable = Object.keys(this.inv).filter((i) => this.inv[i] > 0 && PANTRY_CATEGORIES.has(ITEMS[i]?.[2]));
        if (!usable.length) {
          await this.say('Bring any crop, forage, fish, egg, milk, or dish to stock the Community Pantry.', 'Pantry');
          continue;
        }
        const pick = await this.menu('Donate which ingredient?', [...usable.map((i) => `${i} (x${this.inv[i]})`), 'Cancel']);
        if (pick === null || pick >= usable.length) continue;
        const item = usable[pick];
        this.take(item, 1);
        this.pantry.items.push(item);
        playSfx('harvest');
        this.msg(`Added ${item} to the Community Pantry (${this.pantry.items.length}/${PANTRY_GOAL}).`, '0B');
      } else if (opts[sel] === 'Hold Community Shared Meal!') {
        if (this.pantry.lastMealDay === this.absday()) {
          await this.say('We already gathered for a shared meal today — stock the pantry again for next time!', 'Gideon');
          continue;
        }
        this.pantry.items = this.pantry.items.slice(PANTRY_GOAL);
        this.pantry.meals += 1;
        this.pantry.lastMealDay = this.absday();
        await this.advance(60);
        this.stamina = Math.min(this.max_stamina, this.stamina + 40);
        this.fatigue = Math.max(0, this.fatigue - 20);
        const diners = ['Gideon', 'Tess', 'Hollis', 'Rosalind'];
        for (const n of diners) this.friend[n] = clamp((this.friend[n] || 0) + 4, 0, 100);
        await this.say('Neighbors crowd around long tables in Market Cross, ladling steaming bowls from the Community Pantry! (+40 Stamina, -20 Fatigue, +4 friendship)', 'Shared Meal');
        if (!this.pantry.recipeLearned) {
          this.pantry.recipeLearned = true;
          if (!this.recipes_discovered.includes(PANTRY_RECIPE)) this.recipes_discovered.push(PANTRY_RECIPE);
          this.keepsake('pantry_first_meal', 'Community ladle tag', `From Brackenford's first Community Pantry dinner, where Tess taught you ${PANTRY_RECIPE}.`);
          this.remember('Tess', `Tess taught you how to cook ${PANTRY_RECIPE} after the first Community Pantry dinner.`, 'pantry:recipe');
          await this.say(`That supper warmed the whole square! Here — let me write down our recipe for ${PANTRY_RECIPE} for your kitchen!`, 'Tess');
        }
        playSfx('fanfare');
        return;
      }
    }
  }

  // ---------------------------------------------------------------- Task 36: People you meet along the trail
  trail_at(x: number, y: number): { kind: 'npc' | 'item'; def: (typeof TRAIL_ENCOUNTERS)[number] } | null {
    if (!this.trail_encounter || this.trail_encounter.day !== this.absday() || this.trail_encounter.done) return null;
    const def = TRAIL_ENCOUNTERS.find((e) => e.id === this.trail_encounter!.id);
    if (!def || def.map !== this.mapname) return null;
    if (def.pos[0] === x && def.pos[1] === y) return { kind: 'npc', def };
    if (def.itemPos && !this.trail_encounter.found && def.itemPos[0] === x && def.itemPos[1] === y) return { kind: 'item', def };
    return null;
  }

  async trail_interact_at(x: number, y: number): Promise<boolean> {
    const hit = this.trail_at(x, y);
    if (!hit || !this.trail_encounter) return false;
    const { kind, def } = hit;
    if (kind === 'item') {
      this.trail_encounter.found = true;
      playSfx('harvest');
      this.msg(`Found ${def.npc}'s ${def.itemName || 'lost keepsake'} on the brambles! Bring it back to ${def.npc}.`, '0A');
      return true;
    }
    if (def.kind === 'scarf' && !this.trail_encounter.found) {
      await this.say(def.prompt, def.npc);
      return true;
    }
    if (def.kind !== 'scarf') await this.say(def.prompt, def.npc);
    await this.say(def.resolve, def.npc);
    if (def.rewardItem) this.give(def.rewardItem, 1);
    this.friend[def.npc] = clamp((this.friend[def.npc] || 0) + 5, 0, 100);
    this.trail_encounter.done = true;
    this.remember(def.npc, def.memory, `trail:${def.id}:${this.year}`);
    playSfx('emote');
    this.msg(`${def.clue} (+5 ${def.npc} friendship)`, '0C');
    return true;
  }

  async cedar_spirit_event(): Promise<void> {
    if (this.berry_sources.includes('mountain_tree')) {
      await this.say('The ancient cedar whispers warmly in the mountain breeze.', 'Ancient Cedar');
      return;
    }
    const sel = await this.menu(
      'Ancient Cedar: "Please spare my trunk, young farmer!"',
      ['Spare the Ancient Cedar', 'Swing the Axe anyway'],
      0,
      ['  The old cedar on Beacon Hill summit speaks in a deep, trembling voice.'],
    );
    if (sel === 0) {
      this.give_power_berry('mountain_tree');
      await this.say('"Thank you, kind soul! Accept this Heartseed in gratitude."', 'Ancient Cedar');
    } else if (sel === 1) {
      this.stamina = Math.max(0, this.stamina - 30);
      this.fatigue = Math.min(100, this.fatigue + 20);
      await this.say('"How cruel...!" A sharp gust knocks you back (-30 Stamina, +20 Fatigue).', 'Ancient Cedar');
    }
  }

  async storage_menu(kind: 'fridge' | 'cabinet'): Promise<void> {
    const store = kind === 'fridge' ? this.fridge_inv : this.cabinet_inv;
    const label = kind === 'fridge' ? 'Refrigerator' : 'Cabinet';
    const cats =
      kind === 'fridge'
        ? new Set(['crop', 'forage', 'fish', 'animal', 'ingredient', 'food', 'dish'])
        : new Set(['ore', 'relic', 'material', 'tool', 'utensil', 'special', 'seed']);
    const excluded = new Set(['Truth Jewel', 'Gem of Truth', 'Heartseed', 'Basket']);
    while (true) {
      const storeCount = Object.values(store).reduce((a, b) => a + b, 0);
      const sel = await this.menu(`${label} (${storeCount} stored)`, [
        'Store from Rucksack',
        'Withdraw to Rucksack',
        'Close',
      ]);
      if (sel === null || sel === 2) return;
      if (sel === 0) {
        const eligible = py_sorted(Object.keys(this.inv)).filter(
          (i) => (this.inv[i] || 0) > 0 && cats.has(ITEMS[i]?.[2] || '') && !excluded.has(i),
        );
        if (!eligible.length) {
          await this.say(`No matching items in your rucksack to store in the ${label}.`, label);
          continue;
        }
        const pick = await this.menu(
          `Store in ${label}`,
          [...eligible.map((i) => `${i} x${this.inv[i]}`), 'Back'],
        );
        if (pick === null || pick >= eligible.length) continue;
        const item = eligible[pick];
        const q = (this.inv[item] || 0) === 1 ? 1 : await this.ask_qty(`Store how many ${item}?`, this.inv[item], ITEMS[item]?.[0] || 0, 'Value');
        if (q > 0) {
          this.take(item, q);
          store[item] = (store[item] || 0) + q;
          this.msg(`Stored ${q} ${item} in the ${label}.`, '0C');
        }
      } else if (sel === 1) {
        const stored = py_sorted(Object.keys(store)).filter((i) => (store[i] || 0) > 0);
        if (!stored.length) {
          await this.say(`The ${label} is empty.`, label);
          continue;
        }
        const pick = await this.menu(
          `Withdraw from ${label}`,
          [...stored.map((i) => `${i} x${store[i]}`), 'Back'],
        );
        if (pick === null || pick >= stored.length) continue;
        const item = stored[pick];
        const q = (store[item] || 0) === 1 ? 1 : await this.ask_qty(`Take how many ${item}?`, store[item], ITEMS[item]?.[0] || 0, 'Value');
        if (q > 0) {
          store[item] -= q;
          if (store[item] <= 0) delete store[item];
          this.give(item, q);
          this.msg(`Took ${q} ${item} from the ${label}.`, '0B');
        }
      }
    }
  }

  async music_menu(): Promise<void> {
    if (!this.inv['Record Player'] && !this.house_flags.includes('Record Player')) {
      await this.say("Buy the Record Player from Ferreira at Otto's Beach House to listen to Mineral Valley records!", 'Record Player');
      return;
    }
    const sel = await this.menu(
      '♪ Record Player — Choose a Record',
      [...TRACKS.map((t) => t.title), 'Close'],
      0,
      ['  Spin a melody from across Brackenford.'],
    );
    if (sel === null || sel >= TRACKS.length) return;
    const track = TRACKS[sel];
    playMelody(track.id);
    this.msg(`♪ Now playing: ${track.title}`, '0E');
  }

  // ---------------------------------------------------------------- Task 26, 27, 28 & G15: Ranch menus
  async pasture_menu(): Promise<void> {
    while (true) {
      const wLabel = `West Meadow: ${this.pasture.west}% grass${this.pasture.active === 'west' ? ' [ACTIVE]' : ' [Resting]'}`;
      const eLabel = `East Meadow: ${this.pasture.east}% grass${this.pasture.active === 'east' ? ' [ACTIVE]' : ' [Resting]'}`;
      const other = this.pasture.active === 'west' ? 'East' : 'West';
      const opts = [
        `Switch active pasture to ${other} Meadow`,
        'Graze barn animals on active meadow',
        'Leave',
      ];
      const sel = await this.menu('Rotating Pasture', opts, 0, [
        `  ${wLabel}`,
        `  ${eLabel}`,
        '  Resting meadow regrows overnight (+30%/day in warm seasons, +10% in Winter).',
      ]);
      if (sel === null || sel < 0 || sel >= opts.length || opts[sel] === 'Leave') return;
      if (sel === 0) {
        this.pasture.active = this.pasture.active === 'west' ? 'east' : 'west';
        this.msg(`Switched active pasture to ${this.pasture.active === 'west' ? 'West' : 'East'} Meadow (${this.pasture[this.pasture.active]}% grass).`, '0B');
      } else if (sel === 1) {
        await this.graze_barn_pasture();
        return;
      }
    }
  }

  async build_enrichment(which: 'perch' | 'shadeTree'): Promise<void> {
    const cost = which === 'perch' ? PERCH_COST : SHADE_TREE_COST;
    const name = which === 'perch' ? 'Chicken Perch' : 'Pasture Shade Tree';
    if (this.enrichment[which]) {
      await this.say(`You already built the ${name} on your farm.`, 'Ingrid');
      return;
    }
    if (!this.pay_works(cost)) return;
    this.enrichment[which] = true;
    playSfx('fanfare');
    await this.say(`Done! Your ${name} is ready on the farm — your animals will love it on fair days!`, 'Ingrid');
  }

  async barn_book(): Promise<void> {
    this.sync_animal_records();
    if (!this.animals.length) {
      await this.say('The Barn Book is blank. Buy cows or sheep from Abel at Highmeadow Dairy.', 'Barn Book');
      return;
    }
    const lines = [
      '  Name        Kind   Coat              Mood      Born         Parents',
      ...this.animals.map((a) => {
        const coat = coatInfo(a.kind, a.coat);
        const parents = Array.isArray(a.parents) ? a.parents.filter(Boolean).join(' + ') : 'Highmeadow Herd';
        return `  ${String(a.name).padEnd(11)} ${String(a.kind).padEnd(6)} ${(coat.label + (coat.rare ? '*' : '')).padEnd(17)} ${String(a.personality || 'calm').padEnd(9)} ${absdayLabel(a.bornDay || 0, false).padEnd(12)} ${parents}`;
      }),
      '',
      '  * Rare coat variants earn festival bonuses and pass rare genes to calves/lambs.',
    ];
    await this.show_lines('Barn Book — Coats & Family Records', lines);
  }

  async cat_menu(): Promise<void> {
    if (!this.pet_extras.cat) return;
    const h = Math.floor(this.pet_extras.catAff / 10);
    const bar = `[${'#'.repeat(h)}${'.'.repeat(10 - h)}]`;
    const opts = [
      `Pet ${this.pet_extras.catName}`,
      ...(this.pet_extras.bowlGift ? [`Collect Pet Bowl Gift (${this.pet_extras.bowlGift})`] : []),
      'Leave',
    ];
    const info = this.pet_extras.catClue ? [`  ${this.pet_extras.catName} is ${this.pet_extras.catClue}`] : [];
    const sel = await this.menu(`Farm Cat — ${this.pet_extras.catName} ${bar}`, opts, 0, info);
    if (sel === null || opts[sel] === 'Leave') return;
    if (sel === 0) {
      this.pet_extras.catAff = Math.min(100, this.pet_extras.catAff + 4);
      this.fx_add('emote', CAT_SPOT[0], CAT_SPOT[1], 1.0, { emote: 'heart' });
      playSfx('emote');
      this.msg(`Purrr! ${this.pet_extras.catName} leans against your boots. (+Affection)`, '0A');
    } else if (this.pet_extras.bowlGift) {
      const g = this.pet_extras.bowlGift;
      this.pet_extras.bowlGift = null;
      this.give(g, 1);
      playSfx('harvest');
      this.msg(`Collected ${g} from the pet bowl!`, '0B');
    }
  }
}
