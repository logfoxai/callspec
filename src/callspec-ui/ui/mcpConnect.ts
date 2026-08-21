import type {CallspecUiConfig} from '../branding';
import {copyButtonMarkup, showCopySuccess, tryCopyText} from '../../components/codeBlockTitles';
import {slugifyName} from '../../metaDefaults';
import {codeBlock} from './highlight';
import {mcpIcon} from './icons';
import {renderIconLabel} from './iconLabel';

type McpRoute = {
    name: string
    auth: 'none' | 'bearer'
    mcp: boolean
};

type ConnectClient = {
    id: string
    title: string
    hint: string
    body: string
};

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

function resolveMcpUrl(config: CallspecUiConfig): string {

    if (config.mcp?.url) {

        return new URL(config.mcp.url, window.location.href).href;

    }

    const mcpPath = (config.mcpPath ?? '../mcp').replace(/\/$/, '');

    return new URL(`${mcpPath}`, window.location.href).href;

}

export function serverSlugFromName(displayName: string): string {

    return slugifyName(displayName, 'api');

}

export function tokenEnvName(serverSlug: string): string {

    return `${serverSlug.toUpperCase().replace(/-/g, '_')}_TOKEN`;

}

/** Cursor, Continue, and other clients using the standard mcpServers + url shape. */
export function mcpServersUrlConfig(
    mcpUrl: string,
    serverName: string,
    authHeader?: string,
    urlKey: 'url' | 'serverUrl' = 'url',
): string {

    const entry: Record<string, unknown> = {[urlKey]: mcpUrl};

    if (authHeader) {

        entry.headers = {Authorization: authHeader};

    }

    return JSON.stringify({mcpServers: {[serverName]: entry}}, null, 2);

}


export function vscodeMcpConfig(mcpUrl: string, serverName: string, authHeader?: string): string {

    const entry: Record<string, unknown> = {
        type: 'http',
        url: mcpUrl,
    };

    if (authHeader) {

        entry.headers = {Authorization: authHeader};

    }

    return JSON.stringify({servers: {[serverName]: entry}}, null, 2);

}

export function windsurfMcpConfig(mcpUrl: string, serverName: string, tokenEnv: string): string {

    const entry: Record<string, unknown> = {serverUrl: mcpUrl};

    entry.headers = {Authorization: `Bearer \${env:${tokenEnv}}`};

    return JSON.stringify({mcpServers: {[serverName]: entry}}, null, 2);

}

export function piMcpConfig(mcpUrl: string, serverName: string, tokenEnv?: string): string {

    const entry: Record<string, unknown> = {url: mcpUrl};

    if (tokenEnv) {

        entry.auth = 'bearer';
        entry.bearerTokenEnv = tokenEnv;

    }

    return JSON.stringify({mcpServers: {[serverName]: entry}}, null, 2);

}

export function claudeCodeMcpCommand(mcpUrl: string, serverName: string, authHeader?: string): string {

    let command = `claude mcp add --transport http ${serverName} ${mcpUrl}`;

    if (authHeader) {

        command += ` --header "Authorization: ${authHeader}"`;

    }

    return command;

}

function renderCodePanel(source: string, id: string, lang = 'JSON'): string {

    return `
        <div class="mcp-code-panel">
            <div class="mcp-code-toolbar">
                <span class="mcp-code-lang">${lang}</span>
                ${copyButtonMarkup({copyTarget: id})}
            </div>
            ${codeBlock(source, id)}
        </div>
    `;

}

