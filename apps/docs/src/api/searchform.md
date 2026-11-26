# SearchForm 高级查询区

`@mengxi-ark/components` 配置驱动的查询表单区：`fields` 声明字段，内部维护表单值，`search` / `reset` 事件抛给上层（配合 `useTable` 的 `search` / `reset` 使用）。props 驱动优先，不需要任何基座注册。

## 适用场景

**何时用**：列表页顶部的标准查询区（input / select / dateRange 三类控件足够覆盖多数场景）；希望字段折叠展开、按钮 loading、重置回 initialValue 全部零样板；与 [useTable](/api/hooks) / EnhanceTable 组成「查询区 + 表格」标准范式。

**何时不用**：查询控件类型超出 input / select / dateRange（如树选择、上传——经 `extra` 插槽自定义字段，或直接手写 SFC 表单）；需要复杂联动表单（那是 FormRenderer / 手写 SFC 的领域）。

```bash
pnpm add @mengxi-ark/components
```

## 示例一：字段配置驱动

```vue
<script setup lang="ts">
import { SearchForm } from '@mengxi-ark/components';
import type { SearchField } from '@mengxi-ark/components';

const fields: SearchField[] = [
  { name: 'keyword', label: '关键字', type: 'input', placeholder: '按姓名搜索' },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: '1' },
      { label: '停用', value: '0' },
    ],
  },
  { name: 'createdAt', label: '创建时间', type: 'dateRange' },
];

function handleSearch(values: Record<string, unknown>): void {
  console.log(values);
}
</script>

<template>
  <SearchForm :fields="fields" @search="handleSearch" />
</template>
```

## 示例二：配合 useTable 的完整查询页

```vue
<script setup lang="ts">
import { SearchForm, EnhanceTable } from '@mengxi-ark/components';
import { useTable } from '@mengxi-ark/hooks';
import type { MxColumn, SearchField } from '@mengxi-ark/components';
import type { TableQueryParams, TableSourceResult } from '@mengxi-ark/hooks';

const searchFields: SearchField[] = [
  { name: 'keyword', label: '关键字', type: 'input', placeholder: '按姓名搜索' },
];

const columns: MxColumn[] = [
  { dataIndex: 'id', title: '编号' },
  { dataIndex: 'name', title: '姓名' },
  { dataIndex: 'dept', title: '部门' },
];

function fetchUserPage(params: TableQueryParams<{ keyword: string }>): Promise<TableSourceResult<Record<string, unknown>>> {
  // 业务自注入请求实例，此处以本地 mock 演示
  return Promise.resolve({ list: [], total: 0 });
}

const { dataSource, loading, pagination, search } = useTable(fetchUserPage, {
  defaultParams: { keyword: '' },
});
</script>

<template>
  <SearchForm
    :fields="searchFields"
    :loading="loading"
    @search="(values) => search(values)"
  />
  <EnhanceTable
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    :pagination="pagination"
    @page-change="pagination.onChange"
  />
</template>
```

## API

### SearchFormProps

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| fields | `SearchField[]` | 必填 | 查询字段配置 |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸语义 |
| collapsible | `boolean` | `true` | 字段数超限时支持折叠展开 |
| defaultCollapsedCount | `number` | `3` | 折叠时展示的字段数 |
| loading | `boolean` | `false` | 查询按钮 loading |
| searchText | `string` | `'查询'` | 查询按钮文案 |
| resetText | `string` | `'重置'` | 重置按钮文案 |

### SearchField

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| name | `string` | 字段名（search 事件 values 的 key） |
| label | `string` | 字段标签 |
| type | `'input' \| 'select' \| 'dateRange'` | 控件类型 |
| options | `MxSelectOption[]` | select 类型的选项 |
| placeholder | `string` | 占位提示 |
| initialValue | `unknown` | 初始值（reset 恢复的基准） |
| width | `number \| string` | 控件宽度 |
| disabled | `boolean` | 是否禁用 |

### Events

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| search | `(values: Record<string, unknown>)` | 点击查询，未填项为 undefined |
| reset | `()` | 点击重置，恢复各字段 initialValue |

### Slots

| 插槽 | 说明 |
| --- | --- |
| extra | 额外自定义字段区域（渲染在按钮之前） |

## 相关教程

- [组件实战](/guide/components-guide)：第 1 / 2 步演示 SearchForm 最简用法与插槽自定义，第 5 步演示基座联动环境下的行为。
