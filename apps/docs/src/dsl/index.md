# DSL 配置渲染（加速方案）

> **手写 SFC 一等公民**：曦舟推荐手写 Vue SFC 完成页面；当页面结构高度重复（标准 CRUD 列表 / 配置表单）时，
> 可用 `@mengxi-ark/dsl-render` 以 JSON 形态描述界面、由渲染器组合框架组件加速产出。配置渲染只是加速方案，不是替代方案。

## 安装

```bash
pnpm add @mengxi-ark/dsl-render
```

`dsl-render` 为可选包（依赖链层级 4，可引用 components / biz-components）；
未安装不影响其余框架包使用。已内置支持双模式：在 runtime 基座下，Lov / DocumentTable
自动探测全局上下文（值集缓存 / 权限）；无基座时回退同名 props 独立模式。

## 三类 Schema

所有 Schema 均带 `kind` 判别字段，且提供 `validateSchema()` 结构校验（开发期建议在接入处先校验）：

```ts
import { validateSchema } from '@mengxi-ark/dsl-render';

const result = validateSchema(schema);
if (!result.valid) console.error(result.errors); // ['fields[2].type 必须为非空字符串', ...]
```

### QuerySchema —— 查询区

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
    // 函数式联动显隐（TS 增强能力；结构保持 JSON 形态）
    { type: 'dateRange', field: 'createdAt', visible: (v) => v.dateType === 'custom' },
  ],
};
```

### FormSchema —— 表单

```ts
import type { FormSchema } from '@mengxi-ark/dsl-render';

const formSchema: FormSchema = {
  kind: 'form',
  title: '用户编辑',
  fields: [
    { type: 'input', field: 'name', label: '姓名', rules: [{ required: true }] },
    { type: 'select', field: 'status', label: '状态', options: [{ label: '启用', value: '1' }], defaultValue: '1' },
    // Lov 字段：独立模式传 lovApi；基座联动模式传 lovCode（探测上下文值集）
    { type: 'lov', field: 'owner', label: '负责人', props: { lovApi, fieldNames: { label: 'name', value: 'code' } } },
  ],
};
```

### TableSchema —— 表格

```ts
import type { TableSchema } from '@mengxi-ark/dsl-render';

// 只读表格（组合 EnhanceTable，数据外部驱动，配合 hooks useTable）
const tableSchema: TableSchema = {
  kind: 'table',
  columns: [
    { dataIndex: 'name', title: '姓名' },
    { dataIndex: 'status', title: '状态' },
  ],
};

// 可编辑单据（组合 DocumentTable；save 抛全量数据，提交请求由业务处理）
const docSchema: TableSchema = {
  kind: 'table',
  mode: 'document',
  columns: [
    { dataIndex: 'product', title: '品名', editable: true, rules: [{ required: true }] },
    { dataIndex: 'count', title: '数量', editable: true, editorType: 'select', editorOptions, permissionCode: 'biz:order:edit' },
  ],
};
```

## 三个渲染器

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTable } from '@mengxi-ark/hooks';
import { FormRenderer, QueryRenderer, TableRenderer } from '@mengxi-ark/dsl-render';

const table = useTable(fetchUsers); // 业务注入数据源

function handleSearch(values: Record<string, unknown>) {
  void table.search(values);
}
function handleSubmit(values: Record<string, unknown>) {
  // 渲染器只渲染：submit / save 事件抛给上层，不自带请求
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

渲染器契约：

| 渲染器 | 关键 props | 关键 emits |
| --- | --- | --- |
| `QueryRenderer` | `schema` / `componentMap?` | `search(values)` / `reset()` |
| `FormRenderer` | `schema` / `modelValue` (v-model) / `componentMap?` | `update:modelValue` / `submit(values)` / `validateFailed(errors)` |
| `TableRenderer` | `schema` / `dataSource` / `pagination` / `modelValue`（document 模式） | `pageChange` / `sortChange` / `rowClick` / `save(rows)` / `rowAdd` / `rowRemove` |

`FormRenderer` 额外暴露 `validate()`（模板 ref 调用），适配嵌入 Dialog 自定义按钮的场景；
两个渲染器均透传 `toolbar / bodyCell / expandedRow` 插槽到底层表格组件。

## 组件映射表（业务可覆盖）

`schema.type` 经组件映射表解析，默认表覆盖 13 项（适配器原子 + 跨组件实体）：
`input / select / dateRange / treeSelect / upload / button / lov / searchForm / enhanceTable / documentTable / dialog / statusTag / emptyState`。
业务可整体替换同 key 条目（渲染器不硬编码组件清单）：

```vue
<script setup lang="ts">
import { defineComponent } from 'vue';
import { TableRenderer } from '@mengxi-ark/dsl-render';

// 自定义表格实现（整体替换默认 EnhanceTable）
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

## 双模式说明

- **独立模式（默认降级）**：Lov 字段传 `lovApi` / `lovOptions`，DocumentTable 权限走 props.permissions 兜底；
- **基座联动**：runtime 基座 install 后，Lov 传 `lovCode` 探测上下文值集缓存，
  DocumentTable 列级 `permissionCode` 命中上下文 permissions 即可编辑；
- 探测失败自动回退独立模式，无需业务显式切换（契约与 biz-components 一致）。

## 完整示例

可运行代码见 demo 工程：
轻量模式 `apps/demo-light/src/demos/DslDemo.vue`；中台模式 `apps/demo-platform/src/views/DslDemoPage.vue`。
