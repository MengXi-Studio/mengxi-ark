# Component Walkthrough: Five Progressive Steps

This chapter walks you from the simplest props usage all the way to base linking through five increasingly layered steps. All examples are distilled from the runnable `apps/demo-light` / `apps/demo-platform` projects —
copy and run; example styles only reference `--mx-*` tokens. Prerequisites: [Core Concepts](/en/guide/core-concepts).

Every step follows the same principle: **props-driven first, slots as fallback** — configurable items always go through props; slots exist only for customization that props cannot cover.

> **Style imports**: component layout styles ship as standalone css artifacts (extracted by Vite lib mode, not auto-injected). Import them once at the application entry before using components:
>
> ```ts
> import '@mengxi-ark/components/style.css'
> import '@mengxi-ark/biz-components/style.css' // required when using Lov / DocumentTable
> ```

## Step 1: Minimal Usage (Props-Driven + Static Data)

No backend, no requests: pass the minimal props to each of the two components and you get a complete query area and table. SearchForm manages its form values internally — just listen to the `search` / `reset` events for
values; EnhanceTable consumes a static array directly.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SearchForm, EnhanceTable } from '@mengxi-ark/components'
import type { SearchField, MxColumn } from '@mengxi-ark/components'

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
	}
]

const columns: MxColumn[] = [
	{ dataIndex: 'id', title: '编号' },
	{ dataIndex: 'name', title: '姓名' },
	{ dataIndex: 'status', title: '状态' }
]

const dataSource = ref([
	{ id: 1, name: '曦舟', status: '启用' },
	{ id: 2, name: '梦曦', status: '停用' }
])

function handleSearch(values: Record<string, unknown>): void {
	console.log(values) // unfilled items are undefined — filter them as needed
}
</script>

<template>
	<SearchForm :fields="fields" @search="handleSearch" />
	<EnhanceTable :columns="columns" :data-source="dataSource" />
</template>
```

**Effect**: one row of query fields plus search / reset buttons (an "expand / collapse" toggle appears automatically beyond 3 fields), with a table below featuring the unified empty state (EmptyState). Nothing binds to
any UI library API throughout — common prop semantics like `size` / `loading` stay consistent across the whole library.

## Step 2: Slot Customization (What Props Can't Cover)

Props come first, slots as fallback. The three most common slots:

- The `toolbar` (toolbar area above the table) and `bodyCell` (custom cell rendering, scoped `{ column, record, index }`) of `EnhanceTable`;
- The `extra` of `SearchForm` (an extra custom field area rendered before the buttons).

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
	{ id: 1, name: '曦舟', status: '1' },
	{ id: 2, name: '梦曦', status: '0' }
]
</script>

<template>
	<EnhanceTable :columns="columns" :data-source="dataSource">
		<template #toolbar>
			<button class="demo-btn" type="button">新增</button>
			<span class="demo-hint">工具栏与查询区配合使用</span>
		</template>
		<template #bodyCell="{ column, record }">
			<span v-if="column.dataIndex === 'status'" class="demo-tag" :class="record.status === '1' ? 'is-on' : 'is-off'">
				{{ record.status === '1' ? '启用' : '停用' }}
			</span>
			<template v-else>{{ record[column.dataIndex] }}</template>
		</template>
	</EnhanceTable>
</template>

<style scoped>
.demo-btn {
	padding: 0 var(--mx-spacing-md);
	border: 1px solid var(--mx-color-border-base);
	border-radius: var(--mx-radius-base);
	color: var(--mx-color-text-primary);
	background: var(--mx-color-bg-container);
}

.demo-hint {
	margin-left: var(--mx-spacing-sm);
	color: var(--mx-color-text-secondary);
}

.demo-tag {
	display: inline-block;
	padding: 0 var(--mx-spacing-sm);
	border-radius: var(--mx-radius-round);
}

.demo-tag.is-on {
	color: var(--mx-color-success);
	background: var(--mx-color-bg-hover);
}

.demo-tag.is-off {
	color: var(--mx-color-text-secondary);
	background: var(--mx-color-bg-layout);
}
</style>
```

**Effect**: the toolbar appears above the table; the status column renders as a colored tag while other columns keep the default text rendering. Columns not handled by `bodyCell` **must** render default content (the text
taken from `record` by `column.dataIndex`), otherwise the column goes blank.

## Step 3: Lov Standalone Mode (api + params Self-Fetching)

Lov is a dual-mode business component. Standalone mode depends on no base: pass `lovApi` (popup table selection) or `lovOptions` (static inline dropdown) and the component fetches data itself.

