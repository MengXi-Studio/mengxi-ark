<template>
  <div class="mx-doc-table">
    <div class="mx-doc-table__toolbar">
      <component
        :is="adapter.Button"
        v-if="editable && addable"
        type="dashed"
        :size="size"
        @click="addRow()"
      >
        {{ addText }}
      </component>
      <component
        :is="adapter.Button"
        v-if="editable && savable"
        type="primary"
        :size="size"
        @click="handleSave"
      >
        {{ saveText }}
      </component>
      <slot name="toolbar" />
    </div>

    <component
      :is="adapter.DataTable"
      :columns="tableColumns"
      :data-source="rows"
      :row-key="rowKey"
      :size="size"
      :expanded-row-keys="expandedRowKeys"
      @row-dblclick="handleRowDblclick"
      @update:expanded-row-keys="(...args: [Array<string | number>]) => emit('update:expandedRowKeys', ...args)"
    >
      <template #bodyCell="binding">
        <!-- 操作列：编辑 / 完成切换 + 删除 -->
        <template v-if="isActionColumn(binding.column.dataIndex)">
          <component
            :is="adapter.Button"
            type="link"
            :size="size"
            @click="toggleEdit(binding.record)"
          >
            {{ isEditing(binding.record) ? '完成' : '编辑' }}
          </component>
          <component
            :is="adapter.Button"
            type="link"
            danger
            :size="size"
            @click="removeRow(binding.record)"
          >
            删除
          </component>
        </template>
        <!-- 编辑态：行内编辑器（input / select）；单元格级权限判定通过才渲染编辑器 -->
        <template v-else-if="isEditing(binding.record) && isCellEditable(binding.record, binding.column.dataIndex)">
          <div class="mx-doc-table__editor" :class="{ 'mx-doc-table__editor--error': cellError(binding.record, binding.column.dataIndex) }">
            <component
              :is="adapter.Select"
              v-if="editorTypeOf(binding.column.dataIndex) === 'select'"
              :model-value="(binding.record[binding.column.dataIndex] as string | number | null)"
              :options="editorOptionsOf(binding.column.dataIndex)"
              :size="size"
              :placeholder="''"
              allow-clear
              @update:model-value="(v: unknown) => setCellValue(binding.record, binding.column.dataIndex, v)"
            />
            <component
              :is="adapter.Input"
              v-else
              :model-value="(binding.record[binding.column.dataIndex] as string | null)"
              :size="size"
              @update:model-value="(v: unknown) => setCellValue(binding.record, binding.column.dataIndex, v)"
            />
            <span v-if="cellError(binding.record, binding.column.dataIndex)" class="mx-doc-table__error">
              {{ cellError(binding.record, binding.column.dataIndex) }}
            </span>
          </div>
        </template>
        <!-- 非编辑态：bodyCell 插槽兜底，其次原始值 -->
        <template v-else>
          <slot name="bodyCell" v-bind="binding">
            {{ binding.record[binding.column.dataIndex] ?? '' }}
          </slot>
        </template>
      </template>
      <template v-if="$slots.expandedRow" #expandedRow="binding">
        <slot name="expandedRow" v-bind="binding" />
      </template>
      <template #empty>
        <EmptyState description="暂无数据，点击「新增行」开始填写单据" />
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { EmptyState, useUiAdapter } from '@mengxi-ark/components';
import type { MxColumn } from '@mengxi-ark/components';
import { useRuntimeContext } from '../context/resolve';
import { createTempRowKey, validateRows } from './adapter';
import type { DocColumn, DocEditorType, DocumentTableEmits, DocumentTableProps } from './types';

const props = withDefaults(defineProps<DocumentTableProps>(), {
  modelValue: () => [],
  rowKey: 'id',
  editable: true,
  addable: true,
  deletable: true,
  savable: true,
  size: 'md',
  addText: '新增行',
  saveText: '保存',
  expandedRowKeys: undefined,
  permissions: undefined,
});

const emit = defineEmits<DocumentTableEmits>();

const adapter = useUiAdapter();

/** 基座上下文探测（缺失自动降级独立模式，不抛异常） */
const ctx = useRuntimeContext();

const rows = computed<Array<Record<string, unknown>>>(() => props.modelValue ?? []);

/** 操作列（editable && deletable 时追加删除按钮） */
const actionColumn = computed<MxColumn | null>(() => {
  if (!props.editable || !props.deletable) return null;
  return { dataIndex: '__mx_doc_actions', title: '操作', width: 72, key: '__mx_doc_actions' };
});

const tableColumns = computed<MxColumn[]>(() => {
  const columns: MxColumn[] = props.columns.map((column) => ({ ...column }));
  if (actionColumn.value) columns.push(actionColumn.value);
  return columns;
});

/** 行编辑状态（rowKey 集合；双击行或操作列「编辑」进入，再次点击完成） */
const editingKeys = ref(new Set<string>());

/** 校验错误：rowKey → dataIndex → 错误文案 */
const errors = reactive<Record<string, Record<string, string>>>({});

const rowKeyOf = (row: Record<string, unknown>): string => String(row[props.rowKey] ?? '');

const isEditing = (row: Record<string, unknown>): boolean => {
  if (!props.editable) return false;
  return editingKeys.value.has(rowKeyOf(row));
};

