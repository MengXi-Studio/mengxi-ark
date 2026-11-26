# MengXi Ark｜曦舟

> 渐进式中台前端框架，轻量可开箱，中台可插拔；基座可选、组件可独立、业务组件双模式。
> 梦曦工作室（MengXi-Studio）出品，MIT 协议免费商用。
> 仓库：<https://github.com/MengXi-Studio/mengxi-ark>

[![CI](https://github.com/MengXi-Studio/mengxi-ark/actions/workflows/ci.yml/badge.svg)](https://github.com/MengXi-Studio/mengxi-ark/actions/workflows/ci.yml) ![Node](https://img.shields.io/badge/node-%3E%3D22-339933)
![License](https://img.shields.io/badge/license-MIT-green)

## ✅ 特性

- 基座可选，不想用工作台就只使用组件和 hooks
- 业务组件双模式：独立使用 / 中台基座联动
- 全 TS，单向依赖，可维护性优先
- 手写 SFC 优先，DSL 配置渲染可选
- 适配 Ant Design Vue / Element Plus，UI 库解耦
- MIT 协议，免费商用

## 📦 包列表

| 包名                         | 职责                                                          | 状态 |
| ---------------------------- | ------------------------------------------------------------- | ---- |
| `@mengxi-ark/utils`          | 纯函数工具层（数据格式化 / 数据结构 / 浏览器工具 / 校验编码） | ✅   |
| `@mengxi-ark/theme`          | Design Token 纯样式层（CSS Variables `--mx-*`）               | ✅   |
| `@mengxi-ark/hooks`          | 通用组合式函数（useRequest / useAuth / useTable 等）          | ✅   |
| `@mengxi-ark/components`     | 通用增强组件（props 驱动优先，插槽兜底）                      | ✅   |
| `@mengxi-ark/biz-components` | 双模式业务语义组件（Lov / 单据 Table / 审批面板等）           | ✅   |
| `@mengxi-ark/runtime`        | 中台基座（Tab 工作台 / 菜单 / 模块注册 / 会话 / 上下文）      | ✅   |
| `@mengxi-ark/dsl-render`     | DSL 配置渲染引擎（Schema 强类型，渲染器只渲染）               | ✅   |
| `@mengxi-ark/cli`            | 脚手架（`create-mengxi-ark`）                                 | ✅   |

## 快速安装

```bash
# 轻量项目（推荐）
pnpm add @mengxi-ark/utils @mengxi-ark/theme @mengxi-ark/hooks @mengxi-ark/components @mengxi-ark/biz-components

# 中台项目，额外引入基座
pnpm add @mengxi-ark/runtime @mengxi-ark/dsl-render

# 脚手架
pnpm create mengxi-ark
```

## 示例

```ts
import { formatDate, formatMoney } from '@mengxi-ark/utils'
import { useRequest } from '@mengxi-ark/hooks'

// utils：格式化
formatDate(Date.now(), 'YYYY-MM-DD') // '2026-11-25'
formatMoney(12345.6, { symbol: '¥' }) // '¥12,345.60'

// hooks：请求状态管理（竞态保护 / 取消 / 重试内置）
const { data, loading, run } = useRequest(() => fetchUser(id), { immediate: true })
```

## Roadmap

| 里程碑 | 内容                                                                                        | 状态    |
| ------ | ------------------------------------------------------------------------------------------- | ------- |
| M0     | monorepo + turbo + pnpm 骨架；CI、eslint、tsconfig、changesets、GitHub 工作流；仓库基础文件 | ✅      |
| M1     | 底层基础包：utils / theme / hooks，配套单元测试与基础文档                                   | ✅      |
| M2     | 组件层：components / biz-components（Lov、单据 Table 双模式）；demo-light                   | ✅      |
| M3     | 中台基座：runtime 工作台、模块注册、Tab 管理器；demo-platform                               | ✅      |
| M4     | DSL 渲染引擎 + CLI 脚手架；文档站点完善                                                     | ✅      |
| M5     | Beta 公测（`1.0.0-beta.x`）与社区反馈，发布 v1.0.0 正式版                                   | 🚧 beta |

## 对比参考

- vs vue-element-admin：不是复制样板，npm 包统一升级
- vs Vben Admin：增加单据业务组件、可选中台基座、DSL 渲染
- vs HZERO C7N：组件不强制绑定 runtime，可独立跨端使用

## 贡献

欢迎参与贡献，请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 反馈

- Bug / 功能建议 / 文档问题：请使用 [Issue 模板](https://github.com/MengXi-Studio/mengxi-ark/issues/new/choose)；
- 版本公告与讨论：[GitHub Discussions](https://github.com/MengXi-Studio/mengxi-ark/discussions)。

## 协议

[MIT](./LICENSE)
