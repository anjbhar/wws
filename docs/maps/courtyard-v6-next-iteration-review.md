# Courtyard v6 review — next iteration

Reviewed October 21, 2026. This is a review of the current saved 25 × 15 map, not the earlier 25 × 19 version. No map, tileset, artwork, event, or combat implementation was changed during this review.

## Evidence and scope

Inspected `Map001-preview.png`, the actual 1280 × 720 engine capture `courtyard-in-game.png`, `courtyard-v6-checks/architecture.png`, veranda foot-contact views, all seven prop/bamboo/gate overlap contact sheets, and the large repeated earth patch. Read current map placement, artwork export, opening-direction plugin, engine verification script, asset checks and saved verification results. These are archived actual engine captures from the implementation pass; this review did not launch a new play session or rerun combat.

The original pre-v6 correction brief is preserved as `courtyard-pre-v6-review.md`. This document supersedes it as the next-pass brief.

## What improved and must remain

The dojo is now visible in the initial view at its original 288 × 192 size. Both fighters and the gate are visible; the player starts facing north. The obvious mirrored earth diamonds are gone, contrast is lower, the stones are flatter, the rack reads as three swords, and the basin is simpler. Four orientations replace mirrored corner reuse. Decoration is sparse and the center is open. Both full sparring event records remain unchanged. Recorded checks show 161 connected reachable cells, working closed-door and southern-boundary messages, loaded custom tilesheets and no JavaScript page errors.

These improvements do not establish that every architectural join, scale relationship or overlap is finished.

## Priority 1 — enclosure geometry and architectural hierarchy

1. **All four corners still read as cut-and-joined assemblies.** The horizontal cap meets the side roof through an abrupt change in roof depth, ridge shape and exposed timber. The southwest/southeast transitions are particularly clear in `architecture.png`. They need one designed junction with shared eave, ridge, post and base anchors, rather than another strip laid across the corner.

2. **Northern and southern junctions do not resolve the same physical wall consistently.** North corners finish against a frontal plaster panel; south corners end in conspicuous tall red uprights and stone feet below the side-roof tip. The return face and inside/outside orientation remain ambiguous. Work out which faces are inside the yard before exporting each corner.

3. **Roof and wall-face widths disagree at the returns.** The broad side roof overhang narrows suddenly into the shallow frontal roof. Near the corner posts, pale panel slivers and changes in trim expose the boundary between original frontal pixels and generated side pixels. Matching the ground line alone has not resolved the geometry.

4. **The side walls still use a much steeper/deeper projection than the front walls.** Their roofs form thick, nearly full-height vertical bands, while long frontal walls have shallow horizontal caps. The left/right inner wall faces are extremely narrow against that roof mass. The result is a heavy picture-frame border rather than one consistently viewed enclosure.

5. **Export resizing visibly changes pixel density and proportions.** The side source is resized independently into 144px end sections and a 384px center; the caps are then split and resized again into 42px/102px bands. This helps explain the changing roof texture density and stretched side timbers. Solve the directional geometry at the intended native proportions and use uniform-scale exports wherever possible.

6. **Southern corner posts remain visually heavier than the other supports.** The large exposed upright/stone foot at either end of the foreground wall contrasts with slim frontal posts. This is no longer the previous doubled-end-post problem in the same form, but the corner assembly still needs a consistent support thickness and footing design.

7. **The gate connection is improved but still reads as an overlaid roof.** The gate cap has a different slope/profile and curled end treatment from the straight wall. Its ends sit over the adjoining cap instead of showing an unambiguous abutment or structural termination. Inspect both sides at native scale, especially the gate's left roof end.

8. **Gate jamb and adjacent wall trim still crowd each other.** Narrow strips of wall remain beside the gate posts, with several red verticals and changes in cream panel width. Simplify each abutment into one legible jamb and one wall end; do not solve it with more posts or short cap fragments.

9. **The enclosure still outweighs the dojo.** Long bright plaster/red panels and heavy dark side roofs dominate the 288 × 192 landmark. The foreground wall occupies roughly the bottom 144px, a fifth of the viewport. Quiet the boundary's visual treatment and refine its projection while preserving the existing hall and sparse yard.

10. **The dojo-to-wall junctions deserve a dedicated close-up.** The hall facade shares the rear wall's base height and is surrounded by repeated frontal panels. It can read as a gatehouse inserted into a long facade rather than a hall with a distinct footprint. Review the outermost sill supports and eave terminations on both sides; retain the exact hall pixels and do not duplicate facade pieces.

## Priority 2 — entrance, threshold, composition and object scale

11. **The entrance path is still visually interrupted by the roof.** The slab at row 12 is largely hidden, leaving an isolated slab above the cap and separate slabs in/below the opening. The aligned arrangement fixes the old zigzag, but the approach still does not read as a continuous short walking sequence in the initial view. Check it from the player camera, including under the roof.

