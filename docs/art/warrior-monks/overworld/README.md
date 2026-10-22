# Warrior monk overworld sprites

Superseded by the [v2 cast-style redraw](../style-v2/README.md). The sheets and
captures below record the original v1 implementation; current courtyard events
use v2 image names and retain these same positions and canvas dimensions.

Created October 21, 2026 with built-in image_gen. The two approved monk battle
sprites supply costume/identity; current Shinsengumi v2 supplies overworld style.

| Monk | Active walking sheet | Courtyard position |
| --- | --- | --- |
| Masked | [$WarriorMonk-Masked-v1.png](../../../../img/characters/$WarriorMonk-Masked-v1.png) | (8,9) |
| Unmasked | [$WarriorMonk-Unmasked-v1.png](../../../../img/characters/$WarriorMonk-Unmasked-v1.png) | (10,9) |

Both front standing bodies target 67px crown-to-sole, matching Masanori and
between current Shinsengumi (64px) and player (69px). This is the current cast
size, with no further 15% increase. Body measurements per frame are recorded
in [walking-export.json](walking-export.json); a common uniform scale is used
within each character's sheet, allowing modest walking/direction variation.

Each sheet is 192 × 448 RGBA, twelve 64 × 112 frames. Rows are down, left, right,
up; columns are walk A, neutral standing, walk B. The extra 24px above the usual
64 × 88 frame accommodates the full naginata, not a larger body. Soles at y=108
retain the same four pixels below the feet and native 1× rendering as the cast.
Foot axes are centered at x=32. Complete weapons fit inside transparent margins.

Raw generated sources are retained as `masked-source-v1.png` and
`unmasked-source-v1.png`. The cleanup generation preserved the designs and
requested neutral outlines and clearer opposite walking steps; selected sources
are `masked-source-v2.png` and `unmasked-source-v2.png`. Exact original and cleanup
prompts are in [generation-prompts.json](generation-prompts.json) and
[cleanup-prompts.json](cleanup-prompts.json). Export masking excludes low-alpha
residue and saturated red/green matte fringe adjacent to transparent edges;
the interior red-brown armor and raw source images are preserved.

`tools/export-warrior-monk-walking.py` finds complete figures independently by
column, measures the body separately from the polearm, exports with uniform
nearest-neighbor scaling, aligns feet, and checks all twelve cell boundaries.
The enlarged previews alongside this file show the packed game sheets.

`tools/place-warrior-monks.cjs` adds two stationary, solid NPCs beside one another
on the left of the training yard, leaving a tile between their positions and
preserving earlier events and all terrain. No new dialogue, combat interaction,
or wandering behavior is assigned. Original map and system data are retained in
`Map001-before.json` and `System-before.json`. The system version increments once
so MZ reloads the map and adds the NPCs when an older save is loaded.

`tools/check-warrior-monk-walking.cjs` checks preservation, sheet dimensions,
body scale, actual native sprite rendering/anchors, reachable approach paths,
keyboard navigation, twelve direction/frame captures, browser errors, and MZ's
standard map reload for older saves. Successful results are saved in
`browser-check.json`; final placement is shown in `courtyard-in-game.png`.
