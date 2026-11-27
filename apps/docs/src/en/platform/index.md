# Mid-Platform (Runtime Base)

> **Prerequisites**: this section assumes you have mastered [Core Concepts](/en/guide/core-concepts) (the layered architecture and the dual-mode fallback chain) and completed the
> [Component Walkthrough](/en/guide/components-guide) — every base capability builds on that contract. If you only want lightweight usage, skip this section entirely.

`@mengxi-ark/runtime` is the optional mid-platform base package: it provides a Tab workbench, global context delivery, a module registry, route guards and lifecycle hooks. Without runtime, utils / theme / hooks /
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
import { CloudFilled, LogoutOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { createArkRuntime } from '@mengxi-ark/runtime'
import '@mengxi-ark/theme'
import '@mengxi-ark/runtime/style.css'
import '@mengxi-ark/components/style.css'
import '@mengxi-ark/biz-components/style.css'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import { router } from './router'
import { systemModule } from './modules/system'
import { bizModule } from './modules/biz'

const runtime = createArkRuntime({
	router, // 必传：Tab 工作台与路由守卫基于该 router
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
			if (key === 'profile') message.info('跳转个人中心')
			if (key === 'logout') message.info('调用登出逻辑')
		}
	},
	context: {
		// 全局上下文（下发给 biz-components 探测）
		appName: '曦舟中台',
		user: { id: 1, name: '基座用户' },
		permissions: ['base:view'],
		lovCache: { STATUS: [{ label: '启用', value: '1' }] }
	},
	modules: [systemModule, bizModule], // 初始模块（也可安装后 registerModule）
	homeTab: { route: '/system/users', title: '用户管理' }, // 首页页签（不可关闭）
	onSessionExpired: () => {
		/* 登出决策由基座注册方决定 */
	}
})

const app = createApp(App)
app.use(router)
app.use(runtime) // 装配：provide 上下文 → 注册 Layout → 守卫包装 → onAppInit
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
4. **Route guard wrapping**: `router.beforeEach` wraps the onBeforeRouteChange queue (native router APIs are never rewritten);
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
runtime.tabService.open('/system/users') // 默认 'tab'：push + 新页签
runtime.tabService.open('/system/users', { openMode: 'current' }) // 当前页签内跳转（页签原地更新）
runtime.tabService.open({
	// 'dialog'：业务组件直传，非路由挂载
	title: '选择负责人',
	component: PickOwnerDialog,
	props: { initialOwner: null }
})
runtime.tabService.activate(key) // 激活并跳转
runtime.tabService.close(key) // 关闭（首页页签 closable false 不可关闭）
runtime.tabService.closeLeft(key) // 关闭左侧可关闭页签
runtime.tabService.closeRight(key) // 关闭右侧可关闭页签
runtime.tabService.closeOther(key) // 关闭其他可关闭页签
runtime.tabService.refresh(key) // 刷新页签（非激活页签先激活再重挂载）
```

The built-in Layout renders tabs / activeKey / dialogs as the tab bar and MxDialog dialog containers; a custom Layout simply consumes the same reactive state.

## Tab Rules

| Rule                   | Description                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Auto tab creation      | Route navigation creates tabs automatically; key = the route's `fullPath` (the same fullPath merges idempotently, never duplicated) |
| Title fallback         | the `open` call's `options.title` → route `meta.title` → `fullPath`                          |
| Home tab               | the tab configured by `homeTab` stays resident with `closable: false` and cannot be closed    |
| Closing the active tab | after closing the active tab, the nearest left neighbor is activated first, then the right one |
| Open modes             | `openMode: 'tab'` (new tab, default) / `'current'` (updates the current tab in place) / `'dialog'` (dialog) |

## Tab Context Menu

Right-clicking a tab pops up the **built-in menu** by default: refresh / close left / close right / close other — disabled states are computed automatically (grayed out when the target tab is not closable, or when the
corresponding side has no closable tabs). Refresh is implemented by remounting the page (after the target tab is activated, the router-view rebuilds).

For customization, `tabContextMenu` toggles the built-in items, appends custom items and wires the click callback (the example matches demo-platform):

```ts
createArkRuntime({
	router,
	tabContextMenu: {
		builtin: true, // 默认含内置项；传 false 仅渲染自定义项
		items: [
			// 追加的自定义项渲染在内置项之后（自动加分隔线）
			{ key: 'pin', label: '固定页签' },
			{ key: 'copy-path', label: '复制路径', disabled: false }
		],
		onClick: (itemKey, tabKey) => {
			// 仅自定义项触发该回调；内置项由 Layout 直接调 tabService
			if (itemKey === 'pin') console.log('固定页签：', tabKey)
		}
	}
})
```

When you need a fully custom menu UI, pass `options.layout` to replace the whole Layout, or consume the closeLeft / closeRight / closeOther / refresh of `runtime.tabService` to implement your own.

## Built-in Layout Branding

All branding options of the built-in workbench Layout (sidebar menu + header user area + tab bar) are configured in `createArkRuntime(options)` — **all optional; behavior stays unchanged when omitted**:

| Option            | Type                   | Description                                                                                                                                            |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `logo`            | `string \| Component`  | an image URL renders an `<img>`, or a custom component; falls back to an appName initial block when omitted                                            |
| `headerActions`   | `Component`            | the header's right-hand action area (message bell / fullscreen etc., rendered to the left of the user area)                                            |
| `user`            | `Component`            | replaces the whole user area (e.g. a custom avatar + dropdown); when passed, `userMenu` is ignored                                                      |
| `userMenu`        | `{ items, onClick? }`  | declarative user menu: keeps the built-in avatar + username, clicking opens a dropdown; items contain `key / label / icon? / divided?`                 |
| `tabContextMenu`  | `TabContextMenuConfig` | tab context menu configuration (see the section above)                                                                                                 |
| `collapsible`     | `boolean`              | the sidebar collapse bar, default `true`; pass `false` to hide the bar and disable collapsing                                                           |
| `layout`          | `Component`            | replaces the built-in Layout as a whole (after replacement the other options in this table no longer apply)                                            |

Custom component examples for `headerActions` / `user` (message bell + replacing the whole user area):

```vue
<!-- src/layout/MyHeaderActions.vue：渲染在 header 右侧、用户区左侧 -->
<template>
	<button class="bell" type="button" @click="visible = !visible">铃铛</button>
</template>
```

```ts
import MyHeaderActions from './layout/MyHeaderActions.vue'
import MyUser from './layout/MyUser.vue'

createArkRuntime({
	router,
	context: { /* ... */ },
	headerActions: MyHeaderActions,
	user: MyUser // 传后内置头像被替换，userMenu 不再生效
})
```

## The Five Services

| Service                 | Responsibility                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| `moduleRegistryService` | Module registration and aggregation (routes / menus / permissions / lifecycle) |
| `menuService`           | Menu tree aggregation (same-key override, parentKey nesting, removeMenu)       |
| `tabService`            | Tab open / close / activate / dialog stack (the three openMode values)         |
| `sessionService`        | Expiry broadcast + token refresh scheduling                                    |
| `contextService`        | MX_RUNTIME_CONTEXT_KEY delivery + permission merging                           |

Related pages: [registerModule Module Development](/en/platform/module) · [Global Context & Dual-Mode Fallback](/en/platform/context)

**Next**: after assembling the base, move on to [registerModule Module Development](/en/platform/module) to split your business into registrable module packages.
