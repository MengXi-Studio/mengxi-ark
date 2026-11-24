---
name: ark-package
description: 按 mengxi-ark 既定标准流程向框架包新增能力：纯工具函数、Design Token、hooks、通用增强组件、双模式业务组件、runtime 基座 service、DSL Schema 能力。覆盖源码、类型与 JSDoc、Vitest 单测、demo 验证、VitePress 双示例文档与 changesets 发版登记的完整闭环。当用户要求新增 hook（如 usePermission）、通用组件（如增强 Table）、业务组件（如 Lov 值集选择器）、主题 token、工具函数、runtime service（如 tabService）或 DSL Schema 能力时使用。不用于 demo 页面 / VitePress 文档站配置与侧栏维护、changesets 发版执行与 CI 工作流调整、monorepo / CLI 模板脚手架搭建（上述工作面流程不同，未来按需拆分为独立技能）或纯 bug 修复。
---

# 框架包能力开发（ark-package）

在本仓库向任何包新增能力，一律按下方流程落码，全程强制遵循 `.trae/rules/engineering-conventions.md`（分层依赖、目录契约、双模式契约）、`.trae/rules/workflow.md`（文档驱动四步工作流：建立任务文档 → 等待并读取回答 → 实现与验证 → 实施记录回填）与 `.trae/rules/core-protocol.md`（DoD）。禁止跳步，禁止「为了简洁」绕过依赖边界与双模式契约。

## 0. 需求确认（动手前）

- **先判落包**：按能力类型判定唯一落点（见 engineering-conventions 第 3 节）——纯函数 → utils；样式 token → theme；逻辑复用 → hooks；UI 增强 → components；B 端单据语义 → biz-components；Tab/菜单/模块注册等基座能力 → runtime（按 service 拆分，见第 9 节）；JSON Schema 配置渲染 → dsl-render（见第 10 节）。判定存疑时用 `AskUserQuestion` 确认，禁止随手塞进大杂烩文件。
- **再判依赖**：确认目标包的下游（能 import 什么）与上游（禁止 import 什么）。任何设计需要下层包引用上层包时，必须停下提出异议。
- **对标设计**：组件参考 Ant Design Vue / Element Plus 同名组件的 API 语义（props 命名、事件、插槽），hooks 参考 VueUse / ahooks 的语义；对齐优先于自创 API。
- 动工前明确导出 API 清单：函数签名 / props / events / slots；业务组件须同时给出独立模式与基座联动模式两种用法签名。

## 1. 源码实现（packages/<pkg>/src/）

- 全量 TypeScript，`strict: true`；组合式 API；一个能力一个目录（如 `packages/hooks/src/useRequest/`），入口 `index.ts` re-export。
- **utils**：纯函数、无状态、无副作用、无 Vue 依赖；单一文件单一分类，禁止大杂烩 utils.ts。
- **theme**：全部引用 Design Token，禁止硬编码色值；token 命名 `--mx-<category>-<name>`（CSS Variables），亮 / 暗主题双套取值。
- **hooks**：仅依赖 Vue / Pinia / VueRouter；不 import runtime；依赖全局 store 的 hook 必须支持手动传入降级（如 `useAuth(adapter?)`）；不劫持路由原生 API；默认行为可关闭、可配置覆盖。
- **components**：props 驱动优先，插槽兜底；完全独立可导入，不需要基座注册；UI 库差异一律走 `adapter/` 适配层，组件文件内禁止出现 `ant-design-vue` / `element-plus` 的直接 import（适配器除外）。
- **biz-components（双模式硬契约）**：
  1. 独立模式为默认降级：`api / params / permission` 等props 驱动，内部 `useRequest` 自行请求；
  2. 基座联动：`inject` 探测 runtime 上下文（值集缓存 / 用户信息 / 数据权限），**禁止 import `@mengxi-ark/runtime`**；
  3. 基座上下文的每个字段都必须有同名 props 兜底；
  4. 探测失败自动切独立模式，不抛致命异常；
  5. 只封装交互范式，不绑定后端固定字段（字段映射用 props / adapter 配置）。
