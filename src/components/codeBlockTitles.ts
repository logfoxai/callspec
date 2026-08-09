/** Matches app-frontend `useCopyToClipboard` reset window. */
export const COPY_FEEDBACK_MS = 1500;

/** Idle / copied labels — same strings as app-frontend `Code` copy button. */
export function copyButtonContent(isCopied: boolean): {label: string; state: 'idle' | 'copied'} {
    return isCopied
        ? {label: 'Copied!', state: 'copied'}
        : {label: 'Copy', state: 'idle'};
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

const COPY_ICON_SVG =
    '<svg class="cs-copy-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg>';

const CHECK_ICON_SVG =
    '<svg class="cs-copy-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg>';

function renderCopyButton(button: HTMLButtonElement, isCopied: boolean): void {
    const {label, state} = copyButtonContent(isCopied);
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
 * Park the EC copy control in the chrome row and apply app-frontend copy feedback:
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
    renderCopyButton(button, false);

    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    button.addEventListener('click', () => {
        renderCopyButton(button, true);
        if (resetTimer !== undefined) {
            clearTimeout(resetTimer);
        }
        resetTimer = setTimeout(() => {
            renderCopyButton(button, false);
            resetTimer = undefined;
        }, COPY_FEEDBACK_MS);
    });
}

function buildTitleNodes(text: string): Node[] {
    const slash = text.lastIndexOf('/');
    const basename = slash === -1 ? text : text.slice(slash + 1);
    const kind = fileKindFromName(basename);
    const nodes: Node[] = [];

    if (kind) {
        nodes.push(createKindMark(kind));
    }

    const name = document.createElement('span');
    name.className = 'cs-code-name';

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
    for (const frame of root.querySelectorAll('.expressive-code .frame.has-title, .expressive-code .frame.is-terminal')) {
        if (frame instanceof HTMLElement) {
            enhanceTitle(frame);
        }
    }
}
