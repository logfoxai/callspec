import {test} from 'kizu';
import {
    isLocalDevHost,
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
