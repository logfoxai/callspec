import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';

const root = path.resolve(__dirname, '../..');

test('coding-agents.md embeds the current skills/callspec/SKILL.md', (assert) => {
    const skill = readFileSync(path.join(root, 'skills/callspec/SKILL.md'), 'utf8');
    const page = readFileSync(path.join(root, 'src/content/docs/coding-agents.md'), 'utf8');
    const match = page.match(/````markdown title="SKILL\.md"\r?\n([\s\S]*?)\r?\n````/);
    assert.equal(match !== null, true);
    if (!match) {
        return;
    }
    assert.equal(match[1], skill.replace(/\r\n/g, '\n').replace(/\n$/, ''));
});
