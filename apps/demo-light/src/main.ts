import { createApp } from 'vue'
import { MX_I18N_KEY, createI18n, vPermission } from '@mengxi-ark/hooks'
import '@mengxi-ark/theme'
// 组件布局样式随包独立 css 产物（Vite lib mode 抽离，不自动注入），需按用到的包显式引入
import '@mengxi-ark/components/style.css'
import '@mengxi-ark/biz-components/style.css'
import '@mengxi-ark/dsl-render/style.css'
// 默认适配器为 Ant Design Vue：引入 antd reset 基线样式（UI 库控件样式经 CSS-in-JS 注入）
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'

// i18n 实例经 provide 下发，组件内 useI18n() inject 复用（文档与 demo 保持一致）
const i18n = createI18n({
	locale: 'zh-CN',
	fallbackLocale: 'zh-CN',
	messages: {
		'zh-CN': {
			demo: {
				currentLanguage: '当前语言',
				greeting: '你好，{name}！欢迎来到曦舟轻量模式'
			}
		},
		'en-US': {
			demo: {
				currentLanguage: 'Current language',
				greeting: 'Hello, {name}! Welcome to MengXi Ark light mode'
			}
		}
	}
})

const app = createApp(App)

app.provide(MX_I18N_KEY, i18n)
app.directive('permission', vPermission)
app.mount('#app')
