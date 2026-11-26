---
'@mengxi-ark/biz-components': minor
---

M4 能力增量：Lov 弹窗自定义（columns prop 覆盖默认弹窗列 + bodyCell 单元格作用域槽）与 DocumentTable 单元格级粒度权限（列级 permissionCode some 语义 + editable 升级为 boolean | (row)=>boolean 行级粒度 + 权限源上下文 permissions 探测 / props.permissions 兜底 + 无权限单元格渲染只读文本并跳过必填校验防死锁），附单测 9 项、demo-light 两处演示与文档双示例。
