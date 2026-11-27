# 中台进阶（Runtime 基座）

> **前置知识**：本板块假设你已掌握[核心概念](/guide/core-concepts)（分层架构、双模式降级链）并完成[组件实战](/guide/components-guide)——基座的所有能力都建立在这套契约之上。若只想要轻量使用，可完全跳过本板块。

`@mengxi-ark/runtime` 是可选的中台基座包：提供 Tab 工作台、全局上下文下发、模块注册中心、路由守卫与生命周期钩子。不安装 runtime 时，utils / theme / hooks / components /
biz-components 完全独立可用；安装后业务组件自动探测基座上下文（基座联动模式）。

## 安装

```bash
pnpm add @mengxi-ark/runtime
```

runtime 依赖 `vue` / `vue-router`（peerDependencies）；内置工作台 Layout 引用 `ant-design-vue`（optional peer），替换内置 Layout 时可不安装。

## createArkRuntime：插件 + 实例句柄二合一

`createArkRuntime(options)` 返回 Vue 插件与命令式 API 二合一的实例：`app.use(runtime)` 完成装配，同时可继续调用 `runtime.registerModule(...)` 延迟注册模块。

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

`App.vue` 直接使用注册好的全局组件（可被 `options.layout` 整体替换）：

```vue
<template>
	<ArkWorkbenchLayout />
</template>
```

## install 装配步骤

1. **上下文下发**：`app.provide(MX_RUNTIME_CONTEXT_KEY, reactive(context))`，业务组件 inject 探测命中即走基座联动；
2. **runtime 句柄下发**：内置 Layout 经 `ARK_RUNTIME_KEY` inject 获取 tabService / menuService；
3. **挂载 Layout**：全局组件名 `ArkWorkbenchLayout`，传 `options.layout` 可替换；
4. **路由守卫包装**：`router.beforeEach` 包装 onBeforeRouteChange 队列（不重写 router 原生 API）；
5. **onAppInit 队列**：按注册顺序执行（install 后注册的钩子立即执行）。

## 生命周期钩子

三类钩子均可注册多个、按注册顺序执行：

| 钩子                  | 签名                            | 说明                                                  |
| --------------------- | ------------------------------- | ----------------------------------------------------- |
| `onAppInit`           | `() => void \| Promise<void>`   | 应用初始化（install 后 / 延迟注册模块立即执行）       |
| `onBeforeRouteChange` | `(to, from) => boolean \| void` | 路由前置守卫；任一返回 `false` 阻断本次跳转           |
| `onSessionExpired`    | `() => void`                    | 会话过期广播；登出决策交给注册方，hook 自身不跳转路由 |

```ts
runtime.onAppInit(async () => {
	await initGlobalConfig()
})
runtime.onBeforeRouteChange(to => {
	if (to.meta?.requireAuth && !loggedIn) return false
})
runtime.onSessionExpired(() => router.replace('/login'))
```

## 会话服务（sessionService）

- `notifyExpired()`：业务探测到过期时手动广播（触发全部 onSessionExpired 钩子）；
- `startTokenRefresh(getToken, { intervalMs })`：轻量 token 定时刷新调度器（默认间隔 5 分钟）；getToken 返回空值或抛错视为刷新失败 → 自动停止调度并广播 expired；`stopTokenRefresh()` 停止。

## Tab 工作台（tabService）

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

内置 Layout 将 tabs / activeKey / dialogs 渲染为页签条与 MxDialog 弹窗容器；自定义 Layout 时消费同样的响应式状态即可。

## 页签规则

| 规则     | 说明                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| 自动建签 | 路由导航自动创建页签，key = 路由 `fullPath`（同 fullPath 幂等合并，不会重复） |
| 标题回退 | `open` 的 `options.title` → 路由 `meta.title` → `fullPath`                    |
| 首页页签 | `homeTab` 配置的页签 `closable: false` 常驻，不可关闭                         |
| 关闭激活 | 关闭激活页签后优先激活左侧相邻页签，其次右侧                                  |
| 打开策略 | `openMode: 'tab'`（新页签，默认）/ `'current'`（当前页签原地更新）/ `'dialog'`（弹窗） |

## 页签右键菜单

页签右键默认弹出**内置菜单**：刷新 / 关闭左侧 / 关闭右侧 / 关闭其他——禁用状态自动计算（目标页签不可关闭、或对应侧没有可关闭页签时置灰）。刷新通过重挂载页面实现（激活目标页签后触发 router-view 重建）。

自定义：`tabContextMenu` 配置内置项开关、追加自定义项与点击回调（示例对应 demo-platform）：

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

需要完全自定义菜单 UI 时，可传 `options.layout` 整体替换 Layout，或消费 `runtime.tabService` 的 closeLeft / closeRight / closeOther / refresh 自行实现。

## 内置 Layout 品牌配置

内置工作台 Layout（侧栏菜单 + header 用户区 + 页签条）的全部品牌项在 `createArkRuntime(options)` 中配置，**全部可选，不传行为不变**：

| 配置项           | 类型                                | 说明                                                                        |
| ---------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `logo`           | `string \| Component`               | 图片地址渲染 `<img>`，或自定义组件；不传降级为 appName 首字方块             |
| `headerActions`  | `Component`                         | header 右侧操作区（消息铃铛 / 全屏等，渲染在用户区左侧）                    |
| `user`           | `Component`                         | 整体替换用户区（如自定义头像 + 下拉）；传后 `userMenu` 忽略                 |
| `userMenu`       | `{ items, onClick? }`               | 声明式用户菜单：保留内置头像 + 用户名，点击弹下拉；项含 `key / label / icon? / divided?` |
| `tabContextMenu` | `TabContextMenuConfig`              | 页签右键菜单配置（见上节）                                                  |
| `collapsible`    | `boolean`                           | 侧栏折叠条，默认 `true`；传 `false` 隐藏折叠条并禁用收起                    |
| `layout`         | `Component`                         | 整体替换内置 Layout（替换后本表其余配置不再生效）                           |

`headerActions` / `user` 为自定义组件示例（消息铃铛 + 整体替换用户区）：

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

## 五个 service

| service                 | 职责                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `moduleRegistryService` | 模块登记与聚合（routes / menus / permissions / lifecycle） |
| `menuService`           | 菜单树聚合（同 key 覆盖、parentKey 嵌套、removeMenu）      |
| `tabService`            | 页签打开 / 关闭 / 激活 / 弹窗栈（三种 openMode）           |
| `sessionService`        | 过期广播 + token 刷新调度                                  |
| `contextService`        | MX_RUNTIME_CONTEXT_KEY 下发 + 权限合并                     |

相关页面：[registerModule 模块开发](/platform/module) · [全局上下文与双模式降级](/platform/context)

**下一步**：完成基座装配后，进入 [registerModule 模块开发](/platform/module)把业务拆成可注册的模块包。
