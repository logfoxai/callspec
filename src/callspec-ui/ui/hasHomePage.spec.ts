import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {hasHomePage} from './hasHomePage';

const dir = path.dirname(fileURLToPath(import.meta.url));

test('title-only branding has no Home page', (assert) => {

    assert.equal(hasHomePage(undefined), false);
    assert.equal(hasHomePage({}), false);
    assert.equal(hasHomePage({name: 'Upload test', logoUrl: './mark.svg'}), false);
    assert.equal(hasHomePage({intro: '   ', sdkInstall: ''}), false);

});

test('intro, website, or sdkInstall keeps Home', (assert) => {

    assert.equal(hasHomePage({intro: 'Welcome'}), true);
    assert.equal(hasHomePage({websiteUrl: 'https://example.com'}), true);
    assert.equal(hasHomePage({sdkInstall: 'npm i @acme/sdk'}), true);

});

test('docs explorer gates Home with hasHomePage(branding)', (assert) => {

    const main = readFileSync(path.join(dir, 'main.ts'), 'utf8');

    assert.equal(main.includes('hasHomePage(branding)'), true);
    assert.equal(main.includes('function hasHomePage'), false);

});
