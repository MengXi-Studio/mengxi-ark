# 快速上手（轻量模式）

轻量模式不依赖任何基座：装包 → 引样式 → 写组件，三步即可在任意 Vue 3 项目中跑起来。本文按「从零到跑起来」的完整链路组织，所有示例与 `apps/demo-light` 工程保持一致，复制即可运行。

> 用不了几分钟：如果你只想用工具函数，装 3 个包就够了；要用现成组件（表格 / 查询表单 / Lov），再补 2 个包 + ant-design-vue。

## 第 1 步：安装

**基础三件套**（纯函数 / 主题 / hooks，零 UI 依赖）：

```bash
pnpm add @mengxi-ark/utils @mengxi-ark/theme @mengxi-ark/hooks
```

**使用现成组件时**，补装组件包与默认 UI 库（默认适配器为 Ant Design Vue）：

```bash
pnpm add @mengxi-ark/components @mengxi-ark/biz-components ant-design-vue
```

| 包                           | 说明                                           | 何时安装               |
| ---------------------------- | ---------------------------------------------- | ---------------------- |
| `@mengxi-ark/utils`          | 纯工具函数（日期 / 金额 / 树 / 校验 / 浏览器） | 必装                   |
| `@mengxi-ark/theme`          | Design Token（`--mx-*` CSS Variables）         | 必装                   |
| `@mengxi-ark/hooks`          | useRequest / useTable / useForm 等             | 必装                   |
| `@mengxi-ark/components`     | SearchForm / EnhanceTable 等通用组件           | 用组件时装             |
| `@mengxi-ark/biz-components` | Lov / DocumentTable 双模式业务组件             | 用业务组件时装         |
| `ant-design-vue`             | 默认 UI 库（peer，控件样式 CSS-in-JS 注入）    | 用组件时装（v4）       |

## 第 2 步：引入样式（一条规则记住）

**`@mengxi-ark/theme` 引包名，其余四包引 `style.css`，最后补 antd reset**：

| 来源                                            | 引入方式                              | 说明                                     |
| ----------------------------------------------- | ------------------------------------- | ---------------------------------------- |
| `@mengxi-ark/theme`                             | `import '@mengxi-ark/theme'`          | exports 已指向 `./dist/index.css`        |
| `components` / `biz-components` / `runtime` / `dsl-render` | `import '<包名>/style.css'` | 布局样式独立 css 产物，**不自动注入**    |
| `ant-design-vue`                                | `import 'ant-design-vue/dist/reset.css'` | UI 库控件样式经 CSS-in-JS 注入，reset 定基线 |

`src/main.ts` 完整样板（与 demo-light 一致，用不到的包对应行删掉即可）：

```ts
import { createApp } from 'vue'
import { MX_I18N_KEY, createI18n, vPermission } from '@mengxi-ark/hooks'
import '@mengxi-ark/theme'
// 组件布局样式随包独立 css 产物（Vite lib mode 抽离，不自动注入），需按用到的包显式引入
import '@mengxi-ark/components/style.css'
import '@mengxi-ark/biz-components/style.css'
import '@mengxi-ark/dsl-render/style.css' // 仅使用 DSL 配置渲染时需要
// 默认适配器为 Ant Design Vue：引入 antd reset 基线样式（UI 库控件样式经 CSS-in-JS 注入）
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'

// i18n 实例经 provide 下发，组件内 useI18n() inject 复用（不需要 i18n 可整段删除）
const i18n = createI18n({
	locale: 'zh-CN',
	fallbackLocale: 'zh-CN',
	messages: {
		'zh-CN': { demo: { greeting: '你好，{name}！' } },
		'en-US': { demo: { greeting: 'Hello, {name}!' } }
	}
})

const app = createApp(App)

app.provide(MX_I18N_KEY, i18n)
app.directive('permission', vPermission)
app.mount('#app')
```

## 第 3 步：utils 与 hooks（组件内使用）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { formatMoney } from '@mengxi-ark/utils'
import { useRequest } from '@mengxi-ark/hooks'

const price = ref('1234567.891')

function fetchUser(): Promise<{ name: string }> {
	return new Promise(resolve => {
		setTimeout(() => resolve({ name: '曦舟' }), 500)
	})
}

// 默认创建即发起请求；内置竞态保护，retry 重试
const { data, loading, error, retry } = useRequest(fetchUser)
</script>

<template>
	<p>金额：{{ formatMoney(price) }}</p>
	<p v-if="loading">加载中…</p>
	<p v-else-if="error">加载失败，可调用 retry() 重试</p>
	<p v-else-if="data">用户：{{ data.name }}</p>
</template>
```

hooks 全家桶（useTable / useForm / useAuth / useSession / useI18n）的签名约定见 [hooks API](/api/hooks)。

## 第 4 步：使用组件（可选）

props 驱动优先，插槽兜底。SearchForm + EnhanceTable 各传最少 props 即可渲染完整查询区与表格：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SearchForm, EnhanceTable } from '@mengxi-ark/components'
import type { SearchField, MxColumn } from '@mengxi-ark/components'

const fields: SearchField[] = [
	{ name: 'keyword', label: '关键字', type: 'input', placeholder: '按姓名搜索' },
	{
		name: 'status',
		label: '状态',
		type: 'select',
		options: [
			{ label: '启用', value: '1' },
			{ label: '停用', value: '0' }
		]
	}
]

const columns: MxColumn[] = [
	{ dataIndex: 'id', title: '编号' },
	{ dataIndex: 'name', title: '姓名' },
	{ dataIndex: 'status', title: '状态' }
]

const dataSource = ref([
	{ id: 1, name: '曦舟', status: '启用' },
	{ id: 2, name: '梦曦', status: '停用' }
])

function handleSearch(values: Record<string, unknown>): void {
	console.log(values) // 未填项为 undefined，业务自行过滤
}
</script>

<template>
	<SearchForm :fields="fields" @search="handleSearch" />
	<EnhanceTable :columns="columns" :data-source="dataSource" />
</template>
```

业务组件（Lov / DocumentTable）独立模式传 `lovApi` / `lovOptions` / `permissions` 等 props 即自请求，不需要任何基座。完整渐进示例（插槽自定义 → Lov 独立模式 → DocumentTable 行编辑 → 基座联动）见[组件实战](/guide/components-guide)，各组件完整 props / events / slots 见 [API 文档](/api/searchform)。

## 暗色模式

宿主根节点挂 `data-theme="dark"` 即可整体切换暗色，无需重新加载样式：

```ts
document.documentElement.dataset.theme = 'dark' // 传 '' 恢复亮色
```

也可以挂 `.mx-theme-dark` 类，两种方式等价。

## 业务覆盖主题

在自有样式表中重定义同名 `--mx-*` 变量即可（CSS Variables 运行时生效），无需 fork theme：

```css
:root {
	--mx-color-primary: #0958d9;
	--mx-radius-base: 4px;
}
```

## 下一步

- [核心概念](/guide/core-concepts)：建立分层架构、双模式契约、主题体系与 hooks 约定的心智模型；
- [组件实战](/guide/components-guide)：五步渐进，从最简 props 用法走到基座联动；
- 基础包 API 参考：[@mengxi-ark/utils](/api/utils) · [@mengxi-ark/theme](/api/theme) · [@mengxi-ark/hooks](/api/hooks)；
- 需要 Tab 工作台 / 菜单 / 模块注册时，进入[中台进阶（Runtime 基座）](/platform/)。
