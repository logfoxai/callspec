/** Inline SVG icons — 1.5px stroke to match → / ↗ text arrows elsewhere in the callspec UI. */

const SVG_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

/** Starlight Icon.astro — filled paths, matches docs ThemeSelect slider. */
const STARLIGHT_ICON_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"';

export function themeSunIcon(): string {

    return `<svg ${STARLIGHT_ICON_ATTRS}><path d="M5 12a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1Zm.64 5-.71.71a1 1 0 0 0 0 1.41 1 1 0 0 0 1.41 0l.71-.71A1 1 0 0 0 5.64 17ZM12 5a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v1a1 1 0 0 0 1 1Zm5.66 2.34a1 1 0 0 0 .7-.29l.71-.71a1 1 0 1 0-1.41-1.41l-.66.71a1 1 0 0 0 0 1.41 1 1 0 0 0 .66.29Zm-12-.29a1 1 0 0 0 1.41 0 1 1 0 0 0 0-1.41l-.71-.71a1.004 1.004 0 1 0-1.43 1.41l.73.71ZM21 11h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2Zm-2.64 6A1 1 0 0 0 17 18.36l.71.71a1 1 0 0 0 1.41 0 1 1 0 0 0 0-1.41l-.76-.66ZM12 6.5a5.5 5.5 0 1 0 5.5 5.5A5.51 5.51 0 0 0 12 6.5Zm0 9a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm0 3.5a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1Z"/></svg>`;

}

export function themeMoonIcon(): string {

    return `<svg ${STARLIGHT_ICON_ATTRS}><path d="M21.64 13a1 1 0 0 0-1.05-.14 8.049 8.049 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14 11.69 1 1 0 0 0-.36-1.05Zm-9.5 6.69A8.14 8.14 0 0 1 7.08 5.22v.27a10.15 10.15 0 0 0 10.14 10.14 9.784 9.784 0 0 0 2.1-.22 8.11 8.11 0 0 1-7.18 4.32v-.04Z"/></svg>`;

}

export function paginationLeftArrowIcon(): string {

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M17 11H9.41l3.3-3.29a1.004 1.004 0 1 0-1.42-1.42l-5 5a1 1 0 0 0-.21.33 1 1 0 0 0 0 .76 1 1 0 0 0 .21.33l5 5a1.002 1.002 0 0 0 1.639-.325 1 1 0 0 0-.219-1.095L9.41 13H17a1 1 0 0 0 0-2Z"/></svg>`;

}

export function paginationRightArrowIcon(): string {

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M17.92 11.62a1.001 1.001 0 0 0-.21-.33l-5-5a1.003 1.003 0 1 0-1.42 1.42l3.3 3.29H7a1 1 0 0 0 0 2h7.59l-3.3 3.29a1.002 1.002 0 0 0 .325 1.639 1 1 0 0 0 1.095-.219l5-5a1 1 0 0 0 .21-.33 1 1 0 0 0 0-.76Z"/></svg>`;

}

/** House for the explorer sidebar Home link. */
export function homeIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><path d="M4 10.75 12 4l8 6.75"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-6h4v6"/></svg>`;

}

/** List for the explorer sidebar Routes catalog link. */
export function routesIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><path d="M9 6h12"/><path d="M9 12h12"/><path d="M9 18h12"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`;

}

/** Price-tag shape for sidebar route category groups. */
export function tagIcon(): string {

    return `<svg ${SVG_ATTRS} aria-hidden="true"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="7" cy="7" r="1.25" fill="currentColor" stroke="none"/></svg>`;

}

export function unlockIcon(): string {

    return `<svg ${SVG_ATTRS} class="icon-lock" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 9.5-1"/><rect x="5" y="11" width="14" height="10" rx="2"/></svg>`;

}

