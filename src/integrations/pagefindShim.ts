import type {AstroIntegration} from 'astro';
import {writeCsPagefindShim} from '../../scripts/write-cs-pagefind-shim.ts';

/** Starlight writes /pagefind/ during astro build; the cs-pagefind shim must follow. */
export function pagefindShimIntegration(): AstroIntegration {
    return {
        name: 'callspec-pagefind-shim',
        hooks: {
            'astro:build:done': async () => {
                await writeCsPagefindShim();
            },
        },
    };
}
