import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const label = process.argv[2] ?? 'shot';
const outDir = process.argv[3] ?? 'screenshots';
mkdirSync(outDir, { recursive: true });

const url = 'file://' + path.resolve('maze-game.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));
await page.goto(url);
await page.screenshot({ path: path.join(outDir, `${label}-initial.png`) });

const canGenerate = await page.evaluate(() =>
  typeof generateMaze === 'function' && typeof drawMaze === 'function' && typeof makeSeededRandom === 'function');
if (canGenerate) {
  await page.evaluate(() => {
    drawCanvas();
    drawMaze(generateMaze(5, 5, makeSeededRandom(42)), canvasWidth, canvasHeight);
  });
  await page.screenshot({ path: path.join(outDir, `${label}-generated-5x5.png`) });
}
await browser.close();
if (errors.length) {
  console.error('Page errors:', errors.join('\n'));
}
console.log(`Saved screenshots to ${outDir}`);
