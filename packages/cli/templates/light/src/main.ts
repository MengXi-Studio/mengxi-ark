import { createApp } from 'vue'
import '@mengxi-ark/theme'
// 组件布局样式随包独立 css 产物（Vite lib mode 抽离，不自动注入），需按用到的包显式引入
import '@mengxi-ark/components/style.css'
import '@mengxi-ark/biz-components/style.css'
// 默认适配器为 Ant Design Vue：引入 antd reset 基线样式（UI 库控件样式经 CSS-in-JS 注入）
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'

createApp(App).mount('#app')
