import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default [
	{
		ignores: ['**/dist/**', 'node_modules/**', 'coverage/**', '.turbo/**', '**/.vitepress/cache/**', 'pnpm-lock.yaml']
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...pluginVue.configs['flat/recommended'],
	{
		files: ['**/*.vue'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		}
	},
	{
		// 浏览器运行环境全局（console / DOM 事件等，vue + ts 源码共用）
		files: ['**/*.ts', '**/*.vue'],
		languageOptions: {
			globals: { ...globals.browser }
		}
	},
	{
		// cli 为 Node 包（fs / path / process 等）
		files: ['packages/cli/**/*.ts', 'packages/cli/**/*.js'],
		languageOptions: {
			globals: { ...globals.node }
		}
	},
	{
		files: ['**/*.mjs', '**/*.cjs'],
		languageOptions: {
			globals: globals.node
		}
	},
	{
		rules: {
			'vue/multi-word-component-names': 'off',
			// 下划线前缀 = 有意占位的未使用参数/变量（如适配器对齐 UI 库签名的 _column / _event）
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			// Vue 3 无 filter 语法；模板中 TS 联合类型（as string | number | null）会被该规则误报
			'vue/no-deprecated-filter': 'off'
		}
	},
	{
		files: ['**/__tests__/**'],
		rules: {
			'vue/one-component-per-file': 'off'
		}
	},
	// 关闭与 prettier 冲突的格式规则（必须放最后，prettier 负责格式，eslint 负责质量）
	prettierConfig
]
