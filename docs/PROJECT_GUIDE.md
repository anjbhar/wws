Current ground update (October 21): Map001 uses generated muted olive grass around the retained central dirt training area. See [grass source, prompt and exports](art/courtyard-grass-v1/README.md). The versioned A5 sheet preserves all original dirt tiles; map upper layers, events and movement are unchanged. Earlier courtyard rebuild tools restore older ground; reapply `tools/apply-courtyard-grass.py` afterward.

Current combat update (v1.14, October 21): choose an opening stance for free before round 1. The opponent chooses its own opening form, then initiative is calculated from both forms. Both fighters retain their full first turns. Later Change Stance actions consume a turn; cancelling a later form menu is free. Forms persist across rounds. Cancelling the opening picker leaves sparring.

Current group practice (v1.17, October 21): talk to either warrior monk at (8,9) or (10,9) to fight both together. Choose a cut, an opponent, then a body area using arrows/Enter or clicks. Escape backs out of body selection to opponents, then actions; Escape on actions or the opening form picker leaves practice. Each monk gets a turn per round, and both must be defeated. The player stays alive at 1 Health, the party recovers afterward, and there are no rewards. Restart the playtest to load the updated plugin. Existing saves reload the changed map through the system version update. See [encounter record and checks](battles/monk-group.md).

# WWS Project Guide

Current courtyard (October 21): [the finished generated-only courtyard](maps/dojo-courtyard.md) supersedes older map descriptions below. Map002 is absent; dojo doors now display closed-door text, with no dangling transfers. The original hall and both full sparring events are preserved. See the linked map record for assets, previews and verification.

Updated October 20, 2026. Practical setup, controls, map layout, implementation, and verification for the current RPG Maker MZ prototype.

## Documentation

| Document | Owns |
|---|---|
| [ART_STYLE.md](ART_STYLE.md) | Shared visual rules, dimensions, perspective, lighting, and generation guidelines. |
| [COMBAT_DESIGN.md](COMBAT_DESIGN.md) | Current combat rules, tuning targets, and deferred mechanics. |
| This guide | Playing, map/encounter setup, implementation tools, testing, and recovery. |
| [ASSETS.md](ASSETS.md) | Asset filenames, sheet coordinates, import/passage settings, and production records. |

Keep numerical combat rules in COMBAT_DESIGN and per-asset details in ASSETS to avoid maintaining duplicate specifications.

## Playing

Reload the project in RPG Maker if its editor was open during external changes. Start a new game for the current actor assignment and spawn; older saves can retain previous character settings.

October 21 overworld art update: Actor 1 uses `$Samurai-v3`, Masanori uses `$SamuraiInstructor-v3`, and Shinsengumi uses `$Shinsengumi-v2`. All three are regenerated at approximately 15% larger visible size, with 64 × 88 frames on 192 × 352 sheets. Restart the playtest to load the new artwork. `WWS_OverworldCharacters` maps previous image names for older saves. Sources, prompts, previews, and export records are listed in [ASSETS.md](ASSETS.md); production scale and generation requirements are in [ART_STYLE.md](ART_STYLE.md).

The game and UI use 1280 × 720 (16:9), with the desktop window configured to the same size. Tiles and movement remain 48 × 48; current cast walking frames are 64 × 88, rendered at native 1× scale. The wider view shows more of the map. Maps narrower than the screen are centered with empty space at their sides. Actor 1 uses five rear-view form sprites in the lower-left of front-view duels, with the opponent in the upper-right. Restart an active playtest to load new code and assets.

