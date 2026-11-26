# Lov Value-Set Selector

A dual-mode component from `@mengxi-ark/biz-components`: encapsulates the "popup table selection" interaction pattern without binding to fixed backend fields. The row's `label` / `value` are mapped via `fieldNames`, and
the row key is taken from `fieldNames.value`.

## Use Cases

**When to use**: value-set / master-data selection (users, departments, orgs, dictionary items, etc.) — popup table selection in API mode, inline dropdown for static value sets; cascading selection like province / city
(cascadeSource); standard selectors with debounced search + pagination; reusing one component across "with base / without base" environments.

**When not to use**: fixed options with very few entries (two or three buttons / radios are more direct); complex multi-step operations inside the popup (the Lov popup only selects — compose complex interactions with
handwritten SFC + Dialog); tree-level selection (the adapter provides the TreeSelect primitive for business composition).

## Two Runtime Modes

| Mode                  | Trigger                                                                                | Data Source                                                                    |
| --------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Static value-set mode | `lovCode` hits the context / props value-set cache, or `lovOptions` is passed directly | Inline Select dropdown, no popup                                               |
| Remote API mode       | `lovApi` (prop) or the context's `lovListApi` is available                             | Popup table + keyword search + pagination; keyword input is debounced at 300ms |

Resolution priority: **context → props → standalone empty state**. When the base isn't installed or the context is lost, the component switches to standalone mode automatically (console.warn once) without throwing.

API contract: input `{ keyword, currentPage, pageSize, ...params }`; returns `LovRow[]` (no pagination) or `{ list, total }` (paginated).

## Example 1: Standalone Mode (No Base Required)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Lov } from '@mengxi-ark/biz-components'
import type { LovOption, LovRow } from '@mengxi-ark/biz-components'

const value = ref<string | number | null>(null)
const selectedOptions = ref<LovOption[]>([])

interface UserRow {
	code: string
	name: string
}

// API mode: returning { list, total } means paginated; returning an array means unpaginated
const userLovApi = async (params: Record<string, unknown>) => {
	const rows: UserRow[] = [
		{ code: 'U01', name: '用户1' },
		{ code: 'U02', name: '用户2' }
	]
	const keyword = String(params.keyword ?? '').trim()
	const matched = keyword ? rows.filter(row => row.name.includes(keyword)) : rows
	const start = ((Number(params.currentPage) || 1) - 1) * (Number(params.pageSize) || 10)
	return { list: matched.slice(start, start + Number(params.pageSize || 10)), total: matched.length }
}

// static value-set mode: lovCode + lovCache (or lovOptions)
const genderOptions: LovOption[] = [
	{ label: '男', value: '1' },
	{ label: '女', value: '2' }
]
</script>

<template>
	<!-- API mode: popup table selection -->
	<Lov v-model="value" :lov-api="userLovApi" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择用户" @change="(_v, options) => (selectedOptions = options)" />
	<p>选中：{{ selectedOptions.map(o => o.label).join('、') }}</p>

	<!-- static value-set mode: inline Select dropdown -->
	<Lov v-model="gender" lov-code="GENDER" :lov-options="genderOptions" />
</template>
```

When `params` changes, the request re-fires automatically with debouncing: `<Lov v-model="value" :lov-api="userLovApi" :params="{ orgId }" />`.

## Example 2: Base-Linked Mode (inject Probing the Runtime Context)

Lov does not import runtime — it only probes via inject with `MX_RUNTIME_CONTEXT_KEY`; when probing succeeds, it automatically reuses the context's `lovListApi` / value-set cache. The mock provide below demonstrates the
mechanism (after the runtime base is installed, contextService delivers the same contract):

```vue
<script setup lang="ts">
import { provide } from 'vue'
import { Lov, MX_RUNTIME_CONTEXT_KEY } from '@mengxi-ark/biz-components'
import type { LovOption, LovRow } from '@mengxi-ark/biz-components'
import type { MxRuntimeContext } from '@mengxi-ark/biz-components'

