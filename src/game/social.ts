// Social, family, outing, dinner, tea counter, winter stamp-printing and reactive NPC helpers for GLADE
// Covers mechanics tasks 02, 06, 08, 43, 47, 48 and feature G11 (reactive dialogue & winter coats).

// ---------------------------------------------------------------- Task 02: Short outings with villagers
export interface OutingDef {
  id: string;
  npc: string;
  title: string;
  where: string;
  minFriend: number;
  hours: readonly [number, number];
  seasons?: readonly number[];
  sunnyOnly?: boolean;
  minutes: number;
  dialogue: readonly [string, string][];
  bonusItem?: string;
  bonusText: string;
  memory: string;
}

export const OUTING_COOLDOWN_DAYS = 7;

export const OUTINGS: readonly OutingDef[] = [
  {
    id: 'rowan_walk',
    npc: 'Rowan',
    title: 'Walk along the Ironwood ridge',
    where: 'Ironwood Grove',
    minFriend: 20,
    hours: [10, 16],
    sunnyOnly: true,
    minutes: 10,
    dialogue: [
      ['Rowan', 'Good to step out of the forge smoke for ten minutes. Look at the iron stain in that creek rock.'],
      ['Rowan', 'Hilde never lets me sit still, so walking slow like this is rare. Here — spotted a stray copper seam earlier.'],
    ],
    bonusItem: 'Copper',
    bonusText: 'Rowan handed you a chunk of Copper he pocketed on the trail.',
    memory: 'Took a quiet ten-minute walk with Rowan along the Ironwood ridge.',
  },
  {
    id: 'nico_fish',
    npc: 'Nico',
    title: 'Cast a line off the pier',
    where: 'Brackenford Beach',
    minFriend: 20,
    hours: [10, 17],
    seasons: [1],
    minutes: 10,
    dialogue: [
      ['Nico', 'Ten minutes by the tide beats an hour of sweeping the lodge. Watch how the swell pulls around the pilings.'],
      ['Nico', 'Ha! Got a tug already — you take this one, farmer. Good company brings good bites.'],
    ],
    bonusItem: 'Medium Fish',
    bonusText: 'Nico tossed a fresh Medium Fish into your rucksack.',
    memory: 'Shared a quick fishing session with Nico off Brackenford pier.',
  },
  {
    id: 'felix_fish',
    npc: 'Felix',
    title: 'Ten minutes by Willow Bend',
    where: 'Willow Bend',
    minFriend: 20,
    hours: [10, 17],
    minutes: 10,
    dialogue: [
      ['Felix', 'I like watching the river eddies slow down near the bend. Makes a long week feel lighter.'],
      ['Felix', 'Thanks for coming out with me — here, keep this river catch for supper.'],
    ],
    bonusItem: 'Small Fish',
    bonusText: 'Felix shared a fresh Small Fish from the bend.',
    memory: 'Spent ten quiet minutes fishing with Felix by Willow Bend.',
  },
];

export function outingFor(
  npc: string,
  ctx: { friend: number; minutes: number; season: number; weather: string; absday: number; lastDone: Record<string, number>; festival: boolean },
): OutingDef | null {
  if (ctx.festival) return null;
  const def = OUTINGS.find((o) => o.npc === npc);
  if (!def) return null;
  if (ctx.friend < def.minFriend) return null;
  if (ctx.minutes < def.hours[0] * 60 || ctx.minutes >= def.hours[1] * 60) return null;
  if (def.seasons && !def.seasons.includes(ctx.season)) return null;
  if (def.sunnyOnly && ctx.weather !== 'Sunny') return null;
  const last = ctx.lastDone[def.id];
  if (last !== undefined && ctx.absday - last < OUTING_COOLDOWN_DAYS) return null;
  return def;
}

// ---------------------------------------------------------------- Task 06: Invite people to dinner
export const DINNER_MIN_FRIEND = 20;

export interface DinnerExchange {
  pair: readonly [string, string];
  lines: readonly [string, string][];
}

