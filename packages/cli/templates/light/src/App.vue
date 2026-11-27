<script setup lang="ts">
/**
 * 轻量模式示例页：utils / theme / hooks / components / biz-components 直装直用。
 * 能力全部来自 npm 包（模板保持薄），按需删除或替换本页内容即可。
 */
import { ref } from 'vue'
import { formatMoney } from '@mengxi-ark/utils'
import { useRequest } from '@mengxi-ark/hooks'
import { EnhanceTable, StatusTag } from '@mengxi-ark/components'
import type { StatusTagMapping } from '@mengxi-ark/components'
import { Lov } from '@mengxi-ark/biz-components'

const STATUS_MAPPING: StatusTagMapping = {
	'1': { label: '启用', tone: 'success' },
	'0': { label: '停用', tone: 'danger' }
}

const gender = ref<string | null>(null)
const GENDER_OPTIONS = [
	{ label: '男', value: 'M' },
	{ label: '女', value: 'F' }
]

const columns = [
	{ dataIndex: 'name', title: '姓名' },
	{ dataIndex: 'amount', title: '金额' },
	{ dataIndex: 'status', title: '状态' }
]
const rows = [
	{ id: 1, name: '用户一', amount: formatMoney(12345.6), status: '1' },
	{ id: 2, name: '用户二', amount: formatMoney(889), status: '0' }
]

// useRequest：请求 / loading / 错误 / 竞态保护 / retry 重试（默认创建即发起请求）
function fetchUser(): Promise<{ name: string }> {
	return new Promise(resolve => {
		setTimeout(() => resolve({ name: '曦舟' }), 500)
	})
}

const { data, loading, error, retry } = useRequest(fetchUser)
</script>

<template>
	<div class="page">
		<header class="page-header">
			<span class="page-title">曦舟轻量模式</span>
			<span class="page-tag">utils / theme / hooks / components / biz-components 直装直用</span>
		</header>
		<main class="page-main">
			<section class="card">
				<h3>Lov 静态值集（独立模式 props）</h3>
				<Lov v-model="gender" :lov-options="GENDER_OPTIONS" style="width: 160px" />
				<p>当前值：{{ JSON.stringify(gender) }}</p>
			</section>
			<section class="card">
				<h3>useRequest（hooks：loading / error / retry）</h3>
				<p v-if="loading">加载中…</p>
				<p v-else-if="error">加载失败，<button class="card-btn" type="button" @click="retry">重试</button></p>
				<p v-else-if="data">用户：{{ data.name }}</p>
			</section>
			<section class="card">
				<h3>EnhanceTable + StatusTag + utils</h3>
				<EnhanceTable :columns="columns" :data-source="rows">
					<template #bodyCell="{ column, record }">
						<StatusTag v-if="column.dataIndex === 'status'" :value="record.status" :mapping="STATUS_MAPPING" />
						<template v-else>
							{{ record[column.dataIndex] }}
						</template>
					</template>
				</EnhanceTable>
			</section>
		</main>
	</div>
</template>

<style>
body {
	margin: 0;
	background-color: var(--mx-color-bg-layout);
}

.page {
	max-width: 720px;
	margin: 0 auto;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.page-header {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.page-title {
	font-size: 20px;
	font-weight: 600;
	color: var(--mx-color-primary);
}

.page-tag {
	color: var(--mx-color-text-secondary);
	font-size: 12px;
}

.card {
	padding: 16px;
	background-color: var(--mx-color-bg-container);
	border: 1px solid var(--mx-color-border-split);
	border-radius: var(--mx-radius-lg);
}

.card h3 {
	margin: 0 0 12px;
	font-size: 14px;
	color: var(--mx-color-text-primary);
}

.card-btn {
	padding: 0 var(--mx-spacing-sm);
	border: 1px solid var(--mx-color-border-base);
	border-radius: var(--mx-radius-base);
	color: var(--mx-color-primary);
	background: var(--mx-color-bg-container);
	cursor: pointer;
}
</style>
