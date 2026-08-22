/** Keep in sync with CALLSPEC_HEX_PATH / CALLSPEC_EQ_BARS in icons.ts. */
const HEX =
    'M30.9 4.635A2.2 2.2 0 0 1 33.1 4.635L55.149 17.365A2.2 2.2 0 0 1 56.249 19.27V44.73A2.2 2.2 0 0 1 55.149 46.635L33.1 59.365A2.2 2.2 0 0 1 30.9 59.365L8.851 46.635A2.2 2.2 0 0 1 7.751 44.73V19.27A2.2 2.2 0 0 1 8.851 17.365Z';

/** Overlay bars — no mask id. `<base href="/demo/">` breaks `url(#mask)`. */
const EQ_BARS = [
    {x: 19, y: 24, width: 26, height: 6, rx: 3, cls: 'cs-eq cs-eq--top'},
    {x: 19, y: 34, width: 26, height: 6, rx: 3, cls: 'cs-eq cs-eq--bottom'},
];

/** Sync in <head> — default dark so refresh never paints the UA white page. */
export const THEME_BOOT_SCRIPT = `(function(){var t=localStorage.getItem('starlight-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.dataset.theme=t;})();`;

/** First-paint CSS — HMR loads explorer styles after this HTML. Dark until light is known. */
export const LOADING_BOOT_STYLE = `
html, body, #app.loading {
    background: hsl(228, 22%, 6%);
    color-scheme: dark;
}
html[data-theme='light'],
html[data-theme='light'] body,
html[data-theme='light'] #app.loading {
    background: hsl(228, 24%, 97%);
    color-scheme: light;
}
#app.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
}
body:has(#app.loading) > .footer {
    display: none;
}
.cs-boot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.15rem;
    color: #d8dbe6;
    font-family: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
    opacity: 0;
    transform: scale(0.92);
    animation: cs-boot-enter 0.55s ease 0.4s both;
}
html[data-theme='light'] .cs-boot {
    color: #1b1e2a;
}
.cs-boot .cs-lockup {
    display: inline-flex;
    align-items: center;
    gap: 0.18rem;
    line-height: 1;
    color: inherit;
    --cs-lockup-mark-size: 2.75rem;
}
.cs-boot .cs-lockup__mark {
    display: block;
    flex: none;
    width: var(--cs-lockup-mark-size);
    height: var(--cs-lockup-mark-size);
    color: inherit;
    animation: none;
    transform: none;
}
.cs-boot .cs-lockup__word {
    font-family: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: inherit;
    display: flex;
    align-items: center;
    height: var(--cs-lockup-mark-size);
    line-height: 1;
    transform: translateY(-0.06em);
}
.cs-boot .cs-hex {
    fill: currentColor;
}
.cs-boot .cs-eq {
    fill: hsl(228, 22%, 6%);
    transform-box: fill-box;
    transform-origin: left center;
}
html[data-theme='light'] .cs-boot .cs-eq {
    fill: hsl(228, 24%, 97%);
}
.cs-boot .cs-eq--top {
    animation: cs-boot-eq 1.8s cubic-bezier(0.22, 0.7, 0.24, 1) infinite;
}
.cs-boot .cs-eq--bottom {
    animation: cs-boot-eq 1.8s cubic-bezier(0.22, 0.7, 0.24, 1) 0.45s infinite both;
}
.cs-boot__label {
    margin: 0;
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: inherit;
}
@keyframes cs-boot-eq {
    0% { transform: scaleX(0); }
    100% { transform: scaleX(1); }
}
@keyframes cs-boot-enter {
    to {
        opacity: 1;
        transform: scale(1);
    }
}
@media (prefers-reduced-motion: reduce) {
    .cs-boot {
        transform: none;
        animation-name: cs-boot-fade;
    }
    .cs-boot .cs-eq--top,
    .cs-boot .cs-eq--bottom {
        animation: none;
    }
}
@keyframes cs-boot-fade {
    to { opacity: 1; }
}
`.trim();

/**
 * Blocking dark boot at the start of <head> (survives Vite injecting /@vite/client).
 */
export function injectChirpDemoBoot(html: string): string {
    let out = html;

    if (!/\sdata-theme=/.test(out)) {
        out = out.replace(/<html\b/, '<html data-theme="dark"');
    }

    out = out.replace(/<style>[\s\S]*?\.cs-boot[\s\S]*?<\/style>\s*/g, '');
    out = out.replace(
        /<head[^>]*>/,
        (open) => `${open}\n<style>${LOADING_BOOT_STYLE}</style>\n<script>${THEME_BOOT_SCRIPT}</script>`,
    );

    return out;
}

export function renderLoadingAppHtml(): string {
    return `<div id="app" class="loading">
        <div class="cs-boot" role="status" aria-live="polite">
            <span class="cs-lockup" translate="no" aria-hidden="true">
                <svg class="cs-lockup__mark" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <path class="cs-hex" d="${HEX}" fill="currentColor"></path>
                    ${EQ_BARS.map((bar) =>
                        `<rect class="${bar.cls}" x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" rx="${bar.rx}"></rect>`).join('')}
                </svg>
                <span class="cs-lockup__word">callspec</span>
            </span>
            <p class="cs-boot__label">Loading Docs...</p>
        </div>
    </div>`;
}
