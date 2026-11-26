# DocumentTable 单据表格

`@mengxi-ark/biz-components` 单据主表表格：基于 EnhanceTable 能力 + 行编辑状态 + 字段校验。**save 事件抛全量单据数据，组件不自带提交请求**（提交由业务在 `@save` 中自行处理）。

## 适用场景

**何时用**：单据 / 明细类页面的主表编辑（新增行、删除行、行内编辑、保存）；需要单元格级权限控制（permissionCode）与行级 editable 函数化；需要「无权限单元格跳过必填校验」防保存死锁；行展开内嵌子单据表。

**何时不用**：纯只读展示列表（交给 [EnhanceTable](/api/enhancetable)，编辑能力用不上）；整页表单类编辑（FormRenderer / 手写 SFC 更合适）；需要组件内部自动提交请求（DocumentTable 只抛 save 全量数据，提交由业务处理）。

行编辑能力：双击行或点「编辑」进入编辑态，`editable` 列渲染编辑器（input / select），校验未通过时阻断 save 并行内标错。

## 示例一：基础行编辑

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { DocumentTable } from '@mengxi-ark/biz-components';
import type { DocColumn } from '@mengxi-ark/biz-components';

const columns: DocColumn[] = [
  { dataIndex: 'name', title: '物料名称', editable: true },
  { dataIndex: 'qty', title: '数量', editable: true },
];

const rows = ref<Array<Record<string, unknown>>>([
  { id: 1, name: '服务器', qty: 2 },
  { id: 2, name: '显示器', qty: 10 },
]);

function handleSave(allRows: Array<Record<string, unknown>>): void {
  // 全量单据数据交给业务提交
  console.log(allRows);
}
</script>

<template>
  <DocumentTable v-model="rows" :columns="columns" row-key="id" @save="handleSave" />
</template>
```

## 示例二：字段校验 + select 编辑器

```vue
<script setup lang="ts">
import { DocumentTable } from '@mengxi-ark/biz-components';
import type { DocColumn } from '@mengxi-ark/biz-components';

const columns: DocColumn[] = [
  {
    dataIndex: 'name',
    title: '物料名称',
    editable: true,
    rules: [{ required: true, message: '物料名称不能为空' }],
  },
  {
    dataIndex: 'qty',
    title: '数量',
    editable: true,
    rules: [
      { required: true, message: '数量不能为空' },
      {
        validator: (value) => (Number(value) > 0 ? null : '数量必须大于 0'),
      },
    ],
  },
  {
    dataIndex: 'unit',
    title: '单位',
    editable: true,
    editorType: 'select',
    editorOptions: [
      { label: '台', value: 'TAI' },
      { label: '件', value: 'JIAN' },
    ],
    rules: [{ required: true, message: '单位不能为空' }],
  },
];

const rows = ref<Array<Record<string, unknown>>>([
  { id: 1, name: '服务器', qty: 2, unit: 'TAI' },
]);
</script>

<template>
  <DocumentTable v-model="rows" :columns="columns" @save="onSave" />
</template>
```

校验失败时 save 被阻断（console.warn 一次），错误文案行内标红；全部通过后才 emit `save`。

## 示例三：行展开子表（expandedRowKeys + expandedRow 槽）

行展开为通用作用域槽契约：受控 `expandedRowKeys`（v-model）+ `expandedRow({ record, index })` 槽，**不做一键子表模板**——展开内容（内嵌子 DocumentTable / EnhanceTable / 任意内容）由业务在槽内组合。`expandedRowKeys` 未传（undefined）时整体不启用展开。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { DocumentTable } from '@mengxi-ark/biz-components';
import type { DocColumn } from '@mengxi-ark/biz-components';

const columns: DocColumn[] = [
  { dataIndex: 'name', title: '物料名称', editable: true },
  { dataIndex: 'qty', title: '数量', editable: true },
];
const childColumns: DocColumn[] = [
  { dataIndex: 'name', title: '子物料' },
  { dataIndex: 'qty', title: '数量' },
];

const rows = ref<Array<Record<string, unknown>>>([
  {
    id: 1,
    name: '服务器',
    qty: 2,
    children: [
      { id: '1-1', name: '电源模块', qty: 2 },
      { id: '1-2', name: '导轨套件', qty: 4 },
    ],
  },
]);

// 受控展开：默认展开第一行（传 undefined 可关闭展开能力）
const expandedRowKeys = ref<Array<string | number>>([1]);
</script>

<template>
  <DocumentTable
    v-model="rows"
    v-model:expanded-row-keys="expandedRowKeys"
    :columns="columns"
    row-key="id"
  >
    <template #expandedRow="{ record }">
      <!-- 槽内自由组合：此处内嵌只读子单据表 -->
      <DocumentTable
        :model-value="(record.children ?? [])"
        :columns="childColumns"
        row-key="id"
        :editable="false"
      />
    </template>
  </DocumentTable>
</template>
```

