# Dojo Courtyard — terrain, architecture, and prop refinement

October 23, 2026. Read and implemented against [the visual correction brief](starter-map-audit/visual-next-iteration.md). Latest corrected native engine view: [initial.png](courtyard-v8-joins/initial.png), 1280 × 720 with the current characters visible. Latest enlarged [dojo join views](courtyard-v8-joins/joins-contacts.png). Earlier full-pass crops: [architecture](courtyard-v8-checks/architecture-contacts.png) and [props](courtyard-v8-checks/props-contacts.png).

## Follow-up: close the missed dojo joins

The initial v8 review missed visible transparent strips beside the facade and under its sill. They were actual artwork gaps, despite the passing collision checks. A corrected continuous rear-wall bay now backs the narrower facade. Existing opaque architecture pixels and the original dojo are preserved. The existing veranda is registered three pixels higher at y=189, integrated into the architecture atlas across the tile-row seam, and the original dojo is composited over it. There are no stretched facade parts or stacked roof repairs.

Fresh evidence is in `courtyard-v8-joins/`: six reachable engine views, an initial native view, enlarged join contacts, `engine-review.json` and `join-pixel-checks.json`. Both wall seams and the sill have zero exposed grass pixels in checked engine regions. Export assertions independently require opaque wall/sill joins and preserve the original dojo's opaque pixels. All 1,500 directional passage checks remain identical; 193 cells remain reachable. All map metadata/events and System remain unchanged; no engine errors or failed requests occurred. Capture this focused pass with `WWS_JOINS_ONLY=1` and `tools/verify-courtyard-v8.cjs`; make its crops with `tools/review-courtyard-joins.py`.

The backing source is `docs/art/courtyard-v8/architecture-joins-source.png`, generated with built-in image_gen. Its exact prompt is in [join-fix-prompt.txt](../art/courtyard-v8/join-fix-prompt.txt). The earlier screenshots are retained as historical evidence and show the defects corrected here. Restart the running playtest to reload map data and tilesheets.

## Changes

- Replaced the mirrored rounded training patch with uneven worn soil, turf intrusions, grouped transition details and small extensions. Quiet broad grass variation replaces the evenly scattered bright flecks. Faint wear connects the steps, training ground, gate and west equipment; eastern fixtures have localized worn ground.
- Muted perimeter timber, plaster and tile highlights. Narrower side roof strips now meet shallow frontal caps through joined corners. The gate has its own shallow raised roof, crossbeam, two continuous jambs, stone feet and clean adjoining wall ends. The enclosure is exported as one complete construction, without stacked roof repairs.
- Restored the exact original 288 × 192 dojo at its existing (456,0) position after enclosure generation. Rear wall terminations distinguish the hall footprint. Replaced the veranda with a simpler sill/fascia, four short supports on stone pads and a centered stair. Export alignment was corrected after the first engine view exposed a sill gap.
- Replaced the sword rack with a legible wooden stand holding three swords with distinct grips and guards; simplified the dummy into head, shoulders, bound torso and support. Clarified basin rim, water, ladle and base. Matched the lantern finish and introduced a shorter related eastern bamboo silhouette; the original western bamboo is retained. Three separately cropped slab variants have modest chips and wear. Prop crops were corrected after engine inspection exposed neighboring pixels.
- Kept the open courtyard, central hall/gate axis, map dimensions, character sheets and character scale. No props or gameplay content were added. Compact dark bases and upper-left highlights provide restrained ground contact.

## Preservation and verification

`backups/before-courtyard-v8/` contains the exact pre-edit Map001, Tilesets and System. All map metadata, every complete event record and System are compared against that snapshot. Geometry, NPCs, combat branches, interactions and spawn are unchanged. The map note intentionally retains geometry revision v7 so existing veranda/save compatibility behavior remains active. Combat scripts, character sheets and other gameplay data were not edited by this pass; unrelated working-tree changes were retained.

`tools/verify-courtyard-v8.cjs` starts a local server and a fresh MZ new game at 1280 × 720. It compares all 1,500 directional passage results with the pre-edit map, finds 193 reachable cells, and walks engine `moveStraight` routes to reachable review positions. Travel is accelerated to speed 6 only during capture routes; normal movement speed is restored before each screenshot. These are real engine movements, not keyboard-input claims or teleported review views. The door action probes retain the existing response at (12,4). No browser errors or failed asset requests occurred. Full evidence is in [engine-review.json](courtyard-v8-checks/engine-review.json).

All fresh engine views and enlarged contact sheets were visually inspected. The full composition was judged at native scale. The original opaque dojo pixels are asserted equal during export. Initial screenshot capture waits for rendering; `WWS_INITIAL_ONLY=1` refreshes that view without replacing the route evidence.

## Remaining visual limits

- The original dojo roof still meets the top edge. This pass preserves its placement and dimensions; headroom remains tight.
- The supported shallow gate roof still occludes much of a character directly beneath its center. The jambs and side approaches remain readable and reachable.
- Existing 48px collision cells overestimate thin feet and narrow wall/post bases. Passage is preserved exactly rather than silently changing gameplay geometry.
- Some fine material texture survives on grass and bamboo; the ground is substantially quieter but not texture-free. Contact shadows remain compact rather than a new long cast-shadow system.

## Assets and rebuild

New sheets: `img/tilesets/EdoCourtyard_B-v8.png`, `C-v8.png`, `D-v8.png`, `E-v8.png` (each filename uses the `EdoCourtyard_` prefix). The map uses two pages of unique ground cells, one architecture page and the prop page. Earlier sheets remain untouched.

Built-in image_gen sources, rejected first-pass terrain/enclosure, exported assemblies, and exact prompts are retained under [docs/art/courtyard-v8](../art/courtyard-v8/generation-prompts.json), with subsequent prompts in [refinement-prompts.md](../art/courtyard-v8/refinement-prompts.md). Rebuild with bundled Python/Pillow/numpy: `tools/export-courtyard-v8.py`; verify with Node: `tools/verify-courtyard-v8.cjs`; create contact sheets with Python: `tools/review-courtyard-v8.py`. Generated assets are uniformly reduced and packed without stretching individual parts. The terrain canvas is registered 48px south to align the worn footprint with the existing training row.
