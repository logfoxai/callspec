/** Powered-by callspec strip — lives at the end of the scrollable content pane. */

import {renderCallspecLockup} from './callspecLockup';

const POWERED_BY_HREF = 'https://github.com/logfoxai/callspec';

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

function ensurePoweredByLockup(footer: HTMLElement): void {

    if (footer.querySelector('.cs-lockup')) return;

    footer.replaceChildren();
    const label = document.createElement('span');
    label.className = 'footer-label';
    label.textContent = 'Powered by';
    footer.append(label);
    footer.insertAdjacentHTML('beforeend', renderCallspecLockup({
        href: POWERED_BY_HREF,
        maskId: 'cs-eq-mask-explorer',
        holes: 'overlay',
        extraHtml: '<span class="sr-only">callspec</span>',
        attrs: {target: '_blank', rel: 'noopener'},
    }));

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
    if (footer.parentElement !== content) {
        content.appendChild(footer);
    }

    ensurePoweredByLockup(footer);

}
