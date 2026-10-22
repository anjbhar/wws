# Edo dojo courtyard — implemented October 21, 2026

The saved starter map is now 25 × 15 cells on the original 48px grid. The complete 1200 × 720 map fits the 1280 × 720 engine viewport, with narrow black side margins. The original dojo remains exactly 288 × 192. Start position is (12,7), facing north. New games establish the hall, both swordsmen and southern gate together; existing saves retain their saved player position.

## Preservation and backup

`backups/before-courtyard-v6/` contains Map001, Tilesets, System and MapInfos JSON, the three previous custom tilesheets and fresh pre-edit engine captures. No Map002 exists. The original D-v4 tilesheet, including dojo, straight wall and bamboo, is byte-for-byte unchanged. Player and both swordsmen artwork and all combat plugins are retained. Both complete swordsman event records compare exactly to the backup, including positions, pages, choices, battle commands and recovery branches.

## Corrections

- Two independently generated directional side assemblies supply all four corner orientations. Their straight returns reuse original wall pixels, align the roof and base anchors, and remove surplus end posts. No shaded artwork is mirrored. Long side spans replace the one-cell ladder repeat.
- Gate posts and wall terminations are one exported assembly. Separate doubled end posts and short roof fragments are removed.
- A low-contrast 384px generated earth period replaces mirrored quadrants. Opposing edges are crossfaded without reflection; native grains are subdued to 42% contrast. The large repeated patch is archived for visual inspection.
- The retained generated veranda is exported deeper beneath the original sill; feet on its front step were checked in MZ. Four small flat slabs form one aligned entrance approach.
- A new three-bokken rack, broader straw dummy and simple water/dipper basin replace the ambiguous props. The retained lantern and one retained planting cluster sit at the edges. Bamboo positions differ and remain reachable from above, below and beside their bases.
- Collision follows base cells. Upper portions of bamboo and tall props are overhead; empty space in the side-wall assemblies is walkable. The reachable upper-bamboo pocket was opened after the engine navigation audit.
- Both dojo doors give a closed-door message. Both southern passage cells give an action-button boundary message. No transfer refers to an absent map.

## Assets and provenance

Six built-in imagegen source PNGs and their exact prompts are archived in `../art/courtyard-v6/sources/` and `../art/courtyard-v6/generation-prompts.json`: side returns, earth, rack, dummy, basin, slab. The side source contains separately lit west and east assemblies. Exports are organized in A5 terrain, B west, C east, retained D architecture and E gate/props sheets, with `export.json` documenting atlas coordinates. Existing generation sources remain in their original folders.

Export/placement: `tools/export-courtyard-v6.py`, then `tools/refine-courtyard-v6.cjs`. The latter requires the backup before writing. Use the bundled Python runtime with Pillow/numpy. `WWS_CourtyardOpening` sets only the new-game transfer direction.

## Verification

- Full-map preview: `Map001-preview.png`; actual initial engine view: `courtyard-in-game.png`.
- `tools/verify-courtyard-v6.cjs`: actual MZ engine at 1280 × 720; 161 connected reachable cells; routes to both doors, both fighters, gate, and above/below/beside prop/bamboo bases; solid base and enclosure checks; all custom tileset references; original dojo tile rectangle; complete event equality; no invalid transfers; both boundary/door interactions; no page errors; all tilesheets loaded.
- Actual MZ screenshots cover 27 positions plus both interaction messages. `courtyard-v6-checks/results.json` records results. Contact sheets show all four wall joins, gate abutments, veranda foot contact, and above/below/beside rack, dummy, lantern, bamboo and basin, plus gate overhead and roof-side approaches.
- `tools/review-courtyard-v6.py`: unchanged original architecture pixels, transparent native atlas exports, all six source files, periodic edges without mirrored halves, restrained terrain contrast; exports contact sheets and a large repeated earth patch.
- Existing regressions: `check-samurai-encounter.cjs`, `check-shinsengumi-sparring.cjs`, `check-duel.cjs`, `check-duel-feedback.cjs`, `check-shinsengumi-music.cjs` all pass. These exercise dialogue/outcomes/recovery, both combat implementations, automatic defenses, body targets, injuries, phase changes, 1 HP practice protection, cleanup and audio restoration.

The browser verifier requires this workspace served at `http://127.0.0.1:8166/`. Main courtyard check entry points dispatch to it for v6.

## Remaining limits

There is no dojo interior or onward road map. Both boundaries deliberately explain this through interactions. Collision remains RPG Maker's 48px cell model: slim posts and small prop bases occupy a cell rather than using pixel collision. The still preview simplifies overhead sorting; overlap approval uses the archived actual engine views. Original facade and new directional sides retain minor differences in pixel density; the return joins share the original roof, rails and ground line.
