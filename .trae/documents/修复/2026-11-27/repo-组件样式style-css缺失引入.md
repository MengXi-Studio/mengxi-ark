# 组件包 style.css 布局样式缺失引入 修复记录

## 需求

为 8 个发布包补齐 README 后核对发现：components / biz-components / runtime / dsl-render 四包的组件布局样式（`--mx-*` token 布局类，如 `.mx-search-form`）经 Vite lib mode 抽离为独立 css 产物（`./style.css` 导出），JS 产物不自注入；而 demo-light / demo-platform / cli 模板 / 文档站示例均未引入，导致布局样式在所有运行场景中静默缺失。

## 需求分析

- 影响面：`apps/demo-light`、`apps/demo-platform`、`packages/cli/templates/*`（入口 main.ts + `.trae/rules` 说明）、`apps/docs` 四处入口装配代码段（zh/en 各一）；README（同日另一任务产出）已按正确用法书写。
- 依赖边界：无包源码改动，纯消费侧引入修复；无反向 / 循环 import。
- 错误源头：模板规则 ark-light.md 中「组件样式 CSS-in-JS 自注入」的表述错误（实际 CSS-in-JS 注入的是 UI 库控件样式，布局样式是独立 css）。

## 伪代码设计

入口 main.ts 按实际用到的包显式引入：

- demo-light：components + biz-components + dsl-render 三个 style.css；
- demo-platform：已有 runtime/style.css，补 components + biz-components + dsl-render；
- light 模板：components + biz-components（用到的 EnhanceTable / StatusTag / Lov）；
- platform 模板：已有 runtime/style.css，补 components（Layout 用 MxDialog）+ biz-components（UserManagePage 用 Lov）。

## 疑问清单

（无，浏览器实证直接确认）

## 实施记录

- 方案落地形态：与设计一致，无差异。
- 验证：
  1. 修复前浏览器实证（demo-light，localhost:5173）：`.mx-search-form` 元素存在但 computed padding 为 0px，1608 条 CSS 规则中无任何 `.mx-search-form` 选择器 → 样式缺失实锤；
  2. 修复后复验：padding 生效（12px，`var(--mx-spacing-md)`），`.mx-search-form` 与 `.mx-lov`（16 条）规则已注入，控制台无 error；
  3. `pnpm turbo run typecheck build --filter=demo-light --filter=demo-platform --filter=@mengxi-ark/cli` 全部通过（11 tasks）。
- 变更文件清单：
  - `apps/demo-light/src/main.ts`、`apps/demo-platform/src/main.ts`
  - `packages/cli/templates/light/src/main.ts`、`packages/cli/templates/platform/src/main.ts`
  - `packages/cli/templates/light/.trae/rules/ark-light.md`、`packages/cli/templates/platform/.trae/rules/ark-platform.md`
  - `apps/docs/src/{guide/getting-started,guide/components-guide,dsl/index,platform/index}.md` 及 `en/` 对应四文件（含顺手修正 getting-started 中 `@mengxi-ark/theme/dist/index.css` 违反 exports 映射的子路径写法 → `@mengxi-ark/theme`）
- 遗留 TODO：无。
