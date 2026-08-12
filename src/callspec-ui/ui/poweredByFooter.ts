/** Powered-by callspec strip — lives at the end of the scrollable content pane. */

export function shouldShowPoweredByFooter(poweredBy: boolean | undefined): boolean {

    return poweredBy !== false;

}

function findPoweredByFooter(): HTMLElement | null {

    const el = document.querySelector('body > footer.footer, .content > footer.footer');
    return el instanceof HTMLElement ? el : null;

}

/**
 * Park the shell footer on `<body>` before `#app` innerHTML rebuilds wipe `.content`.
 * Call this immediately before replacing app markup.
 */
export function parkPoweredByFooter(): void {

    const footer = findPoweredByFooter();
    if (!footer || footer.parentElement === document.body) return;
    document.body.appendChild(footer);

}

/** Move the shell `<footer class="footer">` into `.content` so it scrolls with the page. */
export function placePoweredByFooter(
    appRoot: ParentNode,
    poweredBy: boolean | undefined,
): void {

    const footer = findPoweredByFooter();
    if (!footer) return;

    if (!shouldShowPoweredByFooter(poweredBy)) {

        footer.remove();
        return;

    }

    const content = appRoot.querySelector('.content');
    if (!(content instanceof HTMLElement)) return;
    if (footer.parentElement === content) return;
    content.appendChild(footer);

}
