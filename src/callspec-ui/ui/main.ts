import './styles.css';
import type {CallspecUiBranding, CallspecUiConfig} from '../branding';
import {codeBlock} from './highlight';
import {initJsonEditor, jsonEditorHtml} from './jsonEditor';
import {bindMcpConnect, renderMcpConnect} from './mcpConnect';
import {initTheme, toggleTheme, type Theme} from './theme';
import {themeMoonIcon, themeSunIcon} from './icons';

type CallspecUiRoute = {
    name: string
    summary: string
    description: string
    tags: string[]
    access: 'public' | 'private'
    mcp: boolean
    inputSchema: unknown
    outputSchema: unknown
};

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
    specUrl: '../openapi.json',
    rpcBase: '..',
    mcpPath: '../mcp',
};

let theme: Theme = initTheme();

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

function hasHomePage(branding: CallspecUiBranding | undefined): boolean {

    return Boolean(branding?.intro);

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
    options: {size: number; wrapClass: string},
): string {

    if (!branding?.logoUrl) return '';

    const dark = branding.logoUrlDark ?? branding.logoUrl;
    const {size, wrapClass} = options;
    const srcset = branding.logoSrcSet
        ?? './brand/mark.png 256w, ./brand/mark@2x.png 512w';
    const srcsetAttr = (branding.logoUrl.includes('mark.png') || branding.logoSrcSet)
        ? ` srcset="${escapeHtml(srcset)}" sizes="${size}px"`
        : '';

    return `
        <span class="brand-mark ${wrapClass}" style="--logo-size: ${size}px">
            <img class="brand-mark-img brand-mark-light" src="${escapeHtml(branding.logoUrl)}"${srcsetAttr} width="${size}" height="${size}" alt="">
            <img class="brand-mark-img brand-mark-dark" src="${escapeHtml(dark)}"${srcsetAttr} width="${size}" height="${size}" alt="">
        </span>
    `;

}

function renderLogo(branding: CallspecUiBranding | undefined): string {

    const mark = renderBrandMark(branding, {
        size: branding?.logoSize ?? 80,
        wrapClass: 'intro-logo',
    });

    if (!mark) return '';

    return mark;

}

function exampleFromSchema(schema: unknown, key?: string): unknown {

    if (!schema || typeof schema !== 'object') return {};

    const s = schema as Record<string, unknown>;

    if (Array.isArray(s.enum) && s.enum.length) return s.enum[0];

    if (s.const !== undefined) return s.const;

    const type = s.type;

    if (type === 'string') {

        if (key?.toLowerCase().includes('id')) return '00000000-0000-0000-0000-000000000000';
        if (key?.toLowerCase().includes('email')) return 'user@example.com';
        return '';

    }

    if (type === 'number' || type === 'integer') return 0;

    if (type === 'boolean') return false;

    if (type === 'array') {

        const items = s.items;

        return items ? [exampleFromSchema(items)] : [];

    }

    if (type === 'object' || s.properties) {

        const props = s.properties as Record<string, unknown> | undefined;
        const required = Array.isArray(s.required) ? s.required as string[] : [];
        const out: Record<string, unknown> = {};

        if (props) {

            for (const [propKey, propSchema] of Object.entries(props)) {

                if (required.includes(propKey) || Object.keys(out).length < 4) {

                    out[propKey] = exampleFromSchema(propSchema, propKey);

                }

            }

        }

        return out;

    }

    return null;

}

function groupByTag(routes: CallspecUiRoute[]): Map<string, CallspecUiRoute[]> {

    const groups = new Map<string, CallspecUiRoute[]>();

    for (const route of routes) {

        const tags = route.tags.length ? route.tags : ['routes'];

        for (const tag of tags) {

            const list = groups.get(tag) ?? [];
            list.push(route);
            groups.set(tag, list);

        }

    }

    for (const list of groups.values()) {

        list.sort((a, b) => a.name.localeCompare(b.name));

    }

    return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));

}

type AccessFilter = 'all' | 'public' | 'private';

type RouteFilters = {
    text: string
    access: AccessFilter
    tag: string | null
    mcpOnly: boolean
};

function uniqueTags(routes: CallspecUiRoute[]): string[] {

    const tags = new Set<string>();

    for (const route of routes) {

        for (const tag of route.tags.length ? route.tags : ['routes']) {

            tags.add(tag);

        }

    }

    return [...tags].sort((a, b) => a.localeCompare(b));

}

