# Edo street and courtyard connection — v5

**Follow-up review:** [Remaining issues and next-iteration priorities](edo-street-v5-next-iteration.md) records an open merchant rail endpoint, a smaller dojo-corner join, presentation concerns and a confirmed screenshot/state synchronization problem. It qualifies the completion and exact-pose verification claims below; this file retains the original implementation account.

Implemented October 25, 2026 against [the v4 correction report](edo-street-v4-next-iteration.md). This supersedes the v4 completion claims for the street and gate connection. The v4 artwork, review, correction report and active pre-edit files remain available.

Map003 remains **42 × 15 tiles**, at 48px per tile, with six core road rows **5–10**, north/south aprons at rows 4 and 11, and progression toward the left. Building footprint spacing remains approximately three tiles. No street NPCs, encounters, building interiors, or destinations were added. The actual player remains **69px tall**, with **76px door openings**.

## Changes

| Correction-report finding | v5 implementation |
| --- | --- |
| Broken fence rails | Extracted only the uninterrupted rail cores. Rails now run underneath supports, with no internal transparent columns in either rail band. Native post art is cropped to its actual visible bounds. |
| Awkward fence/facade joins | Repositioned the runs against visible foundation edges at a common ground line. Removed supports from beneath the home step. A short depth return connects to the merchant timber above its baskets, preserving the baskets' visible ground contact. |
| Malformed road-end barriers | Generated a north–south timber fence with standing posts and terminal feet, used upright rather than rotating front-view rails. Its west terminal joins the frontage fence; its east terminal connects into the dojo wall. Both south feet meet the stone drainage edge. The map ends remain closed without transfers. |
| Dojo timber stub and roof/cap seam | Replaced the stub with an upright and stone toe. The side return joins the final fence and the northern wall. Wall wings now have a thin tiled cap over a deeper plaster/timber body, with overlapping cap/body pixels; the large tiled backing slab is gone. The enclosure remains at the far-right entrance, against the north/right map boundaries. |
| Uneven frontage baselines | Restored all three native building bases to pixel **y=192**. Replaced only the upper roofing with continuous cropped roof planes meeting the north edge. Facades, door regions, steps and containers are copied at native scale; buildings were not enlarged to achieve the shared line. |
| Terrain detail mismatch | Generated a quieter full-width terrain plate without pale pebble clusters or reflected bands. Registered each terrain region once, matched the quiet earth palette, and gave the frontage a subdued stone-dust treatment. The road, north apron, darker southern shoulder, drain and grass now have separate readings. |
| Hidden courtyard arrival | Extracted the existing canopy/central lintel pixels into a local render overlay. While the player passes beneath it, that architecture fades to 48/255; the actual player remains fully opaque. Posts stay opaque. The old 88/255 ghost duplicate is not used on this courtyard art. The canopy restores to 255/255 outside the passage. |
| Gate side-cell jamb clearance | Courtyard cells (11,12), (13,12), (11,13), and (13,13) now block where the player would overlap the visible jambs. Removed the two corresponding side exit events, IDs 8 and 9. Existing central event 10 remains the courtyard exit. Other courtyard collision and events are unchanged. |

The street's collision layout is retained, with the repaired architecture now composed to that layout: roofs/buildings and low fences end at the northern ground-contact boundary, the full clear dojo forecourt stays accessible, and the end barriers/drain visibly explain the blocked cells. Collision was additionally checked through actual approaches selected from the artwork, rather than comparing the exporter with its own coordinate expression.

The wall body was assembled from existing plaster/timber components with a deeper vertical registration; the gate and shop facade pixels remain at their established scale. The new road-end fence is uniformly fitted as an independent asset. Original source art and the fitted assets are retained for review.

## Gate coordinates and affected IDs

- Courtyard Map001 central event **10**, at **(12,13)**, transfers to street **(38,3)** facing left. Events **8 and 9** are now null slots; they were side transfer events, not NPCs.
- Street Map003 events **1 and 2**, at **(38,2)** and **(39,2)**, still transfer to courtyard **(12,12)** facing north.
- Each arrival remains one tile from its corresponding exit threshold. The transfer commands/destinations did not need another positional change; the canopy and jamb treatment resolved the remaining visual mismatch.
- Only four gate collision marker cells and the local canopy note changed in courtyard map data. Other tile cells, NPCs, event pages and transfers are preserved. Courtyard terrain, wall padding, framing, hall and props remain as before.

## Native previews

These are **actual engine captures at 1280 × 720** with the actual player sprite. No player copies were composited into them, no gate event was disabled, and no transfer evidence was reused from a prior run.

- [West street during continuous keyboard movement](../art/edo-street-v5/street-west-walking-native.png).
- [Middle street during keyboard movement](../art/edo-street-v5/street-middle-walking-native.png).
- [Street gate arrival](../art/edo-street-v5/street-arrival-native.png).
- [Courtyard arrival from the first street gate cell](../art/edo-street-v5/courtyard-arrival-38-native.png) and [second gate cell](../art/edo-street-v5/courtyard-arrival-39-native.png).
- [Courtyard mid-step under the canopy](../art/edo-street-v5/courtyard-gate-half-step-native.png), [jamb contact](../art/edo-street-v5/courtyard-jamb-contact-native.png), and [restored opaque canopy](../art/edo-street-v5/courtyard-canopy-restored-native.png).
- [Dojo return contact](../art/edo-street-v5/dojo-return-contact-native.png), [east end contact](../art/edo-street-v5/street-east-contact-native.png), [west end contact](../art/edo-street-v5/street-west-contact-native.png), and [drain contact](../art/edo-street-v5/drainage-contact-native.png).
- [Tea-shop approach](../art/edo-street-v5/tea-shop-foundation-contact-native.png), [merchant approach](../art/edo-street-v5/merchant-foundation-contact-native.png), and [fence approach](../art/edo-street-v5/home-tea-fence-contact-native.png).

