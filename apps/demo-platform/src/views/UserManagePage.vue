<template>
  <div class="page">
    <section class="panel">
      <h3 class="panel-title">基座上下文探测（inject MX_RUNTIME_CONTEXT_KEY 命中）</h3>
      <div class="output">用户：{{ context?.user?.name }}　租户：{{ context?.tenant?.name }}　权限码：{{ JSON.stringify(context?.permissions) }}</div>
      <p class="hint">本页为 systemModule 注册的路由；Lov 直接复用基座上下文（值集缓存 / lovListApi），无需传任何数据源 props。</p>
    </section>

    <section class="panel">
      <h3 class="panel-title">Lov 基座联动（lovCode 命中上下文值集缓存）</h3>
      <div class="row">
        <div class="field">
          <span class="field-label">用户状态（STATUS 值集缓存）</span>
          <Lov v-model="statusValue" lov-code="STATUS" style="width: 200px" />
        </div>
        <div class="field">
          <span class="field-label">性别（GENDER 值集缓存）</span>
          <Lov v-model="genderValue" lov-code="GENDER" style="width: 200px" />
        </div>
      </div>
      <div class="output">STATUS 选中：{{ JSON.stringify(statusValue) }}　GENDER 选中：{{ JSON.stringify(genderValue) }}</div>
    </section>

    <section class="panel">
      <h3 class="panel-title">Lov 基座联动（lovCode 未命中缓存 → 回退上下文 lovListApi）</h3>
      <div class="row">
        <div class="field">
          <span class="field-label">负责人（弹窗表格走 context.lovListApi）</span>
          <Lov v-model="ownerValue" lov-code="USERS" :field-names="{ label: 'name', value: 'code' }" style="width: 240px" />
        </div>
        <button
          class="btn btn--primary"
          type="button"
          @click="openPickDialog"
        >
          openMode "dialog" 演示（业务组件直传弹窗）
        </button>
      </div>
      <div class="output">负责人选中：{{ JSON.stringify(ownerValue) }}</div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户管理页：Lov 基座联动 + tabService openMode 'dialog'（业务组件直传弹窗）演示。
 */
import { inject, ref } from 'vue';
import { Lov, useRuntimeContext } from '@mengxi-ark/biz-components';
import { ARK_RUNTIME_KEY } from '@mengxi-ark/runtime';
import type { ArkRuntime } from '@mengxi-ark/runtime';
import PickOwnerDialog from './PickOwnerDialog.vue';

const context = useRuntimeContext();
const runtime = inject(ARK_RUNTIME_KEY) as ArkRuntime | undefined;

const statusValue = ref<string | null>(null);
const genderValue = ref<string | null>(null);
const ownerValue = ref<string | null>(null);

function openPickDialog(): void {
  runtime?.tabService.open({
    title: '选择负责人（弹窗策略）',
    component: PickOwnerDialog,
    props: { initialOwner: ownerValue.value },
    width: 480,
  });
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-lg);
  max-width: 960px;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-md);
  padding: var(--mx-spacing-lg);
  background-color: var(--mx-color-bg-container);
  border: 1px solid var(--mx-color-border-split);
  border-radius: var(--mx-radius-lg);
  box-shadow: var(--mx-shadow-sm);
}

.panel-title {
  font-size: var(--mx-font-size-md);
  color: var(--mx-color-text-primary);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--mx-spacing-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-xs);
}

.field-label {
  color: var(--mx-color-text-secondary);
  font-size: var(--mx-font-size-xs);
}

.output {
  padding: var(--mx-spacing-sm) var(--mx-spacing-md);
  background-color: var(--mx-color-bg-layout);
  border-radius: var(--mx-radius-base);
  color: var(--mx-color-text-primary);
  font-size: var(--mx-font-size-xs);
  white-space: pre-wrap;
}

.hint {
  color: var(--mx-color-text-secondary);
  font-size: var(--mx-font-size-xs);
}

.btn {
  padding: var(--mx-spacing-xs) var(--mx-spacing-md);
  border: 1px solid var(--mx-color-border-base);
  border-radius: var(--mx-radius-base);
  background-color: var(--mx-color-bg-container);
  color: var(--mx-color-text-primary);
  font-size: var(--mx-font-size-sm);
  cursor: pointer;
}

.btn--primary {
  background-color: var(--mx-color-primary);
  border-color: var(--mx-color-primary);
  color: var(--mx-gray-1);
}
</style>