function applyFilters(routes: CallspecUiRoute[], filters: RouteFilters): CallspecUiRoute[] {

    const needle = filters.text.trim().toLowerCase();

    return routes.filter((route) => {

        if (filters.access !== 'all' && route.access !== filters.access) {

            return false;

        }

        if (filters.mcpOnly && !route.mcp) {

            return false;

        }

        if (filters.tag && !route.tags.includes(filters.tag)) {

            return false;

        }

        if (needle && !(
            route.name.toLowerCase().includes(needle)
            || route.summary.toLowerCase().includes(needle)
            || route.description.toLowerCase().includes(needle)
            || route.tags.some((tag) => tag.toLowerCase().includes(needle))
        )) {

            return false;

        }

        return true;

    });

}

function renderBadges(route: CallspecUiRoute): string {

    return [
        `<span class="badge ${route.access}">${route.access}</span>`,
        route.mcp ? '<span class="badge mcp">MCP</span>' : '',
    ].filter(Boolean).join('');

}

function viewFromHash(routes: CallspecUiRoute[], showHome: boolean): View {

    const raw = location.hash.replace(/^#\/?/, '');

    if (!raw || raw === '') {

        return showHome ? {kind: 'home'} : {kind: 'routes'};

    }

    if (raw === 'routes') {

        return {kind: 'routes'};

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

function renderSidebar(
    routes: CallspecUiRoute[],
    view: View,
    showHome: boolean,
): string {

    const groups = groupByTag(routes);
    let html = '';

    if (showHome) {

        html += `<button type="button" class="route-btn nav-btn${view.kind === 'home' ? ' active' : ''}" data-view="home">Home</button>`;

    }

    html += `<button type="button" class="route-btn nav-btn${view.kind === 'routes' ? ' active' : ''}" data-view="routes">Routes</button>`;

    for (const [tag, list] of groups) {

        html += `<div class="tag-group"><div class="tag-label">${escapeHtml(tag)}</div>`;

        for (const route of list) {

            const active = view.kind === 'route' && route.name === view.name ? ' active' : '';

            html += `<button type="button" class="route-btn${active}" data-route="${escapeHtml(route.name)}">${escapeHtml(route.name)}</button>`;

        }

        html += '</div>';

    }

    return html || '<div class="empty-state"><p>No routes</p></div>';

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

    return `
        <div class="intro">
            ${renderLogo(branding)}
            <h1 class="intro-title">${escapeHtml(name)}</h1>
            <p class="intro-version">v${escapeHtml(version)} · ${routes.length} routes${mcpCount ? ` · ${mcpCount} MCP tools` : ''}</p>
            <p class="intro-text">${escapeHtml(branding.intro ?? '')}</p>
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
    const groups = groupByTag(filtered);
    let groupsHtml = '';

    for (const [tag, list] of groups) {

        let cards = '';

        for (const route of list) {

            cards += `
                <button type="button" class="route-card" data-route="${escapeHtml(route.name)}">
                    <div class="route-card-head">
                        <span class="method">POST</span>
                        <span class="route-card-name">${escapeHtml(route.name)}</span>
                        <span class="route-card-badges">${renderBadges(route)}</span>
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
        ? `<nav class="breadcrumb"><button type="button" class="breadcrumb-link" data-view="home">← Home</button></nav>`
        : '';

    return `
        ${breadcrumb}
        <div class="overview">
            <div class="overview-head">
                <h2 class="overview-title">Routes</h2>
                <p class="overview-count">${filtered.length} of ${allRoutes.length}</p>
            </div>
            <div class="filters">
                <input class="search overview-search" type="search" placeholder="Search routes" value="${escapeHtml(filters.text)}" aria-label="Search routes">
                <div class="filter-row">
                    <span class="filter-label">Access</span>
                    <div class="filter-pills">
                        <button type="button" class="filter-pill${filters.access === 'all' ? ' active' : ''}" data-access="all">All</button>
                        <button type="button" class="filter-pill${filters.access === 'public' ? ' active' : ''}" data-access="public">Public</button>
                        <button type="button" class="filter-pill${filters.access === 'private' ? ' active' : ''}" data-access="private">Private</button>
                    </div>
                </div>
                <div class="filter-row">
                    <span class="filter-label">Tag</span>
                    <div class="filter-pills">
                        <button type="button" class="filter-pill${filters.tag === null ? ' active' : ''}" data-tag="">All</button>
                        ${tagPills}
                    </div>
                </div>
                <label class="filter-check">
                    <input type="checkbox" id="mcp-only"${filters.mcpOnly ? ' checked' : ''}>
                    MCP only
                </label>
            </div>
            ${groupsHtml || '<div class="empty-state"><p>No routes match these filters</p></div>'}
        </div>
    `;

}

function renderRoute(route: CallspecUiRoute, bodyJson: string, showHome: boolean): string {

    const back = showHome
        ? `<button type="button" class="breadcrumb-link" data-view="routes">← All routes</button>`
        : `<button type="button" class="breadcrumb-link" data-view="routes">← All routes</button>`;

    return `
        <nav class="breadcrumb">${back}</nav>
        <div class="route-endpoint">
            <span class="method">POST</span>
            <h2 class="route-name">${escapeHtml(route.name)}</h2>
        </div>
        <div class="badges">${renderBadges(route)}</div>
        <p class="route-summary">${escapeHtml(route.summary)}</p>
        ${route.description ? `<p class="route-desc">${escapeHtml(route.description)}</p>` : '<div class="route-desc"></div>'}
        <div class="section">
            <h3 class="section-title">Request</h3>
            ${codeBlock(JSON.stringify(route.inputSchema, null, 2))}
        </div>
        <div class="section">
            <h3 class="section-title">Response</h3>
            ${codeBlock(JSON.stringify(route.outputSchema, null, 2))}
        </div>
        <div class="section">
            <h3 class="section-title">Try it</h3>
            <div class="try-block">
                <div class="field">
                    <label for="auth">Authorization</label>
                    <input id="auth" type="text" placeholder="Bearer token" autocomplete="off" spellcheck="false">
                </div>
                <div class="field">
                    <label for="body">Body</label>
                    ${jsonEditorHtml('body', bodyJson)}
                </div>
                <div class="actions">
                    <button type="button" class="btn btn-primary" id="send">Send</button>
                    <button type="button" class="btn btn-ghost" id="copy-curl">Copy curl</button>
                </div>
                <div class="response" id="response"></div>
            </div>
        </div>
    `;

}

async function sendRequest(route: CallspecUiRoute): Promise<void> {

    const bodyEl = document.getElementById('body') as HTMLTextAreaElement | null;
    const authEl = document.getElementById('auth') as HTMLInputElement | null;
    const responseEl = document.getElementById('response');

    if (!bodyEl || !responseEl) return;

    const rpcBase = config.rpcBase.replace(/\/$/, '');
    const url = `${rpcBase}/${route.name}`.replace(/\/{2,}/g, '/');
    const headers: Record<string, string> = {'Content-Type': 'application/json'};

    if (authEl?.value.trim()) {

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

    const bodyEl = document.getElementById('body') as HTMLTextAreaElement | null;
    const authEl = document.getElementById('auth') as HTMLInputElement | null;
    const rpcBase = config.rpcBase.replace(/\/$/, '');
    const url = new URL(`${rpcBase}/${route.name}`.replace(/\/{2,}/g, '/'), window.location.href).href;
    const body = bodyEl?.value ?? '{}';
    let cmd = `curl -X POST '${url}' \\\n  -H 'Content-Type: application/json'`;

    if (authEl?.value.trim()) {

        cmd += ` \\\n  -H 'Authorization: ${authEl.value.trim()}'`;

    }

    cmd += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`;

    void navigator.clipboard.writeText(cmd);

}

function parseRoutes(doc: Record<string, unknown>): CallspecUiRoute[] {

    const paths = doc.paths as Record<string, Record<string, unknown>> | undefined;
    const routes: CallspecUiRoute[] = [];

    if (!paths) return routes;

    for (const [pathKey, methods] of Object.entries(paths)) {

        const post = methods.post as Record<string, unknown> | undefined;

        if (!post) continue;

        const name = (post.operationId as string | undefined) ?? pathKey.replace(/^\//, '');
        const requestBody = post.requestBody as Record<string, unknown> | undefined;
        const reqContent = requestBody?.content as Record<string, unknown> | undefined;
        const reqJson = reqContent?.['application/json'] as Record<string, unknown> | undefined;
        const responses = post.responses as Record<string, unknown> | undefined;
        const ok = responses?.['200'] as Record<string, unknown> | undefined;
        const okContent = ok?.content as Record<string, unknown> | undefined;
        const okJson = okContent?.['application/json'] as Record<string, unknown> | undefined;

        routes.push({
            name,
            summary: (post.summary as string | undefined) ?? name,
            description: (post.description as string | undefined) ?? '',
            tags: Array.isArray(post.tags) ? post.tags.map(String) : [],
            access: post['x-callspec-access'] === 'public' ? 'public' : 'private',
            mcp: post['x-callspec-mcp'] === true,
            inputSchema: reqJson?.schema ?? {type: 'object'},
            outputSchema: okJson?.schema ?? {type: 'object'},
        });

    }

    return routes.sort((a, b) => a.name.localeCompare(b.name));

}

async function boot(): Promise<void> {

    const app = document.getElementById('app');

    if (!app) return;

    try {

        const resp = await fetch(config.specUrl);

        if (!resp.ok) throw new Error(`Could not load spec (${resp.status})`);

        const doc = await resp.json() as Record<string, unknown>;
        const info = doc.info as Record<string, unknown> | undefined;
        const title = config.title ?? (info?.title as string | undefined) ?? 'API';
        const version = (info?.version as string | undefined) ?? '';
        const branding = config.branding;
        const showHome = hasHomePage(branding);
        const routes = parseRoutes(doc);

        let view: View = viewFromHash(routes, showHome);
        let filters: RouteFilters = {
            text: '',
            access: 'all',
            tag: null,
            mcpOnly: false,
        };
        const bodies = new Map<string, string>();

        for (const route of routes) {

            bodies.set(route.name, JSON.stringify(exampleFromSchema(route.inputSchema), null, 2));

        }

        const navigate = (next: View): void => {

            const bodyEl = document.getElementById('body') as HTMLTextAreaElement | null;

            if (view.kind === 'route' && bodyEl) {

                bodies.set(view.name, bodyEl.value);

            }

            view = next;
            setViewHash(next);
            render();

        };

        const render = (): void => {

            const filtered = applyFilters(routes, filters);
            const sidebarName = displayName(title, branding);

            app.className = '';
            app.innerHTML = `
                <aside class="sidebar">
                    <div class="sidebar-head">
                        <div class="sidebar-head-row">
                            <button type="button" class="sidebar-title" data-view="${showHome ? 'home' : 'routes'}">
                                ${renderBrandMark(branding, {size: 24, wrapClass: 'sidebar-mark'})}
                                <span class="sidebar-title-text">${escapeHtml(sidebarName)}</span>
                            </button>
                            <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle color theme" title="Toggle color theme">
                                <span class="theme-icon theme-icon-light" aria-hidden="true">${themeSunIcon()}</span>
                                <span class="theme-icon theme-icon-dark" aria-hidden="true">${themeMoonIcon()}</span>
                            </button>
                        </div>
                        <p>v${escapeHtml(version)} · ${routes.length} routes</p>
                    </div>
                    <div class="route-list">${renderSidebar(routes, view, showHome)}</div>
                </aside>
                <div class="content">
                    <main class="main" id="main"></main>
                </div>
            `;

            const main = document.getElementById('main');

            if (main && view.kind === 'home' && branding) {

                main.innerHTML = renderHome(title, version, routes, branding);
                bindMcpConnect(main);
                main.querySelector('[data-mcp-routes]')?.addEventListener('click', () => {

                    filters = {...filters, mcpOnly: true};
                    navigate({kind: 'routes'});

                });

            } else if (main && view.kind === 'routes') {

                main.innerHTML = renderOverview(filtered, routes, filters, showHome);
                bindOverviewFilters(main);

            } else if (main && view.kind === 'route') {

                const route = routes.find((item) => item.name === view.name);

                if (route) {

                    main.innerHTML = renderRoute(route, bodies.get(route.name) ?? '{}', showHome);

                    document.getElementById('send')?.addEventListener('click', () => {

                        void sendRequest(route);

                    });

                    document.getElementById('copy-curl')?.addEventListener('click', () => {

                        copyCurl(route);

                    });

                    initJsonEditor('body');

                } else {

                    navigate(showHome ? {kind: 'home'} : {kind: 'routes'});

                }

            }

            document.getElementById('theme-toggle')?.addEventListener('click', () => {

                theme = toggleTheme(theme);

            });

            app.querySelectorAll('[data-view]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    const target = (btn as HTMLElement).dataset.view;

                    if (target === 'home') navigate({kind: 'home'});
                    else if (target === 'routes') navigate({kind: 'routes'});

                });

            });

            app.querySelectorAll('[data-route]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    navigate({kind: 'route', name: (btn as HTMLElement).dataset.route ?? ''});

                });

            });

        };

        const bindOverviewFilters = (main: HTMLElement): void => {

            main.querySelector('.overview-search')?.addEventListener('input', (event) => {

                filters = {...filters, text: (event.target as HTMLInputElement).value};
                render();

            });

            main.querySelectorAll('[data-access]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    filters = {
                        ...filters,
                        access: (btn as HTMLElement).dataset.access as AccessFilter,
                    };
                    render();

                });

            });

            main.querySelectorAll('[data-tag]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    const tag = (btn as HTMLElement).dataset.tag ?? '';

                    filters = {...filters, tag: tag || null};
                    render();

                });

            });

            main.querySelector('#mcp-only')?.addEventListener('change', (event) => {

                filters = {...filters, mcpOnly: (event.target as HTMLInputElement).checked};
                render();

            });

        };

        window.addEventListener('hashchange', () => {

            view = viewFromHash(routes, showHome);
            render();

        });

        render();

    } catch (err) {

        app.className = 'loading';
        app.innerHTML = `<div class="error-banner">${escapeHtml(String(err))}</div>`;

    }

}

void boot();