export function lockIcon(): string {

    return `<svg ${SVG_ATTRS} class="icon-lock" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;

}

/** Official MCP connector mark (modelcontextprotocol.io favicon), currentColor. */
export function mcpIcon(): string {

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" aria-hidden="true"><path d="M18 84.853 85.882 16.971c9.373-9.373 24.569-9.373 33.941 0s9.373 24.569 0 33.941L68.558 102.177"/><path d="m69.265 101.47 50.558-50.558c9.373-9.373 24.569-9.373 33.942 0l.353.353c9.373 9.373 9.373 24.569 0 33.941L92.725 146.6c-3.124 3.124-3.124 8.189 0 11.313l12.606 12.607"/><path d="m102.853 33.941-50.205 50.205c-9.372 9.372-9.372 24.568 0 33.941s24.569 9.372 33.941 0l50.205-50.205"/></svg>`;

}

/** Hex outline — same path as the header lockup in SiteTitle / CallspecLockup. */
export const CALLSPEC_HEX_PATH =
    'M30.9 4.635A2.2 2.2 0 0 1 33.1 4.635L55.149 17.365A2.2 2.2 0 0 1 56.249 19.27V44.73A2.2 2.2 0 0 1 55.149 46.635L33.1 59.365A2.2 2.2 0 0 1 30.9 59.365L8.851 46.635A2.2 2.2 0 0 1 7.751 44.73V19.27A2.2 2.2 0 0 1 8.851 17.365Z';

/** Equals cutouts — same rects as the header lockup mask (26×6 at x=19). */
export const CALLSPEC_EQ_BARS = [
    {x: 19, y: 24, width: 26, height: 6, rx: 3},
    {x: 19, y: 34, width: 26, height: 6, rx: 3},
] as const;

function evenoddPillPath(x: number, y: number, width: number, height: number): string {

    const radius = height / 2;
    const left = x + radius;
    const right = x + width - radius;
    const bottom = y + height;

    return `M${left} ${y}H${right}A${radius} ${radius} 0 0 1 ${right} ${bottom}H${left}A${radius} ${radius} 0 0 1 ${left} ${y}Z`;

}

/** Evenodd path for static marks (favicon, explorer, assets). */
export function callspecMarkPathD(): string {

    return CALLSPEC_HEX_PATH + CALLSPEC_EQ_BARS.map((bar) =>
        evenoddPillPath(bar.x, bar.y, bar.width, bar.height)).join('');

}

