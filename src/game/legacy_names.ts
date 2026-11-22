/**
 * The valley's names before it became Brackenford (see docs/originality-rework.md).
 *
 * Saves written before the rename store villagers, items and tool tiers by their old names
 * (hearts, gifts, inventory, shipped totals, memories), so `migrateLegacySave` rewrites a
 * save's text with this table before it is applied. The same table drove the one-off
 * rewrite of the source, so the two cannot drift apart.
 *
 * Order matters: compound names come before the words inside them ("Harvest Goddess"
 * before "Goddess", "Magic Red" before "Red Grass").
 */
export const LEGACY_NAMES: readonly (readonly [string, string])[] = [
  // Places
  ['Mineral Town', 'Brackenford'],
  ['Mineral Beach', 'Brackenford Beach'],
  ['Mineral Farmer', 'Brackenford Farmer'],
  ['Rose Square', 'Market Cross'],
  ["Mother's Hill", 'Beacon Hill'],
  ['Spring Mine', 'Copperseam Mine'],
  ['Lake Mine', 'Mirewater Mine'],
  ['Poultry Farm', 'Feathercote'],
  ['Yodel Ranch', 'Highmeadow Dairy'],
  ['Yodel', 'Highmeadow'],
  ['Aja Winery', 'Thornvale Vineyard'],
  ['Aja', 'Thornvale'],
  // Festivals (before the folklore names they contain)
  ['Goddess Festival', 'Well Dressing Day'],
  ['Chicken Sumo', 'Hen Show'],
  ['Starry Night', 'Lantern Night'],
  ['Harvest Festival', 'Harvest Supper'],
  // Folklore
  ['Harvest Goddess', 'Wellkeeper'],
  ['Goddess', 'Wellkeeper'],
  ['Kappa', 'Reed Heron'],
  ['Seven Harvest Sprites', 'Seven Hearthfolk'],
  ['Harvest Sprites', 'Hearthfolk'],
  ['Harvest Sprite', 'Hearthfolk'],
  ['Sprite Hut', 'Hearthfolk Hut'],
  ['Sprite hut', 'Hearthfolk hut'],
  ['Sprite Mini-Game', 'Hearthfolk Mini-Game'],
  ['Nappy', 'Drowse'],
  ['Hoggy', 'Snout'],
  ['Aqua', 'Puddle'],
  ['Staid', 'Grumble'],
  // Villagers (two-word forms first)
  ['Zack & Won', 'Otto & Ferreira'],
  ['Pastor Carter', 'Brother Lucan'],
  ['the Doctor', 'Dr. Sayer'],
  ['The Doctor', 'Dr. Sayer'],
  ['Doctor', 'Dr. Sayer'],
  ['Mary', 'Odessa'],
  ['Basil', 'Silas'],
  ['Anna', 'Clara'],
  ['Karen', 'Priya'],
  ['Jeff', 'Hollis'],
  ['Sasha', 'Meena'],
  ['Popuri', 'Juniper'],
  ['Rick', 'Dennis'],
  ['Lillia', 'Rosalind'],
  ['Elli', 'Margit'],
  ['Ellen', 'Edith'],
  ['Stu', 'Toby'],
  ['Ann', 'Tess'],
  ['Doug', 'Gideon'],
  ['Cliff', 'Felix'],
  ['Saibara', 'Hilde'],
  ['Gray', 'Rowan'],
  ['May', 'Pip'],
  ['Barley', 'Abel'],
  ['Thomas', 'Ambrose'],
  ['Harris', 'Wes'],
  ['Carter', 'Lucan'],
  ['Gotz', 'Ingrid'],
  ['Duke', 'Corin'],
  ['Manna', 'Elspeth'],
  ['Won', 'Ferreira'],
  ['Zack', 'Otto'],
  ['Kai', 'Nico'],
  // Flowers, herbs and tonics
  ['Moondrop', 'Duskbell'],
  ['Toy Flower', 'Pinwheel Daisy'],
  ['Pink Cat', 'Rosecap'],
  ['Magic Red', 'Emberbloom'],
  ['Blue Magic Grass', 'Wishing Moss'],
  ['Blue Grass', 'Bluewort'],
  ['Red Grass', 'Redroot'],
  ['Green Grass', 'Greenmint'],
  ['Orange Grass', 'Saffronleaf'],
  ['Yellow Grass', 'Goldenrod'],
  ['Indigo Grass', 'Woad'],
  ['Purple Grass', 'Heatherwort'],
  ['White Grass', 'Frostwort'],
  ['Black Grass', 'Nightshade'],
  ['Power Berries', 'Heartseeds'],
  ['Power Berry', 'Heartseed'],
  ['Turbojolt', 'Brisk Tonic'],
  ['Bodigizer', 'Mending Tonic'],
  // Ores, tool tiers and keepsakes
  ['Mystrile', 'Starsteel'],
  ['Orichalc', 'Sunbrass'],
  ['Adamantite', 'Deepiron'],
  ['Cursed', 'Fey'],
  ['CURSED', 'FEY'],
  ['Blessed', 'Hallowed'],
  ['BLESSED', 'HALLOWED'],
  ['Mythic', 'Heirloom'],
  ['Blue Feather', 'Promise Ribbon'],
  ['Teleport Stone', 'Waystone'],
  ['HRVSTMN', 'FURROW'],
];

/** Whole-word match: no letter right before or after, so "Ann" leaves "Anniversary" alone. */
function wordPattern(old: string): RegExp {
  const esc = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // "May" is also an English word ("May the Wellkeeper bless you"); only the villager moves.
  const guard = old === 'May' ? '(?! the\\b| you\\b| I\\b| we\\b)' : '';
  return new RegExp(`(?<![A-Za-z])${esc}(?![A-Za-z])${guard}`, 'g');
}

const PATTERNS = LEGACY_NAMES.map(([old, now]) => [wordPattern(old), now] as const);

/** Rename every old name in a piece of text. */
export function renameLegacy(text: string): string {
  let out = text;
  for (const [re, now] of PATTERNS) out = out.replace(re, now);
  return out;
}

/** A save with the old names rewritten; a save that has none comes back unchanged (same object). */
export function migrateLegacySave(d: Record<string, any>): Record<string, any> {
  const raw = JSON.stringify(d);
  const renamed = renameLegacy(raw);
  return renamed === raw ? d : JSON.parse(renamed);
}
