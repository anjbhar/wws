# Dojo Courtyard — restrained terrain, contact and gate readability

October 23, 2026. Read the complete [v8 implementation and follow-up join correction](courtyard-v8-implementation.md) before this pass. Preservation snapshot: `backups/before-courtyard-v9/`.

## Changes

- Replaced thin connecting tan lines with disconnected patches of faint wear near the steps, gate and equipment. Varied patch widths, muted boundary tufts and retained grouped turf intrusions, an uneven dirt silhouette and a quiet open training surface.
- Packed compact, asset-specific contact sprites beneath the rack, dummy, basin, lantern and both bamboo groups. The rack has separate contacts directly under its two feet. Contacts use restrained dark olive/brown with upper-left lighting. Compared each prop beside the player at native scale; no prop enlargement, stretching or redesign was justified.
- Gate review exposed near-total player occlusion at the threshold. Added `WWS_CourtyardGateReadability`, a rendering-only masked copy of the player's current pose at 88/255 opacity where the gate canopy/beam covers it. It is confined to the three passage columns, within map-space bounds `(528,548,144,50)`, narrowed beside the jambs, and hidden outside the gate approach. The roof, crossbeam, supports, jambs and wall terminations retain their original opaque artwork. The player's ordinary sprite remains unchanged.

## Evidence and verification

Inspected the final fresh composition at native 1280 × 720 with characters visible, then reviewed enlarged prop, gate and join contacts. The final full engine run passed after the rack foot-contact adjustment.

- [Native 1280 × 720 engine view with characters](courtyard-v9-checks/initial.png).
- [Gate movement and layering contacts](courtyard-v9-checks/gate-contacts.png): columns 11, 12 and 13, northbound and southbound, moving and standing frames. Routes use real engine `moveStraight` movement at normal speed through reachable rows 11–13; exterior row 14 remains blocked as before.
- [Prop contacts beside the player](courtyard-v9-checks/props-contacts.png), [repaired architecture contacts](courtyard-v9-checks/joins-contacts.png), [join pixel checks](courtyard-v9-checks/join-pixel-checks.json), and [engine results](courtyard-v9-checks/engine-review.json).
- [Byte preservation checks](../art/courtyard-v9/preservation-checks.json) confirm Map001 is unchanged from the snapshot. All map metadata, NPCs, events, combat and interactions remain intact. All 1,500 directional passage checks match; 193 cells remain reachable. Door action behavior remains unchanged.
- D/E atlases are byte-identical to corrected v8, preserving all original dojo pixels, dimensions, placement, veranda registration and architectural joins. Fresh engine checks require zero exposed grass at both wall-to-dojo seams and across the sill-to-veranda seam. System and every tileset flag remain unchanged. No browser errors or failed asset requests.

## Remaining visual limits

The gate cue is deliberately faint: the solid roof still communicates overhead occlusion. Original dojo roof headroom remains tight and unchanged. Fine grass texture remains, and ground contacts remain compact rather than long cast shadows. Existing collision cells still exceed some thin prop feet.

## Rebuild

Run `tools/export-courtyard-v9.py`, `tools/verify-courtyard-v9.cjs`, then `tools/review-courtyard-v9.py`. The map selects `EdoCourtyard_B/C/D/E-v9` through Tilesets.json; Map001 itself needs no modification. Image sources, uniformly fitted contact sprites, export assertions and exact built-in image_gen [prompts](../art/courtyard-v9/generation-prompts.json) are retained in `docs/art/courtyard-v9/`. Earlier artwork and unrelated working-tree changes are preserved.
