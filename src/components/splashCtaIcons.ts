/** Inline SVG for splash hero CTAs — stroke style matches callspec-ui icons. */

const SVG_ATTRS =
	'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

/** Terminal prompt — “start here” for getting started. */
export function getStartedCtaIconHtml(): string {
	return `<svg ${SVG_ATTRS} class="splash-hero__cta-icon"><path d="M8 6l5 6-5 6"/><path d="M14 18h5"/></svg>`;
}

export function isGettingStartedLink(link: string): boolean {
	return /\/getting-started\/?(?:#|$)/.test(link);
}
