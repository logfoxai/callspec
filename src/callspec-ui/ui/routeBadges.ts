import type {CallspecUiRoute} from '../types';
import {lockIcon, mcpIcon, unlockIcon} from './icons';

function routeBadge(
    className: string,
    icon: string,
    label?: string,
    ariaLabel?: string,
): string {

    const attrs = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
    const labelHtml = label
        ? `<span class="route-badge__label">${label}</span>`
        : '';

    return `
        <span class="route-badge ${className}"${attrs}>
            <span class="route-badge__icon" aria-hidden="true">${icon}</span>
            ${labelHtml}
        </span>
    `.trim();

}

export function renderRouteBadges(route: Pick<CallspecUiRoute, 'auth' | 'mcp'>): string {

    const authBadge = route.auth === 'bearer'
        ? routeBadge('route-badge--bearer', lockIcon(), 'Bearer')
        : routeBadge('route-badge--none', unlockIcon(), undefined, 'No authentication required');

    const mcpBadge = route.mcp
        ? routeBadge('route-badge--mcp', mcpIcon(), 'MCP')
        : '';

    return [authBadge, mcpBadge].filter(Boolean).join('');

}
