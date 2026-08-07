import tseslint from 'typescript-eslint';

export default tseslint.config(
    {ignores: ['dist/**', 'docs-site/**', 'docs/.vitepress/**', '.astro/**', 'node_modules/**', 'src/dist/**', 'eslint.config.mjs', 'vite.config.mts', 'astro.config.mjs', 'scripts/**', 'src/callspec-ui/ui/**', 'src/content/**', 'src/styles/**', 'assets/**']},
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
            'max-lines-per-function': 'off',
        },
    },
);
