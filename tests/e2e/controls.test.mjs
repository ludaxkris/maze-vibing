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

test('controls exist with defaults of 5 x 5 and help text', async () => {
  await withPage(async (page, errors) => {
    assert.equal(await page.inputValue('#mazeWidth'), '5');
    assert.equal(await page.inputValue('#mazeHeight'), '5');
    assert.match(await page.textContent('#controls'), /Generate/);
    assert.match(await page.textContent('#controls'), /arrow keys/i);
    assert.deepEqual(errors, []);
  });
});

test('Generate runs without errors and shows clamped values back in the inputs', async () => {
  await withPage(async (page, errors) => {
    for (const [w, h, expectW, expectH] of [
      ['8', '3', '8', '3'],
      ['0', '-3', '2', '2'],
      ['999', '2.5', '50', '2'],
      ['', '', '5', '5'],
    ]) {
      await page.fill('#mazeWidth', w);
      await page.fill('#mazeHeight', h);
      await page.click('#generateBtn');
      assert.equal(await page.inputValue('#mazeWidth'), expectW, `width ${w}`);
      assert.equal(await page.inputValue('#mazeHeight'), expectH, `height ${h}`);
    }
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
  });
});
