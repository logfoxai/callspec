import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
            },
        },
    },
});
