---
description: 曦舟 MengXi Ark 轻量模式用法速查（安装 / 主题覆盖 / 双模式 props / 按需导入）
alwaysApply: true
---

# MengXi Ark 轻量模式规则（本工程无 runtime 基座）

## 可用包与边界

- 可直接 import：`@mengxi-ark/utils`（纯函数）、`@mengxi-ark/theme`（仅样式）、`@mengxi-ark/hooks`、`@mengxi-ark/components`、`@mengxi-ark/biz-components`。
- 本模板**不含** `@mengxi-ark/runtime` / `dsl-render`；不要生成 import runtime 的代码。
- 样式只允许引用 `var(--mx-*)` token，禁止硬编码色值 / 间距字面量。

## 主题覆盖

- 覆盖 token：在自有 css 中重定义同名 `--mx-*` 变量（运行时生效，不 fork 包）。
- 暗色模式：根节点挂 `data-theme="dark"`。

## 双模式业务组件（Lov / DocumentTable）

本工程没有基座上下文，业务组件一律用**独立模式 props**：

- Lov：`v-model` + `lovOptions`（静态）或 `lovApi`（接口，约定入参 keyword / currentPage / pageSize，返回数组或 { list, total }）+ 可选 `params` / `fieldNames`。
- DocumentTable：`v-model` 行数组 + `columns`（列级 `editable` / `editorType` / `rules` / `permissionCode`）；`@save` 抛全量数据，提交请求由业务自行处理。
- 不要生成依赖 `inject` 基座上下文的写法（无 provide 时组件自动降级独立模式）。

## 按需导入

- 组件：`import { SearchForm, EnhanceTable } from '@mengxi-ark/components'`（ESM Tree-Shaking 生效，无需手动按需）。
- 样式：入口需 `import '@mengxi-ark/theme'` + `import '@mengxi-ark/components/style.css'` + `import '@mengxi-ark/biz-components/style.css'`（组件布局样式为独立 css 产物，不自动注入）+ `import 'ant-design-vue/dist/reset.css'`（UI 库控件样式经 CSS-in-JS 注入）。
- UI 库切换：默认 Ant Design Vue；切换 Element Plus 时 `app.provide(UI_ADAPTER_KEY, createElementPlusAdapter())`（来自 `@mengxi-ark/components`）。
