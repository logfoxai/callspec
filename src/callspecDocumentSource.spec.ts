import fs from 'fs';
import os from 'os';
import path from 'path';
import {test} from 'kizu';
import {
    CALLSPEC_JSON_PATH,
    DOCS_UI_PATH,
    OPENAPI_JSON_PATH,
    resolveCallspecDocumentSource,
    resolveOpenApiDocumentSource,
} from './callspecDocumentSource';

test('document paths are fixed at the mount', (assert) => {

    assert.equal(CALLSPEC_JSON_PATH, '/callspec.json');
    assert.equal(OPENAPI_JSON_PATH, '/openapi.json');
    assert.equal(DOCS_UI_PATH, '/docs');

});

test('resolveCallspecDocumentSource: HTTP mount appends callspec.json', (assert) => {

    assert.equal(
        resolveCallspecDocumentSource('http://127.0.0.1:3000/v1'),
        'http://127.0.0.1:3000/v1/callspec.json',
    );
    assert.equal(
        resolveCallspecDocumentSource('http://127.0.0.1:3000/v1/'),
        'http://127.0.0.1:3000/v1/callspec.json',
    );

});

test('resolveCallspecDocumentSource: full callspec.json URL unchanged', (assert) => {

    assert.equal(
        resolveCallspecDocumentSource('http://127.0.0.1:3000/v1/callspec.json'),
        'http://127.0.0.1:3000/v1/callspec.json',
    );

});

test('resolveCallspecDocumentSource: directory mount appends callspec.json', (assert) => {

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-src-dir-'));

    assert.equal(
        resolveCallspecDocumentSource(dir),
        path.join(dir, 'callspec.json'),
    );

    fs.rmSync(dir, {recursive: true, force: true});

});

test('resolveCallspecDocumentSource: explicit file path unchanged', (assert) => {

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-src-file-'));
    const filePath = path.join(dir, 'callspec.json');

    fs.writeFileSync(filePath, '{}');

    assert.equal(resolveCallspecDocumentSource(filePath), filePath);
    assert.equal(resolveCallspecDocumentSource('./callspec.json'), path.resolve('./callspec.json'));

    fs.rmSync(dir, {recursive: true, force: true});

});

test('resolveOpenApiDocumentSource: HTTP mount appends openapi.json', (assert) => {

    assert.equal(
        resolveOpenApiDocumentSource('http://127.0.0.1:3000/v1'),
        'http://127.0.0.1:3000/v1/openapi.json',
    );

});
