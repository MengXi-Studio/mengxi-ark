# 中台进阶（Runtime 基座）

`@mengxi-ark/runtime` 是可选的中台基座包：提供 Tab 工作台、全局上下文下发、模块注册中心、路由守卫与生命周期钩子。不安装 runtime 时，utils / theme / hooks / components / biz-components 完全独立可用；安装后业务组件自动探测基座上下文（基座联动模式）。

## 安装

```bash
pnpm add @mengxi-ark/runtime
```

runtime 依赖 `vue` / `vue-router`（peerDependencies）；内置工作台 Layout 引用 `ant-design-vue`（optional peer），替换内置 Layout 时可不安装。

## createArkRuntime：插件 + 实例句柄二合一

`createArkRuntime(options)` 返回 Vue 插件与命令式 API 二合一的实例：`app.use(runtime)` 完成装配，同时可继续调用 `runtime.registerModule(...)` 延迟注册模块。

```ts
import { createApp } from 'vue';
import { createArkRuntime } from '@mengxi-ark/runtime';
import '@mengxi-ark/theme';
import '@mengxi-ark/runtime/style.css';
import App from './App.vue';
import { router } from './router';
import { systemModule } from './modules/system';
import { bizModule } from './modules/biz';

const runtime = createArkRuntime({
  router,                       // 必传：Tab 工作台与路由守卫基于该 router
  context: {                    // 全局上下文（下发给 biz-components 探测）
    appName: '曦舟中台',
    user: { id: 1, name: '基座用户' },
    permissions: ['base:view'],
    lovCache: { STATUS: [{ label: '启用', value: '1' }] },
  },
  modules: [systemModule, bizModule],   // 初始模块（也可安装后 registerModule）
  homeTab: { route: '/system/users', title: '用户管理' },  // 首页页签（不可关闭）
  onSessionExpired: () => { /* 登出决策由基座注册方决定 */ },
});

const app = createApp(App);
app.use(router);
app.use(runtime);               // 装配：provide 上下文 → 注册 Layout → 守卫包装 → onAppInit
app.mount('#app');
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

| 钩子 | 签名 | 说明 |
| --- | --- | --- |
| `onAppInit` | `() => void \| Promise<void>` | 应用初始化（install 后 / 延迟注册模块立即执行） |
| `onBeforeRouteChange` | `(to, from) => boolean \| void` | 路由前置守卫；任一返回 `false` 阻断本次跳转 |
| `onSessionExpired` | `() => void` | 会话过期广播；登出决策交给注册方，hook 自身不跳转路由 |

```ts
runtime.onAppInit(async () => { await initGlobalConfig(); });
runtime.onBeforeRouteChange((to) => {
  if (to.meta?.requireAuth && !loggedIn) return false;
});
runtime.onSessionExpired(() => router.replace('/login'));
```

## 会话服务（sessionService）

- `notifyExpired()`：业务探测到过期时手动广播（触发全部 onSessionExpired 钩子）；
- `startTokenRefresh(getToken, { intervalMs })`：轻量 token 定时刷新调度器（默认间隔 5 分钟）；getToken 返回空值或抛错视为刷新失败 → 自动停止调度并广播 expired；`stopTokenRefresh()` 停止。

## Tab 工作台（tabService）

```ts
runtime.tabService.open('/system/users');                    // 默认 'tab'：push + 新页签
runtime.tabService.open('/system/users', { openMode: 'current' }); // 当前页签内跳转（页签原地更新）
runtime.tabService.open({                                    // 'dialog'：业务组件直传，非路由挂载
  title: '选择负责人',
  component: PickOwnerDialog,
  props: { initialOwner: null },
});
runtime.tabService.activate(key);   // 激活并跳转
runtime.tabService.close(key);      // 关闭（首页页签 closable false 不可关闭）
```

内置 Layout 将 tabs / activeKey / dialogs 渲染为页签条与 MxDialog 弹窗容器；自定义 Layout 时消费同样的响应式状态即可。

## 五个 service

| service | 职责 |
| --- | --- |
| `moduleRegistryService` | 模块登记与聚合（routes / menus / permissions / lifecycle） |
| `menuService` | 菜单树聚合（同 key 覆盖、parentKey 嵌套、removeMenu） |
| `tabService` | 页签打开 / 关闭 / 激活 / 弹窗栈（三种 openMode） |
| `sessionService` | 过期广播 + token 刷新调度 |
| `contextService` | MX_RUNTIME_CONTEXT_KEY 下发 + 权限合并 |

相关页面：[registerModule 模块开发](/platform/module) · [全局上下文与双模式降级](/platform/context)
