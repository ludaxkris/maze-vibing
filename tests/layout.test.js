const { test } = require('node:test');
const assert = require('node:assert/strict');
const { computeLayout, tileSize, PADDING } = require('../candidate-submission.js');

test('layout fits inside the canvas minus padding and is centred', () => {
  for (const [rows, cols] of [[11, 11], [7, 7], [3, 21], [101, 101], [5, 101], [3, 3]]) {
    const L = computeLayout(rows, cols, 700, 700);
    assert.ok(L.totalWidth <= 700 - 2 * PADDING, `${rows}x${cols} width`);
    assert.ok(L.totalHeight <= 700 - 2 * PADDING, `${rows}x${cols} height`);
    assert.equal(L.originX, Math.floor((700 - L.totalWidth) / 2));
    assert.equal(L.originY, Math.floor((700 - L.totalHeight) / 2));
    assert.ok(L.cellSize >= 1 && L.wallSize >= 1);
  }
});

test('odd indices are rooms and even indices are walls', () => {
  const L = computeLayout(11, 11, 700, 700);
  assert.equal(tileSize(L, 0), L.wallSize);
  assert.equal(tileSize(L, 1), L.cellSize);
  assert.equal(L.colX[1], L.wallSize);
  assert.equal(L.colX[2], L.wallSize + L.cellSize);
  assert.equal(L.colX.length, 11);
  assert.equal(L.rowY.length, 11);
  assert.equal(L.totalWidth, L.colX[10] + L.wallSize);
});

test('walls are a quarter of a room', () => {
  const L = computeLayout(11, 11, 700, 700);
  assert.equal(L.wallSize, Math.round(L.cellSize * 0.25));
});

test('a wide canvas does not stretch a maze taller than the canvas allows', () => {
  const wide = computeLayout(11, 21, 1000, 400);
  assert.ok(wide.totalHeight <= 400 - 2 * PADDING);
  assert.ok(wide.totalWidth <= 1000 - 2 * PADDING);
});