export const DINNER_EXCHANGES: readonly DinnerExchange[] = [
  {
    pair: ['Hilde', 'Rowan'],
    lines: [
      ['Hilde', 'Hmph. Even Rowan sits up straight when dinner is homemade.'],
      ['Rowan', 'Careful, Granddad — you’re about to admit you like coming over here.'],
    ],
  },
  {
    pair: ['Gideon', 'Ingrid'],
    lines: [
      ['Gideon', 'Funny being on this side of the table for once, Ingrid!'],
      ['Ingrid', 'Better timber in this table than the inn’s, too. Good craftsmanship, both of you.'],
    ],
  },
  {
    pair: ['Odessa', 'Silas'],
    lines: [
      ['Odessa', 'Dad brought his field ledger to dinner again — I caught him sketching herbs on the napkin.'],
      ['Silas', 'Only because the seasoning here reminds me of wild ridge thyme!'],
    ],
  },
  {
    pair: ['Rosalind', 'Tess'],
    lines: [
      ['Tess', 'Tell me your secret — how do you keep the kitchen smelling this good after field chores?'],
      ['Rosalind', 'Fresh farm air and good company, Tess. Mostly good company.'],
    ],
  },
  {
    pair: ['Corin', 'Elspeth'],
    lines: [
      ['Corin', 'Next time we’re bringing a bottle from the cellar to match whatever’s on the stove.'],
      ['Elspeth', 'Don’t mind him — he just loves any excuse for a long supper with neighbors.'],
    ],
  },
  {
    pair: ['Dr. Sayer', 'Margit'],
    lines: [
      ['Dr. Sayer', 'A balanced, home-cooked meal! I could prescribe this to half of Brackenford.'],
      ['Margit', 'Doctor, you promised no clinic talk at the dinner table tonight!'],
    ],
  },
  {
    pair: ['Dennis', 'Juniper'],
    lines: [
      ['Juniper', 'No chicken talk for five whole minutes, Dennis!'],
      ['Dennis', 'Fine, fine — though our hens would be jealous of how cozy this farmhouse is.'],
    ],
  },
  {
    pair: ['Felix', 'Nico'],
    lines: [
      ['Nico', 'See, Felix? Warm hearth, full plates — beats cold camp rations every time.'],
      ['Felix', 'You’re right. Thanks for having both of us over.'],
    ],
  },
];

export function dinnerPairLines(a: string, b: string, dish: string): [string, string][] {
  const sorted = [a, b].sort();
  const match = DINNER_EXCHANGES.find((e) => e.pair[0] === sorted[0] && e.pair[1] === sorted[1]);
  if (match) return match.lines.map(([w, t]) => [w, t]);
  return [
    [a, `It’s wonderful sitting down together over ${dish}. Doesn’t happen often enough in a busy season!`],
    [b, `Agreed — ${a} and I were just talking on the walk over about how welcoming your farm feels.`],
  ];
}

export function dinnerDishReaction(npc: string, dish: string, pref: 'love' | 'like' | 'neutral' | 'hate'): { line: string; pts: number } {
  if (pref === 'love') return { line: `${dish}?! You made my absolute favorite! Seconds, please!`, pts: 8 };
  if (pref === 'like') return { line: `Mmm, this ${dish} really hits the spot. Thank you!`, pts: 5 };
  if (pref === 'hate') return { line: `Oh... ${dish} isn't really my favorite, though I appreciate the invitation.`, pts: 1 };
  return { line: `A hearty plate of ${dish} — thank you for cooking for us.`, pts: 3 };
}

// ---------------------------------------------------------------- Task 08: Child's interests over seasons
export type ChildInterest = 'fishing' | 'gardening' | 'history' | 'foraging' | 'smithing';

export const CHILD_INTEREST_LABELS: Record<ChildInterest, string> = {
  fishing: 'river & sea life',
  gardening: 'seeds & growing things',
  history: 'old valley relics',
  foraging: 'wild plants & flowers',
  smithing: 'stones & metalwork',
};

export interface ChildState {
  points: Record<ChildInterest, number>;
  shown_day: number;
  scenes: string[];
}

export const emptyChildState = (): ChildState => ({
  points: { fishing: 0, gardening: 0, history: 0, foraging: 0, smithing: 0 },
  shown_day: -1,
  scenes: [],
});

export function sanitizeChildState(raw: unknown): ChildState {
  const base = emptyChildState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ChildState>;
  if (r.points && typeof r.points === 'object') {
    for (const k of Object.keys(base.points) as ChildInterest[]) {
      const v = Number((r.points as Record<string, unknown>)[k]);
      if (Number.isFinite(v) && v >= 0) base.points[k] = Math.min(999, Math.floor(v));
    }
  }
  if (Number.isInteger(r.shown_day)) base.shown_day = r.shown_day as number;
  if (Array.isArray(r.scenes)) base.scenes = [...new Set(r.scenes.filter((s): s is string => typeof s === 'string'))];
  return base;
}

export function classifyChildItem(item: string, category?: string): ChildInterest | null {
  if (item.endsWith(' Seeds')) return 'gardening';
  if (category === 'fish') return 'fishing';
  if (category === 'relic') return 'history';
  if (category === 'ore') return 'smithing';
  if (category === 'forage' || category === 'crop') return 'foraging';
  return null;
}

