# M4：dsl-render 配置渲染引擎 + cli 脚手架 实施方案

## 需求

实施方案（`.trae/documents/渐进式中台前端框架实施方案.md` §3.7 / §3.8 / 里程碑 M4）最后两个包：

1. `packages/dsl-render`（可选配置渲染引擎）：
   - 接收标准 JSON Schema，渲染查询区、表单、表格；
   - 底层复用 components / biz-components；
   - 双模式：独立渲染 / 接入 runtime 自动读取值集、权限（biz-components 的探测契约自然继承）；
   - 支持自定义组件插槽、联动、显隐、校验；
   - 手写 SFC 一等公民，配置渲染只是加速方案；Schema 强 TS 类型 + `validateSchema()` 校验工具；渲染器只渲染，保存事件抛给上层业务。
2. `packages/cli`（脚手架 `create-mengxi-ark`）：
   - 模板 A：轻量模板（无 runtime、无 DSL）；模板 B：中台基座模板（runtime + 模块注册）；
   - 模板尽量薄，业务能力全部走 npm 包；模板内置面向使用者的 `.trae/rules/` 用法速查，规则随模板分档；
   - 脚手架版本与框架包版本绑定。
3. 配套：demo 演示页（DSL 渲染加速方案板块）、VitePress「DSL 配置渲染」板块、单测、changesets 登记（dsl-render / cli 首次发布 minor）。

## 需求分析

- **涉及包**：`packages/dsl-render`（占位壳 → 真实实现）；`packages/cli`（占位壳 → 真实实现）；demo-light / demo-platform 各加 DSL 演示入口；apps/docs「DSL 配置渲染」板块；changeset。
- **依赖边界**：dsl-render 层级 4，可 import biz-components（3）/ components（2）/ hooks（1）；禁止 import runtime（双模式仍走 inject 探测）。cli 是应用层（层级表特视为 5），可引用全部 packages；`check-deps.mjs` 对 cli 有专门分支（CLI_LEVEL=5），src 内禁止 import `@mengxi-ark-internal/*`。
- **Schema 类型分层**：`QuerySchema / FormSchema / TableSchema` 显式导出 + `validateSchema()`；禁止 `any` 直传渲染器（规范 §10）。
- **组件映射**：`schema.type` → 注册表映射，业务可传映射表覆盖替换（渲染器不硬编码组件清单）。
- **现有可复用资产**：components（SearchForm / EnhanceTable / MxDialog 等九组件 + 适配器契约）、biz-components（Lov / DocumentTable 双模式）、hooks（useTable / useForm / useRequest）、theme token、demo-light 的 BaseMockProvider（基座 mock）。
- **构建/验证**：dsl-render 用 defineLibConfig（外部化 antdv/element-plus）；cli 为 Node 包（bin 入口，esbuild/rollup 打包或纯 ESM 直出，无 Vue）；门禁命令与 M3 相同。

## 伪代码设计

### 1. Schema 类型（`packages/dsl-render/src/types/`，强 TS）

```ts
// 三类 Schema 共用字段协议：type / name(字段名) / label / visible(显隐) / rules(校验) / 联动
interface FieldSchemaBase {
  type: string;            // 组件类型（映射表 key，如 'input' | 'select' | 'lov'）
  field?: string;          // 绑定字段名
  label?: string;
  visible?: (values: Record<string, unknown>) => boolean;   // 联动显隐（函数声明驱动）
  rules?: Array<{ required?: boolean; validator?: (v: unknown, values) => string | null; message?: string }>;
  props?: Record<string, unknown>;   // 透传给映射组件的 props
}

export interface QuerySchema { fields: QueryFieldSchema[]; ... }        // 渲染 SearchForm
export interface FormSchema { fields: FormFieldSchema[]; title?; ... }  // 渲染可编辑表单
export interface TableSchema { columns: TableColumnSchema[]; ... }      // 渲染 EnhanceTable / DocumentTable
export type ArkSchema = QuerySchema | FormSchema | TableSchema;

export function validateSchema(schema: unknown): ValidationResult;  // 结构校验（type/fields 必填等），返回 { valid, errors[] }
```

### 2. 渲染器组件（`packages/dsl-render/src/renderers/`）

```ts
// 组件映射注册表（业务可覆盖）：schema.type → 组件 + 值绑定方式
export interface SchemaComponentMap {
  [type: string]: Component;            // 默认表：input/select→适配器原子，lov→Lov，table→EnhanceTable/DocumentTable...
}
export const DEFAULT_COMPONENT_MAP: SchemaComponentMap;
export function createComponentMap(overrides?: SchemaComponentMap): SchemaComponentMap;  // 扩展优先

// 三个渲染器（props 驱动，保存/提交 emit 抛出，渲染器不带请求逻辑）
FormRenderer   { schema: FormSchema; modelValue; componentMap? }  → emit update:modelValue / submit（校验通过后抛全量）
QueryRenderer  { schema: QuerySchema }                            → emit search / reset（内部组合 SearchForm）
TableRenderer  { schema: TableSchema; dataSource?; ... }          → emit save / rowAdd / rowRemove（组合 EnhanceTable / DocumentTable）
// 双模式：Lov / DocumentTable 的基座联动由 biz-components 自身 inject 探测完成，渲染器零额外逻辑
```

