import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

/**
 * Splash nav scroll polish: toggling .splash-nav-scrolled must not flash a bright
 * border. That happens when border-width goes 0→1px while border-color transitions
 * from the computed (light) color toward the dark hairline.
 */
const splashCss = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), 'splash.css'),
	'utf8',
);

function headerRestBlock(css: string): string {
	const marker = 'header.header {';
	const start = css.indexOf(marker);
	if (start < 0) return '';
	// First header.header block in the splash shell is the rest state.
	const from = start + marker.length;
	const end = css.indexOf('}', from);
	return css.slice(from, end);
}

test('splash nav rest state keeps a 1px transparent border (no width flip on scroll)', (assert) => {
	const block = headerRestBlock(splashCss);
	assert.equal(block.length > 0, true, 'expected splash header.header rest rules');

	assert.equal(
		/border-bottom:\s*0\b/.test(block),
		false,
		'border-bottom: 0 causes a bright flash when width becomes 1px on scroll',
	);
	assert.equal(
		/border-bottom:\s*1px\s+solid\s+transparent/.test(block),
		true,
		'rest state should use 1px solid transparent so only color changes on scroll',
	);
});
