import {test} from 'kizu';
import {DOCS_SEARCH_MIN_QUERY_LENGTH, DOCS_SEARCH_PAGE_SIZE, isDocsSearchQueryReady} from './docsSearchQuery.js';

test('isDocsSearchQueryReady requires at least DOCS_SEARCH_MIN_QUERY_LENGTH characters', (assert) => {

    assert.equal(DOCS_SEARCH_MIN_QUERY_LENGTH, 3);
    assert.equal(isDocsSearchQueryReady('ab'), false);
    assert.equal(isDocsSearchQueryReady('abc'), true);

});

test('DOCS_SEARCH_PAGE_SIZE matches Pagefind UI pagination', (assert) => {

    assert.equal(DOCS_SEARCH_PAGE_SIZE, 25);

});
