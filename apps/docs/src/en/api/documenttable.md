# DocumentTable Document Table

A document master-table component from `@mengxi-ark/biz-components`: built on EnhanceTable capabilities + row editing state + field validation. **The save event emits the full document data; the component carries no
submit request** (submission is handled by the business in `@save`).

## Use Cases

**When to use**: master-table editing of document / detail pages (add row, remove row, inline editing, save); cell-level permission control (permissionCode) with functional row-level editable; "unauthorized cells skip
required validation" to prevent save deadlocks; child document tables embedded in row expansion.

**When not to use**: purely read-only display lists (use [EnhanceTable](/en/api/enhancetable) — the editing capability would go unused); whole-page form editing (FormRenderer / handwritten SFC fits better); automatic
submit requests inside the component (DocumentTable only emits the full save data — submission is handled by the business).

Row editing: double-click a row or click "edit" to enter edit mode; `editable` columns render editors (input / select); failed validation blocks save and marks the error inline.

## Example 1: Basic Row Editing

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DocumentTable } from '@mengxi-ark/biz-components'
import type { DocColumn } from '@mengxi-ark/biz-components'

const columns: DocColumn[] = [
	{ dataIndex: 'name', title: '物料名称', editable: true },
	{ dataIndex: 'qty', title: '数量', editable: true }
]

const rows = ref<Array<Record<string, unknown>>>([
	{ id: 1, name: '服务器', qty: 2 },
	{ id: 2, name: '显示器', qty: 10 }
])

function handleSave(allRows: Array<Record<string, unknown>>): void {
	// the full document data is handed to the business for submission
	console.log(allRows)
}
</script>

<template>
	<DocumentTable v-model="rows" :columns="columns" row-key="id" @save="handleSave" />
</template>
```

## Example 2: Field Validation + select Editor

```vue
<script setup lang="ts">
import { DocumentTable } from '@mengxi-ark/biz-components'
import type { DocColumn } from '@mengxi-ark/biz-components'

const columns: DocColumn[] = [
	{
		dataIndex: 'name',
		title: '物料名称',
		editable: true,
		rules: [{ required: true, message: '物料名称不能为空' }]
	},
	{
		dataIndex: 'qty',
		title: '数量',
		editable: true,
		rules: [
			{ required: true, message: '数量不能为空' },
			{
				validator: value => (Number(value) > 0 ? null : '数量必须大于 0')
			}
		]
	},
	{
		dataIndex: 'unit',
		title: '单位',
		editable: true,
		editorType: 'select',
		editorOptions: [
			{ label: '台', value: 'TAI' },
			{ label: '件', value: 'JIAN' }
		],
		rules: [{ required: true, message: '单位不能为空' }]
	}
]

const rows = ref<Array<Record<string, unknown>>>([{ id: 1, name: '服务器', qty: 2, unit: 'TAI' }])
</script>

<template>
	<DocumentTable v-model="rows" :columns="columns" @save="onSave" />
</template>
```

When validation fails, save is blocked (console.warn once) and error messages are marked in red inline; `save` is emitted only after everything passes.

## Example 3: Row Expansion Child Table (expandedRowKeys + expandedRow Slot)

Row expansion is a general scoped-slot contract: controlled `expandedRowKeys` (v-model) + the `expandedRow({ record, index })` slot, **with no one-click child-table template** — the expansion content (an embedded child
DocumentTable / EnhanceTable / anything else) is composed by the business inside the slot. When `expandedRowKeys` is not passed (undefined), expansion is disabled entirely.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DocumentTable } from '@mengxi-ark/biz-components'
import type { DocColumn } from '@mengxi-ark/biz-components'

const columns: DocColumn[] = [
	{ dataIndex: 'name', title: '物料名称', editable: true },
	{ dataIndex: 'qty', title: '数量', editable: true }
]
const childColumns: DocColumn[] = [
	{ dataIndex: 'name', title: '子物料' },
	{ dataIndex: 'qty', title: '数量' }
]

const rows = ref<Array<Record<string, unknown>>>([
	{
		id: 1,
		name: '服务器',
		qty: 2,
		children: [
			{ id: '1-1', name: '电源模块', qty: 2 },
			{ id: '1-2', name: '导轨套件', qty: 4 }
		]
	}
])

// controlled expansion: the first row is expanded by default (pass undefined to turn expansion off)
const expandedRowKeys = ref<Array<string | number>>([1])
</script>

<template>
	<DocumentTable v-model="rows" v-model:expanded-row-keys="expandedRowKeys" :columns="columns" row-key="id">
		<template #expandedRow="{ record }">
			<!-- compose freely inside the slot: a read-only child document table is embedded here -->
			<DocumentTable :model-value="record.children ?? []" :columns="childColumns" row-key="id" :editable="false" />
		</template>
	</DocumentTable>
</template>
```

