<template>
  <div class="mx-empty">
    <div class="mx-empty__body">
      <slot />
      <p class="mx-empty__description">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="mx-empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EmptyStateProps } from './types';

withDefaults(defineProps<EmptyStateProps>(), {
  description: '暂无数据',
});
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
