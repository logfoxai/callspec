import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const splashCss = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), 'splash.css'),
	'utf8',
);

test('splash hero tagline typewriter keyframes and reduced-motion fallback exist', (assert) => {
	assert.equal(
		splashCss.includes('.splash-hero__title'),
		false,
		'visible brand h1/title typewriter was reverted — brand stays in the nav',
	);
	assert.equal(
		/@keyframes\s+splash-typewriter[\s\S]*?max-width:\s*0/.test(splashCss),
		true,
		'typewriter should reveal via max-width (not ch×steps — that clips proportional text)',
	);
	assert.equal(
		splashCss.includes('width: calc(var(--type-steps) * 1ch'),
		false,
		'ch-based final width under-measures and clips mid-word (e.g. “and O”)',
	);
	assert.equal(
		splashCss.includes('@keyframes splash-caret'),
		true,
		'caret blink keyframes required for the border-right cursor',
	);
	assert.equal(
		/prefers-reduced-motion:\s*reduce[\s\S]*?\.splash-hero__tagline[\s\S]*?animation:\s*none/.test(
			splashCss,
		),
		true,
		'reduced-motion visitors must skip the typewriter',
	);
	assert.equal(
		/@media\s+print[\s\S]*?\.splash-hero__tagline[\s\S]*?animation:\s*none/.test(splashCss),
		true,
		'print must show the full tagline (animations do not run when printing)',
	);
	assert.equal(
		splashCss.includes('drop-shadow'),
		false,
		'no glow / drop-shadow on the typewriter headline',
	);
});
