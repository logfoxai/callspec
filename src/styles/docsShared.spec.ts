import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('docs header: visible bottom border (not dark hairline-shade)', (assert) => {

    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');
    const pageFrame = readFileSync(path.join(root, 'src/overrides/PageFrame.astro'), 'utf8');
    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    assert.equal(
        /html\[data-has-sidebar\] header\.header\s*\{[^}]*border-bottom:\s*1px solid var\(--docs-border\)/.test(starlight),
        true,
    );
    assert.equal(pageFrame.includes('border-bottom: 1px solid var(--docs-border'), true);
    assert.equal(
        /\.top-header\s*\{[^}]*border-bottom:\s*0\.0625rem solid var\(--border\)/.test(styles),
        true,
    );

});

test('explorer code surfaces use shared docs code fill + border', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');
    const chrome = readFileSync(path.join(root, 'src/callspec-ui/ui/docs-chrome.css'), 'utf8');

    assert.equal(/\.code-block\s*\{[^}]*border:\s*1px solid var\(--docs-code-border\)/.test(styles), true);
    assert.equal(/\.mcp-code-panel\s*\{[^}]*border-top:\s*1px solid var\(--docs-code-border\)/.test(styles), true);
    assert.equal(/\.mcp-code-panel\s*\{[^}]*border-radius:\s*0/.test(styles), true);
    assert.equal(
        /\[data-theme='light'\] \.mcp-code-toolbar\s*\{[^}]*background:\s*var\(--docs-code-border\)/.test(styles),
        true,
    );
    assert.equal(
        /\.json-editor-frame\s*\{[^}]*border:\s*0\.0625rem solid var\(--docs-code-border\)/.test(styles),
        true,
    );
    // Theme slider is grayscale chrome — not tied to code-block borders.
    assert.equal(chrome.includes('--docs-code-border'), false);
    assert.equal(chrome.includes('--cs-code-bg'), false);

});

test('docs-shared: light header/sidebar white; code block fill + border only', (assert) => {

    const css = readFileSync(path.join(root, 'src/styles/docs-shared.css'), 'utf8');
    const lightBlock = css.slice(0, css.indexOf("html[data-theme='dark'],\n[data-theme='dark']"));
    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    assert.equal(lightBlock.includes('--docs-sidebar: #ffffff'), true);
    assert.equal(lightBlock.includes('--docs-nav: #ffffff'), true);
    assert.equal(lightBlock.includes('--docs-header-bg: #ffffff'), true);
    assert.equal(lightBlock.includes('--docs-bg: #d3e1e5'), false);
    assert.equal(lightBlock.includes('--docs-code-bg: hsl(228, 14%, 94%)'), true);
    assert.equal(lightBlock.includes('--docs-code-border: var(--docs-border)'), true);
    assert.equal(starlight.includes('--cs-code-border: var(--docs-code-border)'), true);
    assert.equal(
        /html\[data-theme='light'\] \.expressive-code \.frame\.has-title > \.header[\s\S]*?background:\s*var\(--docs-code-border\)/.test(starlight),
        true,
    );

});

test('docs light dividers: stronger border + Starlight hairlines use it', (assert) => {

    const css = readFileSync(path.join(root, 'src/styles/docs-shared.css'), 'utf8');
    const lightBlock = css.slice(0, css.indexOf("html[data-theme='dark'],\n[data-theme='dark']"));
    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    // Midpoint between faint 88% and harsh 82%.
    assert.equal(lightBlock.includes('--docs-border: hsl(228, 15%, 85%)'), true);

    // content-panel + sidebar hairlines must follow docs border (not gray-6 ~94%).
    assert.equal(starlight.includes('--sl-color-hairline: var(--docs-border)'), true);
    assert.equal(starlight.includes('--sl-color-hairline-shade: var(--docs-border)'), true);

});

test('docs-shared: dark header matches sidebar', (assert) => {

    const css = readFileSync(path.join(root, 'src/styles/docs-shared.css'), 'utf8');
    const darkBlock = css.slice(css.indexOf("html[data-theme='dark'],\n[data-theme='dark']"));
    const headerBg = darkBlock.match(/--docs-header-bg:\s*([^;]+);/)?.[1]?.trim() ?? '';

    assert.equal(headerBg, 'var(--docs-sidebar)');
    assert.equal(darkBlock.includes('--docs-nav: var(--docs-sidebar)'), true);

});

