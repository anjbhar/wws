# Starter map review — Dojo Courtyard

Reviewed October 22, 2026, against the current working files, including the existing uncommitted changes. Coordinates below are zero-based tiles.

The courtyard works as a combat testing space, but its opening presentation does not clearly teach the player what to do. The most concrete map defect is the unresponsive left door. The biggest design problems are the attention directed toward unavailable destinations, inconsistent encounter entry, and the absence of a visible practice progression.

## Evidence and limits

- Fresh 1280 × 720 RPG Maker MZ render: [initial.png](initial.png).
- Fresh engine position, collision graph, interaction probes, and load diagnostics: [engine-review.json](engine-review.json).
- Close-up diagnostic views: [contact-sheet.png](contact-sheet.png). These were captured by positioning the player on engine-confirmed reachable cells; they are not evidence of keyboard traversal.
- Reviewed current Map001, System, Actors, Tilesets, troop/event data, opening and battle plugins, and project documentation.
- The engine found **194 connected reachable tiles**. All three practice NPCs have reachable approaches on all four sides. No JavaScript errors or failed asset requests were recorded in this fresh session.
- Samurai, Shinsengumi, monk-group, and companion checks passed. These include interpreter/mechanics checks, not a fresh human playthrough of every combat outcome. Music quality, every walking animation frame, all legacy saves, and every possible occlusion position were not assessed here.
- The findings below distinguish confirmed implementation problems from visual judgments and choices that are acceptable for a deliberately limited prototype.

## Confirmed problems and interaction inconsistencies

### 1. The left dojo door does not respond — high priority

The double doorway visually occupies columns 11–12. At (11,4), facing north and invoking the normal action-event lookup finds no event. At (12,4), it finds event 5 and can display the closed-dojo message. The left-door event is absent from the current map. Both sides are blocked by the building, so one side appears broken rather than intentionally closed.

**Fix:** make both visible door leaves display the same response. Validate interaction from both columns, not just the surviving event.

### 2. The monk bypasses the encounter confirmation used elsewhere — high priority

Masanori and Shinsengumi offer “Spar / Not now.” The unmasked monk at (10,9), event 12, goes from greeting directly to party recovery and troop 8. There is no choice command before combat. Players can leave from the opening form selection, but they must first transition into battle.

**Fix:** give the monk a clear group-practice offer and the same decline/cancel behavior as the other fighters.

### 3. The exit is an invisible action-only barrier — medium priority

The southern opening and stepping stones advertise a walkable route. Cells (11–13,14) contain invisible, solid events with action-button triggers. Walking south from row 13 simply stops the player; explaining the boundary requires pressing interact. It is possible to interpret this as bad collision before discovering the explanation.

**Fix:** communicate the boundary visibly or provide feedback on contact. Keeping the road unavailable is a valid prototype decision; the presentation should establish that limit.

### 4. Group practice changes the cast without an overworld setup — medium priority

One monk is visible on the map; the battle contains three monks. Masanori and Shinsengumi become temporary controllable allies without needing to speak to them first. The plugin supplies these guests correctly and restores the original party afterward. The issue is scene continuity: “alongside your companions” assumes a relationship the map has not established.

**Fix:** explain the six-person exercise before entry, including who joins the player. The map does not need six standing NPCs if dialogue establishes the arrangement.

### 5. Group-practice cancellation has no closing response — low priority

The monk's victory branch has acknowledgement, while escape and defeat branches only recover the party. The two duel NPCs have outcome dialogue. Returning silently after a more elaborate team encounter is inconsistent.

**Fix:** add a brief dismissal or contextual response after leaving practice.

## Opening experience and gameplay design

### 6. The player initially faces the wrong activity — high priority

The current spawn is (12,6), facing north toward the closed dojo. Masanori is at (12,9), the monk at (10,9), and Shinsengumi at (16,10): all lie behind the initial facing direction. The composition directs attention to a destination that cannot be entered.

**Improve:** choose a first intended interaction, then align spawn, facing, and its visual cue around that interaction. Preserve the readable open center.

### 7. There is no immediate instruction or objective — high priority

No current map event provides an arrival introduction, control reminder, or first practice objective. The player must infer both that the NPCs are interactive and which one to approach. The project guide explains controls, but the courtyard itself does not.

**Improve:** use a short contextual welcome, an unobtrusive objective, or a nearby instructor prompt. Include the interaction control and a clear first step.

