# Maze Vibing — Design Spec

Date: 2026-09-24
Status: Draft for review (revision 2: S and E are gaps in the outer wall)

## 1. What we are building

A playable maze web page. The page shows a maze drawn on a canvas, a big blue dot for
the player, and a small control panel where anyone can type a maze size (width and
height in cells), press **Generate**, and get a brand-new random maze. Arrow keys move
the blue dot in through the Start gap, through the maze, and out through the End gap
without ever crossing a wall.

The starter files came from the AoPS take-home (`README.md`). Almost all of our code
lives in `candidate-submission.js`, which the take-home requires to define three
things: `mazeTiny`, `drawMaze`, and `onKeyDown`. We keep that contract.

**Who it is for.** 4th graders play it; curriculum developers hand-craft mazes by
copy-pasting a simple text grid. So the data format must be readable by a
non-programmer, and the code must be readable by a reviewer.

**Success looks like:**

- Every generated maze obeys all four maze rules (below), proven by automated tests.
- A non-developer can read this spec and understand how a maze is stored and how one
  is generated.
- The page works by opening `maze-game.html` locally and is also live on Vercel.

## 2. The four maze rules

1. **No loops.** You can never walk in a circle and end up where you started without
   retracing your steps.
2. **Every room is reachable.** From the Start you can walk to every cell in the maze.
3. **Exactly one solution path.** There is one and only one way from Start to End
   (rules 1 and 2 together guarantee this).
4. **Rectangular.** Every row has the same number of items.

## 3. The data structure (for non-developers)

Think of graph paper. A maze is written as a **grid of single characters**, stored as
an array of rows, where each row is an array of characters (a "matrix").

There are only four characters:

| Character | Meaning |
|-----------|---------|
| `#` | Wall |
| `*` | Open space (a room, or an open doorway between two rooms) |
| `S` | The Start: a gap in the outer wall where you enter |
| `E` | The End: a gap in the outer wall where you leave |

**The key idea: rooms and walls take turns.** If the maze is `w` rooms wide and `h`
rooms tall, the grid is `2w + 1` columns by `2h + 1` rows. Counting rows and columns
from 0 at the top-left:

- **Odd row, odd column** = a **room**. Always `*`.
- **Odd row, even column** = the **vertical wall or doorway** between two side-by-side
  rooms. `#` means wall, `*` means you can walk through.
- **Even row, odd column** = the **horizontal wall or doorway** between two stacked
  rooms. Same meaning.
- **Even row, even column** = a **post** where walls meet. Always `#`.
- The **outer ring** (row 0, last row, column 0, last column) is `#` everywhere except
  for exactly one `S` and exactly one `E`. Each sits in a doorway slot on the edge
  (never a corner), so it lines up with the room just inside it. These are the
  entrance and exit gaps, like a printed maze.

Example: a maze that is 3 rooms wide and 3 rooms tall (grid is 7 x 7):

```
col:  0 1 2 3 4 5 6
row0: # S # # # # #     <- S is the gap above the top-left room
row1: # * * * # * #     <- rooms at columns 1, 3, 5
row2: # # # * # * #     <- doorways between row1 and row3 at columns 1, 3, 5
row3: # * * * * * #
row4: # * # # # # #
row5: # * * * * * #
row6: # # # # # E #     <- E is the gap below the bottom-right room
```

Reading row 1: a room (col 1), an open doorway (col 2), a room (col 3), a wall
(col 4), a room (col 5). So from the first room you can walk right into the second
room, but not straight through to the third.

As JavaScript this is written one row per line:

```js
const mazeTiny = [
  ['#','S','#','#','#','#','#'],
  ['#','*','*','*','#','*','#'],
  ['#','#','#','*','#','*','#'],
  ['#','*','*','*','*','*','#'],
  ['#','*','#','#','#','#','#'],
  ['#','*','*','*','*','*','#'],
  ['#','#','#','#','#','E','#'],
];
```

For convenience when pasting from a document, the parser also accepts each row as a
plain string (`'#S#####'`); it converts strings into arrays of characters. The
canonical, documented form is the array of arrays.

**Position convention used everywhere in code:** `{ row, col }` are grid indices
(row first). While playing, the player's position is always a room (both numbers
odd). The one exception is the winning move, which places the player in the `E` gap.

**Start room and End room.** The room just inside the `S` gap is the start room; the
room just inside the `E` gap is the end room. The parser works these out from where
`S` and `E` sit on the edge.

**Placement for generated mazes:** `S` is the gap above the top-left room (row 0,
column 1). `E` is the gap below the bottom-right room (last row, second-to-last
column). Hand-written mazes may put `S` and `E` in any edge doorway slot.

## 4. How a random maze is generated (for non-developers)

The algorithm is called a **recursive backtracker**, but the picture is simpler:
imagine a digger with a ball of string.

