# Warrior monk group practice

October 22, 2026. Talking to the unmasked monk starts a real three-on-three
practice battle in troop 8. Hayato occupies the ally center, with two temporary
copies named Hayato B and Hayato C on the flanks. Each clone copies his level,
class, equipment, skills, and stat bonuses, with independent health and combat
state. The three opponents are:
two masked monks in the back rank and the unmasked monk forward in the center.
Courtyard event 12 at (10,9) uses the unmasked walking sheet. The masked monk
appears only in battle; his former overworld event 11 has been removed.
The unmasked monk recovers the party before and after practice.
Winning displays a short acknowledgement. Leaving is always allowed, and
practice cannot kill any ally or award rewards. Clones are supplied only for
this battle and disappear after victory, leaving, or defeat. The saved party
and overworld followers retain the original main character.

Enemy 8 uses `WarriorMonk-Masked-v2`; enemy 9 uses
`WarriorMonk-Unmasked-v2`. Group battle artwork renders at 74% of its usual size.
Fixed triangular formations reserve three slots on each side and leave an open
center. Opponents stand just behind their opposite allies and a little closer
to the center of the screen. Their full artwork clears the stacked health bars,
while allies retain a slight foreground offset. The enemy center slot holds the unmasked monk; each masked monk has
a rear slot. Depth ordering draws the front rank over the rear rank.
Compact status rows sit on each side of the HUD, showing names, health,
stances, injuries, and recovery. The center uses the single duel's small
round/turn display; there is no enlarged portrait or fighter detail panel.
A ground ring identifies the chosen target. Single-opponent duels retain their
existing presentation. Each of the six fighters gets one scheduled turn per
round. The command panel and turn banner identify the ally currently controlled.
Each of the three monks has 280 Health, independent form/injury state, and a scheduled turn.
Their static illustrations remain fixed while the HUD identifies logical forms.

The new opponent picker appears between cut selection and body selection.
Cancelling backs out without a turn cost. Each flank can target its opposite
flank and the opposing center; the center can target all three opponents.
The menu, damage previews, final action validation, and enemy AI share these
rules. When only one legal opponent remains, body selection targets that
opponent directly. Defeated and blocked fighters are skipped, with fixed lanes
retained after knockouts. If neither side can reach an opponent, the fight ends
in a draw rather than allowing an attack across lanes.
Victory requires all three opponents to fall. The introduction explains these rules
before a free opening stance choice for each ally.

Implementation: `WWS_Duel` v1.21, group-aware `WWS_DuelTargets`, enemies 8/9,
troop 8 and the unmasked monk's map event list. `WWS_DuelFeedback` identifies each
ally's turn. `tools/add-monk-group-battle.cjs` rebuilds the data
idempotently; `tools/place-warrior-monks.cjs` preserves assigned interactions.
Pre-change files are retained in `backups/before-monk-group/`.

`node tools/check-team-battle.cjs` checks the actual temporary party, all six
fighters' lane restrictions, independent forms and action subjects, invalid
target rejection, enemy attacks against the clones, skipped dead/blocked
fighters, draw handling, protection, and party restoration. It also completes
80 seeded three-on-three battles through the real MZ combat interpreter.

Run `node tools/check-monk-group.cjs` for actual MZ event interpreter branch
checks, independent forms/initiative, all three enemy target indices, free
cancellation, no friendly fire, dead-turn skipping, protected Health, cleanup,
and 60 seeded complete fights. Existing duel, opening, feedback, sprite sizing,
Masanori and Lightless Blade checks cover the original single-opponent fights.

`node tools/preview-team-battle.cjs` uses the real renderer and command-window
handlers with a self-contained local HTTP server. It starts the actual monk
event, confirms three individual opening forms, verifies center/flank target
menus, completes a six-fighter battle, checks party restoration, and leaves a
second encounter. The earlier `preview-team-formation.cjs` and
`preview-monk-group.cjs` commands delegate to this current encounter check.
Results and screenshots are in `monk-group/`:
[browser results](monk-group/team-battle-check.json),
[center selection](monk-group/team-battle-3v3.png),
[flank selection](monk-group/team-battle-flank-targets.png), and
[body selection](monk-group/team-battle-body-targets.png).
