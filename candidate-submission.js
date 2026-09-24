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
