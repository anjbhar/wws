# WWS Asset Reference

October 21 finished courtyard: [asset and map record](maps/dojo-courtyard.md). New custom A5/E sheets and versioned D-v4 architecture are active. Retained generation sources, exact built-in image_gen prompts, native exports and tile coordinates: `docs/art/courtyard-finish/`.

Updated October 10, 2026. Consolidated filenames, layouts, import settings, and production records. Shared artistic rules live in [ART_STYLE.md](ART_STYLE.md); map/encounter setup and testing live in [PROJECT_GUIDE.md](PROJECT_GUIDE.md).

All listed custom artwork was generated with the built-in imagegen tool and exported using nearest-neighbor resizing with alpha preserved. These are prototype assets; resizing does not repair every generated pixel cluster or animation inconsistency. Preserve original sources and exact prompts when making new versions.

## Game assets

| Asset | Game file | Dimensions | Current use |
|---|---|---|---|
| Legendary Ronin walking | [$StrawHatRonin-v1.png](../img/characters/$StrawHatRonin-v1.png) | 192 × 352 | Courtyard boss NPC at (18,8), event 13; both swords sheathed at left hip. [Source, prompts and comparison](art/straw-hat-ronin/README.md). |
| Legendary Ronin battle | [StrawHatRonin-v2.png](../img/enemies/StrawHatRonin-v2.png) | 288 × 288 | Enemy 10, troop 9; repeatable protected boss spar. [Encounter and checks](battles/legendary-ronin.md). |
| Kimono woman battle | [KimonoWoman-v4.png](../img/enemies/KimonoWoman-v4.png) | 288 × 288 | Approved standalone battle sprite with plain hairpin; [source and production record](art/kimono-woman/README.md). |
| Protagonist | [$Samurai-v3.png](../img/characters/$Samurai-v3.png) | 192 × 352 | Actor 1, character index 0; 69px front standing height. |
| Masanori walking | [$SamuraiInstructor-v3.png](../img/characters/$SamuraiInstructor-v3.png) | 192 × 352 | Courtyard NPC at (12,9); 67px front standing height. |
| Masanori battle baseline | [SamuraiInstructor-v1.png](../img/enemies/SamuraiInstructor-v1.png) | 288 × 288 | Original enemy 6 database image outside custom front-view duels. |
| Shinsengumi walking | [$Shinsengumi-v2.png](../img/characters/$Shinsengumi-v2.png) | 192 × 352 | Courtyard sparring NPC at (16,10), event 7; 64px front standing height. |
| Masked warrior monk walking | [$WarriorMonk-Masked-v2.png](../img/characters/$WarriorMonk-Masked-v2.png) | 192 × 448 | Courtyard NPC at (8,9); revised cast style, 67px standing body plus full carried naginata. |
| Unmasked warrior monk walking | [$WarriorMonk-Unmasked-v2.png](../img/characters/$WarriorMonk-Unmasked-v2.png) | 192 × 448 | Courtyard NPC at (10,9); revised cast style and the same 67px standing body scale. |
| Shinsengumi battle baseline | [Shinsengumi-Chudan-v2.png](../img/enemies/Shinsengumi-Chudan-v2.png) | 288 × 288 | Enemy 7; five stance images listed below. |
| Original player battle prototype | [Samurai-ChudanBack-v1.png](../img/battlers/Samurai-ChudanBack-v1.png) | 320 × 320 | Preserved approved Chudan; current form set uses padded v2 files below. |
| Village props | [EdoVillage_B-v1.png](../img/tilesets/EdoVillage_B-v1.png) | 768 × 768 | **Slot E** in tilesets 7, 8, and 9, despite the B suffix. |
| Red-wood exterior / courtyard | [EdoRedWoodExterior_D-v3.png](../img/tilesets/EdoRedWoodExterior_D-v3.png) | 768 × 768 | Slot D in tileset 9; unchanged compact home plus rear wall and bamboo. |
| Practice battle background | [EdoPracticeCourtyard-v1.png](../img/battlebacks1/EdoPracticeCourtyard-v1.png) | 1280 × 720 | Opaque complete scene for Masanori's troop 6. |

## Current overworld size update — October 21, 2026

