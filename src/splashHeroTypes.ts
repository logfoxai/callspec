/** Starlight splash hero CTA from frontmatter `hero.actions`. */
export type SplashHeroAction = {
	text: string;
	link: string;
	variant?: 'primary' | 'secondary' | 'minimal';
	/** After Starlight schema transform: `{ type: 'icon', name }` or `{ type: 'raw', html }`. */
	icon?:
		| {type: 'icon'; name: string}
		| {type: 'raw'; html: string}
		| {name?: string; html?: string};
	attrs?: Record<string, string | number | boolean> & {
		class?: string;
	};
};

export type SplashHeroActionList = SplashHeroAction[];

/** Icons referenced from splash hero frontmatter. */
export const SPLASH_HERO_ICON_NAMES = ['right-arrow', 'left-arrow', 'github', 'rocket'] as const;

export type SplashHeroIconName = (typeof SPLASH_HERO_ICON_NAMES)[number];

export function splashHeroIconName(name: string | undefined): SplashHeroIconName | undefined {
	if (!name) return undefined;
	return (SPLASH_HERO_ICON_NAMES as readonly string[]).includes(name)
		? (name as SplashHeroIconName)
		: undefined;
}
