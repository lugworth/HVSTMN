# Originality rework: names borrowed from Harvest Moon: FoMT

Fill in the **New** column, then the swap can be done in one pass (data tables, dialogue,
map signs, tests, README). Counts are whole-word hits across `src/`, `components/`, `app/`,
`docs/` and `README.md`.

Most hits are in `src/game/engine.ts` (~120), `src/game/constants.ts` (~95) and
`src/game/engine.test.ts` (~65); the rest are scattered through `rules.ts`, `map.ts`,
`app/layout.tsx`, `app/not-found.tsx` and the README.

## Game and framing

| Now | Hits | New |
|---|---|---|
| HRVSTMN (title, package name, metadata) | 54 | |
| "ASCII tribute to Harvest Moon: FoMT" (README, layout metadata) | 12 | |

## Places

| Now | Hits | New |
|---|---|---|
| Mineral Town | 50 | |
| Rose Square | 39 | |
| Mother's Hill | 21 | |
| Spring Mine | 24 | |
| Lake Mine | 17 | |
| Poultry Farm | 13 | |
| Yodel Ranch | 12 | |
| Aja Winery | 8 | |

Generic names (Inn, Supermarket, Clinic, Church, Library, Museum, Blacksmith) are fine as
they are. The newer areas (Ironwood Grove, Cedar Hollow, Skyline Ridge, Willow Bend,
Lighthouse Point) are already original.

## Villagers (keys of `NPCS` in `constants.ts`)

| Now | Hits | New | | Now | Hits | New |
|---|---|---|---|---|---|---|
| Doug | 76 | | | Kai | 22 | |
| Gray | 56 | | | Elli | 22 | |
| Saibara | 55 | | | Carter | 21 | |
| Ann | 48 | | | Basil | 21 | |
| Zack | 47 | | | Won | 21 | |
| Thomas | 45 | | | Popuri | 20 | |
| Rick | 45 | | | Jeff | 20 | |
| Gotz | 44 | | | Barley | 19 | |
| Mary | 34 | | | May | 15 | |
| Lillia | 32 | | | Karen | 11 | |
| Cliff | 26 | | | Duke | 10 | |
| Manna | 8 | | | Harris | 3 | |

Also: **Harvest Goddess** (23), **Kappa** (23), **Harvest Sprites** (19). These are the
folklore layer: replace them with your own spirits or cut them. "Doctor" and "Curator" are
generic roles and can stay.

## Items, tools and events

| Now | Hits | New |
|---|---|---|
| Moondrop / Toy Flower / Pink Cat / Magic Red (flowers) | 75 / 34 / 28 / 16 | |
| Blue / Red / Green Grass (stat herbs) | 17 / 16 / 8 | |
| Power Berry | 22 | |
| Turbojolt / Bodigizer (tonics) | 12 / 11 | |
| Mystrile / Orichalc / Adamantite (ores) | 28 / 12 / 15 | |
| Cursed → Blessed → Mythic tool tiers | 20 / 8 / 25 | |
| Blue Feather (proposal item) | 13 | |
| Teleport Stone | 15 | |
| Chicken Sumo, Goddess Festival, Egg Hunt, Starry Night, Harvest Festival | 7 / 4 / 7 / 6 / 5 | |

## Before the swap: keep existing saves loading

Villager names are keys in saved games (hearts, gifts, favours, marriage). A rename has to
come with an old-name → new-name alias map, applied where saves are sanitised in
`engine.ts` / `save.ts`, plus a test that loads a pre-rename save. The same goes for item
names stored in the inventory and shipped totals.

## Status

Approved and applied on `feat/original-setting`. Old saves are migrated on load by
`src/game/legacy_names.ts` (tested in `legacy_names.test.ts`); add to that table whenever
something stored in a save is renamed.

Names found during the rework, approved separately:

| Now | New |
|---|---|
| Anna (Mary's mother) | Clara |
| Sasha (Jeff's wife) | Meena |
| Ellen (Elli's grandmother) | Edith |
| Stu (Elli's brother) | Toby |
| Sprites Chef, Nappy, Hoggy, Timid, Aqua, Staid, Bold | Crumb, Drowse, Snout, Wisp, Puddle, Grumble, Brass |
| Orange / Yellow / Indigo / Purple / White / Black Grass | Saffronleaf / Goldenrod / Woad / Heatherwort / Frostwort / Nightshade |
| Blue Magic Grass | Wishing Moss |
| Default farmer "Pete", farm "Moon" | Ash, Bramble |

Still to do: villager dialogue keeps much of its original flavour beyond the names; the
Reed Heron still takes cucumbers (river stones was the proposal).
