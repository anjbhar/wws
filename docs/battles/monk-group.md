# Warrior monk group practice

October 23, 2026. Talking to the unmasked monk starts a real three-on-three
practice battle in troop 8. Hayato occupies the ally center, with temporary
Masanori and Shinsengumi Swordsman guests on the flanks. Each uses a distinct
actor record, walking sprite, rear battle pose set and independent health/combat
state. Both guests match Hayato's level and use the starting samurai class and
equipment for this test; enemy boss Health is not copied. The three opponents are:
two masked monks in the back rank and the unmasked monk forward in the center.
Courtyard event 12 at (10,9) uses the unmasked walking sheet. The masked monk
appears only in battle; his former overworld event 11 has been removed.
The unmasked monk greets the player before combat: "A steady mind is as important
as a steady blade. Come, let us see how you fight alongside your companions."
He then recovers the party before practice and again afterward.
Winning displays a short acknowledgement. Leaving is always allowed, and
practice cannot kill any ally or award rewards. Guests are supplied only for
this battle and disappear after victory, leaving, or defeat. The saved party
and overworld followers retain the original main character.

With an existing active team, the encounter uses those actors instead of adding
guests. The shared active limit is three; further roster actors remain reserves.
Saved Center/Left/Right assignments and the solo encounter policy are described
in [party foundation](party-foundation.md).

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
Cancelling backs out without a turn cost. While both teams have three living fighters, each
friendly flank can target its opposite flank and the opposing center; the center
can target all three opponents. Once either team has fewer than three living fighters,
every fighter on both sides can target any surviving opponent. The menu, damage previews, final action validation
and enemy AI share these rules. When only one legal
opponent remains, body selection targets that opponent directly. Defeated and
blocked fighters are skipped.
Victory requires all three opponents to fall. The introduction explains these rules
before a free opening stance choice for each ally.

Masanori has five standard forms. Shinsengumi has Seigan in place of Chudan, selectable
at the free opening and on later paid stance changes. In Seigan, a parried cut
triggers his existing Three Stage Thrust follow-ups against the same legal target.
Enemy tutorial and half-Health speeches remain specific to sparring opponents.
All 11 new rear poses are transparent 480 × 384 PNGs, aligned to a shared sole
baseline at y=368 and matched to Hayato's body scale. Kasumi/Waki also supply
automatic Parry/Dodge reactions. See [art, prompts and export records](../art/party-members/README.md).

Implementation: `WWS_Duel` v1.23, group-aware `WWS_DuelTargets`, enemies 8/9,
troop 8 and the unmasked monk's map event list. `WWS_DuelFeedback` identifies each
ally's turn. `tools/add-monk-group-battle.cjs` rebuilds the data
idempotently; `tools/place-warrior-monks.cjs` preserves assigned interactions.
`tools/add-practice-companions.cjs` creates or refreshes the two guest actor
records without changing the saved starting party.
Pre-change files are retained in `backups/before-monk-group/`.

`node tools/check-team-battle.cjs` checks the actual temporary party, all six
fighters' lane restrictions, independent forms and action subjects, invalid
target rejection, enemy attacks against the guests, skipped dead/blocked
fighters, unrestricted targeting on both sides after knockouts, protection, and party restoration. It also completes
80 seeded three-on-three battles through the real MZ combat interpreter.
`node tools/check-practice-companions.cjs` covers distinct guests, playable
Seigan, player-originated Three Stage Thrust branches, preview isolation, all
11 exports and saved-party isolation. The renderer check previews all 10 selectable companion poses,
checks both automatic reactions, confirms Seigan, completes a full battle,
and returns to Hayato alone after victory and leaving.

Run `node tools/check-monk-group.cjs` for actual MZ event interpreter branch
checks, independent forms/initiative, all three enemy target indices, free
cancellation, no friendly fire, dead-turn skipping, protected Health, cleanup,
and 60 seeded complete fights. Existing duel, opening, feedback, sprite sizing,
Masanori and Three Stage Thrust checks cover the original single-opponent fights.

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
