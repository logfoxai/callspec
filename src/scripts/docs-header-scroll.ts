const SCROLL_THRESHOLD_PX = 0;

/** Sticky docs header — site-style blur/fade via `is-scrolled` (see docs-shared.css). */
export function attachDocsHeaderScroll(): void {
    const header = document.querySelector('header.header.site-header');
    if (!(header instanceof HTMLElement)) {
        return;
    }

    const sync = (): void => {
        header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD_PX);
    };

    sync();
    window.addEventListener('scroll', sync, {passive: true});
    window.addEventListener('resize', sync, {passive: true});
}
