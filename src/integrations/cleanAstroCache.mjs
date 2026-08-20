import fs from 'node:fs';
import path from 'node:path';

/** Compiler / prebundle dirs that survive `astro dev` restarts and go stale. */
export const ASTRO_DEV_CACHE_DIRS = ['.astro', path.join('node_modules', '.vite')];

export function cleanAstroCache(root) {
    for (const rel of ASTRO_DEV_CACHE_DIRS) {
        if (rel.includes('..') || path.isAbsolute(rel)) {
            throw new Error(`refusing to delete unsafe cache path: ${rel}`);
        }

        fs.rmSync(path.join(root, rel), {recursive: true, force: true});
    }
}
