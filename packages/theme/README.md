# @mengxi-ark/theme

> Design Token 纯样式层：`--mx-*` CSS Variables 统一色板 / 间距 / 圆角 / 阴影 / 层级 / 排版，含暗色主题与 UI 库变量桥接。

[![npm version](https://img.shields.io/npm/v/@mengxi-ark/theme?style=flat-square)](https://www.npmjs.com/package/@mengxi-ark/theme)
[![license](https://img.shields.io/npm/l/@mengxi-ark/theme?style=flat-square)](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)

[MengXi Ark｜曦舟](https://github.com/MengXi-Studio/mengxi-ark) 的主题包：不含 JS 逻辑、不含 Vue 组件，只输出样式。全部组件样式仅引用 `--mx-*` token，基础层 → 语义层两级派生。

## 安装

```bash
pnpm add @mengxi-ark/theme
```

## 使用示例

应用入口引入一次即可（exports 将 `.` 指向 `./dist/index.css`，不要写子路径）：

```ts
import '@mengxi-ark/theme'
```

业务项目覆盖主题：在自有样式表中重定义同名变量，运行时生效，无需 fork：

```css
:root {
	--mx-color-primary: #1677ff;
	--mx-radius-base: 6px;
}
```

暗色主题：宿主根节点挂 `data-theme="dark"` 即可整体切换：

```ts
document.documentElement.dataset.theme = 'dark' // 传 '' 恢复亮色
```

## Token 类目

| 类目                | 示例 token                                            |
| ------------------- | ----------------------------------------------------- |
| 色板 / 功能色        | `--mx-color-primary` `--mx-color-success` `--mx-color-danger` |
| 语义层              | `--mx-color-text-*` `--mx-color-bg-*` `--mx-color-border-*` |
| 间距 / 圆角 / 阴影   | `--mx-spacing-md` `--mx-radius-base` `--mx-shadow-sm` |
| 层级                | `--mx-z-sticky` `--mx-z-dropdown` `--mx-z-modal`      |
| UI 库桥接           | 内置 `--ant-*` / `--el-*` 到 `--mx-*` 的映射，保证 Ant Design Vue / Element Plus 视觉一致 |

## 文档

- 完整文档：<https://mengxi-studio.github.io/mengxi-ark/>
- API 参考：<https://mengxi-studio.github.io/mengxi-ark/api/theme.html>

## 协议

[MIT](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)
