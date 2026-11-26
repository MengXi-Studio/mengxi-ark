# EnhanceTable 增强表格

`@mengxi-ark/components` 通用增强表格：数据外部驱动（配合 `useTable` 返回值），内部经 UI 适配器 DataTable 能力渲染，工具栏 / 单元格 / 空状态三插槽兜底，空数据自动渲染 `EmptyState`。

## 示例一：基础表格

```vue
<script setup lang="ts">
import { EnhanceTable } from '@mengxi-ark/components';
import type { MxColumn } from '@mengxi-ark/components';

const columns: MxColumn[] = [
  { dataIndex: 'id', title: '编号' },
  { dataIndex: 'name', title: '姓名' },
  { dataIndex: 'status', title: '状态' },
];

const dataSource = [
  { id: 1, name: '曦舟', status: '启用' },
  { id: 2, name: '梦曦', status: '停用' },
];
</script>

<template>
  <EnhanceTable :columns="columns" :data-source="dataSource" />
</template>
```

## 示例二：分页 + 行选择受控（配合 useTable）

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { EnhanceTable } from '@mengxi-ark/components';
import { useTable } from '@mengxi-ark/hooks';
import type { MxColumn } from '@mengxi-ark/components';
import type { TableQueryParams, TableSourceResult } from '@mengxi-ark/hooks';

const columns: MxColumn[] = [
  { dataIndex: 'id', title: '编号' },
  { dataIndex: 'name', title: '姓名' },
];

function fetchUserPage(params: TableQueryParams<Record<string, unknown>>): Promise<TableSourceResult<Record<string, unknown>>> {
  // 业务自注入请求实例
  return Promise.resolve({ list: [], total: 0 });
}

const { dataSource, loading, pagination } = useTable(fetchUserPage);

const selectedKeys = ref<Array<string | number>>([]);

const rowSelection = {
  selectedRowKeys: selectedKeys,
  onChange: (keys: Array<string | number>) => {
    selectedKeys.value = keys;
  },
};
</script>

<template>
  <EnhanceTable
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    :pagination="pagination"
    :row-selection="rowSelection"
    @page-change="pagination.onChange"
  />
  <p>已选：{{ selectedKeys.join(', ') || '无' }}</p>
</template>
```

## 示例三：单元格自定义渲染与工具栏

```vue
<template>
  <EnhanceTable :columns="columns" :data-source="dataSource">
    <template #toolbar>
      <button type="button">新增</button>
    </template>
    <template #bodyCell="{ column, record }">
      <span v-if="column.dataIndex === 'status'">
        {{ record.status === '1' ? '启用' : '停用' }}
      </span>
    </template>
  </EnhanceTable>
</template>
```

## API

### EnhanceTableProps

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| columns | `MxColumn[]` | 必填 | 列配置（`dataIndex` / `title` 必填） |
| dataSource | `Record<string, unknown>[]` | `[]` | 当页数据 |
| rowKey | `string \| ((row) => string \| number)` | `'id'` | 行 key 字段名或取值函数 |
| loading | `boolean` | `false` | 加载中 |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸语义 |
| pagination | `MxPaginationState \| false` | `false` | 分页状态（结构对齐 useTable 的 pagination） |
| rowSelection | `MxRowSelection \| false` | `false` | 行选择受控状态 |
| emptyText | `string` | `'暂无数据'` | 空状态描述文案 |

### Events

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| pageChange | `(current: number, size: number)` | 页码 / 每页条数变更 |
| sortChange | `(field: string, order: 'asc' \| 'desc')` | 表头排序变更 |
| rowClick | `(record, index)` | 行点击 |

### Slots

| 插槽 | 说明 |
| --- | --- |
| toolbar | 工具栏（表格上方，与查询区配合） |
| bodyCell | 单元格自定义渲染（`{ column, record, index }`） |
| empty | 空状态自定义（默认 EmptyState + emptyText） |
