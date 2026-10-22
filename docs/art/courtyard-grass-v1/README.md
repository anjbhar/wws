# Courtyard grass v1

Built-in image_gen generated the grass source using the current map preview as a style reference. The style analysis followed `docs/ART_STYLE.md`: elevated pixel-art environment, restrained warm/olive palette, upper-left lighting and quiet ground beneath detailed architecture and characters.

`grass-source.png` is the original generated image. `grass-repeat-192.png` is the native texture export and `grass-tile-48.png` a basic 48px grass tile. `img/tilesets/EdoCourtyard_A5-grass-v1.png` retains the existing 64 dirt tiles and adds 16 grass tiles plus terrain-edge variants. Nearest-neighbor scaling, atlas packing and short irregular alpha fringes are deterministic export operations; all grass artwork comes from the generated source.

Map001 now has 291 grass ground cells (77.6%) and 84 original dirt cells. The dirt training rectangle spans inclusive map coordinates (7,5)–(18,11), containing both fighters and the arrival position in front of the dojo. Upper layers, events, architecture, props and collision are preserved. Pre-change Map001 and Tilesets are saved in `docs/maps/backups/before-courtyard-grass-v1/`.

Rebuild with `python tools/apply-courtyard-grass.py docs/art/courtyard-grass-v1/grass-source.png`, then `python tools/render-starter-map.py`. Verify with `node tools/check-courtyard-grass.cjs`. Earlier courtyard rebuild scripts restore older ground; rerun the grass exporter after using them.

## Generation prompt

Use case: stylized-concept. Asset type: seamless pixel-art grass ground texture for an RPG Maker MZ Edo-period samurai courtyard, final gameplay tiles 48x48. Generate one square texture swatch only, filled edge to edge with short cropped olive-green grass, perfectly top-down flat ground. Match the reference map's detailed restrained pixel art, muted bamboo olive and sage greens, warm earthy undertones, subtle upper-left light. Dense low short grass rendered as tiny crisp 1-3 pixel clusters at an intended 192x192 texture resolution, restrained 6-10 color palette. Very low contrast quiet walkable ground, evenly distributed sparse tiny blade flecks, no large tufts or focal patches. Seamlessly tileable on all four sides with no grid, frame, borders, vignette, perspective, objects, flowers, rocks, dirt patches, typography, blur or photorealistic blades. This is a plain basic grass material texture, not a scene. Reference image is STYLE ONLY; do not recreate its buildings or composition.

Reference: `docs/maps/Map001-preview.png`, before the grass change.
