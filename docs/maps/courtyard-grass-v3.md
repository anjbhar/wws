# Courtyard grass v3

The grass now uses a light muted meadow green with very low contrast and sparse detail, generated with imagegen. The dirt practice area is 468 by 276 pixels, centered at (600,408) on the dojo/gate axis. Its rounded turf outline mirrors exactly horizontally and vertically; export asserts both symmetries before saving. The extra width gives both fighters room while preserving grass around the yard.

Rebuild with bundled Python: `tools/apply-courtyard-grass-v3.py docs/art/courtyard-grass-v3/grass-source.png`, then `tools/render-starter-map.py`. The previous map and tileset configuration are saved in `backups/before-courtyard-grass-v3/`.

Validation: `node tools/check-courtyard-grass.cjs` verifies every directional passage and preservation of upper layers, events and map settings. `node tools/preview-courtyard-grass-v3.cjs` captures the actual MZ view and checks loaded terrain and browser errors against a local server on port 8166.
