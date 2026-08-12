/** In-memory scroll preserve — used across Vite SPA re-renders (no sessionStorage). */

type Scrollable = {
    scrollTop: number
};

export function readScrollTop(el: Scrollable | null | undefined): number {

    return el?.scrollTop ?? 0;

}

export function writeScrollTop(el: Scrollable | null | undefined, top: number): void {

    if (!el) return;
    el.scrollTop = top;

}
