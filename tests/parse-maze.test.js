const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseMaze, analyzeMaze, roomInside } = require('../candidate-submission.js');

const good = [
  '#S#####',
  '#***#*#',
  '###*#*#',
  '#*****#',
  '#*#####',
  '#*****#',
  '#####E#',
];

test('accepts rows as strings and returns grid, size, gaps and rooms inside them', () => {
  const parsed = parseMaze(good);
  assert.equal(parsed.rows, 7);
  assert.equal(parsed.cols, 7);
  assert.deepEqual(parsed.start, { row: 0, col: 1 });
  assert.deepEqual(parsed.end, { row: 6, col: 5 });
  assert.deepEqual(parsed.startRoom, { row: 1, col: 1 });
  assert.deepEqual(parsed.endRoom, { row: 5, col: 5 });
  assert.deepEqual(parsed.grid[1], ['#', '*', '*', '*', '#', '*', '#']);
});

test('accepts rows as arrays and does not mutate the input', () => {
  const input = good.map((row) => row.split(''));
  const copy = JSON.parse(JSON.stringify(input));
  parseMaze(input);
  assert.deepEqual(input, copy);
});

test('gaps may be on any edge', () => {
  const sideGaps = [
    '#####',
    'S***#',
    '###*#',
    '#***E',
    '#####',
  ];
  const parsed = parseMaze(sideGaps);
  assert.deepEqual(parsed.startRoom, { row: 1, col: 1 });
  assert.deepEqual(parsed.endRoom, { row: 3, col: 3 });
});

test('roomInside maps each edge to the adjacent room', () => {
  assert.deepEqual(roomInside({ row: 0, col: 3 }, 7, 7), { row: 1, col: 3 });
  assert.deepEqual(roomInside({ row: 6, col: 3 }, 7, 7), { row: 5, col: 3 });
  assert.deepEqual(roomInside({ row: 3, col: 0 }, 7, 7), { row: 3, col: 1 });
  assert.deepEqual(roomInside({ row: 3, col: 6 }, 7, 7), { row: 3, col: 5 });
});

test('analyzeMaze reports counts for a tree', () => {
  const stats = analyzeMaze(parseMaze(good));
  assert.deepEqual(stats, { cellCount: 9, passageCount: 8, reachableCount: 9, isTree: true });
});

const cases = [
  ['not an array', 'nope', /array/i],
  ['too few rows', ['#S#', '#*#'], /at least 3|odd/i],
  ['ragged rows', ['#S###', '#***#', '####', '#***#', '###E#'], /row 2 has 4/i],
  ['even width', ['#S####', '#****#', '####E#'], /odd/i],
  ['hole in outer wall', ['#S###', '#****', '###E#'], /row 1, column 4 .*outer edge/i],
  ['post not a wall', ['#S###', '#***#', '#***#', '#***#', '###E#'], /post/i],
  ['missing S', ['#####', '#***#', '###E#'], /exactly one S/i],
  ['two E', ['#S###', '#***#', '###*#', '#***#', '#E#E#'], /more than one E/i],
  ['S placed in a room', ['#####', '#S**#', '###*#', '#***#', '###E#'], /room and must be \*/i],
  ['S in an inner doorway', ['#####', '#*S*#', '###*#', '#***#', '###E#'], /gap in the outer wall/i],
  ['unknown character', ['#S###', '#***#', '#x###', '#***#', '###E#'], /doorway .* Found "x"/i],
  ['room contains wall', ['#S#####', '#*##**#', '#####E#'], /room and must be \*.* Found "#"/i],
  ['loop', ['#S###', '#***#', '#*#*#', '#***#', '###E#'], /loop/i],
  ['unreachable room', ['#S###', '#***#', '###*#', '#*#*#', '###E#'], /1 room\(s\) cannot be reached/i],
];

for (const [name, input, pattern] of cases) {
  test(`rejects ${name}`, () => {
    assert.throws(() => parseMaze(input), pattern);
  });
}

test('rejects rows that are numbers or objects', () => {
  assert.throws(() => parseMaze(['#S###', 12345, '###E#']), /Row 1 must be an array/i);
});

test('rejects multi-character cells', () => {
  assert.throws(() => parseMaze([['#','S','#'], ['#','**','#'], ['#','E','#']]), /room and must be/i);
});
