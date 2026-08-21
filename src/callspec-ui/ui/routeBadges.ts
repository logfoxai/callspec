import type {CallspecUiRoute} from '../types';
import {lockIcon, mcpIcon, unlockIcon} from './icons';
import {renderIconLabel} from './iconLabel';

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

    return renderIconLabel({
        icon,
        label,
        className: `route-badge ${className}`,
        ariaLabel,
    });

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
