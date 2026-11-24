# 贡献指南（CONTRIBUTING）

感谢关注 MengXi Ark（曦舟）！提交 Issue / PR 前请先阅读本指南。

## 环境准备

- Node.js >= 22（建议 22 LTS）
- pnpm 10：`npm i -g pnpm@10`
- Git

## 快速开始

```bash
pnpm install        # 安装依赖
pnpm build          # 全包构建（turbo，ESM + CJS + .d.ts）
pnpm typecheck      # 类型检查（tsc --noEmit）
pnpm test           # 单元测试（Vitest）
pnpm lint           # ESLint（根目录统一执行）
pnpm deps:check     # 依赖链路检查（反向依赖阻断）
pnpm peer:check     # peerDependency 对齐校验
```

## 分支模型

| 分支 | 用途 |
| --- | --- |
| `master` | 稳定分支，可随时打 tag 发布 |
| `feature/*` | 新功能 |
| `fix/*` | 修复 |
| `docs/*` | 文档 |
| `release/*` | 发版准备 |

## 提交规范（Conventional Commits）

格式：`<type>(<scope>): <中文描述>`

- **type 枚举**：`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`
- **scope = 包名**：`utils` `theme` `hooks` `components` `biz-components` `runtime` `dsl-render` `cli` `demo-light` `demo-platform` `docs` `internal` `repo`
- **描述**：中文、动词开头、一句话不超过 50 字、句尾不加标点；一次提交只做一件事
- **破坏性变更**：type 后加 `!`，footer 写 `BREAKING CHANGE: <影响 + 迁移方式>`
- **版本**：禁止手改 `package.json` 的 version，一律走 changesets 流程（`pnpm changeset` → `pnpm version-packages` → `pnpm release`）

示例：

```
feat(biz-components): Lov 组件支持独立模式 params 自动防抖
```

## PR 规范

- 一个 PR 只解决一个问题
- 标题格式：`[包名] 描述`（如 `[biz-components] Lov组件增加独立模式params自动防抖`）
- 必须关联 Issue（`Closes #123` / `Refs #123`）
- 单测补齐；CI 全绿且至少一名维护者 review 通过方可合并

## 本地验证清单

提交 PR 前逐项自测（模板见 [PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md)）：

- [ ] `pnpm deps:check` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm test` 通过
- [ ] `pnpm build` 通过
- [ ] 涉及组件 / hooks / biz-components → 在 demo-light 实际运行验证；涉及 runtime → 在 demo-platform 验证
