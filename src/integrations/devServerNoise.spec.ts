import {test} from 'kizu';
import {
    demoPublicDirRedirect,
    demoStaleFontRel,
    isLocalDevHost,
    demoPublicFileRel,
    publicFontRel,
    rewritePublicDirIndexRequest,
    shouldBypassSecFetchForIdePreview,
    shouldShortCircuitDevtoolsProbe,
} from './devServerNoise.mjs';

test('isLocalDevHost: localhost variants only', (assert) => {
    assert.equal(isLocalDevHost('localhost:4321'), true);
    assert.equal(isLocalDevHost('127.0.0.1:4321'), true);
    assert.equal(isLocalDevHost('[::1]:4321'), true);
    assert.equal(isLocalDevHost('evil.example'), false);
    assert.equal(isLocalDevHost(undefined), false);
});

test('shouldBypassSecFetchForIdePreview: Cursor-style cross-site no-cors without Origin', (assert) => {
    assert.equal(
        shouldBypassSecFetchForIdePreview({
            secFetchSite: 'cross-site',
            secFetchMode: 'no-cors',
            origin: undefined,
            host: 'localhost:4321',
        }),
        true,
    );
    assert.equal(
        shouldBypassSecFetchForIdePreview({
            secFetchSite: 'cross-site',
            secFetchMode: 'no-cors',
            origin: undefined,
            host: 'evil.example',
        }),
        false,
    );
    assert.equal(
        shouldBypassSecFetchForIdePreview({
            secFetchSite: 'cross-site',
            secFetchMode: 'no-cors',
            origin: 'https://cursor.example',
            host: 'localhost:4321',
        }),
        false,
    );
    assert.equal(
        shouldBypassSecFetchForIdePreview({
            secFetchSite: 'same-origin',
            secFetchMode: 'no-cors',
            origin: undefined,
            host: 'localhost:4321',
        }),
        false,
    );
});

test('shouldShortCircuitDevtoolsProbe: CDP JSON endpoints only', (assert) => {
    assert.equal(shouldShortCircuitDevtoolsProbe('/json/version'), true);
    assert.equal(shouldShortCircuitDevtoolsProbe('/json/list'), true);
    assert.equal(shouldShortCircuitDevtoolsProbe('/json'), true);
    assert.equal(shouldShortCircuitDevtoolsProbe('/getting-started/'), false);
    assert.equal(shouldShortCircuitDevtoolsProbe('/jsonly'), false);
});

test('demoPublicDirRedirect: canonical trailing slash for Chirp demo', (assert) => {
    assert.equal(demoPublicDirRedirect('/demo'), '/demo/');
    assert.equal(demoPublicDirRedirect('/demo/'), null);
    assert.equal(demoPublicDirRedirect('/demo/index.html'), null);
});

test('rewritePublicDirIndexRequest: Chirp demo index in dev', (assert) => {
    assert.equal(rewritePublicDirIndexRequest('/demo'), null);
    assert.equal(rewritePublicDirIndexRequest('/demo/'), '/demo/index.html');
    assert.equal(rewritePublicDirIndexRequest('/demo/index.html'), null);
    assert.equal(rewritePublicDirIndexRequest('/demo/callspec.json'), null);
});

test('demoPublicFileRel: explorer static files, not the HTML shell or docs', (assert) => {
    assert.equal(demoPublicFileRel('/demo/callspec.json'), 'callspec.json');
    assert.equal(demoPublicFileRel('/demo/openapi.json'), 'openapi.json');
    assert.equal(demoPublicFileRel('/demo/assets/style.05a8a306.css'), 'assets/style.05a8a306.css');
    assert.equal(demoPublicFileRel('/demo/assets/app.933f31e3.js'), 'assets/app.933f31e3.js');
    assert.equal(demoPublicFileRel('/demo/brand/birb-icon-square.svg'), 'brand/birb-icon-square.svg');
    assert.equal(demoPublicFileRel('/demo/'), null);
    assert.equal(demoPublicFileRel('/demo/index.html'), null);
    assert.equal(demoPublicFileRel('/demo/assets/../secret'), null);
    assert.equal(demoPublicFileRel('/getting-started/'), null);
});

test('demoStaleFontRel: /demo/ + base href font misses map to publicDir fonts', (assert) => {

    assert.equal(
        demoStaleFontRel('/demo/node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2'),
        'fonts/ibm-plex-sans-latin-wght-normal.woff2',
    );
    assert.equal(
        demoStaleFontRel('/demo/assets/fonts/ibm-plex-mono-latin-400-normal.woff2'),
        'fonts/ibm-plex-mono-latin-400-normal.woff2',
    );
    assert.equal(
        demoStaleFontRel('/demo/fonts/ibm-plex-mono-latin-600-normal.woff2'),
        'fonts/ibm-plex-mono-latin-600-normal.woff2',
    );
    assert.equal(demoStaleFontRel('/fonts/ibm-plex-sans-latin-wght-normal.woff2'), null);
    assert.equal(demoStaleFontRel('/demo/callspec.json'), null);
    assert.equal(demoStaleFontRel('/demo/node_modules/@fontsource/evil.woff2'), null);

});

test('publicFontRel: /fonts/* woff2 maps to publicDir fonts', (assert) => {

    assert.equal(
        publicFontRel('/fonts/caveat-latin-600-normal.woff2'),
        'fonts/caveat-latin-600-normal.woff2',
    );
    assert.equal(
        publicFontRel('/fonts/ibm-plex-sans-latin-wght-normal.woff2?v=1'),
        'fonts/ibm-plex-sans-latin-wght-normal.woff2',
    );
    assert.equal(publicFontRel('/fonts/evil.ttf'), null);
    assert.equal(publicFontRel('/fonts/nested/evil.woff2'), null);
    assert.equal(publicFontRel('/fonts/../secret.woff2'), null);
    assert.equal(publicFontRel('/getting-started/'), null);

});
