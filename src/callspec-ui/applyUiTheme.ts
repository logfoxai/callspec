import type {CallspecUiTheme} from '../types';

export type AppliedUiTheme = {
    cssVars: Record<string, string>
    fontUrls: string[]
};

const THEME_TO_CSS_VAR = {
    background: '--bg',
    accent: '--accent',
    surface: '--surface',
    fontFamily: '--sans',
} as const;

type ThemeColorKey = keyof typeof THEME_TO_CSS_VAR;

/** Match built-in UI palettes so brand surfaces stay readable in both modes. */
const LIGHT_TEXT = {
    '--text': 'hsl(228, 25%, 12%)',
    '--text-secondary': 'hsl(228, 10%, 40%)',
    '--text-tertiary': 'hsl(228, 8%, 52%)',
} as const;

const DARK_TEXT = {
    '--text': '#fafafa',
    '--text-secondary': '#a3a3a3',
    '--text-tertiary': '#737373',
} as const;

function parseHexColor(value: string): {r: number, g: number, b: number} | undefined {

    const hex = value.trim().replace(/^#/, '');

    if (/^[0-9a-fA-F]{3}$/.test(hex)) {

        return {
            r: parseInt(hex[0] + hex[0], 16),
            g: parseInt(hex[1] + hex[1], 16),
            b: parseInt(hex[2] + hex[2], 16),
        };

    }

    if (/^[0-9a-fA-F]{6}$/.test(hex)) {

        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
        };

    }

    return undefined;

}

function relativeLuminance({r, g, b}: {r: number, g: number, b: number}): number {

    const channel = (c: number): number => {

        const s = c / 255;

        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;

    };

    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

}

/** When brand background/surface pin both modes, pick readable text tokens. */
function textTokensForSurface(color: string): Record<string, string> | undefined {

    const rgb = parseHexColor(color);

    if (!rgb) {

        return undefined;

    }

    // WCAG-ish midpoint: dark surfaces get light text.
    return relativeLuminance(rgb) < 0.4 ? {...DARK_TEXT} : {...LIGHT_TEXT};

}

/** Pure: map branding theme fields to CSS custom properties (no DOM). */
export function applyUiTheme(theme: CallspecUiTheme | undefined): AppliedUiTheme {

    const cssVars: Record<string, string> = {};

    if (!theme) {

        return {cssVars, fontUrls: []};

    }

    for (const key of Object.keys(THEME_TO_CSS_VAR) as ThemeColorKey[]) {

        const value = theme[key];

        if (typeof value === 'string' && value.length > 0) {

            cssVars[THEME_TO_CSS_VAR[key]] = value;

        }

    }

    if (typeof theme.accent === 'string' && theme.accent.length > 0) {

        cssVars['--nav-active-bg'] = theme.accent;
        cssVars['--cs-primary-bg'] = theme.accent;
        cssVars['--accent-soft'] = `color-mix(in srgb, ${theme.accent} 16%, var(--surface))`;

        const onAccent = textTokensForSurface(theme.accent);

        if (onAccent) {

            cssVars['--nav-active-fg'] = onAccent['--text'];
            cssVars['--cs-primary-fg'] = onAccent['--text'];

        }

    }

    const surfaceForContrast = theme.background ?? theme.surface;

    if (typeof surfaceForContrast === 'string' && surfaceForContrast.length > 0) {

        const textVars = textTokensForSurface(surfaceForContrast);

        if (textVars) {

            Object.assign(cssVars, textVars);

        }

    }

    const fontUrls = Array.isArray(theme.fontUrls)
        ? theme.fontUrls.filter((url): url is string => typeof url === 'string' && url.length > 0)
        : [];

    return {cssVars, fontUrls};

}

const FONT_LINK_ATTR = 'data-callspec-ui-font';

/** Apply theme CSS vars and inject webfont `<link>` tags on a document. */
export function applyUiThemeToDocument(
    theme: CallspecUiTheme | undefined,
    doc: Document = document,
): AppliedUiTheme {

    const applied = applyUiTheme(theme);
    const root = doc.documentElement;

    for (const [name, value] of Object.entries(applied.cssVars)) {

        root.style.setProperty(name, value);

    }

    doc.querySelectorAll(`link[${FONT_LINK_ATTR}]`).forEach((node) => node.remove());

    const head = doc.head;

    if (head) {

        for (const href of applied.fontUrls) {

            const link = doc.createElement('link');

            link.rel = 'stylesheet';
            link.href = href;
            link.setAttribute(FONT_LINK_ATTR, '');
            head.appendChild(link);

        }

    }

    return applied;

}