// base scenario: runtime.install() provides internally; an equivalent context is mocked here
const mockContext: MxRuntimeContext = {
	user: { id: 1, name: '曦舟' },
	permissions: ['user:add'],
	lovListApi: async (params: Record<string, unknown>): Promise<LovRow[]> => {
		// the context lovListApi usually takes no pagination and returns the full array (Lov selects directly without paging or slices on its own)
		return [
			{ key: '1', label: '启用' },
			{ key: '0', label: '停用' }
		]
	},
	lovCache: {
		GENDER: [
			{ label: '男', value: '1' },
			{ label: '女', value: '2' }
		] as LovOption[]
	}
}

provide(MX_RUNTIME_CONTEXT_KEY, mockContext)

const status = ref<string | number | null>(null)
const gender = ref<string | number | null>(null)

// props fallback: takes effect when the context lovCache lacks STATUS
const statusLovApi = async (params: Record<string, unknown>): Promise<LovRow[]> => {
	return [
		{ key: '1', label: '启用' },
		{ key: '0', label: '停用' }
	]
}
</script>

<template>
	<!-- hits context lovCache['GENDER']; static inline dropdown -->
	<Lov v-model="gender" lov-code="GENDER" />
	<!-- falls back to the lovApi prop when the context has no such value-set cache -->
	<Lov v-model="status" lov-code="STATUS" :lov-api="statusLovApi" :field-names="{ label: 'label', value: 'key' }" />
</template>
```

Context loss (base not installed / fields missing) degrades automatically: when `lovListApi` is missing it falls back to the `lovApi` prop; when both are missing, an empty state renders with a single warning. Behavior
matches the fallback-switching switch of the "Lov base-linked" panel in demo-light.

## Example 3: Cascade (cascadeSource)

Cascading introduces no container component: the child Lov binds two things at once — `:params="{ parentId: parentValue }"` (existing debounced re-query; the child refreshes with the parent) +
`:cascade-source="parentValue"` (parent changes clear the child value / empty parent disables it). Cascade depth and layout are composed freely by the host template.

Two default behaviors:

1. **Any change of the parent value (including being cleared) clears the child value**, and `change` emits empty options in sync to prevent dirty data;
2. **The child trigger is disabled while the parent is empty** (`null` or an empty array), preventing invalid requests. Not passing it (`undefined`) means cascading is not enabled, leaving existing usage untouched.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Lov } from '@mengxi-ark/biz-components'

const province = ref<string | null>(null)
const city = ref<string | null>(null)

const regionApi = async (params: Record<string, unknown>) => {
	// with parentId, returns the city list of that province; null parentId returns empty; absent returns provinces
	const rows = params.parentId ? REGIONS.filter(r => r.parentId === params.parentId) : REGIONS.filter(r => r.parentId === null)
	return rows
}
const REGIONS = [
	{ code: 'ZJ', name: '浙江省', parentId: null },
	{ code: 'HZ', name: '杭州市', parentId: 'ZJ' },
	{ code: 'NB', name: '宁波市', parentId: 'ZJ' }
]
</script>

<template>
	<Lov v-model="province" :lov-api="regionApi" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择省份" />
	<!-- child: params drives the data refresh + cascadeSource drives clearing and disabling -->
	<Lov v-model="city" :lov-api="regionApi" :params="{ parentId: province }" :cascade-source="province" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择城市" />
</template>
```

Also applies in base-linked mode: in the value-set code mode (`lovCode`), the child Lov simply binds `:cascade-source` to get the same semantics, while the data source still goes through the context.

## Example 4: Popup Customization (columns Override + bodyCell Cell Rendering)

The popup table renders the two default columns "name / code" by default. The `columns` prop can override the popup columns wholesale (column structure same as `MxColumn`); the `bodyCell` scoped slot
(`{ column, record, index }`) customizes cell rendering. Only effective in remote API mode.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Lov } from '@mengxi-ark/biz-components'
import type { MxColumn } from '@mengxi-ark/components'

const value = ref<string | null>(null)

