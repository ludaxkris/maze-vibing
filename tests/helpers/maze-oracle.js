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
