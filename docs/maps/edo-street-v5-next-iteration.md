# Street v5 — review for the next iteration

Reviewed October 25, 2026. **Documentation only: no maps, production art, collision, events, plugins or settings changed.** This qualifies the v5 implementation account; successful movement checks do not establish that every architectural join or captured pose is correct.

The main v4 defects improved substantially. The next pass should be a targeted repair/polish pass, retaining the 42 × 15 map, six-row road, leftward route, current facade/player scale, 76px door openings, approximately two-to-three-tile gaps, and environment-only scope. Missing NPCs, encounters, interiors and future-area transfers are intentional, not defects.

## Evidence and method

Reconstructed current Map003 from its active B/C/D sheets and confirmed an exact match to the saved v5 composition. Inspected the full composition, existing 1280 × 720 engine captures, saved movement results, current gate/collision data, canopy rendering code and capture helper. Also checked current Map002 dimensions and its absence of nonblank star tiles for the carried-forward interior finding.

No new game launch or engine screenshots were needed. New native crops, 3× nearest-neighbor crops and a source-frame comparison are documentation evidence, not gameplay captures.

- [Current production source hashes](edo-street-v5-next-review/source-hashes.json), [observations](edo-street-v5-next-review/observations.json), [capture/frame audit](edo-street-v5-next-review/capture-state-audit.json).
- Existing engine captures: [west walking](../art/edo-street-v5/street-west-walking-native.png), [middle walking](../art/edo-street-v5/street-middle-walking-native.png), [street arrival](../art/edo-street-v5/street-arrival-native.png), [courtyard arrival](../art/edo-street-v5/courtyard-arrival-38-native.png).

## Confirmed remaining problems

### 01 — Merchant return rails still end in open air — high priority

**Where:** Pixel x≈1088–1123, y≈112–144, above/left of the merchant's basket display.

The raised return's two short rails end at exclusive x=1118. The first substantially opaque facade pixel is at x=1123 on both rail bands, leaving a **five-pixel gap**. This is visible as two free, cut-off timber prongs pointing toward the shop. There is no end post or architectural socket at the rail tips. The main low fence is continuous, but the claim that this upper return connects to merchant timber is incorrect.

The return also uses a taller, chunkier capped-post style than the small front-view fence. Its upper prongs make it resemble an unfinished sign bracket rather than a short property-fence corner.

**Next iteration:** Design one coherent corner and attachment at the actual facade edge. Make the rails reach an appropriate timber member, or finish them with a proper post/return. Keep them clear of the basket silhouette and do not simply extend an oversized rectangular crop beneath the prop.

Evidence: [native merchant return](edo-street-v5-next-review/merchant-return-native.png), [3× detail](edo-street-v5-next-review/merchant-return-3x.png). Gap measurements are in the observations JSON.

### 02 — Dojo corner still exposes a patchwork timber transition

**Where:** The enclosure return at x≈1496–1536, particularly the right-hand timber face around y=104 and the base at y=180–192.

The old horizontal timber stub is gone, and the return now has a convincing overall blocking footprint. However, the replacement upright starts halfway down the wall, leaving a conspicuous horizontal change in the timber face at y≈104. Its front face meets the enlarged wall body with a patch-like edge. The widened stone toe also has a coarser horizontal texture than nearby native post feet.

This is an art/texture join problem, not evidence of an open route or a revived invisible forecourt barrier. The completed shape is better than v4, but still needs a corner drawn as one assembly rather than another overlapping rectangle.

**Next iteration:** Replace or carefully reconcile this small corner/post/foot assembly at the target pixel scale. Preserve its column-31 blocking and keep the clear column-32 forecourt accessible. Do not rebuild or enlarge the shop row to hide the junction.

Evidence: [native dojo corner](edo-street-v5-next-review/dojo-corner-native.png), [3× detail](edo-street-v5-next-review/dojo-corner-3x.png).

### 03 — Several contact screenshots do not show their recorded pose — high priority for verification

**Where:** `tools/review-edo-street-v5.cjs`, its `capture()` helper, and four of six sampled street contact portraits.

