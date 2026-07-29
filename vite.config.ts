import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist/callspec-ui/ui',
        emptyOutDir: true,
        lib: {
            entry: path.resolve(__dirname, 'src/callspec-ui/ui/main.ts'),
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
