# SearchForm Advanced Query Area

A config-driven query form area from `@mengxi-ark/components`: `fields` declares the fields, form values are managed internally, and the `search` / `reset` events are thrown to the caller (paired with the `search` /
`reset` of `useTable`). Props-driven first — no base registration required.

## Use Cases

**When to use**: the standard query area on top of list pages (input / select / dateRange cover most scenarios); zero boilerplate for field collapsing, button loading, and reset back to initialValue; composing the "query
area + table" standard pattern with [useTable](/en/api/hooks) / EnhanceTable.

**When not to use**: query control types beyond input / select / dateRange (tree select, upload — customize fields via the `extra` slot, or hand-write the SFC form); complex linked forms (that's the territory of
FormRenderer / handwritten SFCs).

```bash
pnpm add @mengxi-ark/components
```

## Example 1: Config-Driven Fields

```vue
<script setup lang="ts">
import { SearchForm } from '@mengxi-ark/components'
import type { SearchField } from '@mengxi-ark/components'

const fields: SearchField[] = [
	{ name: 'keyword', label: '关键字', type: 'input', placeholder: '按姓名搜索' },
	{
		name: 'status',
		label: '状态',
		type: 'select',
		options: [
			{ label: '启用', value: '1' },
			{ label: '停用', value: '0' }
		]
	},
	{ name: 'createdAt', label: '创建时间', type: 'dateRange' }
]

function handleSearch(values: Record<string, unknown>): void {
	console.log(values)
}
</script>

<template>
	<SearchForm :fields="fields" @search="handleSearch" />
</template>
```

## Example 2: A Full Query Page with useTable

```vue
<script setup lang="ts">
import { SearchForm, EnhanceTable } from '@mengxi-ark/components'
import { useTable } from '@mengxi-ark/hooks'
import type { MxColumn, SearchField } from '@mengxi-ark/components'
import type { TableQueryParams, TableSourceResult } from '@mengxi-ark/hooks'

const searchFields: SearchField[] = [{ name: 'keyword', label: '关键字', type: 'input', placeholder: '按姓名搜索' }]

const columns: MxColumn[] = [
	{ dataIndex: 'id', title: '编号' },
	{ dataIndex: 'name', title: '姓名' },
	{ dataIndex: 'dept', title: '部门' }
]

function fetchUserPage(params: TableQueryParams<{ keyword: string }>): Promise<TableSourceResult<Record<string, unknown>>> {
	// the business injects its own request instance; a local mock is used here for demonstration
	return Promise.resolve({ list: [], total: 0 })
}

const { dataSource, loading, pagination, search } = useTable(fetchUserPage, {
	defaultParams: { keyword: '' }
})
</script>

<template>
	<SearchForm :fields="searchFields" :loading="loading" @search="values => search(values)" />
	<EnhanceTable :columns="columns" :data-source="dataSource" :loading="loading" :pagination="pagination" @page-change="pagination.onChange" />
</template>
```

## API

### SearchFormProps

| Prop                  | Type                   | Default  | Description                                                            |
| --------------------- | ---------------------- | -------- | ---------------------------------------------------------------------- |
| fields                | `SearchField[]`        | required | Query field configuration                                              |
| size                  | `'sm' \| 'md' \| 'lg'` | `'md'`   | Size semantics                                                         |
| collapsible           | `boolean`              | `true`   | Supports collapsing / expanding when the field count exceeds the limit |
| defaultCollapsedCount | `number`               | `3`      | Number of fields shown while collapsed                                 |
| loading               | `boolean`              | `false`  | Loading state of the search button                                     |
| searchText            | `string`               | `'查询'` | Text of the search button                                              |
| resetText             | `string`               | `'重置'` | Text of the reset button                                               |

### SearchField

| Prop         | Type                                 | Description                                                |
| ------------ | ------------------------------------ | ---------------------------------------------------------- |
| name         | `string`                             | Field name (key in the values payload of the search event) |
| label        | `string`                             | Field label                                                |
| type         | `'input' \| 'select' \| 'dateRange'` | Control type                                               |
| options      | `MxSelectOption[]`                   | Options for the select type                                |
| placeholder  | `string`                             | Placeholder hint                                           |
| initialValue | `unknown`                            | Initial value (the baseline restored by reset)             |
| width        | `number \| string`                   | Control width                                              |
| disabled     | `boolean`                            | Whether disabled                                           |

### Events

| Event  | Payload                             | Description                                       |
| ------ | ----------------------------------- | ------------------------------------------------- |
| search | `(values: Record<string, unknown>)` | Search clicked; unfilled items are undefined      |
| reset  | `()`                                | Reset clicked; restores each field's initialValue |

### Slots

| Slot  | Description                                           |
| ----- | ----------------------------------------------------- |
| extra | Extra custom field area (rendered before the buttons) |

## Related Tutorials

- [Component Walkthrough](/en/guide/components-guide): Steps 1 / 2 demo the minimal SearchForm usage and slot customization; Step 5 demos its behavior in a base-linked environment.