// —— 单元格级粒度权限（M4）：permissionCode（some 语义）+ editable 函数化（行级粒度） ——
/** 权限源：上下文 permissions 探测 → props.permissions 兜底 → 都缺失 = null（无权限源） */
const permissionSource = computed<string[] | null>(
  () => ctx?.permissions ?? props.permissions ?? null,
);

let permissionWarned = false;

/** 权限码命中判定（some 语义对齐 useAuth）；未配置 permissionCode 的列不受影响 */
const hasPermission = (code: string | string[] | undefined): boolean => {
  if (!code) return true;
  if (permissionSource.value === null) {
    // 独立模式降级（Q3 方案 a）：无权限源时不做拦截，warn 一次防配置遗漏
    if (!permissionWarned) {
      permissionWarned = true;
      console.warn(
        '[mengxi-ark/DocumentTable] 列配置了 permissionCode，但上下文 permissions 与 props.permissions 均未提供，' +
          '权限拦截将不生效（视为有权限）。可通过 provide(MX_RUNTIME_CONTEXT_KEY) 或 props.permissions 配置权限源。',
      );
    }
    return true;
  }
  const codes = Array.isArray(code) ? code : [code];
  return codes.some((item) => permissionSource.value!.includes(item));
};

/** 单元格最终可编辑性 = 列可编辑声明通过 + 权限命中 + editable 函数（行级粒度）通过 */
const isCellEditable = (row: Record<string, unknown>, dataIndex: string): boolean => {
  const column = props.columns.find((item) => item.dataIndex === dataIndex) as DocColumn | undefined;
  if (!column) return false;
  if (!hasPermission(column.permissionCode)) return false;
  const editable = column.editable;
  if (typeof editable === 'function') return editable(row);
  return editable === true;
};

const editorTypeOf = (dataIndex: string): DocEditorType => {
  const column = props.columns.find((item) => item.dataIndex === dataIndex) as DocColumn | undefined;
  return column?.editorType ?? 'input';
};

const editorOptionsOf = (dataIndex: string) => {
  const column = props.columns.find((item) => item.dataIndex === dataIndex) as DocColumn | undefined;
  return column?.editorOptions ?? [];
};

const cellError = (row: Record<string, unknown>, dataIndex: string): string | undefined =>
  errors[rowKeyOf(row)]?.[dataIndex];

function setCellValue(row: Record<string, unknown>, dataIndex: string, value: unknown): void {
  row[dataIndex] = value;
  const rowErrors = errors[rowKeyOf(row)];
  if (rowErrors) delete rowErrors[dataIndex];
  // rows 数组元素为 props.modelValue 内对象，直接变更需显式通知（引用未变）
  emit('update:modelValue', [...rows.value]);
}

const isActionColumn = (dataIndex: string): boolean => dataIndex === '__mx_doc_actions';

function toggleEdit(row: Record<string, unknown>): void {
  if (!props.editable) return;
  const key = rowKeyOf(row);
  if (editingKeys.value.has(key)) {
    editingKeys.value.delete(key);
  } else {
    editingKeys.value.add(key);
  }
}

/** 双击行进入编辑（按钮「编辑」亦可；编辑中双击不退出，避免误触） */
function handleRowDblclick(row: Record<string, unknown>): void {
  if (!props.editable) return;
  const key = rowKeyOf(row);
  if (editingKeys.value.has(key)) return;
  editingKeys.value.add(key);
}

function addRow(preset: Record<string, unknown> = {}): void {
  const row: Record<string, unknown> = { ...preset };
  if (row[props.rowKey] === undefined) row[props.rowKey] = createTempRowKey();
  const next = [...rows.value, row];
  emit('update:modelValue', next);
  if (props.editable) editingKeys.value.add(String(row[props.rowKey]));
  emit('rowAdd', row);
}

function removeRow(row: Record<string, unknown>): void {
  const key = rowKeyOf(row);
  editingKeys.value.delete(key);
  delete errors[key];
  emit('update:modelValue', rows.value.filter((item) => rowKeyOf(item) !== key));
  emit('rowRemove', row);
}

/** 保存：先全量校验，未通过则标记错误并阻断（不抛 save 事件，不自带提交请求）；
 * 无权限 / 不可编辑的单元格跳过校验（防「必填列无权限 → 永远无法保存」死锁） */
function handleSave(): void {
  if (!props.editable) return;
  const result = validateRows(rows.value, props.columns, props.rowKey, (row, dataIndex) => !isCellEditable(row, dataIndex));
  const keys = Object.keys(result);
  // 重置上一轮错误
  for (const key of Object.keys(errors)) delete errors[key];
  Object.assign(errors, result);
  if (keys.length > 0) {
    console.warn('[mengxi-ark/DocumentTable] 单据校验未通过，已阻断 save 事件。');
    return;
  }
  emit('save', rows.value.map((row) => ({ ...row })));
}

defineExpose({
  /** 新增行（可传入预置字段值） */
  addRow,
  /** 删除行 */
  removeRow,
  /** 主动全量校验，返回错误明细（无权限 / 不可编辑单元格跳过） */
  validate: () => validateRows(rows.value, props.columns, props.rowKey, (row, dataIndex) => !isCellEditable(row, dataIndex)),
  /** 当前编辑中的行 key 集合 */
  editingKeys,
});
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
