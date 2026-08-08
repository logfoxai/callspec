/**
 * Dev/type stub only. The real Pagefind engine is written to docs-site/pagefind/
 * during `astro build`. The cs-pagefind shim imports that built file at runtime.
 */
export async function options() {}
export async function init() {}
export async function destroy() {}
export async function mergeIndex() {}
export async function filters() {
	return {};
}
export async function preload() {}
export async function search() {
	return {results: []};
}
export async function debouncedSearch() {
	return {results: []};
}
export function createInstance() {
	return {
		options,
		init,
		destroy,
		mergeIndex,
		filters,
		preload,
		search,
		debouncedSearch,
	};
}
