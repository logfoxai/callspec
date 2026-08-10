/**
 * Ensure astro:build published the hosted Chirp explorer at docs-site/demo.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demoDir = path.join(root, 'docs-site', 'demo');
const required = ['index.html', 'callspec.json', 'openapi.json', 'brand/mark.svg'];

for (const rel of required) {
	const full = path.join(demoDir, rel);
	if (!fs.existsSync(full)) {
		console.error(`assert-chirp-static-demo: missing ${path.relative(root, full)}`);
		process.exit(1);
	}
}

const html = fs.readFileSync(path.join(demoDir, 'index.html'), 'utf8');
if (!html.includes('Hosted explorer') || !html.includes('./callspec.json')) {
	console.error('assert-chirp-static-demo: demo index.html missing expected baked config');
	process.exit(1);
}

console.log('assert-chirp-static-demo: ok');