- Arrow keys move; Enter/Z interacts. The party contains only actor 1, using the custom samurai walking sheet. Reid's name and original portrait remain placeholders.
- Walk onto either half of the red-wood home's double doorway to enter Samurai Home. Walk onto the room's lower exit to return. The exterior door is static and does not animate open.
- Approach Masanori at (12, 9), face him, and interact. Choose Spar or Not now; cancelling the dialogue declines.
- The Shinsengumi swordsman stands at (16, 10), on the right side of the courtyard. Face him, press Enter/Z, and choose Spar or Not now. His repeatable nonlethal duel uses the same rules and starting stats as Masanori, his own five guard sprites, and the courtyard background. Winning or leaving restores Health/MP; the player cannot fall below 1 Health during practice. Uses `$Shinsengumi-v2`, character index 0.
- At the start of a duel, choose Chudan, Jodan, Gedan, Kasumi, or Waki for free. Arrows or mouse preview the player pose; Enter/click confirms. The opponent independently chooses its opening form, then round 1 begins with initiative based on both choices. Opening selection never spends the first turn.
- After the free opening choice, each turn allows **one action**: Quick Cut, Heavy Cut, or Change Stance. Changing to a different form uses the turn instead of attacking; backing out is free. Use arrows/Enter or click a card. Parry/Block and Dodge happen automatically when attacked: Defense determines weapon-defense chance against the attacker's Attack, while Speed determines Dodge chance against the attacker's Speed. Successful defenses prevent damage and injury without spending a turn.
- Cuts show small Head, Torso, Arms, and Legs markers directly on Masanori. Hover/click a body region, or use arrows and Enter; the bottom panel explains the selected area. Choosing the area is part of the same action. Escape/right-click returns to actions without spending the turn. Temporary practice injuries can reduce defense, damage, or initiative; the HUD shows severity and duration.
- Decisions are untimed. There are no separate defense prompts or timing bars. The previous duel timer/automatic-defense Options entries are removed; old saved preferences have no effect.
- Escape/right-click during stance or action selection leaves sparring. There is no random escape roll. The player cannot fall below 1 Health or lose during practice, and can continue fighting at 1 Health. The event restores Health and MP before sparring and after winning or leaving; legacy loss recovery remains a fallback. No EXP, gold, or item rewards are given. The encounter is repeatable.

## Shinsengumi sparring setup — October 21

`node tools/add-shinsengumi-sparring.cjs` connects courtyard event 7 to enemy 7 and troop 7. It preserves the event's location and walking sheet, reuses Masanori's proven choice/recovery branches, and supplies separate dialogue. Can Escape and Can Lose are enabled; all outcomes recover the party, and no rewards are given. Pre-change Map001/Enemies/Troops data is retained under `docs/battles/backups/before-shinsengumi-sparring`. Re-running the placement tool retains the sparring interaction.

WWS_Duel v1.13 supports enemy notes `<DuelSprite: Shinsengumi>` and `<DuelSpriteVersion: 2>` for the five 288 × 288 stance images. Masanori retains his existing set. Troop tags `[WWS Duel] [WWS Courtyard]` enable nonlethal custom combat and the courtyard background; `[Bleeding]` is absent. WWS_DuelTargets v1.5 supplies opponent-specific hit regions, also used by localized feedback. All five stance images preload; Parry/Block shows Kasumi and Dodge shows Waki.

Run `node tools/check-shinsengumi-sparring.cjs` for saved event branches, recovery, stance/reaction lookup, targets, engine damage, practice protection and cleanup. The existing `check-duel.cjs`, `check-duel-feedback.cjs`, `check-samurai-encounter.cjs`, and `check-dojo-courtyard.cjs` remain regression checks. Browser previews: [duel](battles/shinsengumi-duel-preview.png), [body targets](battles/shinsengumi-target-preview.png). Restart the playtest and start a new game to load all map-event changes.

## Maps

All coordinates are zero-based map cells; each cell is 48 × 48 pixels.

| Map | Size | Tileset | Important locations |
|---|---|---|---|
| 001 — Village Courtyard | 25 × 19 | 9 — Edo Village — Red Wood Exterior | New-game spawn (12,12); Masanori (12,9); Shinsengumi (16,10); home thresholds (11,3)/(12,3). |
| 002 — Samurai Home | 17 × 13 | 8 — Edo Home — Starter | Entry destination (8,9); exit trigger (8,10), returning to courtyard (12,4). |

Redesigned and corrected October 18, 2026 to resemble the practice fight background: a broad dirt training yard, centered red-wood building, cream/red boundary wall across the back, and bamboo rooted in the foreground corner beds. The architecture meets the north boundary, removing the unused grass strip behind the roofs. Bamboo occupies (1,1)–(2,4) and (22,1)–(23,4): upper leaves overlap the wall while bases sit on clear ground one row in front. The north hedge provides a clean backdrop; repeated treetops and overlapping foreground trees were removed. Trees, rocks, and shrubs occupy narrow edge planting beds; paired lanterns frame the open practice area. Benches, stools, scattered supplies, fence fragments, and the stock shed remain removed. The southern path at (12,17) has placeholder text. There are no random encounters.

