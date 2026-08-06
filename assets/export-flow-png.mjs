/**
 * Export callspec-flow.png with transparent background.
 *
 *   cd assets && python3 -m http.server 8767 &
 *   npx -p playwright node export-flow-png.mjs
 *   kill $(lsof -ti:8767)
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const assets = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] ?? 'http://127.0.0.1:8767/callspec-flow.html';
const out = path.join(assets, 'callspec-flow.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 920, height: 360 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.locator('.diagram').screenshot({ path: out });
await browser.close();
console.log(`Wrote ${out}`);
