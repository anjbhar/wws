# Legendary Ronin — boss spar

Talk to Legendary Ronin at (18,8) on the east side of Map001's dojo courtyard. Choose **Boss spar** to fight or **Not now** to decline. Matches are repeatable, allow escape, protect the player at 1 Health, and recover Health/MP before and after each outcome. There are no rewards or permanent party changes.

The encounter uses event 13, enemy 10 and troop 9. Boss stats: 1400 Health, 38 Attack, 26 Defense and 36 Speed, above Shinsengumi's 1000 / 31 / 20 / 28.

Legendary Ronin has exactly one fixed **Two Sword** stance. It uses Chudan's base combat modifiers and always attacks rather than attempting stance changes. Every Quick Cut and Heavy Cut performs two rapid strikes in the same turn, preserving the selected body area and cut strength. Each strike independently rolls normal Parry/Dodge/Hit defenses and rolls injury severity on a landed hit. The second strike follows a hit, parry or dodge; it stops if either fighter is dead. Injury changes from the first strike apply before the second resolves. Heavy Cut recovery is applied once per two-strike action. Practice protection still holds the player at 1 HP.

Both strikes have separate impact feedback and sounds, short log waits and recoil, with no second wind-up. The single approved dual-sword image is used for the fixed stance and reactions. Player stance options and other opponents are unchanged.

Walking sheet: `img/characters/$StrawHatRonin-v1.png`. Battle art: `img/enemies/StrawHatRonin-v2.png`. Sprite landmarks and body-target regions are registered under `LegendaryRonin` in the duel plugins. The tagged troop uses the existing courtyard backdrop. The system version update reloads the map for existing saves; restart a running playtest to load changed plugins and database records.

Reapply with `node tools/add-legendary-ronin.cjs`. Original data snapshots are under `docs/battles/backups/before-legendary-ronin/`; the installer is idempotent.

Checks:

- `node tools/check-legendary-ronin.cjs`: real event interpreter decline/win/escape/loss branches, recoveries, assets, fixed stance, 72 two-strike combinations (two cut types × four areas × nine outcome pairs), separate defense/injury RNG, one action/recovery cost, fixed-guard AI, lethal chain termination, rapid feedback, protection, victory and escape.
- `node tools/preview-legendary-ronin.cjs`: actual MZ renderer, spawn-to-NPC reachability, dialogue, decline, boss opening, body targeting, escape back to map, full recovery, missing assets and runtime errors.
- Core `check-duel.cjs`, `check-samurai-encounter.cjs`, `check-opening-stance.cjs`, `check-duel-feedback.cjs` and `check-lightless-blade.cjs` pass. The current browser report records two separately defended rapid impacts in Two Sword stance, with no runtime or missing-asset errors.

[Courtyard](legendary-ronin/courtyard.png) · [Dialogue](legendary-ronin/dialogue.png) · [Boss opening](legendary-ronin/boss-opening.png) · [Body targeting](legendary-ronin/body-targets.png) · [Browser report](legendary-ronin/browser-check.json)