### 8. There is no visible ordering of practice activities — medium priority

The map offers two duels and a more complex three-on-three battle without marking introductory versus advanced practice. A newcomer can discover the group exercise before understanding a single fighter's forms, cuts, and target selection.

**Improve:** recommend an initial duel, then introduce the other duel and team exercise. This can remain optional rather than hard-gated.

### 9. The closed dojo receives the strongest destination treatment — medium priority

It occupies the main axis, has a distinct roof, front steps, and a reachable deck. The only payoff is a closure message. A closed building is intentional here, but its prominence gives it more implied function than it has.

**Improve:** give the facade a useful training-related function or communicate its closure before the player climbs the steps.

### 10. Training props suggest functions they do not have — medium priority

The straw dummy, sword rack, and basin have no interaction events. These are particularly strong affordances in a practice area: trying a basic cut, inspecting equipment, or resting would be natural expectations. Ordinary decorative lanterns and bamboo do not need interaction.

**Improve:** give selected training props useful responses or gameplay. Avoid adding interactions merely to fill space.

### 11. Repeated practice has no persistent acknowledgement — medium priority

The current map events have single unconditional pages and do not record first conversation, victories, lessons completed, or team-practice completion. Repeating a duel repeats the same invitation. There is no map-level indication of learning or completion.

**Improve:** add a small practice checklist or contextual instructor dialogue. EXP and item rewards are unnecessary for a training prototype.

### 12. Invulnerability does not by itself teach improvement — design decision

The practice plugin prevents allies falling below 1 HP. This is a deliberate, tested rule, but the invitation does not explain it. A player can keep taking hits without a clear failure or restart condition. The map's generic post-fight lines do not assess performance.

**Improve:** explain safe practice and offer a readable measure of improvement, such as rounds taken or successful defenses. Confirm the intended learning goal before changing combat balance.

### 13. The NPCs do not clearly advertise distinct teaching roles — medium priority

Both duel invitations are broadly about testing swordsmanship. The monk introduces companions but does not offer a pre-battle summary of the extra control burden. Different costumes distinguish characters visually, but do not explain why to choose each encounter.

**Improve:** let each invitation identify its lesson or exercise. Difficulty should be communicated from actual tuning, not inferred from costume or placement.

## Visual and spatial design judgments

### 14. The dirt area looks like a placed rounded rectangle

Its near-perfect bilateral symmetry, long straight edges, and fairly even border make it read as a designed patch laid on a lawn. That is less convincing as ground worn by repeated footwork.

**Improve:** introduce restrained asymmetry and concentrated wear at working positions and approaches. Keep the terrain quiet enough to read fighters clearly.

### 15. The visual approach is disconnected

The southern slabs cross grass, enter the dirt patch, and stop near its lower portion. There is no corresponding worn approach from the northern edge of the practice area to the dojo steps. This weakens the sense that the yard is regularly used as a connected place.

**Improve:** establish the intended foot traffic with subtle wear. A fully paved central path is unnecessary.

### 16. The enclosure competes strongly with the small hall

Long cream/red wall bands and the foreground tiled roof form a high-contrast frame around a relatively small building. This is a hierarchy judgment, not a broken asset: the border receives a great deal of attention for scenery with little interaction.

**Improve:** quiet repetitive wall contrast before increasing the hall or adding more decoration.

### 17. The hall has very little headroom in the viewport

The roof ornaments reach the top crop while the southern gate almost reaches the bottom. With a 15-row map filling the 720px height, the composition has little breathing room or surrounding context.

**Improve:** review framing at the actual initial camera, especially the roof silhouette. Extra map height would require a deliberate camera/layout decision.

### 18. The side roofs and frontal walls imply different depths

The side roofs form deep diagonal bands while the north/south caps read as shallow frontal strips. The v7 enclosure is substantially more coherent than the earlier archived reviews, but the return corners still draw attention to the change in projection.

**Improve:** inspect shared eave, post, and ground anchors at all four corners. Do not assume every issue in older v6 reviews still applies to this version.

### 19. The foreground roof heavily obscures gate traversal

At (12,12), most of the player's body is hidden by the roof; at (12,13), the head remains under it. This is plausible overhead sorting, not confirmed reversed depth. However, it makes a very short passage harder to follow and compounds the unexplained barrier immediately beyond it.

**Improve:** consider a restrained occlusion treatment or clearer gate/exit feedback. See the two gate close-ups.

