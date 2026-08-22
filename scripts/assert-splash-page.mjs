#!/usr/bin/env node
/**
 * Built splash homepage must render the Astro page sections — not an empty
 * collection stub or the 404 body.
 * Run after `astro:build` (wired into npm run validate).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'docs-site', 'index.html');

if (!fs.existsSync(htmlPath)) {
	console.error('assert-splash-page: missing docs-site/index.html (run astro:build first)');
	process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

const required = [
	'splash-page',
	'splash-hero',
	'splash-hero__headline',
	'splash-how',
	'splash-flow',
	'splash-features',
	'splash-demo',
	'splash-sdk',
	'splash-agents',
	'Built for coding agents',
	'Typed SDK from the same spec',
	'duct-taping',
	'your API stack.',
	'splash-hero__browser',
	'/api/v2/orgs/acme-corp/teams/platform/products/catalog/items/',
	'/getting-started/',
	'/demo/',
	'/try-the-demo-locally/',
	'/docs-ui/',
	'/docs-ui-branding/',
	'/sdk-generation/',
	'/coding-agents/',
	'<title>Callspec — typed SDK, docs, OpenAPI, and MCP from one route</title>',
	'property="og:title" content="Callspec — typed SDK, docs, OpenAPI, and MCP from one route"',
	'property="og:description" content="Spec-first TypeScript RPC. Define a route once and get a typed SDK, docs, OpenAPI, and MCP from the same contract."',
	'property="og:image" content="https://callspec.logfox.ai/og.png"',
	'name="twitter:image" content="https://callspec.logfox.ai/og.png"',
];
for (const needle of required) {
	if (!html.includes(needle)) {
		console.error(`assert-splash-page: index.html missing expected content: ${needle}`);
		process.exit(1);
	}
}

const forbidden = [
	'not-found-page',
	'not-found-hero',
	'Page not found',
	'<title>Home | Callspec</title>',
	'property="og:title" content="Home"',
];
for (const needle of forbidden) {
	if (html.includes(needle)) {
		console.error(`assert-splash-page: index.html must not include 404 marker: ${needle}`);
		process.exit(1);
	}
}

const panels = html.match(/<div class="content-panel/g) ?? [];
if (panels.length !== 1) {
	console.error(`assert-splash-page: expected 1 content-panel on splash, got ${panels.length}`);
	process.exit(1);
}

const ogPng = path.join(root, 'docs-site', 'og.png');
if (!fs.existsSync(ogPng)) {
	console.error('assert-splash-page: missing docs-site/og.png (copy publicDir assets/og.png)');
	process.exit(1);
}

console.log('assert-splash-page: ok');
