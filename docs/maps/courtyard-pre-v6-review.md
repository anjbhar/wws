# Courtyard visual review — October 21, 2026

Reviewed Map001-preview.png, courtyard-in-game.png, courtyard-dojo-layering.png, courtyard-gate-layering.png, and the placement/export scripts. This is a correction brief; no map or artwork was changed during this review.

The map is playable, but the earlier description of it as visually finished was too strong. Passing asset and navigation tests did not establish that the architectural assemblies, terrain or composition were convincing.

## Priority 1 — architecture and first view

1. **Starting camera hides the main landmark.** At the current (12,12) spawn and 1280 × 720 viewport, nearly the entire dojo is above the screen; only the veranda and bits of bamboo are visible. The player first sees a large dirt rectangle and the foreground gate. Choose a spawn/camera framing that establishes the dojo, entrance and fighters. Do not enlarge the building to solve framing.
2. **Corner-to-straight-wall joins remain visibly assembled.** At the four joins near columns 2/3 and 21/22, roof profiles, posts and panel widths change abruptly. There are conspicuous upright seams and doubled-looking trim. Caps and base rails must meet on shared pixel anchors.
3. **Side walls and corner returns use incompatible projections.** The sides read as narrow vertical roof/plaster ladders; the corners are strongly diagonal/flared, and the long north/south sections are frontal. They do not describe one consistent rectangular enclosure. Reuse the established elevated map perspective across the assembly.
4. **The same corner image serves north and south.** Reusing it at both ends creates ambiguous returns rather than four properly oriented corners. Inspect each junction as architecture, including which face lies inside the yard. Make only the missing directional pieces.
5. **Gate/wall integration is untidy.** The wall roof stops beside a separate lower gate roof, with exposed red uprights, crowded posts and short cap fragments around columns 9/10 and 13/14. The gate reads as placed in front of a gap. Establish one clean opening, consistent bases and deliberate wall terminations.
6. **Wall mass overwhelms the small dojo.** The tall continuous enclosure and extensive southern facade carry more visual weight than the original hall. Preserve its 6 × 4 proportions; improve framing and quiet the boundary treatment. Do not stretch the hall or duplicate facade sections.
7. **Too much foreground wall in the playable view.** The southern facade consumes a substantial strip of the first screen and emphasizes the enclosure over the training yard's destination. Resolve together with camera framing, while keeping a clear gate.

## Priority 2 — ground, scale and prop readability

8. **Ground has obvious mirrored repetition.** The 192px swatch repeats about every four tiles, forming visible diamonds, diagonal bands and alternating mottled patches. Identical edge pixels pass the seam test, but the repeated image is still conspicuous. Replace the mirrored construction with genuinely repeatable, less directional generated texture and subtle compatible variation.
9. **Ground is too uniformly noisy.** Fine grain covers nearly every pixel of the large yard. It competes with the small characters and makes the open area feel like a repeated texture field. Reduce contrast and grain density; maintain broad quiet earth.
10. **The yard feels oversized relative to its contents.** The fighters and original hall are small against the enclosure and uninterrupted floor. This is a proportion/framing issue, not a request for more props. Consider tighter usable bounds or composition while retaining one spacious training courtyard.
11. **Stepping stones read as rocks.** Their irregular thick silhouettes, dark edges and moss suggest rounded mounds instead of low worn slabs. Generate flatter tops with very little visible side height, at a comfortable stepping scale.
12. **Entrance path is visually discontinuous.** Alternating columns put stones a full tile apart sideways. The gate roof hides one, leaving a few disconnected rocks rather than a short readable approach. Align and space the small set deliberately; inspect it at the actual camera angle and through the gate.
13. **Bokken rack resembles a fence or barrier.** Four parallel tan bars with similar ends lack a strong sword silhouette. Make wooden blades, grips and the supporting rack distinguishable at native resolution, without adding more equipment.
14. **Dummy is unusually thin.** It reads as a small scarecrow/post with tiny straw bundles. Give its torso and head enough volume to read as a training target beside a 60px character, retaining one simple dummy.
15. **Veranda reads as a detached bench-like platform.** It sits below the door but does not strongly share the sill's structural supports or threshold. Its legs, deck and narrow steps need a convincing connection to the building and ground. Preserve the building pixels/proportions; fit the add-on to them.
16. **Veranda approach and elevation need clearer staging.** In the doorway capture the player overlaps its front edge/steps. A walkable flat tile alone does not communicate climbing. Review the standing position, step depth, doorway interaction and apparent foot contact.
17. **Basin is hard to read as water at native scale.** The dark hollow and dipper compress into a small busy patch. Simplify the rim, water surface and dipper silhouette. Its overall compact size is suitable; avoid making it a large feature.
18. **Props vary in finish.** The lantern is a crisp miniature while the rocks/plants and basin have denser, softer-looking texture. Match pixel-cluster size, outline weight and contrast across exports, using the existing architecture and characters as reference.