export function childShowLine(childName: string, item: string, interest: ChildInterest): string {
  const lines: Record<ChildInterest, string> = {
    fishing: `${childName} stares wide-eyed at the ${item}. "Whoa! Did it splash when you pulled it out of the water?"`,
    gardening: `${childName} shakes the ${item} packet gently. "Listen! They rattle! Can we plant one in the sunny row?"`,
    history: `${childName} traces the old marks on the ${item}. "Someone from way before us made this! What was it for?"`,
    foraging: `${childName} sniffs the ${item} curiously. "Smells like the hill trail! I want to press one in a book."`,
    smithing: `${childName} taps the ${item} with a knuckle. "It’s heavy and shiny — just like what Rowan works at the forge!"`,
  };
  return lines[interest];
}

export function topChildInterests(state: ChildState): ChildInterest[] {
  return (Object.entries(state.points) as [ChildInterest, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k]) => k);
}

export function childMilestoneScene(
  childName: string,
  childDays: number,
  state: ChildState,
): { id: string; text: string } | null {
  const top = topChildInterests(state);
  if (!top.length) return null;
  const lead = top[0];
  if (childDays >= 15 && !state.scenes.includes(`early:${lead}`)) {
    const early: Record<ChildInterest, string> = {
      fishing: `${childName} tied a twig to a bit of yarn and is "casting" off the kitchen rug. "I’m catching a willow chub!"`,
      gardening: `${childName} lined three sprouting beans along the sunny windowsill and checks them every morning.`,
      history: `${childName} arranged pebbles on the table like a tiny museum wing, each with a crayon label.`,
      foraging: `${childName} pressed clover and wild petals between spare diary pages to show you later.`,
      smithing: `${childName} has been tapping wooden blocks together, practicing the steady rhythm of Hilde’s anvil.`,
    };
    return { id: `early:${lead}`, text: early[lead] };
  }
  if (childDays >= 45 && !state.scenes.includes(`season:${lead}`)) {
    const second = top[1] ? ` and still asks about ${CHILD_INTEREST_LABELS[top[1]]} too` : '';
    const seasoned: Record<ChildInterest, string> = {
      fishing: `${childName} has grown tall enough to tie a real hook knot and reads the river ripples like a veteran${second}.`,
      gardening: `${childName} kept a whole season’s chart of rain and sprouting days${second}. "Next spring I want my own row!"`,
      history: `${childName} wrote down stories from the Curator and drew a map of Brackenford’s old ruins${second}.`,
      foraging: `${childName} can now name every wild herb on Beacon Hill by leaf shape alone${second}.`,
      smithing: `${childName} sketched a balanced watering-can spout and asked Rowan how to temper copper${second}.`,
    };
    return { id: `season:${lead}`, text: seasoned[lead] };
  }
  return null;
}

// ---------------------------------------------------------------- Task 43: Rainy-night coffee or tea counter
export const TEA_HOURS = [18, 22] as const;
export const TEA_INGREDIENTS = [
  { id: 'tea_leaf', name: 'Steeped Tea Leaf', item: 'Relaxation Tea Leaves' },
  { id: 'roast_bean', name: 'Dark Roast Bean', item: 'Medicinal Herb' },
  { id: 'wild_honey', name: 'Clover Honey', item: 'Honey' },
  { id: 'warm_milk', name: 'Steamed Milk', item: 'Milk' },
] as const;

export type TeaIngId = (typeof TEA_INGREDIENTS)[number]['id'];

export interface TeaDrink {
  id: string;
  name: string;
  recipe: readonly [TeaIngId, TeaIngId];
  desc: string;
}

export const TEA_DRINKS: readonly TeaDrink[] = [
  { id: 'honey_tea', name: 'Honey Herbal Tea', recipe: ['tea_leaf', 'wild_honey'], desc: 'Soothing steep sweetened with honey.' },
  { id: 'milk_tea', name: 'Velvet Milk Tea', recipe: ['tea_leaf', 'warm_milk'], desc: 'Warm tea mellowed with steamed milk.' },
  { id: 'cafe_au_lait', name: 'Rainy-Night Latte', recipe: ['roast_bean', 'warm_milk'], desc: 'Rich dark roast folded into warm milk.' },
  { id: 'honey_roast', name: 'Amber Honey Coffee', recipe: ['roast_bean', 'wild_honey'], desc: 'Brisk roast with a bright drop of honey.' },
];

export interface TeaRegular {
  npc: string;
  drinkId: string;
  orderLine: string;
  chapters: readonly string[];
}

