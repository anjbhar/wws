# Larger regenerated overworld characters

Three new walking sheets were generated with the built-in image_gen tool using
the previous sheets as character-design references. Full prompts are preserved
in `generation-prompts.json`; unmodified generated sources are stored alongside
this file. Original game sheets remain available under their previous names.

| Character | Active sheet | Front standing visible height |
| --- | --- | --- |
| Hayato | `img/characters/$Samurai-v3.png` | 69px, previously 60px |
| Masanori | `img/characters/$SamuraiInstructor-v3.png` | 67px, previously 58px |
| Shinsengumi | `img/characters/$Shinsengumi-v2.png` | 64px, previously 56px |

Each sheet is 192x352 RGBA, divided into twelve 64x88 cells. Rows are down,
left, right, up; columns are walking, standing, walking. Each frame is uniformly
resized from generated art to 115% of its corresponding original frame's visible
height, rounded to an integer pixel. Four transparent pixels remain beneath the
soles, matching the original sheets. No runtime sprite scaling is applied.

`tools/export-larger-overworld.py` extracts separated figure bands, aligns feet,
and checks transparent cell borders. `export.json` records all frame dimensions.
`tools/install-larger-overworld.cjs` assigns the new images and enables
`WWS_OverworldCharacters`, which maps legacy image names for existing saves and
older placement tools. Collision, map geometry, event commands, and battle art
are unchanged. Database and plugin configuration originals are in `backup/`.

`tools/check-larger-overworld.cjs` compares map and actor data with those backups,
tests legacy bitmap aliases, walks a keyboard-controlled loop in the real MZ
engine, records all twelve directional/frame views, checks native sprite sizes
and foot anchors, and captures doorway proportions. Runtime results are saved
to `browser-check.json` on success. Separate duel and samurai event checks cover
combat and dialogue behavior.

Review `courtyard-in-game.png`, `doorway-in-game.png`, and the three enlarged
sheet previews for appearance. Generated art preserves costume cues but is new
artwork, so individual facial and clothing details differ from the originals.