两套 UI 库实现均已落地（antdv 原生 `expandedRowRender` 槽；Element Plus 由适配器内部插入 `type="expand"` 列），差异收敛在适配器层，业务用法完全一致。

## 示例四：单元格级粒度权限（permissionCode + editable 函数化）

三层组合控制单元格可编辑性：

1. **列级权限码 `permissionCode`**（some 语义：命中任一权限码即可编辑）——权限源为「上下文 `permissions` 探测 → `permissions` props 兜底」，无权限单元格**渲染只读文本**（不隐藏列），内容可用 bodyCell 槽定制；
2. **列级 `editable` 函数化**（`boolean | (row) => boolean`）——按行数据判定行级粒度（如「仅新建行可编辑」）；
3. **校验联动**：无权限 / 不可编辑的单元格自动跳过必填校验，防「必填列无权限 → 永远无法保存」死锁。

未配置 `permissionCode` 的列不受影响；配置了但上下文与 props 均未提供权限源时，`console.warn` 一次并视为有权限（独立模式不做权限拦截）。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { DocumentTable } from '@mengxi-ark/biz-components';
import type { DocColumn } from '@mengxi-ark/biz-components';

const columns: DocColumn[] = [
  { dataIndex: 'name', title: '物料名称', editable: true, rules: [{ required: true }] },
  // 数量列需 doc:edit:count 权限才可编辑
  { dataIndex: 'qty', title: '数量', editable: true, permissionCode: 'doc:edit:count', rules: [{ required: true }] },
  // 行级粒度：仅「未锁定」行可编辑备注
  { dataIndex: 'remark', title: '备注', editable: (row) => !row.locked },
];

// 独立模式：permissions props 兜底；基座联动模式下上下文 permissions 命中优先，无需此 prop
const permissions = ref(['doc:edit:count']);
const rows = ref<Array<Record<string, unknown>>>([
  { id: 1, name: '服务器', qty: 2, remark: '', locked: false },
  { id: 2, name: '网线', qty: 10, remark: '', locked: true },
]);
</script>

<template>
  <DocumentTable v-model="rows" :columns="columns" :permissions="permissions" row-key="id" />
</template>
```

## API

### DocumentTableProps

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | `Record<string, unknown>[]` | `[]` | 行数据（v-model） |
| columns | `DocColumn[]` | 必填 | 列配置（扩展 editable / editorType / rules） |
| rowKey | `string` | `'id'` | 行 key 字段名（新增行无该字段时自动生成临时 key） |
| editable | `boolean` | `true` | 是否启用行编辑能力 |
| addable | `boolean` | `true` | 是否展示「新增行」按钮 |
| deletable | `boolean` | `true` | 是否展示「删除行」按钮 |
| savable | `boolean` | `true` | 是否展示「保存」按钮（emit save，不自带提交请求） |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸语义 |
| addText | `string` | `'新增行'` | 新增行按钮文案 |
| saveText | `string` | `'保存'` | 保存按钮文案 |
| expandedRowKeys | `(string \| number)[] \| undefined` | — | 受控行展开 keys（v-model:expanded-row-keys；undefined 不启用展开） |
| permissions | `string[]` | — | 权限码列表（props 兜底，与上下文 permissions 同名对应；缺失时 warn 一次并视为有权限） |

### DocColumn（在统一列结构上扩展）

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| dataIndex / title | `string` | 同统一列契约（必填） |
| editable | `boolean \| (row) => boolean` | 该列是否可编辑，默认 false；函数形态按行数据判定行级粒度 |
| editorType | `'input' \| 'select'` | 编辑器类型，默认 'input' |
| permissionCode | `string \| string[]` | 列级权限码（some 语义命中任一即可编辑；无权限渲染只读文本，不隐藏列） |
| editorOptions | `MxSelectOption[]` | select 编辑器的选项 |
| rules | `DocCellRule[]` | 校验规则（`required` / `message` / `validator`，多条按顺序执行） |

### Events

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| update:modelValue | `(rows)` | 行数据变更（新增 / 删除 / 编辑值） |
| save | `(rows)` | 校验通过后抛全量单据数据 |
| rowAdd | `(row)` | 新增行（临时 key 形如 `__mx_row_<ts>_<seq>`） |
| rowRemove | `(row)` | 删除行 |
| update:expandedRowKeys | `(keys)` | 展开行变化（受控回抛） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| toolbar | 自定义工具栏（追加在默认按钮之后） |
| bodyCell | 单元格自定义渲染（非编辑态生效） |
| expandedRow | 行展开内容（作用域 `{ record, index }`；子表由业务在槽内组合） |

## 相关教程

- [组件实战](/guide/components-guide)：第 4 步演示行编辑完整流程（save 抛全量、字段校验、permissionCode / editable 函数化）。
