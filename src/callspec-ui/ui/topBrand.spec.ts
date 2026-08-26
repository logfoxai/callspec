import {test} from 'kizu';
import {renderTopBrand} from './topBrand';

test('header always shows the spec version next to the API name', (assert) => {

    const html = renderTopBrand('Upload test', '1.0.0', undefined, false);

    assert.equal(html.includes('class="top-brand-text">Upload test</span>'), true);
    assert.equal(html.includes('class="top-brand-version">v1.0.0</span>'), true);
    assert.equal(html.includes('data-view="routes"'), true);
    assert.equal(html.includes('data-view="home"'), false);

});

test('header brand returns to Home when that page exists', (assert) => {

    const html = renderTopBrand('Chirp', '2.0.0', {name: 'Chirp API'}, true);

    assert.equal(html.includes('class="top-brand-text">Chirp API</span>'), true);
    assert.equal(html.includes('class="top-brand-version">v2.0.0</span>'), true);
    assert.equal(html.includes('data-view="home"'), true);

});
