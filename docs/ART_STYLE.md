# WWS Art Style Guide

Established: October 7, 2026
Updated: October 21, 2026 — regenerated overworld cast at approximately 15% larger visible size; 64 × 88 frames are the current production standard.

## Direction

WWS is an Edo-period Japan, samurai-themed RPG. The agreed visual direction is expressive, detailed pixel art with readable silhouettes, large clear faces, defined clothing folds, restrained colors, and stylized adult proportions. The Shinsengumi overworld sprite establishes the current character style; the refreshed player and Masanori extend it to the rest of the cast. Characters, environments, and props should share the same scale, palette, perspective, and lighting.

Use the references below for future character assets. Historical clothing, architecture, and equipment details should be researched for the chosen time and location before final designs are approved. The exact era within the Edo period and level of supernatural content are still undecided.

## Current overworld references

| Reference | Game sheet | What to match |
|---|---|---|
| Shinsengumi — primary style reference | [$Shinsengumi-v2.png](../img/characters/$Shinsengumi-v2.png) | Face and hair readability, strong silhouette, blue-and-white haori, and clear garment layers; front standing height 64px. |
| Player — current cast reference | [$Samurai-v3.png](../img/characters/$Samurai-v3.png) | Indigo kimono, charcoal hakama, red-brown obi, and black topknot; front standing height 69px. |
| Masanori — current cast reference | [$SamuraiInstructor-v3.png](../img/characters/$SamuraiInstructor-v3.png) | Older face, greying hair, russet kimono, and indigo obi; front standing height 67px. |

Use the exported game sheets to judge native scale and readability. For generation, supply the [current Shinsengumi source](art/overworld-larger-v1/shinsengumi-source.png) as the style reference and the intended character's own artwork as a separate identity reference. Larger sources explain the design; they do not replace checking the 64 × 88 exports. Previous 48 × 72 sheets remain historical identity references and are superseded for production scale. Sources, exact prompts, export records, and previews are in the [larger cast production record](art/overworld-larger-v1/README.md) and indexed in [ASSETS.md](ASSETS.md).

This update establishes overworld character rendering. The new artwork is approximately 15% taller than the previous cast, rounded to whole pixels. This increase is already incorporated in the current sheets: match their absolute size for future characters rather than adding another 15%. The engine renders them at 1× scale. Battle canvases and pose anchors retain their existing specifications; reuse each character's face, hairstyle, palette, and outfit across map and battle art. Actual engine captures cover all twelve direction/frame combinations, four-direction keyboard movement, and doorway proportions; [runtime results](art/overworld-larger-v1/browser-check.json) also confirm legacy image loading. Visual walk-cycle review remains part of asset acceptance.

## Overworld character design

- Favor a large expressive head, clear eyes and brows, readable hair masses, compact torso, and substantial sleeves and hakama. Aim for approximately 3–4 heads tall, matching the current sheets rather than stretching the figure into realistic proportions.
- Separate face, collar, sleeves, hands, obi, trouser folds, sandals, and equipment through clear shapes and value contrast. A character should remain recognizable at native 64 × 88 frame size against the courtyard floor.
- Use a few deliberate hair highlights and cloth shadow planes. Preserve the broad garment shapes before adding texture; tiny noise, dense hatch marks, and evenly outlined individual strands weaken readability.
- Keep costume signatures visible: Shinsengumi blue and white sawtooth edging with striped hakama, the player's indigo and red-brown, and Masanori's russet and indigo. Match rendering quality across the cast while preserving different faces, ages, hairstyles, clothing, and equipment.
- Show relaxed hands and sheathed weapons while walking unless the character explicitly requires another state. Preserve the weapon's anatomical side when turning; mirroring a whole frame can put the katana on the wrong hip.

## Dimensions and formats

