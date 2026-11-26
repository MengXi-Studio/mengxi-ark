# 工程开发规范（mengxi-ark 曦舟）

> 本规则约束在本项目中的一切代码生成行为，依据 `.trae/documents/渐进式中台前端框架实施方案.md`。
> pnpm + Turborepo monorepo 分层、单向依赖、双模式业务组件与主题契约见本文件；
> 与本规则冲突的写法一律视为错误实现，即使 AI 认为「更简洁」或「TS 里惯用」。
> 任务推进流程见 `workflow.md`；运行时踩坑记录见 `.trae/documents/LESSONS_LEARNED.md`。

## 1. 技术栈（禁止擅自替换）

| 项                | 选型                                                        |
| ----------------- | ----------------------------------------------------------- |
| 运行框架          | Vue 3（Composition API）                                    |
| 构建              | Vite + esbuild                                              |
| 语言              | TypeScript 5.x，`strict: true`，全量 TS，契约优先           |
| 状态管理          | Pinia 4（ESM-only，peer `^4.1.0`）                          |
| 路由              | Vue Router 5（peer `^5.5.1`）                               |
| 包管理 / Monorepo | pnpm + Turborepo                                            |
| 样式              | SCSS + CSS Variables（Design Token）                        |
| 测试              | Vitest（单元）、Playwright（E2E）                           |
| 规范              | ESLint + Prettier + simple-git-hooks                        |
| 文档              | VitePress                                                   |
| 版本              | changesets 管理，SemVer                                     |
| 产物              | ES Module 为主（支持 CJS）+ 完整 `.d.ts`，保证 Tree-Shaking |

## 2. Monorepo 分层与依赖流向（强制，单向禁止反向/循环）

```
@mengxi-ark/cli
    ↓
应用层（apps/ 业务项目 / 业务模块包）
    ↓
【可选】@mengxi-ark/runtime      【可选】@mengxi-ark/dsl-render
    ↓
@mengxi-ark/biz-components
    ↓
@mengxi-ark/components
    ↓
@mengxi-ark/hooks
    ↓
@mengxi-ark/theme
    ↓
@mengxi-ark/utils
```

**硬性边界（CI 门禁会阻断，代码生成时必须自查）：**

- 下层包**绝对不能** import 上层包（如 utils 引 hooks、components 引 biz-components、biz-components import runtime）。
- biz-components 仅通过 `inject` 探测 runtime 上下文，**禁止硬编码 import runtime**。
- runtime / dsl-render 是可选包，安装与否不影响 components / biz-components 使用；未安装时自动降级，不抛致命异常。
- `packages/utils` 是纯函数层：仅原生 TS，**无 Vue 依赖、无 UI、无副作用、无全局状态**，需兼容 Web /
  Node 脚本导入；能力按四类归档——数据格式化（日期/金额/字典/数字）、数据结构（树遍历/数组/对象合并/深拷贝）、浏览器工具（下载/导出/blob/url参数）、校验与编码（规则/编码/加解密辅助），单一文件单一分类。
- `packages/theme` 是纯样式层：不含 Vue 组件、不含 JS 逻辑。
- UI 差异收敛在 UI 适配层（首期 Ant Design Vue、Element Plus，后续可扩 Naive UI）；hooks / components / biz-components 不直接耦合单一 UI 库 API。

## 3. 目录契约与装配点（唯一，禁止在别处落码）

