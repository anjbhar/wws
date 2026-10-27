# WWS Combat Design — Turn-Based Duel

Revised October 23, 2026. Implemented in `js/plugins/WWS_Duel.js` v1.23 with explicit solo/party encounters, three saved active positions, free opening stance choices, paid later stance changes, and a 1 Health floor for every practice ally. Fighters use automatic stat-based defenses with body-area stance coverage. Parry and block are the same weapon defense. Values remain provisional game balance, not a claim about historical combat effectiveness.

The [original outline](battles/original-combat-outline.txt) is preserved for reference. This design reflects later feedback and takes precedence over the outline's timed decisions and reaction prompts.

## Shinsengumi sparring — October 21

The Shinsengumi swordsman is a repeatable solo sparring partner. Enemy/troop 7 has 1000 Health versus Masanori's 540, with matching Attack, Defense and Speed. His six forms include Seigan and its Three Stage Thrust follow-ups; his half-Health dialogue preserves his turn and form. His event offers Spar / Not now, restores Health/MP before and after practice, and awards no EXP, gold or drops. Masanori remains available. Troop tags `[WWS Duel] [WWS Courtyard]` enable this practice encounter and its backdrop.

## Party and encounter boundaries

The engine and custom combat both allow three active actors; further roster members are reserves. Saved actor IDs assign Center, Left and Right independently of incidental roster ordering. The stock Formation command deliberately swaps assignments or replaces an active actor with a reserve, and menu/battle labels expose the positions. Legacy saves initialize from their first three roster entries. Empty slots compact when actors leave. See [party integration contract](battles/party-foundation.md).

Troop 6 and `[WWS Duel]` encounters are solo unless also marked `[WWS Party]` or the existing `[WWS Monk Group]`. Solo encounters select Hayato from the roster, including reserves, or the active leader if Hayato is absent. Benched actors receive no battle-start/end callbacks or combat actions. `[WWS Party]` also enables custom combat by itself. Custom battles accept one to three allies and one to three enemies; untagged battles retain stock mechanics with the same three-active limit.

## Three-on-three practice — warrior monks

The unmasked monk at (10,9), event 12, starts troop 8: two masked monks on the flanks and one unmasked monk in the center. Hayato alone receives temporary Masanori and Shinsengumi guests; an existing active party fights with its own members. Every fighter has separate Health, form, injuries, recovery and one scheduled turn per round. The three monks have 280 Health each. Initiative sorts living fighters by effective Speed, with rotating tie priority.

Choose a cut, an opponent, then a body area. While both teams have three living fighters, flanks reach their opposite flank and center; centers reach everyone. When either team has fewer than three living fighters, both sides can target every surviving opponent. Single enemies occupy center; pairs occupy the flanks. The menus, previews, final validation and enemy AI share these rules. Cancelling target menus spends no turn; a single legal opponent skips the opponent picker.

All three opponents must fall to win. Every practice ally is protected at 1 Health; event exits recover the party and give no rewards. Guests are fresh battle-only instances and leave afterward. Static v2 monk art uses the group scale, while logical forms remain visible in the HUD. Group battles use body-area cards; supported solo battles use sprite markers.

Verification and screenshots: [group practice record](battles/monk-group.md).

## Core loop

1. Before round 1, the player chooses any opening form for free, including Chudan. The opponent independently selects one of the five forms with equal probability when the player confirms. Browsing is untimed and changes only the player sprite preview; neither fighter has a committed form or scheduled turn before confirmation. Cancelling this opening picker leaves sparring rather than skipping the required choice. Forms then persist across rounds.
2. After both opening forms are committed, calculate round-1 initiative from Speed + stance modifier. Later rounds also subtract previous recovery. Higher acts first; exact ties alternate priority each round. Clear recovery after calculating the order. Opening selection does not consume either fighter's first turn.
3. Each fighter uses one turn to either attack (Quick Cut or Heavy Cut) or change stance. Opening the form menu is free; confirming a different form consumes the scheduled turn, with no attack afterward.
4. For a cut, choose Head, Torso, Arms, or Legs as part of that same action. Resolve automatically using one defense roll. No second input when attacked.
5. Apply round-end conditions and begin the next round with the retained forms. A stance's defense/damage bonuses apply immediately; its Speed modifier affects next round's initiative. Changing form never reorders the current round.

