import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {CALLSPEC_EQ_BARS, callspecMarkPathD} from './icons';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('callspec mark equals match the header lockup cutout, not the wider shipped holes', (assert) => {

    const icon = callspecMarkPathD();
    const lockup = readFileSync(path.join(root, 'src/callspec-ui/ui/callspecLockup.ts'), 'utf8');
    const title = readFileSync(path.join(root, 'src/overrides/SiteTitle.astro'), 'utf8');
    const footer = readFileSync(path.join(root, 'src/components/SiteFooter.astro'), 'utf8');
    const markLight = readFileSync(path.join(root, 'assets/mark-light.svg'), 'utf8');
    const markDark = readFileSync(path.join(root, 'assets/mark-dark.svg'), 'utf8');
    const lockupLight = readFileSync(path.join(root, 'assets/callspec-lockup-light.svg'), 'utf8');
    const lockupDark = readFileSync(path.join(root, 'assets/callspec-lockup-dark.svg'), 'utf8');

    assert.equal(title.includes('CallspecLockup'), true);
    assert.equal(lockup.includes('CALLSPEC_EQ_BARS'), true);
    assert.equal(lockup.includes('CALLSPEC_HEX_PATH'), true);
    assert.equal(lockup.includes('cs-lockup'), true);
    assert.equal(CALLSPEC_EQ_BARS, [
        {x: 19, y: 24, width: 26, height: 6, rx: 3},
        {x: 19, y: 34, width: 26, height: 6, rx: 3},
    ]);

    // Header bars are 26×6 at x=19. The old evenodd path used 32-wide pills (x=16).
    assert.equal(icon.includes('M22 24H42A3 3 0 0 1 42 30H22A3 3 0 0 1 22 24Z'), true);
    assert.equal(icon.includes('M19.00 24.00H45.00'), false);
    assert.equal(footer.includes('CallspecLockup'), true);
    assert.equal(markLight.includes('M22 24H42A3 3 0 0 1 42 30H22A3 3 0 0 1 22 24Z'), true);
    assert.equal(markDark.includes('M22 24H42A3 3 0 0 1 42 30H22A3 3 0 0 1 22 24Z'), true);
    assert.equal(lockupLight.includes('M22 24H42A3 3 0 0 1 42 30H22A3 3 0 0 1 22 24Z'), true);
    assert.equal(lockupDark.includes('M22 24H42A3 3 0 0 1 42 30H22A3 3 0 0 1 22 24Z'), true);
    assert.equal(lockupLight.includes('@font-face'), false);
    assert.equal(lockupDark.includes('@font-face'), false);

});
