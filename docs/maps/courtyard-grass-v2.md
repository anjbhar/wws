# Courtyard grass v2

Generated fresh green grass replaces the olive grass. The training patch now fits within cells (9,6) through (16,10): 40 cells instead of 84, with rounded corners and 22 cells of continuous irregular turf edging. The generated source, exported repeat and terrain sheet use nearest-neighbor scaling at two-pixel detail size. Existing dirt artwork is retained.

Rebuild: bundled Python `tools/apply-courtyard-grass-v2.py docs/art/courtyard-grass-v2/grass-source.png`, then `tools/render-starter-map.py`. Original data is retained in `docs/maps/backups/before-courtyard-grass-v2/`.

Validation: `node tools/check-courtyard-grass.cjs` checks all 1,500 directional passages, map settings, upper layers and events against the backup. `node tools/preview-courtyard-grass-v2.cjs` checks the loaded MZ terrain and browser errors against a local server on port 8166. See `courtyard-grass-v2-in-game.png` and `Map001-preview.png` for the updated layout.