Stance and action decisions wait indefinitely. There are no countdowns, reaction prompts, or timing bars. Short reveal/animation pauses are presentation only.

## Stances

| Form | Initiative | Cut damage | Passive defense | Special |
|---|---:|---:|---:|---|
| Chudan — middle guard | Normal | Normal | Normal | Balanced baseline. |
| Jodan — high guard | +3 | +15% | −10 percentage points | Aggressive cuts. |
| Gedan — low guard | −3 | −15% | +10 percentage points | Reliable defense. |
| Kasumi — raised side guard | −1 | −5% | Normal | Automatic Parry/Block gains +10 percentage points. |
| Waki — rear guard | +2 | −5% | −5 percentage points | Automatic Dodge gains +10 percentage points. |

All forms offer the same two attacks and four targets. Every form can automatically Parry/Block or Dodge on each incoming attack; no preparation or action cost is required. The opening selection is free once per battle; changing form on a scheduled turn afterward replaces your attack, including during round 1. There is no form progression.

Each form also has a Parry/Block coverage profile. Raised swords protect the upper body while opening the legs; Gedan trades head coverage for leg protection. These modifiers apply only to Parry/Block, using the **defender's committed form**, regardless of the attacker's form or either fighter's displayed reaction pose.

| Defender form | Head | Torso | Arms | Legs |
|---|---:|---:|---:|---:|
| Chudan | +45 | +55 | +50 | −2 |
| Jodan | +60 | 0 | −4 | −10 |
| Gedan | −12 | 0 | +45 | +55 |
| Kasumi | +48 | +45 | +52 | −16 |
| Waki | −6 | −3 | +53 | +60 |

Values are percentage-point adjustments on top of stats, general form bonuses, target difficulty, and injury/Heavy Cut modifiers. Guarded areas generally have 65–80% parry at starting stats. For equal stats and an uninjured defender facing a Quick Cut, Jodan parries the head at 77.5% and the legs at 2.5%; Gedan parries the head at 15.5% and the legs at 77.5%. Choose exposed areas to get around a guard. Dodge remains a separate Speed-based chance, subject to the total avoidance cap.

The NPC can use any of the same five forms. On 20% of turns it changes to a different form and forgoes its attack; otherwise it chooses Quick/Heavy Cut with these relative preferences: 2:1 in Chudan/Gedan, 10:7 in Jodan, 5:2 in Kasumi, and 7:4 in Waki. Preferred targets are torso for Chudan, head for Jodan, arms for Gedan/Kasumi, and legs for Waki. Player and NPC use identical form bonuses and automatic defense rules.

Both fighters show their selected form. Actor 1 uses rear three-quarter sprites in the lower-left foreground; Masanori faces them from upper-right. The stance menu has five cards. Arrow-key or mouse selection previews the player's matching pose before confirmation; the HUD labels this as Preview, while the actual stance and modifiers remain unchanged until confirmed. Both committed forms remain visible while browsing; the current player form cannot be reconfirmed to waste a turn.

An automatic Parry/Block temporarily shows Kasumi; Dodge shows Waki. The defense remains visually hidden during wind-up and is revealed at impact. The reaction pose lasts through the incoming attack, then the selected form returns. Reaction poses never change committed form bonuses. Exact files and production records are listed in [ASSETS.md](ASSETS.md).

## One action per turn

| Action | Effect | Cost |
|---|---|---|
| Opening form | Choose any form before round 1; NPC also chooses an opening form. | Free; preserves both first turns. |
| Change Stance | Confirm a different form; retained until changed again. | Uses the turn instead of attacking. |
| Quick Cut | Light attack; standard damage. | Uses the turn. |
| Heavy Cut | Double damage; easier to defend against; effective cutting level +1. | Uses the turn; next initiative −8. |

