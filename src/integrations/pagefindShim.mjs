import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Starlight writes /pagefind/ during astro build; the cs-pagefind shim must follow. */
export function pagefindShimIntegration() {
	return {
		name: 'callspec-pagefind-shim',
		hooks: {
			'astro:build:done': () => {
				const result = spawnSync(process.execPath, ['scripts/write-cs-pagefind-shim.mjs'], {
					cwd: root,
					stdio: 'inherit',
				});
				if (result.status !== 0) {
					throw new Error('write-cs-pagefind-shim failed');
				}
			},
		},
	};
}
