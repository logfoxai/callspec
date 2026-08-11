import {test} from 'kizu';
import {renderDocsSearchField, renderDocsThemeSlider, renderUiNotice} from './docsChrome';

test('renderDocsSearchField: docs-style search shell', (assert) => {

    const html = renderDocsSearchField({id: 'header-search', value: 'tweet'});

    assert.equal(html.includes('class="cs-docs-search"'), true);
    assert.equal(html.includes('id="header-search"'), true);
    assert.equal(html.includes('placeholder="Search"'), true);
    assert.equal(html.includes('cs-docs-search__icon'), true);
    assert.equal(html.includes('cs-docs-search__kbd'), true);

});

test('renderDocsThemeSlider: theme slider shell', (assert) => {

    const html = renderDocsThemeSlider('theme-toggle');

    assert.equal(html.includes('class="cs-theme-slider"'), true);
    assert.equal(html.includes('id="theme-toggle"'), true);
    assert.equal(html.includes('cs-theme-slider__thumb'), true);

});

test('renderUiNotice: plain-text notice bar', (assert) => {

    const html = renderUiNotice({
        title: 'Hosted explorer',
        message: 'Browse routes.',
        command: 'npm run demo',
    });

    assert.equal(html.includes('class="cs-ui-notice"'), true);
    assert.equal(html.includes('Hosted explorer'), true);
    assert.equal(html.includes('npm run demo'), true);

});
