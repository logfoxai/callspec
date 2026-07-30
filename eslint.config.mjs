import tseslint from 'typescript-eslint';
import packageJson from 'eslint-plugin-package-json';
import * as jsoncParser from 'jsonc-eslint-parser';

export default tseslint.config(
    {ignores: ['dist/**', 'node_modules/**', 'src/dist/**', 'eslint.config.mjs', 'vite.config.ts', 'scripts/**', 'src/callspec-ui/ui/**']},
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
    {
        files: ['package.json'],
        languageOptions: {
            parser: jsoncParser,
        },
        plugins: {
            'package-json': packageJson,
        },
        rules: {
            'package-json/no-local-dependencies': ['error', {ignorePrivate: false}],
        },
    },
);
