import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const dir = path.dirname(fileURLToPath(import.meta.url));
const splashDemo = readFileSync(path.join(dir, 'SplashDemo.astro'), 'utf8');

test('Run it locally goes to the live Chirp guide, not Development', (assert) => {

    assert.equal(splashDemo.includes("text: 'Run it locally'"), true);
    assert.equal(splashDemo.includes("link: '/try-the-demo-locally/'"), true);
    assert.equal(splashDemo.includes("link: '/development/'"), false);

});