The saved engine metadata says the player faces north (direction 8), but the actual PNG shows the right-facing source frame (direction 6) in these captures:

| Capture | Recorded direction/pattern | Best matching visible source frame |
| --- | --- | --- |
| Home/tea fence contact | 8 / 0 | 6 / 0 |
| Tea-shop foundation contact | 8 / 2 | 6 / 2 |
| Merchant foundation contact | 8 / 1 | 6 / 1 |
| Dojo wall contact | 8 / 1 | 6 / 1 |

The comparison uses the actual `$Samurai-v3` opaque source pixels, testing all 12 direction/pattern frames and nearby render positions. For the tea shop, the right-facing match has mean RGB error about **1.29**, versus **40.65** for the recorded north-facing frame. Some other sampled images show a three-pixel position lag consistent with one previous movement frame.

The helper changes player state and stops the scene without requiring a completed subsequent sprite update/render. Its logical state can therefore be newer than the canvas being captured. This also explains why map-name banners can remain visible after the helper has already set the window's logical openness to zero.

**Consequence:** These are actual engine images, not fabricated composites, but several are stale relative to their metadata. The logged blocking results remain useful; these portraits cannot prove the exact final contact pose, direction, or pixel clearance claimed for them.

**Next iteration:** Synchronize update/render and state capture first. Wait for the changed `Sprite_Character` pose and a completed rendered frame, freeze that same frame, and record the displayed sprite frame/screen position alongside logical map coordinates. Then refresh only the affected contact portraits and changed approaches. Do not discard the valid continuous keyboard walk or all existing transfer results.

Evidence: [visible screenshot versus recorded and matched source frames](edo-street-v5-next-review/capture-frame-comparison.png), [full six-image audit](edo-street-v5-next-review/capture-state-audit.json). This audit did not sample every capture; it does not establish that all 18 are stale.

## Visible presentation concerns

These need an art decision or focused movement review. They are not newly confirmed broken transfers or reachability failures.

### 04 — The apron reads as a continuous tinted strip

**Where:** The straight frontage band at y=192–240, across the entire street and dojo forecourt.

It clearly separates the road from the north side, but the near-uniform gray/beige treatment and parallel edges read more like a color overlay than a distinct constructed or worn surface. The same band passes every frontage without local threshold wear, change of paving, or an explanation for how the dojo forecourt meets it.

**Next iteration:** Choose a material and give it restrained native-scale surface/edge treatment and frontage-specific transitions. Keep the earth quiet; do not bring back mirrored noise, pale pebble clusters or repeated dirt markings. Keep the six-row road clear.

Evidence: [native apron transition](edo-street-v5-next-review/apron-transition-native.png). The exporter confirms that this band is a color mix across fixed rows, rather than separate apron artwork.

### 05 — The canopy cutaway removes most of the gate's structure

**Where:** Courtyard canopy and central lintel while the player is near the southern gate.

Arrival readability is genuinely improved: the actual player is easy to locate, and the old faint duplicate is gone. However, the entire extracted canopy and the central beam fade to **48/255**, leaving a very pale green-tinted roof and a nearly missing central header while the posts remain solid. The gate temporarily reads as two uprights around a rectangular gap more than a roofed threshold.

The fade also uses a broad rectangular proximity test, including yard-side positions around x=11–13, y=11, rather than the actual player/roof overlap. The existing captures show the faded and restored states, but not every boundary crossing or reversal.

**Next iteration:** Decide whether to keep this deliberate cutaway, fade only the occluding roof area, retain more of the structural header, or use another readable architectural treatment. Evaluate the southbound cutoff and quick reversal with synchronized frames. Do not regress to the barely visible player cue or assume that player opacity 255 alone proves final on-screen readability.

Evidence: [native cutaway crop](edo-street-v5-next-review/courtyard-cutaway-native.png), [existing half-step](../art/edo-street-v5/courtyard-gate-half-step-native.png), [restored canopy](../art/edo-street-v5/courtyard-canopy-restored-native.png). The appearance is confirmed; a flash/pop at an unrecorded transition is still an unverified risk, not a confirmed runtime defect.

