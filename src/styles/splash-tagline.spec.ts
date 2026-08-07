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
