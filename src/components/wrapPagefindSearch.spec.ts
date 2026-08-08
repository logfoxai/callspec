import {test} from 'kizu';
import {wrapPagefindSearch} from './wrapPagefindSearch.js';

test('wrapPagefindSearch drops inverted short-prefix hits without mutating the raw fn', async (assert) => {
	const calls: string[] = [];
	const rawSearch = async (term: string): Promise<{
		results: Array<{data: () => Promise<{excerpt?: string; meta?: {title?: string}}>}>;
	}> => {
		calls.push(term);
		return {
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
		};
	};

	const search = wrapPagefindSearch(rawSearch);
	const garbage = await search('adsf');
	assert.equal(garbage.results.length, 0);
	assert.equal(calls.join(','), 'adsf');

	const useful = await search('mcp');
	assert.equal(useful.results.length, 1);
	assert.equal((await useful.results[0]!.data()).meta?.title, 'MCP');
});

test('wrapPagefindSearch returns a new function (ESM exports cannot be reassigned)', (assert) => {
	const raw = async (): Promise<{results: []}> => ({results: []});
	const wrapped = wrapPagefindSearch(raw);
	assert.equal(typeof wrapped, 'function');
	assert.equal(wrapped === raw, false);
});

test('wrapPagefindSearch hydrates result data in parallel', async (assert) => {
	let inFlight = 0;
	let maxInFlight = 0;
	const makeResult = (excerpt: string): {data: () => Promise<{excerpt: string}>} => ({
		data: async (): Promise<{excerpt: string}> => {
			inFlight += 1;
			maxInFlight = Math.max(maxInFlight, inFlight);
			await new Promise((resolve) => setTimeout(resolve, 25));
			inFlight -= 1;
			return {excerpt};
		},
	});

	const rawSearch = async (): Promise<{
		results: Array<{data: () => Promise<{excerpt: string}>}>;
	}> => ({
		results: [
			makeResult('Fetch from <mark>a</mark> running server.'),
			makeResult('Enable <mark>MCP</mark> tools'),
			makeResult('same routes object <mark>as</mark> your RPC server'),
		],
	});

	const search = wrapPagefindSearch(rawSearch);
	const garbage = await search('adsf');
	assert.equal(garbage.results.length, 0);
	assert.equal(maxInFlight > 1, true, 'must hydrate multiple results concurrently');
});
