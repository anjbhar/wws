# Warrior monk battle sprites

Superseded rendering: [current v2 battle and walking style revision](style-v2/README.md).
The files below are preserved v1 production records.

Created October 21, 2026 with built-in image_gen, using the user's supplied
two-monk image for identity and clothing and Masanori's Chudan sprite for the
game's battle rendering style. These are two separate static opponent sprites.

| Variant | Game-ready asset | Design |
| --- | --- | --- |
| Masked | [WarriorMonk-Masked-v1.png](../../../img/enemies/WarriorMonk-Masked-v1.png) | Ivory hood and face wrap exposing eyes, pale layered robes, red-brown waist armor, dark arm/leg wraps, sandals, complete naginata. |
| Unmasked | [WarriorMonk-Unmasked-v1.png](../../../img/enemies/WarriorMonk-Unmasked-v1.png) | Exposed stern face, shaved head and white headband, matching robes and waist armor, complete naginata. |

Both exports are transparent 288 × 384 PNGs. The additional canvas height fits
the long naginata while targeting about 236px of body height, matching Masanori's
human battle baseline. Artwork bottom is y=368. Each complete source is resized
uniformly with nearest-neighbor sampling and alpha preserved; no weapon parts
are cropped or resized separately. The full weapon butt and blade remain visible.

Original reference: `reference.png`. Unmodified generated sources:
`masked-source-v1.png` and `unmasked-source-v1.png`. Exact built-in prompts:
[generation-prompts.json](generation-prompts.json). Export records are
`masked-export-v1.json` and `unmasked-export-v1.json`.

Reproduce exports with `export-battle.ps1 -Variant masked -BodyCrown 310` and
`export-battle.ps1 -Variant unmasked -BodyCrown 420`. Add `-ReplaceExport` only
when intentionally regenerating an existing export. The crown landmarks were
chosen from visual inspection of these source versions.

The battle files are saved under `img/enemies`; no enemy database record,
encounter, or battle stance set has been assigned. Both now have separate
[overworld sheets placed in the courtyard](overworld/README.md). Future encounter
integration should use these taller canvas dimensions when aligning feet and
adding body-target regions.