12. **The path sits half a tile to the right of the architectural axis.** The dojo/gate center is map pixel x=576; slabs in column 12 center at x=600. The spawn is also at x=600. This offset is not inherently unplayable, but it is conspicuous in an otherwise strongly axial composition. Choose an intentional alignment rather than inheriting cell placement.

13. **All visible slabs are identical and very regular.** The same pale clipped rectangle repeats at a uniform 48px cadence. It now reads as low paving, which is an improvement, but resembles a stamped sequence. Use very restrained shape/wear variation or adjust the placement within cells without restoring wide offsets or boulder silhouettes.

14. **The exit ends immediately at the screen/map crop.** The lowest slab and gate feet reach the bottom edge, with no arrival apron or visible onward context. An action boundary is sensible for this map, but the open opening still visually promises a route that the player cannot take. Resolve the presentation of a closed scope without inventing a missing destination or adding exterior scenery unnecessarily.

15. **The veranda still reads partly as a separate platform.** Its broader front and deeper resized boards improve readability, yet the long deck does not clearly inherit the dojo's sill supports. Several small feet and a central stair make it look attached afterward. Refine the actual joint under the threshold rather than stretching the hall or adding more architecture.

16. **Step ascent is still represented as one flat walking row.** The foot-contact view shows the player over the front step/deck edge, but there is no elevation change as they move onto it. The image has multiple depth cues while movement has one standing height. Review foot contact across the center and both deck wings, and choose a readable single-level threshold or a deliberate small elevation treatment.

17. **The initial spawn establishes the hall but places both fighters behind the player's facing.** This is an improvement over the earlier hidden landmark. Still, the player appears in the middle of the yard rather than arriving through its gate, and neither opponent is in the direction of attention. Consider the intended first action and composition together. Do not enlarge the dojo or fill the center to solve this.

18. **The bokken rack's sword scale needs another pass.** The exported rack is up to 78px high against characters around 60px; its long blades are more prominent than the small supporting rack. They are readable as swords now, but appear oversized beside the samurai. Reduce the sword-to-person ratio while preserving guards, grips and a believable support.

19. **The dummy remains narrow at actual game scale.** The new source has a much fuller torso, but fitting its arms and whole stand into 44px width shrinks the torso/head. In the engine it still reads as a slender cross/post with a small straw target. Judge head/torso width beside the player after export, not from the large source image; retain one dummy.

20. **Prop finish is not fully consistent.** Swords use thin, high-contrast pale blades, the lantern has crisp dark stone tiers, the dummy has fine straw detail, and the basin/planting use softer dense texture. Match final pixel-cluster size, outline contrast and material simplification. Avoid making every asset equally detailed just to match the noisiest one.

21. **The basin's dipper is readable only weakly at native size.** The water patch is clearer than before, but the cup/handle collapse to a small tan diagonal line across the rim. Preserve the compact basin; prioritize a distinct cup silhouette and a simple water reflection over more texture.

## Priority 3 — placement, ground, grounding and framing polish

22. **Bamboo still looks like the same clump placed twice.** The one-row vertical offset is better than perfect symmetry, but the branch silhouettes remain identical. Retain both existing placements/assets as required; refine their relationship to the wall and nearby props through modest positioning, rather than adding planting or mirroring the lighting.

23. **The remaining planting cluster is separated from the wall foot.** It sits in front of the north wall with a visible dirt gap, making it another isolated cutout rather than a natural wall-base detail. Move it purposefully against an appropriate base, keeping the now-open bamboo approach clear.

24. **Props still have a distributed display-like rhythm.** Rack and dummy line the left edge; lantern, bamboo and basin populate the right. Asymmetry improved, but each object remains isolated at a fairly arbitrary stand-off from the wall. Refine functional clearances and grounding without creating additional stations, paired decorative arrangements or gardens.

25. **Contact treatment varies.** Rack feet and lantern use strong dark bases; the basin and slabs have softer grounding, while some bamboo/plant edges end sharply against quiet earth. A restrained, consistent contact treatment would help assets inhabit the same floor. Avoid large baked shadows.

26. **The top exterior strip remains the same earth as the yard.** There is still up to one tile of tan ground beyond the north wall, interrupted by the taller dojo roof. The southern exterior is removed by cropping. Decide how the north edge should read; do not introduce unrelated scenery just to fill it.

27. **The 40px side margins and edge crop are visible presentation decisions.** The 1200px map is centered inside 1280px, leaving black bars. This is not a map-load failure, but should be approved deliberately. The current framing also places the south wall feet directly on the bottom screen edge. Check whether these bounds support the desired game presentation before changing them.

