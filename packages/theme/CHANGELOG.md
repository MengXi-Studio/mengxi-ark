# @mengxi-ark/theme

## 1.0.0-beta.0

- v1.0.0-beta 公测首发（M0–M4 全量落地，npm dist-tag `beta`）。
- Design Token 纯样式层：品牌色梯度 / 灰阶 / 语义层 / 间距 / 圆角 / 阴影 / 字体排版 / z-index 全量 `--mx-*` CSS Variables，基础层 + 语义层两级。
- 内置暗色主题（`data-theme="dark"` / `.mx-theme-dark` 作用域覆盖语义层）与 antdv / Element Plus 变量桥接。
- 业务重定义同名 `--mx-*` 变量即可换肤，无需 fork；不含 Vue 组件与 JS 逻辑。