export const TEA_REGULARS: readonly TeaRegular[] = [
  {
    npc: 'Rowan',
    drinkId: 'cafe_au_lait',
    orderLine: 'Rain drummed on the forge roof all evening. Something dark and milky would thaw my fingers — a Rainy-Night Latte?',
    chapters: [
      'When I first came to Brackenford, I thought I’d only stay one winter. Then Hilde handed me a crooked pair of tongs and dared me to straighten them.',
      'Funny thing — I still keep that first crooked hammer behind the anvil. Reminds me a rough start isn’t a ruined piece.',
      'Thanks for pouring these nights. Between your farm and the forge, Brackenford finally feels like home to me.',
    ],
  },
  {
    npc: 'Odessa',
    drinkId: 'honey_tea',
    orderLine: 'I closed the library early before the downpour. A cup of Honey Herbal Tea would go wonderfully with my notes.',
    chapters: [
      'I’ve been transcribing old Brackenford almanacs. Thirty years ago, a storm washed out the Willow Bend crossing on almost this exact night.',
      'In the margins of the 1898 ledger, someone pressed a Duskbell petal and wrote "plant beside vines." Old farmers knew their craft.',
      'I’m compiling a new Brackenford chronicle this year — and your farm already takes up half a chapter.',
    ],
  },
  {
    npc: 'Margit',
    drinkId: 'milk_tea',
    orderLine: 'Long shift at the clinic with everyone catching chills. Could you steep a Velvet Milk Tea?',
    chapters: [
      'People think Dr. Sayer never rests, but on rainy nights he secretly alphabetizes the herb jars to calm his nerves.',
      'Grandmother Edith used to make milk tea whenever thunder rattled the shutters. One sip and the storm sounds gentler.',
      'You’ve got a knack for this counter, friend. Gideon should put your name on the chalkboard.',
    ],
  },
  {
    npc: 'Ingrid',
    drinkId: 'honey_roast',
    orderLine: 'Nothing beats the smell of wet cedar — except maybe an Amber Honey Coffee after hauling beams.',
    chapters: [
      'Every barn and bridge in this valley has a tiny notch I carve under the sill beam — my way of wishing the roof ten dry winters.',
      'My father taught me to listen to a storm from inside a house you built. If nothing creaks, you earned your supper.',
      'Next dry week, drop by the workshop. Watching your place grow has been the best job I’ve had in years.',
    ],
  },
];

export function matchTeaDrink(a: TeaIngId, b: TeaIngId): TeaDrink | null {
  return TEA_DRINKS.find((d) => (d.recipe[0] === a && d.recipe[1] === b) || (d.recipe[0] === b && d.recipe[1] === a)) ?? null;
}

export function teaRegularFor(absday: number): TeaRegular {
  const week = Math.floor(absday / 7);
  return TEA_REGULARS[week % TEA_REGULARS.length];
}

// ---------------------------------------------------------------- Task 47: Family routines at home
export interface SpouseRoutine {
  day: number;
  kind: 'breakfast' | 'flowers' | 'outing';
  text: string;
  gift: string | null;
  claimed: boolean;
  note: string | null;
  awayHours?: [number, number];
}

export function rollSpouseRoutine(spouse: string, day: number, season: number, weather: string): SpouseRoutine {
  if (weather === 'Rain' || weather === 'Typhoon' || weather === 'Blizzard') {
    const dish = weather === 'Blizzard' ? 'Hot Milk' : season === 2 ? 'Stew' : 'Omelet';
    return {
      day,
      kind: 'breakfast',
      text: `${spouse} cooked a warm rainy-day breakfast (${dish}) and set a plate on the table for you.`,
      gift: dish,
      claimed: false,
      note: `${spouse}'s note: "Stay dry out there! Left a hot ${dish} on the table."`,
    };
  }
  if ((season === 0 || season === 1) && day % 2 === 0) {
    const flower = season === 0 ? 'Duskbell Flower' : 'Rosecap Flower';
    return {
      day,
      kind: 'flowers',
      text: `${spouse} tended the porch blooms this morning and tucked a fresh ${flower} by the vase.`,
      gift: flower,
      claimed: false,
      note: `${spouse}'s note: "The porch bed was thriving today — set a fresh ${flower} aside for you."`,
    };
  }
  return {
    day,
    kind: 'outing',
    text: `${spouse} left a note on the table before heading into town for afternoon errands (12 PM – 4 PM).`,
    gift: null,
    claimed: true,
    note: `${spouse}'s note: "Popped into Market Cross to chat with neighbors — back before supper!"`,
    awayHours: [12, 16],
  };
}