All three walking sheets were regenerated with built-in image_gen at approximately 15% larger visible size. The current files above use twelve 64 × 88 frames, soles at cell y=84 and feet centered near x=32. These are native-size assets rendered at 1×; the 48px movement grid and battle artwork are unchanged. New database assignments use the versioned names, and [WWS_OverworldCharacters.js](../js/plugins/WWS_OverworldCharacters.js) maps previous names to the new bitmaps for older saves and placement tools.

Production records: [sources and export details](art/overworld-larger-v1/README.md), [exact generation prompts](art/overworld-larger-v1/generation-prompts.json), [frame metadata](art/overworld-larger-v1/export.json), [in-game view](art/overworld-larger-v1/frames-2-1.png), and [runtime results](art/overworld-larger-v1/browser-check.json). Verification covered all twelve frame/direction views, a keyboard movement loop, doorway proportions, native sprite scale and anchors, legacy bitmap aliases, and no browser errors. Previous assets and database/configuration backups are preserved. Shared requirements and the reusable prompt are in [ART_STYLE.md](ART_STYLE.md).

## Previous overworld style update — October 21, 2026

The following records describe the superseded 48 × 72 exports; use the current size update above for production dimensions and assignments.

The protagonist and Masanori now use v2 walking sheets generated with built-in image_gen to match the approved Shinsengumi sheet's readable face, silhouette, fabric shading, and stylized adult proportions. Identity is preserved: the player has an indigo kimono, red-brown obi and black topknot; Masanori has a russet kimono, indigo obi, greying temples, short beard and topknot. Each sheet has twelve 48 × 72 frames on a 144 × 288 transparent canvas, with down/left/right/up rows and walk/stand/walk columns. Battle artwork remains as previously assigned.

Player records: [source](art/main-character/walking-source-v2.png), [exact prompt](art/main-character/walking-prompt-v2.txt), [export metadata](art/main-character/walking-export-v2.json), [4× preview](art/main-character/walking-preview-v2.png). Masanori records: [source](art/samurai-npc/walking-source-v2.png), [exact prompt](art/samurai-npc/walking-prompt-v2.txt), [export metadata](art/samurai-npc/walking-export-v2.json), [4× preview](art/samurai-npc/walking-preview-v2.png).

[Export recipe](art/export-overworld-v2.py) locates each generated row, uses one common scale per sheet, preserves alpha with nearest-neighbor resampling, and aligns feet at cell y=68. Checks confirm twelve nonempty frames with transparent edge margins, correct dimensions, and valid database assignments. The [rendered starter map](maps/Map001-preview.png) was inspected with all three characters; courtyard traversal and Masanori's encounter checks pass. These v2 sheets have not yet been checked in a running playtest.

[Assignment tool](../tools/use-overworld-v2.cjs) updates Actor 1 and Masanori's event and keeps the NPC placement tool current. Original v1 images remain available; pre-update Actors/Map001 data is saved under `docs/maps/backups/before-overworld-v2`. Start a new game to pick up the player's new image; existing saves can retain the old actor and map-event graphics.

## Warrior monk battle sprites — October 21, 2026

Current style revision: [masked battle v2](../img/enemies/WarriorMonk-Masked-v2.png), [unmasked battle v2](../img/enemies/WarriorMonk-Unmasked-v2.png), and both walking sheets above replace the original textured rendering with larger stylized faces and simpler cloth shading. Masanori and Shinsengumi supply the style; the original monk references supply costume/identity. [Current sources, exact prompts, exports, before/after comparison and in-game verification](art/warrior-monks/style-v2/README.md). Previous files below are historical. The walking replacements are assigned in the courtyard with old-name aliases; battle v2 files are assigned to enemies 8/9 in the shared [two-monk practice encounter](battles/monk-group.md).

Two separate static battle sprites based on the user's warrior monk reference: [masked](../img/enemies/WarriorMonk-Masked-v1.png) and [unmasked](../img/enemies/WarriorMonk-Unmasked-v1.png). Both preserve pale layered robes, red-brown waist armor, dark wraps, sandals, and a complete naginata. The masked version keeps the hood and cloth face wrap; the unmasked version keeps the exposed face, shaved head and white headband. Transparent 288 × 384 exports allow weapon clearance while targeting the existing human battle body scale. [Production records, sources, exact built-in image_gen prompts, and export recipe](art/warrior-monks/README.md). These are standalone assets awaiting enemy/encounter assignment.

