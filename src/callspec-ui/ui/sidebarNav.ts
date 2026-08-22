import {groupRoutesByTag} from '../filterRoutes';
import type {CallspecUiRoute} from '../types';
import {homeIcon, routesIcon, tagIcon} from './icons';
import {renderRouteBadges} from './routeBadges';

export type SidebarView =
    | {kind: 'home'}
    | {kind: 'routes'}
    | {kind: 'route', name: string};

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

const SIDEBAR_CARET_SVG = `
    <svg class="sidebar-caret" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="m14.83 11.29-4.24-4.24a1 1 0 1 0-1.42 1.41L12.71 12l-3.54 3.54a1 1 0 0 0 0 1.41 1 1 0 0 0 .71.29 1 1 0 0 0 .71-.29l4.24-4.24a1.002 1.002 0 0 0 0-1.42Z"/>
    </svg>
`.trim();

const SIDEBAR_TAG_ICON = `<span class="sidebar-group-icon">${tagIcon()}</span>`;

export type SidebarGroupsRenderOptions = {
    /** When true, every tag group is expanded (sidebar route search). */
    expandAll?: boolean
    /** User-expanded groups preserved across re-renders. */
    openTags?: ReadonlySet<string>
}

function sidebarGroupShouldOpen(
    tag: string,
    routes: CallspecUiRoute[],
    view: SidebarView,
    options: SidebarGroupsRenderOptions,
): boolean {

    if (options.expandAll) {

        return true;

    }

    if (options.openTags?.has(tag)) {

        return true;

    }

    return view.kind === 'route' && routes.some((route) => route.name === view.name);

}

/** Preserve user-expanded tag groups across sidebar re-renders. */
function readOpenSidebarTags(root: ParentNode): Set<string> {

    const open = new Set<string>();

    root.querySelectorAll('.sidebar-group details[open]').forEach((details) => {

        const label = details.querySelector('.sidebar-group-label')?.textContent?.trim();

        if (label) {

            open.add(label);

        }

    });

    return open;

}

/** Collapsed by default; expand all while searching; else preserve DOM or active route. */
export function sidebarRouteGroupsOptions(
    view: SidebarView,
    searchText: string,
    prevNav: ParentNode | null,
): SidebarGroupsRenderOptions {

    if (searchText.trim().length > 0) {

        return {expandAll: true};

    }

    return {
        openTags: prevNav ? readOpenSidebarTags(prevNav) : undefined,
    };

}

function renderSidebarLink(
    label: string,
    active: boolean,
    attrs: Record<string, string>,
    options: {mono?: boolean, top?: boolean, badges?: string, icon?: string} = {},
): string {

    const attrStr = Object.entries(attrs)
        .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
        .join('');
    const monoClass = options.mono ? ' sidebar-link--mono' : '';
    const topClass = options.top ? ' sidebar-link--top' : '';
    const iconHtml = options.icon
        ? `<span class="sidebar-link__icon">${options.icon}</span>`
        : '';
    const badgesHtml = options.badges
        ? `<span class="sidebar-link__badges">${options.badges}</span>`
        : '';
    const content = iconHtml || badgesHtml
        ? `
            <span class="sidebar-link__inner">
                ${iconHtml}
                <span class="sidebar-link__label">${escapeHtml(label)}</span>
                ${badgesHtml}
            </span>
        `.trim()
        : escapeHtml(label);

    return `
        <li>
            <button type="button" class="sidebar-link${active ? ' sidebar-link--active' : ''}${monoClass}${topClass}"${attrStr}>
                ${content}
            </button>
        </li>
    `;

}

/** Tag groups only — search can swap this without remounting the search field. */
export function renderSidebarRouteGroups(
    routes: CallspecUiRoute[],
    view: SidebarView,
    options: SidebarGroupsRenderOptions = {},
): string {

    const groups = groupRoutesByTag(routes);
    let groupHtml = '';

    for (const [tag, list] of groups) {

        let routeLinks = '';

        for (const route of list) {

            const active = view.kind === 'route' && route.name === view.name;

            routeLinks += renderSidebarLink(route.name, active, {'data-route': route.name}, {
                badges: renderRouteBadges(route, {labels: false}),
            });

        }

        const openAttr = sidebarGroupShouldOpen(tag, list, view, options) ? ' open' : '';

        groupHtml += `
            <li class="sidebar-group">
                <details${openAttr}>
                    <summary>
                        <span class="sidebar-group-heading">
                            ${SIDEBAR_TAG_ICON}
                            <span class="sidebar-group-label">${escapeHtml(tag)}</span>
                        </span>
                        ${SIDEBAR_CARET_SVG}
                    </summary>
                    <ul class="sidebar-group-list">${routeLinks}</ul>
                </details>
            </li>
        `;

    }

    return groupHtml
        ? `<ul class="sidebar-top-level">${groupHtml}</ul>`
        : '';

}

export function renderSidebar(
    routes: CallspecUiRoute[],
    view: SidebarView,
    showHome: boolean,
    searchHtml = '',
    groupOptions: SidebarGroupsRenderOptions = {},
): string {

    let pageLinks = '';

    if (showHome) {

        pageLinks += renderSidebarLink('Home', view.kind === 'home', {'data-view': 'home'}, {
            top: true,
            icon: homeIcon(),
        });

    }

    pageLinks += renderSidebarLink('Routes', view.kind === 'routes', {'data-view': 'routes'}, {
        top: true,
        icon: routesIcon(),
    });

    const groupsHtml = renderSidebarRouteGroups(routes, view, groupOptions);

    if (!pageLinks && !groupsHtml) {

        return '<div class="empty-state"><p>No routes</p></div>';

    }

    const pageLinksHtml = pageLinks
        ? `<ul class="sidebar-page-links">${pageLinks}</ul>`
        : '';
    const search = searchHtml
        ? `<div class="sidebar-search">${searchHtml}</div>`
        : '';
    return `
        <nav class="sidebar-nav" aria-label="Sidebar">
            ${pageLinksHtml}
            ${search}
            ${groupsHtml}
        </nav>
    `;

}
