# Maze Vibing — Shared Agent Memory

This file is how every agent and session working on this repo stays aware of each other.
It is committed to git and lives on `main`.

**Protocol (mandatory for every agent, human or Claude):**

1. **Before starting any task:** pull `main`, read this whole file, and check the Active
   table so you do not pick a task someone else has claimed or one whose dependencies
   are not yet merged.
2. **When you start a task:** add a row to **Active workstreams** (task, branch, who,
   date) and commit it to `main` with the message `memory: claim task N`. That commit is
   the claim; if the push is rejected, pull, re-read, and claim again if still free.
3. **When you finish a task** (PR merged): move the row to **Completed**, note the PR
   number, and if that closes a phase, mark the phase done in **Phase status**. Do this in
   a commit on `main` right after the merge.
4. **When you learn something other agents need** (a gotcha, a decision, an interface
   that changed from the plan): add it to **Decisions and gotchas** with the date.
5. Never delete history from this file. Correct an entry by adding a dated note.

Plan: `docs/superpowers/plans/2026-09-24-maze-vibing.md` (tasks, dependencies, waves).
Spec: `docs/superpowers/specs/2026-09-24-maze-vibing-design.md`.

## Phase status

| Phase | Tasks | Status | Completed on |
|-------|-------|--------|--------------|
| 0 Setup | T1, T2, T3, T4, T5 | done | 2026-09-24 |
| 1 Maze generation | T6 | done | 2026-09-24 |
| 2 Parsing | T7, T8 | done | 2026-09-24 |
| 3 Rendering | T9, T10, T11 | done (shots on pr-shots c3b4715) | 2026-09-24 |
| 4 Movement | T12, T13 | done | 2026-09-24 |
| 5 Harden and deploy | T14, T15 | done — live at https://maze-vibing.vercel.app (shots on pr-shots 6b7218b) | 2026-09-24 |

## Active workstreams

| Task | Branch | Who (agent/session) | Started | Notes |
|------|--------|---------------------|---------|-------|

## Completed

| Task | Branch | Who | PR | Merged on |
|------|--------|-----|----|-----------|
| T1 Repo and GitHub | main (bootstrap) | controller session (Fable) | direct to main | 2026-09-24 |
| T2 Agents, CLAUDE.md | task-2-agents | subagent (haiku) via controller | #2 | 2026-09-24 |
| T5 File skeleton | task-5-skeleton | subagent (haiku) via controller | #3 | 2026-09-24 |
| T3 Test oracles | task-3-oracles | subagent (haiku) via controller | #1 | 2026-09-24 |
| T4 Screenshots, pr-shots | task-4-screenshots | subagent (sonnet) via controller | #4 | 2026-09-24 |
| T6 generateMaze | task-6-generate | subagent (sonnet) via controller | #6 | 2026-09-24 |
| T12 movePlayer | task-12-move | subagent (haiku) via controller | #8 | 2026-09-24 |
| T7 parseMaze | task-7-parse | subagent (sonnet) via controller | #7 | 2026-09-24 |
| T9 computeLayout | task-9-layout | subagent (haiku) via controller | #5 | 2026-09-24 |
| T8 mazeTiny cross-checks | task-8-tiny | subagent (haiku) via controller | #10 | 2026-09-24 |
| T10 Page controls | task-10-controls | subagent (sonnet) via controller | #9 | 2026-09-24 |
| T11 drawMaze | task-11-draw | subagent (sonnet) via controller | #11 | 2026-09-24 |
| T13 onKeyDown + play test | task-13-keys | subagent (sonnet) via controller | #12 | 2026-09-24 |
| T14 Hardening | task-14-harden | subagent (sonnet) via controller | #13 | 2026-09-24 |
| T15 Vercel config + deploy | task-15-vercel | controller session (Fable) | #15 | 2026-09-24 |
| Process: gate agents comment on PRs | chore-pr-gate-comments | controller session (Fable) | #14 | 2026-09-24 |
| Final-review fixes (win-state label, test hygiene, spec note) | fix-final-review | subagent (sonnet) via controller | #16 | 2026-09-24 |

## Decisions and gotchas

- 2026-09-24 — S and E are gaps in the outer wall (S at row 0 col 1, E at last row col cols-2 for generated mazes). Rooms are always `*`. Confirmed by the user; spec revision 2.
- 2026-09-24 — `candidate-submission.js` is one file with numbered sections. Parallel tasks edit different sections. The Node exports block at the bottom WILL conflict on merge; the resolution is always the union of both sides.
- 2026-09-24 — In this session the controller (Fable) maintains memory.md claims and completions; implementer subagents push their task branch and open a PR but do not merge and do not commit to main.
- 2026-09-24 — T9 layout fix (controller ruling): `wallSize` is floored, not rounded, and `computeLayout` shrinks `cellSize` until the layout fits inside the padded canvas; a `buildLayout(rows, cols, cellSize)` helper was added in Section 5. Interface of `computeLayout`/`tileSize` unchanged.
- 2026-09-24 — User rule: every agent that runs on a PR posts a comment confirming it ran, before the PR is merged; the merge-gate set is defined once in `CLAUDE.md` (Workflow). Retroactive records were posted on PRs #1 to #12 (those comments start with `**Retroactive gate record**`, not the `🤖 **<agent> ...**` prefix). Post comments from a file with `--body-file`; never `--body "$(printf ...)"` or a plain `<<'EOF'` heredoc.
- 2026-09-24 — Project complete: all 15 plan tasks plus the final whole-project review (fable) and its fix wave are merged. Open follow-ups (all minor, from PR #13/#16 reviews): drawMaze relies on drawCanvas to clear the padding; size limits duplicated between maze-game.js and the input attributes; E label is re-inked once on the win even on large mazes where the dot never reaches it; stale comment on drawGapLabels; label-test title over-promises for E.
- 2026-09-24 — `pr-shots` is an orphan branch. Never merge it, never rebase it, never delete it.
