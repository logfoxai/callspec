import {isUsefulPagefindMatch, type PagefindMatchData} from './isUsefulPagefindMatch.js';
import {isDocsSearchQueryReady} from './docsSearchQuery.js';

type PagefindSearchResult = {
	data: () => Promise<PagefindMatchData>;
};

type PagefindSearchResponse = {
	results: PagefindSearchResult[];
	[key: string]: unknown;
};

type PagefindSearchFn = (
	term: string,
	options?: object,
) => Promise<PagefindSearchResponse>;

/**
 * Returns a new search function that drops inverted short-prefix hits.
 * Do not assign over ESM `search` exports — module namespaces are immutable.
 */
export function wrapPagefindSearch(rawSearch: PagefindSearchFn): PagefindSearchFn {
	return async (term, options) => {
		const query = term?.trim() ?? '';
		if (!isDocsSearchQueryReady(query)) {
			return {results: []};
		}

		try {
			const res = await rawSearch(term, options);
			const judged = await Promise.all(
				res.results.map(async (result) => {
					const data = await result.data();
					return isUsefulPagefindMatch(query, data) ? result : null;
				}),
			);
			return {...res, results: judged.filter((result): result is PagefindSearchResult => result !== null)};
		} catch (err) {
			console.error('Callspec docs search failed', err);
			return {results: []};
		}
	};
}
