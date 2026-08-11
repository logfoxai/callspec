import {test} from 'kizu';
import {
    renderDocsSearchField,
    renderDocsThemeSlider,
    renderHeaderContractButtons,
    renderMcpOnlySlider,
    renderUiNotice,
} from './docsChrome';

test('renderDocsSearchField: docs-style search shell', (assert) => {

    const html = renderDocsSearchField({id: 'header-search', value: 'tweet'});

    assert.equal(html.includes('class="cs-docs-search"'), true);
    assert.equal(html.includes('id="header-search"'), true);
    assert.equal(html.includes('placeholder="Search"'), true);
    assert.equal(html.includes('cs-docs-search__icon'), true);
    assert.equal(html.includes('cs-docs-search__kbd'), true);

});

test('renderHeaderContractButtons: header contract file buttons', (assert) => {

    const html = renderHeaderContractButtons('../callspec.json');

    assert.equal(html.includes('class="header-contracts header-contracts--header-end"'), true);
    assert.equal(html.includes('header-contract-btn__icon'), true);
    assert.equal(html.includes('header-contract-btn--callspec'), true);
    assert.equal(html.includes('header-contract-btn--openapi'), true);
    assert.equal(html.includes('href="../callspec.json"'), true);
    assert.equal(html.includes('href="../openapi.json"'), true);
    assert.equal(html.includes('target="_blank"'), true);

});

test('renderMcpOnlySlider: MCP filter slider shell', (assert) => {

    const html = renderMcpOnlySlider('mcp-only', true);

    assert.equal(html.includes('class="cs-mcp-slider"'), true);
    assert.equal(html.includes('id="mcp-only"'), true);
    assert.equal(html.includes('aria-pressed="true"'), true);
    assert.equal(html.includes('cs-mcp-slider__thumb'), true);
    assert.equal(html.includes('cs-mcp-slider__icon--mcp'), true);

});

test('renderDocsThemeSlider: theme slider shell', (assert) => {

    const html = renderDocsThemeSlider('theme-toggle');

    assert.equal(html.includes('class="cs-theme-slider"'), true);
    assert.equal(html.includes('id="theme-toggle"'), true);
    assert.equal(html.includes('cs-theme-slider__thumb'), true);

});

test('renderUiNotice: plain-text notice bar with links', (assert) => {

    const html = renderUiNotice({
        title: 'Browse-only demo',
        message: 'Static preview only.',
        command: 'npm run serve:chirp-demo',
        links: [
            {label: 'Development setup', href: '/development/'},
            {label: 'GitHub', href: 'https://github.com/logfoxai/callspec', external: true},
        ],
    });

    assert.equal(html.includes('class="cs-ui-notice"'), true);
    assert.equal(html.includes('Browse-only demo'), true);
    assert.equal(html.includes('npm run serve:chirp-demo'), true);
    assert.equal(html.includes('href="/development/"'), true);
    assert.equal(html.includes('rel="noopener noreferrer"'), true);

});
