# EnhanceTable Enhanced Table

A general enhanced table from `@mengxi-ark/components`: data is externally driven (paired with the `useTable` return values), rendered internally through the UI adapter's DataTable capability, with three fallback slots —
toolbar / cell / empty state — and `EmptyState` rendered automatically for empty data.

## Use Cases

**When to use**: read-only display lists (data is externally driven — the component fetches nothing itself); tables that need the unified column / pagination / row-selection / sorting / row-expansion contracts;
consistent empty state, size semantics and loading state across the library.

**When not to use**: document tables with inline editing and field validation (use [DocumentTable](/en/api/documenttable)); scenarios where the component must fetch data itself (EnhanceTable data is always externally
driven — manage request state with [useTable](/en/api/hooks)).

## Example 1: Basic Table

```vue
<script setup lang="ts">
import { EnhanceTable } from '@mengxi-ark/components'
import type { MxColumn } from '@mengxi-ark/components'

const columns: MxColumn[] = [
	{ dataIndex: 'id', title: '编号' },
	{ dataIndex: 'name', title: '姓名' },
	{ dataIndex: 'status', title: '状态' }
]

const dataSource = [
	{ id: 1, name: '曦舟', status: '启用' },
	{ id: 2, name: '梦曦', status: '停用' }
]
</script>

<template>
	<EnhanceTable :columns="columns" :data-source="dataSource" />
</template>
```

## Example 2: Pagination + Controlled Row Selection (with useTable)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { EnhanceTable } from '@mengxi-ark/components'
import { useTable } from '@mengxi-ark/hooks'
import type { MxColumn } from '@mengxi-ark/components'
import type { TableQueryParams, TableSourceResult } from '@mengxi-ark/hooks'

const columns: MxColumn[] = [
	{ dataIndex: 'id', title: '编号' },
	{ dataIndex: 'name', title: '姓名' }
]

function fetchUserPage(params: TableQueryParams<Record<string, unknown>>): Promise<TableSourceResult<Record<string, unknown>>> {
	// the business injects its own request instance
	return Promise.resolve({ list: [], total: 0 })
}

const { dataSource, loading, pagination } = useTable(fetchUserPage)

const selectedKeys = ref<Array<string | number>>([])

const rowSelection = {
	selectedRowKeys: selectedKeys,
	onChange: (keys: Array<string | number>) => {
		selectedKeys.value = keys
	}
}
</script>

<template>
	<EnhanceTable :columns="columns" :data-source="dataSource" :loading="loading" :pagination="pagination" :row-selection="rowSelection" @page-change="pagination.onChange" />
	<p>已选：{{ selectedKeys.join(', ') || '无' }}</p>
</template>
```

## Example 3: Custom Cell Rendering & Toolbar

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

| Prop         | Type                                    | Default      | Description                                                     |
| ------------ | --------------------------------------- | ------------ | --------------------------------------------------------------- |
| columns      | `MxColumn[]`                            | required     | Column configuration (`dataIndex` / `title` required)           |
| dataSource   | `Record<string, unknown>[]`             | `[]`         | Data of the current page                                        |
| rowKey       | `string \| ((row) => string \| number)` | `'id'`       | Row key field name or value getter                              |
| loading      | `boolean`                               | `false`      | Loading state                                                   |
| size         | `'sm' \| 'md' \| 'lg'`                  | `'md'`       | Size semantics                                                  |
| pagination   | `MxPaginationState \| false`            | `false`      | Pagination state (structure aligned with useTable's pagination) |
| rowSelection | `MxRowSelection \| false`               | `false`      | Controlled row-selection state                                  |
| emptyText    | `string`                                | `'暂无数据'` | Empty-state description text                                    |

### Events

| Event      | Payload                                   | Description                     |
| ---------- | ----------------------------------------- | ------------------------------- |
| pageChange | `(current: number, size: number)`         | Page number / page size changed |
| sortChange | `(field: string, order: 'asc' \| 'desc')` | Header sorting changed          |
| rowClick   | `(record, index)`                         | Row clicked                     |

### Slots

| Slot     | Description                                           |
| -------- | ----------------------------------------------------- |
| toolbar  | Toolbar (above the table, paired with the query area) |
| bodyCell | Custom cell rendering (`{ column, record, index }`)   |
| empty    | Custom empty state (default: EmptyState + emptyText)  |

## Related Tutorials

- [Component Walkthrough](/en/guide/components-guide): Steps 1 / 2 demo the minimal usage plus toolbar and bodyCell slot customization;
- [SearchForm API](/en/api/searchform): pair it with the query area for the standard list-page pattern.
