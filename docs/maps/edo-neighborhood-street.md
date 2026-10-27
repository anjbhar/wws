# Edo neighborhood street — first iteration

## Current correction — v6

Map003 now selects `EdoStreet_B/C/D-v6`. [The v6 repair account and synchronized native gameplay previews](edo-street-v6-implementation.md) cover the merchant attachment, continuous dojo corner, compacted-earth apron and central-roof-only courtyard cutaway. Layout, scale, collision and transfers are retained. [The v5 correction report](edo-street-v5-next-iteration.md) qualifies the earlier completion claims below. The pre-v6 snapshot retains active files and v5 evidence; all prior iteration records remain historical.

## Historical correction — v5

Map003 now uses `EdoStreet_B/C/D-v5`, retaining 42 × 15 tiles, six core road rows, native facade/door scale and the leftward route. [v5 implementation, actual native previews, verification and remaining deferred work](edo-street-v5-implementation.md) supersedes v4 for the active street and gate connection. The courtyard now uses a local canopy cutaway and one central exit aligned between its jambs. All previous iterations and a pre-v5 snapshot are retained.

## Current review revision — v4

The active 42 × 15 Map003 now uses `EdoStreet_B/C/D-v4`. See [v4 fixes, native previews, verification and deferred findings](edo-street-v4-review.md). This supersedes the v3 terrain, roof placement, fence joins, enclosure/edge closures, collision, and gate coordinates below. Building and player scale remain unchanged; previous iterations are retained.

## Current compact layout — v3

The active Map003 is now **42 × 15 tiles** (2016 × 720px) and uses `EdoStreet_B/C/D-v3`. This section supersedes the older dimensions, ground layout, gate locations and passage rules below.

All three approved v2 building sprites retain their exact native dimensions and measured 76px doors. They now stand at a shared y=192 baseline: home x=144 (roof cropped 27px at the top), tea shop x=668 (roof 2px from the top), merchant x=1106 (roof cropped 8px). Gaps between buildings are 144px, or three tiles, and contain short low timber fence sections. There is **no rear lawn** and no continuous dojo wall behind the shops. Terrain in narrow gaps is quiet dirt; north cells are blocked to keep the route in front of the buildings.

The six central road rows are **y=5–10**, spanning the entire width with no obstructions. The north apron at y=4 and south apron at y=11 are also walkable. The shallow drainage occupies the foreground boundary, with a narrow two-row grass strip at y=13–14. The dirt material repeats at its native pixel density rather than being stretched to fill the wider street.

The dojo enclosure appears only at the far right, x=1536–2015. Its native gate is at pixel (1776,0), meeting the top edge; its short eastern wall wing meets the right map edge. No wall runs across the rest of the neighborhood. Walk north through **(38,2) or (39,2)** to return to courtyard (12,13), facing north. The two approach columns at y=3 are also passable. The courtyard's existing southern transfer commands now enter this shorter street at **(38,6)**, facing left. The west boundary remains reserved for the next area.

There are still no NPCs, encounters or interiors. No new art was generated for this rearrangement. Existing character-scale sprites, gate, wall, fence modules and terrain material were reused. The dojo interior, system settings, unrelated courtyard content and every other tileset remain unchanged.

- [Current full map](../art/edo-street-v3/edo-street.png)
- [Placement and passage metadata](../art/edo-street-v3/export.json)
- [Current checks](../art/edo-street-v3/checks.json)

The reproducible one-time exporter is `tools/compact-edo-street.py`, using the bundled Python/Pillow runtime and guarded by `docs/maps/backups/before-edo-street-v3/`. That snapshot preserves the complete pre-compaction map and registry. Manual playtesting remains for the transition feel and scrolling through the tighter layout; the game was not launched for these content checks.

## Previous scale correction — v2


The current tileset is `EdoStreet_B/C/D/E-v2`. Version 1 below is retained as the initial production record; its three-column gate passage and apron rules are superseded by this section.

The three buildings were exported separately using measured jamb/header-to-sill heights, with **76px door openings** beside the unchanged **69px visible player**. The corrected shuttered home is 380 × 219px including its broad frontage, step and plant; the tea shop is 294 × 190px including its bench; the merchant is 292 × 200px including its small containers. The courtyard hall itself is 288 × 192px before its separately placed veranda/steps, which make its full visible composition taller. Compare complete silhouettes consistently, rather than including the street steps but excluding the dojo veranda.

The street now uses the courtyard's actual gate and wall pixels at native 1× scale. Its gate crop is 192 × 132px including short wall stubs, placed at (2688,204), with its feet at y=336. Original small village fence modules replace the oversized foreground fences. The terrain was generated as a separate empty plate, registered to the four road rows, then architecture was composited without scaling the complete scene.