28. **Ground still has only one 384px periodic swatch.** The old mirrored diamonds are resolved and the large repeat looks substantially quieter. Faint repeated grain/mottle distributions remain possible because no compatible alternate field is selected on the map. This is a low-priority polish item, not a reason to replace the improved ground wholesale. Review a large field at native scale before adding restrained variants.

29. **Exact matching edges are not proof of a natural texture join.** The exporter crossfades 24px opposing strips and forces equality at the boundary. It can smooth the seam differently from the interior; the current test does not measure that. No severe seam was obvious in the inspected patch. Check boundary neighborhoods and periodic contrast before claiming this is fully verified.

## Functional and verification issues — distinguish from visual observations

30. **Southern boundary text implies a future unlock that does not exist.** The message says to remain until courtyard training is finished. The two boundary events have no completion condition, switch or destination, so training will never open the road. Either make the wording truthfully permanent for this scope or implement a real progression rule only when a destination exists.

31. **The interior remains absent.** Closed-door interactions are safe and appropriate; this is an explicit content limit, not a broken transfer to repair by guessing a map ID. Keep it stated in the next iteration's delivery.

32. **Collision is still assigned by rectangular cell footprints.** Side-wall cells are blocked based on hardcoded row/column bands, and every prop's bottom row is blocked across its atlas width. The code does not inspect opaque base pixels. Small dummy/lantern feet and irregular planting may therefore stop the player before visible contact; side roof overhang can also overstate the solid width. Audit edge approaches rather than treating grid collision alone as proof of a match.

33. **Reachability does not verify every screenshot position.** The verifier teleports with `locate()` for all views. Its `dojo-beside` view uses (8,3), a blocked northern wall cell, so that capture is not evidence of a legitimate walking approach. Assert that every playable review position is reachable; label intentionally inaccessible diagnostic positions explicitly.

34. **Actual movement and interactions are only partly exercised.** Navigation checks `canPass()` across a graph; the visual views teleport; interactions directly start nearby events. These are useful checks, but do not show the player walking the slab route, climbing the threshold, or pressing the action key through each interaction and returning to movement. Add a few real input-driven routes instead of counting screenshots as route tests.

35. **Overlap coverage is incomplete.** Most props are shown from one side only, not both. Corners have architecture crops but no valid player approaches; roof views cover side adjacency rather than all relevant front/back cases. Add opposite-side approaches where accessible and test individual canopy/post boundaries and the veranda wings.

36. **Captured overlaps are not automatically asserted.** The script saves images but does not test occlusion, and waits a fixed 100ms after teleports. That can capture a stale frame on a slow run. Wait for rendered character placement or a known frame boundary; retain human visual approval of sorting.

37. **The static preview still cannot approve engine sorting.** It draws all overhead tiles after characters rather than reproducing all MZ ordering. Use it for layout only; use actual engine views for contact/overlap decisions.

38. **Asset tests do not validate architectural anchors or realistic scale.** They confirm original pixels, atlas packing, file presence, transparency, terrain edges and contrast. None establish roof continuity, corner projection, post spacing, sword length or step height. Add measured shared anchors where helpful, but require close-up inspection as well.

39. **New-game framing does not update existing saves.** The opening plugin only changes a new game's transfer direction. A saved player at the old start (12,12) will still begin at the gate under the revised geometry. Old saves also warrant checking for coordinates outside the shortened map. Treat migration as a separate compatibility decision; do not claim all starts use the new framing.

40. **The verification environment and claims need clearer boundaries.** Scripts hardcode the machine-specific Playwright/Python paths and require a server at port 8166. The saved pass record belongs to the previous implementation run. Next delivery should name the actual commands/session, distinguish automated pass results from visual approval, and avoid calling architectural assembly finished solely because checks pass.

## Recommended next-pass order and acceptance

1. Design the corner/side/gate cross-sections and shared roof/base/post anchors together. Correct native proportions and pixel density first; preserve original hall, wall, bamboo and characters.
2. Reassess wall hierarchy and framing, then the gate/slab approach and sill/veranda contact. Inspect the complete 1280 × 720 view before touching decoration.
3. Correct bokken and dummy proportions at native size, then unify prop finish/grounding and purposeful wall-edge placement. Keep one open training space.
4. Audit collision by visible bases; walk all entrances and prop approaches with real input. Capture both accessible sides of tall objects and roof/corner edges.
5. Recheck quiet ground at large repeat scale, then run asset references, both full sparring event regressions, combat/audio checks and saved-game compatibility if supported.

Preserve the exact 288 × 192 dojo, 48 × 48 grid, both complete swordsman events/mechanics, original generated assets, upper-left lighting, custom artwork only, sparse decoration and broad open center. Generate only pieces necessary for the corrections. Do not add missing-map transfers, enlarge the hall, or turn polish into extra gardens/training stations.
