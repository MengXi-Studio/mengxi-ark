import { createApp } from 'vue'
import { CloudFilled, LogoutOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { createArkRuntime } from '@mengxi-ark/runtime'
import '@mengxi-ark/theme'
// 组件布局样式随包独立 css 产物（Vite lib mode 抽离，不自动注入），需按用到的包显式引入
import '@mengxi-ark/runtime/style.css'
import '@mengxi-ark/components/style.css'
import '@mengxi-ark/biz-components/style.css'
import '@mengxi-ark/dsl-render/style.css'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import { router } from './router'
import { systemModule } from './modules/systemModule'
import { bizModule } from './modules/bizModule'
import { createMockLovApi } from './mock-api'

const router$ = router

// createArkRuntime：Vue 插件 + 实例句柄二合一（模块路由在其内部即注册，早于首次导航）
const runtime = createArkRuntime({
	router: router$,
	logo: CloudFilled, // 也可传图片地址字符串；不传则降级为 appName 首字方块
	userMenu: {
		// 声明式用户菜单：保留内置头像 + 用户名，点击弹出下拉（如需整体替换用户区，传 user: 自定义组件）
		items: [
			{ key: 'profile', label: '个人中心', icon: UserOutlined },
			{ key: 'logout', label: '退出登录', icon: LogoutOutlined, divided: true }
		],
		onClick: key => {
			if (key === 'profile') message.info('演示：跳转个人中心')
			if (key === 'logout') message.info('演示：在此调用登出逻辑')
		}
	},
	context: {
		appName: '曦舟中台示例',
		user: { id: 1, name: '基座用户' },
		tenant: { id: 1, name: '梦曦工作室' },
		permissions: ['base:view'],
		lovListApi: createMockLovApi(),
		lovCache: {
			STATUS: [
				{ label: '启用', value: '1' },
				{ label: '停用', value: '0' }
			],
			GENDER: [
				{ label: '男', value: 'M' },
				{ label: '女', value: 'F' }
			]
		}
	},
	modules: [systemModule, bizModule],
	homeTab: { route: '/system/users', title: '用户管理' },
	onSessionExpired: () => {
		// 登出决策由基座注册方决定（hook 自身不跳转路由）
		console.warn('[demo-platform] 会话已过期，可在此跳转登录页')
	}
})

const app = createApp(App)
app.use(router$)
app.use(runtime)
app.mount('#app')
