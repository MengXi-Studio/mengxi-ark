<script setup lang="ts">
/**
 * DSL 渲染演示（@mengxi-ark/dsl-render 加速方案）：
 * QueryRenderer / FormRenderer / TableRenderer 三渲染器 + 映射表覆盖。
 * 手写 SFC 仍是一等公民，本页仅演示 Schema 驱动的加速写法。
 */
import { computed, defineComponent, h, ref } from 'vue';
import { StatusTag } from '@mengxi-ark/components';
import type { StatusTagMapping } from '@mengxi-ark/components';
import { FormRenderer, QueryRenderer, TableRenderer, validateSchema } from '@mengxi-ark/dsl-render';
import type { QuerySchema, FormSchema, TableSchema } from '@mengxi-ark/dsl-render';
import { useTable } from '@mengxi-ark/hooks';
import { createMockLovApi, createMockUserTableSource } from './mock-api';

const mockLovApi = createMockLovApi('dsl-demo');
const tableSource = createMockUserTableSource();

const STATUS_MAPPING: StatusTagMapping = {
  '1': { label: '启用', tone: 'success' },
  '0': { label: '停用', tone: 'danger' },
};

// —— Schema 结构校验（开发期建议接入处先校验） ——
const schemaCheckResult = computed(() => {
  const result = validateSchema({ kind: 'form', fields: [{ type: 'input', field: 'name' }] });
  return result.valid ? '校验通过' : result.errors.join('；');
});

// —— 一、QueryRenderer：查询区（visible 函数式联动） ——
const QUERY_SCHEMA: QuerySchema = {
  kind: 'query',
  fields: [
    { type: 'input', field: 'keyword', label: '关键字', placeholder: '姓名 / 编码' },
    {
      type: 'select',
      field: 'dateType',
      label: '时间类型',
      options: [
        { label: '不限', value: '' },
        { label: '近一周', value: 'week' },
        { label: '自定义', value: 'custom' },
      ],
    },
    { type: 'dateRange', field: 'createdAt', label: '日期范围', visible: (v) => v.dateType === 'custom' },
  ],
};

const queryResult = ref('');
const table = useTable(tableSource);

function handleQuerySearch(values: Record<string, unknown>): void {
  queryResult.value = JSON.stringify(values);
  void table.search(values as { keyword?: string });
}

// —— 二、FormRenderer：表单（校验 + Lov 独立模式字段 + visible 联动） ——
const FORM_SCHEMA: FormSchema = {
  kind: 'form',
  title: '用户编辑（Schema 驱动）',
  fields: [
    { type: 'input', field: 'name', label: '姓名', rules: [{ required: true }] },
    {
      type: 'select',
      field: 'status',
      label: '状态',
      options: [
        { label: '启用', value: '1' },
        { label: '停用', value: '0' },
      ],
      defaultValue: '1',
    },
    {
      type: 'lov',
      field: 'owner',
      label: '负责人',
      props: { lovApi: mockLovApi, fieldNames: { label: 'name', value: 'code' } },
      visible: (v) => v.status === '1',
    },
  ],
};

const formValues = ref<Record<string, unknown>>({});
const formSubmitted = ref('');

function handleFormSubmit(values: Record<string, unknown>): void {
  formSubmitted.value = JSON.stringify(values);
}

// —— 三、TableRenderer：只读表格（mode=table，useTable 联动） ——
const TABLE_SCHEMA: TableSchema = {
  kind: 'table',
  columns: [
    { dataIndex: 'name', title: '姓名' },
    { dataIndex: 'code', title: '编码' },
    { dataIndex: 'status', title: '状态' },
  ],
};

// —— 四、TableRenderer：document 单据模式（可编辑 + save 抛全量） ——
const DOC_SCHEMA: TableSchema = {
  kind: 'table',
  mode: 'document',
  columns: [
    { dataIndex: 'product', title: '品名', editable: true, rules: [{ required: true }] },
    { dataIndex: 'remark', title: '备注', editable: true },
  ],
};

const docRows = ref<Array<Record<string, unknown>>>([
  { id: 1, product: '曦舟中台 license', remark: '年度订阅' },
  { id: 2, product: '技术支持', remark: '' },
]);
const docSaved = ref('');