/** Official OpenAPI logo — matches splash homepage surface icon. */
export function openApiIcon(): string {

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.039 0a2.959 2.959 0 00-2.65 4.274l-6.447 6.447a2.96 2.96 0 101.335 1.336l6.447-6.447A2.959 2.959 0 1021.04 0zM10.628 2.745c-.072 0-.143.003-.214.004-.072.002-.143.002-.215.005-.447.018-.893.064-1.335.138l-.03.005-.185.033-.105.02a7.718 7.718 0 00-.289.062l-.032.008a10.69 10.69 0 00-2.55.95l-.155.089c-.063.034-.125.07-.187.105-.046.027-.093.051-.14.079H5.19l-.01.005-.036.02v.002l.111.184 3.15 5.23a4.168 4.168 0 01.38-.202 4.294 4.294 0 011.628-.413c.071-.004.143-.008.214-.008zm.428.01v6.333c.325.034.647.103.96.209l4.66-4.66c-.173-.12-.348-.237-.528-.347l-.026-.015c-.056-.035-.112-.067-.168-.1l-.098-.056-.099-.055a12.735 12.735 0 00-.171-.092l-.027-.014a10.628 10.628 0 00-1.425-.617c-.69-.241-1.403-.41-2.128-.505l-.089-.012-.09-.01a6.56 6.56 0 00-.17-.019l-.049-.004-.204-.017a6.44 6.44 0 00-.255-.015c-.031-.003-.062-.003-.093-.004zM4.782 4.498a9.92 9.92 0 00-1.36 1.062l4.461 4.461.018.018c.049-.04.098-.078.149-.116l-.011-.018zm-1.67 1.36c-.05.05-.098.103-.147.154l-.149.155c-.33.357-.63.73-.902 1.118l-.039.056a10.588 10.588 0 00-.216.326 10.6 10.6 0 00-1.65 5.276l-.006.215-.003.214h6.317c0-.072.007-.143.01-.214.005-.072.006-.144.013-.215.081-.822.399-1.625.952-2.3.045-.055.096-.106.144-.16.048-.052.093-.107.144-.158zm16.255 1.464l-4.663 4.663c.106.312.175.634.21.959h6.332l-.004-.094a11.579 11.579 0 00-.032-.456l-.005-.052a13.044 13.044 0 00-.026-.241v-.009l-.033-.24v-.009a10.618 10.618 0 00-.327-1.493l-.003-.01a15.839 15.839 0 00-.07-.228l-.01-.03a14.111 14.111 0 00-.069-.204l-.02-.055a5.65 5.65 0 00-.153-.405 7.84 7.84 0 00-.093-.227 16.67 16.67 0 00-.063-.144l-.037-.081a13.776 13.776 0 00-.08-.171l-.024-.052-.096-.194-.014-.027a11.2 11.2 0 00-.112-.212l-.004-.008a10.615 10.615 0 00-.604-.98zm-4.43 6.05c0 .071-.006.142-.01.214-.003.072-.005.143-.012.214a4.29 4.29 0 01-.952 2.301c-.045.055-.096.107-.144.16-.048.053-.093.108-.144.159l4.467 4.467c.051-.051.099-.104.148-.155.05-.052.1-.103.148-.155.331-.358.633-.733.905-1.122l.032-.046.098-.144.085-.13.04-.063a10.597 10.597 0 001.647-5.272c.003-.071.004-.143.006-.214.001-.071.004-.143.004-.214zM.01 13.8l.004.093.01.179.005.076.017.206.005.046c.007.076.015.153.024.228l.003.022a9.605 9.605 0 00.033.248c.072.505.182 1.005.327 1.497l.002.006c.022.077.047.154.071.23l.004.014.005.014a15.737 15.737 0 00.153.439l.03.08.059.148a7.702 7.702 0 00.093.228l.062.14.038.084.078.169.027.054a10.677 10.677 0 00.225.441l.025.043 5.408-3.258.02-.012a4.314 4.314 0 01-.395-1.414h-.025zm.505 2.846l-.206.058.002.005zm6.425-1.052l-5.415 3.262c.083.139.17.273.259.406l.008.014.004.005.008.014h.001c.007.012.014.022.022.032l.001.002v.001a10.634 10.634 0 00.298.417l.006.008a9.963 9.963 0 00.29.368l.033.04c.043.052.086.103.13.153l.057.065.112.127.064.069.029.031.083.09.035.035c.049.051.098.103.149.153L7.58 16.42a3.86 3.86 0 01-.285-.321 4.422 4.422 0 01-.356-.505zm6.416 1.111c-.05.04-.1.079-.15.116l.011.018 3.257 5.407c.151-.099.3-.2.446-.307.315-.232.62-.484.914-.756l-4.46-4.46zm-5.457.003l-.015.015-4.46 4.46a8.966 8.966 0 00.195.176c.022.02.043.04.065.058l.152.13a10.622 10.622 0 00.215.174l.023.017.191.148.008.005c.268.2.547.389.834.564l.03.018.164.097.101.057a5.458 5.458 0 00.27.148c.008.004.016.01.025.013.162.085.327.164.493.24l.158-.385 2.243-5.448.009-.02a4.328 4.328 0 01-.701-.467zm4.951.353c-.061.037-.124.07-.187.104a4.318 4.318 0 01-3.271.336c-.069-.02-.135-.047-.203-.071-.067-.024-.136-.044-.202-.072l-2.242 5.444-.088.213-.075.183v.001l.017.007a.137.137 0 00.019.007l.005.003c.052.021.106.04.159.06.067.027.133.053.2.077l.102.04c.702.247 1.43.42 2.168.518l.087.012.09.01.172.019a7.173 7.173 0 00.252.022c.023.001.048.001.071.003l.184.011.112.005a7.06 7.06 0 00.358.007h.05a10.667 10.667 0 001.793-.15l.185-.034.105-.02.109-.023.18-.04.032-.008a10.684 10.684 0 002.55-.95c.052-.028.104-.06.156-.089.063-.034.125-.07.187-.105.043-.024.087-.047.13-.073h.001l.002-.002.002-.001.002-.001.007-.004.042-.025-.11-.183-.11-.184zm3.262 5.414l-.042.025.042-.024zm-.05.029zm-.005.004h-.002z"/></svg>`;

}
