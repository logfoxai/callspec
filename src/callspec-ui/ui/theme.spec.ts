import {test} from 'kizu';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {toggleTheme} from './theme';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function mockThemeEnv(opts: {
    theme: 'light' | 'dark';
    prefersReducedMotion?: boolean;
}): {vtCalls: () => number; dataset: {theme?: string}; store: Map<string, string>} {

    let vtCalls = 0;
    const dataset: {theme?: string} = {theme: opts.theme};
    const store = new Map<string, string>([['starlight-theme', opts.theme]]);

    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            documentElement: {dataset},
            startViewTransition: (cb: () => void) => {
                vtCalls += 1;
                cb();
                return {finished: Promise.resolve()};
            },
        },
    });
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => {
                store.set(key, value);
            },
        },
    });
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            matchMedia: (query: string) => ({
                matches: query.includes('prefers-reduced-motion')
                    ? Boolean(opts.prefersReducedMotion)
                    : false,
                addEventListener: () => undefined,
            }),
        },
    });

    return {vtCalls: () => vtCalls, dataset, store};

}

test('toggleTheme: uses startViewTransition when available', (assert) => {

    const env = mockThemeEnv({theme: 'light'});
    const next = toggleTheme('light');

    assert.equal(next, 'dark');
    assert.equal(env.dataset.theme, 'dark');
    assert.equal(env.vtCalls(), 1);
    assert.equal(env.store.get('starlight-theme'), 'dark');

});

test('toggleTheme: skips view transition when reduced motion', (assert) => {

    const env = mockThemeEnv({theme: 'dark', prefersReducedMotion: true});
    const next = toggleTheme('dark');

    assert.equal(next, 'light');
    assert.equal(env.dataset.theme, 'light');
    assert.equal(env.vtCalls(), 0);

});

test('docs ThemeSelect: theme change uses startViewTransition', (assert) => {

    const themeSelect = readFileSync(path.join(root, 'src/overrides/ThemeSelect.astro'), 'utf8');

    assert.equal(themeSelect.includes('startViewTransition'), true);
    assert.equal(themeSelect.includes('prefers-reduced-motion'), true);

});
