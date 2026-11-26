# v1.0.0-beta 发布检查清单（M5）

> 对应任务文档：[repo-M5-Beta公测与v1发布.md](./新增/2026-11-26/repo-M5-Beta公测与v1发布.md)。
> 发布规范：工程规范 §13（changesets 流程 / Discussions 公告）；npm publish 由 CI（release.yml）或维护者手动执行，AI 不触网发布。

## 一、发布前置（已完成项打勾）

- [x] M0–M4 全量门禁绿：`pnpm turbo run typecheck build test`（25 任务）+ `pnpm deps:check` + `pnpm peer:check`
- [x] 浏览器实测：demo-light 五 tab、demo-platform 基座路径、cli 临时工程生成→install→dev（M4 已完成）
- [x] Playwright E2E 冒烟：`pnpm test:e2e`（demo-light 五 tab + demo-platform 基座关键路径）
- [x] changesets 进入 beta 预发布：`pnpm changeset pre enter beta`（`.changeset/pre.json`）
- [x] major changeset 登记并执行 `pnpm changeset version` → 全包 `1.0.0-beta.0` + 各包 CHANGELOG.md
- [x] README Roadmap 更新（M0–M4 ✅、M5 🚧 beta）
- [x] docs 反馈渠道页（`/faq/feedback`）+ VitePress 构建死链检查通过

## 二、发布步骤（维护者执行）

1. **提交版本产物**：确认 `.changeset/pre.json`、各包 `package.json`（1.0.0-beta.0）、各包 `CHANGELOG.md` 无误后提交：
   `chore(repo): 同步 changeset 版本（v1.0.0-beta.0）`
2. **打 tag**：`git tag v1.0.0-beta.0 && git push origin master --tags`
3. **发布 npm**（二选一）：
   - CI：仓库 Secrets 配置 `NPM_TOKEN` 后，release.yml 在 master push 时经 changesets/action 自动 `pnpm release`；
   - 手动：`pnpm release`（内部执行 changeset publish，按 `npm publish --tag beta` 语义走 dist-tag beta）。
4. **验证 dist-tag**：`npm view @mengxi-ark/utils dist-tags` 确认 `beta: 1.0.0-beta.0`。
5. **Discussions 公告**：按下方模板发布 v1.0.0-beta.0 公告，置顶并打标签「Announcement」。

## 三、Discussions 公告模板（v1.0.0-beta.0）

```markdown
## 🚀 曦舟 MengXi Ark v1.0.0-beta.0 公测发布

曦舟是「轻量可开箱、中台可插拔」的 Vue3 中台前端框架，MIT 免费商用。
本版本为首个公开 Beta（npm dist-tag `beta`），覆盖 M0–M4 全部里程碑。

### 包清单（@mengxi-ark/*）

| 包 | 职责 |
| --- | --- |
| utils | 纯函数工具层（日期 / 金额 / 树 / 校验 / 浏览器） |
| theme | Design Token（--mx-* CSS Variables，暗色内置） |
| hooks | useRequest / useAuth / useSession / useTable / useForm |
| components | SearchForm / EnhanceTable 等通用组件 + UI 适配层 |
| biz-components | Lov / DocumentTable 双模式业务组件 |
| runtime | 中台基座：Tab 工作台 / 菜单 / 模块注册 / 会话 / 上下文 |
| dsl-render | Schema 三件套 + 三渲染器（加速方案，手写 SFC 一等公民） |
| cli | pnpm create mengxi-ark（双模板 + 分档 AI 规则） |

### 安装

轻量项目：
pnpm add @mengxi-ark/utils @mengxi-ark/theme @mengxi-ark/hooks @mengxi-ark/components @mengxi-ark/biz-components

中台项目追加：pnpm add @mengxi-ark/runtime @mengxi-ark/dsl-render
脚手架：pnpm create mengxi-ark

### 已知限制

- Beta 期间 API 允许微调，正式 v1.0.0 前公告列明全部 breaking 变更；
- Element Plus 适配器与 Ant Design Vue 默认适配器能力对齐中，欢迎实测反馈。

### 反馈

Bug / 建议 / 文档问题请走 Issue 模板（见 docs 反馈渠道页）；使用交流在本 Discussions 版块。
```

## 四、公测期例行动作

1. Issue / Discussions 分诊（打标签：bug / feature / documentation / good first issue）；
2. 修复走 `fix/*` 分支 + patch changeset（pre 模式下自动递增 `1.0.0-beta.x`）；
3. 每个 beta 版本发布后同步更新 Discussions 公告或追加回复；
4. **更新 docs 更新日志页**：`pnpm --filter docs build` 会经 `apps/docs/scripts/gen-changelog.mjs` 从各包 CHANGELOG.md 自动聚合生成 `src/changelog.md`（中英两份），无需手工编辑；仅需在发布后跑一次构建确认页面已包含新版本小节；
5. 反馈收敛后：`pnpm changeset pre exit` → `pnpm changeset version`（1.0.0 正式版）→ 按「发布步骤」重复执行（正式版走 `latest` dist-tag）→ 发布 v1.0.0 正式公告。

## 五、回滚预案

- npm 侧：beta 版本不设 `latest` tag，出问题不影响 `latest` 用户；必要时 `npm dist-tag rm @mengxi-ark/<pkg> beta`；
- git 侧：tag 不删除，错误版本以新 beta 版本覆盖修复（SemVer 允许 beta 内破坏性调整，公告说明）。
