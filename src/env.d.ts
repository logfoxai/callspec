/// <reference types="astro/client" />

/**
 * Starlight virtual modules + route locals for docs overrides.
 * Inline declarations only — must not import @astrojs/starlight TS sources,
 * or library `tsc` (rootDir src) will typecheck node_modules and break.
 */

type StarlightComponent = import('astro').AstroComponentFactory;

declare module 'virtual:starlight/user-config' {
	const Config: {
		pagefind?: boolean | Record<string, unknown>;
		components: Record<string, string>;
	};
	export default Config;
}

declare module 'virtual:starlight/project-context' {
	const ProjectContext: {
		root: string;
		srcDir: string;
		trailingSlash: import('astro').AstroConfig['trailingSlash'];
		build: {
			format: import('astro').AstroConfig['build']['format'];
		};
	};
	export default ProjectContext;
}

declare module 'virtual:starlight/pagefind-config' {
	export const pagefindUserConfig: Record<string, unknown>;
}

declare module 'virtual:starlight/components/Pagination' {
	const Pagination: StarlightComponent;
	export default Pagination;
}
declare module 'virtual:starlight/components/LanguageSelect' {
	const LanguageSelect: StarlightComponent;
	export default LanguageSelect;
}
declare module 'virtual:starlight/components/MobileMenuToggle' {
	const MobileMenuToggle: StarlightComponent;
	export default MobileMenuToggle;
}
declare module 'virtual:starlight/components/Search' {
	const Search: StarlightComponent;
	export default Search;
}
declare module 'virtual:starlight/components/SiteTitle' {
	const SiteTitle: StarlightComponent;
	export default SiteTitle;
}
declare module 'virtual:starlight/components/SocialIcons' {
	const SocialIcons: StarlightComponent;
	export default SocialIcons;
}
declare module 'virtual:starlight/components/ThemeSelect' {
	const ThemeSelect: StarlightComponent;
	export default ThemeSelect;
}

declare namespace App {
	interface Locals {
		starlightRoute: {
			pagination: {
				prev?: {href: string; label: string};
				next?: {href: string; label: string};
			};
			hasSidebar: boolean;
			siteTitle: string;
			siteTitleHref: string;
			head: Array<{tag: string; attrs?: Record<string, string>; content?: string}>;
			entry: {data: {title: string}};
		};
	}
}