test('docs-shared: sidebar tracks header pad; wide screens bump both', (assert) => {

    const css = readFileSync(path.join(root, 'src/styles/docs-shared.css'), 'utf8');
    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    assert.equal(css.includes('--docs-sidebar-pad-x: var(--docs-header-pad-x)'), true);
    assert.equal(css.includes('--docs-sidebar-pad-x: 1.5rem'), false);
    // Wide chrome/type past MacBook Neo (~1204–1408px) — 90rem, not 72rem.
    const padBumpIdx = css.indexOf('--docs-header-pad-x: 1.5rem');
    const wideIdx = css.lastIndexOf('min-width: 90rem', padBumpIdx);
    assert.equal(padBumpIdx > -1 && wideIdx > -1 && wideIdx < padBumpIdx, true);
    assert.equal(/min-width:\s*72rem[^{]*\{[^}]*--docs-header-pad-x/.test(css), false);
    assert.equal(/min-width:\s*50em[^{]*\{[^}]*--docs-header-pad-x/.test(css), false);
    // Body type: first wide bump is 90rem (was 72rem — fired on Neo).
    assert.equal(/@media\s*\(\s*min-width:\s*90rem\s*\)\s*\{\s*html\s*\{\s*font-size:\s*1\.03125rem/.test(css), true);
    assert.equal(/@media\s*\(\s*min-width:\s*72rem\s*\)\s*\{\s*html\s*\{\s*font-size:/.test(css), false);
    assert.equal(css.includes("html[data-theme='light']"), true);
    assert.equal(css.includes('--docs-sidebar-link-pad-inline: 0.7rem'), true);
    assert.equal(css.includes('--docs-sidebar-hover: #000'), true);
    assert.equal(styles.includes('--sidebar-link-pad-inline: var(--docs-sidebar-link-pad-inline)'), true);
    assert.equal(styles.includes('--content-pad-x: 1.75rem'), true);

});

test('docs-shared: exposes light/dark page chrome tokens', (assert) => {

    const css = readFileSync(path.join(root, 'src/styles/docs-shared.css'), 'utf8');

    assert.equal(css.includes('--docs-bg:'), true);
    assert.equal(css.includes('--docs-sidebar:'), true);
    assert.equal(css.includes('--docs-header-bg:'), true);
    assert.equal(css.includes('--docs-code-bg:'), true);
    assert.equal(css.includes('--docs-search-height:'), true);
    assert.equal(css.includes('--docs-search-max-width:'), true);
    assert.equal(css.includes('--docs-primary-bg:'), true);
    assert.equal(css.includes('--docs-sidebar-pad-x:'), true);
    assert.equal(css.includes('--docs-sidebar-link-pad-inline:'), true);
    assert.equal(css.includes('--docs-sidebar-hover:'), true);
    assert.equal(css.includes('--docs-code-radius:'), true);
    assert.equal(css.includes('--bg: var(--docs-bg)'), true);
    assert.equal(css.includes('--cs-code-bg: var(--docs-code-bg)'), true);
    assert.equal(css.includes('--cs-primary-bg: var(--docs-primary-bg)'), true);
    assert.equal(css.includes('--nav-active-bg: var(--docs-primary-bg)'), true);
    // Soft tint must follow --accent so brand theme overrides (e.g. Chirp teal) stick.
    assert.equal(
        css.includes('--accent-soft: color-mix(in srgb, var(--accent)'),
        true,
    );

});

test('astro + vite both import docs-shared', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const tokens = readFileSync(path.join(root, 'src/callspec-ui/ui/docs-tokens.css'), 'utf8');
    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    assert.equal(astro.includes('docs-shared.css'), true);
    assert.equal(tokens.includes('docs-shared.css'), true);
    assert.equal(starlight.includes('--sl-color-bg: var(--docs-bg)'), true);
    assert.equal(starlight.includes('--sl-color-bg-sidebar: var(--docs-sidebar)'), true);
    // Primary fills live in docs-shared; Starlight consumes the alias.
    assert.equal(starlight.includes('background: var(--cs-primary-bg)'), true);
    assert.equal(starlight.includes('--cs-primary-bg: hsl('), false);

});

test('explorer title panels: full-bleed hairline like docs content-panel', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    assert.equal(
        /\.overview-title-panel,\s*\n\.route-page__title\s*\{[^}]*border-bottom:\s*1px solid var\(--border\)/.test(
            styles,
        )
            || (styles.includes('.overview-title-panel,')
                && styles.includes('.route-page__title')
                && styles.includes('width: calc(100% + 2 * var(--content-pad-x))')
                && styles.includes('border-bottom: 1px solid var(--border)')),
        true,
    );
    assert.equal(styles.includes('width: calc(100% + 2 * var(--content-pad-x))'), true);
    assert.equal(styles.includes('.main:has(.overview)'), true);
    assert.equal(styles.includes('min-width: 100%'), true);

});

test('powered-by footer scrolls inside .content (not viewport-pinned)', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');
    const place = readFileSync(path.join(root, 'src/callspec-ui/ui/poweredByFooter.ts'), 'utf8');
    const main = readFileSync(path.join(root, 'src/callspec-ui/ui/main.ts'), 'utf8');

    assert.equal(styles.includes('body > .footer'), true);
    assert.equal(styles.includes('.content > .footer'), true);
    assert.equal(/\.content > \.footer\s*\{[^}]*position:\s*fixed/.test(styles), false);
    assert.equal(place.includes('content.appendChild(footer)'), true);
    assert.equal(place.includes('parkPoweredByFooter'), true);
    assert.equal(main.includes('placePoweredByFooter'), true);
    assert.equal(main.includes('parkPoweredByFooter'), true);

});

test('demo mobile nav: drawer under header + footer tools (docs parity)', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    assert.equal(styles.includes('top: var(--header-height)'), true);
    assert.equal(styles.includes('max-width: 49.99rem'), true);
    assert.equal(styles.includes('cs-mobile-menu-tools'), true);
    assert.equal(styles.includes('margin-top: auto'), true);
    assert.equal(/\.nav-close-btn\s*\{/.test(styles), false);
    assert.equal(styles.includes('.nav-overlay'), false);

});

test('demo sidebar hover: text-only like Starlight (no tint fill)', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');
    const hover = styles.match(
        /\.sidebar-link:hover(?:,\s*\.sidebar-link:focus-visible)?\s*\{[^}]+\}/,
    )?.[0] ?? '';

    assert.equal(hover.includes('color: var(--sidebar-hover)'), true);
    assert.equal(hover.includes('background'), false);
    assert.equal(/\.sidebar-link:hover\s*\{[^}]*background/.test(styles), false);

});

test('demo sidebar route badges sit beside the label (not right-aligned)', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    // flex: 1 on the label shoved lock/MCP icons into the caret column.
    assert.equal(/\.sidebar-link__label\s*\{[^}]*flex:\s*1/.test(styles), false);
    assert.equal(/\.sidebar-link__label\s*\{[^}]*flex:\s*0\s+1\s+auto/.test(styles), true);

});

