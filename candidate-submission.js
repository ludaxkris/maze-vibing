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
    parseMaze, analyzeMaze, roomInside,
    PADDING, WALL_RATIO, computeLayout, tileSize,
  };
}
