import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import {rewritePublicFontsForLibBuild} from './src/callspec-ui/ui/explorerFontsLib.mjs';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function rewriteExplorerCss(code: string, id: string) {
    const file = id.split('?')[0];

    if (!file.endsWith('styles.css') || !code.includes('docs-tokens.css')) {
        return null;
    }

    const tokensPath = path.join(path.dirname(file), 'docs-tokens.css');
    const hoisted: string[] = [];
    let tokens = rewritePublicFontsForLibBuild(fs.readFileSync(tokensPath, 'utf8'));

    tokens = tokens.replace(/@import\s+[^;]+;\s*/g, (statement) => {
        hoisted.push(statement.trim());
        return '';
    });

    let next = code.replace(/@import\s+['"][^'"]*docs-tokens\.css['"];?\s*/, `${tokens}\n`);

    next = next.replace(/@import\s+[^;]+;\s*/g, (statement) => {
        hoisted.push(statement.trim());
        return '';
    });

    next = `${hoisted.join('\n')}\n${next}`;

    return {code: next, map: null};
}

export default defineConfig({
    base: './',
    plugins: [
        {
            name: 'callspec-bundle-explorer-fonts',
            apply: 'build',
            enforce: 'pre',
            resolveId(source) {
                if (source.startsWith('/fonts/') && source.endsWith('.woff2')) {
                    return `${path.resolve(rootDir, 'assets', source.slice(1))}?no-inline`;
                }
            },
            load(id) {
                const file = id.split('?')[0];

                if (!file.endsWith('docs-tokens.css')) {
                    return;
                }

                return rewritePublicFontsForLibBuild(fs.readFileSync(file, 'utf8'));
            },
            transform(code, id) {
                return rewriteExplorerCss(code, id);
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
