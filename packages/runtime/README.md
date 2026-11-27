# @mengxi-ark/runtime

> 中台基座：Tab 工作台 / 菜单 / 模块注册 / 会话 / 上下文五 service + 内置可替换工作台 Layout，声明式模块注册。

[![npm version](https://img.shields.io/npm/v/@mengxi-ark/runtime?style=flat-square)](https://www.npmjs.com/package/@mengxi-ark/runtime)
[![license](https://img.shields.io/npm/l/@mengxi-ark/runtime?style=flat-square)](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)

[MengXi Ark｜曦舟](https://github.com/MengXi-Studio/mengxi-ark) 的中台基座包。`createArkRuntime` 以 **Vue 插件 + 实例句柄二合一**形式工作：`app.use(runtime)` 完成全部装配（上下文 provide / 模块路由 / beforeEach 守卫包装 / Layout 挂载 / onAppInit 队列），同时持有 `registerModule` 等命令式 API。不修改 Vue / Router 底层原型，业务扩展走生命周期钩子，不 fork 源码。

## 安装

```bash
pnpm add @mengxi-ark/runtime vue-router ant-design-vue
```

## 使用示例

```ts
import { createApp } from 'vue'
import { createRouter } from 'vue-router'
import { createArkRuntime } from '@mengxi-ark/runtime'
import systemModule from './modules/systemModule'
import '@mengxi-ark/runtime/style.css'

const router = createRouter({ routes: [], history: createWebHistory() })

const runtime = createArkRuntime({
	router,
	context: { user, permissions, lovCache }, // 经 MX_RUNTIME_CONTEXT_KEY 下发，biz-components 自动探测复用
	modules: [systemModule] // 声明式 ModuleDefinition：routes / menus / permissions / lifecycle
})

app.use(router)
app.use(runtime) // 装配基座；runtime.registerModule 可延迟注册后续模块
```

## 能力清单

| 模块                     | 职责                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `tabService`             | 页签工作台：打开 / 缓存 / 关闭，`openMode` 支持 新Tab / 弹窗 / 当前页    |
| `menuService`            | 菜单注册与渲染数据                                                       |
| `moduleRegistryService`  | `registerModule` 声明式注册中心（模块包只依赖类型，不 import 内部实现）  |
| `sessionService`         | 会话监听、单点登出回调、token 刷新调度                                   |
| `contextService`         | 全局上下文 `provide(MX_RUNTIME_CONTEXT_KEY)`，供 biz-components 探测     |
| `ArkWorkbenchLayout`     | 内置工作台 Layout，`options.layout` 可替换                               |
| 生命周期钩子             | `onAppInit` / `onBeforeRouteChange`（返回 false 阻断）/ `onSessionExpired` |

> 基座可选：不需要工作台的项目可只用 hooks / components / biz-components，运行时无侵入。

## 文档

- 完整文档：<https://mengxi-studio.github.io/mengxi-ark/>
- 中台进阶：<https://mengxi-studio.github.io/mengxi-ark/platform/index.html>

## 协议

[MIT](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)
