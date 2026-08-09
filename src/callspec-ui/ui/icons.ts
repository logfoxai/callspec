/** Inline SVG icons — 1.5px stroke to match → / ↗ text arrows elsewhere in the callspec UI. */

const SVG_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

export function themeSunIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;

}

export function themeMoonIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 6 6 0 1 0 20 14.5Z"/></svg>`;

}

export function menuIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;

}

export function closeIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

}
