import { createApp } from 'vue'
import { CloudFilled, LogoutOutlined, UserOutlined } from '@ant-design/icons-vue'
import { createArkRuntime } from '@mengxi-ark/runtime'
import '@mengxi-ark/theme'
// 组件布局样式随包独立 css 产物（Vite lib mode 抽离，不自动注入），需按用到的包显式引入
import '@mengxi-ark/runtime/style.css'
import '@mengxi-ark/components/style.css'
import '@mengxi-ark/biz-components/style.css'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import { router } from './router'
import { systemModule } from './modules/systemModule'

// createArkRuntime：Vue 插件 + 实例句柄二合一
const runtime = createArkRuntime({
	router,
	// 品牌 logo：图标组件（也可传图片地址字符串；不传则降级为 appName 首字方块）
	logo: CloudFilled,
	// 声明式用户菜单：保留内置头像 + 用户名，点击弹出下拉
	// （需整体替换用户区时传 user: 自定义组件，传后 userMenu 忽略）
	userMenu: {
		items: [
			{ key: 'profile', label: '个人中心', icon: UserOutlined },
			{ key: 'logout', label: '退出登录', icon: LogoutOutlined, divided: true }
		],
		onClick: key => {
			if (key === 'profile') console.log('跳转个人中心')
			if (key === 'logout') console.log('在此调用登出逻辑')
		}
	},
	// 页签右键菜单：默认含内置项（刷新 / 关闭左侧 / 右侧 / 其他，自动禁用）
	// items 追加自定义项，onClick 接收 (itemKey, tabKey)
	tabContextMenu: {
		items: [{ key: 'pin', label: '固定页签' }],
		onClick: (itemKey, tabKey) => {
			if (itemKey === 'pin') console.log('固定页签：', tabKey)
		}
	},
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
	// 首页页签（不可关闭；不传则无首页页签）
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
