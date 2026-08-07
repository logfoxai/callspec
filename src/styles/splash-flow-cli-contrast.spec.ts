import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const splashCss = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), 'splash.css'),
	'utf8',
);

function lightSplashCliBlock(css: string): string {
	const lightStart = css.indexOf("html[data-theme='light'] .splash-flow");
	if (lightStart < 0) return '';
	const from = css.indexOf('.splash-flow__cli', lightStart);
	if (from < 0) return '';
	const open = css.indexOf('{', from);
	const close = css.indexOf('}', open);
	return css.slice(from, close + 1);
}

test('light-mode splash CLI bubble contrasts against the soft panel', (assert) => {
	const cli = lightSplashCliBlock(splashCss);
	assert.equal(cli.includes('.splash-flow__cli'), true, 'expected light .splash-flow__cli rules');
	assert.equal(
		/#f8f9fc|#eef0f5/.test(cli),
		false,
		'near-white gradient on --flow-soft washes out the CLI bubble',
	);
	assert.equal(
		/background:\s*#ffffff/.test(cli),
		true,
		'CLI bubble should use solid white in light mode',
	);
	assert.equal(
		/0\s+0\s+0\s+1px\s+hsl\(228\s+16%\s+78%\)/.test(cli),
		true,
		'CLI bubble needs a stronger edge than the soft panel',
	);
});
