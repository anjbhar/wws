# Built-in image_gen refinement prompts

Initial architecture, ground, and prop prompts are in `generation-prompts.json`. All generated sources are retained. First architecture/terrain attempts are retained as `architecture-first.png` and `terrain-first.png`; final sources use `-source.png`. No CLI/API fallback was used.

## Veranda

Refine this small pixel art wooden dojo veranda. Transparent background. Preserve exact 336x48 canvas, native footprint x24..312, deck rear at y0 and bottom ground contacts at y39; no scale increase. Upper-left light and red-brown wood matching reference. Simplify board lines and establish coherent sill, solid front fascia, exactly four evenly placed short support posts on small stone pads, two outer supports and two beside central stair. Centered 84px-wide short two-tread stair, rear meets deck top with no gap, base at y40. Stair and deck share one construction. Calm outlines, grouped pixels, subtle contact shading, no added props.

## Final terrain

Refine ONLY ground in this 1200x720 RPG terrain image. Main correction: remove 85 percent of tiny bright grass speckles and remove most discrete dark tufts, leaving very quiet softly mottled broad green areas. Sparse grouped detail only, muted olive spring green. Reduce tan training ground footprint to x366..834 y272..546 in 1200x720 coordinate system; keep axis x600 but irregular asymmetric shallow edges. Natural worn tan soil with uneven turf intrusions, grouped 8..24px transition widths. Faint broken foot traffic from (600,230) to patch, patch to (600,666), west towards (120,380) and (120,520), tiny wear at (1080,522) and (1080,426). No objects, stones, characters, buildings, ground circles. Preserve flat pixel art style and broad subtle variation; no noise across every pixel. Keep open training space and sparse composition.

## Final perimeter finish

Edit only the perimeter enclosure finish in this transparent RPG architecture image. Preserve EXACT canvas, layout, all construction, roof geometry, gate jambs and supports, all four corners, transparent holes. Keep central dojo completely unchanged; it must remain richest brightest red focal architecture. Reduce contrast and saturation of ALL boundary walls, front gate and side returns: wood should be muted medium brown weathered red, plaster darker gray-beige rather than bright cream, roof softer mid charcoal with subdued tile highlights. Simplify repeated tiny roof lines. Keep perimeter outlines softer and less black, reduce contrast by roughly one third. No geometry changes, no extra fragments, no ground, no veranda, no new objects. Only central hall retains original strong red cream and black palette. Transparent background.

## Export

Whole-canvas enclosure reduction and ground registration, uniform individual prop reduction, alpha threshold, native tile packing, and intact original hall restoration are deterministic export operations in `tools/export-courtyard-v8.py`. No facade stretching, duplicated facade pieces, or stacked roof repairs. The regenerated central hall is discarded and replaced by the original 288x192 artwork.