const userApi = async () => USERS
const USERS = [
	{ code: 'U01', name: '张三', status: '1' },
	{ code: 'U02', name: '李四', status: '0' }
]

// override the popup columns: show a status column instead of the code column
const popupColumns: MxColumn[] = [
	{ dataIndex: 'name', title: '用户名称' },
	{ dataIndex: 'status', title: '状态' }
]
</script>

<template>
	<Lov v-model="value" :lov-api="userApi" :columns="popupColumns" :field-names="{ label: 'name', value: 'code' }">
		<template #bodyCell="{ column, record }">
			<template v-if="column.dataIndex === 'status'">
				<span :class="record.status === '1' ? 'is-on' : 'is-off'">
					{{ record.status === '1' ? '在职' : '离职' }}
				</span>
			</template>
			<template v-else>{{ record[column.dataIndex] }}</template>
		</template>
	</Lov>
</template>
```

The trigger area already has a default slot that can replace the displayed content entirely (e.g. an "3 selected" badge); the popup title goes through the `popupTitle` prop.

## API

### LovProps

| Prop          | Type                                               | Default                              | Description                                                                                                                                                                         |
| ------------- | -------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modelValue    | `string \| number \| (string \| number)[] \| null` | `null`                               | Selected value (a key for single select, a key array for multiple), v-model                                                                                                         |
| lovCode       | `string`                                           | —                                    | Value-set code (key into the context / props.lovCache)                                                                                                                              |
| lovApi        | `LovListApi`                                       | —                                    | Standalone-mode API (the context's lovListApi takes priority)                                                                                                                       |
| params        | `Record<string, unknown>`                          | —                                    | Query parameters for API mode (re-queried with 300ms debounce on change)                                                                                                            |
| lovCache      | `Record<string, LovOption[]>`                      | —                                    | Static value-set cache as the props fallback                                                                                                                                        |
| lovOptions    | `LovOption[]`                                      | —                                    | Static options as the props fallback (takes effect when lovCode misses the cache)                                                                                                   |
| fieldNames    | `{ label: string; value: string }`                 | `{ label: 'label', value: 'value' }` | Row data field mapping                                                                                                                                                              |
| multiple      | `boolean`                                          | `false`                              | Whether multiple selection                                                                                                                                                          |
| size          | `'sm' \| 'md' \| 'lg'`                             | `'md'`                               | Size semantics                                                                                                                                                                      |
| placeholder   | `string`                                           | `'请选择'`                           | Placeholder hint                                                                                                                                                                    |
| disabled      | `boolean`                                          | `false`                              | Whether disabled                                                                                                                                                                    |
| readonly      | `boolean`                                          | `false`                              | Read-only (no popup)                                                                                                                                                                |
| allowClear    | `boolean`                                          | `true`                               | Whether clearable                                                                                                                                                                   |
| popupTitle    | `string`                                           | `'请选择'`                           | Popup title                                                                                                                                                                         |
| pageSize      | `number`                                           | `10`                                 | Rows per page in the popup table                                                                                                                                                    |
| cascadeSource | `string \| number \| (string \| number)[] \| null` | —                                    | Current value of the cascade parent: any change clears itself; null / an empty array means the parent is empty → the trigger is disabled; not passed means cascading is not enabled |
| columns       | `MxColumn[]`                                       | name / code two columns              | Popup table column configuration (overrides the default columns; only effective in remote API mode)                                                                                 |

### Events

| Event             | Payload                         | Description                                                                             |
| ----------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| update:modelValue | `(value)`                       | v-model                                                                                 |
| change            | `(value, options: LovOption[])` | Selection changed; emits the normalized options (a single-item array for single select) |

### Slots

| Slot     | Description                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------- |
| default  | Custom trigger display area                                                                               |
| bodyCell | Custom popup table cell rendering (scoped `{ column, record, index }`; only effective in remote API mode) |

## Related Tutorials

- [Component Walkthrough](/en/guide/components-guide): Step 3 demos standalone mode (api + params / cascadeSource cascading / popup customization); Step 5 demos base-linked mode and the fallback differences.
