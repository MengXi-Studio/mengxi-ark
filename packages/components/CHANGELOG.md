# @mengxi-ark/components

## 1.0.0-beta.1

### Patch Changes

- 4d48d24: 修复预发布包缺失构建产物：beta.0 发布时未执行构建，tarball 仅含 package.json 与 LICENSE；发布流程补充 pnpm build 后以 beta.1 重新发布完整产物

## 1.0.0-beta.0

- v1.0.0-beta 公测首发（M0–M4 全量落地，npm dist-tag `beta`）。
- UI 适配器双库（Ant Design Vue 默认 / Element Plus）+ 九组件：SearchForm / EnhanceTable / EmptyState / StatusTag / ResultPage / Dialog / Drawer / Upload / TreeSelect，统一 props 契约与惰性加载。
- 统一 DataTable 契约支持受控行展开（expandedRowKeys + expandedRow 作用域槽，双库同步落地，EnhanceTable 透传）。
- AntdvDataTable 行展开已规避 antdv 弃用告警（childrenColumnName 传哑键禁用树形嵌套语义）。
