import {test} from 'kizu';
import {wrapPagefindSearch} from './wrapPagefindSearch.js';

test('wrapPagefindSearch drops inverted short-prefix hits', async (assert) => {
	const rawSearch = async (_term: string): Promise<{
		results: Array<{data: () => Promise<{excerpt?: string; meta?: {title?: string}}>}>;
	}> => ({
		results: [
			{
				data: async (): Promise<{excerpt: string}> => ({
					excerpt: 'Fetch from <mark>a</mark> running server.',
				}),
			},
			{
				data: async (): Promise<{excerpt: string; meta: {title: string}}> => ({
					excerpt: 'Enable <mark>MCP</mark> tools',
					meta: {title: 'MCP'},
				}),
			},
		],
	});

	const search = wrapPagefindSearch(rawSearch);
	const garbage = await search('adsf');
	assert.equal(garbage.results.length, 0);

	const useful = await search('mcp');
	assert.equal(useful.results.length, 1);
	assert.equal((await useful.results[0]!.data()).meta?.title, 'MCP');
});

test('wrapPagefindSearch skips Pagefind until query is at least 3 characters', async (assert) => {
	let calls = 0;
	const rawSearch = async (): Promise<{results: []}> => {
		calls += 1;
		return {results: []};
	};

	const search = wrapPagefindSearch(rawSearch);

	assert.equal((await search('')).results.length, 0);
	assert.equal(calls, 0, 'empty query does not hit Pagefind');

	assert.equal((await search('te')).results.length, 0);
	assert.equal(calls, 0, 'two-character query does not hit Pagefind');

	assert.equal((await search('tes')).results.length, 0);
	assert.equal(calls, 1, 'three-character query runs Pagefind');
});
