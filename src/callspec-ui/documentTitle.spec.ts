import {test} from 'kizu';
import {callspecDocumentTitle} from './documentTitle';
import {renderCallspecUiPage} from './mountCallspecUi';

test('callspecDocumentTitle: meta.title - Callspec', (assert) => {

    assert.equal(callspecDocumentTitle('Chirp API v2'), 'Chirp API v2 - Callspec');
    assert.equal(callspecDocumentTitle('Fixture API'), 'Fixture API - Callspec');
    assert.equal(callspecDocumentTitle('  '), 'Callspec');
    assert.equal(callspecDocumentTitle(undefined), 'Callspec');

});

test('renderCallspecUiPage: browser title is meta.title - Callspec', (assert) => {

    const html = renderCallspecUiPage({
        specUrl: '../callspec.json',
        rpcBase: '..',
        title: 'Chirp API v2',
    });

    assert.equal(html.includes('<title>Chirp API v2 - Callspec</title>'), true);
    assert.equal(html.includes('<title>API Docs</title>'), false);

});