The compact building now occupies (9,0) through (14,3), retaining its 6 × 4 footprint (288 × 192 pixels) and approximately 80 × 72 pixel double doorway. Both door halves transfer to the same interior. Home return now lands at (12,4). The active D-v3 sheet adds a 3 × 3 boundary wall at sheet (0,8) and 2 × 4 bamboo at (4,8). Wall wings occupy map (1,1)–(8,3) and (15,1)–(23,3), with lower wall continuation behind the building's transparent side margins. Walls and planting bases block movement; roofs and upper foliage draw above characters. Blocked transparent underlay prevents walking through roof footprints.

The courtyard uses the custom exterior in slot D and village props in E. The home uses props in E. Stock terrain, trees, and interior remain placeholders. Tilesets 7 and 8 are the earlier starter configurations; tileset 9 extends the village set, and all original stock sets remain available.

Map previews: [current courtyard](maps/Map001-preview.png), [home](maps/Map002-preview.png), [compact house scale comparison](art/red-wood-exterior/scale-preview-v2.png), and [earlier 1280 × 720 courtyard in game](maps/widescreen-preview.png), which predates the compact exterior.

## Combat implementation

[WWS_Duel.js](../js/plugins/WWS_Duel.js) v1.14 is enabled in [plugins.js](../js/plugins.js). Core engine files are unchanged. It implements five selectable forms, live player previews, body targeting, cutting-level wound severity, temporary injuries, automatic Parry/Block and Dodge, recovery, and controlled-test Bleeding. Both fighters switch sprites with their selected form or automatic reaction. Reaction poses clear after the incoming attack. Actor 1 is registered as a battler so damage popups and incoming slash effects can find it. Stock battles and other actors retain normal visibility. See [COMBAT_DESIGN.md](COMBAT_DESIGN.md) for form values and [ASSETS.md](ASSETS.md) for production records.

The action menu contains only the two cuts. Parry and block are one automatic defense, not separate outcomes. Defense percentages are shown while targeting, using the chosen cut, body area, and actual combat stats. One roll chooses Parry/Block, Dodge, or a hit. Neither automatic defense adds recovery. NPC action weights now select only attacks, keeping each form's relative Quick/Heavy preferences.

Parry coverage also varies by the defender's committed form and the area attacked. Jodan/Kasumi favor upper-body coverage and expose the legs; Gedan favors the legs and exposes the head. Stance cards summarize these openings. The body picker and fallback target cards show actual Parry/Block and Dodge chances for the selected area and cut. NPCs receive the same coverage rules.

While aiming, [WWS_DuelTargets.js](../js/plugins/WWS_DuelTargets.js) v1.5 places an aligned column of live hit percentages beside Head, Torso, Arms, and Legs on Masanori. These subtract both automatic defenses from 100%, using the selected cut and current combat stats. Click a label or body region to attack. Only the selected area gets an outline and connector; all callouts hide when aiming ends.

The compact UI uses ink panels and ivory text, small Health bars and form labels at the top, a centered round indicator, and a single bottom choice strip. Injury, recovery, and Bleeding text appears only when active. The original oversized HUD, empty statuses, duplicate pose labels, blue selection frames, and repeated instructions are removed from custom duel choices. Combat mechanics and sprites are unchanged by this visual redesign.

October 20 redesigned-UI browser check at 1280 × 720 verified five-form selection, two attack choices, keyboard target navigation, live hit labels, clicking the Legs label to commit an attack, hidden labels during resolution, and the next round's Health/injury display. No runtime warnings/errors were reported. [Stance preview](battles/clean-ui-stance-preview.jpg) · [Target preview](battles/clean-ui-target-preview.jpg).

