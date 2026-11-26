import { createApp } from 'vue'
import '@mengxi-ark/theme'
// 默认适配器为 Ant Design Vue：引入 antd reset 基线样式（组件样式经 CSS-in-JS 注入）
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'

createApp(App).mount('#app')