Both UI-library implementations are available (antdv's native `expandedRowRender` slot; Element Plus inserts a `type="expand"` column inside the adapter) — differences are converged in the adapter layer and business
usage is identical.

## Example 4: Cell-Level Permission Granularity (permissionCode + Functional editable)

Three layers combined control cell editability:

1. **Column-level permission code `permissionCode`** ("some" semantics: hitting any one code enables editing) — the permission source is "context `permissions` probing → `permissions` props fallback"; unauthorized cells
   **render read-only text** (the column is not hidden), and the content can be customized via the bodyCell slot;
2. **Column-level functional `editable`** (`boolean | (row) => boolean`) — row-level granularity judged from row data (e.g. "only newly added rows are editable");
3. **Validation linkage**: unauthorized / non-editable cells automatically skip required validation, preventing the "required column without permission → can never save" deadlock.

Columns without `permissionCode` are unaffected; when configured but neither the context nor props provide a permission source, it warns once via `console.warn` and treats permission as granted (standalone mode performs
no permission interception).

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DocumentTable } from '@mengxi-ark/biz-components'
import type { DocColumn } from '@mengxi-ark/biz-components'

const columns: DocColumn[] = [
	{ dataIndex: 'name', title: '物料名称', editable: true, rules: [{ required: true }] },
	// the qty column requires the doc:edit:count permission to be editable
	{ dataIndex: 'qty', title: '数量', editable: true, permissionCode: 'doc:edit:count', rules: [{ required: true }] },
	// row-level granularity: only "unlocked" rows can edit the remark
	{ dataIndex: 'remark', title: '备注', editable: row => !row.locked }
]

// standalone mode: the permissions prop acts as fallback; in base-linked mode a context permissions hit wins and this prop is unnecessary
const permissions = ref(['doc:edit:count'])
const rows = ref<Array<Record<string, unknown>>>([
	{ id: 1, name: '服务器', qty: 2, remark: '', locked: false },
	{ id: 2, name: '网线', qty: 10, remark: '', locked: true }
])
</script>

<template>
	<DocumentTable v-model="rows" :columns="columns" :permissions="permissions" row-key="id" />
</template>
```

## API

### DocumentTableProps

| Prop            | Type                                | Default    | Description                                                                                                                                |
| --------------- | ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| modelValue      | `Record<string, unknown>[]`         | `[]`       | Row data (v-model)                                                                                                                         |
| columns         | `DocColumn[]`                       | required   | Column configuration (extends editable / editorType / rules)                                                                               |
| rowKey          | `string`                            | `'id'`     | Row key field name (a temporary key is generated automatically for added rows lacking the field)                                           |
| editable        | `boolean`                           | `true`     | Whether row editing is enabled                                                                                                             |
| addable         | `boolean`                           | `true`     | Whether the "add row" button is shown                                                                                                      |
| deletable       | `boolean`                           | `true`     | Whether the "delete row" button is shown                                                                                                   |
| savable         | `boolean`                           | `true`     | Whether the "save" button is shown (emits save; carries no submit request)                                                                 |
| size            | `'sm' \| 'md' \| 'lg'`              | `'md'`     | Size semantics                                                                                                                             |
| addText         | `string`                            | `'新增行'` | Text of the add-row button                                                                                                                 |
| saveText        | `string`                            | `'保存'`   | Text of the save button                                                                                                                    |
| expandedRowKeys | `(string \| number)[] \| undefined` | —          | Controlled row-expansion keys (v-model:expanded-row-keys; undefined disables expansion)                                                    |
| permissions     | `string[]`                          | —          | Permission code list (props fallback, mapped by name to the context permissions; warns once and treats permission as granted when missing) |

### DocColumn (extended on the unified column structure)

| Prop              | Type                          | Description                                                                                                   |
| ----------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| dataIndex / title | `string`                      | Same as the unified column contract (required)                                                                |
| editable          | `boolean \| (row) => boolean` | Whether the column is editable, default false; the functional form judges row-level granularity from row data |
| editorType        | `'input' \| 'select'`         | Editor type, default 'input'                                                                                  |
| permissionCode    | `string \| string[]`          | —                                                                                                             | Column-level permission code ("some" semantics — hitting any code enables editing; unauthorized cells render read-only text) |
| editorOptions     | `MxSelectOption[]`            | Options for the select editor                                                                                 |
| rules             | `DocCellRule[]`               | Validation rules (`required` / `message` / `validator`, executed in order)                                    |

### Events

| Event                  | Payload  | Description                                                |
| ---------------------- | -------- | ---------------------------------------------------------- |
| update:modelValue      | `(rows)` | Row data changed (add / remove / edited values)            |
| save                   | `(rows)` | Emits the full document data after validation passes       |
| rowAdd                 | `(row)`  | Row added (temporary keys look like `__mx_row_<ts>_<seq>`) |
| rowRemove              | `(row)`  | Row removed                                                |
| update:expandedRowKeys | `(keys)` | Expanded rows changed (controlled callback)                |

### Slots

| Slot        | Description                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| toolbar     | Custom toolbar (appended after the default buttons)                                                             |
| bodyCell    | Custom cell rendering (effective outside edit mode)                                                             |
| expandedRow | Row expansion content (scoped `{ record, index }`; the child table is composed by the business inside the slot) |

## Related Tutorials

- [Component Walkthrough](/en/guide/components-guide): Step 4 demos the full row-editing flow (save emitting the full data set, field validation, functional permissionCode / editable).
