# Maze Vibing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Before starting any task, read and update `memory.md` (see "Working in parallel").

**Goal:** A playable, randomly generated maze web page with a blue-dot player that enters through an S gap and leaves through an E gap, proven correct by tests, reviewed by a roster of subagents, and deployed to Vercel.

**Architecture:** One plain browser script, `candidate-submission.js`, holds the maze format, generator, parser, layout, drawing, and movement as separately testable numbered sections; `maze-game.html` and `maze-game.js` gain a size form and Generate button. Node's built-in test runner covers the pure functions, Playwright covers the page.

**Tech Stack:** Vanilla JavaScript (ES2020, no build step), HTML5 Canvas, Node 25 `node --test`, Playwright (dev only), git + GitHub CLI, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-09-24-maze-vibing-design.md` (revision 2)

## Global Constraints

- `candidate-submission.js` must define `mazeTiny`, `drawMaze`, and `onKeyDown` as `const` bindings and work when loaded by a `<script>` tag (no `import`/`export`, no bundler).
- No runtime dependencies. Playwright is the only dev dependency.
- Maze grids are `(2*height + 1)` rows by `(2*width + 1)` columns of the characters `#`, `*`, `S`, `E`. Rooms (odd row, odd col) are always `*`. The outer ring is `#` except exactly one `S` gap and one `E` gap, each in an edge doorway slot (never a corner).
- Generated mazes: `S` at row 0, col 1 (gap above the top-left room); `E` at the last row, col `cols-2` (gap below the bottom-right room). Generator accepts any whole-number size from 1 x 1. UI sizes 2 to 50 cells per side.
- Walls black `#000000`, open space white `#FFFFFF`, player blue `#1E64FF`, wall thickness ratio `0.25`, canvas padding `20`.
- Positions are `{ row, col }` grid indices. Directions are `[dRow, dCol]`.
- `pr-shots` is an orphan branch, never merged. Tests must pass (test-runner agent) and code review must show no BLOCKING findings before any merge to `main`.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Every task claims itself in `memory.md` when it starts and records completion when its PR merges.

## Review Focus

1. A maze pasted with rows as strings of unequal length must produce a clear error on the canvas, not a crash. Pinned in Task 7 and Task 14.
2. Holding an arrow key (auto-repeat) after stepping out through `E` must not move the dot or redraw endlessly. Pinned in Task 13.
3. Width or height typed as `0`, `-3`, `2.5`, `999`, or blank must clamp to the 2 to 50 range and still generate. Pinned in Task 10.
4. A 1-room-wide maze (for example 1 x 10) and a 1 x 1 maze must generate and validate: a straight corridor is still a tree. Pinned in Task 6.
5. Arrow keys pressed while the cursor is in the Width/Height box must change the number, not move the dot. Pinned in Task 13.

---

## Plain-language overview (read this first)

**Phase 0 — Setup.** Turn the folder into a git project, publish it privately on GitHub, add a `.gitignore`, a `CLAUDE.md` that explains the project to future sessions, a shared `memory.md` so agents know what each other is doing, five helper agents (reviewer, test writer, architect, test runner, screenshot runner), the test harness, the screenshot tool, the long-lived `pr-shots` branch, and the skeleton of the main code file with the maze format written down.

**Phase 1 — Maze generation.** Write the "digger with a ball of string" algorithm from the spec so that `generateMaze(5, 5)` returns a fresh random maze in our grid format, with an S gap cut in the top wall and an E gap in the bottom wall. Tests check every rule: no loops, every room reachable, exactly one solution, rectangular, over many sizes and random seeds.

**Phase 2 — Parsing.** Write the reader that takes a pasted grid, checks it obeys the format (and explains what is wrong if not), and finds the S gap, the E gap, and the rooms just inside them.

**Phase 3 — Drawing.** Turn grid positions into pixels, draw walls black and rooms white on the canvas with S and E labelled outside their gaps, draw the blue dot in the start room, and add the Width/Height boxes and Generate button to the page.

**Phase 4 — Moving.** Arrow keys move the dot one room at a time, only through open doorways. Stepping out through the E gap shows a win banner. A browser test plays a maze end to end.

**Phase 5 — Harden and ship.** Guard every input, get an architecture review, and deploy to Vercel.

Work is split into 15 tasks. Each task is its own branch and pull request so several agents can work at once. Before a merge, the test-runner agent runs every test and the code-reviewer agent reviews the branch. When a phase's last task merges, the screenshot-runner agent saves pictures of the result to `pr-shots`.

---

## Working in parallel

### The coordination file: `memory.md`

`memory.md` at the repo root is the shared notebook for every agent and session. Its rules are written at the top of the file. In short: read it before starting, claim your task in the Active table with a commit to `main`, move the row to Completed when your PR merges, mark the phase done when its last task merges, and log any decision or gotcha other agents need.

To spin up a second agent, give it this prompt shape:

> Read `memory.md`, `CLAUDE.md`, and `docs/superpowers/plans/2026-09-24-maze-vibing.md`. Claim and implement Task N on branch `task-N-<slug>` following the plan's steps exactly, run the tests, open a PR, and update `memory.md` when you claim and when you finish. Do not start a task whose dependencies are not in the Completed table.

### Dependency map

| Task | Needs merged first | Touches `candidate-submission.js`? |
|------|--------------------|-----------------------------------|
| T1 Repo and GitHub | nothing | no |
| T2 Agents, CLAUDE.md | T1 | no |
| T3 Test oracles | T1 | no |
| T4 Playwright, screenshots, pr-shots | T1 | no |
| T5 File skeleton, constants, `mazeTiny`, seeded random | T1 | yes (creates all sections and stubs) |
| T6 `generateMaze` | T3, T5 | Section 3 |
| T7 `parseMaze`, `analyzeMaze`, `roomInside` | T5 | Section 4 |
| T8 `mazeTiny` and cross-checks | T6, T7 | no |
| T9 `computeLayout` | T5 | Section 5 |
| T10 Page controls (HTML, `maze-game.js`) | T4, T6 | no |
| T11 `drawMaze` and rendering | T7, T9, T10 | Section 6 |
| T12 `movePlayer` | T5 | Section 7 (above `onKeyDown`) |
| T13 `onKeyDown`, win, play test | T11, T12 | Section 7 |
| T14 Hardening | T13 | any |
| T15 Vercel | T13 (deploy after T14 merges) | no |

### Waves (what can run at the same time)

| Wave | Tasks that can run in parallel | Agents |
|------|-------------------------------|--------|
| 0 | T1 | 1 (must finish before anything else) |
| 1 | T2, T3, T4, T5 | up to 4 |
| 2 | T6, T7, T9, T12 | up to 4 |
| 3 | T8, T10 (then T11 once T10 merges) | up to 2, then 1 |
| 4 | T13; T15 config steps 1 to 2 | up to 2 |
| 5 | T14, then T15 deploy | 1 then 1 |

### Merge-conflict rule for the shared file

Wave 2 tasks all edit `candidate-submission.js` in different numbered sections. Task 5 creates every section header and a stub for each, so each task replaces only its own stub. Two places will still conflict when the second PR lands:

- The `module.exports` block at the bottom: the correct resolution is always the union of both sides' names.
- The `STEP_DIRECTIONS` constant is defined once in Section 1 by Task 5; later tasks use it, never redefine it.

When resolving, rerun `npm test` before pushing.

---

## File map

| Path | Responsibility |
|------|----------------|
| `candidate-submission.js` | All maze logic and rendering (sections 1 to 8 in the spec) |
| `maze-game.html` | Page: controls block + canvas |
| `maze-game.js` | Page wiring: load, Generate button, keydown forwarding |
| `memory.md` | Shared agent coordination: claims, completions, decisions |
| `tests/helpers/maze-oracle.js` | Independent rule checkers used by tests |
| `tests/maze-oracle.test.js` | Proves the oracles on hand-made grids |
| `tests/random.test.js` | Constants, `mazeTiny` shape, seeded random |
| `tests/generate-maze.test.js` | Generator tests |
| `tests/parse-maze.test.js` | Parser tests |
| `tests/maze-tiny.test.js` | `mazeTiny` obeys the rules; parser accepts generated mazes |
| `tests/layout.test.js` | Grid-to-pixel layout tests |
| `tests/movement.test.js` | `movePlayer` tests |
| `tests/e2e/controls.test.mjs` | Playwright: inputs, Generate, clamping |
| `tests/e2e/render.test.mjs` | Playwright: rendering and `mazeDebug` |
| `tests/e2e/play.test.mjs` | Playwright: movement and winning |
| `scripts/screenshot.mjs` | Takes screenshots of the page |
| `scripts/save-shots.sh` | Copies screenshots into the `pr-shots` worktree and commits |
| `.claude/agents/*.md` | Five subagent definitions |
| `CLAUDE.md` | Project instructions for Claude sessions |
| `.gitignore`, `package.json`, `vercel.json`, `.vercelignore` | Config |

---

# Phase 0 — Setup

### Task 1: Git repository, GitHub, base config

**Files:**
- Create: `.gitignore`, `package.json`
- Commit: starter files, `docs/superpowers/**`, `memory.md`

**Interfaces:**
- Produces: git repo on `main`, GitHub remote `origin`, `npm test` script (runs `node --test tests/*.test.js`), `npm run test:e2e`.

- [ ] **Step 1: Initialise git and commit the untouched starter files**

```bash
cd /Users/christung/Projects/AoPS/interview-mazes-senior-takehome-main
git init -b main
git add README.md maze-game.html maze-game.js candidate-submission.js
git commit -m "chore: import AoPS take-home starter files

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 2: Write `.gitignore`**

```gitignore
node_modules/
.worktrees/
.vercel/
screenshots/
test-results/
.DS_Store
*.log
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "maze-vibing",
  "version": "0.1.0",
  "private": true,
  "description": "Playable random maze on an HTML canvas",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "test:e2e": "node --test tests/e2e/*.test.mjs",
    "screenshot": "node scripts/screenshot.mjs",
    "save-shots": "bash scripts/save-shots.sh"
  },
  "devDependencies": {}
}
```

- [ ] **Step 4: Commit config, docs and memory file; create the GitHub repo; push**

```bash
git add .gitignore package.json docs/ memory.md
git commit -m "chore: add gitignore, package.json, design spec, plan and shared memory file

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
gh repo create maze-vibing --private --source=. --remote=origin --push
git remote -v
```
Expected: `origin` points at `github.com/<user>/maze-vibing`, `main` pushed.

- [ ] **Step 5: Record completion**

Edit `memory.md`: add T1 to Completed (PR "direct to main, bootstrap"). Commit as `memory: complete task 1` and push.

### Task 2: Subagent definitions and CLAUDE.md

Branch: `task-2-agents`. Claim in `memory.md` first.

**Files:**
- Create: `.claude/agents/code-reviewer.md`, `.claude/agents/test-writer.md`, `.claude/agents/code-architect.md`, `.claude/agents/test-runner.md`, `.claude/agents/screenshot-runner.md`, `CLAUDE.md`

**Interfaces:**
- Produces: agents invocable via the Agent tool by name; workflow rules in `CLAUDE.md`.

- [ ] **Step 1: Write `.claude/agents/code-reviewer.md`**

```markdown
---
name: code-reviewer
description: Reviews a PR or branch with the /code-review skill and labels every finding BLOCKING or NON-BLOCKING. Use before merging any task branch.
model: opus
tools: Read, Grep, Glob, Bash, Skill
---

