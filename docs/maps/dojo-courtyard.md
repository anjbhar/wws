Current implementation: [courtyard v9 artwork refinement](courtyard-v9-implementation.md), with the entrance now connected to the [neighborhood dojo interior](dojo-interior.md). The notes below describe earlier iterations.

# Finished dojo courtyard — October 21, 2026

Map001: 25 × 19, 48px grid, spawn (12,12). Original 288 × 192 dojo, generated boundary wall, bamboo, player, Masanori and Shinsengumi reused. Both full NPC event records are unchanged. One open earth yard; small southern gate/path; rack and dummy northwest; basin/stone lantern northeast; three sparse planting clusters.

Generated with built-in image_gen: packed earth; three stepping stones; wall corner/end post; one necessary vertical wall strip; open gate; veranda/steps; bokken rack; straw dummy; stone water basin; stone lantern; rocks/low plants. Original generation PNGs, exact prompts, native crops and atlas coordinates are retained in `docs/art/courtyard-finish/` (`sources/`, `generation-prompts.json`, `export.json`).

Only these custom sheets load: `EdoCourtyard_A5-v1` (384 × 768 terrain), `EdoRedWoodExterior_D-v4` (768 × 768 reused architecture with opaque panel backing), `EdoCourtyard_E-v1` (768 × 768 props). No default RPG Maker map graphics are referenced. Props retain alpha; nearest-neighbor exports keep edges crisp. A 192px terrain swatch has identical opposite edges. Original D-v3 remains untouched; the building and bamboo are pixel-identical in D-v4.

Roofs and bamboo tops draw overhead. Tall props have overhead tops and blocked bases. Walls and gate posts block movement; the two-cell gate passage is walkable. The southern map boundary has no transfer.

**Map002 is absent.** Both old entrance transfers to missing map 2 were replaced with action-button closed-door text. Approach from the veranda facing north. No missing-map transfers remain. An interior is outside this courtyard task.

Backup before editing: `docs/maps/backups/before-finished-courtyard/` holds Map001, Tilesets, System and MapInfos. Rebuild artwork: `python tools/export-courtyard-art.py` (Pillow). Rebuild placement: `node tools/finish-dojo-courtyard.cjs`. Starter/remake builders also dispatch to this finished layout. Render: `python tools/render-starter-map.py`.

Verified with real MZ Game_Map/Game_Player directional passage, event collision, reachable NPC/dojo/gate routes, original building dimensions, preserved NPC records, overhead flags and asset/transfer references. Encounter/combat regressions passed: samurai encounter, Shinsengumi sparring (including second phase), opening stance, duel and duel feedback.

Visual QA: `Map001-preview.png`, plus actual Chromium/MZ captures `courtyard-in-game.png`, `courtyard-dojo-layering.png`, `courtyard-gate-layering.png`. `courtyard-browser-check.json` records successful sheet loading and no browser errors. Run `node tools/browser-check-courtyard.cjs` against a local server on port 8166 to repeat. Restart playtest and begin a new game to load all changes.
