import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';

const root = path.resolve(__dirname, '../../..');

test('try-it chrome: no Try it / Authorization / Body labels', (assert) => {

    const main = readFileSync(path.join(root, 'src/callspec-ui/ui/main.ts'), 'utf8');

    assert.equal(main.includes('section-title">Try it'), false);
    assert.equal(main.includes('<label for="auth">Authorization</label>'), false);
    assert.equal(main.includes('<label for="body">Body</label>'), false);
    // Keep accessible name on the token field.
    assert.equal(main.includes('aria-label="Authorization"'), true);

});
