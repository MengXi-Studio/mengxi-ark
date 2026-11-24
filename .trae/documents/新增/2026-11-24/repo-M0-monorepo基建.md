# M0 Monorepo 基建 实施方案

> 任务文档遵循 `workflow.md` 文档驱动四步流程。当前状态：**已完成（实施记录已回填）**。

## 需求

实施方案第 8 节 M0：初始化基建——

1. 搭建 monorepo + turbo + pnpm 骨架
2. CI、eslint、tsconfig、changesets、github 工作流
3. 仓库基础文件：README、LICENSE、CONTRIBUTING.md、Issue 模板

## 需求分析

**影响面：**

| 区域 | 内容 | 对应规则 |
| --- | --- | --- |
| 仓库根 | `package.json`、`pnpm-workspace.yaml`、`turbo.json`、`.gitignore`、`.npmrc`、`.prettierignore` | engineering-conventions §1/§3 |
| `internal/tsconfig` | 共享 tsconfig base（strict、ESM、bundler 解析） | §1 技术栈 |
| `internal/eslint-config` | 统一 ESLint 收口（flat config）+ Prettier | §11 |
| `internal/build-scripts` | 依赖链路检查脚本（CI 门禁第 1 项）、peerDependency 对齐校验 | §14 CI 门禁 |
| `packages/*` | 包壳（package.json + tsconfig + 空入口），**不写实现**（M1 范围） | §2 分层 |
| `.github/` | `workflows/ci.yml`、`workflows/release.yml`（changesets 占位）、`ISSUE_TEMPLATE/`、`PULL_REQUEST_TEMPLATE.md` | §13/§14 |
| 根文档 | `README.md`（方案附录摘要扩展）、`CONTRIBUTING.md`、LICENSE（已存在，核对版权主体） | §13 |

**依赖边界：** M0 只建壳，无真实 import 流向问题；但依赖链路检查脚本必须在本阶段就位并可运行（CI 依赖它）。

**明确不做（后续里程碑）：** packages 实现、apps/demo-* 与 apps/docs 实体、组件文档、发包。

## 伪代码设计

### 目录产出清单

```
mengxi-ark/
├── .github/
│   ├── ISSUE_TEMPLATE/{bug_report.md, feature_request.md, docs_feedback.md}
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── ci.yml            # PR → master：deps-check → lint+typecheck → test → build
│       └── release.yml       # changesets：版本 PR 收集 + 手动触发发布（M0 占位）
├── internal/
│   ├── eslint-config/{package.json, index.js(flat), package.json 导出}
│   ├── tsconfig/{package.json, base.json, vue-library.json}
│   └── build-scripts/
│       ├── package.json
│       ├── check-deps.mjs        # 扫描 packages/*/src 的 import，按依赖层级表阻断反向引用
│       └── check-peer-deps.mjs   # 校验 @mengxi-ark/* 各包 peer/dep 声明与层级表一致
├── packages/{utils,theme,hooks,components,biz-components,runtime,dsl-render,cli}/
│   └── (壳) package.json + tsconfig.json + src/index.ts + vitest 占位（除 theme/cli 按需）
├── .changeset/config.json
├── pnpm-workspace.yaml      # packages: packages/*, apps/*, internal/*
├── turbo.json               # tasks: build(依赖^build) / typecheck / test / lint
├── package.json             # packageManager、engines、scripts: build/typecheck/test/lint/deps:check/changeset
└── README.md / CONTRIBUTING.md / LICENSE(已有)
```

### 关键配置要点（非最终代码）

- **依赖层级表**：check-deps.mjs 内置 `{ utils:0, theme:0, hooks:1, components:2, 'biz-components':3, runtime:4, 'dsl-render':4 }`，import 层级 ≤ 自身才合法；theme/utils 特例：theme 禁 JS import，utils 零依赖。
- **包壳 package.json 要点**：`"type": "module"`、`exports` 指向构建产物、`peerDependencies` 仅声明 Vue 生态（按包豁免 utils）、`files` 白名单、`publishConfig.access: public`。
- **构建方案**：由 Q2 答案定，倾向 tsup（esbuild 内核，dts 生成，配置最薄）。
- **CI**：单 job 顺序执行 deps:check → lint → typecheck → test → build，失败即阻断；Node 版本按 Q1/Q4。