You are the Maze Vibing code reviewer.

1. Determine the target: the argument you were given (a PR number, branch name, or path). If none, review the current branch against `main`.
2. Invoke the `code-review` skill on that target at effort level `high`.
3. Read `CLAUDE.md`, `memory.md`, and `docs/superpowers/specs/2026-09-24-maze-vibing-design.md` so you know the project rules and current decisions.
4. Re-check each finding yourself by reading the code before reporting it.

Classify every finding:
- **BLOCKING**: a correctness bug, a violation of the four maze rules (no loops, all reachable, exactly one solution, rectangular), a requirement in the spec that is missing or wrong, a missing test for a spec requirement, a security issue, or a break of the `<script>`-tag / no-dependency contract.
- **NON-BLOCKING**: naming, style, comments, small performance nits, refactors that do not change behaviour.

Report format:

```
## Verdict: MERGEABLE | NOT MERGEABLE

### Blocking
- file:line — what is wrong — how to fix

### Non-blocking
- file:line — suggestion
```

Never edit files. If the review finds nothing, say so and give the verdict MERGEABLE.
```

- [ ] **Step 2: Write `.claude/agents/test-writer.md`**

```markdown
---
name: test-writer
description: Writes unit and acceptance tests for maze generation, parsing, layout, movement and the page. Always covers the four maze rules.
model: sonnet
tools: Read, Write, Edit, Grep, Glob, Bash
---

You write tests for Maze Vibing. Read `memory.md` first for current decisions.

Rules:
- Unit tests use Node's built-in runner: `const { test } = require('node:test'); const assert = require('node:assert/strict');`. Files live in `tests/` and end in `.test.js`. Run them with `npm test`.
- Acceptance tests use Playwright and live in `tests/e2e/*.test.mjs`. Run with `npm run test:e2e`.
- Load the code under test with `require('../candidate-submission.js')`; it exports its pure functions when run under Node.
- Use the independent checkers in `tests/helpers/maze-oracle.js` (`countSolutionPaths`, `hasLoop`, `reachableCount`, `isRectangular`, `startRoom`, `endRoom`). Never re-implement the generator's logic inside a test.
- Every test file that touches mazes must assert all four rules on every maze it produces: exactly one solution, zero loops, every room reachable, rectangular.
- Remember S and E are gaps in the outer wall, not rooms. Paths are counted from the room inside S to the room inside E.
- Test both happy paths and deliberately broken inputs.
- Follow TDD: write the test, run it and show it failing, then hand back. You do not implement production code unless asked.
- Report the exact command you ran and the verbatim result.
```

- [ ] **Step 3: Write `.claude/agents/code-architect.md`**

```markdown
---
name: code-architect
description: Reviews architecture with a focus on performance and code modularity. Reports findings; does not edit.
model: fable
tools: Read, Grep, Glob, Bash
---

You are the Maze Vibing architect. Read `CLAUDE.md`, `memory.md`, and the design spec in `docs/superpowers/specs/` first.

Review the code you are pointed at (default: whole repo) for:

**Performance**
- Generation should be linear in the number of rooms; flag anything quadratic (repeated array scans, string concatenation in loops, recursion that could overflow at 50 x 50).
- Rendering: one full redraw per key press is acceptable; flag per-tile `save/restore`, per-tile font changes, or allocations inside the tile loop.
- Layout should be computed once per maze, not per frame.

**Modularity**
- Pure functions (generate, parse, layout, movePlayer) must not touch `ctx`, `canvas`, `document`, or `window`.
- Each section of `candidate-submission.js` has one job; flag mixing (for example validation inside drawing).
- Interfaces match the spec's Key interfaces table; flag drift.
- Tests exercise pure functions directly, not through the canvas.

Report as a list ordered by impact: `severity (high/medium/low) — file:line — problem — concrete change`. Constraints you must respect: single script file loaded via `<script>` tag, no runtime dependencies, no build step. Do not propose a bundler or framework. Never edit files.
```

- [ ] **Step 4: Write `.claude/agents/test-runner.md`**

```markdown
---
name: test-runner
description: Runs every test suite and reports verbatim results. Must pass before any merge to main.
model: haiku
tools: Bash, Read
---

You run the Maze Vibing tests. You never edit files.

1. Run `git rev-parse --abbrev-ref HEAD`. If the branch is `pr-shots`, stop and report "pr-shots is never tested or merged".
2. Run `npm test`. Capture the full output.
3. If `node_modules/playwright` exists, run `npm run test:e2e`. Capture the full output.
4. Report:

```
Branch: <name>
Unit tests: PASS | FAIL (<passed>/<total>)
E2E tests: PASS | FAIL | SKIPPED (playwright not installed)
Merge gate: OPEN | CLOSED
<verbatim output of any failure>
```

Merge gate is OPEN only when every suite that ran passed. Never summarise a failure away; paste it.
```

- [ ] **Step 5: Write `.claude/agents/screenshot-runner.md`**

```markdown
---
name: screenshot-runner
description: Takes screenshots of the maze page for the current change, stores them on the long-lived pr-shots branch, and describes whether they match expectations.
model: haiku
tools: Bash, Read
---

You capture visual evidence for Maze Vibing.

Input: a short label for this iteration (for example `phase-3-render`) and, optionally, a sentence describing what the screenshot should show.

1. Run `npm run save-shots -- <label>`. This runs `scripts/screenshot.mjs`, copies the PNGs into the `pr-shots` worktree under `shots/<timestamp>-<branch>-<label>/`, commits on `pr-shots`, and pushes.
2. Open each PNG with the Read tool and describe what is visible: canvas present, walls black, rooms white, blue dot position, S gap (green) and E gap (gold) in the border with letters outside, controls, any error text.
3. Compare against the expectation you were given and say MATCHES or DOES NOT MATCH with reasons.
4. Report the folder path and the `pr-shots` commit hash.

Rules: never check out, merge, or rebase `pr-shots` into anything. Never run `git` commands on `main` other than reading. Never edit source files.
```

- [ ] **Step 6: Write `CLAUDE.md`**

```markdown
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
- Before merging: `test-runner` agent reports merge gate OPEN and `code-reviewer` agent reports no BLOCKING findings. When a phase's last task merges, run `screenshot-runner`.
- `pr-shots` is an orphan branch checked out at `.worktrees/pr-shots`. It is never merged into `main` and never deleted.
- Agents: `code-reviewer` (opus), `test-writer` (sonnet), `code-architect` (fable), `test-runner` (haiku), `screenshot-runner` (haiku) in `.claude/agents/`.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
```

- [ ] **Step 7: Verify the agents load, commit, PR, merge, record**

Run: from a Claude Code session, invoke the `test-runner` agent with the prompt "report the branch" and confirm it answers with the branch name. If a `model: fable` agent fails to start, change `code-architect.md` to `model: claude-fable-5-1`.

```bash
git add .claude CLAUDE.md
git commit -m "chore: add subagent definitions and CLAUDE.md

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-2-agents
gh pr create --title "Task 2: subagents and CLAUDE.md" --body "$(cat <<'EOF'
Adds the five subagent definitions and CLAUDE.md with the workflow and memory.md protocol.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `code-reviewer` on the PR. Merge with `gh pr merge --squash --delete-branch`. Then on `main`: move T2 to Completed in `memory.md`, commit `memory: complete task 2`, push.

### Task 3: Test oracles (independent maze rule checkers)

Branch: `task-3-oracles`. Claim in `memory.md` first.

**Files:**
- Create: `tests/helpers/maze-oracle.js`, `tests/maze-oracle.test.js`

**Interfaces:**
- Produces:
  - `isRectangular(grid) -> boolean`
  - `rooms(grid) -> Array<{row, col}>` (all odd/odd positions)
  - `findChar(grid, ch) -> {row, col} | null`
  - `roomInside(grid, gap) -> {row, col}` (the room just inside an edge gap)
  - `startRoom(grid) -> {row, col} | null`, `endRoom(grid) -> {row, col} | null`
  - `openNeighbours(grid, room) -> Array<{row, col}>` (rooms reachable through a `*` doorway; `S`/`E` gaps lead outside and are not neighbours)
  - `reachableCount(grid) -> number` (rooms reachable from the start room)
  - `hasLoop(grid) -> boolean`
  - `countSolutionPaths(grid) -> number` (simple paths from start room to end room)

- [ ] **Step 1: Write the failing oracle tests on hand-made grids**

`tests/maze-oracle.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const oracle = require('./helpers/maze-oracle.js');

const tree = [
  ['#','S','#','#','#','#','#'],
  ['#','*','*','*','#','*','#'],
  ['#','#','#','*','#','*','#'],
  ['#','*','*','*','*','*','#'],
  ['#','*','#','#','#','#','#'],
  ['#','*','*','*','*','*','#'],
  ['#','#','#','#','#','E','#'],
];

const loop = [
  ['#','S','#','#','#'],
  ['#','*','*','*','#'],
  ['#','*','#','*','#'],
  ['#','*','*','*','#'],
  ['#','#','#','E','#'],
];

const disconnected = [
  ['#','S','#','#','#'],
  ['#','*','*','*','#'],
  ['#','#','#','*','#'],
  ['#','*','#','*','#'],
  ['#','#','#','E','#'],
];

const ragged = [
  ['#','S','#'],
  ['#','*','*','#'],
  ['#','E','#'],
];

test('isRectangular', () => {
  assert.equal(oracle.isRectangular(tree), true);
  assert.equal(oracle.isRectangular(ragged), false);
});

test('rooms lists every odd/odd position', () => {
  assert.equal(oracle.rooms(tree).length, 9);
  assert.deepEqual(oracle.rooms(loop)[0], { row: 1, col: 1 });
});

test('findChar locates the S and E gaps', () => {
  assert.deepEqual(oracle.findChar(tree, 'S'), { row: 0, col: 1 });
  assert.deepEqual(oracle.findChar(tree, 'E'), { row: 6, col: 5 });
  assert.equal(oracle.findChar(tree, 'Q'), null);
});

test('startRoom and endRoom are the rooms just inside the gaps', () => {
  assert.deepEqual(oracle.startRoom(tree), { row: 1, col: 1 });
  assert.deepEqual(oracle.endRoom(tree), { row: 5, col: 5 });
  assert.deepEqual(oracle.roomInside(tree, { row: 3, col: 0 }), { row: 3, col: 1 });
  assert.deepEqual(oracle.roomInside(tree, { row: 3, col: 6 }), { row: 3, col: 5 });
});

test('openNeighbours ignores the S and E gaps', () => {
  assert.deepEqual(oracle.openNeighbours(tree, { row: 1, col: 1 }), [{ row: 1, col: 3 }]);
  assert.deepEqual(oracle.openNeighbours(tree, { row: 5, col: 5 }), [{ row: 5, col: 3 }]);
});

test('reachableCount counts rooms reachable from the start room', () => {
  assert.equal(oracle.reachableCount(tree), 9);
  assert.equal(oracle.reachableCount(loop), 4);
  assert.equal(oracle.reachableCount(disconnected), 3);
});

test('hasLoop detects a cycle', () => {
  assert.equal(oracle.hasLoop(tree), false);
  assert.equal(oracle.hasLoop(loop), true);
  assert.equal(oracle.hasLoop(disconnected), false);
});

test('countSolutionPaths counts simple start-room to end-room routes', () => {
  assert.equal(oracle.countSolutionPaths(tree), 1);
  assert.equal(oracle.countSolutionPaths(loop), 2);
  assert.equal(oracle.countSolutionPaths(disconnected), 1);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module './helpers/maze-oracle.js'`.

