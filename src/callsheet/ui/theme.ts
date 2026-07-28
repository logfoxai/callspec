export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'callsheet-theme';

export function getPreferredTheme(): Theme {

    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {

        return stored;

    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

}

export function applyTheme(theme: Theme): void {

    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);

}

export function initTheme(): Theme {

    const theme = getPreferredTheme();

    applyTheme(theme);

    return theme;

}

export function toggleTheme(current: Theme): Theme {

    const next: Theme = current === 'light' ? 'dark' : 'light';

    applyTheme(next);

    return next;

}
