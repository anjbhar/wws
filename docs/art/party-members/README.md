# Playable practice companions — October 22, 2026

Shinsengumi's approved **v2** rear set is now active for all six forms. Every
pose carries the white 誠 back emblem and a loose outer haori without the
incorrect blue waist tie. Chudan was approved first; its final pixels are
preserved exactly. The other five poses were edited separately with built-in
`image_gen`, using that approved Chudan as the costume reference.
[Corrected pose sheet](shinsengumi-poses-preview-v2.png) ·
[Correction prompts](shinsengumi-prompts-v2.json) ·
[Chudan correction prompt](chudan-prompt-v2.json) ·
[Current export measurements](shinsengumi-export-v2.json).

Masanori and Shinsengumi Swordsman join Hayato only in the monk test battle.
Talk to the unmasked monk in the courtyard. Restart an active playtest to load
the updated code and artwork; recruitment and the starting party are unchanged.

## Artwork

Built-in `image_gen` produced each of the 11 source images separately. Each
character's Chudan references Hayato's rear battle art for style/camera and the
existing enemy illustration for identity. Remaining forms reference that new
Chudan plus the corresponding Hayato pose; Seigan also references the enemy's
Seigan. [Exact prompts and source provenance](generation-prompts.json) are retained.

All final PNGs live in `img/battlers/`:

- `SamuraiInstructor-{Chudan,Jodan,Gedan,Kasumi,Waki}Back-v1.png`
- `Shinsengumi-{Chudan,Jodan,Gedan,Kasumi,Waki,Seigan}Back-v2.png`

The previous Shinsengumi v1 files and generation records remain historical.

Exports are 480 × 384 RGBA with genuine transparency, rear three-quarter
orientation facing upper-right, foot axis x=240 and sole baseline y=368.
Standing body height is 280px; Kasumi crouches to 260px, matching Hayato's
existing layout rules. Uniform nearest-neighbor resampling preserves proportions.
Calibrated crown landmarks prevent raised blades from shrinking the body.
Alpha values below 64 are cleared to remove faint generator noise; complete
weapons remain inside at least four pixels of transparent canvas margin.

[Pose contact sheet](poses-preview-v1.png) · [Per-pose measurements](export-v1.json)

Re-export with a Python installation containing Pillow and NumPy:

```powershell
python docs/art/party-members/export-poses.py
python docs/art/party-members/export-shinsengumi-v2.py
```

## Combat checks

`check-practice-companions.cjs` verifies distinct actors, active version selection,
the 11 current PNG dimensions,
RGBA, canvas clearance and baseline, exclusive playable Seigan, independent
previews, actor-originated Three Stage Thrust ending on hit/parry/dodge branches,
Heavy Cut recovery and saved-party isolation. `check-team-battle.cjs` completes
80 seeded team fights; the original duel, feedback, monk, opening, sprite-size,
Masanori and Shinsengumi checks cover regressions.

`preview-team-battle.cjs` loads the actual renderer, previews all 10 selectable companion poses,
checks reaction sprites, captures the five-card Seigan opening (replacing Chudan), completes the
six-fighter encounter and confirms victory/escape restore Hayato alone.
Results: [renderer report](../../battles/monk-group/team-battle-check.json),
[Seigan opening](../../battles/monk-group/party-seigan-opening.png),
[team battle](../../battles/monk-group/team-battle-3v3.png).
