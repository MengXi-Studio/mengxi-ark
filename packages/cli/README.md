# @mengxi-ark/cli

> 曦舟脚手架：`pnpm create mengxi-ark`，双模板开箱即用——轻量模式（无基座）与中台模式（runtime 工作台）。

[![npm version](https://img.shields.io/npm/v/@mengxi-ark/cli?style=flat-square)](https://www.npmjs.com/package/@mengxi-ark/cli)
[![license](https://img.shields.io/npm/l/@mengxi-ark/cli?style=flat-square)](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)

[MengXi Ark｜曦舟](https://github.com/MengXi-Studio/mengxi-ark) 的脚手架包。模板尽量薄：业务能力全部通过 npm 包引入，不写死在模板内；每个模板内置面向使用者的精简 AI 规则（`.trae/rules/` 用法速查），装完即获得、随包分档「可拿走」。

## 使用

```bash
pnpm create mengxi-ark
```

交互式选择：

1. **模板**：`light`（轻量模式）或 `platform`（中台基座）；
2. **目录名**：目标工程目录（非空目录需二次确认）。

## 模板说明

| 模板       | 内含                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| `light`    | utils / theme / hooks / components / biz-components 直装直用，无 runtime；适合普通页面与组件开发 |
| `platform` | 在 light 基础上增加 `createArkRuntime` 基座 + systemModule 示例模块 + 工作台 Layout   |

内置规则文件：

- `light/.trae/rules/ark-light.md`：轻量模式用法速查（主题覆盖、双模式 props、按需导入）
- `platform/.trae/rules/ark-platform.md`：中台模式用法速查（模块注册、上下文探测、Tab 工作台）

> 模板内框架包版本与 cli 自身版本绑定对齐（`__ARK_VERSION__` 注入），保证生成工程各 `@mengxi-ark/*` 版本一致。

## 仓库内开发模板

`templates/*` 是随包发布的静态脚手架目录（含 `__PROJECT_NAME__` / `__ARK_VERSION__` 占位符，不是 workspace 包），
目录内没有 `node_modules`。为了让 IDE 能解析模板源码的 `vue` / `vite` / `@mengxi-ark/*` 等依赖，
仓库根 `package.json` 的 `devDependencies` 声明了模板所需的这些包（根为 private，不参与发布与 changesets）。
清理根依赖时请勿删除它们，否则模板目录会重新出现「找不到模块」的 TS 报错；生成工程由 `pnpm install` 自行安装，不受影响。

## 文档

- 完整文档：<https://mengxi-studio.github.io/mengxi-ark/>
- 快速上手：<https://mengxi-studio.github.io/mengxi-ark/guide/getting-started.html>

## 协议

[MIT](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)
