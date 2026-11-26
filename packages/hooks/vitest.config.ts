import { defineConfig } from 'vitest/config'

export default defineConfig({
	// 指令 / provide 测试需要运行时模板编译，改用含编译器的完整构建
	resolve: {
		alias: {
			vue: 'vue/dist/vue.esm-bundler.js'
		}
	},
	define: {
		__VUE_OPTIONS_API__: true,
		__VUE_PROD_DEVTOOLS__: false,
		__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
	},
	test: {
		environment: 'happy-dom'
	}
})