- [ ] **Step 3: Write `tests/helpers/maze-oracle.js`**

```js
'use strict';
// Independent checkers for the four maze rules. Deliberately simple and
// separate from candidate-submission.js so tests do not trust the code under test.

const PATH = '*';
const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function isRectangular(grid) {
  return Array.isArray(grid) && grid.length > 0 &&
    grid.every((row) => Array.isArray(row) && row.length === grid[0].length);
}

function rooms(grid) {
  const out = [];
  for (let row = 1; row < grid.length; row += 2) {
    for (let col = 1; col < grid[row].length; col += 2) out.push({ row, col });
  }
  return out;
}

function findChar(grid, ch) {
  for (let row = 0; row < grid.length; row++) {
    const col = grid[row].indexOf(ch);
    if (col !== -1) return { row, col };
  }
  return null;
}

// The room just inside a gap (S or E) in the outer wall.
function roomInside(grid, { row, col }) {
  if (row === 0) return { row: 1, col };
  if (row === grid.length - 1) return { row: grid.length - 2, col };
  if (col === 0) return { row, col: 1 };
  return { row, col: grid[row].length - 2 };
}

function startRoom(grid) {
  const s = findChar(grid, 'S');
  return s && roomInside(grid, s);
}

function endRoom(grid) {
  const e = findChar(grid, 'E');
  return e && roomInside(grid, e);
}

// Rooms you can step into from `room`. Only '*' doorways connect rooms;
// the S and E gaps lead outside the maze.
function openNeighbours(grid, { row, col }) {
  const out = [];
  for (const [dRow, dCol] of DIRECTIONS) {
    const nr = row + 2 * dRow;
    const nc = col + 2 * dCol;
    if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[row].length) continue;
    if (grid[row + dRow][col + dCol] === PATH) out.push({ row: nr, col: nc });
  }
  return out;
}

const key = ({ row, col }) => `${row},${col}`;

function reachableCount(grid) {
  const start = startRoom(grid);
  if (!start) return 0;
  const seen = new Set([key(start)]);
  const queue = [start];
  while (queue.length) {
    const here = queue.shift();
    for (const next of openNeighbours(grid, here)) {
      if (!seen.has(key(next))) { seen.add(key(next)); queue.push(next); }
    }
  }
  return seen.size;
}

function hasLoop(grid) {
  const seen = new Set();
  for (const root of rooms(grid)) {
    if (seen.has(key(root))) continue;
    const stack = [{ node: root, parent: null }];
    seen.add(key(root));
    while (stack.length) {
      const { node, parent } = stack.pop();
      for (const next of openNeighbours(grid, node)) {
        if (parent && key(next) === key(parent)) continue;
        if (seen.has(key(next))) return true;
        seen.add(key(next));
        stack.push({ node: next, parent: node });
      }
    }
  }
  return false;
}

function countSolutionPaths(grid) {
  const start = startRoom(grid);
  const end = endRoom(grid);
  if (!start || !end) return 0;
  const onPath = new Set();
  function walk(here) {
    if (key(here) === key(end)) return 1;
    onPath.add(key(here));
    let total = 0;
    for (const next of openNeighbours(grid, here)) {
      if (!onPath.has(key(next))) total += walk(next);
    }
    onPath.delete(key(here));
    return total;
  }
  return walk(start);
}

module.exports = {
  isRectangular, rooms, findChar, roomInside, startRoom, endRoom,
  openNeighbours, reachableCount, hasLoop, countSolutionPaths,
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: 8 tests pass.

- [ ] **Step 5: Commit, PR, merge, record**

```bash
git add tests/
git commit -m "test: add independent maze rule oracles

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-3-oracles
gh pr create --title "Task 3: maze rule oracles" --body "$(cat <<'EOF'
Independent checkers for rectangular, reachable, loop-free, and single-solution, with S/E treated as edge gaps.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`. Merge squash. Update `memory.md` Completed on `main`.

### Task 4: Playwright, screenshot script, and the pr-shots branch

Branch: `task-4-screenshots`. Claim in `memory.md` first.

**Files:**
- Create: `scripts/screenshot.mjs`, `scripts/save-shots.sh`
- Modify: `package.json` (devDependencies)

**Interfaces:**
- Produces: `npm run screenshot -- <label> [outDir]` writes `<outDir>/<label>-initial.png` and, once `generateMaze` and `drawMaze` exist, `<label>-generated-5x5.png`. `npm run save-shots -- <label>` commits shots to `pr-shots`.

- [ ] **Step 1: Install Playwright**

```bash
npm install --save-dev playwright
npx playwright install chromium
```
Expected: `package.json` devDependencies gains `"playwright": "^1.x"`; `package-lock.json` created.

- [ ] **Step 2: Write `scripts/screenshot.mjs`**

```js
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const label = process.argv[2] ?? 'shot';
const outDir = process.argv[3] ?? 'screenshots';
mkdirSync(outDir, { recursive: true });

const url = 'file://' + path.resolve('maze-game.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));
await page.goto(url);
await page.screenshot({ path: path.join(outDir, `${label}-initial.png`) });

const canGenerate = await page.evaluate(() =>
  typeof generateMaze === 'function' && typeof drawMaze === 'function' && typeof makeSeededRandom === 'function');
if (canGenerate) {
  await page.evaluate(() => {
    drawCanvas();
    drawMaze(generateMaze(5, 5, makeSeededRandom(42)), canvasWidth, canvasHeight);
  });
  await page.screenshot({ path: path.join(outDir, `${label}-generated-5x5.png`) });
}
await browser.close();
if (errors.length) {
  console.error('Page errors:', errors.join('\n'));
}
console.log(`Saved screenshots to ${outDir}`);
```

- [ ] **Step 3: Run it against the starter page**

Run: `npm run screenshot -- task-4`
Expected: `screenshots/task-4-initial.png` exists showing the teal canvas and no page errors (the stub `candidate-submission.js` already defines `drawMaze`).

- [ ] **Step 4: Create the orphan `pr-shots` branch in a worktree**

```bash
git worktree add --detach .worktrees/pr-shots
cd .worktrees/pr-shots
git checkout --orphan pr-shots
git rm -rf -q .
mkdir shots
printf '# pr-shots\n\nScreenshots of each iteration. This branch is long-lived and is NEVER merged into main.\n' > README.md
git add README.md
git commit -m "chore: start pr-shots screenshot branch

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin pr-shots
cd ../..
```
Expected: `git branch` lists `pr-shots`; `git log --oneline pr-shots` shows one commit unrelated to `main`.

- [ ] **Step 5: Write `scripts/save-shots.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
LABEL="${1:?usage: save-shots.sh <label>}"
ROOT="$(git rev-parse --show-toplevel)"
WT="$ROOT/.worktrees/pr-shots"
BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)"

if [ ! -d "$WT" ]; then
  git -C "$ROOT" fetch origin pr-shots:pr-shots || true
  git -C "$ROOT" worktree add "$WT" pr-shots
fi

DEST="$WT/shots/$(date +%Y%m%d-%H%M%S)-${BRANCH//\//-}-$LABEL"
mkdir -p "$DEST"
node "$ROOT/scripts/screenshot.mjs" "$LABEL" "$DEST"

git -C "$WT" add shots
git -C "$WT" commit -m "shots: $BRANCH $LABEL"
git -C "$WT" push -u origin pr-shots
echo "Saved to $DEST"
git -C "$WT" rev-parse --short HEAD
```

```bash
chmod +x scripts/save-shots.sh
```

- [ ] **Step 6: Run save-shots once end to end**

Run: `npm run save-shots -- task-4-setup`
Expected: prints `Saved to .../shots/<timestamp>-task-4-screenshots-task-4-setup` and a commit hash; `git log --oneline pr-shots` shows two commits.

- [ ] **Step 7: Commit, PR, merge, record**

```bash
git add package.json package-lock.json scripts/
git commit -m "chore: add playwright screenshot tooling and pr-shots workflow

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-4-screenshots
gh pr create --title "Task 4: screenshot tooling and pr-shots branch" --body "$(cat <<'EOF'
Playwright dev dependency, screenshot script, save-shots script, orphan pr-shots branch.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `code-reviewer`. Merge squash. Update `memory.md` Completed on `main`.

### Task 5: File skeleton, constants, `mazeTiny`, seeded random

Branch: `task-5-skeleton`. Claim in `memory.md` first.

**Files:**
- Modify: `candidate-submission.js` (replace whole file; keep the three required `const` names)
- Create: `tests/random.test.js`

**Interfaces:**
- Produces: `WALL = '#'`, `PATH = '*'`, `START = 'S'`, `END = 'E'`, `STEP_DIRECTIONS`, `mazeTiny` (the 3 x 3 example), `makeSeededRandom(seed) -> () => number in [0, 1)`; section stubs for 3, 4, 5, 6, 7; the Node export block.

- [ ] **Step 1: Write the failing test**

`tests/random.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeSeededRandom, WALL, PATH, START, END, STEP_DIRECTIONS, mazeTiny } = require('../candidate-submission.js');

test('constants are the four format characters', () => {
  assert.deepEqual([WALL, PATH, START, END], ['#', '*', 'S', 'E']);
  assert.deepEqual(STEP_DIRECTIONS, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
});

test('mazeTiny is a 7 x 7 array of arrays with S on the top edge and E on the bottom edge', () => {
  assert.equal(mazeTiny.length, 7);
  assert.ok(mazeTiny.every((row) => Array.isArray(row) && row.length === 7));
  assert.equal(mazeTiny[0][1], 'S');
  assert.equal(mazeTiny[6][5], 'E');
});

test('seeded random is deterministic and in [0, 1)', () => {
  const a = makeSeededRandom(7);
  const b = makeSeededRandom(7);
  const seqA = Array.from({ length: 20 }, () => a());
  const seqB = Array.from({ length: 20 }, () => b());
  assert.deepEqual(seqA, seqB);
  assert.ok(seqA.every((n) => n >= 0 && n < 1));
  assert.notDeepEqual(seqA, Array.from({ length: 20 }, makeSeededRandom(8)));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, `makeSeededRandom is not a function`.

- [ ] **Step 3: Rewrite `candidate-submission.js`**

```js
/* =============================================================================
 * SECTION 1 — MAZE DATA FORMAT
 * =============================================================================
 * A maze is a grid of single characters: an array of rows, each row an array
 * of characters.  Only four characters are used:
 *
 *   '#'  wall
 *   '*'  open space (a room, or an open doorway between two rooms)
 *   'S'  the entrance: a gap in the outer wall where the player comes in
 *   'E'  the exit: a gap in the outer wall where the player leaves
 *
 * Rooms and walls take turns.  A maze that is W rooms wide and H rooms tall is
 * stored as a grid of (2*H + 1) rows and (2*W + 1) columns.  Counting rows and
 * columns from 0 at the top-left:
 *
 *   odd row,  odd col   -> a ROOM (always '*')
 *   odd row,  even col  -> the wall/doorway between two side-by-side rooms
 *   even row, odd col   -> the wall/doorway between two stacked rooms
 *   even row, even col  -> a POST where walls meet (always '#')
 *   the outer ring (first/last row and column) is '#' everywhere except for
 *   exactly one 'S' and one 'E', each in an edge doorway slot (never a corner)
 *
 * Example, 3 rooms by 3 rooms (7 x 7 grid):
 *
 *   col: 0 1 2 3 4 5 6
 *   r0:  # S # # # # #    S = the gap above the top-left room
 *   r1:  # * * * # * #    rooms at cols 1, 3, 5; '*' at col 2 = open doorway
 *   r2:  # # # * # * #    doorways between r1 and r3 at cols 1, 3, 5
 *   r3:  # * * * * * #
 *   r4:  # * # # # # #
 *   r5:  # * * * * * #
 *   r6:  # # # # # E #    E = the gap below the bottom-right room
 *
 * Rows may also be written as strings ('#S#####'); parseMaze converts them.
 * Positions in code are { row, col } grid indices.  The player is always in a
 * room (odd row, odd col) except for the winning move into the E gap.
 */
