# FURROW — Fun & Excitement Improvements Proposal

**Status**: All 16 user-requested focus areas already implemented (598 tests pass). This proposal outlines the *next tier* of improvements to deepen dynamic events, reward loops, progression, and UI cues — inspired by Stardew Valley, Story of Seasons, Palia, and A Short Hike.

---

## 1. Dynamic Events

| Current (Implemented) | Next-Tier Proposal | Inspiration |
|---|---|---|
| **Night surprises**: falling stars, glowmoths, doorstep parcels (task 55) | **Aurora Borealis** — rare green-curtain sky on clear autumn nights; reported at dawn; encourages night walks | *Short Hike* aurora, *Stardew* fairy/witch events |
| **Mushroom flush** after rain in Cedar Hollow (task 35) | **Seasonal meteor showers** — summer nights: 3–5 “shooting stars” land as Star Rocks across farm/valley; each yields a unique fragment; museum wing “Celestial” | *Stardew* meteorite, *Palia* shooting stars |
| **Dog morning clue** (task 29) | **Pet personality quirks** — dog barks at specific NPCs, chases fireflies, “finds” a lost item once/week; cat leaves “gifts” (moth, feather) on porch | *Stardew* pet behaviors |
| **Festival roles** (task 13) | **Pop-up micro-festivals** — 5–10% chance a travelling troupe sets up for one evening in Market Cross: storytelling, card games, dance; unique dialogue + small reward | *Palia* Maji Market, *Short Hike* hawk peaks |
| **Trail encounters** (task 36) | **Dynamic valley events** — storm-washed bridge needs repair (community goal); wandering merchant with rare seeds; lost child mini-quest | *Story of Seasons* travelling merchants |

**Priority implementation**: Aurora Borealis (additive, testable, no RNG coupling to existing night_surprise).

---

## 2. Reward Loops

| Current | Next-Tier Proposal | Inspiration |
|---|---|---|
| **Market regulars** weekly orders (task 10) | **Seasonal “Harvest Festival” contract** — week-long bulk order from Gideon/Thornvale; fulfill to unlock exclusive kitchen furniture / wallpaper | *Stardew* Qi quests, *Story of Seasons* bazaar |
| **Museum exhibits** with story pieces (task 16) | **“Curator’s Choice” weekly spotlight** — one exhibit highlighted; donating its missing piece grants mastery XP + unique title in museum book | *Animal Crossing* museum, *Palia* collections |
| **Maker batches** walk-up machines (task 30) | **Maker mastery tiers** — after 50/100/200 batches, unlock “double output” / “half time” / “random bonus item” perks for that maker | *Stardew* artisan profession, *Story of Seasons* maker levels |
| **Preserves & seed saving** (tasks 19, 31) | **Heirloom lineage** — seeds saved from a crop you grew carry its “memory” (e.g., “grown in Year 3 rain”); planting heirloom gives tiny quality boost + flavor text | *Story of Seasons* seed genetics |

**Priority**: Maker mastery tiers (data-only, no engine changes; fits progression).

---

## 3. Progression

| Current | Next-Tier Proposal | Inspiration |
|---|---|---|
| **Mastery perks** (progression.ts) | **Valley legacy projects** — multi-season community builds (bridge, gazebo, orchard) funded by weekly contracts; each phase unlocks a permanent map change + NPC routine | *Stardew* community center, *Story of Seasons* town upgrades |
| **Food buffs & recipes** (progression.ts) | **Cooking contest league** — weekly at inn; enter a dish; judged on rarity/quality; seasonal trophy + recipe unlock; league table in inn | *Stardew* cooking festival, *Palia* cooking |
| **Animal personalities** (task 25) | **Barn “family tree”** — breeding records show lineage; traits (timid/curious) inherited; rare “champion” bloodline unlocks golden wool/milk | *Story of Seasons* breeding, *Stardew* animal hearts |
| **Mine elevators** (task 40) | **Deep-delve expeditions** — once per season, form a party (hire sprites/neighbors) to reach floor 120+; unique boss room + exclusive mineral | *Stardew* skull cavern, *Short Hike* summit |

**Priority**: Cooking contest league (builds on inn evening, makers, orders — all exist).

---

## 4. UI Cues

| Current | Next-Tier Proposal | Inspiration |
|---|---|---|
| **First-morning checklist** (task 50) | **“Today at a Glance” widget** — compact HUD strip: weather icon, festival flag, order deadline, pet clue, aurora/meteor notice; tap to jump to almanac page | *Palia* daily board, *Short Hike* map pins |
| **Planting forecast** (task 24) | **Soil moisture overlay** — press a key to tint farm tiles by wetness (dry → watered → rain-soaked); works with compost/barrel indicators | *Story of Seasons* soil view |
| **Reminders on calendar** (task 51) | **Seasonal goal tracker** — player sets 3 goals/season (e.g., “catch 5 sturgeon”, “max friendship Rowan”); progress bar on calendar page | *Story of Seasons* goals, *Palia* accomplishments |
| **Rain notifications** (flush_coming / TV) | **“Tomorrow’s Outlook” toast** — on sleep, a one-line preview: “Rain tomorrow → mushrooms in Cedar Hollow”, “Festival Friday → prep dish” | *Stardew* TV weather, *Short Hike* summit view |

**Priority**: “Today at a Glance” widget (leverages existing data, compact-layout friendly, phone-safe).

---

## Implementation Plan (Key Features)

| # | Feature | Files Touched | Risk | Test Strategy |
|---|---|---|---|---|
| 1 | **Aurora Borealis** night-sky event | `constants.ts` (text), `engine.ts` (field + `night_sky` method + day-start hook), `engine.test.ts` (tests) | Low — additive only, no existing logic changed | `withRandom` controlled test + deterministic season/weather gate |
| 2 | **Maker Mastery Tiers** (data + rules) | `progression.ts` (perk data), `rules.ts` (batch calc), `progression.test.ts` | Low — pure functions | Unit tests for batch multiplier at each tier |
| 3 | **Today at a Glance** widget | `screen.ts` (HUD line), `engine.ts` (data gather), `enhanced.ts` (render) | Medium — UI rendering | Snapshot tests for compact/desktop at 3 breakpoints |

**Start with #1** — it’s the smallest self-contained dynamic event, validates the “next-tier” pattern, and adds a delightful seasonal surprise without coupling to RNG sequences used by existing tests.

---

## Acceptance Criteria

- `npm test` remains green (598+ tests pass)
- `npx tsc --noEmit` clean
- New feature has ≥3 tests (happy path, edge case, save/load)
- Feature respects Isotope palette, compact layout, reduced motion
- No external dependencies added