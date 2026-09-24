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
