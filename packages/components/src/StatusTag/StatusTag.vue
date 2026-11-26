<template>
  <span class="mx-status-tag">
    <span class="mx-status-tag__dot" :class="`mx-status-tag__dot--${tone}`" />
    <span class="mx-status-tag__label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StatusTagItem, StatusTagMapping, StatusTagProps } from './types';

const props = withDefaults(defineProps<StatusTagProps>(), {
  value: null,
  mapping: () => ({}),
});

const item = computed<StatusTagItem | undefined>(() =>
  props.value === null || props.value === undefined ? undefined : props.mapping[props.value],
);

const tone = computed(() => item.value?.tone ?? 'default');
const label = computed(() => item.value?.label ?? String(props.value ?? ''));
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
