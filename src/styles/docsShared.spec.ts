import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('astro + vite both import docs-shared', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const tokens = readFileSync(path.join(root, 'src/callspec-ui/ui/docs-tokens.css'), 'utf8');

    assert.equal(astro.includes('docs-shared.css'), true);
    assert.equal(tokens.includes('docs-shared.css'), true);

});

test('astro redirects do not register both slash variants of one path', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const block = astro.match(/redirects:\s*\{([^}]+)\}/);

    assert.equal(Boolean(block), true);

    const keys = [...(block?.[1] ?? '').matchAll(/['"]([^'"]+)['"]\s*:/g)].map((match) => match[1]);
    const seen = new Set<string>();

    for (const key of keys) {

        const normalized = key.replace(/\/$/, '') || '/';

        assert.equal(seen.has(normalized), false);
        seen.add(normalized);

    }

    assert.equal(seen.has('/api-reference'), true);

});

test('splash.css loads from the homepage Astro page', (assert) => {

    const index = readFileSync(path.join(root, 'src/pages/index.astro'), 'utf8');
    const splash = readFileSync(path.join(root, 'src/components/splash.css'), 'utf8');

    assert.equal(index.includes('splash.css'), true);
    assert.equal(index.includes('SplashHomeHero'), true);
    assert.equal(index.includes('SplashFlow'), true);
    assert.equal(splash.includes(':has(.splash-page)'), true);

});

test('guide site footer is a Starlight override with GitHub, Discord, and MIT', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const footer = readFileSync(path.join(root, 'src/overrides/Footer.astro'), 'utf8');
    const site = readFileSync(path.join(root, 'src/components/SiteFooter.astro'), 'utf8');

    assert.equal(astro.includes("Footer: './src/overrides/Footer.astro'"), true);
    assert.equal(footer.includes('SiteFooter'), true);
    assert.equal(site.includes('github.com/logfoxai/callspec'), true);
    assert.equal(site.includes('discord.gg/'), true);
    assert.equal(site.includes('MIT'), true);

});

test('custom pages are Astro, not collection MDX', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');

    assert.equal(existsSync(path.join(root, 'src/pages/index.astro')), true);
    assert.equal(existsSync(path.join(root, 'src/pages/404.astro')), true);
    assert.equal(existsSync(path.join(root, 'src/content/docs/index.mdx')), false);
    assert.equal(existsSync(path.join(root, 'src/content/docs/404.mdx')), false);
    assert.equal(astro.includes('disable404Route: true'), true);

});

test('vite UI @font-face urls resolve to public /fonts/ files', (assert) => {

    const tokensPath = path.join(root, 'src/callspec-ui/ui/docs-tokens.css');
    const tokens = readFileSync(tokensPath, 'utf8');
    const urls = [...tokens.matchAll(/url\(['"]([^'"]+\.woff2)['"]\)/g)].map((match) => match[1]);

    assert.equal(urls.length >= 3, true);
    assert.equal(urls.every((url) => url.startsWith('/fonts/')), true);

    for (const url of urls) {
        assert.equal(existsSync(path.join(root, 'assets', url.slice(1))), true);
    }

});

test('docs highlight aliases the primary fill token', (assert) => {

    const shared = readFileSync(path.join(root, 'src/styles/docs-shared.css'), 'utf8');
    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    assert.equal(shared.includes('--docs-link: var(--docs-primary-bg)'), true);
    assert.equal(shared.includes('--cs-cyan: var(--docs-primary-bg)'), true);
    assert.equal(shared.includes('--cs-link: var(--docs-primary-bg)'), true);
    assert.equal(starlight.includes('--sl-color-text-accent: var(--docs-primary-bg)'), true);
    assert.equal(starlight.includes('--sl-color-accent-high: var(--docs-primary-bg)'), true);
    assert.equal(shared.includes('--docs-primary-hover-bg: var(--docs-primary-bg)'), true);

});

test('powered-by footer is placed in .content', (assert) => {

    const place = readFileSync(path.join(root, 'src/callspec-ui/ui/poweredByFooter.ts'), 'utf8');
    const main = readFileSync(path.join(root, 'src/callspec-ui/ui/main.ts'), 'utf8');

    assert.equal(place.includes('content.appendChild(footer)'), true);
    assert.equal(place.includes('parkPoweredByFooter'), true);
    assert.equal(main.includes('placePoweredByFooter'), true);
    assert.equal(main.includes('parkPoweredByFooter'), true);

});