| Asset | Specification | Notes |
|---|---|---|
| World tile | 48 × 48 px | Matches the current project tile size. Large objects can span multiple tiles. |
| Map character frame | 64 × 88 px | Transparent canvas; the body and equipment must fit with clear edge margins. This does not change the 48px movement grid. |
| Character proportions | Approximately 3–4 heads tall | Slightly stylized adult proportions. |
| Visible map character height | Front standing: player 69px, Masanori 67px, Shinsengumi 64px | Includes hair; other directions and walking poses reach approximately 71px. Judge body size independently of transparent canvas margins. |
| Walking ground anchor | Sole baseline at cell y=84 | Keep feet centered around x=32; retain four transparent pixels below the soles and clear margins on all edges. |
| Walking animation | 3 frames × 4 directions | 12 frames per character. |
| Single-character walking sheet | 192 × 352 px | Transparent PNG; 3 columns × 4 rows, no gutters. |
| Polearm carrying exception | 64 × 112 frames; 192 × 448 sheet | Warrior monk naginata sheets retain 67px standing bodies and sole y=108. Extra 24px above the body is transparent weapon clearance; use native 1× rendering and the same 48px collision grid. |
| Dialogue face | 144 × 144 px per face | Standard eight-face sheet is 576 × 288 px, arranged 4 × 2. |
| Concept art | Large reference image | No fixed export size yet; it is a design reference, not a game-ready sprite. |
| Current game view | 1280 × 720 px (16:9) | Review sprites at this view size and at native pixel scale. |

Front-view opponent battle sprites use transparent 288 × 288 canvases as the initial human-sized baseline, with the whole body and weapon visible. Match the map character's identity, palette, and slightly stylized proportions; review their apparent size in the 1280 × 720 battle view. The engine supplies damage, collapse, and attack-effect animations. The Masanori NPC is the first reference for this format. Side-view battle sheets, portraits beyond dialogue faces, and UI icons are not yet specified. Tileset sheet formats are defined below; individual asset placements will be planned per sheet.

For battle rendering, use Masanori's and Shinsengumi's actual battle exports as the style templates: readable stylized faces, substantial hands/feet, restrained outlines, and broad angular cloth shadow planes. Avoid fine woven texture, mottled shading, realistic facial wrinkles, and dense small folds that make a new sprite look like a reduced illustration. Identity references supply clothing and facial identity, not a competing rendering style. The [warrior monk v2 revision](art/warrior-monks/style-v2/README.md) records the unmasked-first comparison and current replacements. Judge style beside the cast at native size and a shared foot baseline; matching body height alone is insufficient.

For battle-pose variants, retain the same outfit, face, pixel density, canvas, and foot anchor. Masanori's five kamae poses use a visible sole baseline at y=268 on the 288 × 288 canvas, with enough room above for Jodan's raised blade and beside the body for Kasumi/Waki. Fit the complete weapon rather than clipping it. Source images, exact prompts, and export alignment records are listed in [ASSETS.md](ASSETS.md).

The current player form set uses 480 × 384 transparent frames with a common foot axis at x=240 and sole baseline y=368. The larger canvas supplies weapon clearance; it does not enlarge the approved Chudan art. Standing figures retain about 280 pixels of body height, with Kasumi lower for the crouched guard. Keep the rear three-quarter camera facing upper-right consistent across forms. The original 320 × 320 Chudan prototype is preserved as a source reference.

## Pixel art rules

- Use crisp pixel clusters and restrained dark outlines.
- Give the silhouette a clear dark contour and use lighter internal edges where folds and facial features need separation. Keep face, hair, and outfit readable as distinct masses.
- Avoid blurry edges, smoothing, and antialiasing in production pixel assets.
- Keep clothing folds, equipment, and silhouettes readable at native size.
- Prefer readable shapes over tiny ornamentation.
- Keep pixel density consistent across characters, props, and environments.
- When enlarging pixel art for review, use nearest-neighbor scaling.

## Palette and lighting

Use muted indigo, warm browns, charcoal, cream, and warm skin tones as the main color families. Asagi blue with cream-white edging is an established Shinsengumi costume color; reserve red for selective accents such as the player's obi. Use enough value contrast to separate the face, hands, collar, and garment layers from dark hair and hakama. Sample the current character references when extending an existing design. A fixed swatch set and maximum palette size have not yet been formalized.

Use a consistent upper-left light source for map assets. Keep shading readable and restrained. Any baked-in shadows must agree with this direction.

## Perspective and character consistency

Use RPG Maker's elevated map view. Faces, bodies, and equipment should remain readable from the four movement directions.

