/** Hosted Chirp explorer (`/demo/` or the production `/demo/` URL). */
export function isDemoLink(link: string): boolean {
	return /(?:^|\/)demo\/?(?:[#?]|$)/.test(link);
}

/** Demo CTAs leave the docs page — always open a new tab. */
export function withDemoLinkOpenAttrs(
	href: string,
	attrs: Record<string, string | number | boolean> = {},
): Record<string, string | number | boolean> {
	if (!isDemoLink(href)) {
		return {...attrs};
	}

	return {
		...attrs,
		target: '_blank',
		rel: 'noopener noreferrer',
	};
}
