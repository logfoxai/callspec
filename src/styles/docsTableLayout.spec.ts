import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';

const root = path.resolve(__dirname, '../..');

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