## 疑问清单

### Q1 版本基线（影响 engines / packageManager / CI / peerDependencies）
Node 与 pnpm 基线？建议 Node 22 LTS + pnpm 10.x；TypeScript 5.x 最新稳定；peerDependencies 的 Vue 范围建议 `^3.5.0`。
回答：使用建议。即 Node 22 LTS + pnpm 10.x + TS 5.x 最新稳定 + Vue peer `^3.5.0`。

### Q2 打包方案（影响所有 packages 的构建脚本，M1 起沿用）
方案文本仅说「Vite + esbuild」。候选：
- A. **tsup**（esbuild 内核 + rollup-types dts，配置最薄，社区广泛）——推荐
- B. Vite lib mode + vite-plugin-dts（与业务构建同构，但 lib mode 配置较繁琐）
- C. unbuild（rollup 内核，Nuxt 系）
选哪个？

**系统分析（按本项目硬性约束逐条评估）：**

| 评估维度 | A. tsup | B. Vite lib mode | C. unbuild |
| --- | --- | --- | --- |
| **Vue SFC 编译**（components / biz-components / runtime 含 .vue，硬性必需） | ❌ 原生不支持，依赖第三方 esbuild-plugin-vue（质量参差、tsup 5 插件 API 变动，style 块编译不完整） | ✅ `@vitejs/plugin-vue` 一等支持 | ⚠️ 需挂 rollup-plugin-vue，mkdist 转译模式不编译 SFC，文档稀少 |
| **SCSS 编译与 CSS 抽离**（theme + 组件 style/index.scss，需产出独立 css 按需导入） | ❌ CSS 仅内联注入，无独立产物 | ✅ 原生 CSS 抽离（`build.lib` + cssCodeSplit） | ⚠️ 需手配 rollup postcss 链 |
| **`.d.ts` 生成**（含 .vue 组件类型，需 vue-tsc） | ✅ 好（纯 TS 场景） | ✅ vite-plugin-dts 基于 vue-tsc，SFC 类型完整 | ✅ 好（纯 TS 场景） |
| **纯 TS 包**（utils / hooks） | ✅ 最优 | ✅ 同样胜任 | ✅ 最优 |
| **与方案技术栈一致性**（方案写明「Vite + esbuild」，Vite 内部即 esbuild 转译 TS） | ⚠️ 引入第二套构建体系 | ✅ 完全同构 | ⚠️ 引入第二套构建体系 |
| **Tree-Shaking（ESM + preserveModules 按需导入）** | ✅ esmFormat | ✅ lib mode 可配 preserveModules | ✅ |
| **monorepo 多包配置成本** | 最低 | 较繁琐 → **可缓解**：在 internal/build-scripts 封装 `defineLibConfig()`，各包 vite.config 收敛到 ~5 行 | 较低 |

**结论：选 B（Vite lib mode + vite-plugin-dts），配 `defineLibConfig()` 统一封装。**
决定性因素是 Vue SFC 编译与 CSS 抽离是 components / biz-components / runtime 的硬性需求，tsup / unbuild 都需要第三方插件补齐且 SFC 支持不完整；「配置繁琐」的劣势通过 internal/build-scripts 共享构建配置一次性消除。避免同时维护两套构建体系（tsup 管 TS 包 + vite 管 SFC 包）带来的长期成本。utils / theme 纯 TS / 纯 SCSS 包在 Vite lib mode 下同样零负担。

回答：采用系统分析结论 B（Vite lib mode + vite-plugin-dts），构建配置统一收敛到 internal/build-scripts 的 defineLibConfig()。

### Q3 包壳范围（影响 M0 产出规模）
M0 建全部 8 个 packages 壳，还是仅 M1 需要的 `utils / theme / hooks` + `internal/*`？（其余包壳可到对应里程碑再建）
回答：建全部 8 个 packages 壳。