### 20. Slabs read as repeated stamps

The same pale shape repeats at a regular one-tile interval. Some are largely covered by the foreground roof, so the route appears as separated fragments in the initial view.

**Improve:** use small wear/shape variations and judge the sequence with the roof visible, without adding a busy trail.

### 21. The veranda's visible width exceeds its elevation treatment

The deck extends beyond the center five columns. The opening plugin adds its six-pixel elevation offset only for real X positions 10–14 around row 4. Most of the deck is covered, but its outer visible strips do not share that treatment. The captured left-door view also places the character over the front edge rather than demonstrating a distinct stair ascent.

**Improve:** check foot contact across the whole rendered deck and choose consistent visual bounds. This is a polish concern; no traversal trap was found.

### 22. Prop treatments vary noticeably at native scale

The rack has thin, bright sword silhouettes; the dummy has dense straw detail; the basin is a very shallow small object; the lantern has a large, dark outlined cap. They are individually readable, but their line weight, detail density, and apparent scale do not feel fully unified.

**Improve:** compare them beside the current player at 1× and align their pixel density and physical proportions. Do not resize every prop to the same height.

### 23. Bamboo silhouettes are repeated prominently

The two large plants reuse the same recognizable clump with a vertical placement offset. Their size makes the repetition more obvious than repeated wall tiles.

**Improve:** a modest silhouette variant would help if environmental polish is the next goal. This is low priority compared with guidance and interactions.

### 24. Screen-width framing leaves black side strips

The map is 1200px wide in a 1280px viewport, leaving approximately 40px on each side. This is documented and intentional, but remains visible as an unfinished frame if a full-width presentation is intended.

**Improve:** explicitly accept the framed presentation or design additional width. Stretching pixels would undermine the artwork.

## Maintenance and validation problems

### 25. The grass regression check compares against an obsolete whole map

`check-courtyard-grass.cjs` fails before its directional passage comparison because it requires current non-tile map data to equal an older grass backup. Music settings, events, and character versions have legitimately changed. Its failure currently prevents the advertised passage check from running.

**Fix:** test terrain-specific invariants against an appropriate baseline and validate current events separately. The fresh engine collision graph is evidence of current connectivity, not proof that every historical directional flag is unchanged.

### 26. The main v7 verifier cannot reach its browser checks

`verify-courtyard-v7.cjs` immediately fails because the current Masanori event uses `$SamuraiInstructor-v3` while its historical snapshot uses v2. It also still expects spawn (12,11), whereas the current start is (12,6). The documented final `courtyard-v7-checks/results.json` is absent.

**Fix:** update assertions to intentional current behavior, then complete the keyboard route/interaction and overlap pass. Do not cite the old verifier as a current end-to-end success.

### 27. The project guide contradicts the current map

`PROJECT_GUIDE.md` retains instructions for entering Map002, a 25×19 courtyard, an older spawn, two overworld monks, and a two-opponent group fight. Its newer notes partially override these sections, leaving the reader to reconcile incompatible instructions. Current reality is a 25×15 courtyard, no interior map, spawn (12,6), one visible monk, and three-on-three practice. The surviving door event also retains the name “Enter home — right door” although it no longer transfers anywhere.

**Fix:** rewrite the active guide around the current version and move superseded behavior to history. Rename misleading events so future edits target the right behavior.

### 28. The player still uses a stock menu portrait

Actor 1 is Hayato with the custom samurai walking sheet, but retains `faceName: Actor1`, index 0, and the stock `Actor1_1` battler field. The custom combat presentation avoids some of these stock fields, but the face assignment can surface in normal menu UI.

**Fix:** check menu/stock fallback presentation and replace or intentionally suppress inconsistent character identity assets. This audit confirmed the database assignment; it did not capture every menu screen.

## Suggested correction order

1. Restore the left-door response and add the monk's encounter confirmation.
2. Align the first view with a clear introductory interaction; state controls, safe-practice rules, and recommended exercise order.
3. Resolve the gate's visual promise and boundary feedback.
4. Add lightweight training progression and meaningful responses for selected training props.
5. Repair current verification and consolidate the guide.
6. Refine terrain wear, architectural framing, threshold contact, prop consistency, and repeated silhouettes.

Keep the open training space, readable fighters, connected navigation, optional repeatable practice, and existing party recovery. No map, event, combat, or asset fixes were applied during this review.
