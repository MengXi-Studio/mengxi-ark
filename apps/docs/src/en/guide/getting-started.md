# Get Started (Lightweight Mode)

The lightweight mode depends on no base at all: install packages → import styles → use components, and any Vue 3 project is up and running in three steps. This page is organized around the complete "from zero to running" path; all examples stay consistent with the `apps/demo-light` project — copy and they run.

> It only takes a few minutes: if you only want the utility functions, installing 3 packages is enough; to use the ready-made components (table / search form / Lov), add 2 more packages + ant-design-vue.

## Step 1: Installation

**The basic three** (pure functions / theme / hooks, zero UI dependencies):

```bash
pnpm add @mengxi-ark/utils @mengxi-ark/theme @mengxi-ark/hooks
```

**To use the ready-made components**, additionally install the component packages and the default UI library (the default adapter is Ant Design Vue):

```bash
pnpm add @mengxi-ark/components @mengxi-ark/biz-components ant-design-vue
```

| Package                      | Description                                                         | When to Install                   |
| ---------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| `@mengxi-ark/utils`          | Pure utility functions (date / money / tree / validation / browser) | Required                          |
| `@mengxi-ark/theme`          | Design Tokens (`--mx-*` CSS Variables)                              | Required                          |
| `@mengxi-ark/hooks`          | useRequest / useTable / useForm, etc.                               | Required                          |
| `@mengxi-ark/components`     | General components such as SearchForm / EnhanceTable                | Install when using components     |
| `@mengxi-ark/biz-components` | Dual-mode business components such as Lov / DocumentTable           | Install when using biz components |
| `ant-design-vue`             | Default UI library (peer; control styles injected via CSS-in-JS)    | Install when using components (v4) |

## Step 2: Import Styles (One Rule to Remember)

**Import `@mengxi-ark/theme` by package name, the other four packages via `style.css`, and finish with the antd reset**:

| Source                                                     | How to Import                            | Description                                                                        |
| ---------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `@mengxi-ark/theme`                                        | `import '@mengxi-ark/theme'`             | exports already points `.` to `./dist/index.css`                                   |
| `components` / `biz-components` / `runtime` / `dsl-render` | `import '<package>/style.css'`          | Layout styles ship as a standalone css artifact, **not auto-injected**             |
| `ant-design-vue`                                           | `import 'ant-design-vue/dist/reset.css'` | UI library control styles are injected via CSS-in-JS; the reset sets the baseline  |

Complete `src/main.ts` template (consistent with demo-light; just delete the lines of the packages you don't use):

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

## Step 3: utils & hooks (Inside Components)

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

The signature conventions of the full hooks family (useTable / useForm / useAuth / useSession / useI18n) are documented in [Hooks API](/en/api/hooks).

## Step 4: Use Components (Optional)

props-driven first, slots as the fallback. SearchForm + EnhanceTable render a complete search area and table with only the minimal props passed:

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

Business components (Lov / DocumentTable) in standalone mode issue requests themselves once you pass props such as `lovApi` / `lovOptions` / `permissions` — no base needed at all. For the complete progressive walkthrough (slot customization → Lov standalone mode → DocumentTable row editing → base-linked mode), see [Component Walkthrough](/en/guide/components-guide); for each component's full props / events / slots, see the [API docs](/en/api/searchform).

## Dark Mode

Attach `data-theme="dark"` to the host root node to switch the whole app to dark mode — no style reload needed:

```ts
document.documentElement.dataset.theme = 'dark' // 传 '' 恢复亮色
```

You can also attach the `.mx-theme-dark` class; both approaches are equivalent.

## Overriding the Theme

Redefine the same-named `--mx-*` variables in your own stylesheet (CSS Variable overrides take effect at runtime) — no need to fork theme:

```css
:root {
	--mx-color-primary: #0958d9;
	--mx-radius-base: 4px;
}
```

## Next Steps

- [Core Concepts](/en/guide/core-concepts): build the mental model of the layered architecture, the dual-mode contract, the theme system and the hooks conventions;
- [Component Walkthrough](/en/guide/components-guide): five progressive steps, from the simplest props usage all the way to base-linked mode;
- Foundation package API reference: [@mengxi-ark/utils](/en/api/utils) · [@mengxi-ark/theme](/en/api/theme) · [@mengxi-ark/hooks](/en/api/hooks);
- When you need the Tab workbench / menus / module registration, move on to [Mid-Platform (Runtime Base)](/en/platform/).
