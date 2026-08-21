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
import {showCopySuccess, tryCopyText} from '../../components/codeBlockTitles';
import {codeBlock} from './highlight';
import {exampleFromSchema} from './exampleFromSchema';
import {initJsonEditor} from './jsonEditor';
import {bindMcpConnect, renderMcpConnect} from './mcpConnect';
import {renderTryItPanel} from './tryItPanel';
import {
    renderDocsMenuButton,
    renderHeaderContractButtons,
    renderDocsSearchField,
    renderDocsThemeSlider,
    renderMcpOnlySlider,
    renderMobileMenuTools,
    renderUiNotice,
    syncAllDocsThemeSliders,
} from './docsChrome';
import {initTheme, toggleTheme, type Theme} from './theme';
import {lockIcon, tagIcon, unlockIcon} from './icons';
import {renderIconLabel} from './iconLabel';
import {renderRouteBadges} from './routeBadges';
import {renderSidebar} from './sidebarNav';
import {renderRouteHeader, renderRouteLead} from './routeHeader';
import {renderRoutePaginationFooter} from './routePagination';
import {readScrollTop, writeScrollTop} from './preserveScrollTop';
import {parkPoweredByFooter, placePoweredByFooter} from './poweredByFooter';
import {callspecDocumentTitle} from '../documentTitle';

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
    specUrl: string,
): string {

    const name = displayName(title, branding);

    return `
        <header class="top-header">
            <button type="button" class="top-brand" data-view="home">
                ${renderBrandMark(branding, {wrapClass: 'top-mark'}) || renderLetterMark(name, 'top-mark')}
                <span class="top-brand-text">${escapeHtml(name)}</span>
            </button>
            ${renderNavbarLinks(branding)}
            <div class="top-header__end">
                ${renderHeaderContractButtons(specUrl)}
                ${renderDocsThemeSlider('theme-toggle')}
                ${renderDocsMenuButton()}
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

        return `
            <button type="button" class="filter-pill filter-pill--tag${active}" data-tag="${escapeHtml(tag)}">
                ${renderIconLabel({icon: tagIcon(), label: tag})}
            </button>
        `;

    }).join('');

    return `
        <div class="overview">
            <div class="overview-title-panel">
                <div class="overview-head">
                    <h1 class="overview-title">Routes</h1>
                    <p class="overview-count">${filtered.length} of ${allRoutes.length}</p>
                </div>
            </div>
            <div class="filters">
                <div class="filter-row">
                    <span class="filter-label">Auth</span>
                    <div class="filter-pills">
                        <button type="button" class="filter-pill${filters.auth === 'all' ? ' active' : ''}" data-auth="all">All</button>
                        <button type="button" class="filter-pill filter-pill--auth${filters.auth === 'none' ? ' active' : ''}" data-auth="none">
                            ${renderIconLabel({icon: unlockIcon(), label: 'None', className: 'icon-label--none'})}
                        </button>
                        <button type="button" class="filter-pill filter-pill--auth${filters.auth === 'bearer' ? ' active' : ''}" data-auth="bearer">
                            ${renderIconLabel({icon: lockIcon(), label: 'Bearer', className: 'icon-label--bearer'})}
                        </button>
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
                    <span class="filter-label">MCP only</span>
                    ${renderMcpOnlySlider('mcp-only', filters.mcpOnly)}
                </div>
            </div>
            ${groupsHtml || '<div class="empty-state"><p>No routes match these filters</p></div>'}
        </div>
    `;

}

type RoutePanels = Pick<
    typeof import('./schemaPanel'),
    'bindSchemaPanels' | 'renderRouteErrorsSection' | 'renderSchemaExamplePanel'
>;

function loadRoutePanels(): Promise<typeof import('./schemaPanel')> {

    return import('./schemaPanel');

}

const demoMode = config.demoMode === true;

function renderRoute(
    route: CallspecUiRoute,
    bodyJson: string,
    allRoutes: CallspecUiRoute[],
    authToken: string,
    panels: RoutePanels,
): string {

    return `
        <div class="route-page">
            <div class="route-page__title">
                ${renderRouteHeader(route)}
            </div>
            <div class="route-page__body">
                <div class="route-page__content">
                    ${renderRouteLead(route)}
                    <div class="route-docs">
                        ${panels.renderSchemaExamplePanel({
                            panelId: 'request',
                            title: 'Request',
                            schema: route.inputSchema,
                        })}
                        ${panels.renderSchemaExamplePanel({
                            panelId: 'response',
                            title: 'Response',
                            schema: route.outputSchema,
                        })}
                        ${panels.renderRouteErrorsSection(route)}
                    </div>
                    ${renderRoutePaginationFooter(route.name, allRoutes)}
                </div>
                ${renderTryItPanel({
                    route,
                    bodyJson,
                    authToken,
                    demoMode,
                })}
            </div>
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

    const copyBtn = document.getElementById('copy-curl-try');

    void tryCopyText(cmd).then((ok) => {

        if (ok && copyBtn instanceof HTMLButtonElement) {

            showCopySuccess(copyBtn);

        }

    });

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

        document.title = callspecDocumentTitle(title);
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
            document.body.classList.remove('nav-open');
            document.body.removeAttribute('data-mobile-menu-expanded');
            document.querySelector('.content')?.removeAttribute('inert');
            const menuBtn = document.getElementById('nav-menu-btn');

            if (menuBtn instanceof HTMLButtonElement) {

                menuBtn.setAttribute('aria-expanded', 'false');
                menuBtn.setAttribute('aria-label', 'Menu');

            }

        };

        const bindOpenNavChrome = (): (() => void) => {

            const onKeyDown = (event: KeyboardEvent): void => {

                if (event.key !== 'Escape') return;

                event.preventDefault();
                closeNav();
                document.getElementById('nav-menu-btn')?.focus();

            };

            document.addEventListener('keydown', onKeyDown);
            document.querySelector('.content')?.setAttribute('inert', '');

            return () => document.removeEventListener('keydown', onKeyDown);

        };

        const openNav = (): void => {

            navOpen = true;
            const drawer = document.getElementById('nav-drawer');
            const menuBtn = document.getElementById('nav-menu-btn');

            drawer?.classList.add('open');
            document.body.classList.add('nav-open');
            document.body.setAttribute('data-mobile-menu-expanded', '');

            if (drawer) {

                drawer.setAttribute('role', 'dialog');
                drawer.setAttribute('aria-modal', 'true');

            }

            if (menuBtn instanceof HTMLButtonElement) {

                menuBtn.setAttribute('aria-expanded', 'true');
                menuBtn.setAttribute('aria-label', 'Close');

            }

            drawerCleanup = bindOpenNavChrome();

        };

        let renderGen = 0;

        const navigate = (next: View): void => {

            persistRouteDraft();
            view = next;
            setViewHash(next);
            closeNav();
            void render();

            if (location.hash.includes('mcp-connect')) {

                queueMicrotask(() => {

                    document.getElementById('mcp-connect')?.scrollIntoView({behavior: 'smooth'});

                });

            }

        };

        const render = async (): Promise<void> => {

            const gen = ++renderGen;

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
            // Full-app innerHTML rebuild wipes scroll — keep sidebar place in memory.
            const prevSidebar = app.querySelector('.sidebar-scroll');
            const sidebarScroll = prevSidebar instanceof HTMLElement
                ? readScrollTop(prevSidebar)
                : 0;

            // Footer lives in .content; park it on <body> so the wipe doesn't destroy it.
            parkPoweredByFooter();

            app.className = hasNotice ? 'has-notice' : '';
            app.innerHTML = `
                ${renderUiNotice(branding?.notice)}
                ${renderTopHeader(title, branding, config.specUrl)}
                <aside class="sidebar" id="nav-drawer" aria-label="API navigation" tabindex="-1">
                    <div class="sidebar-scroll">
                        <p class="sidebar-meta sidebar-meta--mobile">v${escapeHtml(version)} · ${routes.length} routes</p>
                        ${renderSidebar(sidebarRoutes, view, showHome, renderDocsSearchField({
                            id: 'sidebar-search',
                            value: filters.text,
                            className: 'cs-docs-search--sidebar',
                        }))}
                    </div>
                    ${renderMobileMenuTools({
                        leadingHtml: renderHeaderContractButtons(config.specUrl, {variant: 'drawer'}),
                        themeSliderId: 'theme-toggle-drawer',
                        navLinksHtml: renderDrawerNavbarLinks(branding),
                    })}
                </aside>
                <div class="content">
                    <main class="main" id="main"></main>
                </div>
            `;

            const nextSidebar = app.querySelector('.sidebar-scroll');
            if (nextSidebar instanceof HTMLElement) writeScrollTop(nextSidebar, sidebarScroll);

            placePoweredByFooter(app, branding.footer?.poweredBy);

            const main = document.getElementById('main');
            const currentView = view;

            if (main) {

                if (currentView.kind === 'home') {

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

                } else if (currentView.kind === 'routes') {

                    main.innerHTML = renderOverview(filtered, routes, filters);
                    bindOverviewFilters(main);

                } else {

                    const route = routes.find((item) => item.name === currentView.name);

                    if (route) {

                        const panels = await loadRoutePanels();

                        if (gen !== renderGen) {

                            return;

                        }

                        main.innerHTML = renderRoute(
                            route,
                            bodies.get(route.name) ?? '{}',
                            routes,
                            authToken,
                            panels,
                        );

                        if (!demoMode) {

                            document.getElementById('send')?.addEventListener('click', () => {

                                void sendRequest(route);

                            });

                        }

                        const onCopyCurl = (): void => copyCurl(route);

                        document.getElementById('copy-curl-try')?.addEventListener('click', onCopyCurl);

                        initJsonEditor('body');
                        panels.bindSchemaPanels(main);

                    } else {

                        navigate(showHome ? {kind: 'home'} : {kind: 'routes'});

                    }

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

                const applySearch = (value: string): void => {

                    persistRouteDraft();
                    filters = {...filters, text: value};
                    void render();
                    const restored = document.getElementById(id);

                    if (restored instanceof HTMLInputElement) {

                        restored.focus();
                        const len = restored.value.length;
                        restored.setSelectionRange(len, len);

                    }

                };

                input.addEventListener('input', () => {
                    applySearch(input.value);
                });

                const clearBtn = input
                    .closest('.cs-docs-search')
                    ?.querySelector('.cs-docs-search__clear');

                if (clearBtn instanceof HTMLButtonElement) {

                    clearBtn.addEventListener('click', () => {
                        applySearch('');
                    });

                }

            };

            bindSearchInput('sidebar-search');

            document.getElementById('nav-menu-btn')?.addEventListener('click', () => {

                if (navOpen) closeNav();
                else openNav();

            });

            matchMedia('(min-width: 50rem)').addEventListener('change', (event) => {

                if (event.matches) closeNav();

            });

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
                    void render();

                });

            });

            main.querySelectorAll('[data-tag]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    if (!(btn instanceof HTMLElement)) return;

                    const tag = btn.dataset.tag ?? '';

                    filters = {...filters, tag: tag || null};
                    void render();

                });

            });

            main.querySelectorAll('[data-mcp-only]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    if (!(btn instanceof HTMLElement)) return;

                    filters = {...filters, mcpOnly: btn.dataset.mcpOnly === 'true'};
                    void render();

                });

            });

        };

        window.addEventListener('hashchange', () => {

            view = viewFromHash(routes, showHome);
            void render();

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
            const input = document.getElementById('sidebar-search');

            if (input instanceof HTMLInputElement) {

                input.focus();
                input.select();

            }

        });

        void render();

    } catch (err) {

        app.className = 'loading';
        const message = err instanceof CallspecDocumentError
            ? err.message
            : String(err);

        app.innerHTML = `<div class="error-banner">${escapeHtml(message)}</div>`;

    }

}

void boot();
