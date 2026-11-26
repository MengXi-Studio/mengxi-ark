# __PROJECT_NAME__

基于 [曦舟 MengXi Ark](https://github.com/MengXi-Studio/mengxi-ark) 的中台基座工程（runtime 工作台）。

## 快速开始

```bash
pnpm install
pnpm dev
```

## 基座能力

| 能力 | 说明 |
| --- | --- |
| Tab 工作台 | 内置 ArkWorkbenchLayout（可经 `options.layout` 替换） |
| 菜单 | 模块 `menus` 声明式汇入 |
| 模块注册 | `createArkRuntime({ modules })` / `runtime.registerModule()` 延迟注册 |
| 全局上下文 | `context` 经 `MX_RUNTIME_CONTEXT_KEY` 下发，biz-components 自动探测复用 |
| 生命周期 | `onAppInit` / `onBeforeRouteChange` / `onSessionExpired` 钩子扩展，不 fork 源码 |

## 模块开发

在 `src/modules/` 中声明 `ModuleDefinition`（routes / menus / permissions / lifecycle），
模块包只依赖 runtime 类型，不 import 内部实现。示例见 `src/modules/systemModule.ts`。

## 双模式降级

Lov / DocumentTable 优先探测基座上下文（值集缓存 / lovListApi / 权限）；
上下文缺失字段自动回退同名 props（独立模式），无需显式切换。

## 主题覆盖与暗色

同轻量模式：重定义 `--mx-*` 变量；暗色根节点挂 `data-theme="dark"`。

## 后续

- AI 用法速查见 `.trae/rules/ark-platform.md`；
- runtime 上下文字段增删按 Major 版本发布，升级前查阅迁移指南。
