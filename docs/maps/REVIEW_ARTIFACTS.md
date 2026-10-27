# Courtyard review artifacts

The October 24, 2026 space cleanup removed 124 generated PNG review images
from `courtyard-v6-checks/`, `courtyard-v7-checks/`, `courtyard-v8-checks/`,
and `courtyard-v8-joins/` (about 103 MB). Historical documents may still refer
to those removed images. Their JSON reports remain available in those folders.

Current review images remain in `courtyard-v9-checks/`. Original source artwork,
prompts, implementation notes, and preservation backups are retained.

The older image output paths are ignored by Git to prevent generated reviews
from accumulating again. The corresponding `tools/verify-courtyard-v*.cjs`
and `tools/review-courtyard-*.py` scripts remain available, but rerunning them
against the current game does not recreate the historical game state.
