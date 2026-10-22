import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {CALLSPEC_HEX_PATH} from './icons';
import {renderCallspecLockup, renderCallspecLockupMark, renderCallspecLockupMarkOverlay} from './callspecLockup';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('renderCallspecLockup is the only lockup markup — docs + explorer', (assert) => {

    const html = renderCallspecLockup({
        href: '/',
        maskId: 'cs-eq-mask-test',
    });
    const mark = renderCallspecLockupMark('cs-eq-mask-test');
    const footer = readFileSync(path.join(root, 'src/components/SiteFooter.astro'), 'utf8');
    const config = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const chrome = readFileSync(path.join(root, 'src/callspec-ui/ui/docsChrome.ts'), 'utf8');
    const powered = readFileSync(path.join(root, 'src/callspec-ui/ui/poweredByFooter.ts'), 'utf8');
    const shell = readFileSync(path.join(root, 'scripts/build-ui.mjs'), 'utf8');
    const explorerCss = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    assert.equal(html.includes('class="cs-lockup"'), true);
    assert.equal(html.includes(CALLSPEC_HEX_PATH), true);
    assert.equal(html.includes('id="cs-eq-mask-test"'), true);
    assert.equal(html.includes('cs-lockup__word'), true);
    assert.equal(html.includes(mark), true);

    const overlayHtml = renderCallspecLockup({
        href: '/',
        maskId: 'cs-eq-mask-overlay',
        holes: 'overlay',
    });
    assert.equal(overlayHtml.includes('data-holes="overlay"'), true);

    assert.equal(footer.includes('/callspec-lockup-light.svg'), true);
    assert.equal(footer.includes('/callspec-lockup-dark.svg'), true);
    assert.equal(config.includes("light: './assets/callspec-lockup-light.svg'"), true);
    assert.equal(config.includes("dark: './assets/callspec-lockup-dark.svg'"), true);
    assert.equal(config.includes('SiteTitle:'), false);
    assert.equal(powered.includes('renderCallspecLockup'), true);
    assert.equal(chrome.includes('renderCallspecLockupMark'), true);

    const footerHtml = shell.slice(
        shell.indexOf('<footer class="footer">'),
        shell.indexOf('</footer>'),
    );
    assert.equal(footerHtml.includes('footer-logo'), false);
    assert.equal(footerHtml.includes('mark-light.svg'), false);
    assert.equal(footerHtml.includes('Powered by'), true);

    const footerBlock = explorerCss.slice(
        explorerCss.indexOf('.content > .footer'),
        explorerCss.indexOf('.empty-state'),
    );
    assert.equal(footerBlock.includes('border-top'), false);

});

test('explorer lockup marks do not use #mask — <base href="/demo/"> breaks url(#id)', (assert) => {

    const overlay = renderCallspecLockupMarkOverlay();
    const chrome = readFileSync(path.join(root, 'src/callspec-ui/ui/docsChrome.ts'), 'utf8');
    const powered = readFileSync(path.join(root, 'src/callspec-ui/ui/poweredByFooter.ts'), 'utf8');

    assert.equal(overlay.includes('mask='), false);
    assert.equal(overlay.includes('cs-eq--top'), true);
    assert.equal(overlay.includes(CALLSPEC_HEX_PATH), true);
    assert.equal(chrome.includes('renderCallspecLockupMarkOverlay'), true);
    assert.equal(chrome.includes('renderCallspecLockupMark('), false);
    assert.equal(powered.includes("holes: 'overlay'"), true);

});