| 需求                            | 唯一落点                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 纯工具函数                      | `packages/utils/src/<分类>/`（单一文件单一分类，禁止大杂烩 utils.ts）                                                         |
| Design Token / 主题             | `packages/theme/`（全部引用 token，禁止硬编码色值）                                                                           |
| 通用 hooks                      | `packages/hooks/src/useXxx/`                                                                                                  |
| 通用增强组件                    | `packages/components/src/<PascalName>/`                                                                                       |
| 业务语义组件（双模式）          | `packages/biz-components/src/<PascalName>/`                                                                                   |
| UI 适配器                       | 各包内 `adapter/`，禁止散落在组件文件里                                                                                       |
| 中台基座能力                    | `packages/runtime/`（内部按 tabService / menuService / moduleRegistryService / sessionService / contextService 拆分 service） |
| DSL 渲染                        | `packages/dsl-render/`（Schema 强 TS 类型 + 校验工具）                                                                        |
| 轻量示例                        | `apps/demo-light/`（无 runtime）                                                                                              |
| 中台示例                        | `apps/demo-platform/`（runtime + 模块注册）                                                                                   |
| 文档站                          | `apps/docs/`（VitePress）                                                                                                     |
| 共享 lint / tsconfig / 构建脚本 | `internal/eslint-config/`、`internal/tsconfig/`、`internal/build-scripts/`                                                    |

## 4. 命名清单（导入路径与命名以此为准，禁止凭记忆写）

| 名称         | 值                                                                                             | 说明                                                     |
| ------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| npm scope    | `@mengxi-ark/*`                                                                                | 所有对外发布包统一前缀，归属梦曦工作室 npm 组织          |
| 仓库         | `MengXi-Studio/mengxi-ark`                                                                     | MIT 协议                                                 |
| 包名         | `@mengxi-ark/utils` `theme` `hooks` `components` `biz-components` `runtime` `dsl-render` `cli` | 短横线命名                                               |
| 组件命名     | PascalCase                                                                                     | 目录与导出一致，如 `packages/components/src/SearchForm/` |
| hooks 命名   | `useXxx` 驼峰                                                                                  | 如 `useRequest`、`useAuth`                               |
| 指令命名     | `v-xxx`                                                                                        | 如 `v-permission`                                        |
| 业务项目安装 | `@mengxi-ark/cli` 脚手架名为 `create-mengxi-ark`                                               | `pnpm create mengxi-ark`                                 |

## 5. 各包约束要点（生成代码前对照）

- **hooks**：仅依赖 Vue / Pinia / VueRouter；不 import runtime，全局 store 支持手动传入降级；所有 hooks 支持配置覆盖、默认行为可关闭；**不劫持路由原生 API**，路由守卫交给业务或 runtime 注册。
- **components**：完全独立可导入，不需要基座注册；props 驱动优先，插槽兜底。
- **biz-components（双模式，核心契约）**：
  1. **独立模式（默认降级）**：传入 `api / params / permission` 等props，组件内部用 `useRequest` 自行请求，不需要任何基座。
  2. **基座联动模式**：`inject` 探测上层 runtime 上下文（全局值集缓存、用户信息、数据权限）；探测成功自动复用，**不 import runtime**。
  3. 基座提供的上下文字段**全部支持 props 兜底**；上下文丢失自动切独立模式。
  4. 组件只封装交互范式，不绑定后端固定字段。
- **runtime**：不修改 Vue / Router 底层原型，仅上层封装调度；提供生命周期钩子 `onAppInit` `onBeforeRouteChange` `onSessionExpired`，业务扩展走钩子，不 fork 源码。
- **dsl-render**：手写 SFC 是一等公民，配置渲染只是加速方案；渲染器只负责渲染，保存事件抛出给上层业务。
- **cli**：模板尽量薄，业务能力全部通过 npm 包引入，不写死在模板内；每个模板必须内置面向**使用者**的精简 AI 规则（`.trae/rules/` 用法速查：安装、主题覆盖、双模式 props、按需导入），轻量模板不得包含 runtime
  / 中台相关内容——使用者装完模板即获得规则，规则随模板分档「可拿走」。
- **变更频率隔离**：utils / theme 谨慎发版（低频稳定）；hooks / components / biz-components 持续新增（Minor）；runtime / dsl-render 严格控制破坏性变更（Major 必须附迁移文档）。

## 6. 组件库规范（components / biz-components）

### 6.1 组件目录契约（一个能力一个目录，缺一不可）

