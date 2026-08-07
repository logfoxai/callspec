import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const stylesDir = dirname(fileURLToPath(import.meta.url));
const customCss = readFileSync(join(stylesDir, 'starlight-custom.css'), 'utf8');
const splashCss = readFileSync(join(stylesDir, 'splash.css'), 'utf8');

test('light-mode site-search uses a high-contrast field (not near-white on white)', (assert) => {
	assert.equal(
		/html\[data-theme=['"]light['"]\]\s*site-search\s*>\s*button\s*\{[^}]*border-color:\s*var\(--sl-color-gray-5\)/.test(
			customCss,
		),
		true,
		'guide header search needs a visible light-mode border (gray-5)',
	);
	assert.equal(
		/color-mix\(in srgb,\s*var\(--sl-color-black\)\s+\d+%,\s*var\(--sl-color-gray-6\)\)/.test(
			customCss,
		),
		false,
		'black+gray-6 mix is nearly invisible on light --sl-color-bg-nav',
	);
	assert.equal(
		/&\[data-theme=['"]light['"]\]\s*site-search\s*>\s*button\s*\{[\s\S]*?background-color:\s*#ffffff/.test(
			splashCss,
		),
		true,
		'splash light theme restyles search to a solid high-contrast field',
	);
});
