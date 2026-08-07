#!/usr/bin/env node
/**
 * Vite 8 defaults cssMinify to lightningcss, which drops unprefixed
 * `backdrop-filter` when `-webkit-backdrop-filter` is also present. Chromium
 * then skips the frost effect in production. Guard the splash nav values.
 * @see https://github.com/vitejs/vite/issues/22649
 */
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

const cssDir = join(process.cwd(), 'docs-site', '_astro');
const cssFiles = readdirSync(cssDir).filter((name) => name.endsWith('.css'));
if (cssFiles.length === 0) {
	console.error('assert-prod-css-backdrop: no CSS under docs-site/_astro (run astro:build first)');
	process.exit(1);
}

const haystack = cssFiles
	.map((name) => readFileSync(join(cssDir, name), 'utf8'))
	.join('\n');

// Splash nav uses these blur amounts (see splash.css). Require the unprefixed
// property — not only -webkit-backdrop-filter (Chromium ignores webkit-only).
const required = ['blur(10px)', 'blur(16px)'];
const missing = required.filter((blur) => {
	const unprefixed = new RegExp(
		String.raw`(?<!-webkit-)backdrop-filter\s*:\s*[^;]*${blur.replace('(', '\\(').replace(')', '\\)')}`,
	);
	return !unprefixed.test(haystack);
});

if (missing.length > 0) {
	console.error(
		'assert-prod-css-backdrop: production CSS missing unprefixed backdrop-filter for: ' +
			missing.join(', ') +
			'.\nVite 8 lightningcss minify drops it; set vite.build.cssMinify to "esbuild" in astro.config.mjs.',
	);
	process.exit(1);
}

console.log('assert-prod-css-backdrop: ok (splash backdrop-filter blur values present unprefixed)');