## Priority 3 — placement, grounding and consistency

19. **Planting clusters are visibly duplicated.** All three use exactly the same two-rock/grass arrangement, with the bottom pair at the same height. This reads as stamping. Use fewer placements or restrained variants/offsets within compatible custom artwork.
20. **Planting is disconnected from the boundary.** The lower clusters sit in open dirt rather than resolving a wall base or corner. Their clearances feel arbitrary. Move a few small plants/rocks to purposeful wall-foot locations; do not create elaborate planting beds.
21. **Bamboo placement is mechanically symmetrical.** Identical clumps at identical heights make the north corners look mirrored. Keep both existing assets, but consider modest placement variation if it improves the wall joins and preserves navigation.
22. **Rack/dummy and basin/lantern look placed as pairs.** They occupy isolated positions in a large empty floor rather than sitting convincingly against the courtyard edges. Improve their relationship to the wall and to one another without inventing separate elaborate training areas.
23. **Object bases lack consistent contact treatment.** Some have strong dark base outlines while others end abruptly on textured earth. A few read as cutouts. Use restrained local contact shading/edge integration, upper-left light, and no large baked cast shadows.
24. **Mirrored architecture reverses lighting.** The export script mirrors corners and the right side wall. Highlights and shaded faces reverse with them. Directional pieces should retain a consistent upper-left light source rather than simply mirroring the full rendered asset.
25. **Side-wall repetition exposes the tile cadence.** The white panel/red crossbar sequence repeats every 48px, producing a ladder effect. Make a compatible longer repeat or less frequent structural divisions; align its ends with corners.
26. **Wall bases change at joins.** Corner stone feet, continuous red rails and the side-wall ends do not consistently meet on one ground line. Inspect northern and southern corners and both gate abutments at native pixel scale.
27. **Plain earth continues outside the enclosure.** The northern strip, southern strip and gate beyond-space have the same treatment as the training ground. That weakens the sense of enclosure and leaves the entrance without a clear arrival/exit context. Resolve map cropping/edge presentation first; generate no unrelated exterior scenery.
28. **The entrance ends at the map boundary.** The open gate suggests a route onward, but there is no destination or transfer. This is safe technically, yet incomplete as a player-facing exit. Decide on a restrained boundary interaction or a real destination later; never wire a nonexistent map.
29. **Spawn faces south by default.** This reinforces attention toward the gate, away from the dojo and swordsmen. Review initial facing together with the new framing.

## Functional limits and verification gaps

30. **Dojo interior is still absent.** Map002 does not exist. The closed-door message prevents a missing-map failure, but the dojo entrance is not usable as an interior entrance. Keep this explicit; do not invent transfers.
31. **Collision is coarser than several silhouettes.** Corner assemblies block full 3 × 4 rectangles, gate posts block full columns, and small planting clusters block full two-cell footprints. Audit visible empty space around these objects for unexpected invisible barriers. Existing route tests establish connectivity, not intuitive collision at every edge.
32. **Base/top layering tests are incomplete.** Existing screenshots cover the gate and veranda, but not every approach to the rack, dummy, lantern, bamboo and corners. Review above/below/beside overlaps in the engine before accepting the next version.
33. **The static preview does not perfectly reproduce engine sorting.** It draws all overhead tiles after characters rather than reproducing all MZ sort cases. Use it for composition; use actual engine views for overlap approval.
34. **Current tests miss the largest visual failures.** Seam checks only test matching edge pixels; geometry checks only test saved tile IDs. Add review views showing a large repeated ground patch, corner joins, gate abutments, veranda foot contact, and the initial 1280 × 720 camera. Automated checks should support these views, not stand in for visual inspection.

## Next-pass order and constraints

Fix wall projection/joins and gate abutments first; fix ground repetition second; establish a useful initial camera third; then improve path/prop silhouettes, grounding and sparse placement. Review again before adding artwork beyond what those fixes require.

Retain the original dojo's 288 × 192 proportions, existing building/wall/bamboo/player/both swordsmen, both full sparring event records and mechanics, a 48 × 48 grid, custom-generated graphics only, upper-left lighting, one open training yard and sparse decoration. Do not fill the empty area with additional training stations, enlarge the hall, or replace retained artwork unnecessarily.