Both monks also have [overworld walking sheets and courtyard placements](art/warrior-monks/overworld/README.md). The 64 × 112 cells provide extra polearm clearance while maintaining 67px standing bodies, native 1× scale, and the same foot padding as the current cast. Each monk has twelve frames. They stand beside one another at (8,9) and (10,9); talking to either now starts their shared group practice. Exact generation/cleanup prompts, source versions, export measurements, map/system backups, and in-game verification records are in the linked production directory.

## Practice battle background

Created October 16, 2026 with built-in image_gen, using the compact red-wood house for architecture/palette and Masanori's Chudan sprite for rendering style. A red timber dojo, cream boundary walls, bamboo and pale dirt courtyard leave the fighters' ground positions clear. The full scene occupies battleback layer 1; layer 2 is empty. [WWS_PracticeBackdrop.js](../js/plugins/WWS_PracticeBackdrop.js) applies this only to troop 6, fits the viewport without overscan, and disables texture smoothing. Other encounters retain their normal background selection.

Production records: [source](art/practice-background/source-v1.png), [exact prompt and mode](art/practice-background/generation-prompt-v1.txt), [export metadata](art/practice-background/export-v1.json), and [export recipe](art/export-practice-background.py). The export preserves the opaque generated source and resizes to 1280 × 720 with nearest-neighbor sampling. [In-game preview](battles/practice-background-preview.png) confirms both fighters and the stance cards remain readable.

## Protagonist

Created October 7, 2026. Indigo kimono, charcoal hakama, cream collar, red-brown obi, sandals, black topknot, and a sheathed katana. Actor 1 still has the placeholder Reid name, face, and original battle-image assignment; the custom map sheet is installed. Older saves may retain the earlier walking image.

The `$` prefix selects a single-character sheet with three columns and four rows. The original export used 48 × 72 frames; the active version uses 64 × 88 frames as specified above. Rows are down, left, right, up; columns are walking A, standing, walking B. Dimensions, transparency, layout, and enlarged appearance were checked; the character has since been observed moving in browser playtests. Small frame differences remain candidates for refinement.

Production records in `docs/art/main-character/`:

- [samurai-source-v1.png](art/main-character/samurai-source-v1.png): original generated sheet.
- [samurai-preview-v1.png](art/main-character/samurai-preview-v1.png): 3× exported-sheet review.
- [generation-prompt.txt](art/main-character/generation-prompt.txt): exact prompt, extracted from the former README during consolidation.

The October 15 battle-composition preview introduced a rear three-quarter Chudan sprite: indigo kimono, charcoal hakama, red-brown obi, black topknot, sandals, and a two-handed katana facing upper-right. The player appears in the lower-left foreground, with Masanori in the upper-right. On October 16, four matching forms were generated and all five became selectable in the duel. These are static poses; incoming slash effects and damage popups use the visible battler sprite.

The original Chudan's 320 × 320 canvas and y=304 foot baseline are retained as the approved reference. Current v2 forms share 480 × 384 transparent canvases with a foot baseline at y=368 and a common foot axis at x=240. Extra transparent padding fits Jodan's raised blade and Waki's rear-facing sword. Chudan v2 copies the approved v1 pixels unchanged into this padding; normal body height stays about 280 pixels, with Kasumi lower for its crouched guard. The larger foreground figure is intentional. Nearest-neighbor export preserves alpha; alignment ignores faint generation residue and uses warm-colored feet/sandals to avoid mistaking low blades for feet.

Production files: [generated source](art/main-character/battle-chudan-source-v1.png), [exact prompt](art/main-character/battle-chudan-prompt.txt), [export metadata](art/main-character/battle-chudan-export-v1.json), and [export recipe](art/export-player-battle.ps1). Created with the built-in image generator using the player's walking sheet for identity and Masanori's Chudan image for rendering style.

Current player form files (all 480 × 384 RGBA):