```
packages/components/src/SearchForm/
├── index.ts                  # 唯一导出入口（组件 + 类型 + 可选 withInstall）
├── SearchForm.vue            # SFC 实现（<script setup lang="ts">，组合式 API）
├── types.ts                  # Props / Emits / Slots 类型定义（随包导出 .d.ts）
├── style/index.scss          # 组件样式（只引用 theme 的 --mx-* token）
└── __tests__/SearchForm.spec.ts
```

> biz-components 同构，额外增加 `adapter.ts`（上下文探测与 props 兜底装配，见 6.4）。

### 6.2 Props / Events / Slots 契约

1. **props 驱动优先，插槽兜底**：可配置项一律走 props；插槽只用于 props 覆盖不了的定制场景（如自定义单元格、空状态插槽）。
2. props 语义（命名、类型、默认值）对齐底层 UI 库同名组件（Ant Design Vue / Element Plus），降低迁移心智。
3. `v-model` 遵循 Vue3 约定：`modelValue` + `update:modelValue`；多绑定用 `v-model:xxx`；`defineEmits` 必须显式声明全部事件，禁止运行时 `$emit` 未声明事件。
4. 每个 prop 必须 `required` 或带 `default`；类型从 `types.ts` 导出供业务复用。
5. 通用 props 约定：`size`（`sm | md | lg`）、`disabled`、`loading`、`readonly` 语义全库一致，经适配器映射到底层 UI 库。
6. attrs 透传保持 Vue 默认行为（禁用 `inheritAttrs: false` 需在 PR 说明理由并手工转发）。

### 6.3 UI 适配层（组件文件禁止直接耦合 UI 库）

- `packages/components/src/adapter/` 与 `packages/biz-components/src/adapter/` 内定义适配器接口与各 UI 库实现（首期 `antdv.ts`、`element-plus.ts`）。
- 组件内一律通过 `inject(UI_ADAPTER_KEY)` 获取适配器（未注入时取默认适配器 Ant Design Vue）；**禁止**在组件文件中 import `ant-design-vue` / `element-plus`（adapter 目录除外）。
- 新增组件涉及新 UI 库组件时，先扩适配器接口，再在两套实现中同步落地；只改一套实现视为未完成。
- biz-components 上下文探测：inject key 统一 `MX_RUNTIME_CONTEXT_KEY`；探测结果字段与兜底 props 同名对应（如 `lovListApi` ↔ 上下文 `lovApi`），缺失字段回退 props / 独立模式。

### 6.4 样式契约

- 组件样式只允许引用 `@mengxi-ark/theme` 的 CSS Variables（`var(--mx-*)`）；**禁止**硬编码色值、阴影、圆角、间距字面量（含 `#fff`、`rgba(0,0,0,.45)` 这类「看起来无害」的写法）。
- 派生色（hover / active / 禁用态）在 theme 中定义为 token，组件内不做颜色计算。
- 样式随包构建产出独立 css，支持按需导入（unplugin 样式入口）；禁止在组件 SFC 里写全局选择器污染宿主页面。

## 7. 主题 Token 规范（theme）

### 7.1 目录契约

```
packages/theme/src/
├── tokens/          # 基础 token（按类目拆文件）
│   ├── color.scss   # 色板 + 功能色 primary / success / warning / danger / info
│   ├── spacing.scss # 间距梯度（xs / sm / md / lg / xl）
│   ├── radius.scss  # 圆角梯度（sm / base / lg / round）
│   ├── shadow.scss  # 阴影层级（sm / base / lg）
│   └── z-index.scss # 层级表（见 7.3）
├── base.scss        # reset、排版、空状态、loading 基础样式
├── dark.scss        # 暗色主题（只覆盖语义层变量，不重定义色板）
├── adapters/        # antdv.scss / element-plus.scss：把 UI 库变量桥接到 --mx-* token
└── index.scss       # 入口 @use 汇总（业务项目只 import 这一个文件）
```

### 7.2 Token 命名与分层