### Q4 CI 触发与矩阵
触发：PR → master + master push？Node 矩阵：单版本 22，还是 20/22 双版本？
回答：两种都要 （PR 门禁挡坏代码，master push 兜底直推）；M0 单版本 22 即可。

### Q5 README
以方案附录摘要为底扩展（徽章、Roadmap 表、双模式说明），中文单语？

**详细建议：**

1. **语言**：中文单语。理由：文档站（方案 §7）默认中文，双语 README 会引入长期同步维护负担；社区贡献英文版可后续按需加 `README.en.md`，M0 不预建。
2. **结构（自上而下）**：
   1. 标题 + 一句话定位（「轻量可开箱，中台可插拔」）+ 徽章行
   2. ✅ 特性列表（方案附录 6 条原样）
   3. **包列表表格**：8 个 `@mengxi-ark/*` 包名 | 职责一句话 | 版本徽章 | 状态（🚧 M1~M4 标注未发布）
   4. 快速安装（附录三段代码块原样）
   5. 极简示例：先放 hooks 独立用法 5 行（M1 后补真实可运行代码）；双模式 Lov 示例留 M2 占位注释
   6. **Roadmap 表**：M0~M5 行 + 状态列（✅ 完成 / 🚧 进行中 / ⬜ 未开始）——M0 落地时勾 M0
   7. 对比参考（附录三行）+ 文档链接（docs 站上线前先指向 `apps/docs/` 目录）
   8. 贡献（一句话 + 指向 CONTRIBUTING.md）+ MIT 协议
3. **徽章取舍（避免死链）**：M0 只放能活的 3 个——CI（Actions `ci.yml` 状态）、Node `>=22`、License MIT；npm version / coverage / downloads 徽章在首次发包后再加，防止首页长挂死链。

回答：使用详细建议。

### Q6 LICENSE 版权主体
现有 LICENSE 为 MIT，版权行主体写什么？（如 `Copyright (c) 2026-present MengXi-Studio`）

**详细建议：**

- 现有 LICENSE 已是标准 MIT 模板，主体 `MengXi-Studio` 正确（与 GitHub org 名一致；方案 §10 约定维护者均为组织成员、统一 Code Owner，版权归属组织而非个人，避免成员变动导致主体失效）。
- 唯一建议修改：`Copyright (c) 2026` → **`Copyright (c) 2026-present`**——年份区间滚动式写法是开源惯例（Vue / Element Plus / Vben 均如此），后续年份无需再改此文件。
- 各 npm 包 `package.json` 的 `"license": "MIT"` 字段与 LICENSE 文件保持一致；CONTRIBUTING.md 与 README 页脚引用同一表述。
- 不建议写个人署名或中文名（「梦曦工作室」保留在 README 品牌区，法律主体用与 GitHub org 一致的英文标识）。

回答：使用详细建议。

## 实施记录

### 方案落地形态（与伪代码设计的差异说明）

1. **构建方案**：按 Q2 回答采用 B（Vite lib mode + vite-plugin-dts），`defineLibConfig()` 收敛到 `internal/build-scripts`，与方案一致。
2. **版本取值修正**：npm registry 实测 pinia latest=4.1.0、vue-router latest=5.5.1（均有更高 major）。按任务规格「再写 ^3.x / ^4.x 范围」的措辞与工程规范「路由 | Vue Router 4」锁定，取两条线内最新稳定：pinia `^3.0.4`、vue-router `^4.6.5`。**升级到 pinia 4 / vue-router 5 留待 M1 前由用户决策**。
3. **新增根 `eslint.config.mjs`**：`pnpm lint`（ESLint 10 flat config）必须有根级配置文件，内容为 re-export `@mengxi-ark-internal/eslint-config`；伪代码清单漏列。用 `.mjs` 而非 `.js` 以消除 Node 对无 `"type"` 根 package.json 的模块类型告警。
4. **eslint-config 增补 `globals` 依赖**：ESLint 10 flat config 无默认环境变量，Node 脚本（check-*.mjs）的 `console`/`process` 会触发 `no-undef`，按社区标准做法引入 `globals ^17.14.0` 并对 `**/*.mjs|cjs` 注入 `globals.node`。
5. **`.gitignore` 与既有文件合并**：保留原有 `logs` `*.local` `.screenshots/` 等条目；原 `.npmrc` 忽略规则改为 `.npmrc.local`（规格要求提交仅含 `engine-strict=true` 的非敏感 `.npmrc`，凭据类本地配置用 `.npmrc.local`）。
6. **删除既有 `.prettierrc`，新建 `.prettierrc.json`**：两文件并存时 prettier 优先命中 `.prettierrc`，与规格配置冲突，按规格以 `.prettierrc.json` 为准。
7. **check 脚本注释修正**：JSDoc 内 `packages/*/src` 的 `*/` 会提前终止块注释导致语法错误，改为 `packages/<pkg>/src`。
8. **Vite 8 实测**：内核已切换 rolldown，`formats: ['es','cjs']` 与 `vite-plugin-dts@5.1.2` 的 `include`/`entryRoot` 均正常工作，无需调整。
9. **theme 构建产物**：`src/index.scss` 仅一行注释，compressed 模式下产出空 `dist/index.css`（1 字节），属预期。

