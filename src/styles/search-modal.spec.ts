import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

/**
 * Starlight reserves min-height: 15rem on the search dialog so results don't jump.
 * That leaves a hollow void for idle + zero-results. We collapse that shell and
 * paint real empty / no-match states instead.
 */
const stylesDir = dirname(fileURLToPath(import.meta.url));
const customCssPath = join(stylesDir, 'starlight-custom.css');
const polishPath = join(stylesDir, '../components/SearchModalPolish.astro');
const enI18nPath = join(stylesDir, '../content/i18n/en.json');

const customCss = readFileSync(customCssPath, 'utf8');
const polishAstro = existsSync(polishPath) ? readFileSync(polishPath, 'utf8') : '';
const enI18n = existsSync(enI18nPath) ? readFileSync(enI18nPath, 'utf8') : '';
const headAstro = readFileSync(join(stylesDir, '../overrides/Head.astro'), 'utf8');

test('search dialog drops Starlight’s 15rem min-height when idle or empty', (assert) => {
	assert.equal(
		/site-search\s+dialog\[open\]:not\(:has\(\.pagefind-ui__result\)\)\s*\{[^}]*min-height:\s*0/.test(
			customCss,
		),
		true,
		'idle / zero-results dialog must not keep the 15rem empty shell',
	);
});

test('idle state ships a real empty panel (not a blank dialog)', (assert) => {
	assert.equal(existsSync(polishPath), true, 'SearchModalPolish.astro must exist');
	assert.equal(
		/SearchModalPolish/.test(headAstro),
		true,
		'Head must mount SearchModalPolish on every docs page',
	);
	assert.equal(
		/data-cs-search-idle/.test(polishAstro),
		true,
		'SearchModalPolish must inject an idle panel into the dialog',
	);
	assert.equal(
		/\.cs-search-idle/.test(customCss),
		true,
		'starlight-custom.css must style the idle panel',
	);
	assert.equal(
		/data-cs-search-suggestion/.test(polishAstro),
		true,
		'idle panel should offer clickable suggestion chips',
	);
});

test('zero-results message is styled as a composed empty state', (assert) => {
	assert.equal(existsSync(enI18nPath), true, 'src/content/i18n/en.json must exist');
	assert.equal(
		/\.pagefind-ui__message/.test(customCss) &&
			/pagefind-ui__results:not\(:has\(\.pagefind-ui__result\)\)/.test(customCss),
		true,
		'CSS must target the zero-results message + empty results list',
	);
	assert.equal(
		/"pagefind\.zero_results"\s*:\s*"[^"]+"/.test(enI18n),
		true,
		'en i18n should override Pagefind’s zero_results copy',
	);
});
