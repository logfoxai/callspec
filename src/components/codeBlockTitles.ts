/** Matches app `useCopyToClipboard` reset window. */
export const COPY_FEEDBACK_MS = 1500;

/** Idle / copied labels — same strings as app `Code` copy button. */
export function copyButtonContent(
    isCopied: boolean,
    idleLabel = 'Copy',
): {label: string; state: 'idle' | 'copied'} {
    return isCopied
        ? {label: 'Copied!', state: 'copied'}
        : {label: idleLabel, state: 'idle'};
}

/** Expressive Code joins multi-line `data-code` with U+007F. */
export function ecDataCodeToText(dataCode: string): string {
    return dataCode.replace(/\u007f/g, '\n');
}

export type TryCopyTextDeps = {
    writeText?: (text: string) => Promise<void>
};

/**
 * Copy text like app `useCopyToClipboard`: succeed → true; failure → false.
 * Inject `writeText` in tests; browser path uses `navigator.clipboard.writeText`.
 */
export async function tryCopyText(text: string, deps: TryCopyTextDeps = {}): Promise<boolean> {
    if (!text) {
        return false;
    }

    const writeText = deps.writeText
        ?? (typeof navigator !== 'undefined' && navigator.clipboard?.writeText
            ? (value: string): Promise<void> => navigator.clipboard.writeText(value)
            : undefined);

    if (!writeText) {
        return false;
    }

    try {
        await writeText(text);
        return true;
    } catch {
        return false;
    }
}

/** File-extension → short language label for code-block chrome. */
const EXT_KIND: ReadonlyArray<readonly [RegExp, string]> = [
    [/\.tsx$/i, 'TSX'],
    [/\.ts$/i, 'TS'],
    [/\.jsx$/i, 'JSX'],
    [/\.(?:js|mjs|cjs)$/i, 'JS'],
    [/\.json$/i, 'JSON'],
    [/\.(?:md|mdx)$/i, 'MD'],
    [/\.(?:css|scss)$/i, 'CSS'],
    [/\.py$/i, 'PY'],
    [/\.go$/i, 'GO'],
    [/\.(?:rs)$/i, 'RS'],
    [/\.(?:ya?ml)$/i, 'YML'],
];

export function fileKindFromName(name: string): string | null {
    for (const [re, kind] of EXT_KIND) {
        if (re.test(name)) {
            return kind;
        }
    }
    return null;
}

/** Fence language → tab label when the block has no `title="…"`. */
export function defaultTitleFromLang(lang: string): string {
    const id = lang.trim().toLowerCase();
    return id || 'code';
}

/** True when the title looks like a path/filename (not a bare language id). */
export function isFilePathTitle(title: string): boolean {
    return title.includes('/') || /\.[a-z0-9]+$/i.test(title);
}

/** Language id / filename → short chip (TS, JS, …). */
export function kindFromTitle(title: string): string | null {
    if (isFilePathTitle(title)) {
        const base = title.includes('/') ? title.slice(title.lastIndexOf('/') + 1) : title;
        return fileKindFromName(base);
    }
    const lang = title.trim().toLowerCase();
    const LANG_KIND: Record<string, string> = {
        typescript: 'TS',
        ts: 'TS',
        tsx: 'TSX',
        javascript: 'JS',
        js: 'JS',
        jsx: 'JSX',
        mjs: 'JS',
        cjs: 'JS',
        json: 'JSON',
        markdown: 'MD',
        md: 'MD',
        mdx: 'MD',
        css: 'CSS',
        scss: 'CSS',
        python: 'PY',
        py: 'PY',
        go: 'GO',
        rust: 'RS',
        rs: 'RS',
        yaml: 'YML',
        yml: 'YML',
    };
    return LANG_KIND[lang] ?? null;
}

const COPY_ICON_SVG =
    '<svg class="cs-copy-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg>';

const CHECK_ICON_SVG =
    '<svg class="cs-copy-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg>';

function idleLabelOf(button: HTMLButtonElement): string {
    return button.dataset.csCopyIdleLabel || copyButtonContent(false).label;
}

