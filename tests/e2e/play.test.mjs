import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const url = 'file://' + path.resolve('maze-game.html');

async function withPage(fn) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  try { await fn(page); } finally { await browser.close(); }
}

const state = (page) => page.evaluate(() => window.mazeDebug());
const SOLUTION = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowRight'];

test('arrow keys move the dot only through open doorways', async () => {
  await withPage(async (page) => {
    await page.keyboard.press('ArrowUp'); // the S gap
    assert.deepEqual((await state(page)).player, { row: 1, col: 1 });
    await page.keyboard.press('ArrowRight');
    assert.deepEqual((await state(page)).player, { row: 1, col: 3 });
  });
});

test('stepping out through E sets won and freezes movement, even with key repeat', async () => {
  await withPage(async (page) => {
    for (const k of SOLUTION) await page.keyboard.press(k);
    let s = await state(page);
    assert.deepEqual(s.player, { row: 5, col: 5 });
    assert.equal(s.won, false);
    await page.keyboard.press('ArrowDown');
    s = await state(page);
    assert.deepEqual(s.player, { row: 6, col: 5 });
    assert.equal(s.won, true);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    s = await state(page);
    assert.deepEqual(s.player, { row: 6, col: 5 });
  });
});

test('arrow keys do not scroll the page', async () => {
  await withPage(async (page) => {
    await page.setViewportSize({ width: 800, height: 400 });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => window.scrollY), 0);
  });
});

test('arrow keys inside the size inputs change the number, not the dot', async () => {
  await withPage(async (page) => {
    await page.focus('#mazeWidth');
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.inputValue('#mazeWidth'), '6');
    await page.keyboard.press('ArrowRight');
    assert.deepEqual((await state(page)).player, { row: 1, col: 1 });
  });
});

test('Generate resets the player to the start room of the new maze', async () => {
  await withPage(async (page) => {
    await page.keyboard.press('ArrowRight');
    await page.click('#generateBtn');
    const s = await state(page);
    assert.deepEqual(s.player, { row: 1, col: 1 });
    assert.equal(s.won, false);
  });
});
