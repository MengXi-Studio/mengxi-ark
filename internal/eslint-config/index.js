import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['**/dist/**', 'node_modules/**', 'coverage/**', '.turbo/**', 'pnpm-lock.yaml'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ['**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['**/__tests__/**'],
    rules: {
      'vue/one-component-per-file': 'off',
    },
  },
];
