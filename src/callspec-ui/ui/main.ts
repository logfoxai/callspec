import './styles.css';
import {applyUiThemeToDocument} from '../applyUiTheme';
import type {CallspecUiBranding, CallspecUiConfig} from '../branding';
import {
    applyRouteFilters,
    groupRoutesByTag,
    type AuthFilter,
    type RouteFilters,
} from '../filterRoutes';
import {callspecDocumentToUiSpec} from '../toUiSpec';
import type {CallspecUiRoute} from '../types';
import {CallspecDocumentError} from '../../callspecDocumentTypes';
import {parseUiCallspecDocument} from '../parseUiDocument';
import {codeBlock} from './highlight';
import {exampleFromSchema} from './exampleFromSchema';
import {bindSchemaPanels, renderRouteErrorsSection, renderSchemaExamplePanel} from './schemaPanel';
import {initJsonEditor, jsonEditorHtml} from './jsonEditor';
import {bindMcpConnect, renderMcpConnect} from './mcpConnect';
import {
    renderHeaderContractButtons,
    renderDocsSearchField,
    renderDocsThemeSlider,
    renderMcpOnlySlider,
    renderUiNotice,
    syncAllDocsThemeSliders,
} from './docsChrome';
import {initTheme, toggleTheme, type Theme} from './theme';
import {chevronLeftIcon, closeIcon, menuIcon, tagIcon} from './icons';
import {renderRouteBadges} from './routeBadges';
import {renderRoutePaginationFooter} from './routePagination';

type View =
    | {kind: 'home'}
    | {kind: 'routes'}
    | {kind: 'route', name: string};

declare global {
    interface Window {
        __CALLSPEC_UI__?: CallspecUiConfig
    }
}

const config: CallspecUiConfig = window.__CALLSPEC_UI__ ?? {
    specUrl: '../callspec.json',
    rpcBase: '..',
    mcpPath: '../mcp',
};

let theme: Theme = initTheme();

applyUiThemeToDocument(config.branding?.theme);

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

/** Home is always available; intro is an optional blurb only. */
function hasHomePage(): boolean {

    return true;

}

function displayName(title: string, branding: CallspecUiBranding | undefined): string {

    return branding?.name ?? title;

}

function websiteLabel(branding: CallspecUiBranding): string {

    if (branding.websiteLabel) return branding.websiteLabel;

    if (branding.websiteUrl) {

        try {

            return new URL(branding.websiteUrl).hostname.replace(/^www\./, '');

        } catch {

            return 'Learn more';

        }

    }

    return 'Learn more';

}

function renderBrandMark(
    branding: CallspecUiBranding | undefined,
    options: {wrapClass: string},
): string {

    if (!branding?.logoUrl) return '';

    const dark = branding.logoUrlDark ?? branding.logoUrl;
    const {wrapClass} = options;

    return `
        <span class="brand-mark ${wrapClass}">
            <img class="brand-mark-img brand-mark-light" src="${escapeHtml(branding.logoUrl)}" alt="">
            <img class="brand-mark-img brand-mark-dark" src="${escapeHtml(dark)}" alt="">
        </span>
    `;

}

function renderLetterMark(title: string, wrapClass: string): string {

    const letter = (title.trim()[0] ?? 'A').toUpperCase();

    return `<span class="brand-letter ${wrapClass}" aria-hidden="true">${escapeHtml(letter)}</span>`;

}

function renderLogo(title: string, branding: CallspecUiBranding | undefined): string {

    const mark = renderBrandMark(branding, {wrapClass: 'intro-logo'});

    if (mark) return mark;

    return renderLetterMark(displayName(title, branding), 'intro-logo');

}

function renderNavbarLinkItems(
    branding: CallspecUiBranding | undefined,
    linkClass: string,
): string {

    const links = branding?.navbarLinks;

    if (!links?.length) return '';

    return links.map((link) => {

        const external = link.external
            ? ' target="_blank" rel="noopener"'
            : '';

        return `<a class="${linkClass}" href="${escapeHtml(link.href)}"${external}>${escapeHtml(link.label)}</a>`;

    }).join('');

}

function renderNavbarLinks(branding: CallspecUiBranding | undefined): string {

    const items = renderNavbarLinkItems(branding, 'top-nav-link');

    if (!items) return '';

    return `<nav class="top-nav" aria-label="Product">${items}</nav>`;

}

