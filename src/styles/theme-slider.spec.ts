import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';

const theme = readFileSync(
	path.join(process.cwd(), 'src/overrides/ThemeSelect.astro'),
	'utf8',
);

test('theme control is a click toggle with in-track sun/moon; default system', (assert) => {
	assert.equal(theme.includes('name="laptop"'), false, 'no laptop icon');
	assert.equal(theme.includes('name="sun"'), true, 'sun icon for light');
	assert.equal(theme.includes('name="moon"'), true, 'moon icon for dark');
	assert.equal(
		theme.includes('theme-slider__shell') &&
			theme.includes('theme-slider__icon--sun') &&
			theme.includes('theme-slider__icon--moon'),
		true,
		'sun/moon live inside the slider shell',
	);
	assert.equal(theme.includes('type="range"'), false, 'no drag range input');
	assert.equal(
		/<button[\s\S]*class="theme-slider"/.test(theme) && theme.includes("addEventListener('click'"),
		true,
		'click toggles theme',
	);
	assert.equal(
		theme.includes("'auto'") && /raw === null \|\| raw === ''/.test(theme),
		true,
		'unset storage defaults to system/auto',
	);
	assert.equal(
		theme.includes("querySelectorAll('starlight-theme-select .theme-slider')") ||
			theme.includes('querySelectorAll("starlight-theme-select .theme-slider")'),
		true,
		'syncs every ThemeSelect instance (header + mobile)',
	);
	assert.equal(
		theme.includes("html[data-theme='dark']") && theme.includes("html[data-theme='light']"),
		true,
		'thumb/icons follow html[data-theme] (no hardcoded dark default)',
	);
	assert.equal(
		/--ts-thumb:\s*#fff/.test(theme) && !theme.includes('--ts-thumb: var(--sl-color-white)'),
		true,
		'thumb uses a real white (Starlight --sl-color-white is text color)',
	);
});