| Form | File | Display |
|---|---|---|
| Chudan | [Samurai-ChudanBack-v2.png](../img/battlers/Samurai-ChudanBack-v2.png) | Selected middle guard; approved art with added padding. |
| Jodan | [Samurai-JodanBack-v2.png](../img/battlers/Samurai-JodanBack-v2.png) | Selected high guard. |
| Gedan | [Samurai-GedanBack-v2.png](../img/battlers/Samurai-GedanBack-v2.png) | Selected low guard. |
| Kasumi | [Samurai-KasumiBack-v2.png](../img/battlers/Samurai-KasumiBack-v2.png) | Selected raised side guard or automatic Parry/Block. |
| Waki | [Samurai-WakiBack-v2.png](../img/battlers/Samurai-WakiBack-v2.png) | Selected rear guard or automatic Dodge. |

Stance-card highlighting previews the full-size player pose without committing the form. All five player images preload. Automatic defense reactions take visual priority during the incoming attack, then the selected form returns. Original actor database battle-image assignments and walking art remain available outside custom front-view duels.

New production records in `docs/art/main-character/forms/`: [exact prompts](art/main-character/forms/generation-prompts.json), [pose comparison](art/main-character/forms/forms-preview-v2.png), and [alignment/export metadata](art/main-character/forms/export-v2.json). Original sources are retained as `jodan-source-v1.png`, `gedan-source-v1.png`, `kasumi-source-v1.png`, and `waki-source-v1.png`. Created with the built-in image generator using approved player Chudan for identity and the matching opponent pose as a pose reference. [export-player-forms.ps1](art/export-player-forms.ps1) reproduces the v2 set without repainting source pixels.

## Shinsengumi battle sprites

Created October 20, 2026 with built-in image_gen. The user's clothing reference supplies the asagi blue haori with white sawtooth sleeve edging, indigo kimono, and striped hakama; the hairstyle reference supplies short, tousled black hair. The existing Masanori Chudan sprite supplies the battle rendering and pose reference.

First Chudan export: [Shinsengumi-Chudan-v1.png](../img/enemies/Shinsengumi-Chudan-v1.png), transparent 288 × 288 PNG, target sole baseline y=268. Preserved as the original review export; the current encounter uses the aligned v2 set below.

Production records: [source](art/shinsengumi/chudan-source-v1.png), [exact prompt](art/shinsengumi/chudan-prompt-v1.txt), [export recipe](art/shinsengumi/export-v1.ps1), and [export metadata](art/shinsengumi/export-v1.json). Export uses nearest-neighbor resampling and preserves alpha.

The overworld sheet was assigned October 21, 2026 to the Shinsengumi courtyard NPC on Map001 at (16,10), event 7. He is stationary, faces down initially, turns to speak, and offers Spar / Not now through a normal action-button interaction. Enemy 7 and troop 7 implement his repeatable practice duel.

### Shinsengumi stance set

Completed October 21, 2026 with built-in image_gen, using the approved Shinsengumi Chudan source for identity and Masanori's corresponding poses for guard references. The original Chudan art is reused and aligned into v2; four new guards preserve his short black hair, blue-and-white haori, indigo kimono and striped hakama. These are static guard poses, with the engine supplying attack effects and reactions.

| Form | File | Display |
|---|---|---|
| Chudan | [Shinsengumi-Chudan-v2.png](../img/enemies/Shinsengumi-Chudan-v2.png) | Initial middle guard. |
| Jodan | [Shinsengumi-Jodan-v2.png](../img/enemies/Shinsengumi-Jodan-v2.png) | High guard. |
| Gedan | [Shinsengumi-Gedan-v2.png](../img/enemies/Shinsengumi-Gedan-v2.png) | Low guard. |
| Kasumi | [Shinsengumi-Kasumi-v2.png](../img/enemies/Shinsengumi-Kasumi-v2.png) | Raised side guard or automatic Parry/Block. |
| Waki | [Shinsengumi-Waki-v2.png](../img/enemies/Shinsengumi-Waki-v2.png) | Rear guard or automatic Dodge. |

All five are transparent 288 × 288 PNGs, with a common foot axis x=144 and target sole baseline y=268 (nearest-neighbor rounding can shift the last visible pixel by one). Export first matches the original Chudan pixel density, then reduces only where weapon clearance requires it. Full weapons and silhouettes fit without clipping. The v1 Chudan export remains untouched.

