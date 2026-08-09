import type {CallspecUiConfig} from '../branding';
import {slugifyName} from '../../metaDefaults';
import {codeBlock} from './highlight';

type McpRoute = {
    name: string
    auth: 'none' | 'bearer'
    mcp: boolean
};

type ConnectClient = {
    id: string
    title: string
    meta: string
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

function renderCopyButton(targetId: string, label = 'Copy'): string {

    return `<button type="button" class="mcp-code-copy" data-copy-target="${targetId}">${label}</button>`;

}

function renderCodePanel(source: string, id: string, copyLabel = 'Copy', lang = 'JSON'): string {

    return `
        <div class="mcp-code-panel">
            <div class="mcp-code-toolbar">
                <span class="mcp-code-lang">${lang}</span>
                ${renderCopyButton(id, copyLabel)}
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
            meta: '.cursor/mcp.json',
            hint: 'Project file or Settings → MCP.',
            body: `
                ${renderCodePanel(cursorJson, 'cursor-mcp-config', 'Copy config')}
            `,
        },
        {
            id: 'claude-desktop',
            title: 'Claude',
            meta: 'Desktop · Connectors',
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
            meta: 'CLI',
            hint: `Run in your terminal.${authNote}`,
            body: `
                ${renderCodePanel(claudeCodeCmd, 'claude-code-mcp', 'Copy command', 'Shell')}
            `,
        },
        {
            id: 'vscode',
            title: 'VS Code',
            meta: '.vscode/mcp.json',
            hint: 'Workspace or user profile — Command Palette → <code>MCP: Open User Configuration</code>.',
            body: `
                ${renderCodePanel(vscodeJson, 'vscode-mcp-config', 'Copy config')}
            `,
        },
        {
            id: 'windsurf',
            title: 'Windsurf',
            meta: 'mcp_config.json',
            hint: hasPrivateMcp
                ? `Uses <code>serverUrl</code> and <code>\${env:${tokenEnv}}</code> for auth.`
                : 'Uses <code>serverUrl</code> (not <code>url</code>) for remote servers.',
            body: `
                ${renderCodePanel(windsurfJson, 'windsurf-mcp-config', 'Copy config')}
            `,
        },
        {
            id: 'pi',
            title: 'Pi',
            meta: '.pi/mcp.json',
            hint: hasPrivateMcp
                ? `Set <code>${tokenEnv}</code> in your environment; Pi reads it via <code>bearerTokenEnv</code>.`
                : 'Project-local <code>.pi/mcp.json</code> or global Pi MCP config.',
            body: `
                ${renderCodePanel(piJson, 'pi-mcp-config', 'Copy config')}
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
            ${index === 0 ? '' : 'hidden'}
        >
            <div class="mcp-client-meta">
                <span class="mcp-client-path">${escapeHtml(client.meta)}</span>
            </div>
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
                    <h3 class="mcp-connect-title">Connect MCP</h3>
                    <p class="mcp-connect-lead">
                        ${mcpRoutes.length} tool${mcpRoutes.length === 1 ? '' : 's'} over HTTP — paste into your agent.
                    </p>
                </div>
                <span class="badge mcp mcp-connect-badge">MCP</span>
            </div>

            <div class="mcp-endpoint">
                <label class="mcp-endpoint-label">Endpoint</label>
                <div class="mcp-endpoint-field">
                    <code class="mcp-endpoint-url">${escapeHtml(mcpUrl)}</code>
                    <button type="button" class="mcp-endpoint-copy" data-copy="${escapeHtml(mcpUrl)}" aria-label="Copy endpoint URL">
                        Copy
                    </button>
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

function flashCopyButton(btn: HTMLElement): void {

    const original = btn.textContent ?? 'Copy';

    btn.textContent = 'Copied';
    btn.classList.add('is-copied');

    window.setTimeout(() => {

        btn.textContent = original;
        btn.classList.remove('is-copied');

    }, 1400);

}

export function bindMcpConnect(root: HTMLElement): void {

    root.querySelectorAll('[data-copy]').forEach((btn) => {

        btn.addEventListener('click', () => {

            const text = (btn as HTMLElement).dataset.copy ?? '';

            void navigator.clipboard.writeText(text).then(() => {

                flashCopyButton(btn as HTMLElement);

            });

        });

    });

    root.querySelectorAll('[data-copy-target]').forEach((btn) => {

        btn.addEventListener('click', () => {

            const targetId = (btn as HTMLElement).dataset.copyTarget ?? '';
            const el = document.getElementById(targetId);

            if (el) {

                void navigator.clipboard.writeText(el.textContent ?? '').then(() => {

                    flashCopyButton(btn as HTMLElement);

                });

            }

        });

    });

    const tabs = root.querySelectorAll<HTMLButtonElement>('[data-mcp-client]');

    if (tabs.length === 0) {

        return;

    }

    const panels = root.querySelectorAll<HTMLElement>('[data-mcp-panel]');

    tabs.forEach((tab) => {

        tab.addEventListener('click', () => {

            const clientId = tab.dataset.mcpClient ?? '';

            tabs.forEach((other) => {

                other.setAttribute('aria-selected', other === tab ? 'true' : 'false');

            });

            panels.forEach((panel) => {

                const active = panel.dataset.mcpPanel === clientId;

                panel.hidden = !active;
                panel.classList.toggle('is-active', active);

            });

        });

    });

}
