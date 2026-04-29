# Ralph Verifier Prompt — Run A-2, Phase C Iteration 1

You are the **verifier agent** (🔍) in the Ralph workflow (Phase C, C7).

## Workflow skill

`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Repo & branch

- Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/ebcdeee9`
- Target branch: `prometeo`
- PR: #8 (Tesseron-Chile/panoptica)

## Workdocs to read

- `workdocs/SPEC.md`
- `workdocs/PLAN.md`
- `workdocs/TAKEAWAYS.md`

## Your jobs

1. Run all programmatic success criteria from SPEC.md — record pass/fail for each
2. Classify each SPEC requirement as fully met / partially met / not addressed
3. Check PR #8 for any comment sources needing a disposition reply (reviewer posted a comment — acknowledge it)
4. Update `workdocs/TAKEAWAYS.md` with verification summary
5. Exit

## Extra notes

- `uv` is NOT on default PATH — use `/Users/albertocastrobravo/.local/bin/uv`
- Run uv commands from `backend/` directory
- pyright fails with 551 pre-existing errors — expected; only ruff + pytest count
- Reviewer verdict was **Approved** with these findings (pass to coder for C8):
  - **Minor 1:** `get_latest_updates` loads all rows into memory — add SQL-level LIMIT or WHERE guard
  - **Minor 2:** No `max_length` on `ChatMessageCreate.content/sender`, `FloorUpdateCreate.title/body`
  - **Nit 3:** `FloorUpdateResponse.priority` is `str`, should be `Literal[...]`
  - **Nit 4:** Redundant `except (WebSocketDisconnect, Exception)` in websocket endpoint
  - **Nit 5:** Unused `logger` in `chat.py` and `floor_updates.py`
- No AI reviewers for this run
- Post acknowledgment comment on PR #8:
  ```bash
  gh api repos/Tesseron-Chile/panoptica/issues/8/comments \
    -f body="**Acknowledged** — all Minor findings passed to coder for C8 fixes. Nits will also be addressed per nit_tolerance=low."
  ```
