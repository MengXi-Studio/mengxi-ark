<script setup lang="ts">
/* global document */
import { ref } from 'vue';
import ComponentsDemo from './demos/ComponentsDemo.vue';
import DslDemo from './demos/DslDemo.vue';
import HooksDemo from './demos/HooksDemo.vue';
import ThemeDemo from './demos/ThemeDemo.vue';
import UtilsDemo from './demos/UtilsDemo.vue';

type TabKey = 'utils' | 'theme' | 'hooks' | 'components' | 'dsl';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'utils', label: 'Utils 工具函数' },
  { key: 'theme', label: 'Theme 设计令牌' },
  { key: 'hooks', label: 'Hooks 组合式函数' },
  { key: 'components', label: '组件（components / biz-components）' },
  { key: 'dsl', label: 'DSL 配置渲染（加速方案）' },
];

const activeTab = ref<TabKey>('utils');
const isDark = ref(false);

// 暗色切换约定：宿主根节点挂 data-theme="dark"
function toggleDark(): void {
  isDark.value = !isDark.value;
  document.documentElement.dataset.theme = isDark.value ? 'dark' : '';
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="brand">
        <span class="brand-name">曦舟 MengXi Ark</span>
        <span class="brand-tag">demo-light 轻量模式（无 runtime，三包直装直用）</span>
      </div>
      <button
        class="btn btn--ghost"
        type="button"
        @click="toggleDark"
      >
        {{ isDark ? '切换亮色' : '切换暗色' }}
      </button>
    </header>
    <nav class="page-nav">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab"
        :class="activeTab === tab.key ? 'tab--active' : ''"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>
    <main class="page-main">
      <UtilsDemo v-if="activeTab === 'utils'" />
      <ThemeDemo v-else-if="activeTab === 'theme'" />
      <HooksDemo v-else-if="activeTab === 'hooks'" />
      <ComponentsDemo v-else-if="activeTab === 'components'" />
      <DslDemo v-else />
    </main>
  </div>
</template>

<style>
/* 页面级排版样式：仅引用 --mx-* token，不引入任何 UI 库 */
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mx-spacing-md);
  padding: var(--mx-spacing-md) var(--mx-spacing-xl);
  background-color: var(--mx-color-bg-container);
  border-bottom: 1px solid var(--mx-color-border-split);
}

.brand {
  display: flex;
  align-items: baseline;
  gap: var(--mx-spacing-sm);
}

.brand-name {
  font-size: var(--mx-font-size-lg);
  font-weight: var(--mx-font-weight-bold);
  color: var(--mx-color-primary);
}

.brand-tag {
  color: var(--mx-color-text-secondary);
  font-size: var(--mx-font-size-xs);
}

.page-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mx-spacing-sm);
  padding: var(--mx-spacing-sm) var(--mx-spacing-xl);
  background-color: var(--mx-color-bg-container);
  border-bottom: 1px solid var(--mx-color-border-split);
}

.tab {
  padding: var(--mx-spacing-xs) var(--mx-spacing-md);
  border: none;
  border-radius: var(--mx-radius-base);
  background-color: transparent;
  color: var(--mx-color-text-secondary);
  font-size: var(--mx-font-size-sm);
  cursor: pointer;
}

.tab--active {
  background-color: var(--mx-color-bg-hover);
  color: var(--mx-color-primary);
  font-weight: var(--mx-font-weight-medium);
}

.page-main {
  flex: 1;
  padding: var(--mx-spacing-xl);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--mx-spacing-lg);
  max-width: 880px;
  margin: 0 auto;
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
  align-items: center;
  gap: var(--mx-spacing-sm);
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

.input {
  min-width: 220px;
  padding: var(--mx-spacing-xs) var(--mx-spacing-sm);
  background-color: var(--mx-color-bg-container);
  border: 1px solid var(--mx-color-border-base);
  border-radius: var(--mx-radius-base);
  color: var(--mx-color-text-primary);
  font-size: var(--mx-font-size-sm);
}

.output {
  padding: var(--mx-spacing-sm) var(--mx-spacing-md);
  background-color: var(--mx-color-bg-layout);
  border-radius: var(--mx-radius-base);
  color: var(--mx-color-text-primary);
  font-family: var(--mx-font-family-code);
  font-size: var(--mx-font-size-xs);
  white-space: pre-wrap;
  word-break: break-all;
}

.hint {
  color: var(--mx-color-text-secondary);
  font-size: var(--mx-font-size-xs);
}

.hint--danger {
  color: var(--mx-color-danger);
}

.hint--ok {
  color: var(--mx-color-success);
}

.btn {
  padding: var(--mx-spacing-xs) var(--mx-spacing-md);
  background-color: var(--mx-color-bg-container);
  border: 1px solid var(--mx-color-border-base);
  border-radius: var(--mx-radius-base);
  color: var(--mx-color-text-primary);
  font-size: var(--mx-font-size-sm);
  cursor: pointer;
}

.btn:hover:not(:disabled) {
  border-color: var(--mx-color-primary);
  color: var(--mx-color-primary);
}

.btn:disabled {
  background-color: var(--mx-color-bg-disabled);
  border-color: var(--mx-color-border-split);
  color: var(--mx-color-text-disabled);
  cursor: not-allowed;
}

.btn--primary {
  background-color: var(--mx-color-primary);
  border-color: var(--mx-color-primary);
  color: var(--mx-gray-1);
}

.btn--ghost {
  background-color: transparent;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: var(--mx-spacing-xs);
  color: var(--mx-color-text-secondary);
  font-size: var(--mx-font-size-xs);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--mx-font-size-sm);
}

.table th,
.table td {
  padding: var(--mx-spacing-xs) var(--mx-spacing-sm);
  border-bottom: 1px solid var(--mx-color-border-split);
  color: var(--mx-color-text-primary);
  text-align: left;
}

.table th {
  background-color: var(--mx-color-bg-layout);
  color: var(--mx-color-text-secondary);
  font-weight: var(--mx-font-weight-medium);
}
</style>