1. Build the grid with every room open and every doorway bricked up as a wall.
2. Put the digger in the top-left room and mark it "visited". Tie the string there.
3. Repeat:
   - Look at the four neighbouring rooms (up, down, left, right). Ignore any that are
     off the grid or already visited.
   - **If at least one is unvisited:** pick one at random, knock down the wall between
     the current room and that room, step into it, mark it visited, and unroll more
     string.
   - **If none are unvisited:** walk back along the string to the previous room and
     look again from there.
4. When the digger is back at the start with no string left, every room has been
   visited. Cut the `S` gap in the outer wall above the top-left room and the `E` gap
   below the bottom-right room.

Why this satisfies the rules:

- **No loops:** a wall is only ever knocked down into a room nobody has visited yet, so
  every room gets exactly one "entrance" carved. You can never create a second way into
  a room, which is what a loop would need. The `S` and `E` gaps lead outside, not to
  another room, so they cannot create a loop either.
- **Every room reachable:** the digger does not stop until every room was visited, and
  it only reaches rooms by carving doorways, so a walkable route exists to all of them.
- **Exactly one solution:** with no loops and everything connected, there is exactly one
  route between any two rooms, including the start room and the end room.
- **Rectangular:** we build the full `(2h+1) x (2w+1)` grid up front and only change
  characters inside it.

Randomness comes from a `random()` function passed in. The page uses the browser's
`Math.random`; tests pass a **seeded** random generator so the same seed always yields
the same maze and test failures can be reproduced.

## 5. Code layout

Everything ships as plain browser scripts loaded by `<script>` tags with no build step
and no runtime dependencies, as the take-home requires. Node is used only for tests,
screenshots, and deployment.

`candidate-submission.js` is one file, organised into clearly labelled sections, each
with one job:

| Section | Functions | Touches the canvas? |
|---------|-----------|---------------------|
| 1. Data format + `mazeTiny` | constants `WALL PATH START END` | no |
| 2. Randomness | `makeSeededRandom(seed)` | no |
| 3. Generation | `generateMaze(width, height, random)` | no |
| 4. Parsing + validation | `parseMaze(mazeData)`, `analyzeMaze(parsed)`, `roomInside(gap, rows, cols)` | no |
| 5. Layout (grid to pixels) | `computeLayout(rows, cols, width, height)`, `tileSize(layout, index)` | no |
| 6. Drawing | `drawMaze(mazeData, width, height)`, `render(state)` | yes |
| 7. Movement | `movePlayer(grid, position, direction)`, `onKeyDown(evt)` | `onKeyDown` re-renders |
| 8. Exports for tests | `module.exports` only when running under Node | no |

Sections 1 to 5 and `movePlayer` are pure functions (same input, same output, no canvas)
so they can be unit tested in Node with no browser. Only Section 6 and `onKeyDown` use
the global `ctx`.

Runtime state is a single module-level object:

```js
let gameState = null;
// { maze: <parsed maze>, layout: <pixel layout>, player: {row, col}, won: boolean }
```

`drawMaze` replaces `gameState` whenever a new maze is drawn (initial load or Generate).

### Key interfaces

```js
generateMaze(width, height, random = Math.random) -> grid   // array of arrays of chars
parseMaze(mazeData) -> { grid, rows, cols,
                         start: {row, col},      // the S gap on the outer ring
                         end: {row, col},        // the E gap on the outer ring
                         startRoom: {row, col},  // the room just inside S
                         endRoom: {row, col} }   // the room just inside E
                       // throws Error with a human-readable message if invalid
roomInside(gap, rows, cols) -> {row, col}
analyzeMaze(parsed) -> { cellCount, reachableCount, passageCount, isTree }
computeLayout(rows, cols, canvasWidth, canvasHeight)
  -> { cellSize, wallSize, colX: number[], rowY: number[], originX, originY,
       totalWidth, totalHeight }
movePlayer(grid, position, [dRow, dCol]) -> position  // same object if blocked
```

## 6. Rendering

- Walls are drawn **black**, open space **white**, on top of the teal background that
  `maze-game.js` already paints. The `S` gap is tinted light green and the `E` gap
  light gold, and the letters `S` and `E` are written in the padding just outside each
  gap so kids can find them.
- Walls are thin: a wall slot is a quarter the size of a room slot (`WALL_RATIO = 0.25`).
  `computeLayout` builds two lookup tables, `colX[i]` and `rowY[i]`, giving the pixel
  position of every grid column and row, so drawing and the avatar both use the same
  arithmetic.
- The maze is scaled to the largest whole-pixel room size that fits inside the canvas
  minus 20px padding on each side, then centred.
- The player is a blue filled circle with radius 35% of a room, centred in whatever
  grid slot it occupies (a room, or the `E` gap after winning).
- Stepping out through `E` draws a "You made it!" banner and freezes movement until a
  new maze is drawn.
- If `parseMaze` rejects the data, the canvas shows the error message instead of a
  maze, so a curriculum developer with a typo sees what went wrong.

## 7. Movement

Discrete: one arrow key press moves exactly one room. To move in direction
`(dRow, dCol)` from room `(r, c)`, look at the grid item at `(r + dRow, c + dCol)`, which
is the slot between the room and its neighbour:

