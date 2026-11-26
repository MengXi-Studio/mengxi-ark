<template>
	<slot />
</template>

<script setup lang="ts">
/**
 * 基座上下文 Mock Provider（M2 验证用，M3 runtime 将由 contextService 真实下发）：
 * provide(MX_RUNTIME_CONTEXT_KEY, mockContext) 模拟基座环境，
 * 验证 biz-components inject 探测命中 → 复用上下文；移除包裹后自动降级独立模式。
 */
import { provide } from 'vue'
import { MX_RUNTIME_CONTEXT_KEY } from '@mengxi-ark/biz-components'
import type { LovOption } from '@mengxi-ark/biz-components'
import { createMockLovApi } from './mock-api'

/** 模拟基座全局值集缓存（key 同值集编码） */
const GENDER_OPTIONS: LovOption[] = [
	{ label: '男', value: 'M' },
	{ label: '女', value: 'F' }
]
const STATUS_OPTIONS: LovOption[] = [
	{ label: '启用', value: '1' },
	{ label: '停用', value: '0' },
	{ label: '冻结', value: '2' }
]

provide(MX_RUNTIME_CONTEXT_KEY, {
	user: { id: 1, name: '基座用户' },
	tenant: { id: 1, name: '梦曦工作室' },
	permissions: ['demo:view'],
	lovListApi: createMockLovApi(),
	lovCache: {
		GENDER: GENDER_OPTIONS,
		STATUS: STATUS_OPTIONS
	}
})
</script>
