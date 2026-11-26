# EnhanceTable 增强表格

`@mengxi-ark/components` 通用增强表格：数据外部驱动（配合 `useTable` 返回值），内部经 UI 适配器 DataTable 能力渲染，工具栏 / 单元格 / 行展开 / 空状态四插槽兜底，空数据自动渲染 `EmptyState`。

## 适用场景

**何时用**：只读展示型列表（数据由外部驱动，组件不自带请求）；需要统一列配置 / 分页 / 行选择 / 排序 / 行展开契约的表格；希望空状态、尺寸语义、加载态全库一致。

**何时不用**：需要行内编辑与字段校验的单据表格（交给 [DocumentTable](/api/documenttable)）；需要组件内部自行拉取数据的场景（EnhanceTable 数据一律外部驱动，请求状态用 [useTable](/api/hooks) 管理）。

## 示例一：基础表格

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

## 示例二：分页 + 行选择受控（配合 useTable）

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
	// 业务自注入请求实例
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

| 属性            | 类型                                    | 默认值       | 说明                                                                                              |
| --------------- | --------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| columns         | `MxColumn[]`                            | 必填         | 列配置（`dataIndex` / `title` 必填）                                                              |
| dataSource      | `Record<string, unknown>[]`             | `[]`         | 当页数据                                                                                          |
| rowKey          | `string \| ((row) => string \| number)` | `'id'`       | 行 key 字段名或取值函数                                                                           |
| loading         | `boolean`                               | `false`      | 加载中                                                                                            |
| size            | `'sm' \| 'md' \| 'lg'`                  | `'md'`       | 尺寸语义                                                                                          |
| pagination      | `MxPaginationState \| false`            | `false`      | 分页状态（结构对齐 useTable 的 pagination）                                                       |
| rowSelection    | `MxRowSelection \| false`               | `false`      | 行选择受控状态                                                                                    |
| expandedRowKeys | `(string \| number)[] \| undefined`     | —            | 受控行展开 keys（undefined 不启用展开；展开内容经 expandedRow 槽渲染，v-model:expanded-row-keys） |
| emptyText       | `string`                                | `'暂无数据'` | 空状态描述文案                                                                                    |

### Events

| 事件                   | 载荷                                      | 说明                                   |
| ---------------------- | ----------------------------------------- | -------------------------------------- |
| pageChange             | `(current: number, size: number)`         | 页码 / 每页条数变更                    |
| sortChange             | `(field: string, order: 'asc' \| 'desc')` | 表头排序变更                           |
| rowClick               | `(record, index)`                         | 行点击                                 |
| update:expandedRowKeys | `(keys: (string \| number)[])`            | 展开行变化（expandedRowKeys 受控回抛） |

### Slots

| 插槽        | 说明                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| toolbar     | 工具栏（表格上方，与查询区配合）                                          |
| bodyCell    | 单元格自定义渲染（`{ column, record, index }`）                           |
| expandedRow | 行展开内容（作用域 `{ record, index }`；子表 / 任意内容由业务在槽内组合） |
| empty       | 空状态自定义（默认 EmptyState + emptyText）                               |

## 相关教程

- [组件实战](/guide/components-guide)：第 1 / 2 步演示最简用法、工具栏与 bodyCell 插槽自定义；
- [SearchForm API](/api/searchform)：与查询区组成标准列表页范式。