- API contract: input `{ keyword, currentPage, pageSize, ...params }`; returns `LovRow[]` (unpaginated) or `{ list, total }` (paginated);
- When `params` changes, requests re-fire automatically with a 300ms debounce;
- Row `label` / `value` are mapped via `fieldNames` — no fixed backend fields.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Lov } from '@mengxi-ark/biz-components'
import type { MxColumn } from '@mengxi-ark/components'

const userId = ref<string | null>(null)
const selectedLabels = ref<string[]>([])

const USERS = [
	{ code: 'U01', name: '张三', status: '1' },
	{ code: 'U02', name: '李四', status: '0' },
	{ code: 'U03', name: '王五', status: '1' }
]

// returning { list, total } means a paginated popup; returning an array means unpaginated
const userLovApi = async (params: Record<string, unknown>) => {
	const keyword = String(params.keyword ?? '').trim()
	const matched = keyword ? USERS.filter(row => row.name.includes(keyword)) : USERS
	const current = Number(params.currentPage) || 1
	const size = Number(params.pageSize) || 10
	return { list: matched.slice((current - 1) * size, current * size), total: matched.length }
}

// cascade: province → city. The child binds both params (data refresh) and cascadeSource (clear / disable)
const province = ref<string | null>(null)
const city = ref<string | null>(null)

const REGIONS = [
	{ code: 'ZJ', name: '浙江省', parentId: null },
	{ code: 'HZ', name: '杭州市', parentId: 'ZJ' },
	{ code: 'NB', name: '宁波市', parentId: 'ZJ' }
]

const regionApi = async (params: Record<string, unknown>) => {
	return params.parentId === undefined ? REGIONS.filter(row => row.parentId === null) : REGIONS.filter(row => row.parentId === params.parentId)
}

// custom popup columns
const popupColumns: MxColumn[] = [
	{ dataIndex: 'name', title: '用户名称' },
	{ dataIndex: 'status', title: '状态' }
]

function handleChange(_value: unknown, options: Array<{ label: string }>): void {
	selectedLabels.value = options.map(option => option.label)
}
</script>

<template>
	<!-- API mode: popup table + debounced search + pagination; columns overrides the default popup columns, bodyCell customizes cells -->
	<Lov v-model="userId" :lov-api="userLovApi" :field-names="{ label: 'name', value: 'code' }" :columns="popupColumns" placeholder="请选择用户" @change="handleChange">
		<template #bodyCell="{ column, record }">
			<template v-if="column.dataIndex === 'status'">
				<span class="demo-tag" :class="record.status === '1' ? 'is-on' : 'is-off'">
					{{ record.status === '1' ? '在职' : '离职' }}
				</span>
			</template>
			<template v-else>{{ record[column.dataIndex] }}</template>
		</template>
	</Lov>
	<p>选中：{{ selectedLabels.join('、') || '无' }}</p>

	<!-- cascade: any parent change clears the child; an empty parent disables the child trigger -->
	<Lov v-model="province" :lov-api="regionApi" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择省份" />
	<Lov v-model="city" :lov-api="regionApi" :params="{ parentId: province }" :cascade-source="province" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择城市" />
</template>

<style scoped>
.demo-tag {
	display: inline-block;
	padding: 0 var(--mx-spacing-sm);
	border-radius: var(--mx-radius-round);
}

.demo-tag.is-on {
	color: var(--mx-color-success);
	background: var(--mx-color-bg-hover);
}

