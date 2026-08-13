#!/usr/bin/env node
/**
 * Built Starlight 404 must be a dedicated page — not the homepage marketing pile.
 * Run after `astro:build` (wired into npm run validate).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'docs-site', '404.html');

if (!fs.existsSync(htmlPath)) {
	console.error('assert-404-page: missing docs-site/404.html (run astro:build first)');
	process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

const forbidden = [
	'splash-heap',
	'duct-taped-tech-stack.svg',
	'SplashPile',
	'Zod × 2',
	'swagger-ui',
	'duct-taping a dozen tools',
	'splash-hero__pitch',
	'SplashHomeHero',
];
for (const needle of forbidden) {
	if (html.includes(needle)) {
		console.error(`assert-404-page: 404.html must not include marketing pile marker: ${needle}`);
		process.exit(1);
	}
}

const required = [
	'Page not found',
	'getting-started',
	'not-found-page',
	'not-found-hero',
	'not-found-hero__code',
];
for (const needle of required) {
	if (!html.includes(needle)) {
		console.error(`assert-404-page: 404.html missing expected content: ${needle}`);
		process.exit(1);
	}
}

console.log('assert-404-page: ok');
