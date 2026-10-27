# Map review — October 25, 2026

Reviewed the current Map001 courtyard, Map002 dojo interior and Map003 street. **No game data, map artwork or gameplay code was changed.** This report records eleven visible/data mismatches, three design concerns, and three follow-up checks. Design concerns are separated because some follow directly from the agreed layout rather than being implementation defects.

## Evidence and method

Reconstructed the actual current maps from their assigned B–E sheets, inspected them at native size with the current player/NPC sheets, and compared collision with the artwork. Read current transfer events and used the real MZ passage and camera methods without launching the game. Review character copies and the interior half-step image are documentation composites, not NPCs or engine screenshots. They do not simulate animation or the courtyard's translucent gate cue.

- Courtyard: [art and characters](review-2026-10-25/map001-characters.png), [collision](review-2026-10-25/map001-collision.png), [1280 × 720 framing](review-2026-10-25/map001-viewport.png).
- Interior: [art and character](review-2026-10-25/map002-characters.png), [collision](review-2026-10-25/map002-collision.png), [1280 × 720 framing](review-2026-10-25/map002-viewport.png), [exit layering detail](review-2026-10-25/interior-exit-layering-detail.png).
- Street: [art and character](review-2026-10-25/map003-characters.png), [collision](review-2026-10-25/map003-collision.png), [western viewport](review-2026-10-25/street-west-viewport.png), [eastern viewport](review-2026-10-25/street-east-viewport.png).
- [Engine/data results](review-2026-10-25/engine-data-review.json), [texture evidence](review-2026-10-25/texture-review.json), [source hashes](review-2026-10-25/source-hashes.json).

Collision overlays: translucent red is blocked terrain; blue outlines indicate passable terrain. Yellow numbers are event IDs. Normal-priority NPCs also block their occupied cells, independently of the terrain overlay.

## Visible and data mismatches

### 01 — Street: clear ground has invisible barriers — high priority

**Location:** Map003, north forecourt, especially (32–37,3) and (40–41,3). For example, (34,3) is bare dirt in front of the dojo wall but is blocked. Only gate columns 38 and 39 are permitted through rows 2–3. This creates a narrow invisible corridor in a visibly much wider open area. Other north dirt pockets have no full-height boundary to explain their blocking.

**Consequence:** Movement can stop before reaching the visible wall, despite the ground looking clear. Passing a reachability check does not catch this artwork/collision disagreement. Shape the visible forecourt and its collision together rather than restricting it to two columns of empty dirt.

### 02 — Street: exact repeated/mirrored dirt bands — high priority

**Location:** Map003, broad ground surface. The exporter repeats a 100px-high dirt strip, reflecting alternate strips. The resulting period is 200px: pixels at y=200–299 are **identical** to pixels at y=400–499 across the whole 2016px width.

**Consequence:** Repeated dark marks and horizontal bands make the street look assembled from repeated strips. Native pixel density prevented stretching, but did not make this material suitable for large-area repetition. A genuinely repeatable terrain material or a ground plate designed for this composition is needed.

### 03 — Street: dojo wall still sits away from the top edge — high priority

**Location:** Map003, wall wing at pixel x=1536–1775 and x=1968–2015, placed at y=44. The gate crop is placed at y=0, but the wall wings leave roughly 44px of exposed dirt above their allocated artwork.

**Consequence:** The wall does not consistently form the map edge as requested. Moving the gate crop to the top did not move the entire enclosure boundary there. The top-edge termination needs to be designed as one architectural assembly.

### 04 — Street: left end of the dojo wall is unfinished

**Location:** Map003, x=1536, near rows 1–2. A cropped straight wall section stops in the middle of the visible scene, without an end post, return, corner or connection to another structure.

**Consequence:** The enclosure looks cut off. Its wall base also sits around y=132, while the neighboring building/fence frontage ends around y=192, leaving an unexplained change in the boundary line. Give the end a deliberate termination and a readable connection to the street frontage.

### 05 — Street: fence sections do not form continuous runs

**Location:** Map003, gaps at x≈528–671, 960–1103 and 1392–1535; foreground runs have the same construction.

**Consequence:** Transparent margins and repeated end posts leave small breaks between adjacent modules. They read as disconnected miniature barriers rather than coherent fence sections. The existing asset record already notes that fence joins require review; placing the modules on neighboring tiles did not resolve their joins.

### 06 — Interior: entrance frame has incorrect overlap behavior — high priority

**Location:** Map002, central exit around (8,13)–(8,14), particularly the lintel near y≈630–645.

The entire interior is baked into ordinary ground tiles. It uses **zero nonblank star tiles**, so the front wall, posts and lintel cannot draw above the player. A player approaching the exit therefore draws over the horizontal frame. The [half-step detail](review-2026-10-25/interior-exit-layering-detail.png) shows this at a realY-equivalent of 13.5.

**Consequence:** The character appears pasted over architectural parts that should provide depth/occlusion. The front wall/door cutaway and the player clearance need to be designed together; a differently colored entrance patch alone cannot fix drawing order.

### 07 — Across maps: inconsistent viewport framing

**Location:** All maps at the configured 1280 × 720 resolution.

- Map001 is 1200px wide: approximately 40px of empty margin on each side.
- Map002 is 816px wide: approximately 232px on each side, or about 36% of the viewport width combined.
- Map003 is wider than the screen and fills it while scrolling.

**Consequence:** Entering the interior abruptly changes the presentation from a full-width environment to a narrow room surrounded by substantial black space. This is not a character scaling bug. Choose a consistent treatment for compact maps: adequate surrounding map art, a deliberate framing treatment, or a different camera policy.

