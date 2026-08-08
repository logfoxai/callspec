import {test} from 'kizu';
import {isUsefulMark, isUsefulPagefindMatch} from './isUsefulPagefindMatch.js';

test('rejects inverted short-prefix garbage (adsf → a, asdfasdf → as)', (assert) => {
	assert.equal(isUsefulMark('adsf', 'a'), false);
	assert.equal(isUsefulMark('asdfasdf', 'as'), false);
	assert.equal(isUsefulMark('xyzz', 'x'), false);

	assert.equal(
		isUsefulPagefindMatch('adsf', {
			excerpt: 'Fetch from <mark>a</mark> running server.',
		}),
		false,
	);
	assert.equal(
		isUsefulPagefindMatch('asdfasdf', {
			excerpt: 'same routes object <mark>as</mark> your RPC server',
		}),
		false,
	);
});

test('keeps real prefix/extension matches and exact terms', (assert) => {
	assert.equal(isUsefulMark('a', 'a'), true, 'intentional single-letter search');
	assert.equal(isUsefulMark('route', 'route'), true);
	assert.equal(isUsefulMark('route', 'routes'), true);
	assert.equal(isUsefulMark('err', 'error'), true);
	assert.equal(isUsefulMark('mcp', 'MCP'), true);

	assert.equal(
		isUsefulPagefindMatch('mcp', {
			excerpt: 'Enable <mark>MCP</mark> tools on your API',
			meta: {title: 'MCP'},
		}),
		true,
	);
	assert.equal(
		isUsefulPagefindMatch('route', {
			excerpt: 'Define a <mark>route</mark> with input and output',
			sub_results: [{excerpt: 'Multiple <mark>routes</mark> share schemas'}],
		}),
		true,
	);
});
