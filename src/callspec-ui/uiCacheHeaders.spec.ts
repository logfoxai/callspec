import {test} from 'kizu';
import {cacheControlForUiAsset, UI_HTML_CACHE_CONTROL} from './uiCacheHeaders';

test('UI HTML uses no-cache so SSR config stays fresh', (assert) => {

    assert.equal(UI_HTML_CACHE_CONTROL, 'no-cache');

});

test('hashed JS/CSS assets are immutable long-cache', (assert) => {

    assert.equal(
        cacheControlForUiAsset('/tmp/ui/assets/app.a1b2c3d4.js'),
        'public, max-age=31536000, immutable',
    );
    assert.equal(
        cacheControlForUiAsset('/tmp/ui/assets/style.deadbeef.css'),
        'public, max-age=31536000, immutable',
    );

});

test('non-hashed UI assets use a shorter public max-age', (assert) => {

    assert.equal(
        cacheControlForUiAsset('/tmp/ui/assets/mark-light.svg'),
        'public, max-age=86400',
    );

});

test('static index.html shell is no-cache (un-injected template)', (assert) => {

    assert.equal(
        cacheControlForUiAsset('/tmp/ui/index.html'),
        'no-cache',
    );

});