### 08 — Courtyard/street: gate transfers do not feel spatially symmetrical

**Location:** Map001 events 8–10; Map003 events 1–2.

Leaving the courtyard at row 14 places the player at street **(38,6)**, four rows south of the street's return trigger at **(38,2)**. Returning enters the courtyard at **(12,13)**, only one row from its southern exit triggers. The gate thresholds also activate at different positions relative to their visible gate artwork.

**Consequence:** The destinations are valid and do not loop, but the player can appear to jump well away from the street gate. Facing left communicates the intended route, but does not explain that displacement. Align arrival spacing and activation positions with both visible thresholds.

### 09 — Street: open-looking road ends at unmarked map boundaries

**Location:** Map003, western column 0 and eastern column 41, road/apron rows 4–11.

The dirt road visually continues through both edges, but neither edge has a transfer or a visual closure. The western continuation is deliberately unfinished; the eastern open edge is also reachable.

**Consequence:** The player encounters a hard map limit on apparently continuing terrain. This is an unfinished-map affordance issue, not a dangling transfer. Until the next area exists, the limits need an intentional visual or interaction treatment. Do not invent an unfinished destination merely to remove the boundary.

### 10 — Courtyard: exterior lawn padding still separates walls from map edges

**Location:** Map001, roughly the top 48–56px behind the north wall, narrow outer strips alongside the side walls, and the approximately 50px strip below the south wall/gate.

**Consequence:** The courtyard uses a padded enclosure composition while the street uses cropped roof silhouettes at its northern edge. The visible lawn behind the old wall also preserves the same kind of framing mismatch raised during the street revision. The lawn is behind a legitimate barrier; its blocking is not a collision bug. Decide whether the courtyard should share the new edge-hugging composition.

### 11 — Across exterior maps: ground and rendering treatment still differ

**Location:** Map001 courtyard ground versus Map003 street ground, grass and building silhouettes.

The street dirt is more yellow/orange, with repeated linear grain; the courtyard uses a softer irregular dirt clearing and a different grass treatment. Quiet sample RGB means are approximately (209,155,99) in the courtyard and (214,151,87) on the street. These are local samples, not whole-map palette measurements. The newer street facades also have denser, sharper small detail than parts of the older hall/prop set.

**Consequence:** Matching door heights and copying the gate did not establish one shared environment material/rendering standard. Reconcile ground color, texture density, edge treatment and shadow strength using native-size comparisons with the actual character.

## Design concerns to resolve before another rebuild

### 12 — The road reads as a large empty dirt rectangle

The requested six core road rows are present, but passable north/south aprons add two more. The traversable band is **eight rows / 384px deep**, and the same dirt treatment continues behind/between the buildings. This is over five visible player heights of open depth. The road, apron and inaccessible rear pockets have little visual separation.

This follows the requested widening and is not a reason to add NPCs. Consider where the road edges, building thresholds, drainage and forecourt should be visually distinguished so width reads as a street rather than unused canvas. Keep the environment-only requirement.

### 13 — Roof cropping and facade widths remain visually uneven

The home loses 27px at its top, the merchant loses 8px, while the tea shop begins 2px below the top edge. The home is also 380px wide versus the dojo hall's 288px frontage, although their complete visible heights are now much closer once the dojo veranda is included.

Top-edge cropping and varying widths were intentional, so these are not automatically defects. However, the house ridge being cut more heavily than neighboring roofs can still make the row feel inconsistent. Choose deliberate roof silhouettes and frontage proportions instead of deriving every top position from one shared foot baseline.

### 14 — Interior/exterior footprint compression needs an explicit style decision

The interior is 816 × 720px, including an approximately 720px-wide open floor envelope. The exterior hall is only 288px wide before its separate veranda arrangement. Larger interiors are normal RPG shorthand, but this degree of expansion makes the hall feel substantially larger inside than its frontage suggests.

This is a design concern, not proof that the interior is incorrectly scaled. Keep character, doorway and furniture proportions stable; decide whether the exterior should communicate a deeper hall or whether a smaller interior would suit this particular building.

## Follow-up checks that need a live playtest

1. **Courtyard gate readability.** `WWS_CourtyardGateReadability` shows a masked duplicate of the player at opacity 88/255 only while realY is greater than 10.7 and less than 13. The return destination is exactly row 13. Check moving and standing frames on arrival and in both directions, especially where the cue turns off. Static composites do not reproduce this cue; poor readability is a risk to verify, not a newly confirmed runtime failure.
2. **Old street saves after shrinking the map.** Previous Map003 versions were 64 tiles wide and used gate events around columns 57–58. Current width is 42. A save made on the old street may retain an out-of-bounds player/event state. No old save was loaded during this review, so compatibility is unverified.
3. **Prop contact and conservative grid collision.** The courtyard's narrow rack feet, bamboo bases and basin, and the interior rack/chest/cushions use whole-cell collision rather than silhouette collision. Their coarse bounds are visible in the overlays. Test the specific approaches where they feel obstructive; rectangular collision by itself is an expected engine constraint, not automatically a defect.

## What the review did not find broken

All **seven current direct transfer commands** have valid in-bounds destinations. Their relevant approaches are reachable. The courtyard dojo door uses a normal-priority touch event, so entering it by bumping from the veranda is expected; its occupied cell not appearing in the walkable-cell search is not a broken door. Current street entry/return routes are connected, and horizontal scrolling without vertical scrolling is consistent with the map dimensions.

The corrected street door measurements and native gate scale are retained. Missing street NPCs, encounters and building interiors are intentional scope choices and are not recorded as defects. No source map/data changes were made to fix any finding during this review.
