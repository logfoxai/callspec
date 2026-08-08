import {isUsefulPagefindMatch, type PagefindMatchData} from './isUsefulPagefindMatch.js';

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
		const res = await rawSearch(term, options);
		if (!term?.trim()) return res;
		const judged = await Promise.all(
			res.results.map(async (result) => {
				const data = await result.data();
				return isUsefulPagefindMatch(term, data) ? result : null;
			}),
		);
		return {...res, results: judged.filter((result): result is PagefindSearchResult => result !== null)};
	};
}
