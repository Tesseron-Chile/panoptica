read @CLAUDE.md

## PR review standard

Before asking a human to review (`gh pr ready`, adding a reviewer, `gh pr create` or `gt submit` without `--draft`), the PR needs three things. The PR description rules in this file still apply; this section adds the review record and the writing pass.

1. A clear description in plain words: what changed, why and what to check, in the repository PR template.
2. A writing pass over the PR body, the workdocs and the new comments, using the writing plugin skills `writing:customize`, `writing:humanizer` and `writing:stop-slop`. The prose follows these rules: no em dashes, no Argentine voseo (tenés, podés), no filler or throat-clearing openers, no "no es X, es Y" constructions, no rule of three.
3. An independent review record ("constancia"), written by a reviewer that does not see the author's conclusions, with three sections: correctness (what was run and the result), patterns (races, swallowed errors, tests that depend on the clock or the order, mocks, N+1, duplication, names) and writing.

A draft with no reviewers is exempt. In Claude Code, once tesseron-plugin-marketplace#122 is merged, the hook of the `pull-requests` plugin (enabled in `.claude/settings.json`) checks that the record exists and is complete for the current head; it does not judge the content. Codex and Cursor have no hook, so for them this section is the rule.
