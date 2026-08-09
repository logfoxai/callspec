/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
export default {
    // Inline theme CSS in the first block — avoids a body <link> that FOUCs on navigation.
    emitExternalStylesheet: false,
    // Flat panels by default; shell langs get a terminal frame + bash title
    defaultProps: {
        frame: 'none',
        overridesByLang: {
            'bash,sh,shell,zsh,shellscript,shellsession,console': {
                frame: 'terminal',
                title: 'bash',
            },
        },
    },
    frames: {
        showCopyToClipboardButton: true,
    },
    // Monokai (dark) + github-light — Starlight toggles via html[data-theme]
    themes: ['monokai', 'github-light'],
    useDarkModeMediaQuery: false,
    styleOverrides: {
        borderRadius: '0.5rem',
        borderWidth: '0px',
        codeFontSize: '0.9rem',
        codePaddingBlock: '0.6rem',
        codePaddingInline: '0.75rem',
        // Resolved via CSS so light/dark panels match ui-components --color-bg-dark1
        codeBackground: 'var(--cs-code-bg)',
        frames: {
            shadowColor: 'transparent',
        },
    },
};
