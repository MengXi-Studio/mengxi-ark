# 核心概念

阅读完[快速上手](/guide/getting-started)后，本章帮你建立理解曦舟全部能力所需的心智模型：分层架构、双模式业务组件契约、主题体系、UI 适配层与 hooks 通用约定。掌握这五个概念后，你在使用任何 `@mengxi-ark/*` 包时都能预测它的行为。

## 分层架构

曦舟是 pnpm + Turborepo 管理的分层 monorepo，依赖**严格单向流动**，每一层只知道自己下一层的存在：

```
@mengxi-ark/cli            脚手架 create-mengxi-ark：拉起轻量 / 中台双模板
        ↓
应用层                     业务项目 / demo 工程：唯一组装一切包的地方
        ↓
【可选】@mengxi-ark/runtime            中台基座：Tab 工作台 / 菜单 / 模块注册 / 会话 / 全局上下文
【可选】@mengxi-ark/dsl-render         DSL 配置渲染：Schema 强类型 + 三渲染器，只渲染不请求
        ↓
@mengxi-ark/biz-components 双模式业务语义组件：Lov / DocumentTable 等，独立可跑、装基座自动联动
        ↓
@mengxi-ark/components     通用增强组件：SearchForm / EnhanceTable 等，props 驱动优先、插槽兜底
        ↓
@mengxi-ark/hooks          通用组合式函数：useRequest / useTable / useAuth 等，不绑定后端与 UI 库
        ↓
@mengxi-ark/theme          Design Token 纯样式层：全量 --mx-* CSS Variables，不含 JS 逻辑
        ↓
@mengxi-ark/utils          纯函数工具层：无 Vue 依赖、无副作用，兼容 Web / Node
```

**红线：下层包绝不 import 上层包。** utils 不知道 Vue 的存在，theme 不知道组件的存在，biz-components 与 runtime 之间**零 import 耦合**——两者只共享 `MX_RUNTIME_CONTEXT_KEY` 契约类型，靠 `inject` 探测联动。这条红线由 CI 依赖链路检查强制执行，也是 runtime / dsl-render 作为「可选包」在技术上成立的前提：不装基座，下层包不会有任何缺失依赖。

**变更频率也按层隔离**：越靠下层越稳定——utils / theme 谨慎发版；hooks / components / biz-components 持续新增（Minor）；runtime / dsl-render 严格控制破坏性变更（Major 必附迁移文档）。

## 双模式业务组件契约

biz-components 的每个组件（Lov、DocumentTable）都遵循同一套双模式契约，核心是三种数据源形态：

| 形态 | 触发条件 | 数据来源 |
| --- | --- | --- |
| **独立模式（默认降级）** | 传入 `api` / `params` / `permissions` 等 props | 组件内部用 `useRequest` 自行请求，不需要任何基座 |
| **基座联动模式** | `inject` 探测到 `MX_RUNTIME_CONTEXT_KEY` 上下文 | 自动复用基座下发的值集缓存 / 列表接口 / 权限源 |
| **独立空态** | 上下文与 props 均未提供数据源 | 渲染空态并 `console.warn` 一次，**不抛致命异常** |

### 降级链：上下文 → props → 独立空态

数据源解析优先级恒定不变，以 Lov 为例：

1. **上下文命中**：`lovCode` 命中基座值集缓存，或复用上下文 `lovListApi`；
2. **props 回退**：上下文缺失该字段时回退同名 props（`lovApi` / `lovCache` / `lovOptions`），字段名一一对应；
3. **独立空态**：全部缺失渲染空数据源，警告一次后静默降级，应用继续运行。

这意味着：**装了基座自动联动，没装（或上下文字段丢失）自动降级，业务代码一行不改**。runtime 是纯增量依赖——这正是「渐进式」的含义：业务长大后引入基座，既有组件立即获得基座能力。

### 契约稳定性

探测键 `MX_RUNTIME_CONTEXT_KEY` 与字段集 `MxRuntimeContext`（user / tenant / org / permissions / lovListApi / lovCache）由 biz-components 定义、runtime 扩展下发；上下文字段增删按破坏性变更走 **Major** 并附迁移说明。

## 主题体系

