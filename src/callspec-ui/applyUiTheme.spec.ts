import {test} from 'kizu';
import {applyUiTheme} from './applyUiTheme';

test('applyUiTheme: maps theme keys to CSS vars and returns fontUrls', (assert) => {

    const result = applyUiTheme({
        accent: '#0ea5e9',
        background: '#0f172a',
        surface: '#1e293b',
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontUrls: [
            'https://fonts.example/plex.css',
            'https://fonts.example/plex-mono.css',
        ],
    });

    assert.equal(result.cssVars['--accent'], '#0ea5e9');
    assert.equal(result.cssVars['--nav-active-bg'], '#0ea5e9');
    assert.equal(result.cssVars['--nav-active-fg'], '#fafafa');
    assert.equal(result.cssVars['--cs-primary-bg'], '#0ea5e9');
    assert.equal(result.cssVars['--cs-primary-fg'], '#fafafa');
    assert.equal(
        result.cssVars['--accent-soft'],
        'color-mix(in srgb, #0ea5e9 16%, var(--surface))',
    );
    assert.equal(result.cssVars['--bg'], '#0f172a');
    assert.equal(result.cssVars['--surface'], '#1e293b');
    assert.equal(result.cssVars['--sans'], '"IBM Plex Sans", system-ui, sans-serif');
    // Dark brand surfaces pin both color modes — derive light text for contrast.
    assert.equal(result.cssVars['--text'], '#fafafa');
    assert.equal(result.cssVars['--text-secondary'], '#a3a3a3');
    assert.equal(result.cssVars['--text-tertiary'], '#737373');
    assert.equal(result.fontUrls, [
        'https://fonts.example/plex.css',
        'https://fonts.example/plex-mono.css',
    ]);

});

test('applyUiTheme: light background derives dark text tokens', (assert) => {

    const result = applyUiTheme({
        background: '#f7f9f9',
        surface: '#ffffff',
    });

    assert.equal(result.cssVars['--bg'], '#f7f9f9');
    assert.equal(result.cssVars['--surface'], '#ffffff');
    assert.equal(result.cssVars['--text'], 'hsl(228, 25%, 12%)');
    assert.equal(result.cssVars['--text-secondary'], 'hsl(228, 10%, 40%)');
    assert.equal(result.cssVars['--text-tertiary'], 'hsl(228, 8%, 52%)');

});

test('applyUiTheme: accent-only sets nav active tokens from accent contrast', (assert) => {

    const result = applyUiTheme({accent: '#111'});

    assert.equal(result.cssVars['--accent'], '#111');
    assert.equal(result.cssVars['--nav-active-bg'], '#111');
    assert.equal(result.cssVars['--nav-active-fg'], '#fafafa');
    assert.equal(result.cssVars['--cs-primary-bg'], '#111');
    assert.equal(
        result.cssVars['--accent-soft'],
        'color-mix(in srgb, #111 16%, var(--surface))',
    );
    assert.equal(result.fontUrls, []);

});

test('applyUiTheme: empty theme yields empty cssVars', (assert) => {

    const result = applyUiTheme({});

    assert.equal(result.cssVars, {});
    assert.equal(result.fontUrls, []);

});

test('applyUiTheme: undefined theme yields empty result', (assert) => {

    const result = applyUiTheme(undefined);

    assert.equal(result.cssVars, {});
    assert.equal(result.fontUrls, []);

});
