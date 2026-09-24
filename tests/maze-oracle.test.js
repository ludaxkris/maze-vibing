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
