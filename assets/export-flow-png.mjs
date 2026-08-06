import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const assets = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] ?? 'http://127.0.0.1:8767/callspec-flow.html';
const out = path.join(assets, 'callspec-flow.png');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 200 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.locator('.diagram').screenshot({ path: out });
await browser.close();
console.log(`Wrote ${out}`);