- **runtime**：按五 Service 拆分（tab / menu / moduleRegistry / session / context，见 engineering-conventions 9.1）；`registerModule` 只收声明式 ModuleDefinition；上下文经 `provide(MX_RUNTIME_CONTEXT_KEY)` 下发；路由守卫只包装注册，禁止改 Vue/Router 原型；UI 依赖只收敛在 `layout/`。
- **dsl-render**：Schema 强 TS 类型 + `validateSchema()`；组件映射表可被业务覆盖；只渲染，保存事件抛上层；同双模式降级契约。
- 禁止：底层包写业务字典、业务接口地址、业务硬编码。

## 2. 类型与 JSDoc

- 所有导出 API 写 JSDoc：参数、返回值、示例；**双模式能力必须标注「独立模式 / 基座联动模式」差异说明**。
- 废弃 API 添加 `@deprecated`；禁止在大版本前移除。
- 导出类型随实现导出（`.d.ts` 完整）；peerDependencies 声明 Vue / Pinia / VueRouter 版本范围，不把宿主依赖写成 dependencies。

## 3. 单元测试（Vitest）

- 新增导出必须有单测：utils 覆盖边界值；hooks 覆盖默认行为、配置覆盖、降级路径；biz-components 覆盖**双模式切换**（有 / 无 runtime 上下文）与 props 兜底。
- 测试文件与源码同目录（`__tests__/` 或 `*.spec.ts`）。

## 4. Demo 验证（apps/demo-light / apps/demo-platform）

- 独立能力 → 在 `apps/demo-light` 添加演示页并实际运行，验证无控制台报错。
- biz-components → demo-light 验证独立模式；demo-platform 验证基座联动（inject 命中复用全局上下文）与**降级切换**（上下文丢失回退独立模式）。
- runtime 相关 → demo-platform 验证模块注册、Tab 工作台、生命周期钩子。

## 5. 文档（apps/docs VitePress）

- `apps/docs/` 对应板块新增 md：快速上手（轻量模式）面向普通使用者，**不提及 runtime**；中台进阶板块才写基座联动。
- 每个组件文档提供**两套示例**：独立模式示例 + 基座联动示例。
- 更新 VitePress 侧栏配置；运行文档构建确认无死链。

## 6. 发版登记（changesets）

- 对外可见变更：`pnpm changeset` 在对应包下登记，类型按 SemVer 判定（bug 修复 → Patch；新增能力 → Minor；破坏性 → Major 且必须附迁移说明）。
- **禁止**手改任何 package.json 的 version 字段。

## 7. 验证闭环（DoD 硬性要求）

1. `tsc --noEmit` / turbo typecheck 通过。
2. `pnpm turbo run build` 受影响包构建通过（ESM + `.d.ts`）。
3. `pnpm turbo run test` 全部通过。
4. 依赖链路检查通过：无反向 / 循环 import，biz-components 无 runtime import。
5. demo 实际运行关键路径（双模式组件两种模式都验）无运行时错误。
6. 文档构建通过；清理临时调试代码后方可报告完成。

## 常见错误（直接判失败）

- 下层包 import 上层包（utils 引 hooks、components 引 biz-components、biz-components import runtime）
- 组件文件里直接 import 具体UI库而不走适配层
- 双模式组件缺 props 兜底、探测失败抛异常、绑定后端固定字段
- hooks 劫持路由原生 API、强依赖全局 store 且无手动传入降级
- utils 引入 Vue / 副作用 / 全局状态；theme 写硬编码色值
- 新增导出无单测、无 JSDoc、双模式未标注差异
- 文档只写一种模式示例、文档提及 runtime 放进轻量快速上手板块
- 手改 package.json version 绕过 changesets
