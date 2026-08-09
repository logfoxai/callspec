/**
 * When a fence has no `title="…"`, use the language id so every block gets
 * editor/terminal chrome (our CSS + codeBlockTitles enhancer).
 */
function titleFromLangPlugin() {
    return {
        name: 'cs-title-from-lang',
        hooks: {
            preprocessMetadata({codeBlock}) {
                if (codeBlock.props.title) {
                    return;
                }
                const lang = (codeBlock.language ?? '').trim().toLowerCase();
                codeBlock.props.title = lang || 'code';
            },
        },
    };
}

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
export default {
    // Inline theme CSS in the first block — avoids a body <link> that FOUCs on navigation.
    emitExternalStylesheet: false,
    plugins: [titleFromLangPlugin()],
    // Auto frame + lang title for untitled fences; shell langs stay terminal/bash
    defaultProps: {
        frame: 'auto',
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
