# M5：Beta 公测与 v1.0.0 发布 实施方案

## 需求

实施方案里程碑 M5「Beta 公测 & 社区反馈」：

- 收集反馈、修复 bug、补齐 demo；
- 发布 v1.0.0 正式版。

（实施方案 §8；> 后续迭代：新增 UI 适配器、新增业务组件、性能优化、配套后端示例——不在本阶段。）

## 需求分析

### 仓库现状盘点（M0–M4 已就绪资产）

| 资产                                                                                             | 状态                                                                                             |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| README.md（含 Roadmap M0–M4 表格）                                                               | M4 行仍标 ⬜ / 包表格 M4 行标 🚧，需更新为 ✅ 并补 M5 行                                         |
| LICENSE（MIT）/ CONTRIBUTING.md                                                                  | 已有                                                                                             |
| `.github/ISSUE_TEMPLATE/`（bug_report / feature_request / docs_feedback）+ PULL_REQUEST_TEMPLATE | 已有（M0 建档）                                                                                  |
| `.github/workflows/release.yml`                                                                  | changesets/action 占位已配：无 NPM_TOKEN 时仅产生版本 PR；配置 token 后 master push 自动 publish |
| changesets                                                                                       | M4 已登记双包 minor changeset，各包 version 仍为 0.0.0（从未发布）                               |
| CI 门禁 / 依赖门禁                                                                               | 全绿                                                                                             |
| demo（demo-light / demo-platform）                                                               | 五大 tab + 基座模块齐全（M4 补 DSL 页）；无 E2E 冒烟                                             |

### 本阶段可本地落码的动作（不依赖 npm token / GitHub 远端）

1. **版本策略落地**：全包 0.0.0 → v1.0.0 的 changesets 流程（`pnpm changeset` major → `changeset version` 生成版本号 + CHANGELOG.md + version bump 提交；禁止手改 package.json version）。
2. **README / Roadmap 更新**：M0–M4 标 ✅、补 M5 行、安装文档对齐真实发布版本。
3. **发布检查清单文档**：`.trae/documents/` 下沉淀 v1.0.0 发布操作清单（changeset version → tag → push → release.yml 自动 publish → Discussions 公告），对应工程规范 §13.4「版本公告在 Discussions 发布」。
4. **补齐 demo / 冒烟**：Playwright E2E 冒烟（demo-light 关键路径 + demo-platform 基座路径）或至少脚本化冒烟清单——待确认范围。
5. **反馈收集渠道**：issue 模板已有 docs_feedback；可补 GitHub Discussions 公告模板文案（docs 板块或 repo 文档）。

### 影响面

- `repo` scope（README / 任务文档 / 发布清单）；全包 package.json version（changesets 自动）+ CHANGELOG.md 生成；
- 可能新增 `apps/demo-light` / `apps/demo-platform` E2E（Playwright 依赖引入需谨慎——包管理规范禁擅自新增包，需确认）；
- npm publish 本体依赖 NPM_TOKEN（仓库 Secrets），属 CI 侧动作，本地不可执行。

## 伪代码设计

（本阶段无新 API；动作清单为主）

```
1. changeset（major，scope 全包）：'@mengxi-ark/*': major —— 0.0.0 首发即 1.0.0
2. pnpm changeset version → 各包 version 1.0.0 + 各包 CHANGELOG.md + pnpm-lock 同步
3. README Roadmap 更新（M4 ✅、补 M5）
4. 发布检查清单（发布前提：CI 全绿；发布步骤；Discussions 公告模板文案）
5. （待确认）Playwright E2E 冒烟：apps/demo-light login? 无登录——关键路径 = 五 tab 渲染无报错；demo-platform = 模块注册 + Tab 工作台 + Lov 上下文
```

## 疑问清单

### Q1 版本策略（影响：changesets 操作与 SemVer 语义）

全包从未发布（0.0.0），v1.0.0 正式版两种走法：

- 方案 a（推荐）：changesets pre 模式先发 `1.0.0-beta.x` 公测版（`changeset pre enter beta` → version → beta 包发到 npm dist-tag beta），公测反馈修完 `pre exit` 后正式 1.0.0——符合「Beta 公测 → 正式版」节奏；
- 方案 b：跳过 beta 包，直接 major changeset 出 1.0.0（公测仅以 GitHub Release/Discussions 形式存在，npm 无 beta 版本）。
  选哪个？

回答：a——changesets pre 模式先发 1.0.0-beta.x 公测，反馈修完 pre exit 后出正式 1.0.0。

- 方案 a（推荐）：本地完成「changeset 登记 + changeset version（版本号/CHANGELOG 落盘）+ git tag 提交准备」；npm publish 与 Discussions 公告由用户配置 NPM_TOKEN 后经 release.yml CI / 手动执行（AI 不触网发布）；
- 方案 b：本地连 npm 直接 publish（需要 npm token 与网络权限，不符合仓库发布规范）。
  选哪个？

回答：a——AI 本地完成 changeset 登记 + changeset version + tag 准备；npm publish / Discussions 公告由用户配置 NPM_TOKEN 后经 release.yml CI 或手动执行。

### Q3 反馈收集渠道落地物（影响：文档产出）

- 方案 a（推荐）：docs FAQ 板块补「反馈渠道」页（issue 模板索引 + Discussions 入口说明）+ 发布检查清单内附 Discussions 公告模板（v1.0.0 公告文案骨架）；
- 方案 b：仅留 README 一行链接。
  选哪个？

