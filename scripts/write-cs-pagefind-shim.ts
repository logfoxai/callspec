import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';

const engineSpecifier = '../pagefind/pagefind.js';

export async function writeCsPagefindShim(root?: string): Promise<void> {
    const repoRoot = root ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
    const outDir = path.join(repoRoot, 'docs-site');
    const enginePath = path.join(outDir, 'pagefind', 'pagefind.js');
    const outfile = path.join(outDir, 'cs-pagefind', 'pagefind.js');
    const entry = path.join(repoRoot, 'src', 'cs-pagefind', 'pagefind.ts');

    try {
        await fs.access(enginePath);
    } catch {
        console.error('write-cs-pagefind-shim: no pagefind index at', enginePath);
        process.exit(1);
    }

    await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        outfile,
        // Keep the real engine as a runtime import next to the shim.
        external: [engineSpecifier],
        logLevel: 'silent',
    });

    console.log('write-cs-pagefind-shim: wrote', path.relative(repoRoot, outfile));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
    writeCsPagefindShim().catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    });
}