October 20 browser check: all four callouts fit beside the Jodan sprite at 1280 × 720. Quick Cut showed Head 67%, Torso 92%, Arms 93%, Legs 98%; cancelling hid the labels without spending Health or advancing the round. Heavy Cut updated them to 52%, 79%, 78%, and 84%. No browser runtime warnings/errors were reported. [Live hit-chance preview](battles/live-hit-chances-preview.jpg).

- Troop 6 always uses non-bleeding sparring.
- Other troop names containing `[WWS Duel]` enable the prototype only with one actor, one enemy, and turn-based combat. Unsupported encounters retain stock MZ behavior.
- Adding `[Bleeding]` to a tagged troop enables controlled injury testing. No Bleeding encounter is enabled on the starter map. Map-time wound handling is deferred; duel flags currently clear on battle exit.
- Weapon/enemy notes can use `<CuttingLevel: 1>` through 5. Default cutting level is 1; Heavy Cut adds one effective level. No database edits are required to try targeting and practice injuries in Masanori's existing encounter.
- Other sparring events should enable Can Escape and Can Lose and recover the party afterward, as Masanori's event does.
- Enemy 6, troop 6, skill 236, animation 121, and courtyard event 4 are Masanori's encounter records. Both cuts in the duel use skill 236 for the existing slash effect while the plugin calculates damage and defense. MZ handles logs, damage popups, enemy collapse, and battle outcomes.
- Masanori's map event is tagged `wws:samurai-sparring`, allowing the map builder to preserve it.

Items, magic, movement, multiple opponents, permanent injuries, mortal wounds, and extra progression systems remain outside this prototype. Balance still needs human playtesting.

The October 20 four-hit rebalance sets Masanori to 540 Health, 31 Attack, 20 Defense, and 28 Speed against the starting player's 544 / 31 / 20 / 29. Neutral, uninjured torso Quick (light) Cuts deal 140 and Heavy Cuts deal 280: four light or two heavy landed torso hits defeat Masanori. Incoming damage uses the same formula, but the player now stops at 1 Health and cannot lose practice. Head hits deal more and limb hits less; form and arm injuries still modify damage. Targeting shows actual damage alongside hit chance. Previous win-rate results predate this protection and are historical only. See [COMBAT_DESIGN.md](COMBAT_DESIGN.md#practice-duel-balance). Restart the playtest to reload code and enemy data.

Current targeting preview: [body selection directly on the enemy](battles/sprite-targeting-preview.png). [WWS_DuelTargets.js](../js/plugins/WWS_DuelTargets.js), loaded after the duel plugin, replaces target cards for Masanori's front-view sprites with small markers and a bottom details panel. Hover/click a region or use arrows and Enter; Escape/right-click returns to actions without spending the turn. Both limbs share one target. Each of the five poses has its own marker/hit positions. Other enemy artwork and side-view battles keep the original target cards. Browser checks confirmed keyboard selection, cancellation with unchanged Health/round, and a direct leg click applying a leg injury, with markers hidden during the attack and no runtime errors. Integration checks cover hit regions for all five poses.

Practice environment preview: [dedicated practice courtyard with both fighters and five forms](battles/practice-background-preview.png). [WWS_PracticeBackdrop.js](../js/plugins/WWS_PracticeBackdrop.js) selects the complete 1280 × 720 courtyard for troop 6 only; it does not alter saved map battleback settings. Browser playtesting confirmed the background fills the screen behind the fighters and menus with no runtime errors. Encounter checks cover troop scoping and stock background fallback.

Earlier previews: [five forms against the old map blur](battles/five-forms-preview.png), [first player Chudan and two-fighter composition](battles/player-chudan-preview.png), [1280 × 720 body-area selection](battles/widescreen-preview.png), [v1.2 body-area selection at the original resolution](battles/target-preview.png), [practice injury after an aimed cut](battles/injury-preview.png), [shared action menu from v1.1](battles/duel-preview.png), and [original front-view encounter](art/samurai-npc/battle-preview.png).

## Verification

Opening stance checks: `node tools/check-opening-stance.cjs` covers both opponents and all 25 player/NPC form combinations per opponent, free confirmation, preview isolation, round-1 initiative, full first turns, paid later changes, persistence, and leaving before round 1. The combat harness explicitly confirms Chudan for older neutral-form fixtures; pass `reset(id, true)` to leave the actual opening picker active. `simulate-practice-duel.cjs` now exercises the free opening phase.


