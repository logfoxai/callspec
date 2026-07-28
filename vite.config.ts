import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist/callsheet/ui',
        emptyOutDir: true,
        lib: {
            entry: path.resolve(__dirname, 'src/callsheet/ui/main.ts'),
            formats: ['iife'],
            name: 'Callsheet',
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