export function sanitizeSpouseRoutine(raw: unknown): SpouseRoutine | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SpouseRoutine>;
  if (!Number.isInteger(r.day) || (r.kind !== 'breakfast' && r.kind !== 'flowers' && r.kind !== 'outing') || typeof r.text !== 'string') {
    return null;
  }
  return {
    day: r.day as number,
    kind: r.kind,
    text: r.text.slice(0, 140),
    gift: typeof r.gift === 'string' ? r.gift : null,
    claimed: Boolean(r.claimed),
    note: typeof r.note === 'string' ? r.note.slice(0, 140) : null,
    awayHours: Array.isArray(r.awayHours) && r.awayHours.length === 2 ? [Number(r.awayHours[0]), Number(r.awayHours[1])] : undefined,
  };
}

// ---------------------------------------------------------------- Task 48: Indoor winter hobby — Stamp-printing bench
export const STAMP_MARKS = [
  { glyph: '▲', name: 'Peak' },
  { glyph: '◉', name: 'Sun' },
  { glyph: '≈', name: 'River' },
  { glyph: '✿', name: 'Blossom' },
  { glyph: '✦', name: 'Star' },
  { glyph: '⌂', name: 'Hearth' },
  { glyph: '♦', name: 'Gem' },
  { glyph: '♣', name: 'Pine' },
] as const;

export const STAMP_INKS = [
  { col: '0C', name: 'Frost Cyan' },
  { col: '09', name: 'Ochre Gold' },
  { col: '0A', name: 'Berry Rose' },
  { col: '0B', name: 'Pine Green' },
  { col: '07', name: 'Chalk White' },
] as const;

export interface StampPrint {
  marks: string;
  ink: string;
  title: string;
  day: number;
}

export function composeStampPrint(markIndices: number[], inkIndex: number, day: number): StampPrint {
  const picked = markIndices.slice(0, 3).map((i) => STAMP_MARKS[Math.abs(i) % STAMP_MARKS.length]);
  const ink = STAMP_INKS[Math.abs(inkIndex) % STAMP_INKS.length];
  const marks = picked.map((m) => m.glyph).join(' ');
  const title = picked.map((m) => m.name).join(' & ');
  return { marks, ink: ink.col, title: `${title} Print`, day };
}

export function sanitizeStampPrint(raw: unknown): StampPrint | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<StampPrint>;
  if (typeof r.marks !== 'string' || typeof r.ink !== 'string' || typeof r.title !== 'string' || !Number.isInteger(r.day)) return null;
  return { marks: r.marks.slice(0, 12), ink: r.ink.slice(0, 4), title: r.title.slice(0, 40), day: r.day as number };
}

// ---------------------------------------------------------------- G11: Reactive NPC dialogue & winter coats
export function reactiveNpcLine(
  npc: string,
  ctx: { weather: string; season: number; married: string | null; recentFestWin: boolean; lastGift?: string | null },
): string | null {
  if (ctx.weather === 'Typhoon') {
    return `${npc === 'Ingrid' ? 'Every shutter nailed tight!' : 'What a gale out there!'} Don't risk your crops in a typhoon like this.`;
  }
  if (ctx.weather === 'Blizzard') {
    return 'Keep your scarf pulled high today — this blizzard bites right through wool.';
  }
  if (ctx.weather === 'Rain') {
    if (npc === 'Rowan') return 'Rain hisses on the forge roof all morning. Saves you carrying the watering can, at least.';
    if (npc === 'Silas') return 'Rain brings mushrooms up in Cedar Hollow overnight — good weather for my plant notes.';
    if (npc === 'Nico') return 'Rainy surf always stirs up the big ocean fish. Good day for a stout rod.';
    return 'Nothing like a steady rain to give your fields a rest and fill the rain barrels.';
  }
  if (ctx.weather === 'Snow' || ctx.season === 3) {
    if (npc === 'Gideon') return 'Snow’s settling deep across Market Cross. Step into the inn anytime for a hot mug!';
    if (npc === 'Odessa') return 'Winter quiet makes the whole valley feel like an illustrated book.';
    if (npc === 'Hilde') return 'Cold air’s best for tempering steel. Keep your winter coat buttoned.';
    return 'Crisp winter air in Brackenford — good weather for indoor crafts and mine runs.';
  }
  if (ctx.recentFestWin) {
    return 'Everyone in Market Cross is still talking about your festival victory! Well earned!';
  }
  if (ctx.lastGift) {
    return `I’m still smiling about that ${ctx.lastGift} you brought me earlier. You really know how to brighten a day.`;
  }
  if (ctx.married && ctx.married !== npc && ctx.season === 0) {
    return `Spring suits you and ${ctx.married}! The farmhouse looks livelier than ever.`;
  }
  return null;
}
