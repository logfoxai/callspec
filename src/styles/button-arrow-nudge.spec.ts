import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const stylesDir = dirname(fileURLToPath(import.meta.url));
const splashCss = readFileSync(join(stylesDir, 'splash.css'), 'utf8');
const starlightCss = readFileSync(join(stylesDir, 'starlight-custom.css'), 'utf8');
const heroAstro = readFileSync(join(stylesDir, '../overrides/Hero.astro'), 'utf8');

test('forward/back buttons nudge arrow icons on hover', (assert) => {
	assert.equal(
		heroAstro.includes('sl-link-button--forward') &&
			heroAstro.includes('sl-link-button--back'),
		true,
		'Hero tags CTAs by arrow direction',
	);
	assert.equal(
		/\.sl-link-button--forward:hover\s+svg\s*\{[^}]*translateX\(\s*0\.2rem\s*\)/s.test(
			splashCss,
		),
		true,
		'forward CTA arrow nudges right',
	);
	assert.equal(
		/\.sl-link-button--back:hover\s+svg\s*\{[^}]*translateX\(\s*-0\.2rem\s*\)/s.test(
			splashCss,
		),
		true,
		'back CTA arrow nudges left',
	);
	assert.equal(
		/\[rel=['"]next['"]\]:hover\s+svg\s*\{[^}]*translateX\(\s*0\.2rem\s*\)/s.test(
			starlightCss,
		),
		true,
		'pagination next arrow nudges right',
	);
	assert.equal(
		/\[rel=['"]prev['"]\]:hover\s+svg\s*\{[^}]*translateX\(\s*-0\.2rem\s*\)/s.test(
			starlightCss,
		),
		true,
		'pagination prev arrow nudges left',
	);
	assert.equal(
		/prefers-reduced-motion:\s*reduce[\s\S]*?sl-link-button--(?:forward|back):hover\s+svg[\s\S]*?transform:\s*none/.test(
			splashCss,
		) ||
			/prefers-reduced-motion:\s*reduce[\s\S]*?pagination-links[\s\S]*?transform:\s*none/.test(
				starlightCss,
			),
		true,
		'reduced-motion disables the nudge',
	);
});
