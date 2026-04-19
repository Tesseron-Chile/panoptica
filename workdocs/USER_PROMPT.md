# Team Office Merge — User Prompt

**Context (from conversation that is not in the prompt text):**

Panoptica currently has a three-tier navigation: Campus → RunOfficeView → NookDrillDown. During review of the running prototype we discovered that the tier-2 view (4 isolated role nooks) and tier-3 view (one lone agent in an empty PixiJS office) don't match Ralph's actual shape — roles are a sequential handoff operating on shared workdocs and a shared repo, not 4 parallel cubicles.

**Goal:** Collapse into two tiers. RunOfficeView becomes a single TeamOffice — all role sessions co-located in one PixiJS canvas, plan tasks rendered on the in-canvas whiteboard, repo/phase/elapsed in a lean DOM sidebar. Click-to-focus via the existing CharacterFocusPopup (extended with role/model/task). Campus cards gain pure-CSS mini-office previews.

**Design decisions already agreed:**

1. Campus → mini office previews (CSS-only, no PixiJS cost).
2. Unfilled role slots → empty desk + empty chair visible (no agent sprite).
3. Plan tasks → rendered on the in-canvas whiteboard (not sidebar).
4. Orchestrator session → mapped to the existing BossSprite.

**Mockup:** http://localhost:7777/panoptica-mockups.html (served from `/tmp/panoptica-mockups.html`).

**Implementation plan:** `docs/plans/2026-04-19-team-office-merge.md` (10 tasks, TDD where applicable, per-task commits).

**Scope guardrails:**
- Delete `NookDrillDown`, `NookSidebar`, `RoleNook`, and related `navigationStore` state. Do not leave dead code or back-compat shims.
- No new feature flags.
- No new abstractions beyond what the plan specifies.
- Frontend-only change. Backend stays untouched.
- One commit per task with a clear message.
