import {copyButtonMarkup} from '../../components/codeBlockTitles';
import type {CallspecUiRoute} from '../types';
import {jsonEditorHtml} from './jsonEditor';

export const DEMO_MODE_TOOLTIP = 'Demo mode';

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

export type TryItPanelOptions = {
    route: Pick<CallspecUiRoute, 'auth'>
    bodyJson: string
    authToken: string
    demoMode?: boolean
};

function renderSendButton(demoMode: boolean): string {

    const button = '<button type="button" class="btn btn-primary" id="send" disabled>Send</button>';

    if (!demoMode) {

        return '<button type="button" class="btn btn-primary" id="send">Send</button>';

    }

    return `<span class="try-send-wrap" title="${escapeHtml(DEMO_MODE_TOOLTIP)}">${button}</span>`;

}

export function renderTryItPanel(options: TryItPanelOptions): string {

    const {route, bodyJson, authToken, demoMode = false} = options;

    return `
                <aside class="route-try" aria-label="Try it">
                    <div class="section try-section">
                        <div class="try-block">
                        ${route.auth === 'bearer' ? `
                        <div class="field">
                            <input id="auth" type="text" placeholder="Bearer token" autocomplete="off" spellcheck="false" aria-label="Authorization" value="${escapeHtml(authToken)}">
                        </div>
                        ` : ''}
                        <div class="field">
                            ${jsonEditorHtml('body', bodyJson)}
                        </div>
                        <div class="actions">
                            ${renderSendButton(demoMode)}
                            ${copyButtonMarkup({id: 'copy-curl-try', label: 'Copy curl'})}
                        </div>
                        <div class="response" id="response"></div>
                        </div>
                    </div>
                </aside>
    `;

}
