# Courtyard v7 — implementation and evidence

The revised map remains 25 × 15 cells at 48px, with one open training yard. The 1200 × 720 map is deliberately centered in the 1280 × 720 viewport with 40px black side margins. A narrow northern earthen margin and a southern arrival apron define this bounded practice scene. No interior or road map exists; the door and southern boundary give truthful closed-scope messages without an unlock promise.

## Preservation and backup

`backups/before-courtyard-v7/` holds the pre-edit data directory (including Map001, Tilesets, System and MapInfos), all tilesheets and character sheets, all plugin sources/configuration, the full-map preview, initial engine screenshot and v6 contact sheets. No previous source or prompt was overwritten. New art and scripts use v7 names. Original dojo, straight-wall and bamboo source pixels in `EdoRedWoodExterior_D-v4.png` are unchanged; every character sheet and both complete swordsman event records are compared against this backup. Combat plugins and audio were not edited.

The original 288 × 192 hall is translated 24px to x=456, preserving its scale and pixels, so its center, gate, slabs and spawn share x=600. The hall extends forward of the lower rear wall. No facade pieces are duplicated. Original straight-wall timber/plaster faces are retained in the northern run beneath the continuous new cap.

## Architecture, entrance and placement

The accepted enclosure was generated as one complete assembly, including all four corners and both gate abutments. Its entire roof/body is uniformly scaled once to 1200 × 630 and placed with its bottom at y=672. Roof, ridge, eave, supports and footing are never resized independently. The generated corner-return attempt is archived as rejected because it retained the heavy projection. No mirroring is used. All artwork uses upper-left lighting.

The south wall occupies about 96px rather than 144px. Its gate cap continues the wall ridge/eave, with one jamb on each side. The original hall remains the tallest landmark. A low generated veranda connects at y=192; the player's six-pixel rise is interpolated during real movement onto its walking row, including both wings. Four low slabs have restrained uniform-scale variation. The apron has no slab cut by the bottom crop. New games start at (12,11), facing north, just inside the gate with both fighters ahead.

The retained rack source is uniformly reduced to at most 58px tall. A new broad straw dummy and compact basin with a distinct dipper replace the prior exports. One rack, one dummy, one basin, one lantern, one wall-base planting cluster and the existing bamboo remain at the edges. Props are inset sufficiently to permit both side approaches, and the bamboo approaches remain clear. Ground artwork is unchanged after inspection of the large repeat; its forced equal edge has zero one-pixel boundary gradient, which does not by itself establish a natural texture join.

Collision blocks side-wall base columns, rear-wall bases, hall body, foreground wall body and prop base cells. Roof widths and transparent upper prop rows are overhead rather than solid rectangular footprints. Gate opening cells are passable; three boundary events close its scope. Grid collision necessarily overestimates the narrowest feet within their 48px cells.

## Generated/replaced assets and provenance

Accepted built-in image_gen sources: `../art/courtyard-v7/sources/enclosure.png`, `dummy.png`, `basin.png`. Rejected attempt: `rejected-returns.png`. Exact prompts are in `generation-prompts.json` and `basin-prompt.txt`. Prior rack/slab/veranda/lantern/planting sources remain in the v6 and courtyard-finish folders. `export.json` records atlas cells and shared anchors. New sheets: `EdoCourtyard_B-v7.png`, reserved C sheet, and `EdoCourtyard_E-v7.png`; retained A5-v2 ground and D-v4 art. `architecture.png` and individual prop exports remain alongside their sources. Alpha thresholding removes translucent generation halos; nearest-neighbor, uniform scaling and tile packing are deterministic export operations.

Rebuild: bundled Python with Pillow/numpy → `tools/export-courtyard-v7.py`; Node → `tools/refine-courtyard-v7.cjs`; Python → `tools/render-starter-map.py`. The placement script requires the backup and asserts complete fighter-event equality before saving. `WWS_CourtyardOpening.js` contains only arrival direction, veranda contact and versioned save recovery.

## Verification record

Static/combat/audio checks passed in `courtyard-v7-checks/regressions.json`: samurai event branches/reachability, complete Shinsengumi sparring, duel mechanics, all opening-form combinations, combat feedback, stance sprite sizes, music selection/restoration and decoded native MP3 looping. The audio renderer measured zero source seam error and approximately 3.58e-8 playback-loop error. `asset-results.json` records original artwork, atlas and quiet-ground checks.

Actual initial view: `courtyard-in-game.png` (1280 × 720). Layout preview: `Map001-preview.png`. The engine verifier uses keyboard input for routes and actions; screenshot arrival waits for completed movement and agreement between the player and rendered sprite over known frames. Review targets must belong to the connected navigation graph. Facing changes are diagnostic operations, not counted as movement. Inaccessible exterior/rear-wall cells are explicitly excluded from playable evidence. Static rendering is used for layout, never as proof of MZ sorting.

The first route run completed both fighter decline interactions, the closed door, veranda wings and the west dojo approach, then timed out. A later recorder uses one physical keypress per cell with arrival assertions and progress logging. The final route/capture result must be checked in `courtyard-v7-checks/results.json`; absence of that file means the movement/overlap pass remains incomplete. Contact sheets are generated by `tools/review-courtyard-v7.py` from actual engine PNGs. Automated passes are not visual approval.

## Saved-game decision and limits

Pre-v7 saves on Map001 reload current geometry. Reachable saved positions (including legacy (12,12)) are retained; blocked/out-of-range positions are moved to the closest connected courtyard cell while preserving facing, party, switches and variables. This resets the active map interpreter and map-event runtime positions to the current map, so saving mid-conversation resumes in the courtyard rather than continuing the obsolete interpreter. Source save files are never edited. The engine verifier tests legacy (12,12), old 19-row positions and a blocked hall position, and reads the local save coordinates without publishing its contents.

Remaining deliberate limits: no interior or onward road, identical retained bamboo silhouettes, grid-sized collision, and the chosen 40px side margins. The new enclosure source has a slight perspective taper along the long returns; it has not been independently stretched to hide that source characteristic. Review actual corner, gate, threshold and overlap contact sheets before treating the visual pass as complete.
