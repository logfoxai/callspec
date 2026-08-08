/**
 * Pagefind matches indexed terms that are prefixes of the query, so typing
 * "adsf" returns every page that contains the word "a". Reject those weak
 * inverted-prefix hits while keeping normal prefix/extension matches
 * ("route" → "routes", "err" → "error").
 */

function normalize(text: string): string {
	return text.replace(/<[^>]+>/g, '').trim().toLowerCase();
}

function extractMarks(html: string): string[] {
	return [...html.matchAll(/<mark>([\s\S]*?)<\/mark>/gi)].map((match) => normalize(match[1] ?? ''));
}

export function isUsefulMark(query: string, mark: string): boolean {
	const q = normalize(query);
	const m = normalize(mark);
	if (!q || !m) return false;
	if (m === q) return true;
	// Matched word extends the query: "route" → "routes"
	if (m.startsWith(q)) return true;
	// Indexed term is a prefix of the query: only keep if substantial
	if (q.startsWith(m)) {
		const minLen = Math.min(3, q.length);
		return m.length >= minLen && m.length >= Math.ceil(q.length * 0.5);
	}
	// Nearby fuzzy lengths (light typos)
	return m.length >= 3 && Math.abs(m.length - q.length) <= 2;
}

export type PagefindMatchData = {
	excerpt?: string;
	meta?: {title?: string};
	sub_results?: Array<{excerpt?: string; title?: string}>;
};

export function isUsefulPagefindMatch(query: string, data: PagefindMatchData): boolean {
	const q = normalize(query);
	if (!q) return false;

	const htmlBits: string[] = [];
	if (data.excerpt) htmlBits.push(data.excerpt);
	for (const sub of data.sub_results ?? []) {
		if (sub.excerpt) htmlBits.push(sub.excerpt);
	}

	const marks = htmlBits.flatMap(extractMarks);
	if (marks.length > 0) {
		return marks.some((mark) => isUsefulMark(q, mark));
	}

	const plainBits = [
		...htmlBits.map(normalize),
		normalize(data.meta?.title ?? ''),
		...(data.sub_results ?? []).map((sub) => normalize(sub.title ?? '')),
	];
	return plainBits.some((text) => text.includes(q));
}
