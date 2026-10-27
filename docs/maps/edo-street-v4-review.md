# Edo street / courtyard connection — v4, October 25, 2026

**Follow-up review:** [Errors and next-iteration findings](edo-street-v4-next-iteration.md) identifies remaining fence breaks, architectural joins, material mismatch and arrival-readability problems. It qualifies the completion claims below; this file retains the original implementation account.

Active map: Map003, 42 × 15 tiles at 48px, with six road rows (5–10). Horizontal progression remains leftward. Existing building assets retain their native dimensions and 76px door openings; the player remains 69px tall. No NPCs, encounters, interiors, or new destinations were added.

## Fixed

- Replaced the mirrored 100px dirt bands with one generated ground plate. Its earth is registered to the courtyard palette and softened to similar detail contrast. Darker frontage, a narrow masonry apron lip, six-row road, shoulder, stone drain, and grass distinguish the surfaces. Each terrain region is used once, without reflected or repeated strips.
- All three roofs start at y=-32: ridges are completely outside the northern boundary, leaving deliberate roof-plane crops. Building sizes and doorway pixels are unchanged. Different native building heights give slightly different frontage baselines; nothing was enlarged to align them.
- Building footprints retain approximately three-tile gaps. Short fences now overlap their rails beneath posts and extend beneath facade edges, closing transparent asset margins. Foreground fences use the same continuous construction.
- The far-right dojo boundary has a native roof-backed top, joined wall wings, gate, and western return meeting the neighboring fence. No dirt remains behind the wall along the north edge. The return has a corner and a masonry foot; the eastern wing exits through the map boundary.
- All visibly clear dojo forecourt cells at x=32–40, y=3 are walkable. Roofs, buildings, fence line, drain, return, and road-end barriers have matching blocked cells. Whole-cell collision remains the engine convention.
- Timber barriers deliberately close both unfinished road ends, x=0 and x=41. No transfer points lead to future areas.
- Courtyard exits (events 8–10) now activate on the visible threshold at x=11–13, y=13 and arrive on the street at (38,3), facing left. Street triggers remain (38–39,2), at the gate foot, and arrive inside the courtyard at (12,12), facing north. Each arrival is one tile from its return trigger, preventing transfer loops.

## Native review and verification

Reviewed real-engine 1280 × 720 screenshots with the actual `$Samurai-v3` player: west, middle, east, dojo-wall contact, street gate threshold, courtyard arrival, and courtyard gate approach. Inspected roof silhouettes, fence/facade and enclosure joins, terrain repetition, feet/ground contact, and threshold placement. The street threshold portrait temporarily holds its event in memory solely to show the player before transfer; saved event behavior is unchanged.

- [Western street preview](../art/edo-street-v4/street-west-native.png), [eastern arrival](../art/edo-street-v4/street-east-native.png), [gate threshold](../art/edo-street-v4/street-gate-threshold-native.png), [courtyard arrival](../art/edo-street-v4/courtyard-arrival-native.png).
- [Full updated artwork](../art/edo-street-v4/edo-street.png), [placement metadata](../art/edo-street-v4/export.json), [engine results](../art/edo-street-v4/engine-checks.json), [art checks](../art/edo-street-v4/art-checks.json).

Engine checks cover every directional passage flag, reachability of all 331 intended walking cells, and actual movement through all three courtyard exits and both street returns. No runtime errors occurred. Modified JSON parses; all transfers reference existing in-bounds maps. All 630 map cells reconstruct exactly from the three 768 × 768 v4 tilesheets, and the old exact 200px dirt period is absent. Player and doorway measurements remain 69px and 76px. Map002, System, Actors, MapInfos, courtyard tile data and unrelated events, and other tileset entries are preserved against the pre-edit snapshot.

## Deferred / unresolved

- Interior entrance occlusion: Map002 still needs appropriate star/foreground layering for its lintel, posts, and front wall. No interior changes in this iteration.
- Viewport framing: courtyard side margins and the narrow interior's black margins remain. Camera settings and compact map dimensions are unchanged.
- Courtyard exterior lawn padding remains; only its gate event positions/destinations changed.
- Interior/exterior footprint compression remains a separate style decision. The street facades remain sharper than some older courtyard props, despite the reconciled terrain palette.
- The courtyard's existing translucent gate cue is visible on the new arrival, as shown in the actual engine capture. This rendering treatment is retained, including its fade/cutoff; keyboard playtesting can assess whether its subtle transparency feels sufficient during movement.
- Legacy saves made on the former 64-tile street remain untested. No save migration or shared engine behavior was changed. Other maps' conservative prop collision remains deferred.

Manual playtesting remaining: sustained keyboard scrolling, subjective gate transition feel/cue readability during walking frames, and old-save compatibility. Automated gate movement and current-map collision checks passed.

## Retained iteration and artwork provenance

The pre-edit data and active v3 sheets are copied to `docs/maps/backups/before-edo-street-v4/`. All v1–v3 artwork and tilesheets remain. New active sheets are `EdoStreet_B-v4`, `EdoStreet_C-v4`, and `EdoStreet_D-v4`; Map003's existing tile layout is retained.

The new terrain was generated with the built-in image_gen tool using courtyard ground as a style/palette reference. [Exact prompt](../art/edo-street-v4/generation-prompt.txt) and [unaltered generated source](../art/edo-street-v4/terrain-source.png) are retained. `tools/revise-edo-street-v4.py` registers the material and packs native reused building, gate, wall, and fence pixels. `tools/review-edo-street-v4.cjs` performs this focused native engine review. No gameplay plugin was changed.
