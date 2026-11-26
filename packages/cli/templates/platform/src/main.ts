import { createApp } from 'vue'
import { createArkRuntime } from '@mengxi-ark/runtime'
import '@mengxi-ark/theme'
import '@mengxi-ark/runtime/style.css'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import { router } from './router'
import { systemModule } from './modules/systemModule'

// createArkRuntime：Vue 插件 + 实例句柄二合一
const runtime = createArkRuntime({
	router,
	context: {
		appName: '__PROJECT_NAME__',
		user: { id: 1, name: '管理员' },
		permissions: ['system:user:view'],
		// Lov 值集缓存（biz-components inject 探测命中即复用）
		lovCache: {
			STATUS: [
				{ label: '启用', value: '1' },
				{ label: '停用', value: '0' }
			]
		}
	},
	modules: [systemModule],
	homeTab: { route: '/home', title: '首页' },
	onSessionExpired: () => {
		// 登出决策由基座注册方决定（hook 自身不跳转路由）
		console.warn('会话已过期，可在此跳转登录页')
	}
})

const app = createApp(App)
app.use(router)
app.use(runtime)
app.mount('#app')