const WALL = '#';
const PATH = '*';
const START = 'S';
const END = 'E';

// Up, down, left, right as [dRow, dCol].  Used by generation, parsing and movement.
const STEP_DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/**
 * mazeTiny - A 3 x 3 room maze in the format above (the example from the
 * comment).  The take-home's "assignment document" is not in this repo;
 * replace these rows with the real Tiny Maze if you have it.  Nothing else
 * needs to change.
 */
const mazeTiny = [
  ['#', 'S', '#', '#', '#', '#', '#'],
  ['#', '*', '*', '*', '#', '*', '#'],
  ['#', '#', '#', '*', '#', '*', '#'],
  ['#', '*', '*', '*', '*', '*', '#'],
  ['#', '*', '#', '#', '#', '#', '#'],
  ['#', '*', '*', '*', '*', '*', '#'],
  ['#', '#', '#', '#', '#', 'E', '#'],
];

/* =============================================================================
 * SECTION 2 — RANDOM NUMBERS
 * =============================================================================
 * generateMaze accepts any function that returns a number in [0, 1).  The page
 * uses Math.random; tests use makeSeededRandom so results are reproducible.
 * (mulberry32, a small well-known 32-bit generator.)
 */
function makeSeededRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* =============================================================================
 * SECTION 3 — MAZE GENERATION  (implemented in Task 6)
 * ============================================================================= */

/* =============================================================================
 * SECTION 4 — PARSING AND VALIDATION  (implemented in Task 7)
 * ============================================================================= */

/* =============================================================================
 * SECTION 5 — LAYOUT: grid positions -> pixels  (implemented in Task 9)
 * ============================================================================= */

/* =============================================================================
 * SECTION 6 — DRAWING  (implemented in Task 11)
 * ============================================================================= */
/**
 * Draws the maze grid and initial player avatar onto the canvas.
 *
 * @param {Array} mazeData - The maze in the format described in Section 1.
 * @param {number} width - The pixel width of the canvas.
 * @param {number} height - The pixel height of the canvas.
 */
const drawMaze = function (mazeData, width, height) {};

/* =============================================================================
 * SECTION 7 — MOVEMENT  (movePlayer in Task 12, onKeyDown in Task 13)
 * ============================================================================= */
/**
 * Handles keyboard arrow key input to move the player within the maze.
 *
 * @param {KeyboardEvent} evt - The keyboard event corresponding to the key pressed.
 */
const onKeyDown = function (evt) {};

/* =============================================================================
 * SECTION 8 — EXPORTS FOR NODE TESTS
 * =============================================================================
 * In the browser `module` is undefined so this block does nothing.  Each task
 * adds its own names to this object; on a merge conflict keep both sides.
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WALL, PATH, START, END, STEP_DIRECTIONS, mazeTiny, makeSeededRandom,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: all tests pass. Also open `maze-game.html` in a browser: teal canvas, no console errors.

- [ ] **Step 5: Commit, PR, merge, record**

```bash
git add candidate-submission.js tests/random.test.js
git commit -m "feat: document maze format, add constants, mazeTiny and seeded random

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-5-skeleton
gh pr create --title "Task 5: file skeleton, format docs, mazeTiny, seeded random" --body "$(cat <<'EOF'
Rewrites candidate-submission.js into numbered sections with the format documented, constants, mazeTiny (S/E as edge gaps), mulberry32 seeded random, stubs for later sections, and the Node export block.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`. Merge squash. Update `memory.md`: T5 Completed; if T2, T3, T4 are also complete, mark Phase 0 done.

---

# Phase 1 — Maze generation

### Task 6: `generateMaze`

Branch: `task-6-generate`. Needs T3 and T5 merged. Claim in `memory.md` first.

**Files:**
- Modify: `candidate-submission.js` (replace the Section 3 stub, extend exports)
- Create: `tests/generate-maze.test.js`

**Interfaces:**
- Consumes: `WALL`, `PATH`, `START`, `END`, `STEP_DIRECTIONS`, `makeSeededRandom`.
- Produces: `generateMaze(width, height, random = Math.random) -> string[][]`. Throws `RangeError` for non-integer sizes or sizes below 1.

- [ ] **Step 1: Write the failing tests**

`tests/generate-maze.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateMaze, makeSeededRandom, WALL, PATH } = require('../candidate-submission.js');
const oracle = require('./helpers/maze-oracle.js');

const SIZES = [[1, 1], [1, 2], [2, 1], [2, 2], [5, 5], [1, 10], [10, 1], [8, 3], [20, 20], [50, 50]];
const SEEDS = [1, 2, 3, 4, 5];

function assertPerfectMaze(grid, width, height, label) {
  assert.equal(grid.length, 2 * height + 1, `${label}: row count`);
  assert.ok(oracle.isRectangular(grid), `${label}: rectangular`);
  assert.equal(grid[0].length, 2 * width + 1, `${label}: col count`);
  for (const { row, col } of oracle.rooms(grid)) assert.equal(grid[row][col], PATH, `${label}: room (${row},${col}) is *`);
  assert.equal(oracle.reachableCount(grid), width * height, `${label}: all rooms reachable`);
  assert.equal(oracle.hasLoop(grid), false, `${label}: no loops`);
  assert.equal(oracle.countSolutionPaths(grid), 1, `${label}: exactly one solution`);
}

test('every generated maze obeys the four rules', () => {
  for (const [width, height] of SIZES) {
    for (const seed of SEEDS) {
      const grid = generateMaze(width, height, makeSeededRandom(seed));
      assertPerfectMaze(grid, width, height, `${width}x${height} seed ${seed}`);
    }
  }
});

test('S is the gap above the top-left room and E the gap below the bottom-right room', () => {
  const grid = generateMaze(5, 3, makeSeededRandom(1));
  assert.deepEqual(oracle.findChar(grid, 'S'), { row: 0, col: 1 });
  assert.deepEqual(oracle.findChar(grid, 'E'), { row: 6, col: 9 });
  assert.deepEqual(oracle.startRoom(grid), { row: 1, col: 1 });
  assert.deepEqual(oracle.endRoom(grid), { row: 5, col: 9 });
});

test('outer ring and posts are walls except the two gaps', () => {
  const grid = generateMaze(4, 4, makeSeededRandom(9));
  const rows = grid.length;
  const cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const edge = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
      const post = r % 2 === 0 && c % 2 === 0;
      const gap = (r === 0 && c === 1) || (r === rows - 1 && c === cols - 2);
      if ((edge || post) && !gap) assert.equal(grid[r][c], WALL, `(${r},${c})`);
    }
  }
});

test('same seed gives same maze, different seed gives different maze', () => {
  const a = generateMaze(5, 5, makeSeededRandom(42));
  const b = generateMaze(5, 5, makeSeededRandom(42));
  const c = generateMaze(5, 5, makeSeededRandom(43));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test('default random source works without a seed', () => {
  assertPerfectMaze(generateMaze(6, 6), 6, 6, 'Math.random');
});

test('rejects sizes that cannot form a maze', () => {
  for (const [w, h] of [[0, 5], [5, 0], [2.5, 3], [-2, 3], ['5', 5]]) {
    assert.throws(() => generateMaze(w, h), RangeError, `${w}x${h}`);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, `generateMaze is not a function`.

- [ ] **Step 3: Replace the Section 3 stub in `candidate-submission.js` and export**

```js
/* =============================================================================
 * SECTION 3 — MAZE GENERATION  ("digger with a ball of string")
 * =============================================================================
 * 1. Build the grid with every room open and every doorway bricked up.
 * 2. Put the digger in the top-left room and mark it visited.
 * 3. Repeat: look at the four neighbouring rooms.  If any is unvisited, pick
 *    one at random, knock down the wall between, step in, and remember the way
 *    back (the stack is the ball of string).  If none, step back one room.
 * 4. When the stack is empty every room has been visited.  Cut the S gap in
 *    the top wall and the E gap in the bottom wall.
 *
 * A wall is only ever knocked down into a room nobody has visited, so each
 * room gets exactly one entrance: no loops, everything reachable, one solution.
 * The S and E gaps lead outside, not to another room, so they add no loops.
 */

/**
 * @param {number} width  - rooms across (integer >= 1)
 * @param {number} height - rooms down  (integer >= 1)
 * @param {() => number} [random=Math.random] - returns a number in [0, 1)
 * @returns {string[][]} grid of (2*height+1) rows by (2*width+1) columns
 */
function generateMaze(width, height, random = Math.random) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new RangeError(`Maze size must be whole numbers >= 1; got ${width} x ${height}`);
  }
  const rows = 2 * height + 1;
  const cols = 2 * width + 1;

  // Step 1: all walls, then open every room.
  const grid = Array.from({ length: rows }, () => Array(cols).fill(WALL));
  for (let r = 1; r < rows; r += 2) {
    for (let c = 1; c < cols; c += 2) grid[r][c] = PATH;
  }

  // Step 2: the digger starts top-left.
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack = [[1, 1]];
  visited[1][1] = true;

  // Step 3: carve until the string is fully rewound.
  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const candidates = [];
    for (const [dRow, dCol] of STEP_DIRECTIONS) {
      const nr = r + 2 * dRow;
      const nc = c + 2 * dCol;
      if (nr > 0 && nr < rows && nc > 0 && nc < cols && !visited[nr][nc]) candidates.push([nr, nc]);
    }
    if (candidates.length === 0) {
      stack.pop(); // dead end: walk back along the string
      continue;
    }
    const [nr, nc] = candidates[Math.floor(random() * candidates.length)];
    grid[(r + nr) / 2][(c + nc) / 2] = PATH; // knock down the wall between the two rooms
    visited[nr][nc] = true;
    stack.push([nr, nc]);
  }

  // Step 4: cut the entrance and exit gaps in the outer wall.
  grid[0][1] = START;             // above the top-left room
  grid[rows - 1][cols - 2] = END; // below the bottom-right room
  return grid;
}
```

Section 8: add `generateMaze,` on its own line inside the exports object.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: all pass, including the 50 x 50 cases (well under a second).

- [ ] **Step 5: Commit, PR, gate, merge, record**

```bash
git add candidate-submission.js tests/generate-maze.test.js
git commit -m "feat: generate perfect random mazes with recursive backtracker

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-6-generate
gh pr create --title "Task 6 (Phase 1): maze generation" --body "$(cat <<'EOF'
generateMaze (recursive backtracker) with S/E gaps cut in the outer wall. Tests prove all four maze rules across 10 sizes x 5 seeds.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`. Merge squash. Update `memory.md`: T6 Completed, Phase 1 done.

---

# Phase 2 — Parsing

### Task 7: `parseMaze`, `analyzeMaze`, `roomInside`

Branch: `task-7-parse`. Needs T5 merged (can run alongside T6). Claim in `memory.md` first.

**Files:**
- Modify: `candidate-submission.js` (replace the Section 4 stub, extend exports)
- Create: `tests/parse-maze.test.js`

**Interfaces:**
- Consumes: constants, `STEP_DIRECTIONS`.
- Produces:
  - `parseMaze(mazeData) -> { grid, rows, cols, start, end, startRoom, endRoom }`; throws `Error` with a human-readable message.
  - `roomInside(gap, rows, cols) -> {row, col}`.
  - `analyzeMaze({ grid, rows, cols, startRoom }) -> { cellCount, passageCount, reachableCount, isTree }`.

- [ ] **Step 1: Write the failing tests**

`tests/parse-maze.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseMaze, analyzeMaze, roomInside } = require('../candidate-submission.js');

