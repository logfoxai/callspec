import {highlightJson} from './highlight';

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

function lineCount(source: string): number {

    if (!source) return 1;

    return source.split('\n').length;

}

function gutterText(lines: number): string {

    return Array.from({length: lines}, (_, index) => String(index + 1)).join('\n');

}

function syncEditor(textarea: HTMLTextAreaElement): void {

    const root = textarea.closest('[data-json-editor]');

    if (!root) return;

    const frame = root.querySelector('[data-json-frame]');
    const code = root.querySelector('[data-json-highlight]') as HTMLElement | null;
    const gutter = root.querySelector('[data-json-gutter]') as HTMLElement | null;
    const status = root.querySelector('[data-json-status]') as HTMLElement | null;
    const value = textarea.value;
    const lines = lineCount(value);

    if (code) {

        code.innerHTML = highlightJson(value);

    }

    if (gutter) {

        gutter.textContent = gutterText(lines);

    }

    if (frame instanceof HTMLElement) {

        syncFrameHeight(frame, lines);

    }

    let valid = true;

    try {

        if (value.trim()) JSON.parse(value);

    } catch {

        valid = false;

    }

    root.classList.toggle('invalid', !valid);

    if (status) {

        status.textContent = valid ? 'Valid JSON' : 'Invalid JSON';
        status.classList.toggle('ok', valid);
        status.classList.toggle('err', !valid);

    }

}

function formatEditor(textarea: HTMLTextAreaElement): void {

    try {

        const parsed = JSON.parse(textarea.value);

        textarea.value = JSON.stringify(parsed, null, 2);
        syncEditor(textarea);

    } catch {

        syncEditor(textarea);

    }

}

export function jsonEditorHtml(id: string, value: string): string {

    const lines = lineCount(value);

    return `
        <div class="json-editor" data-json-editor="${escapeHtml(id)}">
            <div class="json-editor-head">
                <span class="json-editor-status ok" data-json-status>Valid JSON</span>
                <button type="button" class="json-editor-format" data-json-format>Format</button>
            </div>
            <div class="json-editor-shell">
                <div class="json-editor-frame" data-json-frame>
                    <div class="json-editor-gutter" data-json-gutter aria-hidden="true">${gutterText(lines)}</div>
                    <div class="json-editor-main">
                        <pre class="json-editor-highlight" aria-hidden="true"><code class="hljs language-json" data-json-highlight>${highlightJson(value)}</code></pre>
                        <textarea class="json-editor-input" id="${escapeHtml(id)}" spellcheck="false">${escapeHtml(value)}</textarea>
                    </div>
                </div>
                <button type="button" class="json-editor-resize" data-json-resize aria-label="Resize editor"></button>
            </div>
        </div>
    `;

}

export function initJsonEditor(id: string): void {

    const textarea = document.getElementById(id) as HTMLTextAreaElement | null;

    if (!textarea) return;

    const root = textarea.closest('[data-json-editor]');

    if (!root) return;

    const highlight = root.querySelector('.json-editor-highlight') as HTMLElement | null;
    const gutter = root.querySelector('.json-editor-gutter') as HTMLElement | null;

    const syncScroll = (): void => {

        if (highlight) highlight.scrollTop = textarea.scrollTop;
        if (highlight) highlight.scrollLeft = textarea.scrollLeft;
        if (gutter) gutter.scrollTop = textarea.scrollTop;

    };

    textarea.addEventListener('input', () => {

        syncEditor(textarea);
        syncScroll();

    });

    textarea.addEventListener('scroll', syncScroll);

    textarea.addEventListener('keydown', (event) => {

        if (event.key !== 'Tab') return;

        event.preventDefault();

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = `${value.slice(0, start)}  ${value.slice(end)}`;
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
        syncEditor(textarea);

    });

    root.querySelector('[data-json-format]')?.addEventListener('click', () => {

        formatEditor(textarea);

    });

    syncEditor(textarea);

    initJsonEditorResize(root);

}

const JSON_EDITOR_MIN_HEIGHT_PX = 160;
const JSON_EDITOR_DEFAULT_HEIGHT_PX = 224;
const JSON_EDITOR_MAX_DRAG_HEIGHT_PX = 960;
const JSON_EDITOR_LINE_HEIGHT_PX = 19.2;
const JSON_EDITOR_VERTICAL_PADDING_PX = 24;

function lineHeightForLines(lines: number): number {

    return lines * JSON_EDITOR_LINE_HEIGHT_PX + JSON_EDITOR_VERTICAL_PADDING_PX;

}

function clampDragHeight(height: number): number {

    return Math.min(JSON_EDITOR_MAX_DRAG_HEIGHT_PX, Math.max(JSON_EDITOR_MIN_HEIGHT_PX, height));

}

function syncFrameHeight(frame: HTMLElement, lines: number): void {

    const contentHeight = lineHeightForLines(lines);
    const userMin = Number(frame.dataset.userMinHeight || 0);
    const target = Math.max(JSON_EDITOR_MIN_HEIGHT_PX, contentHeight, userMin || JSON_EDITOR_DEFAULT_HEIGHT_PX);

    frame.style.height = `${target}px`;

}

function initJsonEditorResize(root: Element): void {

    const frame = root.querySelector('[data-json-frame]');

    const handle = root.querySelector('[data-json-resize]');
    const textarea = root.querySelector('.json-editor-input');

    if (!(frame instanceof HTMLElement) || !(handle instanceof HTMLButtonElement)) return;

    let startY = 0;
    let startHeight = 0;

    const onPointerMove = (event: PointerEvent): void => {

        const next = clampDragHeight(startHeight + (event.clientY - startY));

        frame.style.height = `${next}px`;
        frame.dataset.userMinHeight = String(next);

    };

    const onPointerUp = (event: PointerEvent): void => {

        handle.releasePointerCapture(event.pointerId);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);

        if (textarea instanceof HTMLTextAreaElement) {

            syncEditor(textarea);

        }

    };

    handle.addEventListener('pointerdown', (event) => {

        event.preventDefault();
        startY = event.clientY;
        startHeight = frame.getBoundingClientRect().height;
        handle.setPointerCapture(event.pointerId);
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);

    });

}
