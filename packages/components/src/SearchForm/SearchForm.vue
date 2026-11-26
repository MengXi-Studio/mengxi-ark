<template>
	<form class="mx-search-form" :class="`mx-search-form--${size}`" @submit.prevent>
		<div class="mx-search-form__fields">
			<div v-for="field in visibleFields" :key="field.name" class="mx-search-form__item" :style="field.width ? { width: typeof field.width === 'number' ? `${field.width}px` : field.width } : undefined">
				<label class="mx-search-form__label" :for="`mx-search-${field.name}`">{{ field.label }}</label>
				<div class="mx-search-form__control">
					<component :is="adapter.Input" v-if="field.type === 'input'" :id="`mx-search-${field.name}`" v-model="values[field.name]" :size="size" :placeholder="field.placeholder ?? '请输入'" :disabled="field.disabled" />
					<component
						:is="adapter.Select"
						v-else-if="field.type === 'select'"
						:id="`mx-search-${field.name}`"
						v-model="values[field.name]"
						:size="size"
						:options="field.options ?? []"
						:placeholder="field.placeholder ?? '请选择'"
						:disabled="field.disabled"
						allow-clear />
					<component :is="adapter.RangePicker" v-else :id="`mx-search-${field.name}`" v-model="values[field.name]" :size="size" :placeholder="field.placeholder" :disabled="field.disabled" />
				</div>
			</div>

			<slot name="extra" />

			<div class="mx-search-form__item mx-search-form__item--actions">
				<component :is="adapter.Button" type="primary" :size="size" :loading="loading" @click="handleSearch">
					{{ searchText }}
				</component>
				<component :is="adapter.Button" :size="size" @click="handleReset">
					{{ resetText }}
				</component>
				<component :is="adapter.Button" v-if="showToggle" type="link" :size="size" @click="expanded = !expanded">
					{{ expanded ? '收起' : `展开${fields.length - defaultCollapsedCount}项` }}
				</component>
			</div>
		</div>
	</form>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useUiAdapter } from '../adapter/key'
import type { SearchField, SearchFormEmits, SearchFormProps } from './types'

const props = withDefaults(defineProps<SearchFormProps>(), {
	size: 'md',
	collapsible: true,
	defaultCollapsedCount: 3,
	loading: false,
	searchText: '查询',
	resetText: '重置'
})

const emit = defineEmits<SearchFormEmits>()

const adapter = useUiAdapter()

/** 表单值（初始值取各字段 initialValue） */
function initValues(): Record<string, unknown> {
	const initial: Record<string, unknown> = {}
	for (const field of props.fields) {
		initial[field.name] = field.initialValue
	}
	return initial
}

const values = reactive<Record<string, unknown>>(initValues())

const expanded = ref(false)

const showToggle = computed(() => props.collapsible && props.fields.length > props.defaultCollapsedCount)

const visibleFields = computed<SearchField[]>(() => {
	if (!showToggle.value || expanded.value) return props.fields
	return props.fields.slice(0, props.defaultCollapsedCount)
})

function handleSearch(): void {
	emit('search', { ...values })
}

function handleReset(): void {
	const initial = initValues()
	for (const key of Object.keys(values)) {
		values[key] = initial[key]
	}
	emit('reset')
}
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
