# Warrior monk style revision

Created October 21, 2026 with built-in image_gen. The v1 monk designs used finer,
more realistic rendering than the established cast. This revision keeps their
ivory robes, red-brown waist armor, headband/hood, and naginata while simplifying
cloth shading, enlarging expressive faces, and using broader silhouettes.

Masanori and Shinsengumi are the style references. Previous monk art is a
costume/identity reference only. The unmasked battle sprite was redrawn first
and compared with both references before extending the direction to the masked
sprite and two walking sheets. [Pilot comparison](unmasked-comparison.png) keeps
the previous and revised unmasked sprites alongside the unchanged cast.

| Asset | Current file | Size |
| --- | --- | --- |
| Masked battle | [WarriorMonk-Masked-v2.png](../../../../img/enemies/WarriorMonk-Masked-v2.png) | 288 × 384; approximately 236px body |
| Unmasked battle | [WarriorMonk-Unmasked-v2.png](../../../../img/enemies/WarriorMonk-Unmasked-v2.png) | 288 × 384; approximately 236px body |
| Masked walking | [$WarriorMonk-Masked-v2.png](../../../../img/characters/$WarriorMonk-Masked-v2.png) | 192 × 448; 64 × 112 cells |
| Unmasked walking | [$WarriorMonk-Unmasked-v2.png](../../../../img/characters/$WarriorMonk-Unmasked-v2.png) | 192 × 448; 64 × 112 cells |

Battle source files and export measurements are alongside this document. The
unmasked crown landmark is source y=420; the masked hood crown is y=455.
`tools/export-monk-style-battle.ps1` exports uniformly with nearest-neighbor
sampling and aligns artwork bottom at y=368. Taller canvases provide naginata
clearance, with no separate resizing of weapon parts. They are now assigned to
enemies 8/9 in the [shared group practice](../../../battles/monk-group.md).
Both use one static pose; no separate stance artwork is added.

Walking sources, previews, frame measurements and captures are under `walking/`.
`tools/export-warrior-monk-walking.py --directory
docs/art/warrior-monks/style-v2/walking --version v2` produces the sheets. Neutral
bodies are 67px tall in all four directions. A uniform scale per directional row
prevents the generated rear view from becoming taller than the front while
retaining walking variation. Feet remain centered near x=32, soles at y=108,
four transparent pixels below them, and the engine renders at 1×. Native cell
borders and complete weapon silhouettes are checked during export.

The two courtyard events retain positions (8,9) and (10,9), behavior and collision.
Only their image names changed. `WWS_OverworldCharacters` maps old v1 names to v2
for saved actors/events or old placement tools. The system version increments
once to trigger MZ's normal saved-map reload. Previous map, system and plugin
files are in `backup/`; all earlier artwork and sources remain preserved.

Exact built-in prompts: [initial unmasked redraw](unmasked-battle-prompt.txt) and
[masked battle plus walking sheets](generation-prompts.json).

Validation: `node tools/check-monk-style.cjs` compares the map and system against
the backup, checks legacy image aliases and all exported walking frame sizes,
captures all twelve direction/pattern combinations from MZ, and simulates an
older save's map reload. [Results](browser-check.json) report native sprite scale,
unchanged positions, successful reload and no browser errors. These are technical
checks; appearance is assessed from the actual [courtyard capture](courtyard-in-game.png)
and [battle comparison](battle-comparison.png), not inferred from matching heights.