Maintain the same character height, head size, clothing colors, equipment, and anatomy throughout an animation. Align the feet to a consistent baseline and preserve a consistent ground anchor. Clothing and limbs can move, but the body should not drift between frames.

Review all three current characters together at native size before accepting another cast member. Match apparent body size and pixel density, allowing intentional differences in build or hairstyle. Keep front, side, and rear views equally recognizable; a large detailed front face alone does not establish a consistent sheet.

## RPG Maker MZ walking sheet layout

For an individual character, prefix the filename with `$`, for example `$Samurai.png`. This tells MZ to read the image as a single character rather than an eight-character sheet.

Each cell is 64 × 88 px. The full sheet is 192 × 352 px:

For a carried weapon that exceeds this canvas, add transparent space rather than shrinking the body or clipping the blade. The [warrior monk sheets](art/warrior-monks/overworld/README.md) establish the polearm exception: 64 × 112 cells, 192 × 448 sheets, feet centered at x=32, sole baseline y=108, and four transparent pixels below the soles. Keep the body at the current cast scale. Direction order and animation layout remain the same as below.

| Row | Direction | Column 1 | Column 2 | Column 3 |
|---|---|---|---|---|
| 1 | Down / facing viewer | Walking pose A | Standing pose | Walking pose B |
| 2 | Left | Walking pose A | Standing pose | Walking pose B |
| 3 | Right | Walking pose A | Standing pose | Walking pose B |
| 4 | Up / facing away | Walking pose A | Standing pose | Walking pose B |

The engine cycles through the middle frame between the two walking poses. Keep cells uniform, with no padding between them. Use actual alpha transparency, not a painted checkerboard background.

Column 2 is a relaxed neutral standing pose. Columns 1 and 3 must show opposite leg steps with corresponding arm swing, including front and rear views. Keep movement restrained enough to preserve identity and ground contact. Alternate-step frames must be distinct; repeating the same forward foot in both columns creates a hitch in the cycle.

Fit the complete figure, topknot, sleeves, sandals, and sheathed weapon inside each cell. Match the current cast's 64–69px front standing heights, a sole baseline at y=84, and a foot anchor near x=32. Keep the silhouette inside approximately 60px of width with transparent side clearance. Preserve consistent apparent body scale and modest pose-height differences across all twelve frames. Resize each extracted figure uniformly in both axes; never stretch width and height independently. The current export targets each corresponding previous frame's visible height × 1.15, rounded to whole pixels, and records the result in [export.json](art/overworld-larger-v1/export.json).

## Concept art and asset generation

Concept art may use an illustrative finish to explore a design, but must preserve the intended sprite proportions, clothing, palette, and recognizable shapes. Once a design is approved, reuse it as a reference for subsequent assets.

Generated sprite sheets are drafts until checked. Image generation alone does not guarantee exact dimensions, frame alignment, transparency, pixel quality, or consistent animation. Inspect and clean up outputs before importing them into the game.

Separate style and identity references in every prompt. Supply the Shinsengumi sheet for rendering quality and the subject's existing artwork for costume, face, and hairstyle. Keep large generated sources and exact prompts, then export a versioned game sheet with nearest-neighbor resampling and preserved alpha. If generated row spacing is uneven, locate the actual sprite rows and align complete frames into the final grid; do not blindly cut through heads or feet at quarter-sheet boundaries. Compare native exports and enlarged nearest-neighbor previews. Resizing alone cannot correct poor pixel clusters or a duplicated walking step.

### Reusable walking sprite prompt