test('demo sidebar nav: match docs starlight-custom metrics', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');
    const docs = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    // Docs overrides (starlight-custom.css) — keep demo in lockstep.
    assert.equal(docs.includes('margin-top: 0.45rem'), true);
    assert.equal(docs.includes('padding-inline: var(--docs-sidebar-link-pad-inline)'), true);
    assert.equal(
        docs.includes('padding-inline: var(--docs-sidebar-link-pad-inline) 0'),
        true,
    );
    assert.equal(
        /sidebar-content\s*\{[^}]*padding:\s*0\.65rem calc\(var\(--sl-sidebar-pad-x\) - var\(--docs-sidebar-link-pad-inline\)\)/.test(
            docs,
        ),
        true,
    );
    assert.equal(docs.includes('border-radius: 0.45rem'), true);
    // Categories black; links grey → black hover (same as explorer).
    assert.equal(/#starlight__sidebar summary\s*\{[^}]*color:\s*var\(--cs-ink\)/.test(docs), true);
    assert.equal(/#starlight__sidebar a\s*\{[^}]*color:\s*var\(--cs-muted\)/.test(docs), true);
    assert.equal(/#starlight__sidebar a:hover[^}]*color:\s*var\(--docs-sidebar-hover\)/.test(docs), true);
    assert.equal(/#starlight__sidebar summary:hover\s*\{[^}]*color:\s*var\(--docs-sidebar-hover\)/.test(docs), true);
    // Chevrons muted at rest; black/white only on hover (docs + explorer).
    assert.equal(
        /#starlight__sidebar summary \.caret\s*\{[^}]*color:\s*var\(--docs-text-tertiary\)/.test(docs),
        true,
    );
    assert.equal(
        /#starlight__sidebar summary:hover \.caret\s*\{[^}]*color:\s*var\(--docs-sidebar-hover\)/.test(docs),
        true,
    );
    assert.equal(/\.sidebar-caret\s*\{[^}]*color:\s*var\(--text-tertiary\)/.test(styles), true);
    assert.equal(
        /\.sidebar-group summary:hover \.sidebar-group-icon,\s*\.sidebar-group summary:hover \.sidebar-caret\s*\{[^}]*color:\s*var\(--sidebar-hover\)/.test(
            styles,
        ),
        true,
    );

    assert.equal(/\.sidebar-top-level\s*>\s*li\s*\+\s*li\s*\{[^}]*margin-top:\s*0\.45rem/.test(styles), true);
    assert.equal(styles.includes('--sidebar-link-pad-inline: var(--docs-sidebar-link-pad-inline)'), true);
    assert.equal(/\.sidebar-link\s*\{[^}]*padding-inline:\s*var\(--sidebar-link-pad-inline\)/.test(styles)
        || /\.sidebar-link\s*\{[^}]*padding:\s*0\.35em\s*var\(--sidebar-link-pad-inline\)/.test(styles), true);
    assert.equal(/\.sidebar-link\s*\{[^}]*line-height:\s*1\.4/.test(styles), true);
    assert.equal(
        /\.sidebar-group-list \.sidebar-link\s*\{[^}]*line-height:\s*var\(--sidebar-subitem-line-height\)/.test(
            styles,
        ),
        true,
    );
    assert.equal(docs.includes('ul ul a'), true);
    assert.equal(docs.includes('line-height: var(--docs-sidebar-subitem-line-height)'), true);
    assert.equal(/\.sidebar-link\s*\{[^}]*border-radius:\s*0\.45rem/.test(styles), true);
    assert.equal(
        /\.sidebar-group summary\s*\{[^}]*padding:\s*0\.35em\s*0\s*0\.35em\s*var\(--sidebar-link-pad-inline\)/.test(
            styles,
        ),
        true,
    );
    assert.equal(/\.sidebar-group summary\s*\{[^}]*color:\s*var\(--text\)/.test(styles), true);
    assert.equal(/\.sidebar-link--top\s*\{[^}]*color:\s*var\(--text-secondary\)/.test(styles), true);
    assert.equal(/\.sidebar-link--top:hover\s*\{[^}]*color:\s*var\(--sidebar-hover\)/.test(styles), true);

});

test('sidebar nests: indent without left hairline (docs + demo)', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');
    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    assert.equal(styles.includes('--sidebar-item-pad-inline: 0.5rem'), true);
    assert.equal(
        /\.sidebar-group-list\s*>\s*li\s*\{[^}]*border-inline-start:/.test(styles),
        false,
    );
    assert.equal(
        /\.sidebar-group-list\s*>\s*li\s*\{[^}]*margin-inline-start:\s*var\(--sidebar-item-pad-inline\)/.test(styles),
        true,
    );
    assert.equal(
        /\.sidebar-group-list\s*>\s*li\s*\{[^}]*padding-inline-start:\s*var\(--sidebar-item-pad-inline\)/.test(styles),
        true,
    );
    assert.equal(/\.sidebar-group-list\s*>\s*li\s*\+\s*li\s*\{/.test(styles), false);
    assert.equal(
        starlight.includes('#starlight__sidebar ul ul li')
            && starlight.includes('border-inline-start: none'),
        true,
    );

});

test('docs header search stays optically centered (equal side columns)', (assert) => {

    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    // 1fr | search | 1fr — asymmetric trailing `auto` pulls the bar off-center.
    assert.equal(
        /grid-template-columns:\s*1fr minmax\(14rem,\s*var\(--docs-search-max-width\)\)\s*1fr/.test(starlight),
        true,
    );
    assert.equal(
        /grid-template-columns:\s*1fr minmax\(14rem,\s*var\(--docs-search-max-width\)\)\s*auto/.test(starlight),
        false,
    );

});

test('docs header pad + page title match explorer metrics', (assert) => {

    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');
    const pageTitle = readFileSync(path.join(root, 'src/overrides/PageTitle.astro'), 'utf8');
    const pageFrame = readFileSync(path.join(root, 'src/overrides/PageFrame.astro'), 'utf8');
    const header = readFileSync(path.join(root, 'src/overrides/Header.astro'), 'utf8');
    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    // Header L/R uses shared token (same as explorer `--header-pad-x`).
    assert.equal(starlight.includes('padding-inline: var(--docs-header-pad-x)'), true);
    assert.equal(pageFrame.includes('padding: var(--sl-nav-pad-y) var(--docs-header-pad-x)'), true);
    assert.equal(starlight.includes('--sl-nav-pad-x: var(--docs-header-pad-x)'), true);
    // Re-assert inside Starlight’s 50em media (prevents layered 1.5rem takeover).
    const navPadAt50 = starlight.indexOf('--sl-nav-pad-x: var(--docs-header-pad-x)');
    const media50 = starlight.indexOf('@media (min-width: 50em)', navPadAt50);
    assert.equal(
        media50 > -1
            && starlight.slice(media50, media50 + 280).includes('--sl-nav-pad-x: var(--docs-header-pad-x)'),
        true,
    );
    // No negative title-wrapper margin pulling the lockup left of Introduction.
    assert.equal(header.includes('margin: -0.25rem'), false);

    // Page title — a step above explorer route titles; still well under Starlight 5xl.
    assert.equal(/--sl-text-h1:\s*1\.4rem/.test(starlight), true);
    assert.equal(/@media\s*\(\s*min-width:\s*90rem\s*\)[\s\S]*?--sl-text-h1:\s*1\.625rem/.test(starlight), true);
    assert.equal(/--sl-text-h1:\s*1\.875rem/.test(starlight), false);
    assert.equal(/\.route-title\s*\{[^}]*font-size:\s*1\.25rem/.test(styles), true);

    // Equal top/bottom title band; no leftover PageTitle margin-top.
    assert.equal(
        /\.content-panel:first-of-type\s*\{[^}]*padding-block:\s*1rem/.test(starlight),
        true,
    );
    assert.equal(
        /@media\s*\(\s*min-width:\s*90rem\s*\)[\s\S]*?\.content-panel:first-of-type\s*\{[^}]*padding-block:\s*1\.25rem/.test(
            starlight,
        ),
        true,
    );
    // Body copy sits closer under the title hairline (was Starlight 1.5rem).
    assert.equal(
        /\.main-pane \.content-panel \+ \.content-panel\s*\{[^}]*padding-top:\s*0\.35rem/.test(
            starlight,
        ),
        true,
    );
    assert.equal(pageTitle.includes('margin-top: 1rem'), false);
    assert.equal(/h1\s*\{[^}]*margin:\s*0/.test(pageTitle), true);

});

test('guide mobile header: unlayered hide for search/theme/social (beats .sl-flex)', (assert) => {

    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');
    const header = readFileSync(path.join(root, 'src/overrides/Header.astro'), 'utf8');

    // Unlayered — @layer starlight.core loses to Starlight’s unlayered .sl-flex.
    assert.equal(starlight.includes('html[data-has-sidebar] header.header .header-search'), true);
    assert.equal(starlight.includes('html[data-has-sidebar] header.header .social-icons'), true);
    assert.equal(
        starlight.includes('html[data-has-sidebar] header.header starlight-theme-select'),
        true,
    );
    assert.equal(/@media\s*\(\s*max-width:\s*49\.99rem\s*\)[\s\S]*header-search[\s\S]*display:\s*none/.test(starlight), true);

    // Hideable chrome must not rely on .sl-flex (unlayered display:flex).
    assert.equal(header.includes('class="sl-flex print:hidden header-search"'), false);
    assert.equal(header.includes('class="sl-flex social-icons"'), false);

});

test('explorer sidebar search: full-bleed band above Home', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    assert.equal(/\.sidebar-search\s*\{[^}]*padding:\s*0/.test(styles), true);
    assert.equal(/\.cs-docs-search--sidebar\s*\{[^}]*border-radius:\s*0/.test(styles), true);
    assert.equal(/\.cs-docs-search--sidebar\s*\{[^}]*border-bottom:\s*1px solid var\(--border\)/.test(styles), true);
    assert.equal(
        /\.sidebar-nav\s*\{[^}]*padding:\s*0\.65rem calc\(var\(--sidebar-pad-x\) - var\(--sidebar-link-pad-inline\)\)/.test(
            styles,
        ),
        true,
    );

});

test('explorer top bar: slightly thinner than docs (3.25rem) with smaller chrome', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    // px — rem scale at wide viewports must not re-inflate the bar toward 3.5rem.
    assert.equal(styles.includes('--header-height: 52px'), true);
    assert.equal(styles.includes('--docs-header-height: 52px'), true);
    assert.equal(
        styles.includes("[data-theme='light']")
            && styles.includes("[data-theme='dark']")
            && /--header-height:\s*52px/.test(styles),
        true,
    );
    assert.equal(/\.header-contract-btn\s*\{[^}]*height:\s*2\.1rem/.test(styles), true);
    assert.equal(/\.header-contract-btn__icon\s*\{[^}]*width:\s*1\.05rem/.test(styles), true);
    assert.equal(/\.top-header \.cs-theme-slider\s*\{[^}]*height:\s*2\.25rem/.test(styles), true);

});

test('Callspec mark: ink color + shared tight icon↔label gap (explorer + docs)', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');
    const shared = readFileSync(path.join(root, 'src/styles/docs-shared.css'), 'utf8');
    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    // Shared SoT — black in light, white in dark; never brand cyan / host accent.
    assert.equal(shared.includes('--docs-callspec-mark: #000'), true);
    assert.equal(shared.includes('--docs-callspec-mark: #fff'), true);
    assert.equal(shared.includes('--docs-mark-label-gap:'), true);
    assert.equal(shared.includes('--callspec-mark: var(--docs-callspec-mark)'), true);
    assert.equal(shared.includes('--docs-callspec-mark: #0284c7'), false);
    assert.equal(shared.includes('--docs-callspec-mark: #22d3ee'), false);

    // Explorer contract chip + docs nav lockup both consume the shared gap/color.
    assert.equal(styles.includes('gap: var(--docs-mark-label-gap)'), true);
    assert.equal(
        styles.includes('color: var(--docs-callspec-mark)')
            || styles.includes('color: var(--callspec-mark)'),
        true,
    );
    assert.equal(starlight.includes('gap: var(--docs-mark-label-gap)'), true);
    assert.equal(starlight.includes('--cs-mark: var(--docs-callspec-mark)'), true);
    assert.equal(
        /\.header-contract-btn--callspec \.header-contract-btn__icon\s*\{[^}]*color:\s*var\(--accent\)/.test(
            styles,
        ),
        false,
    );
    // Old loose gaps must stay gone.
    assert.equal(/\.header-contract-btn\s*\{[^}]*gap:\s*0\.45rem/.test(styles), false);
    assert.equal(/\.cs-lockup\s*\{[^}]*gap:\s*0\.42rem/.test(starlight), false);

});

