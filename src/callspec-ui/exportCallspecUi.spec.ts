import {test} from 'kizu';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {exportCallspecUi} from './exportCallspecUi';
import {renderCallspecUiPage} from './mountCallspecUi';

test('renderCallspecUiPage bakes absolute specUrl and rpcBase into HTML', (assert) => {

    const html = renderCallspecUiPage({
        specUrl: 'https://api.example.com/v1/callspec.json',
        rpcBase: 'https://api.example.com/v1',
        title: 'Acme API',
        mcpPath: 'https://api.example.com/v1/mcp',
    });

    assert.equal(html.includes('window.__CALLSPEC_UI__='), true);
    assert.equal(html.includes('"specUrl":"https://api.example.com/v1/callspec.json"'), true);
    assert.equal(html.includes('"rpcBase":"https://api.example.com/v1"'), true);
    assert.equal(html.includes('<!--CALLSPEC_UI_CONFIG-->'), false);

});

test('renderCallspecUiPage injects customCssUrl link with escaped href', (assert) => {

    const html = renderCallspecUiPage({
        specUrl: '../callspec.json',
        rpcBase: '..',
        branding: {
            theme: {customCssUrl: 'https://cdn.example/brand.css?x=">&<'},
        },
    });

    assert.equal(
        html.includes('<link rel="stylesheet" href="https://cdn.example/brand.css?x=&quot;&gt;&amp;&lt;">'),
        true,
    );

});

test('renderCallspecUiPage: mount customCssUrl wins over theme.customCssUrl', (assert) => {

    const html = renderCallspecUiPage({
        specUrl: '../callspec.json',
        rpcBase: '..',
        customCssUrl: 'https://mount.example/override.css',
        branding: {
            theme: {customCssUrl: 'https://meta.example/theme.css'},
        },
    });

    assert.equal(
        html.includes('<link rel="stylesheet" href="https://mount.example/override.css">'),
        true,
    );
    assert.equal(
        html.includes('<link rel="stylesheet" href="https://meta.example/theme.css">'),
        false,
    );

});

test('renderCallspecUiPage injects sanitized customCss (strips style breakouts)', (assert) => {

    const html = renderCallspecUiPage({
        specUrl: '../callspec.json',
        rpcBase: '..',
        branding: {
            theme: {customCss: '.x{color:red}</style><p>breakout</p>'},
        },
    });

    assert.equal(html.includes('<style data-callspec-ui-custom-css>'), true);
    assert.equal(html.includes('.x{color:red}'), true);
    // Closing `</style` removed so markup after it stays inside the style element.
    assert.equal(html.includes('</style><p>breakout</p>'), false);
    assert.equal(html.includes('data-callspec-ui-custom-css>.x{color:red}><p>breakout</p></style>'), true);

});

test('renderCallspecUiPage injects sanitized headerHtml above #app', (assert) => {

    const html = renderCallspecUiPage({
        specUrl: '../callspec.json',
        rpcBase: '..',
        branding: {
            headerHtml: '<nav class="mkt"><a href="/app" onclick="evil()">App</a></nav><script>x()</script>',
        },
    });

    const wrapperStart = html.indexOf('<div class="callspec-ui-header-html">');
    const appStart = html.indexOf('<div id="app"');

    assert.equal(wrapperStart > -1, true);
    assert.equal(appStart > wrapperStart, true);
    assert.equal(html.includes('class="mkt"'), true);
    assert.equal(html.includes('href="/app"'), true);
    assert.equal(/onclick=/i.test(html), false);
    assert.equal(html.includes('<script>x()'), false);

});

test('exportCallspecUi writes index.html and assets for S3 upload', (assert) => {

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-export-ui-'));

    exportCallspecUi({
        outDir,
        specUrl: 'https://api.example.com/v1/callspec.json',
        rpcBase: 'https://api.example.com/v1',
        title: 'Export API',
    });

    const htmlPath = path.join(outDir, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.equal(fs.existsSync(htmlPath), true);
    assert.equal(html.includes('"specUrl":"https://api.example.com/v1/callspec.json"'), true);
    assert.equal(html.includes('"rpcBase":"https://api.example.com/v1"'), true);
    // Absolute rpcBase → MCP defaults to the API host, not the CDN docs origin.
    assert.equal(html.includes('"mcpPath":"https://api.example.com/v1/mcp"'), true);

    const assetsDir = path.join(outDir, 'assets');

    assert.equal(fs.existsSync(assetsDir), true);

    const assetNames = fs.readdirSync(assetsDir);
    const hasHashedJs = assetNames.some((name) => /^app\.[a-f0-9]{8}\.js$/i.test(name));
    const hasHashedCss = assetNames.some((name) => /^style\.[a-f0-9]{8}\.css$/i.test(name));

    assert.equal(hasHashedJs, true);
    assert.equal(hasHashedCss, true);
    assert.equal(assetNames.includes('mark-light.svg'), true);

    fs.rmSync(outDir, {recursive: true, force: true});

});
