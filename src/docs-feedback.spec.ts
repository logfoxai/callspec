import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';

const root = process.cwd();
const read = (rel: string): string => readFileSync(path.join(root, rel), 'utf8');

test('coding-agents SKILL.md links to main (not deleted next branch)', (assert) => {
	const md = read('src/content/docs/coding-agents.md');
	assert.equal(md.includes('/blob/next/'), false, 'must not link blob/next');
	assert.equal(
		md.includes('https://github.com/logfoxai/callspec/blob/main/skills/callspec/SKILL.md'),
		true,
		'GitHub SKILL.md URL uses main',
	);
});

test('Fern comparison page is removed from docs and sidebar', (assert) => {
	assert.equal(
		existsSync(path.join(root, 'src/content/docs/using-fern-with-callspec.md')),
		false,
		'using-fern-with-callspec.md deleted',
	);
	const astro = read('astro.config.mjs');
	assert.equal(astro.includes('using-fern-with-callspec'), false, 'sidebar has no Fern entry');
	assert.equal(astro.includes('Callspec + Fern'), false, 'sidebar has no Fern label');
	const splash = read('src/components/SplashFlow.astro');
	assert.equal(splash.includes('fern'), false, 'splash flow has no Fern branding');
});

test('theme control is a light/dark switch (not laptop cycle)', (assert) => {
	const theme = read('src/overrides/ThemeSelect.astro');
	assert.equal(theme.includes('name="laptop"'), false, 'no laptop icon');
	assert.equal(
		/theme-switch|role="switch"|type="checkbox"/.test(theme),
		true,
		'uses a switch control',
	);
	assert.equal(theme.includes("'auto'"), false, 'binary light/dark only');
});

test('header GitHub icon is not accent purple', (assert) => {
	const css = read('src/styles/starlight-custom.css');
	assert.equal(
		/header\.header\s+\.social-icons\s+a\s*\{[^}]*color:\s*var\(--sl-color-gray-2\)/s.test(css),
		true,
		'social icons use muted gray, not accent',
	);
});

test('search override offers empty-state suggestions', (assert) => {
	const search = read('src/overrides/Search.astro');
	assert.equal(search.includes('search-suggestions'), true, 'suggestions markup present');
	assert.equal(search.includes('/getting-started/'), true, 'suggests Getting started');
	assert.equal(search.includes('/error-handling/'), true, 'suggests Error handling');
	const astro = read('astro.config.mjs');
	assert.equal(astro.includes("Search: './src/overrides/Search.astro'"), true);
});

test('getting-started: AI install prompt, resolver comment, builtins link', (assert) => {
	const md = read('src/content/docs/getting-started.md');
	assert.equal(
		/AI|agent|paste/i.test(md) && md.includes('callspec'),
		true,
		'includes copy-paste prompt for AI install',
	);
	assert.equal(
		md.includes('resolver:') && /\/\/.*resolver/i.test(md),
		true,
		'inline comment explains resolver',
	);
	assert.equal(
		md.includes('error-handling.md') && /builtin|#builtin/i.test(md),
		true,
		'points to builtin error list',
	);
});

test('error-handling and api-reference cross-link builtins and related pages', (assert) => {
	const errors = read('src/content/docs/error-handling.md');
	assert.equal(errors.includes('## Builtin codes'), true);
	assert.equal(
		errors.includes('getting-started.md') || errors.includes('api-reference'),
		true,
		'error-handling links out for navigation',
	);
	const api = read('src/content/docs/api-reference.md');
	assert.equal(
		api.includes('error-handling.md') || api.includes('../error-handling'),
		true,
		'API reference links to error handling / builtins',
	);
});

test('authentication docs state authenticate is a function; per-route is none|bearer', (assert) => {
	const md = read('src/content/docs/authentication.md');
	assert.equal(md.includes('Authenticate'), true);
	assert.equal(
		/function|Authenticate</i.test(md),
		true,
		'documents authenticate as a function',
	);
	assert.equal(
		/per-route|same `authenticate`|one `authenticate`/i.test(md),
		true,
		'clarifies shared authenticate vs per-route auth mode',
	);
});
