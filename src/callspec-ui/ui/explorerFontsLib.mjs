/** Lib-mode path so Vite emits woff2 files instead of leaving absolute /fonts/ urls. */
const LIB_FONT = /url\((['"])\/fonts\/([^'"]+\.woff2)\1\)/g;

/**
 * @param {string} css
 */
export function rewritePublicFontsForLibBuild(css) {
    return css.replace(
        LIB_FONT,
        (_all, quote, file) => `url(${quote}../../../assets/fonts/${file}?no-inline${quote})`,
    );
}
