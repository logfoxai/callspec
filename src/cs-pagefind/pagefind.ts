/**
 * Shim loaded by PagefindUI instead of the real engine.
 * Re-exports Pagefind APIs with a filtered `search` (see wrapPagefindSearch).
 *
 * Relative import keeps GitHub Pages base paths working:
 * /{base}/cs-pagefind/pagefind.js → /{base}/pagefind/pagefind.js
 *
 * At build time esbuild leaves `../pagefind/pagefind.js` external so the browser
 * loads the Starlight-generated index next to this shim.
 */
import * as engine from '../pagefind/pagefind.js';
import {wrapPagefindSearch} from '../components/wrapPagefindSearch.js';

export const options = engine.options;
export const init = engine.init;
export const destroy = engine.destroy;
export const mergeIndex = engine.mergeIndex;
export const filters = engine.filters;
export const preload = engine.preload;
export const createInstance = engine.createInstance;
export const debouncedSearch = engine.debouncedSearch;

export const search = wrapPagefindSearch(async (term, options) => engine.search(term, options));