1. CSS Variables 统一前缀 `--mx-`：`--mx-<类目>-<语义>`，如 `--mx-color-primary`、`--mx-color-text-secondary`、`--mx-spacing-md`、`--mx-radius-base`、`--mx-shadow-sm`、`--mx-z-modal`。
2. **基础层 → 语义层**两级：基础层只定义在 `tokens/`（色板、梯度），语义层（`--mx-color-text-*`、`--mx-color-bg-*`、`--mx-color-border-*`）必须引用基础层变量；禁止语义层直接写色值。
3. 命名禁止出现具体色名做语义（如 `--mx-color-red`），语义命名（primary / danger / text-secondary）优先。
4. 新增 token 必须同步：`tokens/<类目>.scss` 基础值 + `dark.scss` 暗色取值（颜色类）；缺失暗色取值视为未完成。
5. 不含 JS 逻辑、不含 Vue 组件；token 定义即契约，**改既有 token 默认值按破坏性变更走 Major**。

### 7.3 z-index 层级表（全库统一，组件禁止自造层级）

| 层级      | token             | 基准值 |
| --------- | ----------------- | ------ |
| 基础内容  | `--mx-z-base`     | 0      |
| 吸顶/吸底 | `--mx-z-sticky`   | 100    |
| 下拉/浮层 | `--mx-z-dropdown` | 1000   |
| 抽屉      | `--mx-z-drawer`   | 1200   |
| 模态框    | `--mx-z-modal`    | 2000   |
| 消息/通知 | `--mx-z-message`  | 3000   |

> 组件叠加场景（如弹窗内再弹下拉）按「上层 = 基准 + 10」微调，禁止拍脑袋写 9999。

### 7.4 主题覆盖与 UI 库桥接

- 业务项目覆盖方式：在自有样式表中重定义同名 `--mx-*` 变量（CSS Variables 运行时覆盖生效），**无需 fork theme**；禁止提供 JS 运行时改 token 的 API。
- 暗色切换约定：宿主根节点挂 `data-theme="dark"`（或 `.mx-theme-dark`），`dark.scss` 以该选择器为作用域覆盖语义层变量。
- UI 库变量桥接：`adapters/antdv.scss` / `element-plus.scss` 把 `--ant-*` / `--el-*` 相关变量映射到 `--mx-*` token，保证 theme/components 在两种 UI 库下视觉一致；未映射的 UI 库变量不得在组件中直接消费。

## 8. Hooks 规范（hooks）

### 8.1 首期分组（与实施方案 3.3 一一对应，禁止跨组堆功能）

| hook         | 职责边界                              |
| ------------ | ------------------------------------- |
| `useRequest` | 请求、loading、错误、取消、重试、缓存 |
| `useAuth`    | 权限判断 + `v-permission` 指令        |
| `useSession` | token、自动刷新、持久化、登出         |
| `useI18n`    | 国际化读取、切换                      |
| `useTable`   | 查询、分页、排序、筛选状态            |
| `useForm`    | 表单回显、重置、校验封装              |

### 8.2 通用签名与返回值约定

1. 参数形如 `(source, options?)`：`options` 恒为对象且全部字段可选；禁止位置布尔参数（如 `(fn, true)`）。
2. 返回值是响应式对象（refs / computed），禁止返回裸 promise 丢状态；副作用方法（`run` / `cancel` / `reset`）与状态并列返回。
3. **卸载自动清理**：`onUnmounted` 取消请求、清定时器、解绑监听；组件外调用（无组件实例）不得报错，仅跳过清理。
4. 所有 hooks 支持配置覆盖、默认行为可关闭（`options.enabled: false` 类开关）；默认值写进常量并在 JSDoc 标注。
5. 依赖全局 store 的 hook 支持手动传入降级：`useAuth(adapter?)`——传了用 adapter，没传按 `inject` 探测，都失败则降级到安全默认（如 `hasPermission` 返回 `false`）并 console.warn 一次（可关）。

### 8.3 各 hook 关键行为约定