const good = [
  '#S#####',
  '#***#*#',
  '###*#*#',
  '#*****#',
  '#*#####',
  '#*****#',
  '#####E#',
];

test('accepts rows as strings and returns grid, size, gaps and rooms inside them', () => {
  const parsed = parseMaze(good);
  assert.equal(parsed.rows, 7);
  assert.equal(parsed.cols, 7);
  assert.deepEqual(parsed.start, { row: 0, col: 1 });
  assert.deepEqual(parsed.end, { row: 6, col: 5 });
  assert.deepEqual(parsed.startRoom, { row: 1, col: 1 });
  assert.deepEqual(parsed.endRoom, { row: 5, col: 5 });
  assert.deepEqual(parsed.grid[1], ['#', '*', '*', '*', '#', '*', '#']);
});

test('accepts rows as arrays and does not mutate the input', () => {
  const input = good.map((row) => row.split(''));
  const copy = JSON.parse(JSON.stringify(input));
  parseMaze(input);
  assert.deepEqual(input, copy);
});

test('gaps may be on any edge', () => {
  const sideGaps = [
    '#####',
    'S***#',
    '###*#',
    '#***E',
    '#####',
  ];
  const parsed = parseMaze(sideGaps);
  assert.deepEqual(parsed.startRoom, { row: 1, col: 1 });
  assert.deepEqual(parsed.endRoom, { row: 3, col: 3 });
});

test('roomInside maps each edge to the adjacent room', () => {
  assert.deepEqual(roomInside({ row: 0, col: 3 }, 7, 7), { row: 1, col: 3 });
  assert.deepEqual(roomInside({ row: 6, col: 3 }, 7, 7), { row: 5, col: 3 });
  assert.deepEqual(roomInside({ row: 3, col: 0 }, 7, 7), { row: 3, col: 1 });
  assert.deepEqual(roomInside({ row: 3, col: 6 }, 7, 7), { row: 3, col: 5 });
});

test('analyzeMaze reports counts for a tree', () => {
  const stats = analyzeMaze(parseMaze(good));
  assert.deepEqual(stats, { cellCount: 9, passageCount: 8, reachableCount: 9, isTree: true });
});

const cases = [
  ['not an array', 'nope', /array/i],
  ['too few rows', ['#S#', '#*#'], /at least 3|odd/i],
  ['ragged rows', ['#S###', '#***#', '####', '#***#', '###E#'], /row 2 has 4/i],
  ['even width', ['#S####', '#****#', '####E#'], /odd/i],
  ['hole in outer wall', ['#S###', '#****', '###E#'], /row 1, column 4 .*outer edge/i],
  ['post not a wall', ['#S###', '#***#', '#***#', '#***#', '###E#'], /post/i],
  ['missing S', ['#####', '#***#', '###E#'], /exactly one S/i],
  ['two E', ['#S###', '#***#', '###*#', '#***#', '#E#E#'], /more than one E/i],
  ['S placed in a room', ['#####', '#S**#', '###*#', '#***#', '###E#'], /room and must be \*/i],
  ['S in an inner doorway', ['#####', '#*S*#', '###*#', '#***#', '###E#'], /gap in the outer wall/i],
  ['unknown character', ['#S###', '#***#', '#x###', '#***#', '###E#'], /doorway .* Found "x"/i],
  ['room contains wall', ['#S#####', '#*##**#', '#####E#'], /room and must be \*.* Found "#"/i],
  ['loop', ['#S###', '#***#', '#*#*#', '#***#', '###E#'], /loop/i],
  ['unreachable room', ['#S###', '#***#', '###*#', '#*#*#', '###E#'], /1 room\(s\) cannot be reached/i],
];

for (const [name, input, pattern] of cases) {
  test(`rejects ${name}`, () => {
    assert.throws(() => parseMaze(input), pattern);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, `parseMaze is not a function`.

- [ ] **Step 3: Replace the Section 4 stub and export**

```js
/* =============================================================================
 * SECTION 4 — PARSING AND VALIDATION
 * =============================================================================
 * parseMaze turns pasted maze data into a checked, normalised object.  Every
 * error message names the row/column and says what was expected so a
 * curriculum developer can fix a typo without reading code.
 */

/** The room just inside a gap (S or E) in the outer wall. */
function roomInside({ row, col }, rows, cols) {
  if (row === 0) return { row: 1, col };
  if (row === rows - 1) return { row: rows - 2, col };
  if (col === 0) return { row, col: 1 };
  return { row, col: cols - 2 };
}

/**
 * @param {Array<string|string[]>} mazeData
 * @returns {{grid: string[][], rows: number, cols: number,
 *            start: {row:number,col:number}, end: {row:number,col:number},
 *            startRoom: {row:number,col:number}, endRoom: {row:number,col:number}}}
 */
function parseMaze(mazeData) {
  if (!Array.isArray(mazeData)) throw new Error('Maze must be an array of rows.');
  const grid = mazeData.map((row, r) => {
    if (typeof row === 'string') return row.split('');
    if (Array.isArray(row)) return row.map(String);
    throw new Error(`Row ${r} must be an array of characters or a string.`);
  });
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  grid.forEach((row, r) => {
    if (row.length !== cols) {
      throw new Error(`Row ${r} has ${row.length} items but row 0 has ${cols}. Every row must be the same length.`);
    }
  });
  if (rows < 3 || cols < 3 || rows % 2 === 0 || cols % 2 === 0) {
    throw new Error(`Maze must have an odd number of rows and columns, at least 3 each (2*height+1 by 2*width+1). Got ${rows} x ${cols}.`);
  }

  let start = null;
  let end = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      const onEdge = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
      const isPost = r % 2 === 0 && c % 2 === 0; // includes the four corners
      const isRoom = r % 2 === 1 && c % 2 === 1;
      if (isPost) {
        if (ch !== WALL) throw new Error(`Row ${r}, column ${c} must be a wall (#) because it is a post where walls meet. Found "${ch}".`);
      } else if (isRoom) {
        if (ch !== PATH) throw new Error(`Row ${r}, column ${c} is a room and must be *. Found "${ch}". (S and E go in the outer wall, not in a room.)`);
      } else if (ch === START || ch === END) {
        if (!onEdge) throw new Error(`Row ${r}, column ${c}: ${ch} must be a gap in the outer wall, not a doorway inside the maze.`);
        if (ch === START) {
          if (start) throw new Error('Found more than one S. A maze needs exactly one S (entrance).');
          start = { row: r, col: c };
        } else {
          if (end) throw new Error('Found more than one E. A maze needs exactly one E (exit).');
          end = { row: r, col: c };
        }
      } else if (onEdge) {
        if (ch !== WALL) throw new Error(`Row ${r}, column ${c} must be a wall (#) because it is on the outer edge; only S and E may open the outer wall. Found "${ch}".`);
      } else if (ch !== WALL && ch !== PATH) {
        throw new Error(`Row ${r}, column ${c} is a doorway and must be # (wall) or * (open). Found "${ch}".`);
      }
    }
  }
  if (!start) throw new Error('A maze needs exactly one S (entrance) in the outer wall. None found.');
  if (!end) throw new Error('A maze needs exactly one E (exit) in the outer wall. None found.');

  const parsed = {
    grid, rows, cols, start, end,
    startRoom: roomInside(start, rows, cols),
    endRoom: roomInside(end, rows, cols),
  };
  const stats = analyzeMaze(parsed);
  if (stats.reachableCount !== stats.cellCount) {
    throw new Error(`${stats.cellCount - stats.reachableCount} room(s) cannot be reached from S. Every room must be reachable.`);
  }
  if (!stats.isTree) {
    throw new Error('Maze contains a loop. There must be exactly one route between any two rooms.');
  }
  return parsed;
}

/**
 * Counts rooms, open doorways, and rooms reachable from the start room.  A
 * connected maze with exactly (rooms - 1) doorways is a tree: no loops, one
 * route anywhere.  Only '*' doorways connect rooms; S and E lead outside.
 */