Guard, Block, Parry, and Dodge are not selectable moves. Parry/Block and Dodge are automatic outcomes when attacked, regardless of turn order. Both prevent all damage and injury; neither spends an action, adds recovery, grants a counter, or changes scheduled turns. Block is another name for Parry, not a separate roll or partial-damage outcome.

## Body-area targeting

Choose a cut first, then its target directly on Masanori's sprite. Head, Torso, Arms, and Legs appear in an aligned column beside the enemy, showing damage on a landed hit and the live chance to land the cut: `100% − Parry/Block chance − Dodge chance`, rounded to a whole percentage. Only the selected area is outlined and connected to its label. Damage uses the exact resolver formula for the chosen cut, attacker form, target area, stats and arm injuries; it is conditional on landing, not probability-weighted expected damage. Callouts update with the selected Quick/Heavy Cut, committed defender form, stats, and injuries; they disappear after confirmation or cancellation. Paired limbs share one percentage. Each stance has separate hit regions. Hover/click a body region or its label, or cycle with arrows and confirm with Enter. The bottom strip shows the selected target, a short injury effect, hit chance, and a secondary Parry/Block and Dodge breakdown. Target selection is untimed and spends no additional action. Escape/right-click returns to actions without rolling damage or adding recovery. The NPC uses the same combat rules automatically. Other enemy artwork and side-view battles retain target cards, which also show area-specific hit chances.

| Target | Damage multiplier | Base additional defense chance, before stance coverage | Injury penalty: Light / Medium / Heavy |
|---|---:|---:|---|
| Head | ×1.20 | +15 percentage points | Defense −5 / −10 / −15 percentage points. |
| Torso | ×1.00 | None | Next initiative −1 / −2 / −3 through recovery. |
| Arms | ×0.85 | +5 percentage points | Cut damage −10% / −20% / −30%. |
| Legs | ×0.85 | +5 percentage points | Initiative −2 / −4 / −6. |

Torso is the baseline damage option. Head offers more damage with a higher base defense modifier; arms and legs trade damage for weakening the opponent. Stance coverage can reverse which area is easiest to hit: legs are an opening against raised guards, while Gedan leaves the head more exposed.

## Resolution and recovery

Player and NPC use the same two stat-based chances:

- **Parry/Block:** `15% + 0.2 percentage points × (defender Defense − attacker Attack) + form Parry bonus + form coverage for attacked area + shared modifier`.
- **Dodge:** `5% + 0.2 percentage points × (defender Speed − attacker Speed) + form Dodge bonus + shared modifier`.

The shared modifier is half of the combined general form defense bonus, target-area bonus, Heavy Cut bonus (+15 percentage points), and head-injury penalty (−5 percentage points per severity level). General defense bonuses are split equally between the two outcomes. Parry is clamped to 1–80% and Dodge to 1–55%. If their sum exceeds 90%, reduce Dodge to fit while preserving Parry. Every attack retains at least a 10% chance to land. These are mutually exclusive probabilities, not sequential independent attempts.

One roll per committed attack selects Parry/Block, Dodge, or a normal hit. Either defense prevents all damage and wounds. A normal hit rolls wound severity only if the target survives. There is no additional passive-evasion, accuracy, critical, block, reflection, or counter roll. No defense roll occurs while browsing or cancelling targets.

Defense percentages appear only while targeting, calculated for the actual selected cut and body area. The compact top HUD shows Health, committed form (or player preview), active conditions, round, and initiative priority. Logs identify whether the target parried/blocked, dodged, or was hit.

Base damage is `max(1, 4 × Attack − 2 × Defense) × 5/3`, with stance, Heavy Cut (×2), body-area, and injured-arm modifiers, rounded once with a final minimum of 1. Recovery affects the next initiative calculation only, then clears. Heavy Cut and torso impacts share a recovery cap of 11. Leg injury modifies initiative separately. Neither penalty removes a turn.

## Wound severity and cutting level

