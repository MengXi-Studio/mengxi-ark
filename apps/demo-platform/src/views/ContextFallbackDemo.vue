<template>
	<div class="page">
		<section class="panel">
			<h3 class="panel-title">基座联动（默认）：Lov 探测命中全局上下文</h3>
			<div class="row">
				<div class="field">
					<span class="field-label">用户状态（STATUS 值集缓存）</span>
					<Lov v-model="linkedValue" lov-code="STATUS" style="width: 200px" />
				</div>
			</div>
			<p class="hint hint--ok">探测命中：lovCode 直接命中 context.lovCache，无需 props 数据源。</p>
		</section>

		<section class="panel">
			<h3 class="panel-title">降级切换演示：子树 provide 空上下文（模拟探测丢失）</h3>
			<div class="row">
				<label class="check">
					<input v-model="degraded" type="checkbox" />
					模拟上下文丢失（provide MX_RUNTIME_CONTEXT_KEY → {}）
				</label>
				<span class="hint" :class="degraded ? 'hint--danger' : 'hint--ok'">
					{{ degraded ? '子树已降级独立模式：无 props 兜底的 Lov 无数据源；传 lovApi props 的 Lov 正常自请求' : '子树探测命中全局基座上下文' }}
				</span>
			</div>

			<component :is="degraded ? DegradedProvider : 'div'">
				<div class="row row--stretch">
					<div class="field">
						<span class="field-label">无 props 兜底（lovCode STATUS → 降级后无数据源）</span>
						<Lov v-model="degradedBareValue" lov-code="STATUS" style="width: 200px" />
					</div>
					<div class="field">
						<span class="field-label">lovApi props 兜底（独立模式自请求 mock 接口）</span>
						<Lov v-model="degradedFallbackValue" lov-code="USERS" :lov-api="mockLovApi" :field-names="{ label: 'name', value: 'code' }" style="width: 240px" />
					</div>
				</div>
			</component>
			<div class="output">裸 Lov 选中：{{ JSON.stringify(degradedBareValue) }}；兜底 Lov 选中：{{ JSON.stringify(degradedFallbackValue) }}</div>
			<p class="hint">契约回归：上下文命中自动复用（基座联动）→ 上下文缺失字段回退同名 props → 完全缺失降级独立模式，不抛致命异常。</p>
		</section>
	</div>
</template>

<script setup lang="ts">
/**
 * 降级切换演示页（真实基座下的 M2 探测契约回归）：
 * 通过子树 provide 空上下文模拟「探测丢失」，验证 Lov 自动降级与 props 兜底。
 */
import { defineComponent, provide, ref } from 'vue'
import { Lov, MX_RUNTIME_CONTEXT_KEY } from '@mengxi-ark/biz-components'
import { createMockLovApi } from '../mock-api'

const mockLovApi = createMockLovApi()

/** 空上下文 Provider：模拟基座上下文整体丢失（biz-components 探测到空对象，字段缺失回退 props / 独立模式） */
const DegradedProvider = defineComponent({
	name: 'DegradedProvider',
	setup(_, { slots }) {
		provide(MX_RUNTIME_CONTEXT_KEY, {})
		return () => slots.default?.()
	}
})

const linkedValue = ref<string | null>(null)
const degraded = ref(false)
const degradedBareValue = ref<string | null>(null)
const degradedFallbackValue = ref<string | null>(null)
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

.row--stretch {
	align-items: flex-start;
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
}

.hint {
	color: var(--mx-color-text-secondary);
	font-size: var(--mx-font-size-xs);
}

.hint--ok {
	color: var(--mx-color-success);
}

.hint--danger {
	color: var(--mx-color-danger);
}

.check {
	display: inline-flex;
	align-items: center;
	gap: var(--mx-spacing-xs);
	color: var(--mx-color-text-secondary);
	font-size: var(--mx-font-size-xs);
}
</style>
