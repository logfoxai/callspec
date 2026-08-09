import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';

const root = path.resolve(__dirname, '../..');

test('2-column docs tables keep the label column compact, not the content column', (assert) => {
	const css = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');
	assert.equal(
		/table:not\(:has\(thead th:nth-child\(3\)\)\)\s*:is\(th, td\):last-child[\s\S]*?width:\s*30%/.test(
			css,
		),
		false,
		'last column must not be forced to 30% — that crushes Import/Use “Use” cells',
	);
	assert.equal(
		/table:not\(:has\(thead th:nth-child\(3\)\)\)\s*td:first-child[\s\S]*?width:\s*1%/.test(css),
		true,
		'first column should be the compact label column',
	);
});

test('package exports table does not use comma-separated code pills', (assert) => {
	const md = readFileSync(
		path.join(root, 'src/content/docs/api-reference/surfaces-and-exports.md'),
		'utf8',
	);
	const section = md.split('## Package exports')[1] ?? '';
	const table = section.split('←')[0] ?? '';
	assert.equal(
		/`[^`]+`,\s*`/.test(table),
		false,
		'comma-between-backticks wraps into orphan commas next to nowrap pills',
	);
});