Every undefended cut on a surviving opponent rolls once for Light, Medium, or Heavy severity. Automatic Parry/Block and Dodge prevent injuries. Killing blows do not need a wound roll.

| Effective cutting level | Light | Medium | Heavy |
|---|---:|---:|---:|
| 1 | 80% | 18% | 2% |
| 2 | 70% | 26% | 4% |
| 3 | 60% | 34% | 6% |
| 4 | 50% | 42% | 8% |
| 5 | 40% | 50% | 10% |

Weapons and enemy database notes can contain `<CuttingLevel: 1>` through `<CuttingLevel: 5>`. Default is 1; actors use the highest equipped weapon value. Heavy Cut adds one level, capped at 5. A separate cutting skill tree is deferred.

Track one injury per area. Repeated hits refresh its duration and retain the higher severity rather than accumulating penalties at that area. Different areas can be injured together. Injuries expire after two round ends, including the application round. Torso recovery is applied on impact rather than every round.

The HUD shows area, severity number (1/2/3 = Light/Medium/Heavy), and remaining round ends. Battle logs spell out the severity. These are temporary duel effects; Heavy does not sever or permanently immobilize limbs.

## Practice duel balance

October 20 tuning targets the level-1 player with starting equipment. Masanori matches player Attack and Defense, with slightly lower Health and Speed. Torso pacing is four landed Quick (light) Cuts or two landed Heavy Cuts to defeat Masanori in Chudan with no arm injury. Raw incoming damage has the same baseline, but the player's practice-only 1 Health floor now prevents defeat. Quick/Heavy describe attack power, separately from rolled Light/Medium/Heavy wound severity. Defense can prevent a hit; stance and injury damage modifiers can change the count.

| Stat | Starting player | Masanori |
|---|---:|---:|
| Health | 544 | 540 |
| Attack | 31 | 31 |
| Defense | 20 | 20 |
| Speed | 29 | 28 |

At these stats, uninjured Chudan cuts deal:

| Body area | Quick / light damage | Heavy damage |
|---|---:|---:|
| Head | 168 | 336 |
| Torso | 140 | 280 |
| Arms | 119 | 238 |
| Legs | 119 | 238 |

Three torso light hits deal 420, leaving both fighters alive; four deal 560 and defeat Masanori, but leave the player at 1 Health during practice. One torso heavy hit deals 280; two deal 560, with the same protection. Target selection displays damage after the selected form, cut, body area, and arm-injury modifiers. Parry coverage, defense rolls, wounds, and recovery remain active.

The following historical simulations predate the practice player's 1 Health floor. They describe underlying damage balance, not current practice win rates. They run the real BattleManager, Game_Action, initiative, defenses, and injuries, skipping only presentation pauses. In 2,000 duels per policy:

| Player policy | Player wins | Average rounds |
|---|---:|---:|
| Random forms and targets; 65% Quick / 35% Heavy | 53.1% | 4.5 |
| Chudan, Quick Cut to torso | 50.1% | 4.5 |
| Chudan, Heavy Cut to torso | 70.7% | 3.4 |
| Chudan, Quick Cut at highest expected direct damage | 53.2% | 4.5 |

All 8,000 duels finished without stalls. Mixed play remains close with a small player edge; repeated heavy torso cuts are stronger under the requested double-damage model. These are sampled policy results, not guaranteed human win rates. Stats are fixed for this starting matchup; there is no level scaling.

Run the current protected practice simulation with `node tools/simulate-practice-duel.cjs 2000`. Add `--candidates` to compare alternate Health values without changing database files. Protection means a player who keeps attacking can no longer lose; output identifies the 1 HP floor. The installer `tools/add-samurai-npc.cjs` uses the same stat set. Historical [four-hit balance results](battles/practice-balance-four-hit-2026-10-20.json) and [pre-four-hit results](battles/practice-balance-2026-10-20.json) are preserved.

## Health and Bleeding

