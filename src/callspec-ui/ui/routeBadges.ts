import type {CallspecUiRoute} from '../types';
import {lockIcon, mcpIcon, unlockIcon} from './icons';

type RouteBadgeOptions = {
    /** Show text labels (Bearer, MCP). Default true. */
    labels?: boolean
};

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

export function renderRouteBadges(
    route: Pick<CallspecUiRoute, 'auth' | 'mcp'>,
    options: RouteBadgeOptions = {},
): string {

    const showLabels = options.labels !== false;

    const authBadge = route.auth === 'bearer'
        ? routeBadge(
            'route-badge--bearer',
            lockIcon(),
            showLabels ? 'Bearer' : undefined,
            showLabels ? undefined : 'Bearer authentication required',
        )
        : routeBadge(
            'route-badge--none',
            unlockIcon(),
            undefined,
            'No authentication required',
        );

    const mcpBadge = route.mcp
        ? routeBadge(
            'route-badge--mcp',
            mcpIcon(),
            showLabels ? 'MCP' : undefined,
            showLabels ? undefined : 'MCP tool',
        )
        : '';

    return [authBadge, mcpBadge].filter(Boolean).join('');

}
