import tseslint from 'typescript-eslint';

export default tseslint.config(
    {ignores: ['dist/**', 'node_modules/**', 'src/dist/**', 'eslint.config.mjs', 'vite.config.ts', 'scripts/**', 'src/callspec-ui/ui/**', 'docs/.vitepress/**']},
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