During nonlethal practice, the player cannot fall below 1 Health or be defeated. Incoming damage, direct HP changes, and round-end HP effects respect this floor; damage popups show only the Health actually lost. Further hits at 1 Health deal zero HP damage but can still apply practice injuries. The player keeps their turn and can continue to win or leave sparring. Masanori has no floor and still loses at zero Health.

Protection applies only to the player in an active nonlethal custom duel and clears on exit. Stock battles, other actors, and controlled lethal duels retain normal damage and defeat. Masanori's event restores Health/MP after winning or leaving; its legacy loss-recovery branch remains as a fallback. All practice injuries clear on exit.

Bleeding remains limited to controlled test duels tagged `[WWS Duel] [Bleeding]`: Medium wounds bleed at two round ends, Heavy at three, including the application round. Light wounds do not bleed. Lose 5% maximum Health per tick. Reapplication refreshes duration without stacking damage or shortening existing Bleeding. Apply all ticks before checking the outcome.

Map-time wounds are deferred; controlled duel flags clear on exit. Do not enable Bleeding in released encounters until surviving wounds have map handling. Simultaneous defeat is a draw in sparring and a standard defeat in lethal combat.

## Interface and progression

Use dark ink panels, warm ivory text, muted vermilion selection accents, serif names/headings, and smaller sans-serif supporting text. The top has compact fighter panels with Health bars and form labels, plus a centered round indicator. Only active injuries (severity and remaining round ends), recovery, and Bleeding are listed; omit empty statuses, repeated pose names, and baseline defense diagnostics. The HUD redraws when displayed combat state changes.

One bottom strip contains the current choice: five forms with short coverage/stat summaries, two attacks with a single tradeoff line, or the selected body target with its effect and hit chance. Selected choices use a quiet filled background and thin accent rule instead of the stock blue cursor/frame. One short control hint appears in the strip header. During attacks, hide selection UI. WWS_DuelFeedback replaces the visible stock action log and duplicate stock popups with localized feedback. The fighters and courtyard remain the focus.

## Battle feedback

`WWS_DuelFeedback.js` loads after Duel and DuelTargets. It changes presentation only; probabilities, damage, wounds, scheduled turns, and the practice Health floor are unchanged. Feedback never consumes combat randomness.

- Quick Cut: subtle curved blade glint fading over 7 frames, light sword sound, 3-frame impact pause, and 6-pixel recoil.
- Heavy Cut: slightly larger tapered glint fading over 10 frames, lower-pitched heavier sword sound, 6-frame pause, 12-pixel recoil, and a larger damage number.
- Parry/Block: gold blade spark, metallic Parry sound, brief weapon recoil, and “Parried.”
- Dodge: short 34-pixel sidestep with slight lift, evasion sound, and “Dodged.” Both fighters return to their original ground anchors.
- Show one damage number near the struck area, using actual Health lost. Do not also show stock digits or “Miss.” Defense outcomes appear at impact rather than in the wind-up notice.
- Health bars ease toward actual Health with a briefly delayed pale trailing segment. Numerical Health remains exact immediately.
- New or more severe injuries get one short location/effect notice. Refreshing an existing injury at the same or lower severity does not repeat it. Persistent severity/duration stays in the compact HUD.
- Highlight the active fighter's top panel and briefly show “Your turn” or the opponent's turn above the fighter. Hold the player's choice strip for 22 presentation frames so the cue appears first; no action is selected or consumed automatically.
- On the first activation of the 1 Health floor per practice duel, show “Practice protection · You cannot fall below 1 HP.” Later hits do not repeat the message.

All animation pauses are presentation only. Next-action progression waits for the short impact/recoil sequence; decisions remain untimed. Effects stay local, with no full-screen shake or flash. Events, timers, bar animation, and one-time notifications reset on battle exit/new setup; stock battles retain their original logs, effects, sounds, and popups. Existing audio files are Sword1, Sword3, Parry, and Evasion1.

October 20 renderer previews: [Heavy impact](battles/feedback-heavy.jpg), [Parry](battles/feedback-parry.jpg), and [practice protection with injury feedback](battles/feedback-protection.jpg).

