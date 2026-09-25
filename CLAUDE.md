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
- **Every gate agent posts its report as a comment on the PR before the merge** (prefixed `🤖 **<agent> (<model>) ran on <sha> at <time>**`). A PR with no `test-runner` and `code-reviewer` comments is not merged. Reviews done by other means (for example a plan-execution task reviewer) are posted as a comment too, saying who ran them.
- `pr-shots` is an orphan branch checked out at `.worktrees/pr-shots`. It is never merged into `main` and never deleted.
- `.claude/worktrees/` holds the temporary worktrees that subagents work in; it is git-ignored and never committed.
- Gate comments must be posted with `gh pr comment <PR> --body-file - <<'EOF' ... EOF` (quoted heredoc). Never `--body "$(printf ...)"`: report text with backticks would be executed by the shell.
- Agents: `code-reviewer` (opus), `test-writer` (sonnet), `code-architect` (fable), `test-runner` (haiku), `screenshot-runner` (haiku) in `.claude/agents/`.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
