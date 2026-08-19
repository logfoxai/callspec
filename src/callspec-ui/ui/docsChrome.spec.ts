import {test} from 'kizu';
import {
    renderDocsMenuButton,
    renderDocsSearchField,
    renderDocsThemeSlider,
    renderHeaderContractButtons,
    renderMcpOnlySlider,
    renderMobileMenuTools,
    renderUiNotice,
} from './docsChrome';

test('renderDocsMenuButton: labeled Menu chip with equal bars', (assert) => {

    const html = renderDocsMenuButton();

    assert.equal(html.includes('class="cs-menu-toggle__btn"'), true);
    assert.equal(html.includes('id="nav-menu-btn"'), true);
    assert.equal(html.includes('cs-menu-toggle__line--1'), true);
    assert.equal(html.includes('cs-menu-toggle__line--2'), true);
    assert.equal(html.includes('cs-menu-toggle__line--3'), true);
    assert.equal(html.includes('cs-menu-toggle__word--open">Menu</span>'), true);
    assert.equal(html.includes('cs-menu-toggle__word--close">Close</span>'), true);
    assert.equal(html.includes('aria-controls="nav-drawer"'), true);

});

test('renderMobileMenuTools: docs-parity footer chrome (no close X, Theme then slider)', (assert) => {

    const html = renderMobileMenuTools({
        searchHtml: '<label class="cs-docs-search">search</label>',
        leadingHtml: '<div class="header-contracts">contracts</div>',
        themeSliderId: 'theme-toggle-drawer',
        navLinksHtml: '<nav class="drawer-nav">links</nav>',
    });

    assert.equal(html.includes('cs-mobile-menu-tools'), true);
    assert.equal(html.includes('nav-close-btn'), false);
    assert.equal(html.includes('sidebar-drawer-head'), false);

    const themeLabelAt = html.indexOf('cs-mobile-menu-tools__theme-label');
    const themeSliderAt = html.indexOf('id="theme-toggle-drawer"');
    assert.equal(themeLabelAt > -1 && themeSliderAt > themeLabelAt, true);

    assert.equal(html.indexOf('cs-docs-search') < html.indexOf('mobile-preferences'), true);
    assert.equal(html.includes('drawer-nav'), true);

});

test('renderMobileMenuTools: search optional when sidebar owns it', (assert) => {

    const html = renderMobileMenuTools({
        leadingHtml: '<div class="header-contracts">contracts</div>',
        themeSliderId: 'theme-toggle-drawer',
    });

    assert.equal(html.includes('cs-mobile-menu-tools'), true);
    assert.equal(html.includes('cs-docs-search'), false);
    assert.equal(html.includes('mobile-preferences'), true);

});

test('renderDocsSearchField: docs-style search shell', (assert) => {

    const html = renderDocsSearchField({id: 'header-search', value: 'tweet'});

    assert.equal(html.includes('class="cs-docs-search"'), true);
    assert.equal(html.includes('id="header-search"'), true);
    assert.equal(html.includes('placeholder="Search"'), true);
    assert.equal(html.includes('cs-docs-search__icon'), true);
    assert.equal(html.includes('cs-docs-search__kbd'), true);
    assert.equal(html.includes('cs-docs-search__clear'), true);
    assert.equal(html.includes('type="button"'), true);
    assert.equal(html.includes('aria-label="Clear search"'), true);
    assert.equal(html.includes('tabindex="-1"'), false);

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

test('renderMcpOnlySlider: Yes/No pills', (assert) => {

    const on = renderMcpOnlySlider('mcp-only', true);
    const off = renderMcpOnlySlider('mcp-only', false);

    assert.equal(on.includes('filter-pills'), true);
    assert.equal(on.includes('data-mcp-only="false"'), true);
    assert.equal(on.includes('data-mcp-only="true"'), true);
    assert.equal(on.includes('>Yes</button>'), true);
    assert.equal(on.includes('>No</button>'), true);
    assert.equal(on.includes('data-mcp-only="true"') && on.includes('filter-pill active'), true);
    assert.equal(/data-mcp-only="true"[^>]*class="[^"]*active/.test(on)
        || /class="[^"]*active[^"]*"[^>]*data-mcp-only="true"/.test(on), true);
    assert.equal(/data-mcp-only="false"[^>]*class="[^"]*active/.test(off)
        || /class="[^"]*active[^"]*"[^>]*data-mcp-only="false"/.test(off), true);
    assert.equal(on.includes('cs-mcp-slider'), false);

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
