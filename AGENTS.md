# Project instructions

## Verification policy

Keep verification proportional to the change.

- Dialogue, descriptions, balance values, and simple database edits:
  inspect the diff and validate any modified JSON.
- Map and event edits:
  additionally check affected IDs, references, and event structure.
- Plugin or gameplay logic:
  run syntax checks and one focused check of the affected behavior.
- Save/load, shared engine behavior, or broad refactors:
  perform broader relevant testing.

Run checks once after completing the related edits.
Repeat only after a failure or a change that affects the result.

Do not launch the game, take screenshots, scan the whole project,
or create new test infrastructure for routine content edits unless
requested or needed to investigate a concrete issue.

Stop when the relevant checks pass. Briefly report what was checked
and anything that still needs manual playtesting.