> Create an overworld pixel-art walking sheet for [character description] in WWS, an Edo-period Japan samurai RPG. Reference 1 is the current Shinsengumi v2 walking sheet: match its expressive large face, readable hair masses, bold silhouette, defined fabric folds, crisp pixel clusters, restrained dark outlines, and stylized adult proportions of approximately 3–4 heads tall. Reference 2 is this character's identity: preserve [face, age, hairstyle, outfit colors, garment patterns, and equipment]. Match player v3, Masanori v3, and Shinsengumi v2 in apparent map scale. Final export target: 192 × 352 pixels, twelve 64 × 88 cells, 3 columns × 4 rows, no gutters. Rows: down/front, left, right, up/back. Columns: walk A, neutral standing, walk B with the opposite leg and arm step. Keep all frames in each row facing the same direction. Target [character-specific height] pixels of front standing visible height; current cast references are 69px player, 67px Masanori, 64px Shinsengumi. These sizes already include the 15% increase. Maintain consistent body size across directions with modest pose variation; soles at cell y=84, feet centered near x=32. Fit the entire figure and equipment inside each cell with transparent margins. Preserve weapon placement on its anatomical side; swords stay sheathed. Use a muted palette with readable skin/collar highlights and consistent upper-left light. Match RPG Maker's elevated map perspective. True alpha transparency, no background, baked ground shadow, labels, grid lines, text, watermark, blur, or smooth painterly finish. Larger generated source sheets may leave generous gaps for extraction; pack complete figures into the final grid and verify layout, silhouette, alpha, anchors, and opposite steps at native size and in game.

### Asset acceptance checklist

- [ ] Matches the approved style and character reference.
- [ ] Matches the Shinsengumi and current player/Masanori in face readability, silhouette, and apparent map scale.
- [ ] Uses the required final dimensions and sheet layout.
- [ ] Has genuine transparency where required.
- [ ] Reads clearly at native size and in the current game view.
- [ ] Maintains consistent scale, palette, perspective, and lighting.
- [ ] Preserves clothing and equipment across all directions.
- [ ] Keeps feet and ground anchors aligned throughout animation.
- [ ] Uses consistent apparent body scale across all twelve frames, uniform resizing in both axes, and whole-pixel target heights; no head, foot, or weapon crosses cell edges.
- [ ] Uses 64 × 88 frames, a 192 × 352 sheet, sole baseline y=84 and foot axis x=32 at native 1× rendering, or the documented polearm clearance exception (64 × 112, 192 × 448, sole y=108); movement remains on the 48px grid.
- [ ] Center frames stand neutral; walking A/B alternate opposite legs and arms in all four directions.
- [ ] Contains no accidental labels, grid lines, or generation artifacts.
- [ ] Has been previewed in RPG Maker before being treated as final.

## Tileset generation guidelines

Added: October 8, 2026

Generate tiles as detailed pixel art on a 48 × 48 grid, matching the samurai's scale and the shared palette, perspective, and lighting rules above.

### Visual and layout requirements

- Use an elevated RPG Maker map view; avoid isometric angles.
- Use crisp pixel clusters and restrained outlines, without blurry edges.
- Use muted indigo, warm wood browns, charcoal, cream, and limited red accents.
- Keep the light source consistently at the upper left.
- Scale doors, furniture, and buildings around the current cast's visible body heights, approximately 64–71px within 64 × 88 frames. Large objects may span multiple tiles.
- Specify each object's tile footprint before generation, such as 1 × 1, 1 × 2, or 3 × 3 tiles.
- Align assets to exact tile boundaries, without gutters, labels, or visible grid lines.
- Use genuine alpha transparency around props and decorations. Ground and floor surfaces should be opaque.
- Keep repeatable terrain edges seamless and related building pieces aligned.

### RPG Maker MZ sheet formats

These dimensions apply to this project's 48-pixel tile size.

| Slot | Sheet size | Purpose |
|---|---|---|
| A1 | 768 × 576 px | Animated water and related autotiles. |
| A2 | 768 × 576 px | Ground and floor autotiles. |
| A3 | 768 × 384 px | Building autotiles. |
| A4 | 768 × 720 px | Wall autotiles. |
| A5 | 384 × 768 px | Ordinary ground tiles; 8 columns × 16 rows. |
| B–E | 768 × 768 px each | Props, decorations, and building pieces; 16 columns × 16 rows. |

A1–A4 require specialized autotile arrangements, including 24 × 24 subtiles at this tile size. Ordinary grids of square textures cannot simply be assigned to these slots. Use the existing project sheets as structural templates and preserve each slot's arrangement; A1 also requires the appropriate animation frames.

For sheet B, leave the upper-left 48 × 48 tile completely transparent and set its passage flag to star in the editor. Keep unused areas transparent. Tileset filenames do not use the character sheet `$` prefix.

### Recommended first asset set