The hit slash was subsequently refined into a smaller ivory glint with curved, tapered ends and a faster fade; the red parallel stroke was removed. [Revised impact preview](battles/feedback-tapered-impact.jpg). Light and Heavy variants were checked in the battle renderer without browser warnings or errors.

Arrows/Enter or click choose; Cancel on targets returns to attacks; Cancel on forms or targets returns to actions for free; Cancel on actions leaves sparring. Targeting is implemented by WWS_DuelTargets after WWS_Duel. [Stance UI preview](battles/clean-ui-stance-preview.jpg) · [Targeting UI preview](battles/clean-ui-target-preview.jpg).

Use existing level, Attack, Defense, and Speed plus configurable cutting level. Movement, range, taunts, Composure/Momentum/Willpower meters, extra actions, counters, mortal wounds, permanent injuries, separate martial-art trees, and groups beyond two enemies remain deferred. Earlier timed-choice/reaction features remain superseded by the player's untimed one-action-per-turn requirement.

## Acceptance criteria

- Every duel opens with an untimed five-form picker before round 1. All forms, including Chudan, are enabled; the heading marks the choice as free.
- Opening previews do not commit stats, advance rounds, schedule actions, or apply damage/recovery. Confirmation commits both forms and computes initial initiative from them without spending either first turn.
- The opening picker cannot be skipped into an attack menu. Escape leaves a nonlethal spar; later form-menu cancellation returns to the current action for free.

- Quick Cut, Heavy Cut, and Change Stance are selectable on the player's normal turn. Confirming a different form consumes the turn without attacking; cancelling and browsing are free.
- Parry and block are one automatic weapon defense; Dodge is a separate automatic outcome.
- Defense affects Parry/Block chance; Speed affects Dodge chance; form and attack modifiers apply to both fighters.
- Each form has distinct Parry/Block chances for all four body areas at ordinary stats. Raised guards expose legs; low guard favors legs over head. Coverage does not directly alter Dodge.
- Target selection shows actual chances using the committed defender form, chosen area, and Quick/Heavy Cut; previews and reaction poses do not change coverage.
- Automatic defenses consume no action or recovery and require no input or timing interaction.
- Decisions never time out; each fighter gets one scheduled action per round.
- NPCs can choose the same actions, pay the same turn cost for stance changes, and use the same defense rules.
- Both fighters can select all five forms and receive the same bonuses. Forms persist across rounds; initiative is calculated once per round from the then-current forms.
- Stance-card previews change only artwork, never stats, initiative, defense chances, or the opponent's committed form.
- All five form cards remain visible together; confirmed forms and automatic reactions choose the correct sprites.
- Reaction poses clear after the attack; defense availability does not expire on the owner's turn.
- Heavy Cut recovery applies once to next-round initiative.
- Body-area selection and cancellation spend no extra turn; both fighters use the same target modifiers.
- Severity probabilities match all five rows of the original cutting table.
- Location penalties apply to the injured fighter, refresh without accumulating per area, and expire.
- One defense roll and at most one wound roll per attack.
- Medium/Heavy Bleeding refreshes without stacking and ticks twice/three times in controlled lethal duels.
- Practice player stays alive and can act at 1 Health; repeated hits cannot end the duel in defeat.
- Practice enemy remains defeatable; leaving and winning restore the party safely.
- The player-only Health floor does not affect stock/lethal combat and clears on exit.

See [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for controls, implementation, and checks.

October 20 v1.12 browser check: the three-choice action menu and form picker fit at 1280 × 720. Cancelling the picker preserved the turn. Changing to Kasumi let Masanori attack before the next player turn, left Masanori at full Health, and retained Kasumi in round 2. Quick/Heavy target labels displayed the stance-adjusted damage and hit chance with no browser warnings or errors. [Action menu](battles/paid-stance-actions.jpg) · [Quick preview](battles/damage-preview-quick.jpg) · [Heavy preview](battles/damage-preview-heavy.jpg).
