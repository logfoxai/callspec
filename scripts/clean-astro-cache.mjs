#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {astroDevPortsInUse} from '../src/integrations/assertAstroDevFree.mjs';
import {cleanAstroCache} from '../src/integrations/cleanAstroCache.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const busy = await astroDevPortsInUse();

if (busy.length > 0) {
    console.error(
        `Refusing to wipe .astro while dev is listening on port(s) ${busy.join(', ')}. ` +
        'Stop astro:dev first — deleting the content cache mid-session breaks sidebar slugs.',
    );
    process.exit(1);
}

cleanAstroCache(root);
console.log('clean-astro-cache: wiped .astro and node_modules/.vite');
