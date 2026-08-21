import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import {rewritePublicFontsForLibBuild} from './src/callspec-ui/ui/explorerFontsLib.mjs';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    base: './',
    plugins: [
        {
            name: 'callspec-bundle-explorer-fonts',
            apply: 'build',
            enforce: 'pre',
            transform(code, id) {
                const file = id.split('?')[0];

                if (!file.endsWith('docs-tokens.css')) {
                    return;
                }

                return {
                    code: rewritePublicFontsForLibBuild(code),
                    map: null,
                };
            },
        },
    ],
    build: {
        outDir: 'dist/callspec-ui/ui',
        emptyOutDir: true,
        lib: {
            entry: path.resolve(rootDir, 'src/callspec-ui/ui/main.ts'),
            formats: ['iife'],
            name: 'CallspecUi',
            fileName: () => 'assets/app.js',
        },
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name][extname]',
                inlineDynamicImports: true,
            },
        },
    },
});
