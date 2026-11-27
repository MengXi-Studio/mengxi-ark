# @mengxi-ark/biz-components

> 双模式业务组件层：Lov 值集选择器 / DocumentTable 单据表格，独立使用或中台基座联动，无需改代码自动切换。

[![npm version](https://img.shields.io/npm/v/@mengxi-ark/biz-components?style=flat-square)](https://www.npmjs.com/package/@mengxi-ark/biz-components)
[![license](https://img.shields.io/npm/l/@mengxi-ark/biz-components?style=flat-square)](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)

[MengXi Ark｜曦舟](https://github.com/MengXi-Studio/mengxi-ark) 的业务组件包。双模式契约：

1. **独立模式（默认降级）**：`lovApi` / `params` 等 props 驱动，组件内部 `useRequest` 自行请求，不需要任何基座；
2. **基座联动模式**：`inject` 探测 `MX_RUNTIME_CONTEXT_KEY`（值集缓存 / 用户信息 / 权限），探测成功自动复用，**不 import `@mengxi-ark/runtime`**；
3. 上下文字段全部支持同名 props 兜底，探测失败自动切独立模式，不抛致命异常。

## 安装

```bash
pnpm add @mengxi-ark/biz-components @mengxi-ark/components @mengxi-ark/theme ant-design-vue
```

## 使用示例（独立模式）

```vue
<script setup lang="ts">
import { Lov } from '@mengxi-ark/biz-components'
import { DocumentTable } from '@mengxi-ark/biz-components'
import type { DocColumn } from '@mengxi-ark/biz-components'
import '@mengxi-ark/components/style.css'

// Lov：v-model + lovApi（约定入参 keyword / currentPage / pageSize，返回数组或 { list, total }）
const ownerId = ref('')

// DocumentTable：可编辑单据表格，列级校验 / 编辑器 / 权限
const columns: DocColumn[] = [
	{ field: 'name', title: '名称', editable: true, editorType: 'input', rules: [{ required: true }] }
]
</script>

<template>
	<Lov v-model="ownerId" lovApi="/api/users" />
	<DocumentTable v-model="rows" :columns="columns" @save="onSave" />
</template>
```

> 在 `@mengxi-ark/runtime` 基座下使用时，去掉 `lovApi` 等 props 即自动复用基座值集缓存，业务代码零改动。

## 能力清单

| 组件            | 能力                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| `Lov`           | 值集选择、分页 / 搜索、`cascadeSource` 级联、弹窗列与单元格自定义插槽                     |
| `DocumentTable` | 行内编辑、列级校验规则、`permissionCode` 单元格级权限、行展开子表、`@save` 抛全量数据    |
| 上下文探测       | `MX_RUNTIME_CONTEXT_KEY` / `useRuntimeContext`，字段与兜底 props 同名对应                 |

## 文档

- 完整文档：<https://mengxi-studio.github.io/mengxi-ark/>
- Lov API：<https://mengxi-studio.github.io/mengxi-ark/api/lov.html>
- DocumentTable API：<https://mengxi-studio.github.io/mengxi-ark/api/documenttable.html>

## 协议

[MIT](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)
