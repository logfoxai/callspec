import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const stylesDir = dirname(fileURLToPath(import.meta.url));
const splashCss = readFileSync(join(stylesDir, 'splash.css'), 'utf8');
const heroAstro = readFileSync(
	join(stylesDir, '../overrides/Hero.astro'),
	'utf8',
);

test('splash hero is typewriter headline + lead, no eyebrow', (assert) => {
	assert.equal(
		heroAstro.includes('splash-hero__eyebrow'),
		false,
		'eyebrow was removed',
	);
	assert.equal(
		heroAstro.includes('splash-hero__headline') && heroAstro.includes('<h2'),
		true,
		'visible typewriter line is an h2',
	);
	assert.equal(
		heroAstro.includes('splash-hero__lead'),
		true,
		'lead explains what you define and what you get',
	);
	assert.equal(
		splashCss.includes('splash-typewriter') && splashCss.includes('splash-caret'),
		true,
		'headline keeps typewriter + caret',
	);
	assert.equal(
		/prefers-reduced-motion:\s*reduce[\s\S]*?\.splash-hero__headline[\s\S]*?animation:\s*none/.test(
			splashCss,
		),
		true,
		'reduced-motion skips the typewriter',
	);
});

test('typewriter headline leaves room for descenders under overflow clip', (assert) => {
	const headlineBlock = splashCss.match(
		/\.splash-hero__headline\s*\{[^}]+\}/s,
	)?.[0];
	assert.equal(Boolean(headlineBlock), true, 'headline rule exists');
	assert.equal(
		/overflow:\s*hidden/.test(headlineBlock ?? ''),
		true,
		'typewriter still clips horizontally via overflow',
	);
	const lineHeight = Number(
		headlineBlock?.match(/line-height:\s*([\d.]+)/)?.[1],
	);
	assert.equal(
		Number.isFinite(lineHeight) && lineHeight >= 1.3,
		true,
		'line-height tall enough for g/p/y descenders',
	);
	assert.equal(
		/padding-block:\s*[^;]*0\.\d+em/.test(headlineBlock ?? '') ||
			/padding-bottom:\s*0\.\d+em/.test(headlineBlock ?? ''),
		true,
		'extra block padding keeps descenders inside the clip box',
	);
});