test('vite chrome inherits Astro SoT metrics (no local overrides)', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');
    const chrome = readFileSync(path.join(root, 'src/callspec-ui/ui/docs-chrome.css'), 'utf8');

    // Shared rem scale must not be killed by a hard 1rem on html/body.
    assert.equal(/html,\s*body\s*\{[^}]*font-size:\s*1rem/.test(styles), false);
    assert.equal(styles.includes('--sidebar-pad-x: var(--docs-sidebar-pad-x)'), true);
    assert.equal(styles.includes('border-inline-end:'), true);
    assert.equal(
        /\.code-block\s*\{[^}]*border-radius:\s*var\(--docs-code-radius\)/.test(styles),
        true,
    );
    assert.equal(styles.includes('font-family: var(--font-heading)'), true);

    // Search trigger matches Astro width (22rem), not a compact 13rem header shell.
    assert.equal(chrome.includes('max-width: 13rem'), false);
    assert.equal(chrome.includes('var(--docs-search-max-width)'), true);
    assert.equal(chrome.includes('background: var(--accent-soft)'), false);

});

test('callspec mark assets + nav lockup are ink (black / white), not cyan', (assert) => {

    const markLight = readFileSync(path.join(root, 'assets/mark-light.svg'), 'utf8');
    const markDark = readFileSync(path.join(root, 'assets/mark-dark.svg'), 'utf8');
    const favicon = readFileSync(path.join(root, 'assets/favicon.svg'), 'utf8');
    const lockupLight = readFileSync(path.join(root, 'assets/callspec-lockup-light.svg'), 'utf8');
    const lockupDark = readFileSync(path.join(root, 'assets/callspec-lockup-dark.svg'), 'utf8');
    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');
    const logoShip = readFileSync(path.join(root, 'scripts/logo-ship.mjs'), 'utf8');

    assert.equal(/fill="#000"/.test(markLight) || /fill="#000000"/.test(markLight), true);
    assert.equal(/fill="#fff"/.test(markDark) || /fill="#ffffff"/i.test(markDark), true);
    assert.equal(/fill="#000"/.test(favicon) || /fill="#000000"/.test(favicon), true);
    assert.equal(/fill="#0284C7"/i.test(markLight), false);
    assert.equal(/fill="#22D3EE"/i.test(markDark), false);
    assert.equal(/fill="#000"/.test(lockupLight) || /fill="#000000"/.test(lockupLight), true);
    assert.equal(/fill="#fff"/.test(lockupDark) || /fill="#ffffff"/i.test(lockupDark), true);

    assert.equal(starlight.includes('--cs-mark: var(--docs-callspec-mark)'), true);
    assert.equal(logoShip.includes("markLight: '#000'"), true);
    assert.equal(logoShip.includes("markDark: '#fff'"), true);

});

