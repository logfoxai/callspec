import type {CallspecUiRoute} from '../types';
import {codeBlock} from './highlight';
import {exampleFromSchema} from './exampleFromSchema';
import type {CatalogRouteError} from './routeErrorsCatalog';
import {partitionRouteErrors} from './routeErrorsCatalog';

const ERROR_CARD_CARET = `
    <svg class="error-card-caret" width="1rem" height="1rem" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="m14.83 11.29-4.24-4.24a1 1 0 1 0-1.42 1.41L12.71 12l-3.54 3.54a1 1 0 0 0 0 1.41 1 1 0 0 0 .71.29 1 1 0 0 0 .71-.29l4.24-4.24a1.002 1.002 0 0 0 0-1.42Z"/>
    </svg>
`.trim();

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

function jsonPreview(value: unknown): string {

    return JSON.stringify(value, null, 2);

}

function renderViewToggle(panelId: string): string {

    return `
        <div class="schema-view-toggle" role="tablist" aria-label="View as schema or example">
            <button
                type="button"
                class="schema-view-toggle__btn"
                role="tab"
                aria-selected="false"
                data-schema-toggle="${escapeHtml(panelId)}"
                data-view="schema"
            >Schema</button>
            <button
                type="button"
                class="schema-view-toggle__btn schema-view-toggle__btn--active"
                role="tab"
                aria-selected="true"
                data-schema-toggle="${escapeHtml(panelId)}"
                data-view="example"
            >Example</button>
        </div>
    `;

}

function renderSchemaPanelViews(panelId: string, schemaView: string, exampleView: string): string {

    return `
        <div class="schema-panel" data-schema-panel="${escapeHtml(panelId)}">
            <div class="schema-panel__view" data-view="schema" hidden>${schemaView}</div>
            <div class="schema-panel__view" data-view="example">${exampleView}</div>
        </div>
    `;

}

export function renderSchemaExamplePanel(options: {
    panelId: string
    title: string
    schema: unknown
}): string {

    const schemaJson = jsonPreview(options.schema);
    const exampleJson = jsonPreview(exampleFromSchema(options.schema));

    return `
        <div class="section">
            <div class="section-head">
                <h3 class="section-title">${escapeHtml(options.title)}</h3>
                ${renderViewToggle(options.panelId)}
            </div>
            ${renderSchemaPanelViews(
                options.panelId,
                codeBlock(schemaJson),
                codeBlock(exampleJson),
            )}
        </div>
    `;

}

function renderCatalogErrorCard(entry: CatalogRouteError): string {

    const panelId = `error-${entry.code}`;
    const kindLabel = entry.kind === 'framework'
        ? 'Framework'
        : entry.kind === 'handler'
            ? 'Handler'
            : entry.kind === 'client'
                ? 'Client only'
                : 'Domain';

    return `
        <details class="error-card">
            <summary class="error-card-head">
                <span class="error-card-head__content">
                    <code class="error-code">${escapeHtml(entry.code)}</code>
                    <span class="error-kind error-kind--${entry.kind}">${kindLabel}</span>
                    <span class="error-status">${entry.clientOnly ? 'Client Result' : `HTTP ${entry.status}`}</span>
                    ${entry.dataRequired === false ? '<span class="error-optional">data optional</span>' : ''}
                </span>
                ${ERROR_CARD_CARET}
            </summary>
            <div class="error-card-body">
                <p class="error-summary">${escapeHtml(entry.summary)}</p>
                <div class="error-card-schema">
                    <div class="error-card-schema__head">
                        ${renderViewToggle(panelId)}
                    </div>
                    ${renderSchemaPanelViews(
                        panelId,
                        codeBlock(jsonPreview(entry.schema)),
                        codeBlock(jsonPreview(entry.example)),
                    )}
                </div>
            </div>
        </details>
    `;

}

export function renderRouteErrorsSection(
    route: Pick<CallspecUiRoute, 'name' | 'auth' | 'errors'>,
): string {

    const {builtin, domain} = partitionRouteErrors(route);
    const builtinHtml = builtin.map(renderCatalogErrorCard).join('');
    const domainHtml = domain.map(renderCatalogErrorCard).join('');

    return `
        <div class="section errors-section">
            <h3 class="section-title">Errors</h3>
            <div class="error-group">
                <h4 class="error-group-title">Built-in</h4>
                <p class="error-group-desc">Can happen on any route, even if you did not declare them: invalid input or auth failures, standard errors your handler returns, and client-side network failures.</p>
                <div class="error-list">${builtinHtml}</div>
            </div>
            ${domainHtml
        ? `
            <div class="error-group">
                <h4 class="error-group-title">Domain</h4>
                <p class="error-group-desc">Declared for this route with <code>defineErrors</code>.</p>
                <div class="error-list">${domainHtml}</div>
            </div>`
        : ''}
        </div>
    `;

}

export function bindSchemaPanels(root: ParentNode): void {

    root.querySelectorAll('[data-schema-toggle]').forEach((button) => {

        if (!(button instanceof HTMLButtonElement)) return;

        button.addEventListener('click', () => {

            const panelId = button.dataset.schemaToggle;

            if (!panelId) return;

            const panel = root.querySelector(`[data-schema-panel="${panelId}"]`);

            if (!(panel instanceof HTMLElement)) return;

            const view = button.dataset.view;

            if (view !== 'schema' && view !== 'example') return;

            panel.querySelectorAll('[data-view]').forEach((node) => {

                if (!(node instanceof HTMLElement)) return;

                const isActive = node.dataset.view === view;
                node.hidden = !isActive;

            });

            root.querySelectorAll(`[data-schema-toggle="${panelId}"]`).forEach((toggle) => {

                if (!(toggle instanceof HTMLButtonElement)) return;

                const active = toggle.dataset.view === view;
                toggle.classList.toggle('schema-view-toggle__btn--active', active);
                toggle.setAttribute('aria-selected', active ? 'true' : 'false');

            });

        });

    });

}
