import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const styles = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'styles.css'),
    'utf8',
);

test('sidebar top active links keep nav-active-fg (contrast on accent)', (assert) => {

    // Home / Routes use sidebar-link--top; without an explicit active color,
    // .sidebar-link--top { color: var(--text) } wins over --nav-active-fg.
    const rule = styles.match(
        /\.sidebar-link--top\.sidebar-link--active(?::hover)?\s*\{[^}]+\}/g,
    ) ?? [];

    assert.equal(rule.length >= 1, true);
    assert.equal(
        rule.some((block) => block.includes('color: var(--nav-active-fg)')),
        true,
    );

});