- **useRequest**：内置竞态保护（旧响应丢弃）；手动 `run` / `cancel` / `refresh`；`retry` 支持次数 + 间隔退避配置；缓存需显式 `cacheKey`，默认不缓存。
- **useAuth**：`hasPermission(code | code[], mode?: 'some' | 'every')`；权限源可注入（Pinia store 或 adapter）；`v-permission` 无权限时移除元素（`removeChild`），提供 `disabled` 模式替代移除。
- **useSession**：token 存取介质可配置（localStorage / cookie）；自动刷新失败回调 `onSessionExpired` 交给业务或 runtime 决定登出，**hook 自己不跳转路由**。
- **useTable**：查询参数合并（分页/排序/筛选 + 额外 filters）、`reset` 回默认查询；返回 `dataSource / loading / pagination / search` 等响应式集合。
- **useForm**：回显 `setFieldsValue`、重置、提交校验封装；表单实例由外部传入（适配器产出），hook 不直接耦合 UI 库 Form API。

### 8.4 红线（重申，违反即 CI 门禁阻断）

- 仅依赖 Vue / Pinia / VueRouter；禁止 import runtime、biz-components、components。（hooks 当前实现未引入 Pinia/VueRouter，peer 仅声明 `vue ^3.5.0`；后续实际引入时按 `pinia ^4.1.0` / `vue-router ^5.5.1` 声明 peer）
- 禁止劫持路由原生 API（`router.push` / `beforeEach` 等），路由守卫交给业务或 runtime 注册。
- 禁止在 hook 内写业务字典、业务接口地址；请求实例（axios / fetch 封装）由业务注入。

## 9. Runtime 基座规范（runtime）

### 9.1 目录契约（内部按 Service 拆分）

```
packages/runtime/src/
├── services/
│   ├── tabService/              # Tab 工作台：打开 / 缓存 / 关闭 / 打开策略（新Tab/弹窗/当前页）
│   ├── menuService/             # 菜单注册与渲染数据
│   ├── moduleRegistryService/   # registerModule 注册中心
│   ├── sessionService/          # 会话监听、单点登出回调、token 刷新调度
│   └── contextService/          # 全局上下文 provide（MX_RUNTIME_CONTEXT_KEY）
├── layout/                      # 内置工作台 Layout（可替换，非强制；UI 引用只允许在这里）
├── types.ts                     # RuntimeContext / ModuleDefinition / 生命周期钩子签名
└── index.ts                     # install() / registerModule() / provideContext() 导出
```

### 9.2 模块注册契约

1. `registerModule(module: ModuleDefinition)`：ModuleDefinition 只含声明式字段（`routes / menus / components / permissions / lifecycle hooks`），模块包**不 import runtime 内部实现**，只依赖类型。
2. 全局上下文经 `provide(MX_RUNTIME_CONTEXT_KEY, ctx)` 下发；字段即 biz-components 的探测契约（user / tenant / org / 值集缓存 / permissions…），**增删字段按破坏性变更走 Major 并附迁移说明**。
3. 生命周期钩子 `onAppInit / onBeforeRouteChange / onSessionExpired`：可注册多个、按注册顺序执行；`onBeforeRouteChange` 返回 `false` 阻断跳转。
4. 路由守卫用 `router.beforeEach` 包装注册，**禁止重写 `router.push` 等原生 API 或改 Vue/Router 原型**。
5. runtime 位于依赖链上层，可 import hooks / components / biz-components（Layout 内复用组件）；但 `services/` 保持纯逻辑，UI 依赖只收敛在 `layout/`。

## 10. DSL 渲染引擎规范（dsl-render）

1. Schema 强 TS 类型：`FormSchema / TableSchema / QuerySchema` 显式导出，提供 `validateSchema()` 校验工具；禁止 `any` 直传渲染器。
2. 组件映射：`schema.type` → components / biz-components 的注册表映射；业务可用映射表覆盖替换组件（扩展优先，渲染器不硬编码组件清单）。
3. 渲染器只渲染：联动 / 显隐 / 校验由 Schema 声明驱动；保存 / 提交事件 emit 抛给上层业务，渲染器不自带提交请求逻辑。
4. 双模式同 biz-components 契约：`inject` 探测 runtime 自动读取值集 / 权限，探测失败降级 props 独立渲染。
5. 手写 SFC 一等公民：文档与 demo 必须先演示 SFC 写法，DSL 仅作为加速方案放在独立板块。

