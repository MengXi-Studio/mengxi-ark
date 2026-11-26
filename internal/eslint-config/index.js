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
    // 浏览器运行环境全局（console / DOM 事件等，vue + ts 源码共用）
    files: ['**/*.ts', '**/*.vue'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // cli 为 Node 包（fs / path / process 等）
    files: ['packages/cli/**/*.ts', 'packages/cli/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
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
