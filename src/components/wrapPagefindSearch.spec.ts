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
