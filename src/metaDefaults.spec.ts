import {test} from 'kizu';
import {siblingSpecPath} from './metaDefaults';

test('siblingSpecPath: relative URL from docs to sibling mount paths', (assert) => {

    assert.equal(siblingSpecPath('/callspec.json'), '../callspec.json');
    assert.equal(siblingSpecPath('/mcp'), '../mcp');
    assert.equal(siblingSpecPath('/api/callspec.json'), '../api/callspec.json');

});