`@mengxi-ark/theme` 是纯样式层：不含 Vue 组件、不含 JS 逻辑，全部能力以 CSS Variables 输出。

### 两级 token：基础层 → 语义层

| 层级 | 内容 | 示例 |
| --- | --- | --- |
| 基础层（`tokens/`） | 色板梯度 / 间距 / 圆角 / 阴影 / 字体 / z-index | `--mx-color-primary-1..10`、`--mx-spacing-md`、`--mx-radius-base` |
| 语义层（`semantic.scss`） | 功能色 / 文本 / 背景 / 边框，**必须引用基础层变量** | `--mx-color-text-primary`、`--mx-color-bg-container`、`--mx-color-border-split` |

业务与组件样式只允许消费语义层 `var(--mx-*)`，禁止硬编码色值；派生态（hover / active / 禁用）在 theme 中定义为独立 token，组件内不做颜色计算。

### 暗色切换与业务换肤

- **暗色**：宿主根节点挂 `data-theme="dark"`（或 `.mx-theme-dark` 类），暗色样式只覆盖语义层变量与阴影，色板保持不变，无需重新加载样式；
- **换肤**：在自有样式表重定义同名 `--mx-*` 变量即可，CSS Variables 运行时覆盖生效，**无需 fork theme**：

```css
:root {
  --mx-color-primary: #0958d9;
  --mx-radius-base: 4px;
}
```

### UI 库变量桥接

`theme/src/adapters/antdv.scss` 与 `element-plus.scss` 把 `--ant-*` / `--el-*` 主要变量映射到 `--mx-*` token，保证框架组件在两种 UI 库下视觉一致；未映射的 UI 库变量不得在组件中直接消费。详见 [theme API](/api/theme)。

## UI 适配层

同一份业务代码要同时跑在 Ant Design Vue 与 Element Plus 上，差异必须收敛到一个位置——UI 适配层：

- 统一契约 `UiAdapter` 定义原子能力（Input / Select / RangePicker / Button / DataTable / Modal / Drawer / Upload / TreeSelect）与统一 props 语义（`modelValue` 受控、`sm | md | lg` 尺寸）；
- 组件内一律经 `inject(UI_ADAPTER_KEY)` 获取适配器，未注入时使用默认适配器 Ant Design Vue；**组件文件禁止直接 import 任何 UI 库**（adapter 目录除外）；
- 业务或基座可 `app.provide(UI_ADAPTER_KEY, adapter)` 整体切换 UI 库；
- 新增组件涉及新原子能力时，先扩 `UiAdapter` 接口，再在 antdv / element-plus **两套实现中同步落地**，只改一套视为未完成。

对业务的直接收益：`MxColumn` / `MxPaginationState` / `MxRowSelection` 等统一类型在两套 UI 库下完全一致，切换 UI 库不改组件用法。

## hooks 通用约定

全部 hook 遵循同一组签名与行为约定，学会一个即学会全部：

1. **签名 `(source, options?)`**：第一参数是业务注入的数据源 / 配置（请求实例、表数据），`options` 恒为对象且字段全部可选；禁止位置布尔参数；
2. **返回响应式对象**：状态（refs / reactive）与副作用方法（`run` / `cancel` / `reset`）并列返回，不返回裸 promise；
3. **卸载自动清理**：`onUnmounted` 自动取消在途请求、清定时器、解绑监听；组件外调用（无组件实例）仅跳过清理，不报错；
4. **默认行为可关闭**：`options` 中每个默认行为都有对应开关——如 useRequest / useTable 的 `immediate: false` 关闭自动首查、useAuth 的 `silentWarn: true` 关闭降级警告；默认值均为常量并在 JSDoc 标注；
5. **权限源三级降级**（useAuth / v-permission）：显式传入 adapter → `inject` 探测 `MX_AUTH_ADAPTER_KEY` → `setAuthAdapter` 模块级注册源 → 安全默认（`hasPermission` 恒为 false）并警告一次；
6. **不绑定后端**：hook 内不写业务字典、业务接口地址，不劫持路由原生 API，路由守卫交给业务或基座注册。

## 下一步

概念就绪，进入 [组件实战](/guide/components-guide)：用五步渐进方式把 SearchForm / EnhanceTable / Lov / DocumentTable 真正跑起来。
