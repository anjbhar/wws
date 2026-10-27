# Straw hat ronin — draft v2

Integrated as **Legendary Ronin** on Map001 at (18,8), with a repeatable nonlethal boss spar. Current map and battle assignment supersede the standalone status in the historical generation notes below. See [encounter details and verification](../../battles/legendary-ronin.md).

## Overworld walking sheet

Generated October 23, 2026 with built-in image_gen using the v2 battle source for identity and the current Shinsengumi overworld source for style, camera and proportions. Both swords are sheathed together at the anatomical left hip; hands are empty. A second image_gen pass corrected the stray opposite-hip scabbard in the rear-right frame. Paired hilts overlap in some views; scabbards remain paired and differ in length.

Game sheet: `../../../img/characters/$StrawHatRonin-v1.png`, 192 × 352 RGBA, twelve 64 × 88 cells. Rows: down, left, right, up. Columns: walking A, neutral, walking B. Neutral hat-to-sole height is 67px, matched to Masanori; baseline is cell y=84. Uniform nearest-neighbor scale per direction preserves walking variation. All twelve frames pass alpha, cell clearance and sole alignment checks.

Source: `walking-source-v2.png`. Prompts: `walking-prompt-v1.txt` and `walking-edit-prompt-v2.txt`. Measurements: `walking-export-v1.json`. Re-export with `export-walking.py`. Review `walking-preview-v1.png`, `walking-cast-comparison.png`, and `walking-cycle-preview.gif`. Original generation is retained as `walking-source-v1.png`. No map event or actor assignment has been made; the walking cycle has not been tested in-engine.

## Battle sprite

Current draft: `../../../img/enemies/StrawHatRonin-v2.png`. Edited with built-in image_gen to reveal the nose, mouth and jaw while keeping the eyes hidden beneath the straw brim, and to lengthen the left-hand short sword. Native source: `battle-source-v2.png`; exact prompt: `edit-prompt-v2.txt`; comparison: `battle-comparison-v2.png`; measurements: `battle-export-v2.json`. Run `export-battle-v2.py` to reproduce the uniform export at v1's scale and placement. Version one is retained below as the historical generation record.

Generated October 23, 2026 using built-in image_gen. Pending visual approval.

Adult male ronin with a broad circular straw kasa concealing his face, a long katana in his anatomical right hand (viewer left), and a shorter wakizashi in his left hand (viewer right). Plain brown kimono, charcoal hakama, muted dark obi, and sandals.

Masanori and Shinsengumi's current battle exports supplied the rendering references. No external identity reference was supplied.

- Native generated source: `battle-source-v1.png`.
- Exact generation prompt: `generation-prompt-v1.txt`.
- Game-sized draft: `../../../img/enemies/StrawHatRonin-v1.png`.
- Shared-baseline native-size comparison: `battle-comparison-v1.png`.
- Measurements: `battle-export-v1.json`.
- Re-export: run `export-battle-v1.ps1`.

Export uses uniform nearest-neighbor resizing onto a transparent 288 × 288 canvas, targeting 236px visible hat-to-sole height with sole baseline y=268 and complete weapon clearance. No actor, enemy database entry, encounter, walking sheet, or additional stance is assigned.