Run from the project root:

```sh
node tools/check-duel.cjs
node tools/check-duel-feedback.cjs
node tools/check-samurai-encounter.cjs
```

For balance sampling, run `node tools/simulate-practice-duel.cjs 2000`. It shares the real-engine harness with the combat tests and does not modify game data. `--candidates` compares alternate practice Health values. Current October 20 results are in [practice-balance-four-hit-2026-10-20.json](battles/practice-balance-four-hit-2026-10-20.json).

The duel checks use the real MZ BattleManager, battlers, and Game_Action with rendering/audio boundaries stubbed. They cover attack-only untimed turns, automatic Defense-based Parry/Block and Speed-based Dodge, probability caps, reaction pose cleanup, target selection/cancellation without an extra action, shared NPC targeting, cutting-level probability thresholds, location penalties/refresh/expiry, initiative ties/recovery, single defense/wound rolls, Medium/Heavy nonstacking Bleeding, stock fallback, callbacks, and actual victory/defeat handling.

The encounter checks validate reachability and assets and execute the real event interpreter with simulated UI/battle boundaries for decline, win, escape, and loss recovery.

Feedback checks run the actual action resolver with rendering/audio boundaries stubbed. They verify impact-only outcome reveals, distinct hit/defense sounds, recoil and Dodge returning to the same anchor, no extra combat RNG, injury notifications only on changes, one-time practice protection, actual damage amounts, turn cues without spending actions, Health-bar easing, cleanup, and stock fallback.

The October 20 v1.11 browser renderer check used the real engine and battle plugins with temporary controls for repeatable impact-frame previews. Quick/Heavy damage numbers (140/280), localized slashes, target tint, trailing Health bars, Parry spark/pose, Dodge pose/sidestep, injury/effect text, the player turn cue, and first-time 1 HP protection were visually inspected at 1280 × 720. The HUD remained visible above the courtyard and the stock action log stayed hidden. No browser warnings or errors were recorded. Sound dispatch and asset existence were checked automatically; audio was not separately reviewed by ear. This was a presentation check, not a complete new enter/exit playthrough. [Heavy impact](battles/feedback-heavy.jpg) · [Parry](battles/feedback-parry.jpg) · [Practice protection](battles/feedback-protection.jpg).

Red-home placement checks the full tile assembly, blocked footprint, both entry transfers, return destination, routes to home/shed/southern path/NPC, and encounter preservation. Map layer lengths, asset references, spawn passage, and transfer destinations were also checked. Updated maps were rendered and visually inspected.

The following browser playtests are historical and predate v1.6 automatic defenses. A fresh browser playtest of v1.6 is not yet recorded. Earlier tests verified the courtyard, movement, NPC dialogue, the original encounter's victory/recovery, custom stance/action menus, and leaving a duel with Health/MP restored. The previous menu showed five actions, including turn-consuming Parry. A complete browser enter/exit test after the red-home replacement remains unverified; its transfer records and walkable destinations pass automated checks.

The October 11 v1.2 browser playtest verified all four target cards, cancellation back to the unchanged action turn, and a Heavy Cut aimed at arms. The cut reduced Masanori's Health and applied a Light arm practice impact visible in round 2, with Heavy Cut recovery shown on the player. No runtime errors were reported.

The October 15 widescreen browser check confirmed a 1280 × 720 canvas, courtyard framing, the standard menu, dialogue/choices, centered duel opponent, stance/action cards, and all four body-target cards. No runtime errors were reported. Combat and encounter integration checks still pass. The desktop window size is configured but was not separately tested in NW.js.

The v1.3 stance-sprite browser check confirmed Masanori enters in Chudan and changes to Jodan when his Aggressive stance is revealed, with `Pose: Jodan` visible in the HUD. No runtime errors were reported. [In-game pose preview](battles/stance-sprites-preview.png). Automated checks cover all five stance/defense mappings, hidden stance commitments, stock/side-view name fallback, and each pose file's RGBA format and 288 × 288 dimensions.

