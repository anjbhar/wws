# Party combat foundation — October 23, 2026

`WWS_Duel` v1.23 supports permanent companions. Speak to Masanori or the Shinsengumi Swordsman in the dojo courtyard and choose **Join party** to recruit them. No sparring victory is required. Repeat recruitment leaves the roster unchanged; both sparring options remain available. Recruits fill active positions up to the three-fighter limit, then join the reserves managed in the Party screen.

## Active party and formation

- The first three roster actors are active; additional actors are reserves. The engine, followers and custom combat share this limit.
- `Game_Party._wwsFormation` saves active actor IDs in Center, Left, Right order. Reordering the same active roster does not implicitly change positions. Removing/replacing active actors reconciles the assignments and compacts empty slots.
- The [Party screen](../party/README.md) replaces the menu's Formation entry and intentionally swaps selected actors' assignments, including active/reserve exchanges. It uses the existing `swapOrder` integration. Other stock status menus retain position labels; group HUD rows also show positions.
- `$gameParty.setWwsFormation([centerId, leftId, rightId])` sets positions for the current active actors, with fewer IDs for smaller teams. It returns false without mutation for duplicates, reserves, missing actors or wrong lengths. It refreshes followers after a valid assignment.
- Saves without formation data initialize lazily from their active roster; stale or duplicate saved IDs are reconciled without modifying source save files.

## Encounter policy

- Troop 6 and `[WWS Duel]` troops use a single fighter by default: Hayato if he belongs to the roster, otherwise the active leader. Hayato can participate even when reserved.
- `[WWS Party]` opts into active-party combat and enables custom combat. Existing `[WWS Monk Group]` is also a party encounter.
- Monk practice adds temporary Masanori and Shinsengumi only when Hayato is the sole active fighter. Existing teams use their actual actors, and a lone companion does not receive a duplicate guest.
- Encounter participants override `members()` / `battleMembers()` only during combat and its lifecycle callbacks. The map roster, saved actor IDs and benches remain intact. Victory, escape and defeat share cleanup.
- Untagged encounters retain stock mechanics. Custom combat still requires turn-based battles with one to three enemies.

## Targeting

Both teams use lane restrictions only when each has three living fighters. Center reaches every opponent; each flank reaches its opposite and center. If either side has fewer than three living fighters, everyone can reach all surviving opponents. Enemy AI and player menus use the same legal-target function. A lone enemy occupies center; two enemies occupy Left and Right.

## Verification

- `node tools/check-party-foundation.cjs`: active/reserve limits, save payload round-trip, legacy/stale formations, explicit swaps, invalid assignments, solo lifecycle isolation with four roster actors and Hayato reserved, all nine 1–3 versus 1–3 team sizes, symmetric targeting, guest duplication protection and stock fallback.
- `node tools/check-team-battle.cjs`: real MZ team actions, both-side targeting after knockouts, protection, cleanup and 80 seeded complete fights.
- `node tools/check-monk-group.cjs`: encounter branches and 60 seeded complete fights.
- Existing companion, duel, opening, feedback, Seigan, samurai, Shinsengumi and Legendary Ronin checks cover regressions.
- `node tools/preview-team-battle.cjs`: actual monk practice, victory/escape cleanup, stock Formation swaps, an engine save round-trip and a solo spar with a full roster; no runtime errors. Screenshots: [formation labels](monk-group/party-formation-menu.png), [group HUD](monk-group/team-battle-3v3.png), [solo isolation](monk-group/party-solo-isolation.png).

Formation checks use in-memory roster fixtures; the starting party remains Hayato alone.
