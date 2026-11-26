<script setup lang="ts">
// 模板首页：模块路由注册后由 Tab 工作台打开
</script>

<template>
  <div class="page">
    <h2>欢迎使用曦舟中台基座</h2>
    <p>本页由 systemModule 注册；左侧菜单 / 顶部页签由 runtime 驱动。</p>
    <p>下一步：在 src/modules/ 中按 ModuleDefinition 声明式注册业务模块。</p>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
  color: var(--mx-color-text-primary);
}
</style>
