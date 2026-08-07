import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const stylesDir = dirname(fileURLToPath(import.meta.url));
const fontsCss = readFileSync(join(stylesDir, 'fonts.css'), 'utf8');
const starlightCss = readFileSync(join(stylesDir, 'starlight-custom.css'), 'utf8');
const splashCss = readFileSync(join(stylesDir, 'splash.css'), 'utf8');
const pageTitleAstro = readFileSync(
	join(stylesDir, '../overrides/PageTitle.astro'),
	'utf8',
);

test('body stack is Inter; heading stack is Manrope', (assert) => {
	assert.equal(
		/--sl-font:\s*'Inter'/.test(starlightCss),
		true,
		'--sl-font is Inter',
	);
	assert.equal(
		/--cs-font-heading:\s*'Manrope'/.test(starlightCss),
		true,
		'--cs-font-heading is Manrope',
	);
	assert.equal(
		fontsCss.includes("font-family: 'Inter'") &&
			fontsCss.includes("font-family: 'Manrope'"),
		true,
		'@font-face registers both families',
	);
});

test('headers and CTAs use Manrope; UI/body stay Inter', (assert) => {
	assert.equal(
		/\.splash-hero__headline\s*\{[^}]*font-family:\s*var\(--cs-font-heading\)/s.test(
			splashCss,
		),
		true,
		'splash hero headline uses Manrope',
	);
	assert.equal(
		/\.splash-hero__lead\s*\{[^}]*font-family:\s*var\(--sl-font\)/s.test(splashCss),
		true,
		'splash lead stays Inter',
	);
	assert.equal(
		/\.sl-link-button\s*\{[^}]*font-family:\s*var\(--cs-font-heading\)/s.test(splashCss),
		true,
		'splash CTA buttons use Manrope',
	);
	assert.equal(
		/\.sl-link-button\s*\{[^}]*font-weight:\s*700/s.test(splashCss),
		true,
		'splash CTA buttons are bold',
	);
	assert.equal(
		starlightCss.includes('.splash-hero__headline') &&
			/font-family:\s*var\(--cs-font-heading\)/.test(
				starlightCss.slice(
					starlightCss.indexOf('/* Headings'),
					starlightCss.indexOf('/* Belt-and-suspenders'),
				),
			),
		true,
		'central heading rule includes splash hero + Manrope token',
	);
	assert.equal(
		pageTitleAstro.includes('font-family: var(--cs-font-heading)'),
		true,
		'guide page title uses heading font',
	);
	assert.equal(
		/Belt-and-suspenders[\s\S]*font-family:\s*var\(--sl-font\)/.test(starlightCss),
		true,
		'chrome / body copy forced back to Inter',
	);
	assert.equal(
		/\.splash-flow__title\s*\{[^}]*font-family:\s*var\(--sl-font\)/s.test(splashCss),
		true,
		'flow diagram titles use Inter',
	);
	assert.equal(
		!starlightCss
			.slice(
				starlightCss.indexOf('/* Headings'),
				starlightCss.indexOf('/* Belt-and-suspenders'),
			)
			.includes('.splash-flow__title'),
		true,
		'flow titles are not in the Manrope heading rule',
	);
	assert.equal(
		/#starlight__sidebar\s+summary\s*\{[^}]*font-family:\s*var\(--sl-font\)/s.test(
			starlightCss,
		),
		true,
		'sidebar nav group headers use Inter',
	);
});
