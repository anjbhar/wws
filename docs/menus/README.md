# WWS menu interfaces — October 24, 2026

Restart the game to load `WWS_UI` and `WWS_Menus`. Plugin order is Duel → UI → Party → Menus. Core MZ engine files are unchanged.

`WWS_UI` owns the ink/charcoal panels, cream text, olive Health bars, gold/rust selection accents, Georgia headings, Arial labels, artwork, spacing tokens and pointer buttons. Party consumes the same helpers. The menus fit the 1280 × 720 canvas into smaller desktop windows while preserving the stretch-mode preference.

The pause menu uses left navigation and three saved formation positions, shown Left / Center / Right. Empty positions remain empty and cannot open actor scenes. Location and money are compact footer panels. Additional roster members remain accessible in Party and through fighter switching on individual actor screens.

Panel styling revision (October 24): following feedback that the boxes felt too flat and boxy, shared surfaces now use softly rounded corners, subtle charcoal/olive shading, warm edge light and a restrained shadow. Hard horizontal border rules and selection underlines are removed. Unselected rows and Back controls are quieter. Party, menus and dialogue share this treatment; text placement and gameplay handlers are unchanged.

Dialogue readability revision (October 24): NPC speech now uses 32 px text, with 28 px choices and speaker names. The message window grows to keep four authored lines visible. Menu label sizes stay unchanged. At 960 × 540, dialogue appears at 24 px and choices at 21 px after canvas scaling.

## Verification

`node tools/preview-menus.cjs 1` runs the actual game renderer and native keyboard/mouse handlers in Chromium. Stage 1 passed solo/three-fighter layouts, disabled empty positions, cancellation, mouse actor selection and 960 × 540 fitting, with no runtime errors. See `stage-1-check.json` and the pause screenshots. Fixtures add companions only in memory.

Stages 2–5 also passed in order (`stage-2-check.json` through `stage-5-check.json`), with no runtime errors:

- Equipment: comparisons use the engine's detached temporary actor. Browsing and cancellation are inert; confirmed attributes match the preview. Optimize and Clear preview against a detached party inventory and require confirmation. Locked slots still use MZ eligibility rules. PgUp/PgDn or the Fighter buttons browse all roster members, including reserves.
- Inventory: stock categories, quantities and descriptions, explicit empty states, scrollable lists and artwork-based recipient rows. A real healing item was cancelled without consumption, then used to confirm healing and consumption. Target selection, all-target items and common-event dispatch remain with `Scene_ItemBase`.
- Status/Skills: Health, Attack, Defense and Speed have explanations relevant to WWS combat. Equipment shows current slots. The sword catalogue reads form summaries from `WwsDuelRules.formInfo`; browsing changes no committed form. Shinsengumi sees Seigan instead of Chudan and his actual Three Stage Thrust rules. The list scrolls. Learned database skills retain their MZ category, cost, availability and action handling.
- Save/Load/Options: real save/load restored formation and Health. Removing the new metadata exercised the older-save fallback and still loaded the save. New metadata records location and active-party artwork; older cards show their recorded walking sprites and “Location not recorded.” Toggles and volume adjustments use `ConfigManager` and persist normally.

## Controls and compatibility

Arrows navigate, Enter/Z confirms, Esc/right-click cancels, and mouse selection and wheel scrolling use MZ input handling. Standard lists use a first click to select and a second click to confirm. Back follows the focused window's cancellation handler. A pending Party swap cancels before leaving. During an equipment comparison, Back cancels the comparison before leaving. Fighter buttons and PgUp/PgDn switch roster members when selection is permitted.

The title reuses `EdoPracticeCourtyard-v1` and Hayato's battle artwork. Shops retain event-supplied goods and prices, purchase-only flags, quantities, buy/sell transactions and actor compatibility. Quantity controls share the WWS button design. Choice callbacks, cancellation branches and message escape codes stay with the event interpreter. Save overwrites and returning to the title have explicit confirmation, with Cancel selected first.

The canvas remains 1280 × 720. Smaller desktop windows fit the whole canvas, including map dialogue, without changing the stretch-mode preference. Verification uses the actual MZ game in Chromium with its real renderer and native input handlers; NW.js and audio listening are not separately verified. Save fixtures live in an isolated browser context and do not touch project save files. Companion and item fixtures exist only in memory. No starting roster, database, formation rules, item effects or equipment calculations are replaced.

## Final verification

`node tools/preview-menus.cjs 6` passed all six stages with zero browser runtime/console errors. It also verifies real buy/sell transactions, insufficient-money rejection, overwrite cancellation and confirmation, safe cancellation of the return-to-title dialog, mouse fighter switching, mouse Back on all seven menu scenes at 960 × 540, dialogue cancellation callbacks at both window sizes, title/Options return, and New Game retaining Hayato alone. [Full renderer report](stage-6-check.json).

`node tools/preview-party-screen.cjs` passed again after the shared-helper and Back-button changes: active/reserve mouse swaps, keyboard cancellation, scrolling reserves, formation locks, save round-trip and smaller-window pointer input. [Party report](../party/party-screen-check.json).

The following real-engine regression checks passed:

```sh
node tools/check-party-screen.cjs
node tools/check-party-foundation.cjs
node tools/check-practice-companions.cjs
node tools/check-team-battle.cjs
node tools/check-duel.cjs
node tools/check-duel-feedback.cjs
node tools/check-opening-stance.cjs
node tools/check-lightless-blade.cjs
node tools/check-monk-group.cjs
node tools/check-legendary-ronin.cjs
```

The combat checks include 80 complete seeded team fights and 60 complete seeded monk encounters, solo isolation, practice protection/recovery, automatic defenses, opening-form initiative, Seigan chains, targeting and cleanup. The only addition to the duel rules is a read-only `formInfo` accessor for the Skills catalogue.

Visual review covered clipping, long fighter names, panel/text overlap, artwork loading, active/disabled selection, empty lists, scrolling and the absence of stock blue windows or placeholder face portraits in the menu scenes. The title screenshot waits for the opening animation, and artwork screenshots wait for actual image loads. Temporary failed-test screenshots are not part of the verification record.

## Screenshots

[Solo pause](pause-solo.png) · [Three fighters](pause-team.png) · [Small pause](pause-small.png) · [Equipment comparison](equipment-preview.png) · [Bulk equipment confirmation](equipment-bulk-confirm.png) · [Inventory](inventory-items.png) · [Recipient picker](inventory-recipient.png) · [Status](status-shinsengumi.png) · [Seigan](skills-seigan.png) · [Three Stage Thrust](skills-three-stage.png) · [Save cards](save-cards.png) · [Legacy save](load-legacy.png) · [Options](options.png) · [Shop equipment](shop-equipment.png) · [Shop quantity](shop-quantity.png) · [Dialogue choices](dialogue-choices.png) · [Title](title.png).
