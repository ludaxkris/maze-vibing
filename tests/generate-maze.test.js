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
