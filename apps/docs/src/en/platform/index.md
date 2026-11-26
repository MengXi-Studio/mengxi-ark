# Mid-Platform (Runtime Base)

> **Prerequisites**: this section assumes you have mastered [Core Concepts](/en/guide/core-concepts) (the layered architecture and the dual-mode fallback chain) and completed the
> [Component Walkthrough](/en/guide/components-guide) — every base capability builds on that contract. If you only want lightweight usage, skip this section entirely.

`@mengxi-ark/runtime` is the optional mid-platform base package: it provides a tab workbench, global context delivery, a module registry, route guards and lifecycle hooks. Without runtime, utils / theme / hooks /
components / biz-components work fully standalone; once installed, business components automatically probe the base context (base-linked mode).

## Installation

```bash
pnpm add @mengxi-ark/runtime
```

runtime depends on `vue` / `vue-router` (peerDependencies); the built-in workbench Layout references `ant-design-vue` (optional peer) — you can skip installing it if you replace the built-in Layout.

## createArkRuntime: Plugin + Instance Handle in One

`createArkRuntime(options)` returns an instance that is both a Vue plugin and an imperative API: `app.use(runtime)` completes assembly, and you can still call `runtime.registerModule(...)` to register modules later.

```ts
import { createApp } from 'vue'
import { createArkRuntime } from '@mengxi-ark/runtime'
import '@mengxi-ark/theme'
import '@mengxi-ark/runtime/style.css'
import App from './App.vue'
import { router } from './router'
import { systemModule } from './modules/system'
import { bizModule } from './modules/biz'

const runtime = createArkRuntime({
	router, // required: the tab workbench and route guards are built on this router
	context: {
		// global context (delivered for biz-components to probe)
		appName: '曦舟中台',
		user: { id: 1, name: '基座用户' },
		permissions: ['base:view'],
		lovCache: { STATUS: [{ label: '启用', value: '1' }] }
	},
	modules: [systemModule, bizModule], // initial modules (registerModule also works after install)
	homeTab: { route: '/system/users', title: '用户管理' }, // home tab (cannot be closed)
	onSessionExpired: () => {
		/* logout decisions belong to the base registrant */
	}
})

const app = createApp(App)
app.use(router)
app.use(runtime) // assembly: provide context → register Layout → wrap guards → onAppInit
app.mount('#app')
```

`App.vue` directly uses the registered global component (replaceable as a whole via `options.layout`):

```vue
<template>
	<ArkWorkbenchLayout />
</template>
```

## install Assembly Steps

1. **Context delivery**: `app.provide(MX_RUNTIME_CONTEXT_KEY, reactive(context))` — business components that hit the inject probe switch to base-linked mode;
2. **runtime handle delivery**: the built-in Layout obtains tabService / menuService via `ARK_RUNTIME_KEY` inject;
3. **Layout mounting**: the global component name is `ArkWorkbenchLayout`; pass `options.layout` to replace it;
4. **Route guard wrapping**: `router.beforeEach` wraps the onBeforeRouteChange queue (no rewriting of native router APIs);
5. **onAppInit queue**: executed in registration order (hooks registered after install run immediately).

## Lifecycle Hooks

All three hook types can be registered multiple times and run in registration order:

| Hook                  | Signature                       | Description                                                                                           |
| --------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `onAppInit`           | `() => void \| Promise<void>`   | Application initialization (runs immediately after install / for late-registered modules)             |
| `onBeforeRouteChange` | `(to, from) => boolean \| void` | Route guard; any `false` return blocks the navigation                                                 |
| `onSessionExpired`    | `() => void`                    | Session expiry broadcast; logout decisions belong to the registrant — the hook itself never navigates |

```ts
runtime.onAppInit(async () => {
	await initGlobalConfig()
})
runtime.onBeforeRouteChange(to => {
	if (to.meta?.requireAuth && !loggedIn) return false
})
runtime.onSessionExpired(() => router.replace('/login'))
```

## Session Service (sessionService)

- `notifyExpired()`: broadcast manually when the business detects an expiry (triggers all onSessionExpired hooks);
- `startTokenRefresh(getToken, { intervalMs })`: a lightweight token refresh scheduler (default interval 5 minutes); if getToken returns an empty value or throws, it counts as a refresh failure → scheduling stops
  automatically and expired is broadcast; `stopTokenRefresh()` stops it.

## Tab Workbench (tabService)

```ts
runtime.tabService.open('/system/users') // default 'tab': push + new tab
runtime.tabService.open('/system/users', { openMode: 'current' }) // navigate within the current tab (the tab updates in place)
runtime.tabService.open({
	// 'dialog': direct business component, not mounted via routing
	title: '选择负责人',
	component: PickOwnerDialog,
	props: { initialOwner: null }
})
runtime.tabService.activate(key) // activate and navigate
runtime.tabService.close(key) // close (the home tab is closable false and cannot be closed)
```

The built-in Layout renders tabs / activeKey / dialogs as the tab bar and MxDialog dialog containers; a custom Layout simply consumes the same reactive state.

## The Five Services

| Service                 | Responsibility                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| `moduleRegistryService` | Module registration and aggregation (routes / menus / permissions / lifecycle) |
| `menuService`           | Menu tree aggregation (same-key override, parentKey nesting, removeMenu)       |
| `tabService`            | Tab open / close / activate / dialog stack (three openMode values)             |
| `sessionService`        | Expiry broadcast + token refresh scheduling                                    |
| `contextService`        | MX_RUNTIME_CONTEXT_KEY delivery + permission merging                           |

Related pages: [registerModule Module Development](/en/platform/module) · [Global Context & Dual-Mode Fallback](/en/platform/context)

**Next**: after assembling the base, move on to [registerModule Module Development](/en/platform/module) to split your business into registrable module packages.
