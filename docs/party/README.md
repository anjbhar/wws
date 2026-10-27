# Party screen — October 23, 2026

Restart a running playtest, open the game menu and choose **Party**. `WWS_Party` replaces the old Formation entry and is available with Hayato alone.

The screen uses the battle UI's ink, cream, olive and rust palette, existing rear battle artwork, and walking sprites for actors without supported battle art. Empty positions are shown without adding actors. Three position cards appear visually as Left / Center / Right; the saved formation remains Center / Left / Right internally.

October 24: colors, typography, wrapping, panels, artwork and the mouse Back button now come from `WWS_UI`, shared with the [remaining menus](../menus/README.md). Party's saved swaps, active/reserve rules and two-step cancellation are unchanged. Empty-position copy does not imply that recruitment is available.

## Controls

- Left/Right browse active positions. Down or Tab moves to reserves; Up from the first reserve row or Tab returns to active positions. Reserve rows scroll for larger rosters.
- Enter or a click selects a fighter to move. Select another active fighter to exchange positions, or a reserve to exchange active/reserve membership. A reserve must be exchanged with an active fighter.
- Escape cancels a pending move; Escape again returns to the menu. The Back control does the same. Selecting the same fighter again also cancels a move.
- Empty positions, two reserves, actor formation locks and the system formation lock cannot alter the party. A locked formation remains available for inspection.

The detail panel shows current Health, level, class, Attack, Defense, Speed, equipped items and sword discipline. Shinsengumi's panel describes Seigan's Three Stage Thrust. Long names wrap instead of overlapping adjacent labels. No placeholder face portraits appear on this screen.

Changes use the existing party/formation APIs, update map followers and are included in normal game saves. Browsing, cancelling and opening/closing the screen do not rearrange the party. The screen fits smaller desktop windows without changing the player's stretch-mode preference, and restores normal scaling when closed.

Recruitment and dismissal are not implemented. The new-game party remains Hayato alone; temporary monk-practice guests do not become persistent roster members.

## Verification

- `node tools/check-party-screen.cjs`: real MZ party swaps, active/reserve membership, saved assignments, invalid/no-op moves, actor and system locks, roster preservation.
- `node tools/preview-party-screen.cjs`: real MZ renderer and native input handlers, one-actor menu access, keyboard/mouse swaps and cancellation, reserve scrolling and promotion, engine save round-trip, reopening, locked formation and a 960 × 540 window with pointer input. Fixtures add companions only in memory; no saves or database records are written.
- Foundation, team-battle and companion regression checks remain available under `tools/`.

[Hayato alone](hayato-only.png) · [Full formation](three-active.png) · [Reserve swap](reserve-swap.png) · [Scrolling roster](reserve-scroll.png) · [Smaller window](small-window.png) · [Renderer report](party-screen-check.json)
