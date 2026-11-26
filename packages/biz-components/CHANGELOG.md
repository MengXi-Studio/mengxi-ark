# @mengxi-ark/biz-components

## 1.0.0-beta.0

### Major Changes

- v1.0.0-beta 公测首发：M0–M4 全量落地。utils（四类纯函数）/ theme（--mx-* Design Token + 暗色）/ hooks（useRequest / useTable / useForm 等）/ components（适配器 + 九组件）/ biz-components（Lov / DocumentTable 双模式）/ runtime（createArkRuntime + 五 service + 内置工作台 Layout）/ dsl-render（Schema 三件套 + validateSchema + 三渲染器 + 13 项映射表）/ cli（create-mengxi-ark 双模板 + 分档 .trae/rules）。

### Minor Changes

- dc251b9: M2 组件层首发：components（UI 适配器双库 antdv/Element Plus + SearchForm / EnhanceTable / EmptyState / StatusTag / ResultPage / Dialog / Drawer / Upload / TreeSelect 九组件，统一 props 契约与惰性加载）、biz-components（MX_RUNTIME_CONTEXT_KEY 上下文契约 + Lov 值集选择器双模式 + DocumentTable 单据表格），附单元测试、demo-light 演示与 VitePress 文档。
- dc251b9: M3 能力增量：components 统一 DataTable 契约增加受控行展开（expandedRowKeys + expandedRow 作用域槽，antdv / Element Plus 双库同步落地，EnhanceTable 透传）；biz-components 新增 Lov cascadeSource 级联语义（父值变化清空子值 / 父空禁用触发器）与 DocumentTable 行展开子表透传，附单测、demo-light 级联与子表演示及文档双示例。
- dc251b9: M4 能力增量：Lov 弹窗自定义（columns prop 覆盖默认弹窗列 + bodyCell 单元格作用域槽）与 DocumentTable 单元格级粒度权限（列级 permissionCode some 语义 + editable 升级为 boolean | (row)=>boolean 行级粒度 + 权限源上下文 permissions 探测 / props.permissions 兜底 + 无权限单元格渲染只读文本并跳过必填校验防死锁），附单测 9 项、demo-light 两处演示与文档双示例。

### Patch Changes

- Updated dependencies [6af8318]
- Updated dependencies [dc251b9]
- Updated dependencies [dc251b9]
- Updated dependencies [dc251b9]
- Updated dependencies
  - @mengxi-ark/hooks@1.0.0-beta.0
  - @mengxi-ark/components@1.0.0-beta.0