function analyzeMaze({ grid, rows, cols, startRoom }) {
  const cellCount = ((rows - 1) / 2) * ((cols - 1) / 2);
  let passageCount = 0;
  for (let r = 1; r < rows; r += 2) {
    for (let c = 1; c < cols; c += 2) {
      if (c + 2 < cols && grid[r][c + 1] === PATH) passageCount++;
      if (r + 2 < rows && grid[r + 1][c] === PATH) passageCount++;
    }
  }
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const queue = [[startRoom.row, startRoom.col]];
  seen[startRoom.row][startRoom.col] = true;
  let reachableCount = 0;
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    reachableCount++;
    for (const [dRow, dCol] of STEP_DIRECTIONS) {
      const nr = r + 2 * dRow;
      const nc = c + 2 * dCol;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      if (grid[r + dRow][c + dCol] === PATH && !seen[nr][nc]) {
        seen[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  return { cellCount, passageCount, reachableCount, isTree: reachableCount === cellCount && passageCount === cellCount - 1 };
}
```

Section 8: add `parseMaze, analyzeMaze, roomInside,` on its own line.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: all pass. If a regex in the `cases` table does not match your message wording, fix the message, not the test, unless the message is clearer.

- [ ] **Step 5: Commit, PR, gate, merge, record**

```bash
git add candidate-submission.js tests/parse-maze.test.js
git commit -m "feat: parse and validate maze data with friendly errors

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-7-parse
gh pr create --title "Task 7 (Phase 2): parse and validate maze data" --body "$(cat <<'EOF'
parseMaze/analyzeMaze/roomInside with row/column-specific error messages. S and E must be gaps in the outer wall; rooms must be *. Rejects ragged, even-sized, loop, and unreachable mazes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`. Merge squash (resolve the exports block as the union if T6 landed first). Update `memory.md`.

### Task 8: `mazeTiny` cross-checks and parser-generator agreement

Branch: `task-8-tiny`. Needs T6 and T7 merged. Claim in `memory.md` first.

**Files:**
- Create: `tests/maze-tiny.test.js`

- [ ] **Step 1: Write the tests (expected to pass immediately; they pin the contract between tasks)**

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mazeTiny, parseMaze, generateMaze, makeSeededRandom } = require('../candidate-submission.js');
const oracle = require('./helpers/maze-oracle.js');

test('mazeTiny parses and obeys the four maze rules', () => {
  assert.ok(oracle.isRectangular(mazeTiny));
  const parsed = parseMaze(mazeTiny);
  assert.deepEqual(parsed.startRoom, { row: 1, col: 1 });
  assert.deepEqual(parsed.endRoom, { row: 5, col: 5 });
  assert.equal(oracle.reachableCount(mazeTiny), oracle.rooms(mazeTiny).length);
  assert.equal(oracle.hasLoop(mazeTiny), false);
  assert.equal(oracle.countSolutionPaths(mazeTiny), 1);
});

test('the parser accepts every generated maze and agrees on the rooms inside the gaps', () => {
  for (const [w, h] of [[1, 1], [1, 2], [5, 5], [50, 50]]) {
    const grid = generateMaze(w, h, makeSeededRandom(3));
    const parsed = parseMaze(grid);
    assert.deepEqual(parsed.startRoom, oracle.startRoom(grid));
    assert.deepEqual(parsed.endRoom, oracle.endRoom(grid));
  }
});
```

- [ ] **Step 2: Run** `npm test` → all pass. If not, the failure is a real disagreement between T6 and T7; fix the production code and log the gotcha in `memory.md`.

- [ ] **Step 3: Commit, PR, gate, merge, record**

```bash
git add tests/maze-tiny.test.js
git commit -m "test: pin mazeTiny and parser-generator agreement

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-8-tiny
gh pr create --title "Task 8 (Phase 2): mazeTiny and cross-checks" --body "$(cat <<'EOF'
Tests that mazeTiny obeys the format and rules and that parseMaze accepts generated mazes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`. Merge squash. Update `memory.md`: Phase 2 done.

---

# Phase 3 — Rendering

### Task 9: `computeLayout`

Branch: `task-9-layout`. Needs T5 merged (can run alongside T6, T7, T12). Claim in `memory.md` first.

**Files:**
- Modify: `candidate-submission.js` (replace the Section 5 stub, export)
- Create: `tests/layout.test.js`

**Interfaces:**
- Produces: `PADDING = 20`, `WALL_RATIO = 0.25`, `computeLayout(rows, cols, width, height) -> { cellSize, wallSize, colX, rowY, totalWidth, totalHeight, originX, originY }`, `tileSize(layout, index) -> number`.

- [ ] **Step 1: Write the failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { computeLayout, tileSize, PADDING } = require('../candidate-submission.js');

test('layout fits inside the canvas minus padding and is centred', () => {
  for (const [rows, cols] of [[11, 11], [7, 7], [3, 21], [101, 101], [5, 101], [3, 3]]) {
    const L = computeLayout(rows, cols, 700, 700);
    assert.ok(L.totalWidth <= 700 - 2 * PADDING, `${rows}x${cols} width`);
    assert.ok(L.totalHeight <= 700 - 2 * PADDING, `${rows}x${cols} height`);
    assert.equal(L.originX, Math.floor((700 - L.totalWidth) / 2));
    assert.equal(L.originY, Math.floor((700 - L.totalHeight) / 2));
    assert.ok(L.cellSize >= 1 && L.wallSize >= 1);
  }
});

test('odd indices are rooms and even indices are walls', () => {
  const L = computeLayout(11, 11, 700, 700);
  assert.equal(tileSize(L, 0), L.wallSize);
  assert.equal(tileSize(L, 1), L.cellSize);
  assert.equal(L.colX[1], L.wallSize);
  assert.equal(L.colX[2], L.wallSize + L.cellSize);
  assert.equal(L.colX.length, 11);
  assert.equal(L.rowY.length, 11);
  assert.equal(L.totalWidth, L.colX[10] + L.wallSize);
});

test('walls are a quarter of a room', () => {
  const L = computeLayout(11, 11, 700, 700);
  assert.equal(L.wallSize, Math.round(L.cellSize * 0.25));
});

test('a wide canvas does not stretch a maze taller than the canvas allows', () => {
  const wide = computeLayout(11, 21, 1000, 400);
  assert.ok(wide.totalHeight <= 400 - 2 * PADDING);
  assert.ok(wide.totalWidth <= 1000 - 2 * PADDING);
});
```

- [ ] **Step 2: Run to verify it fails** → `computeLayout is not a function`.

- [ ] **Step 3: Replace the Section 5 stub**

```js
/* =============================================================================
 * SECTION 5 — LAYOUT: grid positions -> pixels
 * =============================================================================
 * Rooms are square; walls are thinner (WALL_RATIO of a room).  colX[i] / rowY[i]
 * give the pixel offset of grid column / row i from the maze's top-left corner,
 * so drawing and the avatar share one piece of arithmetic.
 */
const PADDING = 20;      // pixels of breathing room around the maze
const WALL_RATIO = 0.25; // wall thickness as a fraction of a room

function tileSize(layout, index) {
  return index % 2 === 0 ? layout.wallSize : layout.cellSize;
}

function computeLayout(rows, cols, width, height) {
  const cellsWide = (cols - 1) / 2;
  const cellsTall = (rows - 1) / 2;
  const unitsX = cellsWide + (cellsWide + 1) * WALL_RATIO;
  const unitsY = cellsTall + (cellsTall + 1) * WALL_RATIO;
  const cellSize = Math.max(1, Math.floor(Math.min((width - 2 * PADDING) / unitsX, (height - 2 * PADDING) / unitsY)));
  const wallSize = Math.max(1, Math.round(cellSize * WALL_RATIO));
  const layout = { cellSize, wallSize, colX: [], rowY: [] };
  let x = 0;
  for (let c = 0; c < cols; c++) { layout.colX.push(x); x += tileSize(layout, c); }
  let y = 0;
  for (let r = 0; r < rows; r++) { layout.rowY.push(y); y += tileSize(layout, r); }
  layout.totalWidth = x;
  layout.totalHeight = y;
  layout.originX = Math.floor((width - x) / 2);
  layout.originY = Math.floor((height - y) / 2);
  return layout;
}
```
Section 8: add `PADDING, WALL_RATIO, computeLayout, tileSize,` on its own line.

- [ ] **Step 4: Run to verify it passes; commit, PR, gate, merge, record**

```bash
git add candidate-submission.js tests/layout.test.js
git commit -m "feat: compute pixel layout for maze grid

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-9-layout
gh pr create --title "Task 9 (Phase 3): grid-to-pixel layout" --body "$(cat <<'EOF'
computeLayout/tileSize: thin walls (1/4 room), fits canvas minus padding, centred.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`. Merge squash. Update `memory.md`.

### Task 10: Page controls and Generate button

Branch: `task-10-controls`. Needs T4 and T6 merged. Claim in `memory.md` first.

**Files:**
- Modify: `maze-game.html` (controls block + CSS)
- Modify: `maze-game.js` (Generate listener, `readSize`)
- Create: `tests/e2e/controls.test.mjs`

**Interfaces:**
- Produces: inputs `#mazeWidth`, `#mazeHeight` (default 5, min 2, max 50), button `#generateBtn`; `readSize(input) -> number` in `maze-game.js` (blank or non-numeric gives 5; otherwise floor then clamp to 2..50); on click, `drawCanvas()` then `drawMaze(generateMaze(w, h), canvasWidth, canvasHeight)`; the button blurs itself.

- [ ] **Step 1: Write the failing acceptance test**

`tests/e2e/controls.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const url = 'file://' + path.resolve('maze-game.html');

async function withPage(fn) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  try { await fn(page, errors); } finally { await browser.close(); }
}

test('controls exist with defaults of 5 x 5 and help text', async () => {
  await withPage(async (page, errors) => {
    assert.equal(await page.inputValue('#mazeWidth'), '5');
    assert.equal(await page.inputValue('#mazeHeight'), '5');
    assert.match(await page.textContent('#controls'), /Generate/);
    assert.match(await page.textContent('#controls'), /arrow keys/i);
    assert.deepEqual(errors, []);
  });
});

test('Generate runs without errors and shows clamped values back in the inputs', async () => {
  await withPage(async (page, errors) => {
    for (const [w, h, expectW, expectH] of [
      ['8', '3', '8', '3'],
      ['0', '-3', '2', '2'],
      ['999', '2.5', '50', '2'],
      ['', '', '5', '5'],
    ]) {
      await page.fill('#mazeWidth', w);
      await page.fill('#mazeHeight', h);
      await page.click('#generateBtn');
      assert.equal(await page.inputValue('#mazeWidth'), expectW, `width ${w}`);
      assert.equal(await page.inputValue('#mazeHeight'), expectH, `height ${h}`);
    }
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:e2e`
Expected: FAIL, `#mazeWidth` not found.

- [ ] **Step 3: Update `maze-game.html`**

Replace the body with:
```html
<body>

  <div id="title">Maze Game</div>

  <div id="controls">
    <p>
      Pick a maze size in cells and press <strong>Generate</strong> for a brand-new random maze.
      Use the arrow keys to move the blue dot in through the <strong>S</strong> gap and out through the <strong>E</strong> gap.
    </p>
    <label>Width <input id="mazeWidth" type="number" min="2" max="50" value="5"></label>
    <label>Height <input id="mazeHeight" type="number" min="2" max="50" value="5"></label>
    <button id="generateBtn" type="button">Generate</button>
  </div>

  <div id="mazeContainer">
    <!-- Change the width and height below to test different canvas sizes  -->
    <canvas id="mazeCanvas" width=700 height=700></canvas>
  </div>

</body>
```
Add to the `<style>` block:
```css
    #controls {
      text-align: center;
      font: 16px sans-serif;
      margin-bottom: 12px;
    }
    #controls input {
      width: 4em;
      margin: 0 12px 0 4px;
    }
```

- [ ] **Step 4: Update `maze-game.js`**

Replace the `load` listener with:
```js
const MIN_SIZE = 2;
const MAX_SIZE = 50;
const DEFAULT_SIZE = 5;

// Reads a number input, falling back to the default and clamping to the allowed range.
const readSize = function(input) {
  if (input.value.trim() === '') return DEFAULT_SIZE;
  const n = Math.floor(Number(input.value));
  if (!Number.isFinite(n)) return DEFAULT_SIZE;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, n));
};

window.addEventListener('load', function() {
  canvas = document.getElementById("mazeCanvas");
  ctx = canvas.getContext("2d");
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  drawCanvas();
  drawMaze(mazeTiny, canvasWidth, canvasHeight);

  document.getElementById("generateBtn").addEventListener('click', function() {
    const widthInput = document.getElementById("mazeWidth");
    const heightInput = document.getElementById("mazeHeight");
    const width = readSize(widthInput);
    const height = readSize(heightInput);
    widthInput.value = width;   // show the clamped value back to the user
    heightInput.value = height;
    drawCanvas();
    drawMaze(generateMaze(width, height), canvasWidth, canvasHeight);
    this.blur(); // so arrow keys go to the maze, not the button
  });
});
```
Keep `drawCanvas` and the keydown listener as they are.

- [ ] **Step 5: Run tests**

Run: `npm test && npm run test:e2e` → all pass.

- [ ] **Step 6: Commit, PR, gate, merge, record**

```bash
git add maze-game.html maze-game.js tests/e2e/controls.test.mjs
git commit -m "feat: add maze size inputs and Generate button

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-10-controls
gh pr create --title "Task 10 (Phase 3): size controls and Generate button" --body "$(cat <<'EOF'
Width/Height inputs (default 5, clamped 2..50) and a Generate button wired in maze-game.js.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`. Merge squash. Update `memory.md`.

### Task 11: `drawMaze` and rendering

Branch: `task-11-draw`. Needs T7, T9, T10 merged. Claim in `memory.md` first.

**Files:**
- Modify: `candidate-submission.js` Section 6 (replace stub; add `gameState`, `render`, helpers, `mazeDebug`)
- Create: `tests/e2e/render.test.mjs`

**Interfaces:**
- Consumes: `parseMaze`, `computeLayout`, `tileSize`, `PADDING`.
- Produces: `drawMaze(mazeData, width, height)`; `render(state)`; module-level `let gameState = null` shaped `{ maze, layout, player: {row, col}, won }`; `window.mazeDebug()` returns `gameState`.

- [ ] **Step 1: Write the failing acceptance test**

`tests/e2e/render.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const url = 'file://' + path.resolve('maze-game.html');

async function withPage(fn) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  try { await fn(page, errors); } finally { await browser.close(); }
}

test('page loads mazeTiny with the player in the start room and no errors', async () => {
  await withPage(async (page, errors) => {
    const state = await page.evaluate(() => window.mazeDebug());
    assert.deepEqual(errors, []);
    assert.equal(state.maze.rows, 7);
    assert.deepEqual(state.player, { row: 1, col: 1 });
    assert.equal(state.won, false);
  });
});

test('Generate draws a maze of the requested size', async () => {
  await withPage(async (page) => {
    await page.click('#generateBtn');
    let state = await page.evaluate(() => window.mazeDebug());
    assert.equal(state.maze.rows, 11);
    assert.equal(state.maze.cols, 11);
    await page.fill('#mazeWidth', '8');
    await page.fill('#mazeHeight', '3');
    await page.click('#generateBtn');
    state = await page.evaluate(() => window.mazeDebug());
    assert.equal(state.maze.cols, 17);
    assert.equal(state.maze.rows, 7);
    assert.deepEqual(state.player, { row: 1, col: 1 });
  });
});

test('canvas shows black walls, white rooms, tinted gaps, and a blue dot', async () => {
  await withPage(async (page) => {
    const px = await page.evaluate(() => {
      const s = window.mazeDebug();
      const L = s.layout;
      const at = (col, row) => Array.from(ctx.getImageData(
        L.originX + L.colX[col] + Math.floor((col % 2 ? L.cellSize : L.wallSize) / 2),
        L.originY + L.rowY[row] + Math.floor((row % 2 ? L.cellSize : L.wallSize) / 2), 1, 1).data).slice(0, 3);
      return { wall: at(0, 0), room: at(3, 3), sGap: at(1, 0), eGap: at(5, 6), player: at(1, 1) };
    });
    assert.deepEqual(px.wall, [0, 0, 0]);
    assert.deepEqual(px.room, [255, 255, 255]);
    assert.deepEqual(px.sGap, [200, 247, 197]);
    assert.deepEqual(px.eGap, [255, 232, 163]);
    assert.deepEqual(px.player, [30, 100, 255]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:e2e`
Expected: FAIL, `window.mazeDebug is not a function`.

- [ ] **Step 3: Replace Section 6 in `candidate-submission.js`**

```js
/* =============================================================================
 * SECTION 6 — DRAWING
 * =============================================================================
 * Everything that touches the canvas lives here.  `gameState` is the one piece
 * of runtime state: the parsed maze, its pixel layout, where the player is,
 * and whether they have won.
 */
const COLORS = {
  wall: '#000000',
  path: '#FFFFFF',
  start: '#C8F7C5',
  end: '#FFE8A3',
  player: '#1E64FF',
  text: '#000000',
  banner: 'rgba(255,255,255,0.9)',
};

let gameState = null;

/**
 * Draws the maze grid and initial player avatar onto the canvas.
 *
 * @param {Array} mazeData - The maze in the format described in Section 1.
 * @param {number} width - The pixel width of the canvas.
 * @param {number} height - The pixel height of the canvas.
 */
const drawMaze = function (mazeData, width, height) {
  let maze;
  try {
    maze = parseMaze(mazeData);
  } catch (err) {
    gameState = null;
    drawMessage(['Could not draw this maze:', err.message], width, height);
    return;
  }
  const layout = computeLayout(maze.rows, maze.cols, width, height);
  gameState = { maze, layout, player: { ...maze.startRoom }, won: false };
  render(gameState);
};

function render(state) {
  drawTiles(state);
  drawPlayer(state);
  if (state.won) drawBanner('You made it!', state);
}

function drawTiles({ maze, layout }) {
  ctx.fillStyle = COLORS.path;
  ctx.fillRect(layout.originX, layout.originY, layout.totalWidth, layout.totalHeight);
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const ch = maze.grid[r][c];
      if (ch === PATH) continue;
      const x = layout.originX + layout.colX[c];
      const y = layout.originY + layout.rowY[r];
      const w = tileSize(layout, c);
      const h = tileSize(layout, r);
      ctx.fillStyle = ch === WALL ? COLORS.wall : ch === START ? COLORS.start : COLORS.end;
      ctx.fillRect(x, y, w, h);
      if (ch === START || ch === END) drawGapLabel(ch, r, c, maze, layout);
    }
  }
}

// Writes S or E in the padding just outside its gap in the outer wall.
function drawGapLabel(ch, r, c, maze, layout) {
  const x = layout.originX + layout.colX[c] + tileSize(layout, c) / 2;
  const y = layout.originY + layout.rowY[r] + tileSize(layout, r) / 2;
  const offset = PADDING / 2;
  const cx = c === 0 ? x - offset : c === maze.cols - 1 ? x + offset : x;
  const cy = r === 0 ? y - offset : r === maze.rows - 1 ? y + offset : y;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, cx, cy);
}

function drawPlayer({ layout, player }) {
  const cx = layout.originX + layout.colX[player.col] + tileSize(layout, player.col) / 2;
  const cy = layout.originY + layout.rowY[player.row] + tileSize(layout, player.row) / 2;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(cx, cy, layout.cellSize * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawBanner(text, { layout }) {
  const cx = layout.originX + layout.totalWidth / 2;
  const cy = layout.originY + layout.totalHeight / 2;
  ctx.fillStyle = COLORS.banner;
  ctx.fillRect(cx - 150, cy - 30, 300, 60);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
}

function drawMessage(lines, width, height) {
  ctx.fillStyle = COLORS.banner;
  ctx.fillRect(PADDING, PADDING, width - 2 * PADDING, height - 2 * PADDING);
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const maxWidth = width - 4 * PADDING;
  let y = 2 * PADDING;
  for (const line of lines) {
    let current = '';
    for (const word of line.split(' ')) {
      const trial = current ? `${current} ${word}` : word;
      if (ctx.measureText(trial).width > maxWidth && current) {
        ctx.fillText(current, 2 * PADDING, y);
        y += 26;
        current = word;
      } else {
        current = trial;
      }
    }
    ctx.fillText(current, 2 * PADDING, y);
    y += 34;
  }
}

if (typeof window !== 'undefined') {
  window.mazeDebug = () => gameState; // read-only hook for acceptance tests
}
```

- [ ] **Step 4: Run tests**

Run: `npm test && npm run test:e2e` → all pass. If the pixel colour asserts are off by one or two because of canvas anti-aliasing at the sample point, sample one pixel further inside the tile rather than loosening the colours.

- [ ] **Step 5: Commit, PR, gate, screenshots, merge, record**

```bash
git add candidate-submission.js tests/e2e/render.test.mjs
git commit -m "feat: render maze on canvas with labelled S/E gaps and blue dot

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-11-draw
gh pr create --title "Task 11 (Phase 3): draw the maze" --body "$(cat <<'EOF'
drawMaze: black walls, white rooms, green S gap and gold E gap with letters outside the border, blue dot in the start room; parse errors are drawn as text on the canvas.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`, and `screenshot-runner` with label `phase-3-render` and expectation "mazeTiny with black walls, white rooms, a green gap in the top border labelled S and a gold gap in the bottom border labelled E, blue dot in the top-left room; second image is a 5x5 generated maze with the same features". Merge squash. Update `memory.md`: Phase 3 done.

---

# Phase 4 — Movement

### Task 12: `movePlayer` (pure)

Branch: `task-12-move`. Needs T5 merged (can run alongside T6, T7, T9). Claim in `memory.md` first.

**Files:**
- Modify: `candidate-submission.js` Section 7 (add `KEY_DIRECTIONS`, `movePlayer` above the `onKeyDown` stub; export)
- Create: `tests/movement.test.js`

**Interfaces:**
- Produces: `KEY_DIRECTIONS = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] }`; `movePlayer(grid, position, [dRow, dCol]) -> position`. Returns the same object when blocked by `#`, by the `S` gap, or by the grid edge; returns the `E` gap's position when stepping out through it.

- [ ] **Step 1: Write the failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { movePlayer, KEY_DIRECTIONS, mazeTiny } = require('../candidate-submission.js');

const START_ROOM = { row: 1, col: 1 };

test('moving into a wall or back out through the S gap returns the same position object', () => {
  assert.equal(movePlayer(mazeTiny, START_ROOM, KEY_DIRECTIONS.ArrowUp), START_ROOM);   // S gap
  assert.equal(movePlayer(mazeTiny, START_ROOM, KEY_DIRECTIONS.ArrowDown), START_ROOM); // wall
  assert.equal(movePlayer(mazeTiny, START_ROOM, KEY_DIRECTIONS.ArrowLeft), START_ROOM); // outer wall
});

test('moving through an open doorway advances two grid steps', () => {
  assert.deepEqual(movePlayer(mazeTiny, START_ROOM, KEY_DIRECTIONS.ArrowRight), { row: 1, col: 3 });
});

test('the only route through mazeTiny ends by stepping into the E gap', () => {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowRight'];
  let pos = START_ROOM;
  for (const k of keys) pos = movePlayer(mazeTiny, pos, KEY_DIRECTIONS[k]);
  assert.deepEqual(pos, { row: 5, col: 5 });
  assert.deepEqual(movePlayer(mazeTiny, pos, KEY_DIRECTIONS.ArrowDown), { row: 6, col: 5 });
});

test('cannot leave the grid through a wall on the edge', () => {
  const pos = { row: 5, col: 5 };
  assert.equal(movePlayer(mazeTiny, pos, KEY_DIRECTIONS.ArrowRight), pos);
});
```

- [ ] **Step 2: Run to verify it fails** → `movePlayer is not a function`.

- [ ] **Step 3: Add to Section 7 (above the `onKeyDown` stub)**

```js
/* =============================================================================
 * SECTION 7 — MOVEMENT
 * =============================================================================
 * One key press = one room.  The grid item between two rooms is the doorway:
 *   '*'  open: step through to the next room
 *   '#'  wall: blocked
 *   'S'  the entrance gap: blocked (no walking back out)
 *   'E'  the exit gap: step into it and win
 * The outer ring is wall everywhere else, so the player can never leave the grid.
 */
const KEY_DIRECTIONS = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/**
 * @param {string[][]} grid
 * @param {{row:number,col:number}} position - current room
 * @param {[number, number]} direction - [dRow, dCol]
 * @returns {{row:number,col:number}} new position, or the same object if blocked
 */
function movePlayer(grid, position, direction) {
  const [dRow, dCol] = direction;
  const doorwayRow = grid[position.row + dRow];
  const doorway = doorwayRow ? doorwayRow[position.col + dCol] : undefined;
  if (doorway === END) return { row: position.row + dRow, col: position.col + dCol }; // step into the exit gap
  if (doorway !== PATH) return position; // wall, the S gap, or off the grid
  return { row: position.row + 2 * dRow, col: position.col + 2 * dCol };
}
```
Section 8: add `KEY_DIRECTIONS, movePlayer,` on its own line.

- [ ] **Step 4: Run to verify it passes; commit, PR, gate, merge, record**

```bash
git add candidate-submission.js tests/movement.test.js
git commit -m "feat: pure movePlayer with wall collision and exit gap

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-12-move
gh pr create --title "Task 12 (Phase 4): movePlayer" --body "$(cat <<'EOF'
Pure movement: through * doorways, blocked by # and the S gap, steps into the E gap to win.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`. Merge squash. Update `memory.md`.

### Task 13: `onKeyDown`, win state, end-to-end play test

Branch: `task-13-keys`. Needs T11 and T12 merged. Claim in `memory.md` first.

**Files:**
- Modify: `candidate-submission.js` Section 7 (`onKeyDown`)
- Create: `tests/e2e/play.test.mjs`

- [ ] **Step 1: Write the failing acceptance test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const url = 'file://' + path.resolve('maze-game.html');

async function withPage(fn) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  try { await fn(page); } finally { await browser.close(); }
}

const state = (page) => page.evaluate(() => window.mazeDebug());
const SOLUTION = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowRight'];

test('arrow keys move the dot only through open doorways', async () => {
  await withPage(async (page) => {
    await page.keyboard.press('ArrowUp'); // the S gap
    assert.deepEqual((await state(page)).player, { row: 1, col: 1 });
    await page.keyboard.press('ArrowRight');
    assert.deepEqual((await state(page)).player, { row: 1, col: 3 });
  });
});

test('stepping out through E sets won and freezes movement, even with key repeat', async () => {
  await withPage(async (page) => {
    for (const k of SOLUTION) await page.keyboard.press(k);
    let s = await state(page);
    assert.deepEqual(s.player, { row: 5, col: 5 });
    assert.equal(s.won, false);
    await page.keyboard.press('ArrowDown');
    s = await state(page);
    assert.deepEqual(s.player, { row: 6, col: 5 });
    assert.equal(s.won, true);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    s = await state(page);
    assert.deepEqual(s.player, { row: 6, col: 5 });
  });
});

test('arrow keys do not scroll the page', async () => {
  await withPage(async (page) => {
    await page.setViewportSize({ width: 800, height: 400 });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => window.scrollY), 0);
  });
});

