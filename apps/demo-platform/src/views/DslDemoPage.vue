<script setup lang="ts">
/**
 * DSL 渲染演示页（demo-platform 基座联动）：
 * - QueryRenderer / FormRenderer / TableRenderer Schema 驱动；
 * - Lov 字段探测基座上下文 lovCache / lovListApi（biz-components 契约自然继承）；
 * - document 模式列级 permissionCode 走基座 permissions 探测。
 */
import { ref } from 'vue';
import { FormRenderer, QueryRenderer, TableRenderer } from '@mengxi-ark/dsl-render';
import type { FormSchema, QuerySchema, TableSchema } from '@mengxi-ark/dsl-render';
import { createMockLovApi, ORDER_COUNT_OPTIONS } from '../mock-api';

// 基座联动：Lov 字段不传 lovApi / lovCache，由上下文探测（lovCache 值集 STATUS / lovListApi）
const QUERY_SCHEMA: QuerySchema = {
  kind: 'query',
  fields: [
    { type: 'input', field: 'keyword', label: '关键字' },
    { type: 'lov', field: 'statusUser', label: '状态筛选', props: { lovCode: 'STATUS' } },
    {
      type: 'select',
      field: 'countRange',
      label: '数量',
      options: ORDER_COUNT_OPTIONS,
    },
  ],
};

const queryResult = ref('');

// 基座联动：owner 字段 lovCode 命中上下文值集；接口字段 lovApi 显式传入（演示混用）
const FORM_SCHEMA: FormSchema = {
  kind: 'form',
  title: '单据编辑（Schema 驱动）',
  fields: [
    { type: 'input', field: 'title', label: '单据标题', rules: [{ required: true }] },
    { type: 'lov', field: 'status', label: '状态', props: { lovCode: 'STATUS' } },
    {
      type: 'lov',
      field: 'owner',
      label: '负责人',
      props: { lovApi: createMockLovApi(), fieldNames: { label: 'name', value: 'code' } },
      visible: (v) => v.status === '1',
    },
  ],
};

const formValues = ref<Record<string, unknown>>({});
const formSubmitted = ref('');

// document 模式：count 列 permissionCode=biz:order:edit（基座 permissions 含该码 → 可编辑）
const DOC_SCHEMA: TableSchema = {
  kind: 'table',
  mode: 'document',
  columns: [
    { dataIndex: 'product', title: '品名', editable: true, rules: [{ required: true }] },
    { dataIndex: 'count', title: '数量', editable: true, editorType: 'select', editorOptions: ORDER_COUNT_OPTIONS, permissionCode: 'biz:order:edit' },
    { dataIndex: 'remark', title: '备注', editable: true },
  ],
};

const docRows = ref<Array<Record<string, unknown>>>([
  { id: 1, product: '曦舟中台 license', count: 3, remark: '年度订阅' },
  { id: 2, product: '组件库技术支持', count: 1, remark: '按次计费' },
]);
const docSaved = ref('');
</script>

<template>
  <div class="dsl-page">
    <section class="dsl-card">
      <h3>QueryRenderer（Lov 字段探测基座值集 STATUS）</h3>
      <QueryRenderer
        :schema="QUERY_SCHEMA"
        @search="(v) => (queryResult = JSON.stringify(v))"
        @reset="() => (queryResult = '')"
      />
      <div class="dsl-output">
        最近查询：{{ queryResult || '（未触发）' }}
      </div>
    </section>

    <section class="dsl-card">
      <h3>FormRenderer（状态列lov值集联动负责人字段显隐；负责人走上下文 lovListApi）</h3>
      <FormRenderer
        v-model="formValues"
        :schema="FORM_SCHEMA"
        @submit="(v) => (formSubmitted = JSON.stringify(v))"
      />
      <div class="dsl-output">
        提交结果：{{ formSubmitted || '（未提交）' }}
      </div>
    </section>

    <section class="dsl-card">
      <h3>TableRenderer 单据模式（count 列 permissionCode=biz:order:edit，权限命中基座 permissions → 可编辑）</h3>
      <TableRenderer
        v-model="docRows"
        :schema="DOC_SCHEMA"
        @save="(rows) => (docSaved = JSON.stringify(rows))"
      />
      <div class="dsl-output">
        保存结果：{{ docSaved || '（未保存）' }}
      </div>
    </section>
  </div>
</template>

<style scoped>
.dsl-page {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-lg);
  padding: var(--mx-spacing-lg);
}

.dsl-card {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-md);
  padding: var(--mx-spacing-lg);
  background-color: var(--mx-color-bg-container);
  border: 1px solid var(--mx-color-border-split);
  border-radius: var(--mx-radius-lg);
}

.dsl-card h3 {
  margin: 0;
  font-size: var(--mx-font-size-md);
  color: var(--mx-color-text-primary);
}

.dsl-output {
  padding: var(--mx-spacing-sm) var(--mx-spacing-md);
  background-color: var(--mx-color-bg-layout);
  border-radius: var(--mx-radius-base);
  color: var(--mx-color-text-primary);
  font-size: var(--mx-font-size-xs);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
