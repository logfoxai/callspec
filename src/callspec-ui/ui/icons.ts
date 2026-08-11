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

export function chevronLeftIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>`;

}

export function chevronRightIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;

}

export function unlockIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 9.5-1"/><rect x="5" y="11" width="14" height="10" rx="2"/></svg>`;

}

export function lockIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;

}

/** Official MCP connector mark (modelcontextprotocol.io favicon), currentColor. */
export function mcpIcon(): string {

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" aria-hidden="true"><path d="M18 84.853 85.882 16.971c9.373-9.373 24.569-9.373 33.941 0s9.373 24.569 0 33.941L68.558 102.177"/><path d="m69.265 101.47 50.558-50.558c9.373-9.373 24.569-9.373 33.942 0l.353.353c9.373 9.373 9.373 24.569 0 33.941L92.725 146.6c-3.124 3.124-3.124 8.189 0 11.313l12.606 12.607"/><path d="m102.853 33.941-50.205 50.205c-9.372 9.372-9.372 24.568 0 33.941s24.569 9.372 33.941 0l50.205-50.205"/></svg>`;

}