test('arrow keys inside the size inputs change the number, not the dot', async () => {
  await withPage(async (page) => {
    await page.focus('#mazeWidth');
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.inputValue('#mazeWidth'), '6');
    await page.keyboard.press('ArrowRight');
    assert.deepEqual((await state(page)).player, { row: 1, col: 1 });
  });
});

test('Generate resets the player to the start room of the new maze', async () => {
  await withPage(async (page) => {
    await page.keyboard.press('ArrowRight');
    await page.click('#generateBtn');
    const s = await state(page);
    assert.deepEqual(s.player, { row: 1, col: 1 });
    assert.equal(s.won, false);
  });
});
```

- [ ] **Step 2: Run to verify it fails** → `npm run test:e2e`, the first movement assertion fails (dot does not move).

- [ ] **Step 3: Replace the `onKeyDown` stub**

```js
/**
 * Handles keyboard arrow key input to move the player within the maze.
 *
 * @param {KeyboardEvent} evt - The keyboard event corresponding to the key pressed.
 */
const onKeyDown = function (evt) {
  const direction = KEY_DIRECTIONS[evt.key];
  if (!direction) return;                                   // not an arrow key
  if (evt.target && evt.target.tagName === 'INPUT') return; // typing in a size box
  evt.preventDefault();                                     // no page scrolling
  if (!gameState || gameState.won) return;
  const next = movePlayer(gameState.maze.grid, gameState.player, direction);
  if (next === gameState.player) return;                    // blocked: nothing to redraw
  gameState.player = next;
  gameState.won = next.row === gameState.maze.end.row && next.col === gameState.maze.end.col;
  render(gameState);
};
```

- [ ] **Step 4: Run all tests** → `npm test && npm run test:e2e`, all pass.

- [ ] **Step 5: Commit, PR, gate, screenshots, merge, record**

```bash
git add candidate-submission.js tests/e2e/play.test.mjs
git commit -m "feat: arrow-key movement with collision and win banner

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-13-keys
gh pr create --title "Task 13 (Phase 4): arrow-key movement and win" --body "$(cat <<'EOF'
Arrow keys move the blue dot one room at a time, blocked by walls and the S gap. Stepping out through E shows a win banner and freezes movement. Keys typed in the size inputs are ignored; page scroll is prevented.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`, `screenshot-runner` label `phase-4-movement`. Merge squash. Update `memory.md`: Phase 4 done.

---

# Phase 5 — Harden and publish

### Task 14: Hardening pass

Branch: `task-14-harden`. Needs T13 merged. Claim in `memory.md` first.

**Files:**
- Modify: `candidate-submission.js`, `maze-game.js` as findings require
- Modify: `tests/parse-maze.test.js`, `tests/e2e/render.test.mjs`

- [ ] **Step 1: Add failing tests for the remaining edge cases**

Append to `tests/parse-maze.test.js`:
```js
test('rejects rows that are numbers or objects', () => {
  assert.throws(() => parseMaze(['#S###', 12345, '###E#']), /Row 1 must be an array/i);
});

