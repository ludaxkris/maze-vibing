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
