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