- `*` (open doorway): the player lands on `(r + 2 dRow, c + 2 dCol)`.
- `#` (wall): nothing happens.
- `S` (the entrance gap): nothing happens. You cannot walk back out the way you came in.
- `E` (the exit gap): the player steps into the gap at `(r + dRow, c + dCol)` and wins.

Because the outer ring is wall everywhere except `S` and `E`, the player can never
leave the grid.

`onKeyDown` ignores non-arrow keys, ignores arrow keys typed inside the width/height
input boxes, calls `preventDefault` on arrow keys so the page does not scroll, and
ignores all movement once the player has won.

## 8. Page controls

`maze-game.html` gains a small block above the canvas:

- A sentence of help text: choose a size, press Generate, use the arrow keys.
- Two number inputs, **Width** and **Height**, both defaulting to 5, limited to 2 to 50.
- A **Generate** button.

`maze-game.js` gains a click listener on the button that reads the two inputs, clamps
them to the allowed range, calls `generateMaze(w, h)`, repaints the background with the
existing `drawCanvas`, and calls `drawMaze`. On first load the page still draws
`mazeTiny`, as the take-home's `maze-game.js` already does.

## 9. Testing

- **Unit tests** run under Node's built-in test runner (`node --test`), no test
  framework to install. They load `candidate-submission.js` through the Node-only
  export at the bottom of the file.
- **Independent oracles** in `tests/helpers/maze-oracle.js` check the four rules
  without reusing the generator's own logic: count solution paths by enumerating every
  simple path from the start room to the end room; detect loops by looking for a back
  edge during a depth-first walk; count reachable rooms with a breadth-first walk; check
  rectangular shape by comparing row lengths. Only `*` doorways connect rooms; the `S`
  and `E` gaps are treated as leading outside.
- The generator is tested across many sizes and seeds, including 1 x 1, skinny mazes
  (1 x 10, 10 x 1) and the maximum UI size (50 x 50).
- The parser is tested with deliberately broken mazes: ragged rows, even dimensions,
  missing or duplicate `S`/`E`, `S` placed inside a room or an inner doorway, a hole in
  the outer wall, a loop, an unreachable room, an unknown character.
- **Acceptance tests** use Playwright (dev dependency only) to open `maze-game.html`,
  press Generate, press arrow keys, walk out through `E`, and inspect the game state
  through a small debug hook `window.mazeDebug()` that returns `gameState`.

## 10. Repository, workflow, and agents

- Git repo initialised on `main`, pushed to a new **private** GitHub repo
  `maze-vibing` under the user's GitHub account. The very first commit is the untouched
  starter files so every later diff shows exactly what we added.
- One branch and one pull request per phase. Merge gate: the Test-Runner agent reports
  all tests passing, and the Code Reviewer agent reports no blocking issues.
- `pr-shots` is an **orphan** branch (it shares no history with `main`, so a merge would
  be meaningless) checked out as a git worktree at `.worktrees/pr-shots` (git-ignored).
  Screenshots go in `shots/<timestamp>-<branch>-<label>/`. It is never merged.
- `CLAUDE.md` records the data format cheat sheet, commands, the workflow, and the
  rules above so every future session follows them.
- Five subagents in `.claude/agents/`:

| Agent | Model | Job |
|-------|-------|-----|
| code-reviewer | opus | Runs the `/code-review` skill on a branch or PR, labels each finding BLOCKING or NON-BLOCKING |
| test-writer | sonnet | Writes unit and acceptance tests; must always cover the four maze rules |
| code-architect | fable | Reviews performance and modularity, reports findings, does not edit |
| test-runner | haiku | Runs every test suite and reports verbatim results; required before any merge |
| screenshot-runner | haiku | Captures page screenshots, saves them to `pr-shots`, describes what it sees versus expectation |

## 11. Deployment

Vercel static deployment. `vercel.json` rewrites `/` to `/maze-game.html`;
`.vercelignore` excludes tests, scripts, docs, and agent files. Deployment goes through
the Vercel tooling available in the session; it requires the user's Vercel account to be
linked, which is confirmed at the start of Phase 5.

## 12. Assumptions and open items

1. The take-home refers to a "Tiny Maze from the assignment document". That document is
   not in the repo, so `mazeTiny` will be the 3 x 3 example in Section 3. If the real
   Tiny Maze is available, paste it in and the rest of the code will not change.
2. Generated mazes: `S` gap above the top-left room, `E` gap below the bottom-right
   room. (Confirmed by the user on 2026-09-24.)
3. GitHub repo name `maze-vibing`, private. No `staging` branch is created; `main` is
   the only long-lived branch besides `pr-shots`.
4. Size limits 2 to 50 cells per side in the page. At 50 x 50 on a 700px canvas each
   room is about 10px, still playable. The generator itself accepts anything from 1 x 1.
5. The page still draws `mazeTiny` on first load. Pressing Generate replaces it.
6. Playwright is the only dev dependency, used for acceptance tests and screenshots.
7. Vercel deployment needs the user's account; if it is not linked, Phase 5 stops
   there and reports.