.demo-tag.is-off {
	color: var(--mx-color-text-secondary);
	background: var(--mx-color-bg-layout);
}
</style>
```

**Effect**: in API mode, clicking the input opens a popup table selector (keyword input queries with a 300ms debounce; the popup shows the "用户名称 / 状态" columns); in the cascade scenario, pick a province first and
the city popup only queries that province's data — switching provinces clears the city automatically, and clearing the province disables the city trigger. The `change` event emits normalized options (a single-item array
for single select), so the business never needs to look rows up again.

## Step 4: DocumentTable Row Editing (save Emits the Full Data Set)

DocumentTable layers row-editing state and field validation on top of EnhanceTable capabilities. The key contract: **the save event emits the full document data; the component carries no submit request** (submission is
handled by the business in `@save`).

Three layers of cell editability control (all functional / declarative, configured per column):

1. **Column-level `permissionCode`** ("some" semantics — hitting any one code suffices): unauthorized cells render read-only text; the column is not hidden;
2. **Column-level functional `editable`**: `boolean | (row) => boolean` judges row-level granularity from row data;
3. **Validation linkage**: unauthorized / non-editable cells automatically skip required validation, preventing the "required column without permission → can never save" deadlock.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DocumentTable } from '@mengxi-ark/biz-components'
import type { DocColumn } from '@mengxi-ark/biz-components'

const columns: DocColumn[] = [
	{ dataIndex: 'name', title: '物料名称', editable: true, rules: [{ required: true, message: '物料名称不能为空' }] },
	// the count column requires the doc:edit:count permission to be editable ("some" semantics)
	{ dataIndex: 'count', title: '数量', editable: true, permissionCode: 'doc:edit:count', rules: [{ required: true }] },
	{
		dataIndex: 'unit',
		title: '单位',
		editable: true,
		editorType: 'select',
		editorOptions: [
			{ label: '件', value: 'PCS' },
			{ label: '箱', value: 'BOX' }
		],
		rules: [{ required: true, message: '单位不能为空' }]
	},
	// row-level granularity: only "unlocked" rows can edit the remark
	{ dataIndex: 'remark', title: '备注', editable: row => !row.locked }
]

// standalone mode: the permissions prop acts as fallback; in base-linked mode a context permissions hit wins and this prop is unnecessary
const permissions = ref(['doc:edit:count'])

const rows = ref<Array<Record<string, unknown>>>([
	{ id: 'd1', name: '机架服务器', count: 2, unit: 'BOX', remark: '', locked: false },
	{ id: 'd2', name: '网线', count: 10, unit: 'PCS', remark: '', locked: true }
])

function handleSave(allRows: Array<Record<string, unknown>>): void {
	// the full document data goes to the business for submission (the component carries no request)
	void submitDoc(allRows)
}

async function submitDoc(allRows: Array<Record<string, unknown>>): Promise<void> {
	console.log('提交单据：', allRows)
}
</script>

<template>
	<DocumentTable v-model="rows" :columns="columns" :permissions="permissions" row-key="id" @save="handleSave" />
</template>
```

**Effect**: double-click a row or click "编辑" to enter edit mode — name becomes an input and unit a dropdown; without the `doc:edit:count` permission the count column renders read-only text and skips its required
validation on save; the remark column of locked rows (`locked: true`) is not editable. Failed validation blocks save (console.warn once) and marks error messages red inline; `save` is emitted only after everything
passes. The toolbar ships "add row / remove row / save" buttons by default (`addable` / `deletable` / `savable` can turn them off).

## Step 5: Base Linking (inject Takes Over Automatically)

The first four steps are all standalone mode. Once the project installs the `@mengxi-ark/runtime` base (see [Mid-Platform](/en/platform/) for details), components probe the `MX_RUNTIME_CONTEXT_KEY` context via `inject`
and take over the data source automatically — **without changing a line of business code**. After installation the base's contextService delivers the context via `provide`; the mock provide below demonstrates the same
contract:

```vue
<script setup lang="ts">
import { provide, ref } from 'vue'
import { Lov, MX_RUNTIME_CONTEXT_KEY } from '@mengxi-ark/biz-components'
import type { MxRuntimeContext } from '@mengxi-ark/biz-components'

// real-base scenario: runtime.install() provides internally; an equivalent context is mocked here
const context: MxRuntimeContext = {
	user: { id: 1, name: '曦舟' },
	permissions: ['doc:edit:count'],
	lovCache: {
		STATUS: [
			{ label: '启用', value: '1' },
			{ label: '停用', value: '0' }
		]
	},
	lovListApi: async () => [
		{ key: '1', label: '启用' },
		{ key: '0', label: '停用' }
	]
}

provide(MX_RUNTIME_CONTEXT_KEY, context)

const gender = ref<string | null>(null)
const status = ref<string | null>(null)
</script>

<template>
	<!-- lovCode hits the context lovCache['STATUS']: static inline dropdown, no popup -->
	<Lov v-model="gender" lov-code="STATUS" />
</template>
```

**Differences from standalone mode**:

| Dimension         | Standalone Mode                            | Base-Linked Mode                                                                           |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Data source       | `lovApi` / `lovOptions` / `lovCache` props | Context `lovListApi` / `lovCache` (same-named props as fallback)                           |
| Permission source | `permissions` props (DocumentTable)        | A context `permissions` hit wins                                                           |
| Trigger           | Takes effect as soon as props are passed   | An `inject` probe hits `MX_RUNTIME_CONTEXT_KEY`                                            |
| Context loss      | —                                          | Automatically falls back to same-named props → standalone empty state, no fatal exceptions |

For verification under a real base, see the "fallback switching demo" page in `apps/demo-platform`; the mapping between context fields and props is detailed in [Global Context & Dual-Mode Fallback](/en/platform/context).

## Related References

- [SearchForm API](/en/api/searchform) · [EnhanceTable API](/en/api/enhancetable) (Steps 1 / 2)
- [Lov API](/en/api/lov) (Steps 3 / 5) · [DocumentTable API](/en/api/documenttable) (Step 4)
- Pairing with hooks: [useTable](/en/api/hooks) upgrades Step 1's static data into a real paginated query — see [SearchForm Example 2](/en/api/searchform).
