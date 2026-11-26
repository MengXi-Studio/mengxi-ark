# @mengxi-ark/biz-components

## 1.0.0-beta.0

- v1.0.0-beta 公测首发（M0–M4 全量落地，npm dist-tag `beta`）。
- 双模式业务组件：`MX_RUNTIME_CONTEXT_KEY` 上下文契约，独立模式自请求开箱即用，基座联动模式 inject 探测自动复用上下文、上下文丢失自动降级。
- Lov 值集选择器：静态值集 / 远程接口双模式，cascadeSource 级联语义（父值变化清空子值 / 父空禁用触发器），弹窗自定义（columns 覆盖默认列 + bodyCell 单元格作用域槽）。
- DocumentTable 单据表格：行编辑 / 字段校验 / save 抛全量数据，行展开子表透传，单元格级权限（列级 permissionCode some 语义 + editable 行级函数化 + 无权限单元格只读并跳过必填校验防死锁）。
