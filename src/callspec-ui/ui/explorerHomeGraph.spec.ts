import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const main = readFileSync(path.join(root, 'src/callspec-ui/ui/main.ts'), 'utf8');

test('explorer home does not statically import the runtyp error catalog', (assert) => {

    assert.equal(/from ['"]\.\/schemaPanel['"]/.test(main), false);
    assert.equal(main.includes("import('./schemaPanel')"), true);
    assert.equal(main.includes('runtyp'), false);
    assert.equal(/from ['"]\.\.\/\.\.\/routeErrorDocument['"]/.test(main), false);
    assert.equal(/from ['"]\.\.\/\.\.\/builtinErrors['"]/.test(main), false);

});