function renderDrawerNavbarLinks(branding: CallspecUiBranding | undefined): string {

    const items = renderNavbarLinkItems(branding, 'drawer-nav-link');

    if (!items) return '';

    return `<nav class="drawer-nav" aria-label="Product">${items}</nav>`;

}

function renderTopHeader(
    title: string,
    branding: CallspecUiBranding | undefined,
    searchText: string,
    specUrl: string,
): string {

    const name = displayName(title, branding);

    return `
        <header class="top-header">
            <button type="button" class="nav-menu-btn" id="nav-menu-btn" aria-label="Open navigation" aria-expanded="false" aria-controls="nav-drawer">
                ${menuIcon()}
            </button>
            <button type="button" class="top-brand" data-view="home">
                ${renderBrandMark(branding, {wrapClass: 'top-mark'}) || renderLetterMark(name, 'top-mark')}
                <span class="top-brand-text">${escapeHtml(name)}</span>
            </button>
            ${renderDocsSearchField({
                id: 'header-search',
                value: searchText,
                className: 'cs-docs-search--header',
            })}
            ${renderNavbarLinks(branding)}
            <div class="top-header__end">
                ${renderHeaderContractButtons(specUrl)}
                ${renderDocsThemeSlider('theme-toggle')}
            </div>
        </header>
    `;

}

function uniqueTags(routes: CallspecUiRoute[]): string[] {

    const tags = new Set<string>();

    for (const route of routes) {

        for (const tag of route.tags.length ? route.tags : ['routes']) {

            tags.add(tag);

        }

    }

    return [...tags].sort((a, b) => a.localeCompare(b));

}

function parseAuthFilter(value: string | undefined): AuthFilter {

    if (value === 'none' || value === 'bearer' || value === 'all') {

        return value;

    }

    return 'all';

}

