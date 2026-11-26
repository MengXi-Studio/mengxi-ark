<script setup lang="ts">
import { computed, ref } from 'vue'
import { setAuthAdapter, useAuth, useI18n, useRequest, useTable } from '@mengxi-ark/hooks'
import type { PermissionCode, PermissionMode, TableQueryParams, TableSourceResult } from '@mengxi-ark/hooks'

// —— useI18n：实例在 main.ts 经 app.provide(MX_I18N_KEY) 下发，这里 inject 复用 ——
const { t, locale, setLocale } = useI18n()

// —— useRequest：mock 500ms 请求，可切换失败模式展示 error / retry ——
interface MockUser {
	id: number
	name: string
	role: string
}

const shouldFail = ref(false)

function fetchUser(): Promise<MockUser> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (shouldFail.value) {
				reject(new Error('模拟请求失败：网络异常'))
				return
			}
			resolve({ id: 1, name: '曦舟', role: '前端框架' })
		}, 500)
	})
}

const { data, error, loading, run, cancel, retry } = useRequest(fetchUser)

const requestErrorMessage = computed(() => (error.value instanceof Error ? error.value.message : String(error.value ?? '')))

// —— useAuth + v-permission：模块级 setAuthAdapter 注册权限源，勾选切换权限码 ——
const grantedCodes = ref<string[]>(['user:add', 'user:edit'])

setAuthAdapter({
	hasPermission: (code: PermissionCode, mode?: PermissionMode) => {
		const codes = Array.isArray(code) ? code : [code]
		const hits = codes.filter(item => grantedCodes.value.includes(item))
		return (mode ?? 'some') === 'every' ? hits.length === codes.length : hits.length > 0
	}
})

const { hasPermission } = useAuth()
const allCodes = ['user:add', 'user:edit', 'user:delete']

// —— useTable：mock 分页数据源（keyword 查询 + 分页 + 重置） ——
interface UserRow {
	id: number
	name: string
	dept: string
}

type UserQuery = { keyword: string }

const tableRows: UserRow[] = Array.from({ length: 23 }, (_, index) => ({
	id: index + 1,
	name: `成员 ${index + 1}`,
	dept: index % 2 === 0 ? '平台组' : '工具组'
}))

function fetchUserPage(params: TableQueryParams<UserQuery>): Promise<TableSourceResult<UserRow>> {
	return new Promise(resolve => {
		setTimeout(() => {
			const keyword = params.keyword.trim()
			const matched = keyword === '' ? tableRows : tableRows.filter(row => row.name.includes(keyword))
			const start = (params.currentPage - 1) * params.pageSize
			resolve({
				list: matched.slice(start, start + params.pageSize),
				total: matched.length
			})
		}, 300)
	})
}

const {
	dataSource,
	loading: tableLoading,
	pagination,
	search,
	reset
} = useTable(fetchUserPage, {
	defaultParams: { keyword: '' }
})

const keywordInput = ref('')

function submitSearch(): void {
	void search({ keyword: keywordInput.value })
}

function submitReset(): void {
	keywordInput.value = ''
	void reset()
}

function turnPage(current: number): void {
	pagination.onChange(current, pagination.size)
}
</script>

<template>
	<div class="stack">
		<section class="panel">
			<h3 class="panel-title">useRequest · 请求状态（loading / data / error / retry）</h3>
			<label class="check">
				<input v-model="shouldFail" type="checkbox" />
				<span> 模拟请求失败（shouldFail） </span>
			</label>
			<div class="row">
				<button class="btn btn--primary" type="button" :disabled="loading" @click="run()">重新请求 run()</button>
				<button class="btn" type="button" :disabled="loading" @click="cancel()">取消 cancel()</button>
				<button class="btn" type="button" :disabled="loading" @click="retry()">重试 retry()</button>
			</div>
			<p v-if="loading" class="hint">请求中…（500ms 延迟）</p>
			<p v-else-if="error" class="hint hint--danger">请求失败：{{ requestErrorMessage }}</p>
			<p v-else-if="data" class="hint hint--ok">请求成功：{{ data.name }}（{{ data.role }}）</p>
		</section>

		<section class="panel">
			<h3 class="panel-title">useAuth + v-permission · 权限判断与权限指令</h3>
			<div class="row">
				<label v-for="code in allCodes" :key="code" class="check">
					<input v-model="grantedCodes" type="checkbox" :value="code" />
					<span>
						{{ code }}
					</span>
				</label>
			</div>
			<div class="row">
				<button v-permission="'user:add'" class="btn btn--primary" type="button">新增（无权限时移除）</button>
				<button v-permission.disabled="'user:delete'" class="btn" type="button">删除（.disabled 修饰符，无权限时置灰）</button>
			</div>
			<p class="hint">hasPermission('user:add')：{{ hasPermission('user:add') }} · hasPermission(['user:add', 'user:delete'], 'every')：{{ hasPermission(['user:add', 'user:delete'], 'every') }}</p>
		</section>

		<section class="panel">
			<h3 class="panel-title">useTable · 查询 / 分页 / 重置</h3>
			<div class="row">
				<input v-model="keywordInput" class="input" type="text" placeholder="按姓名搜索" />
				<button class="btn btn--primary" type="button" :disabled="tableLoading" @click="submitSearch">查询 search()</button>
				<button class="btn" type="button" :disabled="tableLoading" @click="submitReset">重置 reset()</button>
			</div>
			<table class="table">
				<thead>
					<tr>
						<th>编号</th>
						<th>姓名</th>
						<th>部门</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in dataSource" :key="row.id">
						<td>
							{{ row.id }}
						</td>
						<td>
							{{ row.name }}
						</td>
						<td>
							{{ row.dept }}
						</td>
					</tr>
				</tbody>
			</table>
			<div class="row">
				<button class="btn btn--ghost" type="button" :disabled="tableLoading || pagination.current <= 1" @click="turnPage(pagination.current - 1)">上一页</button>
				<span class="hint"> 第 {{ pagination.current }} 页 / 共 {{ Math.ceil(pagination.total / pagination.size) || 1 }} 页 · 合计 {{ pagination.total }} 条 </span>
				<button class="btn btn--ghost" type="button" :disabled="tableLoading || pagination.current >= Math.ceil(pagination.total / pagination.size)" @click="turnPage(pagination.current + 1)">下一页</button>
			</div>
		</section>

		<section class="panel">
			<h3 class="panel-title">useI18n · 中英文切换（inject 复用 main.ts 的 provide）</h3>
			<p class="hint">{{ t('demo.currentLanguage') }}：{{ locale }}</p>
			<p class="output">
				{{ t('demo.greeting', { name: '曦舟' }) }}
			</p>
			<div class="row">
				<button class="btn" :class="locale === 'zh-CN' ? 'btn--primary' : ''" type="button" @click="setLocale('zh-CN')">中文</button>
				<button class="btn" :class="locale === 'en-US' ? 'btn--primary' : ''" type="button" @click="setLocale('en-US')">English</button>
			</div>
		</section>
	</div>
</template>
