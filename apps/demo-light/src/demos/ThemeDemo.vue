<script setup lang="ts">
const primaryScale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const grayScale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

const functionalColors = [
	{ name: 'primary', token: 'var(--mx-color-primary)' },
	{ name: 'primary-hover', token: 'var(--mx-color-primary-hover)' },
	{ name: 'primary-active', token: 'var(--mx-color-primary-active)' },
	{ name: 'success', token: 'var(--mx-color-success)' },
	{ name: 'warning', token: 'var(--mx-color-warning)' },
	{ name: 'danger', token: 'var(--mx-color-danger)' },
	{ name: 'info', token: 'var(--mx-color-info)' }
]

const bgColors = [
	{ name: 'bg-container', token: 'var(--mx-color-bg-container)' },
	{ name: 'bg-layout', token: 'var(--mx-color-bg-layout)' },
	{ name: 'bg-hover', token: 'var(--mx-color-bg-hover)' },
	{ name: 'bg-disabled', token: 'var(--mx-color-bg-disabled)' }
]

const borderColors = [
	{ name: 'border-base', token: 'var(--mx-color-border-base)' },
	{ name: 'border-split', token: 'var(--mx-color-border-split)' }
]

const spacings = ['xs', 'sm', 'md', 'lg', 'xl']
const radii = ['sm', 'base', 'lg', 'round']
const shadows = ['sm', 'base', 'lg']
const fontSizes = ['xs', 'sm', 'md', 'lg', 'xl']
</script>

<template>
	<div class="stack">
		<section class="panel">
			<h3 class="panel-title">品牌色梯度（基础层，主题间保持不变）</h3>
			<div class="scale-row">
				<div v-for="n in primaryScale" :key="n" class="scale-cell">
					<div class="swatch" :style="{ backgroundColor: `var(--mx-color-primary-${n})` }" />
					<span class="scale-label"> primary-{{ n }} </span>
				</div>
			</div>
			<div class="scale-row">
				<div v-for="n in grayScale" :key="n" class="scale-cell">
					<div class="swatch swatch--bordered" :style="{ backgroundColor: `var(--mx-gray-${n})` }" />
					<span class="scale-label"> gray-{{ n }} </span>
				</div>
			</div>
		</section>

		<section class="panel">
			<h3 class="panel-title">功能色（语义层，暗色模式自动切换）</h3>
			<div class="token-grid">
				<div v-for="color in functionalColors" :key="color.name" class="token-cell">
					<div class="swatch" :style="{ backgroundColor: color.token }" />
					<span class="scale-label">
						{{ color.name }}
					</span>
				</div>
			</div>
		</section>

		<section class="panel">
			<h3 class="panel-title">文本色 / 背景色 / 边框色（语义层）</h3>
			<div class="text-stack">
				<p class="text-sample text-sample--primary">text-primary · 主文本色</p>
				<p class="text-sample text-sample--secondary">text-secondary · 次要文本色</p>
				<p class="text-sample text-sample--disabled">text-disabled · 禁用文本色</p>
			</div>
			<div class="token-grid">
				<div v-for="bg in bgColors" :key="bg.name" class="token-cell">
					<div class="swatch swatch--bordered" :style="{ backgroundColor: bg.token }" />
					<span class="scale-label">
						{{ bg.name }}
					</span>
				</div>
				<div v-for="border in borderColors" :key="border.name" class="token-cell">
					<div class="swatch swatch--border-demo" :style="{ borderColor: border.token }" />
					<span class="scale-label">
						{{ border.name }}
					</span>
				</div>
			</div>
		</section>

		<section class="panel">
			<h3 class="panel-title">间距梯度（xs 4 / sm 8 / md 12 / lg 16 / xl 24）</h3>
			<div class="scale-row">
				<div v-for="size in spacings" :key="size" class="scale-cell">
					<div class="spacing-bar" :style="{ width: `var(--mx-spacing-${size})` }" />
					<span class="scale-label">
						{{ size }}
					</span>
				</div>
			</div>
		</section>

		<section class="panel">
			<h3 class="panel-title">圆角梯度（sm / base / lg / round）</h3>
			<div class="scale-row">
				<div v-for="radius in radii" :key="radius" class="scale-cell">
					<div class="radius-box" :style="{ borderRadius: `var(--mx-radius-${radius})` }" />
					<span class="scale-label">
						{{ radius }}
					</span>
				</div>
			</div>
		</section>

		<section class="panel">
			<h3 class="panel-title">阴影层级（sm / base / lg）</h3>
			<div class="scale-row">
				<div v-for="shadow in shadows" :key="shadow" class="scale-cell">
					<div class="shadow-box" :style="{ boxShadow: `var(--mx-shadow-${shadow})` }" />
					<span class="scale-label">
						{{ shadow }}
					</span>
				</div>
			</div>
		</section>

		<section class="panel">
			<h3 class="panel-title">字阶（font-size xs / sm / md / lg / xl）</h3>
			<div class="text-stack">
				<p v-for="size in fontSizes" :key="size" class="text-sample" :style="{ fontSize: `var(--mx-font-size-${size})` }">字号 {{ size }} —— 曦舟中台前端框架 MengXi Ark</p>
			</div>
		</section>
	</div>
</template>

<style scoped>
.scale-row {
	display: flex;
	flex-wrap: wrap;
	gap: var(--mx-spacing-md);
}

.scale-cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--mx-spacing-xs);
}

.scale-label {
	color: var(--mx-color-text-secondary);
	font-size: var(--mx-font-size-xs);
	font-family: var(--mx-font-family-code);
}

.swatch {
	width: calc(var(--mx-spacing-xl) * 3);
	height: calc(var(--mx-spacing-xl) * 2);
	border-radius: var(--mx-radius-sm);
}

.swatch--bordered {
	border: 1px solid var(--mx-color-border-base);
}

.swatch--border-demo {
	border-width: var(--mx-spacing-xs);
	border-style: solid;
}

.token-grid {
	display: flex;
	flex-wrap: wrap;
	gap: var(--mx-spacing-md);
}

.token-cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--mx-spacing-xs);
}

.text-stack {
	display: flex;
	flex-direction: column;
	gap: var(--mx-spacing-sm);
}

.text-sample--primary {
	color: var(--mx-color-text-primary);
}

.text-sample--secondary {
	color: var(--mx-color-text-secondary);
}

.text-sample--disabled {
	color: var(--mx-color-text-disabled);
}

.spacing-bar {
	height: var(--mx-spacing-lg);
	background-color: var(--mx-color-primary);
	border-radius: var(--mx-radius-sm);
}

.radius-box {
	width: calc(var(--mx-spacing-xl) * 3);
	height: calc(var(--mx-spacing-xl) * 2);
	background-color: var(--mx-color-bg-layout);
	border: 1px solid var(--mx-color-primary);
}

.shadow-box {
	width: calc(var(--mx-spacing-xl) * 4);
	height: calc(var(--mx-spacing-xl) * 2.5);
	background-color: var(--mx-color-bg-container);
	border-radius: var(--mx-radius-base);
}
</style>
