import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';

const theme = readFileSync(
	path.join(process.cwd(), 'src/overrides/ThemeSelect.astro'),
	'utf8',
);

test('theme control is a 3-position slider with system default and sun/moon icons', (assert) => {
	assert.equal(theme.includes('name="laptop"'), false, 'no laptop icon');
	assert.equal(theme.includes('name="sun"'), true, 'sun icon for light');
	assert.equal(theme.includes('name="moon"'), true, 'moon icon for dark');
	assert.equal(
		/type="range"|role="slider"|theme-slider/.test(theme),
		true,
		'slider control present',
	);
	assert.equal(
		theme.includes("'auto'") && /default|loadTheme|parseTheme/.test(theme),
		true,
		'system/auto theme supported',
	);
	// Default preference: empty storage → auto (system)
	assert.equal(
		/localStorage\.getItem[\s\S]*\?\? ['"]auto['"]|parseTheme\([^)]*\)\s*:\s*'auto'|:\s*'auto'/.test(
			theme,
		),
		true,
		'falls back to auto/system when unset',
	);
});