Production records: [exact prompts](art/shinsengumi/stances/generation-prompts.json), [pose comparison](art/shinsengumi/stances/stance-preview-v2.png), [alignment metadata](art/shinsengumi/stances/export-v2.json), and [export recipe](art/shinsengumi/export-stances-v2.py). New sources are retained under `docs/art/shinsengumi/stances/<pose>-source-v1.png`; the approved Chudan source remains one directory above.

Enemy notes `<DuelSprite: Shinsengumi>` and `<DuelSpriteVersion: 2>` select and preload this set. WWS_DuelTargets has separate per-pose regions for this artwork, shared by localized feedback. Browser playtest confirms the courtyard interaction, correct battle scene and opponent art, and live body-target labels: [duel](battles/shinsengumi-duel-preview.png), [targeting](battles/shinsengumi-target-preview.png). `node tools/check-shinsengumi-sparring.cjs` checks all saved event branches, recovery, stance/reaction lookup, targets, real cuts, practice protection, cleanup, and backdrop scoping.

### Original Shinsengumi overworld walking sheet — superseded by v2 above

Created October 20, 2026 with built-in image_gen using the new Shinsengumi battle art for identity and Masanori's walking sheet for layout and map rendering. [Walking sheet](../img/characters/$Shinsengumi-v1.png): 144 × 288 transparent PNG, twelve 48 × 72 frames, rows Down/Left/Right/Up and columns Walk A/Stand/Walk B. Swords remain sheathed. A single shared scale and aligned sole baseline at y=68 within each cell preserve frame consistency. The `$` prefix selects RPG Maker MZ's single-character format; character index is 0.

Production records: [source](art/shinsengumi/walking-source-v1.png), [generation and refinement prompts](art/shinsengumi/walking-prompt-v1.txt), [export recipe](art/shinsengumi/export-walking-v1.ps1), [metadata](art/shinsengumi/walking-export-v1.json), and [4× nearest-neighbor preview](art/shinsengumi/walking-preview-v1.png). Dimensions, transparency, row order and frame alignment were checked. Assigned to Map001 event 7 on October 21; the rendered map preview confirms placement and clear paths. A browser playtest subsequently verified approaching him and opening the sparring interaction.

## Masanori

Created October 10, 2026. Russet kimono, charcoal hakama, indigo obi, topknot, and a katana; map and battle sprites share the same identity. His walking format matches the protagonist. Front-view battle poses use transparent 288 × 288 images; the engine supplies damage, collapse, and slash effects. The original static sprite remains available.

On October 15, five pose variants were generated using the existing enemy image for identity and the user's supplied kamae chart for pose guidance. These are static guard poses that switch during combat, not full attack-animation sheets. They preserve the brown/charcoal/indigo palette and use nearest-neighbor export with a common foot baseline at y=268.

| Pose | File | When shown |
|---|---|---|
| Chudan — middle guard | [SamuraiInstructor-Chudan-v1.png](../img/enemies/SamuraiInstructor-Chudan-v1.png) | Selected Chudan; initial battle pose. |
| Jodan — high guard | [SamuraiInstructor-Jodan-v1.png](../img/enemies/SamuraiInstructor-Jodan-v1.png) | Selected Jodan. |
| Gedan — low guard | [SamuraiInstructor-Gedan-v1.png](../img/enemies/SamuraiInstructor-Gedan-v1.png) | Selected Gedan. |
| Kasumi — raised side guard | [SamuraiInstructor-Kasumi-v1.png](../img/enemies/SamuraiInstructor-Kasumi-v1.png) | Selected Kasumi or automatic Parry/Block. |
| Waki — rear/side guard | [SamuraiInstructor-Waki-v1.png](../img/enemies/SamuraiInstructor-Waki-v1.png) | Selected Waki or automatic Dodge. |

WWS_Duel uses this set for enemy 6 in front-view custom duels; the Shinsengumi has his own set above. Automatic reaction poses take precedence during the incoming attack; the next committed stance is not exposed early. Untagged enemies and stock battles retain their assigned image. All five images preload at battle setup.

