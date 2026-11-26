<template>
	<component :is="adapter.TreeSelect" v-bind="props" @update:model-value="handleUpdate" />
</template>

<script setup lang="ts">
import { useUiAdapter } from '../adapter/key'
import type { MxTreeSelectEmits, MxTreeSelectProps } from './types'

const props = withDefaults(defineProps<MxTreeSelectProps>(), {
	modelValue: null,
	treeData: () => [],
	size: 'md',
	placeholder: '请选择',
	disabled: false,
	allowClear: true,
	multiple: false
})

const emit = defineEmits<MxTreeSelectEmits>()

const adapter = useUiAdapter()

function handleUpdate(value: MxTreeSelectProps['modelValue']): void {
	emit('update:modelValue', value ?? null)
}
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