Start with dirt, grass, stone paving, wooden flooring, fences, a simple building, crates, barrels, and lanterns. Generate small coordinated groups, then assemble and test them before producing a larger set. A5 and B–E are useful starting slots for ordinary tiles and props; introduce autotiles using the correct templates.

### Reusable prop generation prompt

> Create a coordinated pixel-art prop set for an Edo-period Japan samurai RPG: [asset list]. Match the supplied samurai reference. Use an elevated RPG Maker map perspective, crisp pixel clusters, restrained dark outlines, muted wood browns, charcoal, cream, indigo, and selective red accents. Light comes from the upper left. Design each object to occupy a specified number of 48 × 48 tiles: [footprints]. Keep every object aligned to the tile grid, with no gutters or overlapping assets. Use genuine background transparency. No text, labels, grid lines, watermark, isometric perspective, or blurred edges. Treat the dimensions and alignment as production targets to verify after generation.

For ground textures, replace the transparency instruction with:

> Create opaque, seamless 48 × 48 terrain tiles. Opposite edges must join without visible seams when repeated.

When generating a full sheet, specify its intended slot, exact final canvas dimensions, and planned cell locations. For A1–A4, supply the appropriate structural template in addition to the visual reference. A generated sheet is a draft until its layout and behavior have been verified.

### Tileset validation and import

- [ ] Check exact sheet dimensions and 48-pixel tile alignment.
- [ ] Check transparency, pixel sharpness, and absence of labels or grid artifacts.
- [ ] Repeat terrain in both directions to check seams.
- [ ] Check wall, roof, fence, and building joins.
- [ ] For autotiles, test interior, edge, and corner combinations; check A1 animation where applicable.
- [ ] Compare props and doorways with the samurai at native scale.
- [ ] Save final PNGs in `img/tilesets` and assign their slots under Database → Tilesets.
- [ ] Configure passage settings (circle, cross, or star), directional passage, and any relevant ladder, bush, counter, or terrain settings.
- [ ] Build a small test map and walk the samurai through it to verify collisions and layering.

## Environment proportions and scale

Added: October 8, 2026

The 48 × 48 tile is a placement grid, not a limit on object size. Scale the environment against the current player v3, Masanori v3, and Shinsengumi v2: front standing visible heights of 69px, 67px, and 64px respectively within 64 × 88 frames. Other directions and walking poses reach approximately 71px. Compare against actual exports before finalizing assets. Transparent margins are not part of the character's body height, and a larger sprite does not require a larger collision footprint.

The following are starting targets for readable game art, not literal architectural measurements or claims about historical dimensions. All visible dimensions refer to the projected image on screen. Tile footprints describe the space reserved for the artwork, not necessarily its collision area.

| Object | Suggested visible size | Artwork footprint |
|---|---|---|
| Single door opening | 36–44 px wide, 68–76 px high | Within a 1 × 2 tile assembly. |
| Door with frame | Up to 48 px wide, 80–96 px high | 1 × 2 tiles. |
| Double or sliding entrance | 72–88 px wide, 68–76 px opening height | 2 × 2 tiles including frame. |
| Interior wall | 96–144 px high | 2–3 tiles tall; width varies. |
| Table | 48–96 px wide, 28–40 px projected depth | 1–2 tiles wide; allow additional rows for legs as needed. |
| Stool | 20–28 px wide, 20–28 px high | 1 × 1 tile. |
| Waist-high fence | 28–36 px high | Repeatable 1-tile sections. |

A doorway should visibly clear the character's hair and head, with enough width for the body. Check its opening against the character standing at the threshold. Keep the opening, sill, and ground contact consistent between open and closed versions.

The current starter house uses a 288 × 192 pixel (6 × 4 tile) exterior with an approximately 80 × 72 pixel double doorway. Its [older character comparison](art/red-wood-exterior/scale-preview-v2.png) records the previous cast scale; use the [current in-game threshold view](art/overworld-larger-v1/doorway-in-game.png) when judging the larger characters. The older 384 × 288 exterior was oversized for this starter house and is retained only as a source. Existing environment dimensions have not been automatically enlarged; verify clearance against the current cast, especially taller rear views, before reusing the starting targets above.

