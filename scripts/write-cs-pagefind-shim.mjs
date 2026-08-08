import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';

const engineSpecifier = '../pagefind/pagefind.js';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs-site');
const enginePath = path.join(outDir, 'pagefind', 'pagefind.js');
const outfile = path.join(outDir, 'cs-pagefind', 'pagefind.js');
const entry = path.join(root, 'src', 'cs-pagefind', 'pagefind.ts');

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

console.log('write-cs-pagefind-shim: wrote', path.relative(root, outfile));