function buildConnectClients(
    mcpUrl: string,
    serverSlug: string,
    hasPrivateMcp: boolean,
): ConnectClient[] {

    const sampleAuth = hasPrivateMcp ? 'Bearer YOUR_TOKEN' : undefined;
    const tokenEnv = tokenEnvName(serverSlug);
    const cursorJson = mcpServersUrlConfig(mcpUrl, serverSlug, sampleAuth);
    const vscodeJson = vscodeMcpConfig(mcpUrl, serverSlug, sampleAuth);
    const windsurfJson = hasPrivateMcp
        ? windsurfMcpConfig(mcpUrl, serverSlug, tokenEnv)
        : mcpServersUrlConfig(mcpUrl, serverSlug, undefined, 'serverUrl');
    const piJson = piMcpConfig(mcpUrl, serverSlug, hasPrivateMcp ? tokenEnv : undefined);
    const claudeCodeCmd = claudeCodeMcpCommand(mcpUrl, serverSlug, sampleAuth);

    const authNote = hasPrivateMcp
        ? ' Replace <code>YOUR_TOKEN</code> or set the env var before connecting.'
        : '';

    return [
        {
            id: 'cursor',
            title: 'Cursor',
            hint: 'Add this to <code>.cursor/mcp.json</code>, or open Settings → MCP.',
            body: `
                ${renderCodePanel(cursorJson, 'cursor-mcp-config')}
            `,
        },
        {
            id: 'claude-desktop',
            title: 'Claude',
            hint: 'Remote HTTP MCP via custom connectors (not the local stdio config file).',
            body: `
                <ol class="mcp-steps">
                    <li>Open <strong>Settings → Connectors → Add custom connector</strong>.</li>
                    <li>Paste the endpoint URL.${hasPrivateMcp ? ' Add your Bearer token when prompted.' : ''}</li>
                    <li>Save — Claude connects from Anthropic's cloud, so the URL must be publicly reachable.</li>
                </ol>
            `,
        },
        {
            id: 'claude-code',
            title: 'Claude Code',
            hint: `Run this in your terminal.${authNote}`,
            body: `
                ${renderCodePanel(claudeCodeCmd, 'claude-code-mcp', 'Shell')}
            `,
        },
        {
            id: 'vscode',
            title: 'VS Code',
            hint: 'Add this to workspace <code>.vscode/mcp.json</code>, or Command Palette → <code>MCP: Open User Configuration</code>.',
            body: `
                ${renderCodePanel(vscodeJson, 'vscode-mcp-config')}
            `,
        },
        {
            id: 'windsurf',
            title: 'Windsurf',
            hint: hasPrivateMcp
                ? `Add this to <code>mcp_config.json</code>. Uses <code>serverUrl</code> and <code>\${env:${tokenEnv}}</code> for auth.`
                : 'Add this to <code>mcp_config.json</code>. Uses <code>serverUrl</code> (not <code>url</code>) for remote servers.',
            body: `
                ${renderCodePanel(windsurfJson, 'windsurf-mcp-config')}
            `,
        },
        {
            id: 'pi',
            title: 'Pi',
            hint: hasPrivateMcp
                ? `Add this to <code>.pi/mcp.json</code>. Set <code>${tokenEnv}</code> in your environment; Pi reads it via <code>bearerTokenEnv</code>.`
                : 'Add this to project-local <code>.pi/mcp.json</code>, or the global Pi MCP config.',
            body: `
                ${renderCodePanel(piJson, 'pi-mcp-config')}
            `,
        },
    ];

}

function renderClientTabs(clients: ConnectClient[]): string {

    return clients.map((client, index) => `
        <button
            type="button"
            class="mcp-client-tab"
            role="tab"
            id="mcp-tab-${client.id}"
            data-mcp-client="${client.id}"
            aria-selected="${index === 0 ? 'true' : 'false'}"
            aria-controls="mcp-panel-${client.id}"
        >${escapeHtml(client.title)}</button>
    `).join('');

}

function renderClientPanels(clients: ConnectClient[]): string {

    return clients.map((client, index) => `
        <div
            class="mcp-client-panel${index === 0 ? ' is-active' : ''}"
            role="tabpanel"
            id="mcp-panel-${client.id}"
            data-mcp-panel="${client.id}"
            aria-labelledby="mcp-tab-${client.id}"
            aria-hidden="${index === 0 ? 'false' : 'true'}"
            ${index === 0 ? '' : 'inert'}
        >
            <p class="mcp-client-hint">${client.hint}</p>
            ${client.body}
        </div>
    `).join('');

}

