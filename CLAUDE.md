# Maze Vibing

Playable random maze on an HTML5 canvas. Started from the AoPS take-home in `README.md`.

## Start here, every session
1. Read `memory.md` (who is working on what, decisions, gotchas). Follow its protocol: claim before starting, record when done.
2. Read the plan `docs/superpowers/plans/2026-09-24-maze-vibing.md` for your task's exact steps and dependencies.

## Commands
- `npm test` — unit tests (Node built-in runner, no framework)
- `npm run test:e2e` — Playwright acceptance tests (needs `npx playwright install chromium` once)
- `npm run screenshot` — screenshots into `./screenshots/`
- `npm run save-shots -- <label>` — screenshots committed to the `pr-shots` branch
- Open `maze-game.html` in a browser to play
- Live: https://maze-vibing.vercel.app (Vercel project `maze-vibing`, linked to this GitHub repo; production deploys from `main`)

## Where code lives
- `candidate-submission.js` — ALL maze logic and drawing, in numbered sections. Edit here by default. Parallel tasks edit different sections; the exports block at the bottom is resolved as the union on conflict.
- `maze-game.js` / `maze-game.html` — page wiring only (load, Generate button, keydown).
- Must keep working via plain `<script>` tags: no `import`/`export`, no build, no runtime deps.

## Maze data format (cheat sheet)
Grid of characters, `(2*height+1)` rows x `(2*width+1)` cols. `#` wall, `*` open, `S` entrance gap, `E` exit gap.
Odd row + odd col = room (always `*`). Even/even = post (always `#`). Other slots = doorway (`#` or `*`).
Outer ring is `#` except one `S` and one `E`, each in an edge doorway slot. The room just inside S is the start room; inside E is the end room.
Full explanation: `docs/superpowers/specs/2026-09-24-maze-vibing-design.md` section 3.

## Maze rules (all tested)
No loops. Every room reachable. Exactly one solution. Rectangular.

## Workflow
- One branch + one PR per task (`task-N-<slug>`). Never commit code directly to `main`; only `memory.md` updates go straight to `main`.
- Before merging: `test-runner` agent reports merge gate OPEN and `code-reviewer` agent reports no BLOCKING findings. When a PR changes anything visual, run `screenshot-runner` on it too; when a phase's last task merges, run `screenshot-runner` on `main` and record the `pr-shots` folder and hash in `memory.md`'s Phase status row.
- **Merge gate (the single definition; memory.md refers here):** a PR is merged only when it carries a `test-runner` comment reporting OPEN and a `code-reviewer` comment reporting no BLOCKING findings, and, if the PR changes anything visual, a `screenshot-runner` comment. Every agent that runs on a PR (those three plus `code-architect`, `test-writer`, and any other reviewer such as a plan-execution task reviewer) posts its report as a PR comment before the merge, prefixed `🤖 **<agent> (<model>) ran on <sha> at <time>**`.
- `pr-shots` is an orphan branch checked out at `.worktrees/pr-shots`. It is never merged into `main` and never deleted.
- `.claude/worktrees/` holds the temporary worktrees that subagents work in; it is git-ignored and never committed.
- Gate comments are written to a file first and posted with `gh pr comment <PR> --body-file <file>`. Never `--body "$(printf ...)"` and never a plain `<<'EOF'` heredoc: report text containing backticks, `$(...)`, or a bare `EOF` line would be parsed by the shell. If a heredoc is the only way to write the file, use the delimiter `MAZE_GATE_REPORT_END`.
- Agents: `code-reviewer` (opus), `test-writer` (sonnet), `code-architect` (fable), `test-runner` (haiku), `screenshot-runner` (haiku) in `.claude/agents/`.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
