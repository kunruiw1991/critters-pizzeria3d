# 🍕🐾 Critter Pizzeria 3D (`小镇大厨` Edition)

**Play Live:** [https://kunruiw1991.github.io/critters-pizzeria3d/](https://kunruiw1991.github.io/critters-pizzeria3d/)

![Critter Pizzeria 3D Gameplay Screenshot](./screenshot.jpg)

---

## 🎮 Overview & Core Gameplay Loop

**Critter Pizzeria 3D** is a cozy, tactile, 100% zero-text 3D WebGL time-management pizzeria game inspired by *Cooking Marina* (`小镇大厨`), designed to be immediately intuitive for both a 5-year-old child and an adult player.

### 🍕 Core Menu & Interactive Toy Combo Stations (Pillar 1)
1. **Cheese Pizza (`25` base coins)**: Plump dough + rich tomato sauce + golden mozzarella cheese baked in a brick oven (`3.0s`).
2. **Pepperoni Pizza (`35` base coins)**: Cheese pizza base topped with savory red pepperoni slices (`3.0s` bake).
3. **Supreme Pizza (`45` base coins)**: Cheese pizza base topped with red pepperoni slices + crisp green bell-pepper rings & basil (`3.0s` bake).
4. **Golden Mango Juice (`15` base coins)**: Auto-refilling golden mango juice dispensers (`2.5s` refill) topped with an orange slice and straw when ready.
5. **Strawberry-Vanilla 3D Gelato Sundae Bar (`gelato_station`, `+20` bonus coins & `+6.0s` patience)**: Multi-step interactive Italian gelato station (`empty -> swirled -> topped -> serve`). Tap to swirl pastel strawberry-vanilla gelato, crown with golden star sprinkles & a ruby cherry, and launch a 3D sundae cup to any waiting customer!
6. **Golden Honey-Star Crust Shaker (`star_crust`, `+15` bonus coins)**: Tap or drag onto any pizza on the prep boards or brick ovens (or tap on an empty board for forgiving 1-tap auto-dough + star glaze) to rim the crust with 8 sculpted 3D golden stars and honey glaze.

### 🐥 Sous-Chef Helper Buddy & Trattoria Party Fever (Pillar 2)
- **3D KickinChicken Sous-Chef Helper (`helper_buddy`)**:
  - **Automatic Burn-Prevention Shield**: Watches both brick ovens and automatically waves a golden star wand to rescue any baked pizza (`burnProgress >= 0.62 -> 0.15`) so a 5-year-old's pizza never burns while the Sous-Chef is on duty!
  - **1-Tap Kitchen Assist**: Tap `helper_buddy` anytime to rescue an oven, auto-serve a ready dish, or cheer up all waiting customers (`+3.0s` patience, `+10` bonus coins).
- **Trattoria Party Fever (`combo >= 3` or `triggerPartyFever()`)**:
  - Reaching a `3x` combo streak triggers `6.0s` of **Trattoria Party Fever** with rotating 3D disco lights, falling 3D star confetti, frozen customer patience drain, and `+15` bonus coins on every dish served!

### 🌅 Progressive Wave 1 / 2 / 3 Trattoria Evolutions (Pillar 3)
- **Wave 1 (`morning_trattoria`)**: Warm terracotta morning sunlight, potted 3D basil herbs on the back shelf, Gelato Bar, Star-Crust Shaker, and Sous-Chef Helper Buddy.
- **Wave 2 (`sunset_fiesta`)**: Amber-gold sunset lighting, 3D festival bunting pennants & glowing lanterns, a spinning 3D illuminated pizza wall emblem, and rainbow star-sprinkle jars at the Gelato Bar.
- **Wave 3 (`starlight_gala`)**: Royal twilight-gold lighting, golden crown arches over both brick ovens, overhead crystal starlight chandeliers, a triple-tier golden gelato fountain tower, and floating golden sparkles behind all 3 customer slots.

---

## 🏆 Strict Top-3 Podium Qualification (`🥇 3⭐`, `🥈 2⭐`, `🥉 1⭐`, `4th/5th = 0⭐ Defeat`)

Each of the **3 Waves** serves **8 Smiling Critter customers** (`baba`, `dogday`, `catnap`, `craftycorn`, `hoppy`, `picky`, `bubba`, `kickin`). You play as **Chef CatNap** by default (or tap the `80x80px` **Chef Toque Hat Avatar** in the top-left HUD pill to cycle your Chef character). At the end of each wave, the **Zero-Text 5-Critter Olympic Podium Modal** highlights your Chef Critter with a **White Chef Toque Hat Badge** and compares your coins against 4 rival scores:

| Podium Finish | Wave 1 Coins | Wave 2 Coins | Wave 3 Coins | Star Rating | Wave Progression |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1st Place (`🥇`)** | `coins >= 220` | `coins >= 285` | `coins >= 315` | `⭐⭐⭐` Gold Crown Trophy | Unlocks Next Wave |
| **2nd Place (`🥈`)** | `coins >= 165` | `coins >= 215` | `coins >= 240` | `⭐⭐` Silver Medal | Unlocks Next Wave |
| **3rd Place (`🥉`)** | `coins >= 110` | `coins >= 145` | `coins >= 165` | `⭐` Bronze Medal | Unlocks Next Wave |
| **4th / 5th Place** | `coins < 110` | `coins < 145` | `coins < 165` | `0⭐` Defeat | Next Wave Locked (Retry Only) |

---

## 🛠️ Architecture & Verification Summary

- **Engine**: Local Three.js (`models/three.module.min.js`) + procedural 3D Baba Chops plush rig (`models/baba_chops_model.js`) + 3D Sous-Chef Helper & Party Fever rig (`js/helper_and_events.js`) + 100% procedural WebAudio synthesis (`js/audio.js`).
- **Verified Invariants (`1280x800`, `844x390`, `390x844`)**:
  - `alphaHanziCount === 0` (`0` visible text/digits in DOM or Canvas, `0` `speechSynthesis` calls).
  - Non-IBL material hygiene: `maxMetalness = 0.220` (`<= 0.22`) across all `1,073` 3D scene meshes.
  - Child-friendly touch targets: `5` total interactive DOM controls (`<= 6` cap), all `>= 80x80px` with `0px` overlap and `0` scrollbars.
  - Constant child-friendly difficulty: Baseline guided playtest achieves **1st place (`3 stars`)** across Wave 1 (`590` coins), Wave 2 (`640` coins), and Wave 3 (`660` coins) with `0` missed customers.
- **3-Round Collaborative Design Debate**: See [DEBATE_critters-pizzeria3d.md](./DEBATE_critters-pizzeria3d.md).