function handleDocSave(rows: Array<Record<string, unknown>>): void {
  docSaved.value = JSON.stringify(rows);
}

// —— 五、映射表覆盖：enhanceTable key 整体替换默认表格组件 ——
const OVERRIDE_SCHEMA: TableSchema = {
  kind: 'table',
  columns: [
    { dataIndex: 'name', title: '姓名' },
    { dataIndex: 'status', title: '状态' },
  ],
};

const overrideRows: Array<Record<string, unknown>> = [
  { id: 1, name: '用户一', status: '1' },
  { id: 2, name: '用户二', status: '0' },
];

const OverrideStubTable = defineComponent({
  name: 'OverrideStubTable',
  props: { columns: { type: Array, default: () => [] }, dataSource: { type: Array, default: () => [] } },
  setup(props) {
    return () =>
      h('div', { class: 'dsl-override-table' }, [
        h('div', { class: 'hint' }, `自定义表格组件：${props.columns.length} 列 / ${props.dataSource.length} 行`),
        ...props.dataSource.map((row: Record<string, unknown>, index: number) =>
          h('div', { class: 'dsl-override-table__row', key: index }, `${row.name}（status=${row.status}）`),
        ),
      ]);
  },
});
</script>

<template>
  <div class="stack">
    <section class="panel">
      <h3 class="panel-title">
        validateSchema 结构校验（开发期接入处调用）
      </h3>
      <div class="output">
        validateSchema({ kind: 'form', ... }) → {{ schemaCheckResult }}
      </div>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        QueryRenderer 查询区（visible 函数式联动：时间类型=自定义 时出现日期范围）
      </h3>
      <QueryRenderer
        :schema="QUERY_SCHEMA"
        :loading="table.loading.value"
        @search="handleQuerySearch"
        @reset="() => table.reset()"
      />
      <div class="output">
        最近一次查询：{{ queryResult || '（未触发）' }}
      </div>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        FormRenderer 表单（required 校验 + Lov 独立模式 + visible 联动）
      </h3>
      <FormRenderer
        v-model="formValues"
        :schema="FORM_SCHEMA"
        @submit="handleFormSubmit"
      />
      <div class="output">
        v-model 值：{{ JSON.stringify(formValues) }} / 提交结果：{{ formSubmitted || '（未提交）' }}
      </div>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        TableRenderer 只读表格（mode=table，hooks useTable 联动）
      </h3>
      <TableRenderer
        :schema="TABLE_SCHEMA"
        :data-source="table.dataSource.value"
        :loading="table.loading.value"
        :pagination="table.pagination"
        @page-change="(current, size) => table.pagination.onChange(current, size)"
      >
        <template #toolbar>
          <span class="hint">渲染器组合 EnhanceTable，数据外部驱动</span>
        </template>
        <template #bodyCell="{ column, record }">
          <StatusTag
            v-if="column.dataIndex === 'status'"
            :value="record.status"
            :mapping="STATUS_MAPPING"
          />
        </template>
      </TableRenderer>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        TableRenderer 单据模式（mode=document，保存抛全量）
      </h3>
      <TableRenderer
        v-model="docRows"
        :schema="DOC_SCHEMA"
        @save="handleDocSave"
      />
      <div class="output">
        保存结果：{{ docSaved || '（未保存）' }}
      </div>
    </section>

    <section class="panel">
      <h3 class="panel-title">
        映射表覆盖（enhanceTable key 替换默认表格组件）
      </h3>
      <TableRenderer
        :schema="OVERRIDE_SCHEMA"
        :data-source="overrideRows"
        :component-map="{ enhanceTable: { component: OverrideStubTable } }"
      />
      <div class="hint">
        默认 EnhanceTable 被业务组件替换（demo 内 stub 组件），映射表同 key 整体替换。
      </div>
    </section>
  </div>
</template>

<style scoped>
.dsl-override-table {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-xs);
  padding: var(--mx-spacing-sm);
  border: 1px dashed var(--mx-color-border-base);
  border-radius: var(--mx-radius-base);
}

.dsl-override-table__row {
  color: var(--mx-color-text-primary);
  font-size: var(--mx-font-size-sm);
}
</style>