### 变更文件清单

- 根：`package.json`、`pnpm-workspace.yaml`、`turbo.json`、`.gitignore`（改写）、`.npmrc`、`.prettierrc.json`、`.prettierignore`、`.changeset/config.json`、`eslint.config.mjs`、`README.md`、`CONTRIBUTING.md`、`LICENSE`（版权行改 2026-present）
- internal：`tsconfig/{package.json, base.json, vue-library.json}`；`eslint-config/{package.json, index.js}`；`build-scripts/{package.json, define-lib-config.mjs, check-deps.mjs, check-peer-deps.mjs}`
- packages：`theme/{package.json, src/index.scss}`；`utils/hooks/components/biz-components/runtime/dsl-render/cli` 各 `{package.json, tsconfig.json, vite.config.ts, src/index.ts}`（hooks/runtime 含 vue+pinia+vue-router peer，components/biz-components/dsl-render 含 vue peer，utils/cli 无 peer）
- .github：`workflows/{ci.yml, release.yml}`、`ISSUE_TEMPLATE/{bug_report.md, feature_request.md, docs_feedback.md, config.yml}`、`PULL_REQUEST_TEMPLATE.md`

### 验证方式与结果（2026-11-24，Node v24.14.0 / pnpm 10.34.9）

| 命令 | 结果 |
| --- | --- |
| `pnpm install` | ✅ 243 包，Done in 2m7.8s（仅 @parcel/watcher 构建脚本被 pnpm 10 安全策略忽略，不影响） |
| `pnpm deps:check` | ✅ `✔ 依赖链路检查通过（7 个文件）` exit 0 |
| `pnpm peer:check` | ✅ `✔ peerDependency 对齐校验通过（7 个文件）` exit 0 |
| `pnpm lint` | ✅ ESLint 10 flat config，0 error 0 warning |
| `pnpm typecheck` | ✅ turbo 7/7 successful（theme 无该脚本跳过） |
| `pnpm test` | ✅ vitest 7/7 successful（`--passWithNoTests`） |
| `pnpm build` | ✅ turbo 8/8 successful：7 包产出 `dist/index.js`（ESM）+ `index.cjs` + `index.d.ts`，theme 产出 `dist/index.css`，产物均实测存在且导出正确 |
| `pnpm list -r --depth -1` | ✅ 12 个 workspace 包解析正常 |

### 遗留 TODO

1. pinia/vue-router 的 major 升级决策（`packages/hooks`、`packages/runtime` 的 peerDependencies 当前为 `^3.0.4` / `^4.6.5`；npm latest 已是 4.1.0 / 5.5.1）——M1 动工前确认。
2. `@parcel/watcher` 构建脚本被 pnpm 10 忽略（可选依赖，仅影响文件监听性能）——如需启用，在 `pnpm-workspace.yaml` 加 `onlyBuiltDependencies: [@parcel/watcher]`。
3. `packages/theme` 的 exports 仅含 CSS 入口，M1 落地 token 时按 §7 目录契约扩展。

