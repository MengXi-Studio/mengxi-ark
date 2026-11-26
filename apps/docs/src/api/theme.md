# @mengxi-ark/theme

纯样式层 Design Token 包：不含 Vue 组件、不含 JS 逻辑，全部以 `--mx-*` CSS Variables 输出，业务项目只需引入一个入口文件。

## 适用场景

**何时用**：需要全站统一的色板 / 间距 / 圆角 / 阴影 / 层级规范；需要开箱即用的暗色模式；需要不 fork 源码的品牌换肤（覆盖同名变量）；组件与页面样式需要与 UI 库视觉一致（配合 adapters 桥接）。

**何时不用**：只需要单点样式微调、不想引入全量变量体系（直接写项目自有 CSS 即可）；需要 JS 运行时动态改主题（theme 不提供 JS API，换肤一律走 CSS Variables 覆盖）。

```bash
pnpm add @mengxi-ark/theme
```

## 引入方式

应用入口引入一次（ESM 产物即 CSS 文件）：

```ts
import '@mengxi-ark/theme'
```

## Token 类目

| 类目     | 源文件                   | 内容                                                                                                                                                                              |
| -------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 色板     | `tokens/color.scss`      | 品牌色梯度 `--mx-color-primary-1..10`（seed `#1677ff`）、灰阶 `--mx-gray-1..14`、功能色基础值                                                                                     |
| 语义层   | `semantic.scss`          | 功能色 `--mx-color-success / warning / danger / info`、品牌派生 `--mx-color-primary-hover / active`、文本 `--mx-color-text-*`、背景 `--mx-color-bg-*`、边框 `--mx-color-border-*` |
| 间距     | `tokens/spacing.scss`    | `--mx-spacing-xs(4px) / sm(8px) / md(12px) / lg(16px) / xl(24px)`                                                                                                                 |
| 圆角     | `tokens/radius.scss`     | `--mx-radius-sm(4px) / base(6px) / lg(8px) / round(9999px)`                                                                                                                       |
| 阴影     | `tokens/shadow.scss`     | `--mx-shadow-sm / base / lg`（暗色下自动加深）                                                                                                                                    |
| 字体排版 | `tokens/typography.scss` | 字号 `--mx-font-size-xs..xl`、行高 `--mx-line-height-*`、字重 `--mx-font-weight-*`、字体族 `--mx-font-family-base / code`                                                         |
| 层级     | `tokens/z-index.scss`    | `--mx-z-base / sticky / dropdown / drawer / modal / message`（基准 0/100/1000/1200/2000/3000）                                                                                    |
| 基础样式 | `base.scss`              | reset、排版、`.mx-empty` 空状态、`.mx-loading` 加载范式                                                                                                                           |

分层约定：基础层（色板 / 梯度）与语义层两级，语义层变量引用基础层，禁止直写色值；组件样式只允许消费 `var(--mx-*)`。

## 暗色模式

宿主根节点挂 `data-theme="dark"`（或 `.mx-theme-dark`）即可，暗色只覆盖语义层变量与阴影，色板保持不变：

```ts
document.documentElement.dataset.theme = 'dark' // 传 '' 恢复亮色
```

```html
<body data-theme="dark">
	<!-- 或 <body class="mx-theme-dark"> -->
</body>
```

## 业务覆盖方式

在自有样式表中重定义同名 `--mx-*` 变量即可，CSS Variables 运行时覆盖生效，无需 fork theme：

```css
:root {
	--mx-color-primary: #0958d9;
	--mx-color-success: #00b42a;
	--mx-radius-base: 4px;
}
```

覆盖只影响语义层取值，不影响梯度定义；派生态（hover / active）如需一致请一并覆盖对应 token。

## 使用示例

```html
<div class="card">曦舟 MengXi Ark</div>
```

```css
.card {
	padding: var(--mx-spacing-lg);
	background-color: var(--mx-color-bg-container);
	border: 1px solid var(--mx-color-border-split);
	border-radius: var(--mx-radius-lg);
	box-shadow: var(--mx-shadow-sm);
	color: var(--mx-color-text-primary);
	font-size: var(--mx-font-size-md);
}
```

组件与页面样式均按此方式引用 token，禁止硬编码色值 / 字号 / 间距字面量。

## 相关教程

- [核心概念](/guide/core-concepts)：两级 token（基础层 → 语义层）、暗色切换与 UI 库变量桥接的体系说明；
- [迁移指南](/guide/migration)：`--mx-*` 与 `--ant-*` / `--el-*` 的映射关系与存量样式替换落点。