Production records in `docs/art/samurai-npc/stances/`: [reference chart](art/samurai-npc/stances/reference-poses.png), [exact prompts](art/samurai-npc/stances/generation-prompts.json), [native-size pose comparison](art/samurai-npc/stances/stance-preview-v1.png), and [export metadata](art/samurai-npc/stances/export-v1.json). Each pose's original generated source is retained as `<pose>-source-v1.png`. Created with the built-in image generator; [export-samurai-stances.ps1](art/export-samurai-stances.ps1) preserves alpha and performs only nearest-neighbor scaling/alignment.

Animation 121, **Katana Strike — Practice**, copies stock animation 6 and uses `effects/SlashPhysical.efkefc`. Skill 236 supplies that animation to the custom duel. Encounter records and recovery behavior are documented in PROJECT_GUIDE.

Production records in `docs/art/samurai-npc/`:

- [walking-source-v1.png](art/samurai-npc/walking-source-v1.png) and [walking-prompt.txt](art/samurai-npc/walking-prompt.txt).
- [battle-source-v1.png](art/samurai-npc/battle-source-v1.png) and [battle-prompt.txt](art/samurai-npc/battle-prompt.txt).
- [battle-preview.png](art/samurai-npc/battle-preview.png): original encounter screenshot, before the revised action menu.

Dimensions, transparency, directions, and appearance were reviewed; his encounter has also been browser-playtested. Assets remain first-pass generated art.

## Village props

Created October 8, 2026 using the samurai source as the style reference. The upper-left 4 × 4 tile region of the sheet is populated; remaining cells are transparent. Coordinates below are zero-based 48-pixel columns/rows.

| Prop | Column, row | Footprint |
|---|---|---|
| Blank first tile | 0,0 | 1 × 1 |
| Crate | 1,0 | 1 × 1 |
| Barrel | 2,0 | 1 × 1 |
| Stool | 3,0 | 1 × 1 |
| Low table | 0,1 | 2 × 1 |
| Standing lantern | 2,1 | 1 × 2 |
| Cloth-covered crate | 3,1 | 1 × 1 |
| Straight fence | 0,2 | 1 × 1 |
| Fence right end | 1,2 | 1 × 1 |
| Fence left end | 3,2 | 1 × 1 |
| Vertical fence | 0,3 | 1 × 1 |
| West corner fence | 1,3 | 1 × 1 |
| East corner fence | 2,3 | 1 × 1 |
| Alternate stool | 3,3 | 1 × 1 |

Use the sheet in E for the current starter configurations. It can also occupy an ordinary B–E slot in a new tileset; if assigned to B, its blank first tile must use star passage. Block crates, barrels, stools, table cells, fence cells, and the lantern base. The lantern upper cell uses star over appropriate ground. Existing maps have these flags configured.

The exporter isolates each source object before fitting it into its footprint, protecting adjacent cells from spillover. Table and lantern sections are continuous multi-cell images. Fence joins/corners still need repetition review before treating the set as seamless. The art is not a researched historical reconstruction.

Production records in `docs/art/village-props/`: [source-v1.png](art/village-props/source-v1.png), [preview-v1.png](art/village-props/preview-v1.png), [generation-prompt.txt](art/village-props/generation-prompt.txt), and individual prop PNGs. Export recipe: [export-village-props.ps1](art/export-village-props.ps1). Props have since appeared in the starter-map renders and browser playtests.

## Red-wood exterior

Created October 10, 2026 using existing props and the samurai as style/scale references. Weathered red timber, cream plaster and paper lattice windows, a charcoal tiled roof, and a closed double wooden entrance. The red architecture is a requested accent within the muted palette.

Updated October 16, 2026: the active v2 building is 288 × 192 pixels, or 6 × 4 tiles, with an approximately 80 × 72 pixel doorway opening. This replaces the oversized 8 × 6 starter home. Built-in image_gen edited the original design; the export crops visible alpha bounds and uses nearest-neighbor scaling while preserving transparency. The actual protagonist is shown at the threshold in the [v2 scale preview](art/red-wood-exterior/scale-preview-v2.png).