test('splash Get Started primary CTA: ink fill, stars, diagonal rocket bob', (assert) => {

    const splash = readFileSync(path.join(root, 'src/styles/splash.css'), 'utf8');
    const actions = readFileSync(path.join(root, 'src/components/SplashHeroActions.astro'), 'utf8');

    assert.equal(splash.includes('background: #000'), true);
    assert.equal(splash.includes('background: #fff'), true);
    // Light: pure white stars on black; dark: pure black stars on white; uniform hard dots.
    assert.equal(splash.includes('--splash-cta-star: #fff'), true);
    assert.equal(splash.includes('--splash-cta-star: #000'), true);
    assert.equal((splash.match(/radial-gradient\(0\.85px 0\.85px at/g) ?? []).length, 12);
    assert.equal(splash.includes('var(--splash-cta-star) 100%, transparent 100%'), true);
    assert.equal(splash.includes('@keyframes splash-cta-stars-scroll'), true);
    // Same vertical loop, slight angle only.
    assert.equal(splash.includes('transform: rotate(12deg) translate3d(0, 50%, 0)'), true);
    assert.equal(splash.includes('splash-cta-stars-scroll 0.85s'), true);
    assert.equal(splash.includes('background-repeat: repeat-y'), true);
    // Slight left tilt at rest; bob along tip — no erect-to-vertical.
    assert.equal(splash.includes('@keyframes splash-rocket-erect'), false);
    assert.equal(splash.includes('@keyframes splash-rocket-bob'), true);
    assert.equal(splash.includes('splash-rocket-bob 0.32s'), true);
    assert.equal(splash.includes('--splash-rocket-tilt: -14deg'), true);
    assert.equal(splash.includes('rotate(var(--splash-rocket-tilt, -14deg)) translate(0.02rem, -0.02rem)'), true);
    assert.equal(splash.includes('rotate(var(--splash-rocket-tilt, -14deg)) translate(0.1rem, -0.1rem)'), true);
    assert.equal(splash.includes('splash-rocket-liftoff'), false);
    assert.equal(splash.includes('splash-hero__rocket-plume'), false);
    assert.equal(actions.includes('splash-hero__rocket-craft'), true);
    assert.equal(actions.includes('splash-hero__rocket-plume'), false);

});
