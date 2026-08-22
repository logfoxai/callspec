/** Headline fragment wrapped with the ducktape.svg strip on the home hero. */
export const SPLASH_TAPE_PHRASE = 'duct-taping';

export function splitHeadlineForTape(
	headline: string,
	phrase = SPLASH_TAPE_PHRASE,
): {before: string; phrase: string; after: string} | null {
	const index = headline.indexOf(phrase);
	if (index === -1) return null;
	return {
		before: headline.slice(0, index),
		phrase,
		after: headline.slice(index + phrase.length),
	};
}
