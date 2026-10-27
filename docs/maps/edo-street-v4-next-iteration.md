# Street v4 — errors and next-iteration review

Reviewed October 25, 2026. **Review only: no map data, production artwork, collision, events, plugins, or settings changed.** This is a critical follow-up to the v4 implementation account, not another rebuild. Its findings qualify several earlier claims that joins, material consistency, and visibility were fixed.

Keep the established constraints: 42 × 15 tiles, six core road rows, leftward progression, unchanged player and building scale, approximately 76px doors around the 69px player, two-to-three-tile building gaps, environment only. None of the findings below calls for NPCs, encounters, interiors, wider buildings, or transfers to unfinished areas.

## Evidence and limits

Inspected the current Map003 tilesheets and map, reconstructed their 630 cells, and confirmed an exact match to the saved v4 full artwork. Reviewed the existing actual-engine 1280 × 720 captures with the real player, plus current Map001 gate events, collision, and gate-cue code. No new game launch or engine screenshots were needed. Enlarged crops below use nearest-neighbor magnification; native crops are retained beside them.

- Existing native engine views: [west](../art/edo-street-v4/street-west-native.png), [middle](../art/edo-street-v4/street-middle-native.png), [east](../art/edo-street-v4/street-east-native.png), [street threshold](../art/edo-street-v4/street-gate-threshold-native.png), [courtyard arrival](../art/edo-street-v4/courtyard-arrival-native.png).
- New documentation evidence: [current collision overlay](edo-street-v4-next-review/street-collision.png), [native terrain comparison](edo-street-v4-next-review/ground-comparison-native.png), [targeted observations](edo-street-v4-next-review/observations.json), [production source hashes](edo-street-v4-next-review/source-hashes.json).

Red tint means blocked terrain; blue cell outlines mean passable terrain. This overlay describes tile flags, not silhouette collision. The saved engine results establish valid transfers and connectivity, but do not establish that the art matches those rules.

## Defects and visible regressions

### 01 — Fence rails are still broken between posts — high priority

**Where:** All short horizontal fence runs, including the gaps between buildings and the foreground. Example: the run beginning at x=500, y=144.

The new exporter spaces posts independently of repeated 34px rail crops. The rail crop itself contains transparent end margins. Overlapping posts therefore does not close every join: a reconstructed 192px fence has completely transparent internal columns at local x=35–36, 69–70, 103–104, and 171–172 through the rail band. On the x=500 run these become x=535–536, 569–570, 603–604, and 671–672 before building occlusion. Both horizontal rails visibly stop and restart in places without a post.

**Next iteration:** Extract a genuinely uninterrupted rail core and run it beneath the supports, or draw replacement joined sections. Check alpha continuity of the final run, then inspect it at native size. The prior statement that the fences are now continuous is incorrect.

Evidence: [home/tea fence, 3×](edo-street-v4-next-review/fence-home-tea-3x.png), [tea/merchant fence, 3×](edo-street-v4-next-review/fence-tea-merchant-3x.png).

### 02 — Fence ends do not consistently connect to building timber

**Where:** Home's right step/plant area and the tea shop's two frontage corners; also the merchant's basket-side connection.

Extending fences beneath a sprite's rectangular footprint does not reliably attach them to the architecture. In the home/tea crop, a support pokes beneath the home step, while the fence's far support stands below and away from the raised tea-shop frontage. Some endpoints read as a loose post or a rail ending under a prop rather than a purposeful fence-to-wall joint.

**Next iteration:** Place each endpoint against the actual facade timber at the height where it meets it. Use a small return or a dedicated end post where the building baseline differs. Preserve the building dimensions and the gap widths.

### 03 — Road-end fences have the wrong construction and unfinished joins — high priority

**Where:** West and east blocked columns, x=0 and x=41, from the frontage to the drain; the eastern extension begins at pixel y=132.

Rotating the horizontal rails while keeping the posts upright produces two long screen-vertical brown strips with small post shapes attached along one side. At native scale these resemble rails or narrow tracks on the dirt, rather than a convincing fence seen in the street's perspective. There are also regular cuts across the long rails. The west barrier begins below the horizontal frontage fence without a joined corner. The east extension is another cropped phase of the strip, with no specifically designed top connection or splice.

**Next iteration:** Use properly drawn north–south barrier art with corner/end modules. Join its north end to the frontage or wall and its south end to the drainage boundary. Keep the intentional closure and keep the corresponding edge cells blocked.