### 06 — Barrier/fence rendering still needs a shared visual standard

The new north–south barriers are a substantial improvement over the old rotated ladder-like rails. Their broad caps, deep brown faces and small side feet nevertheless differ from the thin, lightly shaded front-view posts. The raised merchant return makes that difference particularly conspicuous. Ground-contact shadow strength and timber detail should be reconciled when the return/corner art is replaced.

This does not justify replacing working closures with open map edges. Preserve proper end posts, the drainage contact and the existing closed-boundary behavior.

### 07 — The central road remains visually dominant

The six core road rows plus two walkable aprons still make an eight-row / 384px-deep traversable band. The quieter earth fixes the earlier distracting texture, but most of the native frame remains flat open ground. This follows the requested width and environment-only scope. Treat it as an ongoing composition constraint, not a collision bug or a reason to add NPCs, encounters, obstructing props or extra destinations.

Improve frontage/shoulder hierarchy and contact treatment within the established layout. Do not undo the width or scale requirements to make the screenshot look busier.

## Deferred issues still present

1. **Interior doorway layering:** Current Map002 remains 17 × 15 and has **zero nonblank star cells**. Its exit frame/lintel remains baked into the ground treatment, so the prior occlusion defect remains deferred. The [earlier doorway-layering evidence](review-2026-10-25/interior-exit-layering-detail.png) is historical evidence, not a new playtest of this review.
2. **Viewport framing:** Map001 is still 1200px wide, leaving about 40px per side at 1280px; Map002 is 816px wide, leaving about 232px per side. The street fills and scrolls across the viewport. No camera policy was changed.
3. **Courtyard exterior padding:** The lawn around/behind the courtyard enclosure remains, unlike the street's cropped northern architecture. It is behind legitimate boundaries; its blocking is not an invisible-wall defect.
4. **Interior/exterior footprint compression:** The hall is still substantially larger inside than its exterior frontage suggests. This remains an explicit style decision, not permission to rescale doors or characters.
5. **Legacy street saves:** Compatibility of older 64-tile-street saves remains untested. No save migration was reviewed or changed.
6. **Other conservative prop collision:** Courtyard/interior prop approaches remain separately scoped. Closed shop fronts also retain whole-cell boundaries; v5 does not make their steps or interiors usable.

## What this review did not find broken

- The active street still reconstructs exactly from the current sheets and remains 42 × 15. There is no evidence here of a missing tile page or a shifted map connection.
- The main horizontal fence rails no longer have the old internal transparent breaks. Item 01 is a different problem at the merchant's **upper endpoint**, not a return of the repeated rail gaps.
- Building bases now align at y=192; door/player scale is retained. The cropped roof planes have no obvious surviving ridge/finial stubs in the inspected views. The [home eave detail](edo-street-v5-next-review/roof-home-3x.png) does not establish a new roof seam.
- The old exact reflected dirt bands and conspicuous pale pebble treatment are resolved. The quiet native road sample is much closer to the courtyard than v4.
- The large roof slab behind the dojo wall and the old horizontal return stub are gone. Item 02 concerns a smaller remaining texture/assembly transition.
- Existing movement evidence records all three active gate triggers, valid adjacent arrivals and no immediate return loop. There is no new evidence here of an invalid transfer or disconnected street route.
- The courtyard's center-only passage is conservative grid collision around visible jambs. Its narrowness alone is not proof of another invisible barrier; do not reopen the side cells blindly.

## Recommended order for the next iteration

1. Fix capture/state synchronization and refresh the affected exact-contact evidence.
2. Repair the merchant upper endpoint and reconcile its short return with the adjoining fence style.
3. Finish the small dojo corner/post/foot texture transition as one coherent asset.
4. Refine the apron as a material and decide how much gate structure the cutaway should retain.
5. Check only the changed contact approaches, relevant fade boundaries/reversals, and both gate directions at native 1280 × 720 with the actual player.

Keep deferred interior/framing/footprint/save work separately scoped. Retain v5 and the current evidence before another art pass.
