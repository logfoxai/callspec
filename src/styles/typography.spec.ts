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

test('everything uses Inter (body + headings)', (assert) => {
	assert.equal(
		/--sl-font:\s*'Inter'/.test(starlightCss),
		true,
		'--sl-font is Inter',
	);
	assert.equal(
		/--cs-font-heading:\s*var\(--sl-font\)/.test(starlightCss),
		true,
		'heading token aliases Inter body stack',
	);
	assert.equal(
		fontsCss.includes("font-family: 'Inter'"),
		true,
		'@font-face registers Inter',
	);
});

test('headers and CTAs share Inter; no separate display face', (assert) => {
	assert.equal(
		/\.splash-hero__headline\s*\{[^}]*font-family:\s*var\(--cs-font-heading\)/s.test(
			splashCss,
		),
		true,
		'splash hero headline uses heading token (Inter)',
	);
	assert.equal(
		/\.splash-hero__lead\s*\{[^}]*font-family:\s*var\(--sl-font\)/s.test(splashCss),
		true,
		'splash lead uses Inter',
	);
	assert.equal(
		/\.sl-link-button\s*\{[^}]*font-family:\s*var\(--cs-font-heading\)/s.test(splashCss),
		true,
		'splash CTA buttons use heading token (Inter)',
	);
	assert.equal(
		/\.sl-link-button\s*\{[^}]*font-weight:\s*600/s.test(splashCss),
		true,
		'splash CTA buttons match guide link-button weight (600)',
	);
	assert.equal(
		pageTitleAstro.includes('font-family: var(--cs-font-heading)'),
		true,
		'guide page title uses heading token (Inter)',
	);
	assert.equal(
		/Belt-and-suspenders[\s\S]*font-family:\s*var\(--sl-font\)/.test(starlightCss),
		true,
		'chrome / body copy uses Inter',
	);
});
