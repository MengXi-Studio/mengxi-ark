# @mengxi-ark/dsl-render

> DSL 配置渲染引擎：Query / Form / Table 三套强 TS Schema + 结构校验 + 三渲染器，渲染器只渲染、事件抛上层；手写 SFC 一等公民，配置渲染只是加速方案。

[![npm version](https://img.shields.io/npm/v/@mengxi-ark/dsl-render?style=flat-square)](https://www.npmjs.com/package/@mengxi-ark/dsl-render)
[![license](https://img.shields.io/npm/l/@mengxi-ark/dsl-render?style=flat-square)](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)

[MengXi Ark｜曦舟](https://github.com/MengXi-Studio/mengxi-ark) 的配置渲染包：Schema 显式 TS 类型、禁止 `any` 直传；组件经映射表解析（默认 13 项，业务可同 key 覆盖替换）；search / submit / save 事件全部抛给上层业务，渲染器不自带请求逻辑。基座联动由 biz-components 自身 inject 探测继承，本包不 import `@mengxi-ark/runtime`。

## 安装

```bash
pnpm add @mengxi-ark/dsl-render @mengxi-ark/components @mengxi-ark/biz-components
```

## 使用示例

```vue
<script setup lang="ts">
import { QueryRenderer, validateSchema } from '@mengxi-ark/dsl-render'
import type { QuerySchema } from '@mengxi-ark/dsl-render'

const schema: QuerySchema = {
	kind: 'query',
	fields: [
		{ field: 'keyword', type: 'input', label: '关键词' },
		{ field: 'status', type: 'select', label: '状态', options: [{ label: '启用', value: '1' }] }
	]
}

// 结构校验：返回带路径的错误清单
const errors = validateSchema(schema)
</script>

<template>
	<!-- 渲染器只渲染：search / reset 事件抛上层，配合 useTable 自行请求 -->
	<QueryRenderer :schema="schema" @search="onSearch" @reset="onReset" />
</template>
```

## 能力清单

| 模块                        | 职责                                                                     |
| --------------------------- | ------------------------------------------------------------------------ |
| `QuerySchema` / `FormSchema` / `TableSchema` | 强 TS 类型，字段支持函数式 `visible` / `rules` 联动      |
| `validateSchema`            | 结构校验，带路径错误清单                                                 |
| `buildDefaultComponentMap` / `createComponentMap` | 组件映射注册表，业务可同 key 覆盖替换             |
| `QueryRenderer`             | 查询区渲染，`search` / `reset` 事件抛上层                               |
| `FormRenderer`              | 表单渲染，暴露 `validate`，`submit` 事件抛上层                          |
| `TableRenderer`             | 表格渲染，透传 toolbar / bodyCell / expandedRow 槽                      |

## 文档

- 完整文档：<https://mengxi-studio.github.io/mengxi-ark/>
- DSL 配置渲染：<https://mengxi-studio.github.io/mengxi-ark/dsl/index.html>

## 协议

[MIT](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)
