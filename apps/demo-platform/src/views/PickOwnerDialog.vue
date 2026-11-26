<template>
  <div class="pick">
    <p class="pick-hint">
      该弹窗由 tabService.open({ openMode 默认 'dialog'，业务组件直传 }) 打开：
      非路由挂载，经内置 Layout 的 MxDialog 承载。Lov 走上下文 lovListApi（基座联动）。
    </p>
    <div class="pick-field">
      <span class="pick-label">负责人</span>
      <Lov v-model="ownerValue" lov-code="USERS" :field-names="{ label: 'name', value: 'code' }" style="width: 240px" />
    </div>
    <div class="pick-output">选中：{{ JSON.stringify(ownerValue) }}</div>
  </div>
</template>

<script setup lang="ts">
/** openMode 'dialog' 演示载荷组件：业务组件直传给 tabService.open */
import { ref } from 'vue';
import { Lov } from '@mengxi-ark/biz-components';

const props = defineProps<{
  /** 打开时的已选负责人（tabService.open props 透传） */
  initialOwner?: string | number | Array<string | number> | null;
}>();

const ownerValue = ref<string | number | Array<string | number> | null>(props.initialOwner ?? null);
</script>

<style scoped>
.pick {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-md);
}

.pick-hint {
  color: var(--mx-color-text-secondary);
  font-size: var(--mx-font-size-xs);
}

.pick-field {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-xs);
}

.pick-label {
  color: var(--mx-color-text-secondary);
  font-size: var(--mx-font-size-xs);
}

.pick-output {
  padding: var(--mx-spacing-sm) var(--mx-spacing-md);
  background-color: var(--mx-color-bg-layout);
  border-radius: var(--mx-radius-base);
  color: var(--mx-color-text-primary);
  font-size: var(--mx-font-size-xs);
}
</style>