[Full composed street artwork](../art/edo-street-v5/edo-street.png) and [ground comparison](../art/edo-street-v5/ground-comparison-documentation.png) are documentation art, not engine screenshots. Files ending in `-documentation.png` are similarly labeled native art crops without player composites. Enlarging these images is unnecessary for judging the actual player/environment scale.

## Verification performed

Results: [engine checks](../art/edo-street-v5/engine-checks.json), [art checks](../art/edo-street-v5/art-checks.json), and [placement metadata](../art/edo-street-v5/export.json).

- **14 focused actual movement/contact checks:** all four courtyard jamb approaches, clear forecourt, dojo wall/return, both road ends, three building frontages, a gap fence, the walkable apron and the drainage boundary. Expected behavior was selected from the visible obstacle and its location, not generated by the exporter's passage formula.
- **Five fresh gate traversals** covering all three active gate events: central courtyard exit three times and each street return once. The actor arrives at the expected neighboring cell, with no immediate transfer loop.
- **Continuous ArrowLeft keyboard movement**, normal player speed, from street (38,7) to the western barrier at (1,7), including native moving-frame/camera captures. Other focused approaches used real engine movement along passable routes; screenshots were not obtained by teleporting the player into a contact pose.
- **18 native engine captures**, reviewed for joins, roof silhouettes, terrain pattern/density, feet/contact, barriers, threshold placement, real-player opacity, and canopy restoration. Normal game UI, including transient map-name banners on some arrival captures, is retained.
- **331 connected street walking cells**, no runtime exceptions and no failed asset requests. This supports route validity; visual inspection and contact probes supply the separate art/collision evidence.
- Modified JSON parses; modified-map transfer destinations resolve to existing in-bounds maps. Map/event structures and affected IDs were compared with the pre-edit snapshot.
- All **630 street cells** reconstruct exactly from the three new 768 × 768 B/C/D sheets. The old exact 200px dirt repetition is absent.
- Door opening regions remain 76px. Door pixels are unchanged apart from at most two RGB levels introduced by compositing their existing slightly translucent source pixels over the new ground. The 69px standing player measurement is unchanged.
- Both rail bands in all four published frontage-fence assets have **zero transparent internal columns**. This was checked again from the saved assets, separately from the construction assertion.
- Canopy extraction is reversible: putting its native pixels back into the edited D sheet reproduces the **entire original courtyard D sheet's RGBA pixels byte-for-byte**. Thus unrelated courtyard architecture was not redrawn.
- JavaScript syntax check passed for `WWS_CourtyardGateReadability.js`; the focused engine checks exercised its arrival, moving and restored states. Player opacity stays 255 and no legacy ghost sprite is created for the v5 courtyard.
- Map002, Actors, System, MapInfos, other tileset entries/flags, unrelated courtyard events/cells, and previous active sheet files are preserved against the snapshot.

The checks stopped after the related changes passed; no combat, interior, save/load or broad project tests were run.

## Deferred and remaining limits

- **Interior doorway layering** remains unchanged, including the earlier lintel/post overlap issue.
- **Viewport framing**, the compact interior's margins, and the courtyard's side margins remain unchanged.
- **Courtyard exterior lawn padding** and **interior/exterior footprint compression** remain separate style decisions.
- **Legacy save migration/compatibility**, especially old 64-tile-street saves, remains untested. No save/load logic changed.
- Conservative whole-cell collision around unrelated courtyard/interior props remains deferred. Closed shop fronts still use the existing whole-cell approach boundary; this iteration does not make their steps or interiors usable.
- The road remains deliberately broad and sparse at the requested six-row width. More activity was not added to fill it. Small differences in sharpness between older courtyard props and newer shop art remain; terrain density and frontage treatment were reconciled without repainting those unrelated props.
- The canopy fade is a deliberate local cutaway: the gate roof becomes translucent during passage and restores afterward. Native arrival and moving frames are verified, but its subjective fade timing, longer keyboard play and alternate player costumes/poses still benefit from human playtesting.

## Retention and provenance

The pre-edit snapshot is `docs/maps/backups/before-edo-street-v5/`, including data, the original gate plugin and the active courtyard/street sheets. Its [hash manifest](backups/before-edo-street-v5/source-hashes.json) is retained. All v1–v4 sources and output sheets remain in their existing folders.

Active new assets:

- `img/tilesets/EdoStreet_B-v5.png`, `EdoStreet_C-v5.png`, `EdoStreet_D-v5.png`.
- `img/tilesets/EdoCourtyard_D-v5.png`: courtyard canopy pixels extracted; other architecture retained.
- `img/pictures/EdoCourtyardGateCanopy-v5.png`: extracted native foreground overlay.

Built-in **image_gen** produced three sources: [terrain](../art/edo-street-v5/ground-source.png), [north–south fence](../art/edo-street-v5/fence-source.png), and [roof replacements](../art/edo-street-v5/roof-source.png). The [exact prompt set](../art/edo-street-v5/generation-prompts.json) is retained. Only roofing from the generated building strip is used; generated facade pixels were discarded in favor of the established native fronts.

`tools/revise-edo-street-v5.py` performs the scoped composition/packing and canopy extraction. `tools/review-edo-street-v5.cjs` performs the focused engine review. The plugin change is limited to the tagged courtyard's canopy rendering; its old art branch remains available.
