import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const splashCss = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), 'splash.css'),
	'utf8',
);

test('splash hero title typewriter keyframes and reduced-motion fallback exist', (assert) => {
	assert.equal(
		/@keyframes\s+splash-typewriter\s*\{[^}]*width:\s*0/.test(splashCss.replace(/\s+/g, ' ')),
		true,
		'typewriter animation should start at width 0',
	);
	assert.equal(
		splashCss.includes('@keyframes splash-caret'),
		true,
		'caret blink keyframes required for the border-right cursor',
	);
	assert.equal(
		/prefers-reduced-motion:\s*reduce[\s\S]*?\.splash-hero__title[\s\S]*?animation:\s*none/.test(
			splashCss,
		),
		true,
		'reduced-motion visitors must skip the typewriter',
	);
});