### 3. cli（`packages/cli/`）

```ts
// bin: create-mengxi-ark（package.json bin 字段）
// 流程：交互选择模板（轻量 / 中台基座）→ 目标目录 → 拷贝 templates/<name> → 包名/占位符替换 → 输出后续指引
interface TemplateMeta { name: 'light' | 'platform'; label: string; description: string }
// templates/light：Vite + Vue + utils/theme/hooks/components/biz-components + 精简演示页 + .trae/rules/ark-light.md
// templates/platform：light 基础 + runtime + createArkRuntime + systemModule 示例 + .trae/rules/ark-platform.md
// 版本绑定：模板 package.json 中 @mengxi-ark/* 版本占位符由 cli 自身版本注入（版本对齐）
```

### 4. demo 与文档

- demo-light：新增「DSL 渲染」面板（Form/Query/Table 三渲染器独立模式 + 映射表覆盖示例）；
- demo-platform：新增 DSL 演示页（Lov 值集 / DocumentTable 权限走真实基座上下文）；
- docs：新增板块「DSL 配置渲染」：Schema 规范、组件映射、联动规则、双模式说明；开头声明「手写 SFC 一等公民，DSL 是加速方案」。

### 5. 测试与验证

- dsl-render 单测：validateSchema（合法/非法结构）、三个渲染器渲染结果、映射表覆盖、显隐联动、校验抛错；
- cli 单测：模板拷贝 + 占位符替换 + 版本注入（纯函数部分）；
- 运行验证：demo-light / demo-platform DSL 页浏览器验证；cli 用 `node ./bin create` 生成临时工程 + 安装依赖跑通 dev（验证后清理临时目录）。

## 疑问清单

### Q1 渲染器组件形态（影响：导出 API 与 Tree-Shaking）
方案 a（推荐）：三个独立渲染器 `QueryRenderer / FormRenderer / TableRenderer`，共享映射表与类型；
方案 b：单一 `SchemaRenderer` 按 `schema.kind` 分发。
选哪个？

回答：a——三个独立渲染器，共享映射表与类型。

### Q2 默认组件映射表首期覆盖范围（影响：工作量与文档示例）
方案 a（推荐）：覆盖现有适配器原子（input / select / date 等）+ SearchForm / EnhanceTable / Lov / DocumentTable / MxDialog，约 10~12 项；
方案 b：先只覆盖 6 个核心（input / select / lov / table / form / dialog）。
选哪个？

回答：a——全量 10~12 项。

### Q3 显隐/联动/校验的表达方式（影响：Schema 能否 JSON 序列化）
方案 a（推荐）：函数式声明（`visible/rules` 直接是函数，TS 体验最好，无法纯 JSON 序列化）；
方案 b：结构化声明（表达式字符串或条件 JSON，可序列化但实现重）。
说明：方案宣称「标准 JSON Schema」指结构为 JSON 形态；函数字段建议作为 TS 增强能力。
选哪个？

回答：a——函数式声明；结构为 JSON 形态，函数字段作为 TS 增强能力。

### Q4 cli 首期范围（影响：工作量边界）
方案 a（推荐）：首期只做 `create-mengxi-ark` 初始化（两模板 + 占位符替换 + 版本绑定），「接口生成页面」「组件模板生成」列遗留 TODO；
方案 b：首期包含接口→页面生成器（需定义接口描述格式，工作量显著增加）。
选哪个？

回答：a——仅初始化，页面生成器列遗留 TODO。

### Q5 cli 交互与模板技术选型（影响：cli 依赖）
方案 a（推荐）：`@clack/prompts`（轻量、现代交互）+ 模板为仓库内静态目录（cli 构建时拷入 dist 或随包发布 templates/）；
方案 b：`enquirer` / `inquirer`。
选哪个？

回答：a——`@clack/prompts` + 随包发布 templates/ 静态目录。

### Q6 交付范围确认（影响：DoD 边界）
dsl-render 三渲染器 + Schema 类型 + validateSchema + 映射表覆盖 + 单测 + demo-light/demo-platform 演示 + docs 板块；cli 初始化 + 两模板（含 .trae/rules 分档规则）+ 模板生成单测 + 临时工程运行验证；changeset（dsl-render minor + cli minor）。确认？cli 临时工程验证方式（生成→pnpm install→dev 启动）是否认可？

回答：确认；cli 验证方式认可（生成→pnpm install→dev 启动，验证后清理临时目录）。

## 实施记录

### 方案落地形态（与伪代码设计差异）

