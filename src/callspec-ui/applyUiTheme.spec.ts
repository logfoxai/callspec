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

    assert.equal(result.cssVars, {
        '--accent': '#0ea5e9',
        '--bg': '#0f172a',
        '--surface': '#1e293b',
        '--sans': '"IBM Plex Sans", system-ui, sans-serif',
    });
    assert.equal(result.fontUrls, [
        'https://fonts.example/plex.css',
        'https://fonts.example/plex-mono.css',
    ]);

});

test('applyUiTheme: omits unset keys and defaults fontUrls to []', (assert) => {

    const result = applyUiTheme({accent: '#111'});

    assert.equal(result.cssVars, {'--accent': '#111'});
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
