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

test('S and E labels do not thicken as the player moves', async () => {
  await withPage(async (page) => {
    const darkCount = () => page.evaluate(() => {
      const L = window.mazeDebug().layout;
      const boxes = {
        s: [L.originX + L.colX[1] + L.cellSize / 2 - 12, L.originY - 19, 24, 18],   // above the S gap
        e: [L.originX + L.colX[5] + L.cellSize / 2 - 12, L.originY + L.totalHeight + 1, 24, 18], // below the E gap
      };
      const counts = {};
      for (const [name, [x, y, w, h]] of Object.entries(boxes)) {
        const d = ctx.getImageData(x, y, w, h).data;
        let dark = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] < 128 && d[i + 1] < 128 && d[i + 2] < 128) dark++;
        }
        counts[name] = dark;
      }
      return counts;
    });
    const before = await darkCount();
    assert.ok(before.s > 0 && before.e > 0, 'labels are drawn in the padding');
    for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight']) await page.keyboard.press(k);
    const mid = await darkCount();
    assert.deepEqual(mid, before);
    // Winning move for mazeTiny: lands the player on { row: 6, col: 5 }, the E gap.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    assert.equal((await page.evaluate(() => window.mazeDebug())).won, true);
    const after = await darkCount();
    // S is never touched by the dot and render() only re-inks E on the win, so
    // S must be pixel-for-pixel unchanged.
    assert.equal(after.s, before.s, 'S is not re-inked on the win');
    // The dot is blue (30,100,255), not dark, so E's box would crater toward 0
    // if the fix regressed to hiding the letter; a small anti-aliasing-edge
    // dip from the shrunk-but-still-nearby dot is expected and tolerated.
    assert.ok(after.e >= before.e * 0.75, `E still legible over the dot (${after.e} vs ${before.e})`);
  });
});
