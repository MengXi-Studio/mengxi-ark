---
alwaysApply: true
scene: git_message
---

# Git 提交信息规范（mengxi-ark）

## 1. 格式（Conventional Commits）

```
<type>(<scope>): <中文描述>

[可选 body：解释 why 与关键决策，why 优先于 what]

[可选 footer：关联 Issue / BREAKING CHANGE]
```

## 2. type 枚举（禁止自造）

| type | 用途 |
| --- | --- |
| `feat` | 新增能力（组件 / hook / token / service / Schema） |
| `fix` | bug 修复 |
| `docs` | 文档变更（VitePress、注释、任务文档回填） |
| `style` | 不影响语义的格式调整（空格、分号、prettier） |
| `refactor` | 重构（不新增能力、不修 bug） |
| `perf` | 性能优化（Tree-Shaking、按需导入、包体积） |
| `test` | 单测补充 / 修正 |
| `build` | 构建体系、依赖版本、turbo/vite/tsconfig 调整 |
| `ci` | GitHub Actions、依赖链路检查等门禁脚本 |
| `chore` | 杂项（changesets 配置、仓库模板文件） |
| `revert` | 回滚，格式：`revert: <被回滚提交的 type(scope): 描述>` |

## 3. scope = 包名（与 PR 标题的 `[包名]` 对应，禁止凭记忆编造）

| scope | 范围 |
| --- | --- |
| `utils` `theme` `hooks` `components` `biz-components` `runtime` `dsl-render` `cli` | 对应 `packages/<同名>` |
| `demo-light` `demo-platform` `docs` | 对应 `apps/<同名>` |
| `internal` | `internal/eslint-config` / `tsconfig` / `build-scripts` |
| `repo` | 跨包或仓库级（根 package.json、turbo.json、pnpm-workspace.yaml、README 等） |

跨包小改动选主导包做 scope；真正同等的跨包变更用 `repo`。

## 4. 描述行硬性要求

1. 中文，一句话说清**做了什么**，不超过 50 字，句尾不加标点。
2. 用动词开头祈使语气（`增加` / `修复` / `移除`），禁止「更新了一些东西」「代码调整」这类不可追溯的描述。
3. 一次提交只做一件事；混合多个不相关改动时先拆分提交。
4. 禁止在同一提交中手改 `package.json` version——版本一律走 changesets 流程，其自动生成的 bump 提交格式为 `chore(repo): 同步 changeset 版本`。

## 5. 破坏性变更（呼应 §13 SemVer：Major 必须附迁移说明）

- type 后加 `!` 并在 footer 写 `BREAKING CHANGE: <影响 + 迁移方式>`：

```
feat(runtime)!: RuntimeContext 移除 lovApi 字段，改用 lovListApi

模块包若直接消费 lovApi 需改为 lovListApi 或配置同名 props 兜底。

BREAKING CHANGE: 上下文字段 lovApi 更名，详见迁移指南
```

- 涉及 token 默认值变更（theme）、上下文字段增删（runtime）、props 破坏性调整（组件）都必须带 `!` + footer。

## 6. 关联 Issue 与任务文档

- 修复类提交 footer 写 `Closes #123`；功能类写 `Refs #123`（由 PR 合并时关闭）。
- 涉及 `.trae/documents/` 任务文档的实施回填，body 中附任务文档相对路径，便于追溯「方案 → 提交」链路。

## 7. 提交示例

```
feat(biz-components): Lov 组件支持独立模式 params 自动防抖

Refs #42

fix(hooks): useRequest 取消请求后 loading 状态未复位

Closes #57

docs(docs): SearchForm 文档补充基座联动示例

perf(components): 增强表格列配置改为 shallowRef，减少深层响应开销

chore(repo): 登记 changeset（biz-components minor）
```
