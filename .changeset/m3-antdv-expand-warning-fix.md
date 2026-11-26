---
'@mengxi-ark/components': patch
---

修复 AntdvDataTable 行展开启用时的 antdv 弃用告警：childrenColumnName 传哑键禁用树形嵌套语义，避免数据行 children 字段触发「expandedRowRender should not use with nested Table」与「expandIconColumnIndex is deprecated」控制台告警。统一契约的行展开仅由 expandedRowKeys 受控驱动，不受影响。
