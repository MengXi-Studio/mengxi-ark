# DSL Config Rendering (Accelerator)

> **Prerequisites**: this section assumes you have mastered [Core Concepts](/en/guide/core-concepts) and the [Component Walkthrough](/en/guide/components-guide) — the three Schema types respectively compose the contracts of the query area / table / form.
>
> **Handwritten SFC is first-class**: MengXi Ark recommends handwritten Vue SFCs for pages; when page structures are highly repetitive (standard CRUD lists / config forms), you can use `@mengxi-ark/dsl-render` to describe the UI as JSON and let the renderers compose framework components to speed up delivery. Config rendering is an accelerator, not a replacement.

## Installation

```bash
pnpm add @mengxi-ark/dsl-render
```

`dsl-render` is an optional package (dependency layer 4; it may reference components / biz-components);
not installing it does not affect the other framework packages. Dual-mode support is built in: under the runtime base, Lov / DocumentTable
automatically probe the global context (value-set cache / permissions); without a base they fall back to standalone mode via same-named props.

## Three Schema Types

All Schemas carry a `kind` discriminator and come with `validateSchema()` structural validation (validate at the integration point during development):

```ts
import { validateSchema } from '@mengxi-ark/dsl-render';

const result = validateSchema(schema);
if (!result.valid) console.error(result.errors); // ['fields[2].type must be a non-empty string', ...]
```

### QuerySchema — Query Area

```ts
import type { QuerySchema } from '@mengxi-ark/dsl-render';

const querySchema: QuerySchema = {
  kind: 'query',
  fields: [
    { type: 'input', field: 'keyword', label: '关键字', placeholder: '姓名 / 编码' },
    {
      type: 'select',
      field: 'dateType',
      label: '时间类型',
      options: [
        { label: '不限', value: '' },
        { label: '自定义', value: 'custom' },
      ],
    },
    // functional show/hide linkage (TS enhancement; the structure stays JSON-shaped)
    { type: 'dateRange', field: 'createdAt', visible: (v) => v.dateType === 'custom' },
  ],
};
```

### FormSchema — Form

```ts
import type { FormSchema } from '@mengxi-ark/dsl-render';

const formSchema: FormSchema = {
  kind: 'form',
  title: '用户编辑',
  fields: [
    { type: 'input', field: 'name', label: '姓名', rules: [{ required: true }] },
    { type: 'select', field: 'status', label: '状态', options: [{ label: '启用', value: '1' }], defaultValue: '1' },
    // Lov field: pass lovApi for standalone mode; pass lovCode for base-linked mode (probes the context value set)
    { type: 'lov', field: 'owner', label: '负责人', props: { lovApi, fieldNames: { label: 'name', value: 'code' } } },
  ],
};
```

### TableSchema — Table

```ts
import type { TableSchema } from '@mengxi-ark/dsl-render';

// read-only table (composes EnhanceTable; data is externally driven, paired with the useTable hook)
const tableSchema: TableSchema = {
  kind: 'table',
  columns: [
    { dataIndex: 'name', title: '姓名' },
    { dataIndex: 'status', title: '状态' },
  ],
};

// editable document (composes DocumentTable; save emits the full data set — the submit request is handled by the business)
const docSchema: TableSchema = {
  kind: 'table',
  mode: 'document',
  columns: [
    { dataIndex: 'product', title: '品名', editable: true, rules: [{ required: true }] },
    { dataIndex: 'count', title: '数量', editable: true, editorType: 'select', editorOptions, permissionCode: 'biz:order:edit' },
  ],
};
```

## Three Renderers

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTable } from '@mengxi-ark/hooks';
import { FormRenderer, QueryRenderer, TableRenderer } from '@mengxi-ark/dsl-render';

const table = useTable(fetchUsers); // the business injects the data source

function handleSearch(values: Record<string, unknown>) {
  void table.search(values);
}
function handleSubmit(values: Record<string, unknown>) {
  // renderers only render: submit / save events are thrown to the caller — no built-in requests
  void saveUser(values);
}
</script>

<template>
  <QueryRenderer :schema="querySchema" :loading="table.loading.value" @search="handleSearch" @reset="() => table.reset()" />
  <TableRenderer
    :schema="tableSchema"
    :data-source="table.dataSource.value"
    :loading="table.loading.value"
    :pagination="table.pagination"
    @page-change="(c, s) => table.pagination.onChange(c, s)"
  />
  <FormRenderer v-model="formValues" :schema="formSchema" @submit="handleSubmit" />
  <TableRenderer v-model="docRows" :schema="docSchema" @save="(rows) => saveDoc(rows)" />
</template>
```

Renderer contract:

| Renderer | Key Props | Key Emits |
| --- | --- | --- |
| `QueryRenderer` | `schema` / `componentMap?` | `search(values)` / `reset()` |
| `FormRenderer` | `schema` / `modelValue` (v-model) / `componentMap?` | `update:modelValue` / `submit(values)` / `validateFailed(errors)` |
| `TableRenderer` | `schema` / `dataSource` / `pagination` / `modelValue` (document mode) | `pageChange` / `sortChange` / `rowClick` / `save(rows)` / `rowAdd` / `rowRemove` |

`FormRenderer` additionally exposes `validate()` (called via the template ref), fitting the scenario of embedding it in a Dialog with custom buttons;
both renderers pass through the `toolbar / bodyCell / expandedRow` slots to the underlying table component.

## Component Mapping (Business-Overridable)

`schema.type` is resolved through the component mapping registry; the default table covers 13 entries (adapter primitives + cross-component entities):
`input / select / dateRange / treeSelect / upload / button / lov / searchForm / enhanceTable / documentTable / dialog / statusTag / emptyState`.
Businesses can replace same-key entries wholesale (the renderer never hardcodes a component list):

```vue
<script setup lang="ts">
import { defineComponent } from 'vue';
import { TableRenderer } from '@mengxi-ark/dsl-render';

// custom table implementation (replaces the default EnhanceTable wholesale)
const myTable = defineComponent({
  props: { columns: Array, dataSource: Array },
  template: '<div class="my-table" />',
});
</script>

<template>
  <TableRenderer
    :schema="tableSchema"
    :data-source="rows"
    :component-map="{ enhanceTable: { component: myTable } }"
  />
</template>
```

## Dual-Mode Notes

- **Standalone mode (default fallback)**: Lov fields take `lovApi` / `lovOptions`; DocumentTable permissions fall back to props.permissions;
- **Base-linked**: after the runtime base installs, Lov takes `lovCode` to probe the context value-set cache,
  and DocumentTable column-level `permissionCode` hits context permissions to enable editing;
- Failed probing automatically falls back to standalone mode — the business never switches explicitly (the contract matches biz-components).

## Full Example

Runnable code lives in the demo projects:
lightweight mode `apps/demo-light/src/demos/DslDemo.vue`; mid-platform mode `apps/demo-platform/src/views/DslDemoPage.vue`.

**Next**: after evaluating where DSL acceleration pays off, read the [Migration Guide](/en/guide/migration) to plan the overall rollout path for existing projects.
