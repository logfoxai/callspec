import {routeNeighbors} from '../filterRoutes';
import type {CallspecUiRoute} from '../types';
import {paginationLeftArrowIcon, paginationRightArrowIcon} from './icons';

function escapeHtml(value: string): string {

    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

}

function paginationButton(
    rel: 'prev' | 'next',
    routeName: string,
    label: 'Previous' | 'Next',
): string {

    const icon = rel === 'prev' ? paginationLeftArrowIcon() : paginationRightArrowIcon();
    const text = `
            <span>
                ${label}<br>
                <span class="link-title">${escapeHtml(routeName)}</span>
            </span>
    `.trim();
    // Prev: arrow then label (left). Next: label then arrow (right) — no row-reverse needed.
    const content = rel === 'prev' ? `${icon}\n            ${text}` : `${text}\n            ${icon}`;

    return `
        <button type="button" class="pagination-link" rel="${rel}" data-route="${escapeHtml(routeName)}">
            ${content}
        </button>
    `;

}

/** Footer prev/next navigation in sidebar order (across tag groups). */
export function renderRoutePagination(routeName: string, routes: CallspecUiRoute[]): string {

    const {prev, next} = routeNeighbors(routes, routeName);

    if (!prev && !next) return '';

    return `
        <nav class="pagination-links" aria-label="Adjacent routes" dir="ltr">
            ${prev ? paginationButton('prev', prev, 'Previous') : ''}
            ${next ? paginationButton('next', next, 'Next') : ''}
        </nav>
    `;

}

/** Footer wrapper — omitted when the route has no adjacent routes. */
export function renderRoutePaginationFooter(routeName: string, routes: CallspecUiRoute[]): string {

    const nav = renderRoutePagination(routeName, routes);

    if (!nav) return '';

    return `
        <footer class="route-page__footer">
            ${nav}
        </footer>
    `;

}
