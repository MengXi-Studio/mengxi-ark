<template>
	<div class="mx-result" :class="`mx-result--${status}`">
		<div class="mx-result__icon">
			<slot>{{ symbol }}</slot>
		</div>
		<div class="mx-result__title">{{ title }}</div>
		<div v-if="subTitle" class="mx-result__sub-title">{{ subTitle }}</div>
		<div v-if="$slots.extra" class="mx-result__extra">
			<slot name="extra" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResultPageProps, ResultPageStatus } from './types'

const props = withDefaults(defineProps<ResultPageProps>(), {
	status: 'success',
	title: '',
	subTitle: ''
})

const SYMBOLS: Record<ResultPageStatus, string> = {
	success: '✓',
	error: '✕',
	warning: '!',
	info: 'i'
}

const symbol = computed(() => SYMBOLS[props.status])
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
