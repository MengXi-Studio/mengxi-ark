<template>
	<div class="page">
		<section class="panel">
			<h3 class="panel-title">DocumentTable 基座权限源（上下文 permissions 探测 → 列级 permissionCode）</h3>
			<p class="hint">
				bizModule 声明 permissions ['biz:order:view', 'biz:order:edit']，经 runtime 合并进全局上下文； 数量列 permissionCode 命中 → 单元格可编辑；备注列 permissionCode 'biz:order:admin' 未声明 → 只读文本。
			</p>
			<DocumentTable v-model="rows" :columns="columns" />
			<div class="output">当前行数据：{{ JSON.stringify(rows) }}</div>
		</section>
	</div>
</template>

<script setup lang="ts">
/**
 * 单据管理页：DocumentTable 权限源走基座上下文（不传 permissions props），
 * 列级 permissionCode 决定单元格可编辑性（some 语义）。
 */
import { ref } from 'vue'
import { DocumentTable } from '@mengxi-ark/biz-components'
import type { DocColumn } from '@mengxi-ark/biz-components'
import { MOCK_ORDER_ROWS, ORDER_COUNT_OPTIONS } from '../mock-api'

const rows = ref<Array<Record<string, unknown>>>(MOCK_ORDER_ROWS.map(row => ({ ...row })))

const columns: DocColumn[] = [
	{ dataIndex: 'product', title: '商品', editable: true, rules: [{ required: true }] },
	{
		dataIndex: 'count',
		title: '数量',
		editable: true,
		editorType: 'select',
		editorOptions: ORDER_COUNT_OPTIONS,
		permissionCode: 'biz:order:edit',
		rules: [{ required: true }]
	},
	// 上下文未声明 biz:order:admin → 该列所有单元格只读
	{ dataIndex: 'remark', title: '备注', editable: true, permissionCode: 'biz:order:admin' }
]
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

.hint {
	color: var(--mx-color-text-secondary);
	font-size: var(--mx-font-size-xs);
}

.output {
	padding: var(--mx-spacing-sm) var(--mx-spacing-md);
	background-color: var(--mx-color-bg-layout);
	border-radius: var(--mx-radius-base);
	color: var(--mx-color-text-primary);
	font-size: var(--mx-font-size-xs);
	white-space: pre-wrap;
	word-break: break-all;
}
</style>