The road remains y=7–10, four continuous unobstructed 48px rows. The north wall, buildings, foreground and drainage block movement. Two clear gate cells at **(57,6) and (58,6)** transfer back to courtyard (12,13), facing north. Other north cells are blocked. Courtyard entry still lands at (57,8), facing left. Existing courtyard data, dojo interior, map registry, system configuration and every other tileset are unchanged by this correction. No NPCs, encounters or interiors were added.

- [Current full map](../art/edo-street-v2/edo-street.png)
- [Native player/building comparison](../art/edo-street-v2/character-scale-proof.png) and [identical gate comparison](../art/edo-street-v2/gate-scale-proof.png); player copies appear only in these documentation proofs, never in map tiles or NPC events.
- [Exact built-in imagegen prompts](../art/edo-street-v2/generation-prompts.json), [home proportion correction](../art/edo-street-v2/home-correction-prompt.txt), and [source doorway measurements](../art/edo-street-v2/scale-inputs.json).
- [Current export metadata](../art/edo-street-v2/export.json) and [checks](../art/edo-street-v2/checks.json).

`tools/update-edo-street-scale.py` performs the v2 export using the bundled Python/Pillow runtime. Original generated cutouts, final native-size assets and the terrain plate are in `docs/art/edo-street-v2/`; the pre-correction state is retained under `docs/maps/backups/before-edo-street-v2/`. As a preservation guard, the importer expects that backed-up database state before export. Manual playtesting remains for gate transition feel and moving character contact; the game was not launched for this correction.

## Initial v1 production record

Map003, **Edo Neighborhood Street**, is a 64 × 15 native RPG Maker MZ map using 48px tiles. At 1280 × 720 the camera scrolls horizontally and has no vertical travel. It uses its own tileset; existing tilesets and their passage flags are preserved.

Leave the courtyard through any of its three southern passage cells, (11–13,14). Player-touch transfers enter the street at (57,8), facing left. Walk north into the street's dojo gate at (56–58,5) to return to courtyard (12,13), facing north. Destinations are separate from their exit triggers, preventing an immediate return loop. The west edge is reserved for the next area and currently stops at the map boundary; there is no transfer to an unfinished map. The new-game start is unchanged.

The north side has a shuttered timber home and potted plant, a red-curtained tea shop with a bench, an indigo-curtained merchant with baskets/crates, and a cream-and-timber dojo wall with an open tiled gate. Low foreground fencing and a shallow stone drainage edge frame the route. Buildings face south under upper-left light; restrained earth, olive, cream, charcoal and brown colors follow the courtyard. There are no NPCs, random encounters, building interiors, shops, or new gameplay systems in this iteration.

## Passage layout

Coordinates are zero-based. The generated composition places the four continuous road rows at **y=7–10**, spanning the full width. This registration follows the final artwork rather than the coordinates suggested in the generation prompts. All four rows are passable in every direction. The apron at y=6 is passable except under the home's steps/pot and tea-shop/merchant props: x=4–12, 18–28, and 38–45 are blocked. North terrain/building rows y=0–5 and the foreground/drainage at y=11–14 are blocked, with a three-cell-wide gate corridor at x=56–58, y=4–5. Each return trigger sits in that corridor at y=5.

## Artwork and export

- [Full map artwork](../art/edo-street-v1/edo-street.png)
- [Exact built-in imagegen prompts and references](../art/edo-street-v1/generation-prompts.json)
- [Export dimensions, passage cells and connections](../art/edo-street-v1/export.json)
- [Validation results](../art/edo-street-v1/checks.json)

Original left/right generated panels are retained in `docs/art/edo-street-v1/`. The exporter normalizes each to 1536 × 720 with nearest-neighbor resampling and blends only the empty 192px-wide joining strip. Artwork is packed into four 768 × 768 B–E pages, `EdoStreet_B/C/D/E-v1.png`, as 960 unique cells. This is baked environment art, consistent with the existing courtyard/interior workflow, rather than a reusable modular building kit. Buildings and foreground decorations stay outside the walking route; there are no overhead roof tiles on the road.

`tools/build-edo-street.py LEFT.png RIGHT.png` is the one-time import tool and refuses to replace an existing Map003. Use the bundled Python/Pillow runtime. The pre-change courtyard, interior, tilesets, map registry and system data are retained under `docs/maps/backups/before-edo-street-v1/`.

## Verification

Validate changed JSON, native tile references and sheet dimensions, reconstruction against the composed artwork, actual MZ passage checks and reachability, camera clamping at 1280 × 720, transfer commands and destinations, and preservation of existing data apart from the three intended courtyard exits. No game launch or screenshots are needed for these checks. Manual playtesting remains for visual player contact with the apron, gate transition feel, and scrolling through the composition.
