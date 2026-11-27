---
description: 曦舟 MengXi Ark 中台基座用法速查（模块注册 / 全局上下文 / 内置 Layout 配置 / 页签与右键菜单 / 双模式 / 生命周期钩子）
alwaysApply: true
---

# MengXi Ark 中台基座规则（本工程含 runtime 基座）

## 包边界

- 基座能力：`@mengxi-ark/runtime`（createArkRuntime / registerModule / 五大 service）。
- 业务组件双模式：`@mengxi-ark/biz-components`（Lov / DocumentTable）。
- 样式只允许引用 `var(--mx-*)` token；入口需引入 `@mengxi-ark/runtime/style.css` + `@mengxi-ark/components/style.css` + `@mengxi-ark/biz-components/style.css`（布局样式为独立 css 产物，不自动注入）。

## 模块注册（唯一落点：src/modules/）

- 模块用 `ModuleDefinition` 声明式字段：`id / routes / menus / permissions / lifecycle`。
- 模块包**只 import runtime 类型**，禁止 import runtime 内部 service 实现。
- 启动注册：`createArkRuntime({ modules })`；延迟注册：`runtime.registerModule(module)`。
- 路由守卫只经 `onBeforeRouteChange` 钩子注册（返回 false 阻断跳转），禁止重写 `router.push` 等原生 API。

## 全局上下文与双模式

- 上下文经 `context` 选项下发（user / tenant / permissions / lovCache / lovListApi），
  biz-components inject 探测命中即自动复用。
- Lov 基座联动：只传 `lov-code`，不传 `lovApi` / `lovOptions`；
  DocumentTable 权限：列级 `permissionCode`，上下文 `permissions` 命中即可编辑。
- 上下文字段全部支持同名 props 兜底；未安装 / 未登录场景组件自动降级独立模式，不抛异常。

## 内置 Layout 配置（createArkRuntime options，全部可选）

- 品牌：`logo`（图片地址或图标组件，不传降级 appName 首字方块）、`headerActions`（header 右侧操作区组件）、
  `user`（整体替换用户区组件）/ `userMenu`（声明式下拉菜单，二选一，user 优先）、`collapsible`（默认 true）。
- 页签：路由导航自动建签（key = fullPath 去重）；标题回退 `options.title → meta.title → fullPath`；
  `homeTab` 首页页签不可关闭；`openMode`：`tab`（默认新页签）/ `current`（原地更新）/ `dialog`（业务组件弹窗）。
- 页签右键菜单 `tabContextMenu`：内置 刷新 / 关闭左侧 / 右侧 / 其他（自动禁用）；
  `items` 追加自定义项，`onClick(itemKey, tabKey)`；`builtin: false` 只留自定义项。
- 命令式：`runtime.tabService` 提供 open / close / activate / refresh / closeLeft / closeRight / closeOther。

## 生命周期扩展

- 扩展走钩子：`onAppInit` / `onBeforeRouteChange` / `onSessionExpired`（可注册多个，按序执行）。
- 会话过期登出决策在 `onSessionExpired` 中由业务实现，hook / 组件自身不跳转路由。

## 破坏性变更

- runtime 上下文字段增删按 Major 发布；升级依赖前先查阅迁移指南，不要凭记忆引用上下文字段。
