<script setup lang="ts">
/**
 * 用户管理示例页：Lov 基座联动模式（lovCode 探测上下文 lovCache，不传 lovApi / lovOptions）。
 */
import { ref } from 'vue';
import { Lov } from '@mengxi-ark/biz-components';

const status = ref<string | null>('1');
</script>

<template>
  <div class="page">
    <h2>用户管理</h2>
    <p>Lov 值集联动基座上下文 lovCache.STATUS：</p>
    <Lov
      v-model="status"
      lov-code="STATUS"
      style="width: 180px"
    />
    <p>当前值：{{ JSON.stringify(status) }}</p>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
  color: var(--mx-color-text-primary);
}
</style>