function viewFromHash(routes: CallspecUiRoute[], showHome: boolean): View {

    const raw = location.hash.replace(/^#\/?/, '');

    if (!raw || raw === '') {

        return showHome ? {kind: 'home'} : {kind: 'routes'};

    }

    if (raw === 'routes') {

        return {kind: 'routes'};

    }

    if (raw === 'mcp-connect' || raw.startsWith('mcp-connect')) {

        return showHome ? {kind: 'home'} : {kind: 'routes'};

    }

    const name = decodeURIComponent(raw.split('/')[0] ?? '');

    if (routes.some((route) => route.name === name)) {

        return {kind: 'route', name};

    }

    return showHome ? {kind: 'home'} : {kind: 'routes'};

}

function setViewHash(view: View): void {

    let next = '#/';

    if (view.kind === 'routes') {

        next = '#/routes';

    } else if (view.kind === 'route') {

        next = `#/${encodeURIComponent(view.name)}`;

    }

    if (location.hash !== next) {

        location.hash = next;

    }

}

const SIDEBAR_CARET_SVG = `
    <svg class="sidebar-caret" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="m14.83 11.29-4.24-4.24a1 1 0 1 0-1.42 1.41L12.71 12l-3.54 3.54a1 1 0 0 0 0 1.41 1 1 0 0 0 .71.29 1 1 0 0 0 .71-.29l4.24-4.24a1.002 1.002 0 0 0 0-1.42Z"/>
    </svg>
`.trim();

const SIDEBAR_TAG_ICON = `<span class="sidebar-group-icon">${tagIcon()}</span>`;

function renderSidebarLink(
    label: string,
    active: boolean,
    attrs: Record<string, string>,
    options: {mono?: boolean, top?: boolean, badges?: string} = {},
): string {

    const attrStr = Object.entries(attrs)
        .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
        .join('');
    const monoClass = options.mono ? ' sidebar-link--mono' : '';
    const topClass = options.top ? ' sidebar-link--top' : '';
    const content = options.badges
        ? `
            <span class="sidebar-link__inner">
                <span class="sidebar-link__label">${escapeHtml(label)}</span>
                <span class="sidebar-link__badges">${options.badges}</span>
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

function renderSidebar(
    routes: CallspecUiRoute[],
    view: View,
    showHome: boolean,
): string {

    const groups = groupRoutesByTag(routes);
    let topLinks = '';

    if (showHome) {

        topLinks += renderSidebarLink('Home', view.kind === 'home', {'data-view': 'home'}, {top: true});

    }

    topLinks += renderSidebarLink('Routes', view.kind === 'routes', {'data-view': 'routes'}, {top: true});

    let groupHtml = '';

    for (const [tag, list] of groups) {

        let routeLinks = '';

        for (const route of list) {

            const active = view.kind === 'route' && route.name === view.name;

            routeLinks += renderSidebarLink(route.name, active, {'data-route': route.name}, {
                badges: renderRouteBadges(route, {labels: false}),
            });

        }

        groupHtml += `
            <li class="sidebar-group">
                <details open>
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

    if (!topLinks && !groupHtml) {

        return '<div class="empty-state"><p>No routes</p></div>';

    }

    return `
        <nav class="sidebar-nav" aria-label="Sidebar">
            <ul class="sidebar-top-level">${topLinks}${groupHtml}</ul>
        </nav>
    `;

}

function renderSdkInstall(branding: CallspecUiBranding): string {

    const cmd = branding.sdkInstall?.trim();

    if (!cmd) return '';

    return `
        <div class="sdk-install">
            <span class="sdk-install-label">Install SDK</span>
            <div class="sdk-install-field">
                <code class="sdk-install-cmd">${escapeHtml(cmd)}</code>
                <button type="button" class="sdk-install-copy" data-copy="${escapeHtml(cmd)}" aria-label="Copy install command">Copy</button>
            </div>
        </div>
    `;

}

function renderHome(
    title: string,
    version: string,
    routes: CallspecUiRoute[],
    branding: CallspecUiBranding,
): string {

    const name = displayName(title, branding);
    const mcpCount = routes.filter((route) => route.mcp).length;
    const website = branding.websiteUrl
        ? `<a class="intro-link" href="${escapeHtml(branding.websiteUrl)}" target="_blank" rel="noopener">${escapeHtml(websiteLabel(branding))} ↗</a>`
        : '';

    const intro = branding.intro?.trim()
        ? `<p class="intro-text">${escapeHtml(branding.intro)}</p>`
        : '';

    return `
        <div class="intro">
            ${renderLogo(title, branding)}
            <h1 class="intro-title">${escapeHtml(name)}</h1>
            <p class="intro-version">v${escapeHtml(version)} · ${routes.length} routes${mcpCount ? ` · ${mcpCount} MCP tools` : ''}</p>
            ${intro}
            ${renderSdkInstall(branding)}
            <div class="intro-actions">
                <button type="button" class="btn btn-primary" data-view="routes">Browse API →</button>
                ${website}
            </div>
            ${renderMcpConnect(config, routes, name)}
        </div>
    `;

}

function renderOverview(
    filtered: CallspecUiRoute[],
    allRoutes: CallspecUiRoute[],
    filters: RouteFilters,
    showHome: boolean,
): string {

    const tags = uniqueTags(allRoutes);
    const groups = groupRoutesByTag(filtered);
    let groupsHtml = '';

    for (const [tag, list] of groups) {

        let cards = '';

        for (const route of list) {

            cards += `
                <button type="button" class="route-card" data-route="${escapeHtml(route.name)}">
                    <div class="route-card-head">
                        <span class="method">POST</span>
                        <span class="route-card-name">${escapeHtml(route.name)}</span>
                        <span class="route-card-badges">${renderRouteBadges(route)}</span>
                    </div>
                    <p class="route-card-summary">${escapeHtml(route.summary)}</p>
                </button>
            `;

        }

        groupsHtml += `
            <section class="overview-group">
                <h3 class="overview-group-title">${escapeHtml(tag)}</h3>
                <div class="route-cards">${cards}</div>
            </section>
        `;

    }

    const tagPills = tags.map((tag) => {

        const active = filters.tag === tag ? ' active' : '';

        return `<button type="button" class="filter-pill${active}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;

    }).join('');

    const breadcrumb = showHome
        ? `<nav class="breadcrumb">${backLink('Home', 'data-view="home"')}</nav>`
        : '';

    return `
        ${breadcrumb}
        <div class="overview">
            <div class="overview-head">
                <h2 class="overview-title">Routes</h2>
                <p class="overview-count">${filtered.length} of ${allRoutes.length}</p>
            </div>
            <div class="filters">
                <div class="filter-row">
                    <span class="filter-label">Auth</span>
                    <div class="filter-pills">
                        <button type="button" class="filter-pill${filters.auth === 'all' ? ' active' : ''}" data-auth="all">All</button>
                        <button type="button" class="filter-pill${filters.auth === 'none' ? ' active' : ''}" data-auth="none">none</button>
                        <button type="button" class="filter-pill${filters.auth === 'bearer' ? ' active' : ''}" data-auth="bearer">bearer</button>
                    </div>
                </div>
                <div class="filter-row">
                    <span class="filter-label">Tag</span>
                    <div class="filter-pills">
                        <button type="button" class="filter-pill${filters.tag === null ? ' active' : ''}" data-tag="">All</button>
                        ${tagPills}
                    </div>
                </div>
                <div class="filter-row filter-row--mcp">
                    <span class="filter-label">MCP</span>
                    <div class="filter-mcp-toggle">
                        ${renderMcpOnlySlider('mcp-only', filters.mcpOnly)}
                        <span class="filter-mcp-toggle__label">MCP only</span>
                    </div>
                </div>
            </div>
            ${groupsHtml || '<div class="empty-state"><p>No routes match these filters</p></div>'}
        </div>
    `;

}

function renderErrors(route: CallspecUiRoute): string {

    return renderRouteErrorsSection(route);

}

function backLink(label: string, attrs: string): string {

    return `
        <button type="button" class="breadcrumb-link" ${attrs}>
            <span class="breadcrumb-link__icon" aria-hidden="true">${chevronLeftIcon()}</span>
            <span class="breadcrumb-link__label">${escapeHtml(label)}</span>
        </button>
    `;

}

function renderRoute(
    route: CallspecUiRoute,
    bodyJson: string,
    allRoutes: CallspecUiRoute[],
    authToken: string,
): string {

    return `
        <div class="route-page">
            <div class="route-page__content">
                <nav class="breadcrumb">
                    ${backLink('All routes', 'data-view="routes"')}
                </nav>
                <div class="route-endpoint">
                    <span class="method">POST</span>
                    <h2 class="route-name">${escapeHtml(route.name)}</h2>
                    <div class="badges">${renderRouteBadges(route)}</div>
                </div>
                <p class="route-summary">${escapeHtml(route.summary)}</p>
                ${route.description ? `<p class="route-desc">${escapeHtml(route.description)}</p>` : '<div class="route-desc"></div>'}
                <div class="route-docs">
                    ${renderSchemaExamplePanel({
                        panelId: 'request',
                        title: 'Request',
                        schema: route.inputSchema,
                    })}
                    ${renderSchemaExamplePanel({
                        panelId: 'response',
                        title: 'Response',
                        schema: route.outputSchema,
                    })}
                    ${renderErrors(route)}
                </div>
                ${renderRoutePaginationFooter(route.name, allRoutes)}
            </div>
            <aside class="route-try" aria-label="Try it">
                <div class="section try-section">
                    <h3 class="section-title">Try it</h3>
                    <div class="try-block">
                        ${route.auth === 'bearer' ? `
                        <div class="field">
                            <label for="auth">Authorization</label>
                            <input id="auth" type="text" placeholder="Bearer token" autocomplete="off" spellcheck="false" value="${escapeHtml(authToken)}">
                        </div>
                        ` : ''}
                        <div class="field">
                            <label for="body">Body</label>
                            ${jsonEditorHtml('body', bodyJson)}
                        </div>
                        <div class="actions">
                            <button type="button" class="btn btn-primary" id="send">Send</button>
                            <button type="button" class="btn btn-ghost" id="copy-curl-try">Copy curl</button>
                        </div>
                        <div class="response" id="response"></div>
                    </div>
                </div>
            </aside>
        </div>
    `;

}

async function sendRequest(route: CallspecUiRoute): Promise<void> {

    const bodyEl = document.getElementById('body');
    const authEl = document.getElementById('auth');
    const responseEl = document.getElementById('response');

    if (!(bodyEl instanceof HTMLTextAreaElement) || !responseEl) return;

    const rpcBase = config.rpcBase.replace(/\/$/, '');
    const url = `${rpcBase}/${route.name}`.replace(/\/{2,}/g, '/');
    const headers: Record<string, string> = {'Content-Type': 'application/json'};

    if (authEl instanceof HTMLInputElement && authEl.value.trim()) {

        headers.Authorization = authEl.value.trim();

    }

    let body: string;

    try {

        body = JSON.stringify(JSON.parse(bodyEl.value));

    } catch {

        responseEl.innerHTML = '<div class="error-banner">Invalid JSON</div>';
        return;

    }

    responseEl.innerHTML = '<p class="response-meta">Sending…</p>';

    try {

        const started = performance.now();
        const resp = await fetch(url, {method: 'POST', headers, body});
        const elapsed = Math.round(performance.now() - started);
        const text = await resp.text();
        let formatted = text;

        try {

            formatted = JSON.stringify(JSON.parse(text), null, 2);

        } catch {

            // keep raw

        }

        const statusClass = resp.ok ? 'ok' : 'err';

        responseEl.innerHTML = `
            <div class="response-meta ${statusClass}">${resp.status} · ${elapsed}ms</div>
            ${codeBlock(formatted || '(empty)')}
        `;

    } catch (err) {

        responseEl.innerHTML = `<div class="error-banner">${escapeHtml(String(err))}</div>`;

    }

}

function copyCurl(route: CallspecUiRoute): void {

    const bodyEl = document.getElementById('body');
    const authEl = document.getElementById('auth');
    const rpcBase = config.rpcBase.replace(/\/$/, '');
    const url = new URL(`${rpcBase}/${route.name}`.replace(/\/{2,}/g, '/'), window.location.href).href;
    const body = bodyEl instanceof HTMLTextAreaElement ? bodyEl.value : '{}';
    let cmd = `curl -X POST '${url}' \\\n  -H 'Content-Type: application/json'`;

    if (authEl instanceof HTMLInputElement && authEl.value.trim()) {

        cmd += ` \\\n  -H 'Authorization: ${authEl.value.trim()}'`;

    }

    cmd += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`;

    void navigator.clipboard.writeText(cmd);

}

function focusableIn(root: HTMLElement): HTMLElement[] {

    return [...root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

}

function bindCopyButtons(root: ParentNode): void {

    root.querySelectorAll('[data-copy]').forEach((btn) => {

        btn.addEventListener('click', () => {

            if (!(btn instanceof HTMLElement)) return;

            const value = btn.dataset.copy;

            if (value) void navigator.clipboard.writeText(value);

        });

    });

}

async function boot(): Promise<void> {

    const app = document.getElementById('app');

    if (!app) return;

    try {

        const resp = await fetch(config.specUrl);

        if (!resp.ok) throw new Error(`Could not load spec (${resp.status})`);

        const doc: unknown = await resp.json();
        const parsed = parseUiCallspecDocument(doc);
        const title = config.title ?? parsed.info.title;
        const version = parsed.info.version;
        const branding = config.branding ?? {};
        const showHome = hasHomePage();
        const routes = callspecDocumentToUiSpec(parsed).routes;

        let view: View = viewFromHash(routes, showHome);
        let filters: RouteFilters = {
            text: '',
            auth: 'all',
            tag: null,
            mcpOnly: false,
        };
        let navOpen = false;
        let drawerCleanup: (() => void) | null = null;
        let authToken = '';
        const bodies = new Map<string, string>();

        for (const route of routes) {

            bodies.set(route.name, JSON.stringify(exampleFromSchema(route.inputSchema), null, 2));

        }

        const persistRouteDraft = (): void => {

            const bodyEl = document.getElementById('body');

            if (view.kind === 'route' && bodyEl instanceof HTMLTextAreaElement) {

                bodies.set(view.name, bodyEl.value);

            }

            const authEl = document.getElementById('auth');

            if (authEl instanceof HTMLInputElement) {

                authToken = authEl.value;

            }

        };

        const closeNav = (): void => {

            navOpen = false;
            drawerCleanup?.();
            drawerCleanup = null;
            const drawer = document.getElementById('nav-drawer');

            drawer?.classList.remove('open');
            drawer?.removeAttribute('role');
            drawer?.removeAttribute('aria-modal');
            document.getElementById('nav-overlay')?.classList.remove('open');
            document.body.classList.remove('nav-open');
            const menuBtn = document.getElementById('nav-menu-btn');

            if (menuBtn instanceof HTMLButtonElement) {

                menuBtn.setAttribute('aria-expanded', 'false');
                menuBtn.setAttribute('aria-label', 'Open navigation');

            }

        };

        const trapFocus = (drawer: HTMLElement): (() => void) => {

            const onKeyDown = (event: KeyboardEvent): void => {

                if (event.key === 'Escape') {

                    event.preventDefault();
                    closeNav();
                    document.getElementById('nav-menu-btn')?.focus();
                    return;

                }

                if (event.key !== 'Tab') return;

                const focusable = focusableIn(drawer);

                if (!focusable.length) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (!first || !last) return;

                if (event.shiftKey && document.activeElement === first) {

                    event.preventDefault();
                    last.focus();

                } else if (!event.shiftKey && document.activeElement === last) {

                    event.preventDefault();
                    first.focus();

                }

            };

            document.addEventListener('keydown', onKeyDown);

            const focusable = focusableIn(drawer);

            (focusable[0] ?? drawer).focus();

            return () => document.removeEventListener('keydown', onKeyDown);

        };

        const openNav = (): void => {

            navOpen = true;
            const drawer = document.getElementById('nav-drawer');
            const overlay = document.getElementById('nav-overlay');
            const menuBtn = document.getElementById('nav-menu-btn');

            drawer?.classList.add('open');
            overlay?.classList.add('open');
            document.body.classList.add('nav-open');

            if (drawer) {

                drawer.setAttribute('role', 'dialog');
                drawer.setAttribute('aria-modal', 'true');

            }

            if (menuBtn instanceof HTMLButtonElement) {

                menuBtn.setAttribute('aria-expanded', 'true');
                menuBtn.setAttribute('aria-label', 'Close navigation');

            }

            if (drawer) {

                drawerCleanup = trapFocus(drawer);

            }

        };

        const navigate = (next: View): void => {

            persistRouteDraft();
            view = next;
            setViewHash(next);
            closeNav();
            render();

            if (location.hash.includes('mcp-connect')) {

                queueMicrotask(() => {

                    document.getElementById('mcp-connect')?.scrollIntoView({behavior: 'smooth'});

                });

            }

        };

        const render = (): void => {

            drawerCleanup?.();
            drawerCleanup = null;

            const textFiltered = applyRouteFilters(routes, {
                text: filters.text,
                auth: 'all',
                tag: null,
                mcpOnly: false,
            });
            const filtered = applyRouteFilters(routes, filters);
            const sidebarRoutes = textFiltered;
            const hasNotice = Boolean(branding?.notice?.message);

            app.className = hasNotice ? 'has-notice' : '';
            app.innerHTML = `
                ${renderUiNotice(branding?.notice)}
                ${renderTopHeader(title, branding, filters.text, config.specUrl)}
                <div class="nav-overlay" id="nav-overlay"></div>
                <aside class="sidebar" id="nav-drawer" aria-label="API navigation" tabindex="-1">
                    <div class="sidebar-drawer-chrome">
                        <div class="sidebar-drawer-head">
                            <p class="sidebar-meta">v${escapeHtml(version)} · ${routes.length} routes</p>
                            <button type="button" class="nav-close-btn" id="nav-close-btn" aria-label="Close navigation">
                                ${closeIcon()}
                            </button>
                        </div>
                        ${renderDocsSearchField({
                            id: 'drawer-search',
                            value: filters.text,
                            className: 'cs-docs-search--drawer',
                        })}
                        ${renderHeaderContractButtons(config.specUrl, {variant: 'drawer'})}
                        <div class="drawer-theme">
                            ${renderDocsThemeSlider('theme-toggle-drawer')}
                            <span class="drawer-theme-label">Theme</span>
                        </div>
                        ${renderDrawerNavbarLinks(branding)}
                    </div>
                    <div class="sidebar-scroll">${renderSidebar(sidebarRoutes, view, showHome)}</div>
                </aside>
                <div class="content">
                    <main class="main" id="main"></main>
                </div>
            `;

            const main = document.getElementById('main');

            if (main && view.kind === 'home') {

                main.innerHTML = renderHome(title, version, routes, branding);
                bindMcpConnect(main);
                bindCopyButtons(main);
                main.querySelector('[data-mcp-routes]')?.addEventListener('click', () => {

                    filters = {...filters, mcpOnly: true};
                    navigate({kind: 'routes'});

                });

                if (location.hash.includes('mcp-connect')) {

                    queueMicrotask(() => {

                        document.getElementById('mcp-connect')?.scrollIntoView({behavior: 'smooth'});

                    });

                }

            } else if (main && view.kind === 'routes') {

                main.innerHTML = renderOverview(filtered, routes, filters, showHome);
                bindOverviewFilters(main);

            } else if (main && view.kind === 'route') {

                const route = routes.find((item) => item.name === view.name);

                if (route) {

                    main.innerHTML = renderRoute(
                        route,
                        bodies.get(route.name) ?? '{}',
                        routes,
                        authToken,
                    );

                    document.getElementById('send')?.addEventListener('click', () => {

                        void sendRequest(route);

                    });

                    const onCopyCurl = (): void => copyCurl(route);

                    document.getElementById('copy-curl-try')?.addEventListener('click', onCopyCurl);

                    initJsonEditor('body');
                    bindSchemaPanels(main);

                } else {

                    navigate(showHome ? {kind: 'home'} : {kind: 'routes'});

                }

            }

            const onThemeClick = (): void => {

                theme = toggleTheme(theme);
                syncAllDocsThemeSliders(theme);

            };

            document.getElementById('theme-toggle')?.addEventListener('click', onThemeClick);
            document.getElementById('theme-toggle-drawer')?.addEventListener('click', onThemeClick);
            syncAllDocsThemeSliders(theme);

            const bindSearchInput = (id: string): void => {

                const input = document.getElementById(id);

                if (!(input instanceof HTMLInputElement)) return;

                input.addEventListener('input', () => {

                    persistRouteDraft();
                    filters = {...filters, text: input.value};
                    render();
                    const restored = document.getElementById(id);

                    if (restored instanceof HTMLInputElement) {

                        restored.focus();
                        const len = restored.value.length;
                        restored.setSelectionRange(len, len);

                    }

                });

            };

            bindSearchInput('header-search');
            bindSearchInput('drawer-search');

            document.getElementById('nav-menu-btn')?.addEventListener('click', () => {

                if (navOpen) closeNav();
                else openNav();

            });

            document.getElementById('nav-close-btn')?.addEventListener('click', closeNav);
            document.getElementById('nav-overlay')?.addEventListener('click', closeNav);

            if (navOpen) openNav();

            app.querySelectorAll('[data-view]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    if (!(btn instanceof HTMLElement)) return;

                    const target = btn.dataset.view;

                    if (target === 'home') navigate({kind: 'home'});
                    else if (target === 'routes') navigate({kind: 'routes'});

                });

            });

            app.querySelectorAll('[data-route]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    if (!(btn instanceof HTMLElement)) return;

                    navigate({kind: 'route', name: btn.dataset.route ?? ''});

                });

            });

        };

        const bindOverviewFilters = (main: HTMLElement): void => {

            main.querySelectorAll('[data-auth]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    if (!(btn instanceof HTMLElement)) return;

                    filters = {
                        ...filters,
                        auth: parseAuthFilter(btn.dataset.auth),
                    };
                    render();

                });

            });

            main.querySelectorAll('[data-tag]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    if (!(btn instanceof HTMLElement)) return;

                    const tag = btn.dataset.tag ?? '';

                    filters = {...filters, tag: tag || null};
                    render();

                });

            });

            main.querySelector('#mcp-only')?.addEventListener('click', () => {

                filters = {...filters, mcpOnly: !filters.mcpOnly};
                render();

            });

        };

        window.addEventListener('hashchange', () => {

            view = viewFromHash(routes, showHome);
            render();

            if (location.hash.includes('mcp-connect')) {

                queueMicrotask(() => {

                    document.getElementById('mcp-connect')?.scrollIntoView({behavior: 'smooth'});

                });

            }

        });

        window.addEventListener('keydown', (event) => {

            if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;

            const active = document.activeElement;

            if (
                active instanceof HTMLInputElement
                || active instanceof HTMLTextAreaElement
                || (active instanceof HTMLElement && active.isContentEditable)
            ) {

                return;

            }

            event.preventDefault();
            const input = document.getElementById('header-search');

            if (input instanceof HTMLInputElement) {

                input.focus();
                input.select();

            }

        });

        render();

    } catch (err) {

        app.className = 'loading';
        const message = err instanceof CallspecDocumentError
            ? err.message
            : String(err);

        app.innerHTML = `<div class="error-banner">${escapeHtml(message)}</div>`;

    }

}

void boot();
