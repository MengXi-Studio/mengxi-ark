<script setup lang="ts">
/**
 * QueryRenderer —— 查询区 Schema 渲染器。
 *
 * - 字段经组件映射表解析，行内布局 + 查询 / 重置按钮（UI 适配器 Button 能力）；
 * - visible 基于当前查询值实时联动显隐；
 * - search / reset 事件抛给上层业务（渲染器不自带请求逻辑，配合 hooks useTable 使用）。
 */
import { computed, reactive } from 'vue';
import { useUiAdapter } from '@mengxi-ark/components';
import type { SchemaComponentMap } from '../../componentMap';
import { createComponentMap } from '../../componentMap';
import type { QueryFieldSchema, QuerySchema } from '../../types/query';

const props = defineProps<{
  /** 查询区 Schema（必填） */
  schema: QuerySchema;
  /** 组件映射覆盖（同 key 整体替换默认条目） */
  componentMap?: SchemaComponentMap;
}>();

const emit = defineEmits<{
  /** 点击查询：values 为各字段当前值（未填项为 undefined） */
  (e: 'search', values: Record<string, unknown>): void;
  /** 点击重置（恢复各字段 initialValue） */
  (e: 'reset'): void;
}>();

const adapter = useUiAdapter();
const map = computed(() => createComponentMap(props.componentMap, adapter));

/** 查询值（内部自持；初始值取各字段 initialValue） */
const values = reactive<Record<string, unknown>>({});
for (const field of props.schema.fields) {
  if (field.initialValue !== undefined) values[field.field] = field.initialValue;
}

/** 当前可见字段（visible 函数式联动，基于实时查询值） */
const shownFields = computed(() =>
  props.schema.fields.filter((field) => field.visible?.(values) ?? true),
);

/** 可见字段 + 映射条目（未登记类型 warn 一次并跳过渲染，不抛异常） */
const shownItems = computed(() =>
  shownFields.value.map((field) => {
    const entry = map.value[field.type];
    if (!entry) console.warn(`[@mengxi-ark/dsl-render] 组件映射表未登记类型「${field.type}」，字段 ${field.field} 已跳过渲染`);
    return { field, entry };
  }),
);

/**
 * 字段绑定 props（undefined 值一律不下发）：
 * 显式绑定 undefined 会经 attrs 透传覆盖动态组件根节点上的同名绑定（如 Lov 内部 options）。
 */
function fieldBinds(field: QueryFieldSchema): Record<string, unknown> {
  const binds: Record<string, unknown> = { ...map.value[field.type]?.defaultProps, ...field.props };
  if (field.options !== undefined) binds.options = field.options;
  if (field.placeholder !== undefined) binds.placeholder = field.placeholder;
  if (field.disabled !== undefined) binds.disabled = field.disabled;
  if (field.width !== undefined) {
    binds.style = typeof field.width === 'number' ? { width: `${field.width}px` } : { width: field.width };
  }
  return binds;
}

function setValue(field: string, value: unknown): void {
  values[field] = value;
}

function handleSearch(): void {
  const out: Record<string, unknown> = {};
  for (const field of shownFields.value) out[field.field] = values[field.field];
  emit('search', out);
}

function handleReset(): void {
  for (const key of Object.keys(values)) delete values[key];
  for (const field of props.schema.fields) {
    if (field.initialValue !== undefined) values[field.field] = field.initialValue;
  }
  emit('reset');
}
</script>

<template>
  <div class="mx-dsl-query">
    <div
      v-for="item in shownItems"
      :key="item.field.field"
      class="mx-dsl-query__field"
    >
      <label
        v-if="item.field.label"
        class="mx-dsl-query__label"
      >{{ item.field.label }}</label>
      <component
        :is="item.entry.component"
        v-if="item.entry"
        v-bind="fieldBinds(item.field)"
        :model-value="values[item.field.field] ?? null"
        @update:model-value="(value: unknown) => setValue(item.field.field, value)"
      />
    </div>
    <div class="mx-dsl-query__actions">
      <component
        :is="adapter.Button"
        type="primary"
        :loading="schema.loading"
        @click="handleSearch"
      >
        {{ schema.searchText ?? '查询' }}
      </component>
      <component
        :is="adapter.Button"
        @click="handleReset"
      >
        {{ schema.resetText ?? '重置' }}
      </component>
    </div>
  </div>
</template>

<style lang="scss" scoped src="../../style/index.scss"></style>
