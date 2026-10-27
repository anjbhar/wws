# Edo street and courtyard connection — v6

October 26, 2026. This targeted revision uses [the v5 correction report](edo-street-v5-next-iteration.md) as its baseline. The report supersedes the original v5 claims about the merchant attachment, dojo texture join and exact screenshot poses. Historical reports, every previous iteration and the original v5 PNGs remain intact.

Pre-edit files and v5 evidence are preserved in [the v6 snapshot](backups/before-edo-street-v6/source-hashes.json). Existing unrelated workspace changes were retained.

## Repairs

1. **Capture synchronization first.** `review-edo-street-v5.cjs` now uses `lib/edo-capture.cjs`, writes refreshed evidence to a separate folder, and freezes only after a completed render. The helper refreshes rendering objects after gameplay updates: RPG Maker normally updates character sprites before moving the player, which otherwise leaves moving portraits one tick behind. Each capture records the selected source frame, screen transform, anchor, viewport, logical position, real position, direction, pattern and render frame number. Source-frame documentation PNGs and a separate pixel audit check the saved screenshot against those recorded pixels. Six original contact portraits were refreshed and audited before production art changed; the moving-frame assertion then exposed and corrected the engine's additional one-tick render lag.
2. **Merchant return.** Two short rails now extend underneath the actual facade timber. A slim native-style terminal replaces the chunky capped depth-fence crop. Basket pixels, silhouette and ground contact remain intact. The return ends at the existing ground line; no rectangle was placed underneath the basket.
3. **Dojo corner.** A continuous shaded timber upright runs from beneath the cap to a native-size stone shoe. Its timber planes are drawn at the target scale; stone texture is reused without doubling its width. The adjacent roof-return plane retains its own shoe. The old y≈104 splice and stretched coarse toe are removed. Column 31 remains blocked; column 32 remains accessible. The old roof slab and projecting stub stay absent.
4. **Apron material.** The continuous gray tint is replaced with compacted earth using the underlying quiet grain, a shallow irregular loss of compaction at the road edge, and subtle wear fields near each frontage. The dojo court receives broader wear than the shop thresholds. There are no mirrored bands, added pebble clusters or repeated dirt stamps. This is a deliberately restrained earth apron, rather than a new paving strip.
5. **Gate cutaway.** Only the central 112×44 roof patch fades. Both roof wings, the entire header and the jambs stay opaque. The roof opacity follows overlap between the visible-player envelope and the occluding roof, continuously through a short edge ramp, down to 72/255. It restores as that overlap ends, without a delayed proximity latch. There is one actual player and no ghost duplicate. The v5 extracted canopy artwork is reused unchanged.

## Preserved scope

Map003 remains 42×15 with six road rows (5–10), leftward progression, existing facade scale, approximately 76px doors, the unchanged 69px player and the existing two-to-three-tile frontage gaps. Street map data changes only its iteration note; Tilesets selects new B/C/D artwork. Map001, all map collision and all event pages/transfers remain unchanged.

Courtyard event 10 at (12,13) still arrives at street (38,3), facing left. Street events 1 and 2 at (38,2)/(39,2) still arrive at courtyard (12,12), facing north. Arrivals remain adjacent to triggers; opaque jamb cells remain blocked. No NPCs, encounters, interiors or destinations were added.

## Review evidence

Actual gameplay PNGs are native **1280×720** with the actual player. No player was composited into them and no transfer was disabled. Files containing `documentation` are source art, source sprite frames or crops, not gameplay captures.

- [Street arrival and east frontage](../art/edo-street-v6/street-arrival-native.png).
- [Middle street in motion](../art/edo-street-v6/street-middle-walking-native.png) and [west street in motion](../art/edo-street-v6/street-west-walking-native.png).
- [Merchant return approach](../art/edo-street-v6/merchant-return-contact-native.png), [merchant foundation](../art/edo-street-v6/merchant-foundation-contact-native.png), [dojo return](../art/edo-street-v6/dojo-return-contact-native.png) and [dojo wall](../art/edo-street-v6/dojo-wall-contact-native.png).
- [Courtyard arrival](../art/edo-street-v6/courtyard-arrival-38-native.png), [second return trigger arrival](../art/edo-street-v6/courtyard-arrival-39-native.png), [moving beneath the roof](../art/edo-street-v6/courtyard-gate-half-step-native.png) and [restored roof](../art/edo-street-v6/courtyard-canopy-restored-native.png).
- [Fade boundary](../art/edo-street-v6/courtyard-fade-boundary-native.png), [northbound reversal](../art/edo-street-v6/courtyard-reversed-north-native.png), [southbound reversal](../art/edo-street-v6/courtyard-reversed-south-native.png), [west fade edge](../art/edo-street-v6/courtyard-west-fade-edge-native.png) and [east fade edge](../art/edo-street-v6/courtyard-east-fade-edge-native.png).
- Documentation only: [merchant detail](../art/edo-street-v6/merchant-join-3x-documentation.png), [dojo detail](../art/edo-street-v6/dojo-join-3x-documentation.png), [apron crop](../art/edo-street-v6/apron-native-documentation.png), [full composition](../art/edo-street-v6/edo-street.png).

Verification results: [gameplay and frame metadata](../art/edo-street-v6/engine-checks.json), [saved-PNG pixel audit](../art/edo-street-v6/frame-pixel-audit.json), [art/preservation checks](../art/edo-street-v6/art-checks.json). Refreshed pre-art v5 contact evidence is [stored separately](../art/edo-street-v5-synchronized/engine-checks.json).

Visual inspection is separate from structural checks. Native gameplay views are used to judge actual player readability, joins, silhouettes, ground contact and collision against visible barriers. JSON validity, route counts, coordinates and opacity values alone do not establish visual correctness.

The focused engine review passed **15 contact/movement probes**, **five transfers** covering all three active triggers, both mid-step keyboard reversals, fade-edge approaches and restoration, and a continuous leftward keyboard walk. It produced **27 synchronized native frames**, with no runtime exceptions or failed asset requests. All **27 saved-PNG pose/position pixel audits passed**, including known roof alpha blending and excluding solid architecture that occludes the player. The street retains 331 connected walking cells. Modified JSON parses, target maps and event structures resolve, all 630 packed street tiles match the composition, door pixels remain identical, and art differences are confined to the three reviewed street regions. JavaScript syntax checks passed for the plugin, review script and capture helper.

Native visual inspection found the merchant rail/facade junction continuous, basket ground contact intact, the dojo upright free of its old mid-height splice, the forecourt clear, and the road/shoulder/drain hierarchy retained. The arrival and moving canopy frames keep the actual player identifiable while retaining the header and roof wings. The apron intentionally has a subtle material contrast; it does not add conspicuous terrain marks to fill the road.

## Deferred work and limits

Interior doorway layering, viewport framing, courtyard exterior padding, interior/exterior footprint compression, unrelated prop collision and legacy-save migration remain deferred. Closed shop fronts retain conservative whole-cell collision. The six-row road remains broad and quiet by design. This pass does not standardize every older courtyard/street prop texture.

The header intentionally occludes a narrow portion of the player during passage; the head and remaining body provide the readable arrival cue. Longer keyboard play and alternate player artwork remain manual playtesting work. No combat, interior or save/load tests were added to this scoped review.
