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