1. **渲染器形态**：按 Q1 落地三个独立渲染器（QueryRenderer / FormRenderer / TableRenderer），目录契约对齐组件规范（index.ts + Xxx.vue + __tests__）。
2. **联动 / 校验**：按 Q3 函数式声明——`visible(values)` 实时联动（Query / Form 均基于当前值），`rules`（required / validator）在 FormRenderer submit 前统一执行，`defineExpose({ validate })` 供宿主主动校验；结构保持 JSON 形态。
3. **映射表**：默认 13 项（input / select / dateRange / treeSelect / upload / button 原子 + lov / searchForm / enhanceTable / documentTable / dialog / statusTag / emptyState 实体），`createComponentMap(overrides, adapter)` 同 key 整体替换；组件统一 markRaw 防止 computed 深响应式代理组件对象。
4. **TableRenderer**：mode=table 组合 EnhanceTable（数据外部驱动，pageChange / sortChange / rowClick / update:expandedRowKeys 透传）；mode=document 组合 DocumentTable（v-model 行数据、save / rowAdd / rowRemove 透传、addable / deletable / savable / permissions 下发）；toolbar / bodyCell / expandedRow / empty 槽按宿主写入透传。
5. **差异**：QueryRenderer 未复用 SearchForm 而是自渲染行内布局——保证 `visible` 基于实时查询值联动（SearchForm 内部自持值无法支撑函数式显隐）；SearchForm 仍保留在映射表中供业务自组合。
6. **cli**：按 Q4/Q5——@clack/prompts 交互（模板选择 / 目录名 / 非空目录确认）、templates/ 随包发布、占位符 `__PROJECT_NAME__` / `__ARK_VERSION__`（版本与 cli 自身绑定）；构建由 vite lib 改为 tsc -p tsconfig.build.json（Node ESM，NodeNext，相对导入带 .js 后缀）；bin 为薄 wrapper（bin/create-mengxi-ark.js → dist/index.js run()）。
7. **补充决策**：FormFieldSchema 增加可选 `options`（select 类字段直传）；eslint-config 给 ts/vue 补 globals.browser、cli 包补 globals.node（顺带修复 M3 遗留的 no-undef 误报，属 internal 修复）。

### 变更文件清单

- `packages/dsl-render/`：src/{types/{common,query,form,table,index}, validate/validateSchema, componentMap, renderers/{QueryRenderer,FormRenderer,TableRenderer}, style/index.scss, index.ts, __tests__/stub-adapter}；package.json（dependencies components/biz-components + devDeps vite/vue-tsc/sass 等）、vite.config.ts（externals antdv/element-plus + cssFileName）、vitest.config.ts、tsconfig.spec.json、单测 4 文件 38 用例。
- `packages/cli/`：src/{index,scaffold,templates}.ts、bin/create-mengxi-ark.js、tsconfig.build.json、templates/light（9 文件）+ templates/platform（13 文件，均含 .trae/rules 分档规则）、单测 scaffold.spec.ts（8 用例）；package.json（bin + @clack/prompts）。
- `apps/demo-light/`：demos/DslDemo.vue（新增）+ App.vue（dsl tab）+ package.json（dsl-render 依赖）。
- `apps/demo-platform/`：views/DslDemoPage.vue（新增）+ modules/bizModule.ts（DSL 菜单路由）+ package.json。
- `apps/docs/`：dsl/index.md（新增）+ config.mts（nav + 侧栏「DSL 配置渲染」板块）。
- `internal/eslint-config/index.js`：globals 收敛（browser / node）。
- `.changeset/m4-dsl-render-engine.md` + `.changeset/m4-cli-scaffold.md`（双包 minor）。

### 验证方式与结果

1. 类型检查 / 构建：`turbo typecheck build test` 全仓 25 任务全绿（dsl-render ESM + .d.ts + index.css 产物确认；cli tsc 产出 dist/index.js + d.ts）。
2. 单测：dsl-render 38 用例 + cli 8 用例全过（含 Lov 上下文探测回归用例）。
3. 依赖门禁：deps:check（121 文件）+ peer:check 全过；M4 新增文件 eslint 零错误零警告。
4. docs：VitePress build 死链检查通过。
5. 浏览器验证（browser agent 实测）：
   - demo-light（5173）DSL tab：6 面板渲染、时间类型=自定义 联动出现日期范围、FormRenderer 校验/提交正常，控制台干净 —— PASS；
   - demo-platform（5174）/biz/dsl：3 卡片渲染、Lov「状态筛选」命中基座 lovCache.STATUS（启用/停用）、document 模式新增/保存按钮可用 —— PASS（首验 No data，修复后复验 PASS）；
   - cli 临时工程（生成 → pnpm install → dev 5199）：页面渲染、Lov 静态值集（男/女）、EnhanceTable + StatusTag + formatMoney 正常，控制台干净 —— PASS（首验 formatAmount 导出名错误白屏，修正为 formatMoney 后复验 PASS）。
6. 现场清理：临时验证目录（.tmp-verify / TEMP）已删除，无遗留调试代码（探针日志已还原）。

### 遗留 TODO

1. cli「接口生成页面 / 组件模板生成」——按 Q4 结论列后续版本（见 packages/cli/README 待补 ROADMAP）。
2. npm 发布前临时工程验证依赖 file: 协议模拟；正式验证需在 changesets publish 后以 registry 版本重跑一次脚手架端到端流程。
3. dsl-render dist 内含 __tests__ 声明文件（vite-plugin-dts 未排除测试目录），不影响导出面，后续可在 defineLibConfig 增加 dts exclude 优化包体积。