## 11. API 与代码风格

1. 所有导出 API 必须写 JSDoc 注释，标注参数、返回值、**可选基座联动说明**（独立模式 / 基座联动模式差异）。
2. 废弃 API 添加 `@deprecated` JSDoc，大版本才移除。
3. peerDependency 声明 Vue / Pinia / VueRouter 版本范围，避免多实例冲突；runtime / dsl-render 用 optionalDependencies 语义（未安装不加载）。
4. 全部输出 ES Module；runtime、dsl-render 独立入口，不打包进基础组件包；组件支持按需导入。
5. theme 不写硬编码色值，全部引用 Design Token（color / spacing / radius / shadow / z-index）；业务项目可外部覆盖变量，无需 fork 源码。

## 12. 文档体系契约（apps/docs）

1. 板块结构固定，与实施方案第 7 节一致：**快速上手（轻量模式）**（禁提 runtime / 模块注册）→ **中台进阶（Runtime 基座）** → **DSL 配置渲染**；附加板块：API 文档、迁移指南、FAQ、对比参考。
2. 每个组件文档提供**两套示例**：独立模式 + 基座联动模式，缺一视为未完成。
3. 文档示例必须与 demo 工程可运行代码对齐（复制即可跑）；API 表格与 `types.ts` 导出核对一致后方可合并。
4. Roadmap（里程碑排期）公开在 README / docs；破坏性变更必须同步迁移指南。

## 13. Git 分支与 PR 协作规范（开源协作）

1. 分支模型：`master`（稳定，可随时打 tag 发布）/ `feature/*`（新功能）/ `fix/*`（修复）/ `docs/*`（文档）/ `release/*`（发版准备）。
2. PR 规范：一个 PR 只解决一个问题；标题格式 `[包名] 描述`（如 `[biz-components] Lov组件增加独立模式params自动防抖`）；必须关联 Issue；单测补齐；至少一名维护者 review 通过且 CI 全绿方可合并。
3. 标签体系：`bug` `feature` `documentation` `good first issue`。
4. 版本公告：每次 Release 在 Discussions 发布，写明变更与迁移要点。
5. 变更频率隔离执行：utils / theme 谨慎发版；runtime / dsl-render 严格控制破坏性变更，Major 必须附迁移文档 / 迁移脚本。

## 14. 验证（core-protocol DoD 的项目级补充）

**CI 门禁（GitHub Actions，对应实施方案 4.2，全绿方可合并 master）：**

1. 依赖链路检查脚本（反向 import 直接阻断）
2. ESLint + 类型检查 `tsc --noEmit`
3. Vitest 单元测试
4. Turborepo build 全包构建校验
5. 包版本 peerDependency 对齐校验

**本地验证清单：**

- **类型检查**：`pnpm turbo run typecheck`（或各包 `tsc --noEmit`）。
- **构建**：`pnpm turbo run build` 全链路通过，确认 `.d.ts` 与 ESM 产物生成。
- **单测**：`pnpm turbo run test`（Vitest），新增导出必须有单测。
- **依赖门禁**：`internal/build-scripts/` 的依赖链路检查脚本通过（反向 import 直接阻断）。
- **运行验证**：
  - 涉及组件 / hooks / biz-components → 在 `apps/demo-light` 实际运行验证独立模式；
  - 涉及 runtime / 基座联动 → 在 `apps/demo-platform` 验证模块注册、Tab 工作台、inject 探测与降级切换。
- **文档**：`apps/docs` 构建通过（VitePress 死链检查）；每个组件文档提供**两套示例**：独立模式 + 基座联动模式。
- **版本发布**：仅通过 changesets 流程（`pnpm changeset` → version → publish），禁止手改 package.json version。
