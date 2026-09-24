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
    generateMaze,
    KEY_DIRECTIONS, movePlayer,
  };
}