The v1.4 player-preview check confirmed both fighters appear together without overlapping the HUD/action cards, with the player's rear-view Chudan fixed while Masanori changes to Kasumi for Parry. Stance/action selection and Guard were observed with no runtime errors. Automated checks cover duel-only player visibility, stock/other-actor fallback, and the 320 × 320 RGBA asset. Incoming slash/damage popups use the engine's battler-sprite lookup; a landed player-hit animation was not captured during this composition playtest.

The October 16 v1.5 browser playtest verified all five stance cards fit together, and arrow navigation previews Chudan/Jodan/Gedan/Kasumi/Waki while the committed stance remains Chudan and the enemy remains hidden. Confirming Waki changed the committed stance and revealed Masanori's Gedan. Choosing Parry then showed Kasumi while retaining Waki's combat form. No runtime errors were reported. Automated checks cover every NPC form, shared form bonuses, preview isolation, invalid selections, recovery/defense expiry, and all five 480 × 384 player assets. Old action logs clear before new form previews to keep the figures visible.

## Build, import, and preview tools

These tools can write project data. Preserve manual edits before running installers or rebuilding layouts.

| Tool | Purpose |
|---|---|
| [build-starter-map.cjs](../tools/build-starter-map.cjs) | Rebuilds both starter maps, validates navigation, preserves the tagged NPC, and reapplies the red-wood exterior if registered. Replaces other manual map edits. |
| [place-red-wood-home.cjs](../tools/place-red-wood-home.cjs) | Installs the courtyard exterior and right-door transfer, configures collision, and validates navigation. Subsequent runs validate the installed arrangement without reapplying it. |
| [add-samurai-npc.cjs](../tools/add-samurai-npc.cjs) | Installs/updates Masanori and his database records; can replace manual encounter edits. |
| [add-red-wood-exterior.cjs](../tools/add-red-wood-exterior.cjs) | Registers the D sheet as a new tileset while preserving previous records. Reuses an existing registration. |
| [render-starter-map.py](../tools/render-starter-map.py) | Renders maps 001/002 into `docs/maps` previews. Requires Python with Pillow; does not emulate every engine visual effect. |
| [clean-starter-map.cjs](../tools/clean-starter-map.cjs) | Removes courtyard furniture, scattered supplies, fence fragments, and the stock shed/interaction; repairs grass edges. Reapplied by starter-map rebuilds. |
| [shape-dojo-courtyard.cjs](../tools/shape-dojo-courtyard.cjs) | Applies the battle-background-inspired layout and new entrance coordinates. Reapplied after cleanup on starter-map rebuilds; repeat runs validate. |
| [check-dojo-courtyard.cjs](../tools/check-dojo-courtyard.cjs) | Checks building/wall collision, both home transfers, return, spawn routes, practice approach, and encounter preservation. Older placement/cleanup tools defer to this check on the redesigned map. |

Asset export recipes are listed in [ASSETS.md](ASSETS.md). The map renderer is for saved-map review, not editing source artwork.

## Recovery files

| Backup location | Captures |
|---|---|
| `docs/maps/backups/before-starter-map/` | Original Map001, MapInfos, Tilesets, and System before starter-map creation. |
| `docs/battles/backups/before-samurai-npc/` | Map001, Enemies, Troops, Skills, and Animations before the NPC encounter. |
| `docs/art/red-wood-exterior/Tilesets-before-v1.json` | Tilesets before registration of the red exterior. |
| `docs/maps/backups/before-red-wood-home/` | Map001 and Tilesets before placing the red-wood home. |
| `docs/maps/backups/before-compact-home-v2/` | Map001 and Tilesets before reducing the house footprint. |
| `docs/maps/backups/before-dojo-courtyard/` | Map001, Map002 and Tilesets before the centered dojo courtyard redesign. |
| `docs/battles/backups/before-widescreen/` | System, desktop window settings, and duel plugin before the 1280 × 720 layout. |

These are stage-specific snapshots, not a complete current-project backup. Restoring an older snapshot can undo later changes to that file; inspect it before copying it over live data. Original generated images, prompts, and export records remain in the asset directories.

Layering recovery snapshot: `docs/maps/backups/before-dojo-layering-v2/` preserves Map001, Map002 and Tilesets before correcting the bamboo roots and north backdrop.