Stamp columns 0–5, rows 1–4 of the D sheet for the compact building (unchanged from v2 to v3). Both bottom center cells are passable thresholds; the upper two rows draw above characters with blocked underlay. Tileset 9 retains the terrain and E-slot props. The building is now centered at the north edge, map (9,0), with entrances at (11,3)/(12,3). The doorway reference crop is not separately stamped on the sheet.

October 18 courtyard additions use built-in image_gen with the compact building as style reference. V3 adds a 144 × 144 (3 × 3 tile) cream/red tiled-roof boundary wall at sheet column 0, row 8, and a 96 × 192 (2 × 4 tile) bamboo cluster at column 4, row 8. Unused cells remain transparent. The existing building pixels are preserved exactly. Sources and exports are in `docs/art/dojo-courtyard/`: [wall](art/dojo-courtyard/wall-v1.png), [bamboo](art/dojo-courtyard/bamboo-v1.png), [exact prompts and generator mode](art/dojo-courtyard/generation-prompts-v1.json), [export metadata](art/dojo-courtyard/export-v1.json), and [export recipe](art/export-dojo-courtyard.py). The courtyard uses a repeated wall assembly with lower continuation behind the house, and bamboo in the corner planting beds. Bamboo upper rows have star passage; the final row is a blocked root base on clear grass in front of the wall. Sources and sheet pixels are unchanged by the layering correction. See the [current map preview](maps/Map001-preview.png).

V2 production records: [generated source](art/red-wood-exterior/source-v2.png), [building](art/red-wood-exterior/building-v2.png), [door reference](art/red-wood-exterior/double-door-v2.png), [exact prompt and mode](art/red-wood-exterior/generation-prompt-v2.txt), [export metadata](art/red-wood-exterior/export-v2.json), and [export recipe](art/export-compact-home.py). The v1 files below are retained as historical sources, and their piece coordinates apply only to the old sheet.

**Archived v1:** the complete building was 384 × 288 pixels, or 8 × 6 tiles. Door/frame occupied 2 × 2 tiles. Its zero-based assemblies were:

| Assembly | Column, row | Footprint |
|---|---|---|
| Complete building | 0,1 | 8 × 6 |
| Wall/window section | 0,8 | 2 × 3 |
| Middle roof section | 2,8 | 2 × 3 |
| Double entrance | 4,8 | 2 × 2 |
| Left wall edge | 6,8 | 1 × 3 |

On the archived v1 sheet, columns 0–7, rows 1–6 stamp its complete building. Samurai Home retains tileset 8.

Roof tiles use star passage, walls block movement, and the two bottom entrance cells are passable thresholds. Transparent D tile (0,0), tile ID 512, is blocked beneath the courtyard roof to prevent walking through the building footprint. Supplemental walls block movement; supplemental roof sections use star; the supplemental doorway's lower cells are passable.

The courtyard has player-touch transfers on both door halves. The door image stays closed and does not animate; when placing another copy, create its transfer/door event separately. No interior is included in this artwork.

The complete assembly is the verified arrangement. Extracted sections share its pixel scale and colors, but this is not an A3/A4 autotile kit; arbitrary roof/wall extensions require join and layering review. Transparency, dimensions, doorway clearance against the actual samurai, tile references, collision, and navigation were checked. Updated map previews were visually inspected.

Production records in `docs/art/red-wood-exterior/`:

- [source-v1.png](art/red-wood-exterior/source-v1.png): original generated art.
- [building-v1.png](art/red-wood-exterior/building-v1.png): normalized complete building.
- [scale-preview-v1.png](art/red-wood-exterior/scale-preview-v1.png): 2× review with the actual protagonist.
- `wall-window-v1.png`, `roof-middle-v1.png`, `double-door-v1.png`, `left-wall-edge-v1.png`: extracted sections.
- [generation-prompt.txt](art/red-wood-exterior/generation-prompt.txt): exact prompt.
- [export-v1.json](art/red-wood-exterior/export-v1.json): source bounds, alpha count, output dimensions, and assembly placement.
- `Tilesets-before-v1.json`: pre-registration recovery snapshot.

Export recipe: [export-red-wood-exterior.ps1](art/export-red-wood-exterior.ps1). Registration and placement tools are documented in PROJECT_GUIDE. The export preserves a continuous image before slicing so tiles within the complete building join correctly.
