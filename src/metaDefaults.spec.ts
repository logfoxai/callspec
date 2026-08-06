import {test} from 'kizu';
import {relativeToMountPath, relativeToMountRoot, siblingSpecPath} from './metaDefaults';

test('siblingSpecPath: relative URL from docs to sibling mount paths', (assert) => {

    assert.equal(siblingSpecPath('/callspec.json'), '../callspec.json');
    assert.equal(siblingSpecPath('/mcp'), '../mcp');
    assert.equal(siblingSpecPath('/api/callspec.json'), '../api/callspec.json');

});

test('relativeToMountRoot: steps up from nested docs paths', (assert) => {

    assert.equal(relativeToMountRoot('/docs'), '..');
    assert.equal(relativeToMountRoot('/explorer'), '..');
    assert.equal(relativeToMountRoot('/admin/api/docs'), '../../..');

});

test('relativeToMountPath: links docs UI to fixed contract paths', (assert) => {

    assert.equal(relativeToMountPath('/docs', '/callspec.json'), '../callspec.json');
    assert.equal(relativeToMountPath('/explorer', '/callspec.json'), '../callspec.json');
    assert.equal(relativeToMountPath('/admin/api/docs', '/callspec.json'), '../../../callspec.json');
    assert.equal(relativeToMountPath('/docs', '/mcp'), '../mcp');

});