function escapeAttr(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

export function paintCopyButton(button: HTMLButtonElement, isCopied: boolean): void {
    const {label, state} = copyButtonContent(isCopied, idleLabelOf(button));
    button.classList.toggle('cs-copied', isCopied);
    button.dataset.csCopyState = state;
    button.title = isCopied ? 'Copied!' : 'Copy to clipboard';
    button.replaceChildren();
    const icon = document.createElement('span');
    icon.className = 'cs-copy-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = isCopied ? CHECK_ICON_SVG : COPY_ICON_SVG;
    const text = document.createElement('span');
    text.className = 'cs-copy-label';
    text.textContent = label;
    button.append(icon, text);
}

const copyResetTimers = new WeakMap<HTMLButtonElement, ReturnType<typeof setTimeout>>();

/** Green “Copied!” then restore the idle label after COPY_FEEDBACK_MS. */
export function showCopySuccess(button: HTMLButtonElement): void {
    paintCopyButton(button, true);
    const previous = copyResetTimers.get(button);
    if (previous !== undefined) {
        clearTimeout(previous);
    }
    copyResetTimers.set(button, setTimeout(() => {
        paintCopyButton(button, false);
        copyResetTimers.delete(button);
    }, COPY_FEEDBACK_MS));
}

/** Idle chrome used by docs EC and explorer MCP / Try it copy controls. */
export function copyButtonMarkup(attrs: {
    copyTarget?: string
    copyValue?: string
    id?: string
    label?: string
} = {}): string {
    const {label} = copyButtonContent(false, attrs.label);
    const extra = [
        attrs.id === undefined ? '' : ` id="${escapeAttr(attrs.id)}"`,
        attrs.copyTarget === undefined ? '' : ` data-copy-target="${escapeAttr(attrs.copyTarget)}"`,
        attrs.copyValue === undefined ? '' : ` data-copy="${escapeAttr(attrs.copyValue)}"`,
        attrs.label === undefined ? '' : ` data-cs-copy-idle-label="${escapeAttr(attrs.label)}"`,
    ].join('');
    return (
        `<button type="button" class="cs-copy-btn" title="Copy to clipboard" data-cs-copy-state="idle"${extra}>` +
        `<span class="cs-copy-icon" aria-hidden="true">${COPY_ICON_SVG}</span>` +
        `<span class="cs-copy-label">${escapeAttr(label)}</span>` +
        `</button>`
    );
}

function createKindMark(kind: string): HTMLElement {
    const badge = document.createElement('span');
    badge.className = 'cs-code-kind';
    badge.dataset.kind = kind;
    badge.textContent = kind;
    badge.setAttribute('aria-hidden', 'true');
    return badge;
}

function ensureDots(header: HTMLElement): void {
    let dots = header.querySelector(':scope > .cs-code-dots');
    if (!(dots instanceof HTMLElement)) {
        dots = document.createElement('span');
        dots.className = 'cs-code-dots';
        dots.setAttribute('aria-hidden', 'true');
        header.prepend(dots);
    }
    // One element + CSS mask (shared by terminal + editor frames) — no child spans
    dots.replaceChildren();
}

/**
 * Park the EC copy control in the chrome row and apply app copy feedback:
 * icon + “Copy” → green check + “Copied!” for COPY_FEEDBACK_MS.
 */
function ensureCopyInHeader(frame: HTMLElement, header: HTMLElement): void {
    const copy = frame.querySelector(':scope > .copy') ?? header.querySelector(':scope > .copy');
    if (!(copy instanceof HTMLElement)) {
        return;
    }
    if (copy.parentElement !== header) {
        header.append(copy);
    }

    const button = copy.querySelector(':scope > button');
    if (!(button instanceof HTMLButtonElement) || button.dataset.csCopyWired === '1') {
        return;
    }

    button.dataset.csCopyWired = '1';
    button.classList.add('cs-copy-btn');
    button.type = 'button';
    paintCopyButton(button, false);

    button.addEventListener('click', (event) => {
        // Own the clipboard path so we only show “Copied!” after a real success.
        event.preventDefault();
        event.stopPropagation();

        const text = ecDataCodeToText(button.dataset.code ?? '');
        void tryCopyText(text).then((ok) => {
            if (ok) {
                showCopySuccess(button);
            }
        });
    });
}

function buildTitleNodes(text: string): Node[] {
    const kind = kindFromTitle(text);
    const nodes: Node[] = [];

    if (kind) {
        nodes.push(createKindMark(kind));
    }

    const name = document.createElement('span');
    name.className = 'cs-code-name';

    if (!isFilePathTitle(text)) {
        const label = document.createElement('span');
        label.className = 'cs-code-file';
        label.textContent = text;
        name.append(label);
        nodes.push(name);
        return nodes;
    }

    const slash = text.lastIndexOf('/');
    const basename = slash === -1 ? text : text.slice(slash + 1);

    if (slash !== -1) {
        const dir = document.createElement('span');
        dir.className = 'cs-code-path';
        dir.textContent = text.slice(0, slash + 1);
        name.append(dir);
    }

    const file = document.createElement('span');
    file.className = 'cs-code-file';
    file.textContent = basename;
    name.append(file);
    nodes.push(name);

    return nodes;
}

function titleSourceText(title: HTMLElement): string {
    const path = title.querySelector('.cs-code-path')?.textContent ?? '';
    const file = title.querySelector('.cs-code-file')?.textContent ?? '';
    if (path || file) {
        return `${path}${file}`;
    }
    return (title.textContent ?? '').trim();
}

function enhanceTitle(frame: HTMLElement): void {
    const header = frame.querySelector(':scope > .header');
    const title = frame.querySelector(':scope > .header .title');
    if (!(header instanceof HTMLElement) || !(title instanceof HTMLElement)) {
        return;
    }

    ensureDots(header);
    ensureCopyInHeader(frame, header);

    if (frame.classList.contains('is-terminal')) {
        title.dataset.csEnhanced = '1';
        return;
    }

    if (title.dataset.csEnhanced === '1' && title.querySelector('.cs-code-name')) {
        return;
    }

    const text = titleSourceText(title);
    if (!text) {
        title.dataset.csEnhanced = '1';
        return;
    }

    title.replaceChildren(...buildTitleNodes(text));
    title.dataset.csEnhanced = '1';
}

export function enhanceCodeBlockTitles(root: ParentNode = document): void {
    const frames = Array.from(
        root.querySelectorAll('.expressive-code .frame.has-title, .expressive-code .frame.is-terminal'),
    );
    for (const frame of frames) {
        if (frame instanceof HTMLElement) {
            enhanceTitle(frame);
        }
    }
}
