import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {lockIcon} from './icons';
import {renderIconLabel} from './iconLabel';

const dir = path.dirname(fileURLToPath(import.meta.url));

test('renderIconLabel: flex icon + label module', (assert) => {

    const html = renderIconLabel({
        icon: lockIcon(),
        label: 'Bearer',
        className: 'route-badge route-badge--bearer',
    });

    assert.equal(html.includes('class="icon-label route-badge route-badge--bearer"'), true);
    assert.equal(html.includes('icon-label__icon'), true);
    assert.equal(html.includes('icon-label__label">Bearer'), true);
    assert.equal(html.includes(lockIcon()), true);
    // Newlines between flex children become anonymous items (extra gap, off-center).
    assert.equal(html.includes('</span>\n'), false);
    assert.equal(html.includes('></span><span class="icon-label__label"'), true);

});

test('Bearer and MCP icon-labels come from renderIconLabel', (assert) => {

    const badges = readFileSync(path.join(dir, 'routeBadges.ts'), 'utf8');
    const main = readFileSync(path.join(dir, 'main.ts'), 'utf8');
    const mcp = readFileSync(path.join(dir, 'mcpConnect.ts'), 'utf8');
    const css = readFileSync(path.join(dir, 'styles.css'), 'utf8');

    assert.equal(badges.includes('renderIconLabel'), true);
    assert.equal(main.includes('renderIconLabel'), true);
    assert.equal(mcp.includes('renderIconLabel'), true);
    assert.equal(css.includes('.icon-label {'), true);
    assert.equal(css.includes('align-items: center'), true);

});
