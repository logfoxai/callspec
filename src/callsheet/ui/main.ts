import './styles.css';
import {codeBlock} from './highlight';
import {initJsonEditor, jsonEditorHtml} from './jsonEditor';
import {initTheme, toggleTheme, type Theme} from './theme';

type CallsheetConfig = {
    specUrl: string
    rpcBase: string
    title?: string
};

type CallsheetRoute = {
    name: string
    summary: string
    description: string
    tags: string[]
    access: 'public' | 'private'
    mcp: boolean
    inputSchema: unknown
    outputSchema: unknown
};

declare global {
    interface Window {
        __CALLSHEET__?: CallsheetConfig
    }
}

const config = window.__CALLSHEET__ ?? {specUrl: '../openapi.json', rpcBase: '..'};

let theme: Theme = initTheme();

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

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

function groupByTag(routes: CallsheetRoute[]): Map<string, CallsheetRoute[]> {

    const groups = new Map<string, CallsheetRoute[]>();

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

function uniqueTags(routes: CallsheetRoute[]): string[] {

    const tags = new Set<string>();

    for (const route of routes) {

        for (const tag of route.tags.length ? route.tags : ['routes']) {

            tags.add(tag);

        }

    }

    return [...tags].sort((a, b) => a.localeCompare(b));

}

function applyFilters(routes: CallsheetRoute[], filters: RouteFilters): CallsheetRoute[] {

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

function renderBadges(route: CallsheetRoute): string {

    return [
        `<span class="badge ${route.access}">${route.access}</span>`,
        route.mcp ? '<span class="badge mcp">MCP</span>' : '',
    ].filter(Boolean).join('');

}

function routeFromHash(): string | null {

    const match = location.hash.match(/^#\/([^/?#]+)/);

    return match ? decodeURIComponent(match[1]) : null;

}

function setRouteHash(name: string | null): void {

    const next = name ? `#/${encodeURIComponent(name)}` : '#/';

    if (location.hash !== next) {

        location.hash = next;

    }

}

function renderSidebar(
    routes: CallsheetRoute[],
    selected: string | null,
    overviewActive: boolean,
): string {

    const groups = groupByTag(routes);
    let html = `<button type="button" class="route-btn overview-btn${overviewActive ? ' active' : ''}" data-overview="true">Overview</button>`;

    for (const [tag, list] of groups) {

        html += `<div class="tag-group"><div class="tag-label">${escapeHtml(tag)}</div>`;

        for (const route of list) {

            const active = route.name === selected ? ' active' : '';

            html += `<button type="button" class="route-btn${active}" data-route="${escapeHtml(route.name)}">${escapeHtml(route.name)}</button>`;

        }

        html += '</div>';

    }

    return html || '<div class="empty-state"><p>No matches</p></div>';

}

function renderOverview(
    filtered: CallsheetRoute[],
    allRoutes: CallsheetRoute[],
    filters: RouteFilters,
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

    return `
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

function renderRoute(route: CallsheetRoute, bodyJson: string): string {

    return `
        <nav class="breadcrumb">
            <button type="button" class="breadcrumb-link" data-overview="true">← All routes</button>
        </nav>
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

async function sendRequest(route: CallsheetRoute): Promise<void> {

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

function copyCurl(route: CallsheetRoute): void {

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

function parseRoutes(doc: Record<string, unknown>): CallsheetRoute[] {

    const paths = doc.paths as Record<string, Record<string, unknown>> | undefined;
    const routes: CallsheetRoute[] = [];

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
        const routes = parseRoutes(doc);

        const hashRoute = routeFromHash();
        let selected: string | null = hashRoute && routes.some((route) => route.name === hashRoute)
            ? hashRoute
            : null;
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

        const selectRoute = (name: string | null): void => {

            const bodyEl = document.getElementById('body') as HTMLTextAreaElement | null;

            if (selected && bodyEl) {

                bodies.set(selected, bodyEl.value);

            }

            selected = name;
            setRouteHash(name);
            render();

        };

        const render = (): void => {

            const filtered = applyFilters(routes, filters);
            const overviewActive = selected === null;

            app.className = '';
            app.innerHTML = `
                <aside class="sidebar">
                    <div class="sidebar-head">
                        <div class="sidebar-head-row">
                            <button type="button" class="sidebar-title" data-overview="true">${escapeHtml(title)}</button>
                            <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle color theme" title="Toggle color theme">
                                <span class="theme-icon theme-icon-light" aria-hidden="true">☀</span>
                                <span class="theme-icon theme-icon-dark" aria-hidden="true">☾</span>
                            </button>
                        </div>
                        <p>v${escapeHtml(version)} · ${routes.length} routes</p>
                    </div>
                    <div class="route-list">${renderSidebar(routes, selected, overviewActive)}</div>
                </aside>
                <div class="content">
                    <main class="main" id="main"></main>
                </div>
            `;

            const main = document.getElementById('main');
            const route = selected ? routes.find((item) => item.name === selected) : undefined;

            if (main && overviewActive) {

                main.innerHTML = renderOverview(filtered, routes, filters);
                bindOverviewFilters(main);

            } else if (main && route) {

                main.innerHTML = renderRoute(route, bodies.get(route.name) ?? '{}');

                document.getElementById('send')?.addEventListener('click', () => {

                    void sendRequest(route);

                });

                document.getElementById('copy-curl')?.addEventListener('click', () => {

                    copyCurl(route);

                });

                initJsonEditor('body');

            } else if (main) {

                main.innerHTML = renderOverview(filtered, routes, filters);
                bindOverviewFilters(main);
                selected = null;

            }

            document.getElementById('theme-toggle')?.addEventListener('click', () => {

                theme = toggleTheme(theme);

            });

            app.querySelectorAll('[data-overview]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    selectRoute(null);

                });

            });

            app.querySelectorAll('[data-route]').forEach((btn) => {

                btn.addEventListener('click', () => {

                    selectRoute((btn as HTMLElement).dataset.route ?? null);

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

            const hashRoute = routeFromHash();
            selected = hashRoute && routes.some((route) => route.name === hashRoute)
                ? hashRoute
                : null;
            render();

        });

        render();

    } catch (err) {

        app.className = 'loading';
        app.innerHTML = `<div class="error-banner">${escapeHtml(String(err))}</div>`;

    }

}

void boot();
