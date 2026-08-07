import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const css = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), 'starlight-custom.css'),
	'utf8',
);

test('guide tables kill Starlight thead→tbody sibling gap', (assert) => {
	assert.equal(
		/table[^{]*\{[^}]*display:\s*block/s.test(css),
		true,
		'tables stay display:block for horizontal scroll',
	);
	const theadTbodyRule = css.match(
		/table[^\n]*:is\(thead,\s*tbody\)\s*\{[^}]+\}/s,
	)?.[0];
	assert.equal(Boolean(theadTbodyRule), true, 'thead/tbody share a rule');
	assert.equal(
		/display:\s*table/.test(theadTbodyRule ?? ''),
		true,
		'thead/tbody remain display:table inside the scroll frame',
	);
	assert.equal(
		/margin(?:-top)?:\s*0/.test(theadTbodyRule ?? ''),
		true,
		'zero margin so --sl-content-gap-y does not pad the first body row',
	);
});
