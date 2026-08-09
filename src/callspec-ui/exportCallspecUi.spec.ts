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
