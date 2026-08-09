import {test} from 'kizu';
import {openApiPathFromSpecUrl} from './contractPaths';

test('openApiPathFromSpecUrl: replaces callspec.json sibling', (assert) => {

    assert.equal(openApiPathFromSpecUrl('../callspec.json'), '../openapi.json');
    assert.equal(openApiPathFromSpecUrl('/v1/callspec.json'), '/v1/openapi.json');
    assert.equal(openApiPathFromSpecUrl('./callspec.json?cache=1'), './openapi.json');

});

test('openApiPathFromSpecUrl: falls back to directory openapi.json', (assert) => {

    assert.equal(openApiPathFromSpecUrl('../spec'), '../openapi.json');
    assert.equal(openApiPathFromSpecUrl('callspec'), 'openapi.json');

});
