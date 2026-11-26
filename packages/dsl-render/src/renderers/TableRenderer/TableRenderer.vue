<script setup lang="ts">
/**
 * TableRenderer —— 表格 Schema 渲染器。
 *
 * - mode = 'table'（默认）：只读增强表格（映射表 'enhanceTable'），数据外部驱动；
 * - mode = 'document'：可编辑单据表格（映射表 'documentTable'），v-model 行数据，
 *   save 事件抛全量单据数据（渲染器不自带提交请求），权限由 DocumentTable 自身探测 / props 兜底；
 * - 列配置经 Schema 强类型直传，业务可传 componentMap 覆盖表格组件。
 */
import { computed } from 'vue';
import type { MxPaginationState, MxRowSelection } from '@mengxi-ark/components';
import { useUiAdapter } from '@mengxi-ark/components';
import type { SchemaComponentMap } from '../../componentMap';
import { createComponentMap } from '../../componentMap';
import type { TableSchema } from '../../types/table';

const props = defineProps<{
  /** 表格 Schema（必填） */
  schema: TableSchema;
  /** table 模式：当页数据（外部驱动，配合 hooks useTable） */
  dataSource?: Array<Record<string, unknown>>;
  /** 加载中 */
  loading?: boolean;
  /** table 模式：分页状态（false 关闭），结构对齐 useTable 的 pagination */
  pagination?: MxPaginationState | false;
  /** table 模式：行选择受控状态（false 关闭） */
  rowSelection?: MxRowSelection | false;
  /** document 模式：行数据（v-model） */
  modelValue?: Array<Record<string, unknown>>;
  /** 受控行展开 keys（undefined 不启用展开） */
  expandedRowKeys?: Array<string | number> | undefined;
  /** 组件映射覆盖（同 key 整体替换默认条目） */
  componentMap?: SchemaComponentMap;
}>();

const emit = defineEmits<{
  /** table 模式：页码 / 每页条数变更 */
  (e: 'pageChange', current: number, size: number): void;
  /** table 模式：表头排序变更 */
  (e: 'sortChange', field: string, order: 'asc' | 'desc'): void;
  /** table 模式：行点击 */
  (e: 'rowClick', record: Record<string, unknown>, index: number): void;
  /** document 模式：行数据变化 */
  (e: 'update:modelValue', rows: Array<Record<string, unknown>>): void;
  /** document 模式：点击保存（校验通过后抛全量单据数据） */
  (e: 'save', rows: Array<Record<string, unknown>>): void;
  /** document 模式：新增行 */
  (e: 'rowAdd', row: Record<string, unknown>): void;
  /** document 模式：删除行 */
  (e: 'rowRemove', row: Record<string, unknown>): void;
  /** 展开行变化（expandedRowKeys 受控回抛） */
  (e: 'update:expandedRowKeys', keys: Array<string | number>): void;
}>();

const adapter = useUiAdapter();
const map = computed(() => createComponentMap(props.componentMap, adapter));

const isDocument = computed(() => (props.schema.mode ?? 'table') === 'document');
const tableEntry = computed(() => map.value[isDocument.value ? 'documentTable' : 'enhanceTable']);

const tableProps = computed(() =>
  isDocument.value
    ? {
        columns: props.schema.columns,
        rowKey: props.schema.rowKey ?? 'id',
        size: props.schema.size,
        modelValue: props.modelValue ?? [],
        expandedRowKeys: props.expandedRowKeys,
        addable: props.schema.addable ?? true,
        deletable: props.schema.deletable ?? true,
        savable: props.schema.savable ?? true,
        addText: props.schema.addText,
        saveText: props.schema.saveText,
        permissions: props.schema.permissions,
      }
    : {
        columns: props.schema.columns,
        dataSource: props.dataSource ?? [],
        rowKey: props.schema.rowKey ?? 'id',
        loading: props.loading,
        size: props.schema.size,
        pagination: props.pagination ?? false,
        rowSelection: props.rowSelection ?? false,
        expandedRowKeys: props.expandedRowKeys,
        emptyText: props.schema.emptyText,
      },
);

const documentHandlers = {
  'update:modelValue': (rows: Array<Record<string, unknown>>) => emit('update:modelValue', rows),
  save: (rows: Array<Record<string, unknown>>) => emit('save', rows),
  rowAdd: (row: Record<string, unknown>) => emit('rowAdd', row),
  rowRemove: (row: Record<string, unknown>) => emit('rowRemove', row),
  'update:expandedRowKeys': (keys: Array<string | number>) => emit('update:expandedRowKeys', keys),
};

const readonlyHandlers = {
  pageChange: (current: number, size: number) => emit('pageChange', current, size),
  sortChange: (field: string, order: 'asc' | 'desc') => emit('sortChange', field, order),
  rowClick: (record: Record<string, unknown>, index: number) => emit('rowClick', record, index),
  'update:expandedRowKeys': (keys: Array<string | number>) => emit('update:expandedRowKeys', keys),
};
</script>

<template>
  <div class="mx-dsl-table">
    <component
      :is="tableEntry.component"
      v-if="tableEntry"
      v-bind="{ ...tableEntry.defaultProps, ...tableProps }"
      v-on="isDocument ? documentHandlers : readonlyHandlers"
    >
      <!-- 通用槽透传：工具栏 / 单元格 / 行展开（宿主写了槽才转发） -->
      <template
        v-if="$slots.toolbar"
        #toolbar
      >
        <slot name="toolbar" />
      </template>
      <template
        v-if="$slots.bodyCell"
        #bodyCell="binding"
      >
        <slot
          name="bodyCell"
          v-bind="binding"
        />
      </template>
      <template
        v-if="$slots.expandedRow"
        #expandedRow="binding"
      >
        <slot
          name="expandedRow"
          v-bind="binding"
        />
      </template>
      <template
        v-if="$slots.empty && !isDocument"
        #empty
      >
        <slot name="empty" />
      </template>
    </component>
    <div
      v-else
      class="mx-dsl-table__missing"
    >
      组件映射表未登记「{{ isDocument ? 'documentTable' : 'enhanceTable' }}」，表格未渲染。
    </div>
  </div>
</template>

<style lang="scss" scoped src="../../style/index.scss"></style>
