# **PROJECT_NAME**

基于 [曦舟 MengXi Ark](https://github.com/MengXi-Studio/mengxi-ark) 的轻量模式工程（无 runtime 基座）。

## 快速开始

```bash
pnpm install
pnpm dev
```

## 能力速览

| 包                           | 说明                                           |
| ---------------------------- | ---------------------------------------------- |
| `@mengxi-ark/utils`          | 纯工具函数（日期 / 金额 / 树 / 校验 / 浏览器） |
| `@mengxi-ark/theme`          | Design Token（`--mx-*` CSS Variables）         |
| `@mengxi-ark/hooks`          | useRequest / useTable / useForm 等             |
| `@mengxi-ark/components`     | SearchForm / EnhanceTable 等通用组件           |
| `@mengxi-ark/biz-components` | Lov / DocumentTable 双模式业务组件             |

## 主题覆盖

在自有样式表中重定义同名 `--mx-*` 变量即可（运行时覆盖，无需 fork）：

```css
:root {
	--mx-color-primary: #1677ff;
}
```

暗色模式：宿主根节点挂 `data-theme="dark"`。

## 后续

- AI 用法速查见 `.trae/rules/ark-light.md`；
- 文档站与组件 API 见官方文档；
- 需要中台基座（Tab 工作台 / 菜单 / 模块注册）时，可改用 `pnpm create mengxi-ark` 选择「中台基座模板」。
