<script setup lang="ts">
/**
 * FormRenderer —— 表单 Schema 渲染器（规范 §10.3：只渲染，提交事件抛给上层）。
 *
 * - 字段经组件映射表解析（业务可传 componentMap 覆盖替换）；
 * - 内部维护表单值（update:modelValue 抛全量），visible 基于当前值实时联动显隐；
 * - submit 前统一执行 rules 校验（required / validator），未通过则 emit validateFailed；
 * - defineExpose({ validate }) 供宿主主动校验（如嵌入 Dialog 自定义按钮场景）。
 */
import { computed, reactive, watch } from 'vue';
import { useUiAdapter } from '@mengxi-ark/components';
import type { SchemaComponentMap } from '../../componentMap';
import { createComponentMap } from '../../componentMap';
import { DEFAULT_RULE_MESSAGE } from '../../types/common';
import type { FormFieldSchema, FormSchema } from '../../types/form';

const props = defineProps<{
  /** 表单 Schema（必填） */
  schema: FormSchema;
  /** 表单值（v-model：update:modelValue 抛全量；缺省时内部自持） */
  modelValue?: Record<string, unknown>;
  /** 组件映射覆盖（同 key 整体替换默认条目） */
  componentMap?: SchemaComponentMap;
}>();

const emit = defineEmits<{
  /** 表单值变化（抛全量） */
  (e: 'update:modelValue', values: Record<string, unknown>): void;
  /** 校验通过后的提交（渲染器不自带提交请求） */
  (e: 'submit', values: Record<string, unknown>): void;
  /** 校验未通过：字段名 → 错误文案 */
  (e: 'validateFailed', errors: Record<string, string>): void;
}>();

const adapter = useUiAdapter();
const map = computed(() => createComponentMap(props.componentMap, adapter));

const values = reactive<Record<string, unknown>>({});
const errors = reactive<Record<string, string>>({});

/** 初始化 / 外部同步：modelValue 优先，其次字段 defaultValue（不覆盖已填值） */
function applyInitial(model?: Record<string, unknown>): void {
  for (const field of props.schema.fields) {
    if (model?.[field.field] !== undefined) values[field.field] = model[field.field];
    else if (values[field.field] === undefined && field.defaultValue !== undefined) {
      values[field.field] = field.defaultValue;
    }
  }
}
applyInitial(props.modelValue);
watch(() => props.modelValue, (v) => { if (v) applyInitial(v); }, { deep: true });

function setValue(field: string, value: unknown): void {
  values[field] = value;
  delete errors[field];
  emit('update:modelValue', { ...values });
}

/** 当前可见字段（visible 函数式联动，基于实时表单值） */
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
function fieldBinds(field: FormFieldSchema): Record<string, unknown> {
  const binds: Record<string, unknown> = { ...map.value[field.type]?.defaultProps, ...field.props };
  if (field.options !== undefined) binds.options = field.options;
  const size = field.size ?? props.schema.size;
  if (size !== undefined) binds.size = size;
  if (field.placeholder !== undefined) binds.placeholder = field.placeholder;
  if (field.disabled !== undefined) binds.disabled = field.disabled;
  if (field.readonly !== undefined) binds.readonly = field.readonly;
  return binds;
}

/** 执行校验：错误写入 errors，返回是否通过 */
function validate(): boolean {
  const next: Record<string, string> = {};
  for (const field of props.schema.fields as FormFieldSchema[]) {
    if (!(field.visible?.(values) ?? true)) continue;
    const value = values[field.field];
    for (const rule of field.rules ?? []) {
      if (rule.required && (value === undefined || value === null || value === '')) {
        next[field.field] = rule.message ?? DEFAULT_RULE_MESSAGE;
        break;
      }
      if (rule.validator) {
        const message = rule.validator(value, { ...values });
        if (message) {
          next[field.field] = message;
          break;
        }
      }
    }
  }
  for (const key of Object.keys(errors)) {
    if (!(key in next)) delete errors[key];
  }
  Object.assign(errors, next);
  return Object.keys(next).length === 0;
}

function handleSubmit(): void {
  if (validate()) emit('submit', { ...values });
  else emit('validateFailed', { ...errors });
}

defineExpose({ validate });
</script>

<template>
  <form
    class="mx-dsl-form"
    @submit.prevent="handleSubmit"
  >
    <div
      v-if="schema.title"
      class="mx-dsl-form__title"
    >
      {{ schema.title }}
    </div>
    <div
      v-for="item in shownItems"
      :key="item.field.field"
      class="mx-dsl-form__row"
    >
      <label
        class="mx-dsl-form__label"
        :style="{ width: schema.labelWidth ?? '110px' }"
      >
        {{ item.field.label ?? item.field.field }}
      </label>
      <div
        v-if="item.entry"
        class="mx-dsl-form__control"
      >
        <component
          :is="item.entry.component"
          v-bind="fieldBinds(item.field)"
          :model-value="values[item.field.field] ?? null"
          @update:model-value="(value: unknown) => setValue(item.field.field, value)"
        />
        <div
          v-if="errors[item.field.field]"
          class="mx-dsl-form__error"
        >
          {{ errors[item.field.field] }}
        </div>
      </div>
    </div>
    <div
      v-if="schema.showSubmit !== false"
      class="mx-dsl-form__actions"
    >
      <component
        :is="adapter.Button"
        type="primary"
        :loading="schema.loading"
        @click="handleSubmit"
      >
        {{ schema.submitText ?? '保存' }}
      </component>
    </div>
  </form>
</template>

<style lang="scss" scoped src="../../style/index.scss"></style>
