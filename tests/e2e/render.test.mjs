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

test('an invalid pasted maze shows an error message instead of crashing', async () => {
  await withPage(async (page, errors) => {
    await page.evaluate(() => { drawCanvas(); drawMaze(['#S###', '#***', '###E#'], canvasWidth, canvasHeight); });
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => window.mazeDebug()), null);
    const px = await page.evaluate(() => Array.from(ctx.getImageData(40, 40, 1, 1).data).slice(0, 3));
    assert.notDeepEqual(px, [0, 192, 204]); // not the bare teal background: the message box is drawn
    await page.keyboard.press('ArrowRight'); // must not throw with gameState null
    assert.deepEqual(errors, []);
  });
});

test('drawMaze on a tiny canvas still draws without errors', async () => {
  await withPage(async (page, errors) => {
    await page.evaluate(() => { canvasWidth = 120; canvasHeight = 120; drawCanvas(); drawMaze(generateMaze(50, 50, makeSeededRandom(1)), 120, 120); });
    assert.deepEqual(errors, []);
    const s = await page.evaluate(() => window.mazeDebug());
    assert.ok(s.layout.cellSize >= 1);
  });
});

test('the S label is drawn once, in the padding, and stays crisp across renders', async () => {
  await withPage(async (page, errors) => {
    // Sample a patch around the S label's position (originX + colX[1] + cellSize/2,
    // originY - 10), clipped so it never dips into the maze's own tile fill -
    // only genuine padding pixels. A single exact pixel is too fragile (a
    // glyph like "S" has hollows), so we scan the patch for any dark
    // (near-black) pixel, which can only be the label's ink, never a wall
    // (outside this patch's x-range), a room, or a tinted gap fill.
    const labelPatch = () => {
      const L = window.mazeDebug().layout;
      const cx = L.originX + L.colX[1] + L.cellSize / 2;
      const cy = L.originY - 10;
      const x0 = Math.round(cx - 12);
      const y0 = Math.max(0, Math.round(cy - 12));
      const h = Math.max(1, Math.min(24, L.originY - y0)); // stay above the maze bounding box
      const data = Array.from(ctx.getImageData(x0, y0, 24, h).data);
      const hasDarkInk = data.some((_, i) => i % 4 === 0 && data[i] < 60 && data[i + 1] < 60 && data[i + 2] < 60);
      return { data, hasDarkInk };
    };
    const before = await page.evaluate(labelPatch);
    assert.ok(before.hasDarkInk, 'expected the S label to be drawn once, in the padding above the maze');
    // Alternate direction so every press is a genuine move into an open
    // doorway (a real re-render), not a blocked no-op that onKeyDown skips.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    const after = await page.evaluate(labelPatch);
    assert.deepEqual(errors, []);
    assert.deepEqual(after.data, before.data); // render() must never repaint the padding
  });
});