回答：a——docs FAQ 补「反馈渠道」页 + 发布清单附 Discussions 公告模板文案骨架。

### Q4 「补齐 demo」的验收口径（影响：是否引入 Playwright 新依赖）

- 方案 a（推荐）：盘点现有 demo 五 tab / 基座模块覆盖度并补缺页（如有明显缺口），不引入 Playwright——M4 已做浏览器人工验证，E2E 留后续迭代；
- 方案 b：引入 Playwright E2E 冒烟（新增 devDep @playwright/test，符合规范第 1 节选型表但首次实际落地，工作量增加）。
  选哪个？

回答：b——引入 Playwright E2E 冒烟（根目录 e2e/ + @playwright/test，覆盖 demo-light 五 tab 与 demo-platform 基座关键路径）。

### Q5 交付范围确认

M5 落地物 = changesets 版本流程（按 Q1 答案）+ README/Roadmap 更新 + 发布检查清单（含 Discussions 公告模板）+（按 Q3/Q4 决定）反馈渠道页 / demo 补缺；npm publish 本体留给 CI/用户。确认？

回答：确认；Q4 按方案 b 引入 Playwright E2E 冒烟。

## 实施记录

### 方案落地形态（与伪代码设计差异）

1. **版本流程（Q1=a / Q2=a）**：`pnpm changeset pre enter beta` → 全包 major changeset（`.changeset/v1-0-0-beta-release.md`）→ `pnpm changeset version` → 8 包 `1.0.0-beta.0` + 各包 CHANGELOG.md 生成（M4 的两个 minor
   changeset 一并消费入 CHANGELOG）；npm publish / Discussions 公告留维护者（见发布检查清单）。
2. **README / Roadmap**：包列表 M2–M4 状态改 ✅；Roadmap M2–M4 ✅、M5 标 🚧 beta；新增「反馈」节（Issue 模板 + Discussions 链接）。
3. **发布检查清单**：`.trae/documents/release-checklist-v1.0.0.md`——前置清单（全部已勾）+ 维护者发布步骤（提交版本产物 → tag → CI/手动 publish → dist-tag 验证 → 公告）+ Discussions
   v1.0.0-beta.0 公告模板全文 + 公测期例行 + 回滚预案（beta 不占 latest tag）。
4. **docs 反馈渠道页（Q3=a）**：新增 `apps/docs/faq/feedback.md`（issue 模板索引 / Discussions / 升级须知）+ 侧栏 FAQ 板块。
5. **Playwright E2E（Q4=b）**：根目录 `playwright.config.ts`（webServer 自动拉起双 demo dev，baseURL=5173）+ `e2e/demo-light.spec.ts`（五 tab 依次渲染 + DSL 查询区 visible 联动交互 + console.error/pageerror 零报错断言）+
   `e2e/demo-platform.spec.ts`（工作台加载 → 用户管理 Lov 命中基座 lovCache → DSL 页三卡片 + Lov 联动 + 零报错断言）；根 package.json 增 `test:e2e` 脚本与 `@playwright/test` devDep；`.gitignore` 增 test-results/
   playwright-report/。未接入 ci.yml（浏览器安装成本高，列为后续 CI 优化项）。

### 变更文件清单

- `.changeset/pre.json`（beta 预发布模式）+ `.changeset/v1-0-0-beta-release.md`（major changeset，version 后被消费）
- `packages/*/package.json`（1.0.0-beta.0）+ `packages/*/CHANGELOG.md`（8 份新生成）
- `README.md`（包状态 / Roadmap / 反馈节）
- `.trae/documents/release-checklist-v1.0.0.md`（新增）
- `apps/docs/faq/feedback.md`（新增）+ `apps/docs/.vitepress/config.mts`（FAQ 侧栏）
- `playwright.config.ts` + `e2e/demo-light.spec.ts` + `e2e/demo-platform.spec.ts`（新增）
- `package.json`（test:e2e + @playwright/test devDep）+ `pnpm-lock.yaml`
- `.gitignore`（playwright 产物；另含本次会话早前的 vitepress 规则修复 `**/.vitepress/cache|dist/`）

### 验证方式与结果

1. 版本：`Select-String packages\*\package.json '"version"'` 全部 `1.0.0-beta.0`；CHANGELOG 首节含 Major Changes（公测首发说明）与 Minor Changes（M4 两包特性）。
2. 全量门禁：`turbo typecheck build test` 25 任务全绿 + deps:check / peer:check 通过。
3. docs：VitePress build 死链检查通过（faq_feedback 页渲染产物确认）。
4. E2E：`pnpm test:e2e` → 2 passed（demo-light 五 tab + DSL 联动；demo-platform 工作台 + Lov 基座值集 + DSL 页，console 零报错）。
5. lint：e2e 新文件 eslint 零错误。
6. 现场清理：test-results/（playwright 产物）已入 .gitignore；无调试代码残留。

### 遗留 TODO

1. 配置 NPM_TOKEN 后由维护者按发布清单执行 npm publish + Discussions 公告（AI 不触网发布）；
2. `pnpm changeset pre exit` → 正式 v1.0.0 版本流程（反馈收敛后）；
3. ci.yml 接入 test:e2e（需 CI 侧缓存 playwright 浏览器，成本评估后决定）；
4. dsl-render dist 内含 **tests** 声明文件（沿用 M4 遗留项）。