Evidence: [west stop, 3×](edo-street-v4-next-review/west-stop-3x.png), [east stop, 3×](edo-street-v4-next-review/east-stop-3x.png).

### 04 — Dojo return ends in an unexplained horizontal timber stub — high priority

**Where:** Pixel x≈1494–1540, y≈168–192; the west end of the dojo enclosure, next to the last short fence.

The vertical wall terminates in a pasted horizontal wood band with small masonry-looking ends. The band projects across and beyond the return's face without a readable post, cap, or corner. It is visibly different from the courtyard's complete architectural terminations. The low fence meets this improvised assembly, so the junction still looks patched.

**Next iteration:** Make one coherent corner/terminal-post assembly that joins the north wall, return and low fence. Align its visible footprint with column 31's blocking and keep the forecourt in column 32 clear.

Evidence: [dojo return, 3×](edo-street-v4-next-review/dojo-return-3x.png).

### 05 — A thin earth-colored seam remains between the added roof and wall cap

**Where:** The dojo wall wings, around pixel y=44–46, beneath the added roof plane and above the original wall cap.

The replacement roof backing stops at y=44. Sampled columns of the native wall crop have their first substantial alpha one or two pixels below its own top, leaving an earth-colored line visible between the two pieces in parts of the assembly. The old 44px lawn/dirt padding is gone, but this smaller architectural seam remains.

**Next iteration:** Overlap opaque roof/cap pixels deliberately, or replace the whole join. Inspect the final alpha edges across the full wall, not just its overall bounding box.

Evidence: [dojo roof/gate join, 3×](edo-street-v4-next-review/dojo-roof-join-3x.png).

### 06 — Uniform roof offsets created uneven frontage and collision stand-off

**Where:** All three street buildings and north row 3.

All sprites now start at y=-32, but their heights differ. Their rectangular artwork bottoms are **home y=187, tea shop y=158, merchant y=168**, a 29px spread. The low fences still share the same placement. This contributes to the mismatched joints above and makes the tea shop appear set farther back without an apron or foundation explaining that depth.

Collision still blocks every frontage cell through y=191. There are consequently about 34px below the tea-shop image and 24px below the merchant image in that blocked row, compared with about 5px below the home. A player standing in the first free row has feet at y=234, giving different visible approach distances. This is conservative whole-cell collision, not a disconnected route, but the exposed ground and consistent collision line do not communicate the different frontages well.

**Next iteration:** Compose roof cropping and the ground-contact line together. Keep the sprites and doors at their current scale; use appropriate roof edits, porch/apron treatment, and individually placed fence connections. Do not solve the mismatch by enlarging buildings. Recheck player contact at the tea shop and merchant, rather than treating the collision formula as proof of alignment.

### 07 — Terrain color is closer, but pixel-detail density still differs

**Where:** Street road versus courtyard clearing; compare like-sized native patches.

The street has numerous conspicuous pale pebbles and mottled clusters. The courtyard has a quieter, finer earth texture with less prominent bright mineral detail. Matching a median color and reducing contrast did not match the size and distribution of the marks. Grass treatment also remains busier and more patchy on the street's foreground strip.

**Next iteration:** Match cluster size, spacing and highlight contrast alongside color, using native side-by-side samples before packing tiles. The old exact 200px mirrored dirt period is resolved; that specific defect should not be reported as still present.

Evidence: [native ground comparison](edo-street-v4-next-review/ground-comparison-native.png).

### 08 — Courtyard arrival hides most of the actual player under the canopy — high priority

**Where:** Map001 arrival (12,12), after returning from the street.

The new position fixes the excessive distance from the gate, but places the player directly behind its roof/beam. The saved actual-engine arrival shows the head and upper body mainly as the faint masked duplicate at **88/255 opacity**, with only a small lower part clearly visible. This is a visible arrival-readability defect; the player is technically present and can move, but their location and facing are harder to read than on the street arrival.

**Next iteration:** Design arrival position and canopy occlusion/readability together while retaining an adjacent threshold and avoiding a transfer loop. Prefer an architectural cutaway or clear foreground layering if appropriate. Do not assume a faint cue is sufficient solely because its sprite exists and has the intended opacity.

Evidence: [courtyard arrival detail, native](edo-street-v4-next-review/courtyard-arrival-detail-native.png), [street arrival detail, native](edo-street-v4-next-review/street-arrival-detail-native.png). Movement-frame transitions and the cue's cutoff still require a live movement check.

## Design concerns that remain visible

### 09 — The apron line has not fully established a neighborhood street

