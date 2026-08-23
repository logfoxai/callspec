import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';

const root = path.resolve(__dirname, '../..');

test('coding-agents.md points at SKILL.md instead of embedding it', (assert) => {

    const skill = readFileSync(path.join(root, 'skills/callspec/SKILL.md'), 'utf8')
        .replace(/\r\n/g, '\n')
        .replace(/\n$/, '');
    const page = readFileSync(path.join(root, 'src/content/docs/coding-agents.md'), 'utf8');

    assert.equal(page.includes('skills/callspec/SKILL.md'), true);
    assert.equal(page.includes(skill), false);
    assert.equal(/````markdown title="SKILL\.md"/.test(page), false);

});
