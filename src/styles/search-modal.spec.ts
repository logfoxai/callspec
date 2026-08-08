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

test('zero-results quotes the term and offers Discord help', (assert) => {
	assert.equal(existsSync(enI18nPath), true, 'src/content/i18n/en.json must exist');
	assert.equal(
		/"pagefind\.zero_results"\s*:\s*"No matches for [“"]\[SEARCH_TERM\][”"]/.test(enI18n),
		true,
		'zero_results copy should quote the search term',
	);
	assert.equal(
		/Try a shorter term/.test(customCss),
		false,
		'must not keep the old tip copy under no-matches',
	);
	assert.equal(
		/discord\.gg\/2wyYnBDhWQ/.test(polishAstro),
		true,
		'zero-results help should link the Callspec Discord invite',
	);
	assert.equal(
		/data-cs-search-empty-help/.test(polishAstro) && /\.cs-search-empty-help/.test(customCss),
		true,
		'empty-help panel must be injected and styled',
	);
});

test('cold open shows a loading state and does not wait on requestIdleCallback', (assert) => {
	const searchOverride = join(stylesDir, '../overrides/Search.astro');
	const astroConfig = readFileSync(join(stylesDir, '../../astro.config.mjs'), 'utf8');
	const searchSrc = existsSync(searchOverride) ? readFileSync(searchOverride, 'utf8') : '';

	assert.equal(existsSync(searchOverride), true, 'Search.astro override must exist');
	assert.equal(
		/Search:\s*['"]\.\/src\/overrides\/Search\.astro['"]/.test(astroConfig),
		true,
		'astro.config must wire the Search override',
	);
	assert.equal(
		/data-cs-search-loading/.test(searchSrc),
		true,
		'Search override must render a loading placeholder before Pagefind mounts',
	);
	assert.equal(
		/requestIdleCallback/.test(searchSrc),
		false,
		'must not defer Pagefind init to requestIdleCallback (cold-open delay)',
	);
	assert.equal(
		/\.cs-search-loading/.test(customCss),
		true,
		'starlight-custom.css must style the loading placeholder',
	);
});

test('filtered search uses a cs-pagefind shim (ESM exports are immutable)', (assert) => {
	const searchOverride = join(stylesDir, '../overrides/Search.astro');
	const packageJson = readFileSync(join(stylesDir, '../../package.json'), 'utf8');
	const searchSrc = existsSync(searchOverride) ? readFileSync(searchOverride, 'utf8') : '';
	const shimEntry = join(stylesDir, '../cs-pagefind/pagefind.ts');
	const shimScript = join(stylesDir, '../../scripts/write-cs-pagefind-shim.mjs');

	assert.equal(existsSync(shimEntry), true, 'cs-pagefind entry must exist');
	assert.equal(existsSync(shimScript), true, 'write-cs-pagefind-shim script must exist');
	assert.equal(
		/write-cs-pagefind-shim/.test(packageJson),
		true,
		'astro:build must emit the cs-pagefind shim after Pagefind indexes',
	);
	assert.equal(
		/cs-pagefind\//.test(searchSrc),
		true,
		'Search must load PagefindUI JS from the filtered shim path',
	);
	assert.equal(
		/\.search\s*=/.test(searchSrc),
		false,
		'must not assign over pagefind.search (throws on ESM module namespace)',
	);
});

test('in-flight search shows a pending skeleton and keeps dialog height stable', (assert) => {
	const searchOverride = join(stylesDir, '../overrides/Search.astro');
	const searchSrc = existsSync(searchOverride) ? readFileSync(searchOverride, 'utf8') : '';

	assert.equal(
		/data-cs-search-pending/.test(polishAstro),
		true,
		'SearchModalPolish must inject a pending panel while a query runs',
	);
	assert.equal(
		/\.cs-search-pending/.test(customCss),
		true,
		'starlight-custom.css must style the pending shimmer rows',
	);
	assert.equal(
		/dialog\[open\]\[data-cs-search=["']searching["']\][^}]*min-height:\s*\d/.test(customCss),
		true,
		'searching dialog must reserve min-height so the shell does not collapse',
	);
	assert.equal(
		/debounceTimeoutMs:\s*150/.test(searchSrc),
		true,
		'PagefindUI should use a snappier 150ms debounce',
	);
});