The 8px stone lip provides a divider, and the drain is readable, but the apron and road still use very similar earth. Walkable rows 4–11 span 384px: the prescribed six road rows plus two aprons. At 69px player height, the central expanse still dominates the composition. The southern apron has no strong separate material transition before the drain.

Keep the six-row road and do not add people to fill it. Strengthen frontage-specific thresholds, restrained shoulder treatment, and material/edge hierarchy within the existing dimensions. Treat this as a composition issue, not a request to shrink the road.

### 10 — The dojo boundary now reads as a large roofed structure

The new 44px roof-plane backing removes the exposed dirt behind the wall, but adds a broad tiled-roof slab across the far-right enclosure. Its large roof plane behind the lower wall/gate caps gives a different reading from the courtyard's thin capped wall. Decide whether this is an intentional roofed enclosure; if the intended object is simply a perimeter wall, design a boundary-hugging wall instead. This is a presentation concern separate from the confirmed thin seam in item 05.

### 11 — Rendering and ground contact still need one shared standard

The street shops have stronger dark outlines, sharp roof detail and heavy local edge shading beside softer terrain and older courtyard props. Fence feet have little supporting contact treatment, particularly where the posts were moved or extended. This makes the assembly look like cutouts on a ground plate in some places. Review shadow direction, contact strength and pixel density together; do not compensate by changing character or doorway scale.

## Deferred issues carried forward

These are recorded from the previous map review and current implementation record. They were not repaired or newly live-tested here.

1. **Interior entrance layering:** Map002's front frame, posts and lintel need appropriate foreground/star layering. The player can draw over architecture that should occlude them. Retain this as separate interior work.
2. **Viewport framing:** The 1200px courtyard retains about 40px side margins in a 1280px viewport; the 816px interior retains about 232px per side. Their presentation differs from the full-width scrolling street. Do not change the camera as part of a fence repair.
3. **Courtyard boundary padding:** Lawn remains behind/around the outer walls, contrasting with the street's northern edge cropping. This is a style/framing decision, not evidence that the lawn's blocked collision is broken.
4. **Interior/exterior footprint:** The dojo's interior remains much wider than its exterior hall frontage. Decide the intended RPG compression convention without altering the established player/door proportions.
5. **Legacy street saves:** Saves made on the former 64-tile map may retain out-of-range player or event state. Compatibility remains unverified; no migration has been tested.
6. **Other prop collision:** Courtyard rack/bamboo/basin and interior furnishings still use conservative whole-cell bounds. Specific awkward approaches require a focused playtest; coarse grid collision by itself is not a new defect.

## Verification gaps to close next time

- The v4 engine check derives expected passage from the same coordinate expression as the exporter. Zero mismatches confirms implementation consistency, not art/collision agreement. Inspect actual obstacle silhouettes and player contact independently.
- Most street portraits use `locate` and camera centering. They do not demonstrate continuous keyboard scrolling, corner approaches, or visual contact with the road-end fences. Keep the valid transfer-movement results, but add only the focused approaches needed for the revised art.
- The street threshold portrait temporarily disables its automatic event in memory. It is useful for checking scale and clearance, but it is not a normal standing state in the shipping map.
- The final visual-only engine review retains transfer evidence from an earlier unchanged-data run; it does not rerun those movements. That reuse is reasonable for unchanged data, but the evidence should remain labeled.
- Gate side-cell jamb clearance and the courtyard cue's on/off transition need moving-frame review. Do not claim a new clipping bug from an untested pose, or infer visual correctness from valid transfer coordinates.

## What remains correct

The street is still 42 × 15, with the intended six core road rows and leftward route. The native-size building sources, 76px door measurements and 69px player remain unchanged. The earlier exact mirrored 200px dirt period is gone. The dojo forecourt is now broadly walkable. The five gate triggers have valid destinations one tile from their corresponding return trigger, and the saved engine movement check successfully traversed all five. Neither road end transfers to a nonexistent map. No NPCs, encounters or building interiors were added.

## Suggested next-iteration order

1. Fix the fence rail core and create proper end/corner modules, including the road-end barriers.
2. Resolve building ground-contact lines and fence-to-facade connections at native scale.
3. Replace the dojo return/cap junction as one architectural assembly; eliminate the roof/cap seam and decide the roofed-wall treatment.
4. Refine terrain detail density and road/apron/shoulder hierarchy without changing the road width.
5. Make the courtyard arrival clearly readable, then test the changed threshold in both directions and relevant walking frames.
6. Review native 1280 × 720 player contact and only the changed collision/transfer behavior. Keep deferred interior, framing and save work separately scoped.
