import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const url = 'file://' + path.resolve('maze-game.html');

async function withPage(fn) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  try { await fn(page, errors); } finally { await browser.close(); }
}

test('page loads mazeTiny with the player in the start room and no errors', async () => {
  await withPage(async (page, errors) => {
    const state = await page.evaluate(() => window.mazeDebug());
    assert.deepEqual(errors, []);
    assert.equal(state.maze.rows, 7);
    assert.deepEqual(state.player, { row: 1, col: 1 });
    assert.equal(state.won, false);
  });
});

test('Generate draws a maze of the requested size', async () => {
  await withPage(async (page) => {
    await page.click('#generateBtn');
    let state = await page.evaluate(() => window.mazeDebug());
    assert.equal(state.maze.rows, 11);
    assert.equal(state.maze.cols, 11);
    await page.fill('#mazeWidth', '8');
    await page.fill('#mazeHeight', '3');
    await page.click('#generateBtn');
    state = await page.evaluate(() => window.mazeDebug());
    assert.equal(state.maze.cols, 17);
    assert.equal(state.maze.rows, 7);
    assert.deepEqual(state.player, { row: 1, col: 1 });
  });
});

test('canvas shows black walls, white rooms, tinted gaps, and a blue dot', async () => {
  await withPage(async (page) => {
    const px = await page.evaluate(() => {
      const s = window.mazeDebug();
      const L = s.layout;
      const at = (col, row) => Array.from(ctx.getImageData(
        L.originX + L.colX[col] + Math.floor((col % 2 ? L.cellSize : L.wallSize) / 2),
        L.originY + L.rowY[row] + Math.floor((row % 2 ? L.cellSize : L.wallSize) / 2), 1, 1).data).slice(0, 3);
      return { wall: at(0, 0), room: at(3, 3), sGap: at(1, 0), eGap: at(5, 6), player: at(1, 1) };
    });
    assert.deepEqual(px.wall, [0, 0, 0]);
    assert.deepEqual(px.room, [255, 255, 255]);
    assert.deepEqual(px.sGap, [200, 247, 197]);
    assert.deepEqual(px.eGap, [255, 232, 163]);
    assert.deepEqual(px.player, [30, 100, 255]);
  });
});
