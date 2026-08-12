import type {CallspecUiRoute} from '../types';
import {renderRouteBadges} from './routeBadges';

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

/**
 * Docs-style title panel for a route (no back crumb).
 * Title = `route.meta.summary` (falls back to the RPC name).
 * Full-bleed hairline lives on `.route-page__title` (Starlight content-panel width).
 */
export function renderRouteHeader(route: CallspecUiRoute): string {

    const title = route.summary.trim() || route.name;
    const showName = title !== route.name;
    const nameHtml = showName
        ? `<span class="route-name">${escapeHtml(route.name)}</span>`
        : '';

    return `
        <header class="route-header">
            <h1 class="route-title">${escapeHtml(title)}</h1>
            <div class="route-endpoint">
                <span class="method">POST</span>
                ${nameHtml}
                <div class="badges">${renderRouteBadges(route)}</div>
            </div>
        </header>
    `;

}

/** Prose under the title-panel divider. */
export function renderRouteLead(route: CallspecUiRoute): string {

    const desc = route.description.trim();
    if (!desc) return '';
    return `<p class="route-desc">${escapeHtml(desc)}</p>`;

}
