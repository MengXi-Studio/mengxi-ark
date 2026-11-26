import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	// SFC 组件测试需要 @vitejs/plugin-vue 编译单文件组件
	plugins: [vue()],
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
