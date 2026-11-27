# @mengxi-ark/components

> 通用增强组件层：SearchForm / EnhanceTable 等九组件，props 驱动优先、插槽兜底，完全独立可导入，不需要基座注册。

[![npm version](https://img.shields.io/npm/v/@mengxi-ark/components?style=flat-square)](https://www.npmjs.com/package/@mengxi-ark/components)
[![license](https://img.shields.io/npm/l/@mengxi-ark/components?style=flat-square)](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)

[MengXi Ark｜曦舟](https://github.com/MengXi-Studio/mengxi-ark) 的组件包：UI 库差异收敛在适配层，**默认 Ant Design Vue，可切换 Element Plus**，组件文件不直接耦合任何 UI 库 API；样式仅引用 `@mengxi-ark/theme` 的 `--mx-*` token。

## 安装

```bash
# 默认搭配 Ant Design Vue
pnpm add @mengxi-ark/components @mengxi-ark/theme ant-design-vue
# 或搭配 Element Plus（适配器切换见下文）
pnpm add @mengxi-ark/components @mengxi-ark/theme element-plus
```

## 使用示例

```vue
<script setup lang="ts">
import { SearchForm, EnhanceTable } from '@mengxi-ark/components'
import type { SearchField, MxColumn } from '@mengxi-ark/components'
import '@mengxi-ark/components/style.css'

const fields: SearchField[] = [
	{ field: 'keyword', type: 'input', label: '关键词' },
	{ field: 'status', type: 'select', label: '状态', options: [{ label: '启用', value: '1' }] }
]
</script>

<template>
	<SearchForm :fields="fields" @search="onSearch" @reset="onReset" />
</template>
```

切换 Element Plus（应用入口 provide 一次）：

```ts
import { UI_ADAPTER_KEY, createElementPlusAdapter } from '@mengxi-ark/components'

app.provide(UI_ADAPTER_KEY, createElementPlusAdapter())
```

## 组件清单

SearchForm · EnhanceTable · EmptyState · StatusTag · ResultPage · MxDialog · MxDrawer · MxUpload · MxTreeSelect

> 所有类型（`SearchField` / `MxColumn` / `MxPaginationState` 等）随包导出 `.d.ts`，业务可直接复用。

## 文档

- 完整文档：<https://mengxi-studio.github.io/mengxi-ark/>
- 组件指南：<https://mengxi-studio.github.io/mengxi-ark/guide/components-guide.html>
- API 参考：<https://mengxi-studio.github.io/mengxi-ark/api/searchform.html>

## 协议

[MIT](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)
