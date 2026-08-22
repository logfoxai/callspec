export type PagefindMountEl = {
	id: string;
};

export type PagefindMountHost = {
	querySelector(selector: string): PagefindMountEl | null;
};

/**
 * PagefindUI takes a document-level CSS selector. Header + mobile <Search />
 * both used `#starlight__search`, so both UIs mounted into the first dialog.
 */
export function bindPagefindMount(host: PagefindMountHost, id: string): string | null {
	const mount = host.querySelector('[data-cs-pagefind-root]');
	if (!mount) return null;
	mount.id = id;
	return `#${id}`;
}
