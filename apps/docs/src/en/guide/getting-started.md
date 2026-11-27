# Get Started (Lightweight Mode)

The lightweight mode depends on no base: install the three foundation packages and use them standalone in any Vue 3 project. All examples below match the `apps/demo-light` project — copy and run.

## Installation

```bash
pnpm add @mengxi-ark/utils @mengxi-ark/theme @mengxi-ark/hooks
```

## Importing Theme Styles

Import once at the application entry; all styles are `--mx-*` CSS Variables:

```ts
import '@mengxi-ark/theme'
```

> The exports of `@mengxi-ark/theme` map `.` to `./dist/index.css`; just import the package name — do not write a subpath.

## Minimal Example

`src/main.ts`:

```ts
import { createApp } from 'vue'
import { MX_I18N_KEY, createI18n, vPermission } from '@mengxi-ark/hooks'
import '@mengxi-ark/theme'
import App from './App.vue'

// The i18n instance is delivered via provide; useI18n() inside components reuses it automatically
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

Using utils and hooks inside a component:

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

const { data, loading, error, retry } = useRequest(fetchUser)
</script>

<template>
	<p>金额：{{ formatMoney(price) }}</p>
	<p v-if="loading">加载中…</p>
	<p v-else-if="error">加载失败，可调用 retry() 重试</p>
	<p v-else-if="data">用户：{{ data.name }}</p>
</template>
```

## Dark Mode

Attach `data-theme="dark"` to the host root node to switch the whole app to dark mode — no style reload needed:

```ts
document.documentElement.dataset.theme = 'dark' // pass '' to restore light mode
```

You can also attach the `.mx-theme-dark` class; both approaches are equivalent.

## Overriding the Theme

Redefine the same-named `--mx-*` variables in your own stylesheet (the overrides take effect immediately in the browser) — no need to fork theme:

```css
:root {
	--mx-color-primary: #0958d9;
	--mx-radius-base: 4px;
}
```

## Next Steps

- [Core Concepts](/en/guide/core-concepts): build the mental model of the layered architecture, the dual-mode contract, the theme system and the hooks conventions;
- Foundation package API reference: [@mengxi-ark/utils](/en/api/utils) · [@mengxi-ark/theme](/en/api/theme) · [@mengxi-ark/hooks](/en/api/hooks).