export function renderMcpConnect(
    config: CallspecUiConfig,
    routes: McpRoute[],
    displayName: string,
): string {

    const mcpRoutes = routes.filter((route) => route.mcp);

    if (mcpRoutes.length === 0) {

        return '';

    }

    const mcpUrl = resolveMcpUrl(config);
    const hasBearerMcp = mcpRoutes.some((route) => route.auth === 'bearer');
    const authHint = config.mcp?.authHint
        ?? (hasBearerMcp ? 'Bearer tools require a Bearer token in the MCP client headers.' : '');
    const serverSlug = serverSlugFromName(displayName);
    const clients = buildConnectClients(mcpUrl, serverSlug, hasBearerMcp);
    const toolLabel = `${mcpRoutes.length} MCP tool${mcpRoutes.length === 1 ? '' : 's'}`;

    return `
        <section class="mcp-connect" id="mcp-connect">
            <div class="mcp-connect-head">
                <div>
                    <h3 class="mcp-connect-title">
                        ${renderIconLabel({
                            icon: mcpIcon(),
                            label: 'Connect MCP',
                            className: 'icon-label--mcp',
                        })}
                    </h3>
                    <p class="mcp-connect-lead">
                        ${mcpRoutes.length} tool${mcpRoutes.length === 1 ? '' : 's'} over HTTP — paste into your agent.
                    </p>
                </div>
            </div>

            <div class="mcp-endpoint">
                <label class="mcp-endpoint-label">Endpoint</label>
                <div class="mcp-endpoint-field">
                    <code class="mcp-endpoint-url">${escapeHtml(mcpUrl)}</code>
                    ${copyButtonMarkup({copyValue: mcpUrl})}
                </div>
                ${authHint ? `<p class="mcp-endpoint-note">${escapeHtml(authHint)}</p>` : ''}
            </div>

            <div class="mcp-tools">
                <button type="button" class="mcp-tools-link" data-mcp-routes>
                    View ${escapeHtml(toolLabel)} →
                </button>
            </div>

            <div class="mcp-clients">
                <div class="mcp-client-tabs" role="tablist" aria-label="MCP clients">
                    ${renderClientTabs(clients)}
                </div>
                <div class="mcp-client-panels">
                    ${renderClientPanels(clients)}
                </div>
            </div>
        </section>
    `;

}

/** Keep the docs/content scroller put while a tab switch mutates layout. */
export function withPreservedScrollTop(
    scroller: {scrollTop: number} | null | undefined,
    mutate: () => void,
): void {

    const top = scroller?.scrollTop ?? 0;

    mutate();

    if (scroller) {

        scroller.scrollTop = top;

    }

}

function contentScrollerNear(root: HTMLElement): HTMLElement | null {

    const el = root.closest('.content');

    return el instanceof HTMLElement ? el : null;

}

function selectMcpClient(
    tabs: NodeListOf<HTMLButtonElement>,
    panels: NodeListOf<HTMLElement>,
    clientId: string,
    activeTab: HTMLButtonElement,
): void {

    tabs.forEach((other) => {

        const on = other === activeTab;

        other.setAttribute('aria-selected', on ? 'true' : 'false');
        other.tabIndex = on ? 0 : -1;

    });

    panels.forEach((panel) => {

        const active = panel.dataset.mcpPanel === clientId;

        panel.classList.toggle('is-active', active);
        // Prefer class + inert over the `hidden` attribute — toggling `hidden` can
        // scroll the newly shown panel (and ancestors) into view.
        panel.toggleAttribute('inert', !active);
        panel.setAttribute('aria-hidden', active ? 'false' : 'true');

    });

}

export function bindMcpConnect(root: HTMLElement): void {

    root.querySelectorAll('[data-copy], [data-copy-target]').forEach((node) => {

        if (!(node instanceof HTMLButtonElement)) {

            return;

        }

        node.addEventListener('click', () => {

            const fromValue = node.dataset.copy;
            const targetId = node.dataset.copyTarget;
            const fromTarget = targetId ? document.getElementById(targetId)?.textContent ?? '' : '';
            const text = fromValue ?? fromTarget;

            void tryCopyText(text).then((ok) => {

                if (ok) {

                    showCopySuccess(node);

                }

            });

        });

    });

    const tabs = root.querySelectorAll<HTMLButtonElement>('[data-mcp-client]');

    if (tabs.length === 0) {

        return;

    }

    const panels = root.querySelectorAll<HTMLElement>('[data-mcp-panel]');
    const scroller = contentScrollerNear(root);

    // Initial a11y state (first tab selected in markup).
    tabs.forEach((tab, index) => {

        tab.tabIndex = index === 0 ? 0 : -1;

    });

    panels.forEach((panel, index) => {

        const active = index === 0;

        panel.classList.toggle('is-active', active);
        panel.toggleAttribute('inert', !active);
        panel.setAttribute('aria-hidden', active ? 'false' : 'true');
        panel.removeAttribute('hidden');

    });

    tabs.forEach((tab) => {

        tab.addEventListener('click', (event) => {

            event.preventDefault();

            const clientId = tab.dataset.mcpClient ?? '';

            withPreservedScrollTop(scroller, () => {

                selectMcpClient(tabs, panels, clientId, tab);

            });

            // Focus without scrolling the page/content pane.
            tab.focus({preventScroll: true});

            if (scroller) {

                const top = scroller.scrollTop;

                requestAnimationFrame(() => {

                    scroller.scrollTop = top;

                });

            }

        });

    });

}