test('rejects multi-character cells', () => {
  assert.throws(() => parseMaze([['#','S','#'], ['#','**','#'], ['#','E','#']]), /single character|room and must be/i);
});
```

Append to `tests/e2e/render.test.mjs`:
```js
test('an invalid pasted maze shows an error message instead of crashing', async () => {
  await withPage(async (page, errors) => {
    await page.evaluate(() => { drawCanvas(); drawMaze(['#S###', '#***', '###E#'], canvasWidth, canvasHeight); });
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => window.mazeDebug()), null);
    const px = await page.evaluate(() => Array.from(ctx.getImageData(40, 40, 1, 1).data).slice(0, 3));
    assert.notDeepEqual(px, [0, 192, 204]); // not the bare teal background: the message box is drawn
    await page.keyboard.press('ArrowRight'); // must not throw with gameState null
    assert.deepEqual(errors, []);
  });
});

test('drawMaze on a tiny canvas still draws without errors', async () => {
  await withPage(async (page, errors) => {
    await page.evaluate(() => { canvasWidth = 120; canvasHeight = 120; drawCanvas(); drawMaze(generateMaze(50, 50, makeSeededRandom(1)), 120, 120); });
    assert.deepEqual(errors, []);
    const s = await page.evaluate(() => window.mazeDebug());
    assert.ok(s.layout.cellSize >= 1);
  });
});
```

- [ ] **Step 2: Run** `npm test && npm run test:e2e`. Fix any failure in production code only. If the multi-character case is not caught by the room-content check, add to `parseMaze` right after building `grid`:

```js
  grid.forEach((row, r) => row.forEach((ch, c) => {
    if (ch.length !== 1) throw new Error(`Row ${r}, column ${c} must be a single character. Found "${ch}".`);
  }));
```

- [ ] **Step 3: Run the code-architect agent**

Invoke `code-architect` on the whole repo. Apply every `high` finding, apply `medium` findings that take under 15 minutes, list `low` findings in the PR body as follow-ups. Re-run all tests after changes. Log any interface change in `memory.md` Decisions.

- [ ] **Step 4: Commit, PR, gate, merge, record**

```bash
git add -A
git commit -m "chore: harden parsing, input handling and rendering edge cases

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-14-harden
gh pr create --title "Task 14 (Phase 5): hardening" --body "$(cat <<'EOF'
Edge-case hardening for parsing, input, and rendering; architecture review findings applied.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`. Merge squash. Update `memory.md`.

### Task 15: Vercel configuration and deploy

Branch: `task-15-vercel`. Steps 1 and 2 can be done any time after T13; step 4 waits for T14 to merge. Claim in `memory.md` first.

**Files:**
- Create: `vercel.json`, `.vercelignore`
- Modify: `CLAUDE.md` (live URL)

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "rewrites": [{ "source": "/", "destination": "/maze-game.html" }]
}
```

- [ ] **Step 2: Write `.vercelignore`**

```
node_modules
tests
scripts
docs
.claude
.worktrees
screenshots
CLAUDE.md
memory.md
package-lock.json
```

- [ ] **Step 3: Verify Vercel access**

Use the Vercel tooling available in the session (`vercel:status` skill or the Vercel MCP `list_teams` tool). If it reports no linked account or an authentication failure, stop here: commit the config, open the PR, and report to the user that deployment needs their Vercel login. Note the block in `memory.md`.

- [ ] **Step 4: Deploy a preview, then production (after T14 has merged and this branch is rebased on `main`)**

Use the `vercel:deploy` skill (preview first, then `prod`), creating a project named `maze-vibing` linked to the GitHub repo if prompted. Check the production URL in Playwright:

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.argv[1]);
  await p.click('#generateBtn');
  const s = await p.evaluate(() => window.mazeDebug());
  console.log('rows', s.maze.rows, 'errors', errs);
  await p.screenshot({ path: 'screenshots/production.png' });
  await b.close();
})();" https://<production-url>
```
Expected: `rows 11 errors []`.

- [ ] **Step 5: Record the URL, commit, PR, gate, merge, record**

Add a line to `CLAUDE.md` under Commands: `- Live: https://<production-url>`.

```bash
git add vercel.json .vercelignore CLAUDE.md
git commit -m "chore: add Vercel config and record production URL

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin task-15-vercel
gh pr create --title "Task 15 (Phase 5): Vercel deploy" --body "$(cat <<'EOF'
Vercel static config (rewrite / to maze-game.html, ignore tooling). Live at https://<production-url>.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Gate: `test-runner`, `code-reviewer`, `screenshot-runner` label `phase-5-deploy`. Merge squash. Update `memory.md`: Phase 5 done, project complete. Final: `git checkout main && git pull && npm test && npm run test:e2e`.

---

## Self-review notes

- Spec coverage: format and `mazeTiny` (T5), generation (T6), parsing with `roomInside` (T7), parser-generator agreement (T8), layout (T9), controls (T10), rendering with gap labels (T11), movement into the E gap (T12, T13), oracles (T3), agents and CLAUDE.md (T2), memory protocol (`memory.md` committed in T1), pr-shots (T4), hardening and deploy (T14, T15). All spec sections map to a task.
- Names used consistently: `generateMaze`, `parseMaze`, `analyzeMaze`, `roomInside`, `startRoom`/`endRoom` (parsed fields and oracle functions), `computeLayout`, `tileSize`, `movePlayer`, `KEY_DIRECTIONS`, `STEP_DIRECTIONS` (defined once in T5), `render`, `gameState`, `mazeDebug`, `readSize`.
- Review Focus items 1 to 5 are pinned in Tasks 7/14, 13, 10, 6, 13 respectively.
- Parallel safety: every Wave 2 task replaces a distinct section stub created in T5; the only shared lines are the exports block (union on conflict).
