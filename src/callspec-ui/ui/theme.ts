export type Theme = 'light' | 'dark';

/** Same key as Starlight ThemeSelect — docs + demo stay in sync on one origin. */
const STORAGE_KEY = 'starlight-theme';

function getPreferredTheme(): Theme {

    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {

        return stored;

    }

    return 'dark';

}

function prefersReducedMotion(): boolean {

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;

}

function clearBootInlinePaint(): void {

    document.documentElement.style.removeProperty('background');
    document.documentElement.style.removeProperty('color-scheme');
    document.body?.style.removeProperty('background');

}

function commitTheme(theme: Theme): void {

    clearBootInlinePaint();
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);

}

/** Crossfade theme paints — avoids muddy CSS-variable background interpolation flicker. */
function applyTheme(theme: Theme, animate: boolean): void {

    if (
        animate
        && typeof document.startViewTransition === 'function'
        && !prefersReducedMotion()
    ) {

        document.startViewTransition(() => {
            commitTheme(theme);
        });
        return;

    }

    commitTheme(theme);

}

export function initTheme(): Theme {

    const theme = getPreferredTheme();

    applyTheme(theme, false);

    return theme;

}

export function toggleTheme(current: Theme): Theme {

    const next: Theme = current === 'light' ? 'dark' : 'light';

    applyTheme(next, true);

    return next;

}
