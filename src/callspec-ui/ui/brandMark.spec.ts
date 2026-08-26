import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {CALLSPEC_HEX_PATH} from './icons';
import {renderCallspecLockupMarkOverlay} from './callspecLockup';
import {renderBrandOrDefaultMark} from './brandMark';

const dir = path.dirname(fileURLToPath(import.meta.url));

test('no logo uses the Callspec hex mark, not a letter avatar', (assert) => {

    const html = renderBrandOrDefaultMark({name: 'Upload test'}, 'top-mark');

    assert.equal(html.includes(CALLSPEC_HEX_PATH), true);
    assert.equal(html.includes(renderCallspecLockupMarkOverlay()), true);
    assert.equal(html.includes('data-holes="overlay"'), true);
    assert.equal(html.includes('top-mark'), true);
    assert.equal(html.includes('brand-letter'), false);
    assert.equal(html.includes('>U<'), false);

});

test('logoUrl still wins over the Callspec hex', (assert) => {

    const html = renderBrandOrDefaultMark(
        {logoUrl: './brand/mark.svg', logoUrlDark: './brand/mark-dark.svg'},
        'intro-logo',
    );

    assert.equal(html.includes('src="./brand/mark.svg"'), true);
    assert.equal(html.includes('src="./brand/mark-dark.svg"'), true);
    assert.equal(html.includes('intro-logo'), true);
    assert.equal(html.includes(CALLSPEC_HEX_PATH), false);
    assert.equal(html.includes('brand-letter'), false);

});

test('explorer chrome uses renderBrandOrDefaultMark for header and home', (assert) => {

    const main = readFileSync(path.join(dir, 'main.ts'), 'utf8');
    const css = readFileSync(path.join(dir, 'styles.css'), 'utf8');

    assert.equal(main.includes('renderBrandOrDefaultMark'), true);
    assert.equal(main.includes('renderLetterMark'), false);
    assert.equal(css.includes('.brand-letter'), false);
    assert.equal(css.includes('--text-primary'), false);
    assert.equal(css.includes('.top-header .brand-mark-callspec .cs-eq'), true);
    assert.equal(css.includes('fill: var(--docs-header-bg)'), true);

});
