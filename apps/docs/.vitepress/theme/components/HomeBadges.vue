<template>
  <div class="home-badges">
    <a
      href="https://github.com/MengXi-Studio/mengxi-ark/actions"
      target="_blank"
      rel="noreferrer"
    >
      <img
        alt="CI"
        src="https://img.shields.io/github/actions/workflow/status/MengXi-Studio/mengxi-ark/ci.yml?branch=master&style=flat-square"
      >
    </a>
    <a
      href="https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE"
      target="_blank"
      rel="noreferrer"
    >
      <img
        alt="License"
        src="https://img.shields.io/npm/l/%40mengxi-ark%2Futils?style=flat-square"
      >
    </a>
    <a
      href="https://www.npmjs.com/package/@mengxi-ark/utils"
      target="_blank"
      rel="noreferrer"
    >
      <img
        alt="npm utils"
        src="https://img.shields.io/npm/v/%40mengxi-ark%2Futils/beta?style=flat-square&label=%40mengxi-ark%2Futils"
      >
    </a>
    <a
      href="https://www.npmjs.com/package/@mengxi-ark/biz-components"
      target="_blank"
      rel="noreferrer"
    >
      <img
        alt="npm biz-components"
        src="https://img.shields.io/npm/v/%40mengxi-ark%2Fbiz-components/beta?style=flat-square&label=%40mengxi-ark%2Fbiz-components"
      >
    </a>
  </div>
</template>

<style scoped>
.home-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.home-badges img {
  display: block;
}
</style>
