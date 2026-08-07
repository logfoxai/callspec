import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const splashCss = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), 'splash.css'),
	'utf8',
);

test('splash tagline uses gradient text + fade-in, not typewriter', (assert) => {
	assert.equal(
		splashCss.includes('splash-typewriter') || splashCss.includes('splash-caret'),
		false,
		'typewriter/caret animation was removed',
	);
	assert.equal(
		/background-clip:\s*text/.test(splashCss),
		true,
		'tagline should use clipped gradient text',
	);
	assert.equal(
		splashCss.includes('@keyframes splash-tagline-in'),
		true,
		'subtle entrance animation should remain',
	);
	assert.equal(
		/prefers-reduced-motion:\s*reduce[\s\S]*?\.splash-hero__tagline[\s\S]*?animation:\s*none/.test(
			splashCss,
		),
		true,
		'reduced-motion skips the entrance animation',
	);
});