Perspective changes apparent dimensions: a table's projected depth includes its visible top, while its front edge and legs communicate height. Do not treat a vertical pixel measurement of a floor surface as a real-world height. Maintain consistent visible top-surface depth across related furniture and architecture.

### Scale reference and prompt addition

Before generating a full building set, approve a reference composition containing the samurai, a doorway, a wall, and a table at native pixel scale. Use this same composition as a visual reference for future environment assets. If the protagonist's scale changes, review the environment proportions before continuing production.

Add this instruction to environment generation prompts:

> Match the supplied current protagonist's scale: approximately 69px front standing visible height within a 64 × 88 frame; walking and rear views may reach approximately 71px. Use a 48px tile grid. Door openings must visibly clear the tallest applicable hair/pose; approximately 72–76px is a starting target to verify at the actual threshold, with a single door and frame fitting within a 48 × 96px assembly. Keep the threshold and ground contact aligned. Compare related buildings and props against the same character reference; do not enlarge the environment merely because the sprite canvas is larger.

## Environment behavior and production rules

### Ground contact, collision, and navigation

- Document both the artwork footprint and the intended blocked or walkable cells for each object.
- Default MZ movement and collision operate on map cells, not the opaque silhouette of an image. A large event graphic does not automatically block every cell it covers.
- Keep ordinary walkable routes at least one tile wide. Prefer two-tile routes in frequently used areas for visual breathing room; this is a design preference, not an engine requirement.
- Align door transfer events with the threshold. Check approaching, opening, entering, and exiting from the player's viewpoint.
- Keep decorative sword silhouettes and clothing from making ordinary passages appear too narrow even when cell-based movement permits them.

### Layering and shadows

- Plan which parts block movement and which should draw above the character. Tree canopies, roof overhangs, and upper door frames often need separate handling from their bases.
- A star passage flag is not a complete collision solution. Verify the underlying tiles and any events as well as the final visual overlap.
- Test tall objects with the character above, below, and beside them so heads, feet, and equipment overlap sensibly.
- Avoid doubling shadows by combining strong painted shadows with the editor's shadow layer. Keep shadow direction and darkness consistent.
- Match the density and contrast of floor textures to the character; ground detail should not obscure the player's silhouette or usable entrances.

### Animated doors and interactive props

Static building pieces belong in tilesets. Use event graphics for doors or props that change state. Give closed, opening, and open states identical canvas dimensions, anchors, and frame placement.

For a single door event using a standard single-character sheet, a useful target is a 48 × 96 frame and a 144 × 384 sheet (3 columns × 4 rows). Plan the state layout and event animation together; door rows need not represent walking directions. Prevent unintended walking or stepping animation from cycling through states.

Use a filename such as `!$EdoDoor-v1.png` for an individual object-character sheet. `$` selects the single-character layout; `!` removes the normal character's 6-pixel vertical offset and bush transparency behavior. Compare the door's bottom edge with its tileset frame in the engine before approving it.

### Modular sets and asset records

- Build compatible straight sections, corners, ends, and junctions for walls and fences. Keep beam widths, roof pitches, trim, and material colors consistent.
- Specify a layout before generating a sheet. Reserve contiguous cells for multi-tile objects, and keep their pieces in documented locations.
- Save source images, exact prompts, export dimensions, and a preview beside the asset's documentation. Record its intended slot, grid locations, passage settings, and animation layout where applicable.
- Use descriptive versioned filenames, such as `EdoVillage_B-v1.png`, and retain approved references. Do not overwrite existing assets without an intentional replacement plan.
- Keep pixel density consistent when exporting. Nearest-neighbor resizing preserves hard edges but does not itself repair inconsistent pixel art, alignment, or scale.
- Test the first small set in-game before expanding it: doorway clearance, furniture scale, terrain seams, collision, layering, and animation must all work together.

## Next visual milestone

Use Shinsengumi v2, player v3, and Masanori v3 as the cast baseline for new overworld characters. Review walk cycles in a running playtest, refine any remaining frame inconsistencies, and formalize shared palette swatches from the current references. Compare future environment additions against these 64 × 88 exports and the existing courtyard at 48 × 48 tile scale. Keep generated sources, prompts, previous versions, and compatibility mappings with the production records.
