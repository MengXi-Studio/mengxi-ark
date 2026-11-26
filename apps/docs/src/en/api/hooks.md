# @mengxi-ark/hooks

General composables package: depends only on the Vue ecosystem (peerDependencies: vue / pinia / vue-router), runs in standalone mode, ready to use right after installation. Every hook's `options` is always an object with
all-optional fields; cleanup happens automatically on unmount (calls outside components skip cleanup without throwing).

## Use Cases

**When to use**: request state management (loading / race protection / cancel / retry / caching) → useRequest; paged / sorted / filtered table query state → useTable; permission checks for buttons and page blocks →
useAuth + v-permission; lightweight token storage and refresh scheduling → useSession; message internationalization → useI18n; form value echo / reset / validation wrapping → useForm.

**When not to use**: query areas / tables with a UI form (leave them to [components](/en/api/searchform) — hooks manage state only); hardcoding business API endpoints or dictionaries inside hooks (request instances and
data sources are always injected by the business); route-navigation logic (hooks never hijack native router APIs — guards are registered by the business or the base).

```bash
pnpm add @mengxi-ark/hooks
```

## Hook Overview

| Hook       | Signature                                                                                                              | Core options                                                                                                                 | Returns                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| useRequest | `useRequest<T, P>(source: (params: P) => Promise<T>, options?: UseRequestOptions<T, P>)`                               | `immediate` (default true), `cacheKey` (no caching by default), `retry` (count / interval / backoff), `onSuccess`, `onError` | `data / error / loading / run / cancel / refresh / retry`                                          |
| useAuth    | `useAuth(adapter?: AuthAdapter, options?: UseAuthOptions)`                                                             | `silentWarn` (fallback warning, default false)                                                                               | `hasPermission(code, mode?)`; plus `setAuthAdapter` and the `vPermission` directive                |
| useSession | `useSession(options?: UseSessionOptions)`                                                                              | `storage` (localStorage / cookie), `autoRefreshInterval` (default 0), `refreshFn`, `onSessionExpired`                        | `token / getToken / setToken / clearToken / startAutoRefresh / stopAutoRefresh`                    |
| useI18n    | `useI18n(instance?: I18nInstance)`                                                                                     | Create the instance via `createI18n({ messages, locale?, fallbackLocale? })`, then `app.provide(MX_I18N_KEY, instance)`      | `locale / t / setLocale`; degrades to a default instance when none is detected (t returns the key) |
| useTable   | `useTable<T, P>(source: (params: TableQueryParams<P>) => Promise<TableSourceResult<T>>, options?: UseTableOptions<P>)` | `defaultParams`, `pageSize` (default 10), `immediate` (default true)                                                         | `dataSource / loading / error / pagination / sort / filters / run / search / reset`                |
| useForm    | `useForm<T extends Record<string, unknown>>(options?: UseFormOptions<T>)`                                              | `initialValues`, `rules`                                                                                                     | `values / errors / setFieldsValue / getFieldValue / resetFields / validate`                        |

## useRequest Example

Built-in race protection (stale responses are discarded), cancel and retry; the request instance is injected by the business — the hook binds to no backend fields:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRequest } from '@mengxi-ark/hooks'

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
</script>

<template>
	<p v-if="loading">请求中…</p>
	<p v-else-if="error">请求失败：{{ requestErrorMessage }}</p>
	<p v-else-if="data">请求成功：{{ data.name }}（{{ data.role }}）</p>
	<button :disabled="loading" type="button" @click="retry()">重试 retry()</button>
</template>
```

Automatic retry on failure: `useRequest(fetchUser, { retry: { count: 2, interval: 1000, backoff: true } })`.

## useAuth + v-permission Example

Permission-check fallback chain: explicit adapter → inject probing → a module-level source registered via `setAuthAdapter` → safe default (`hasPermission` always false) with a single warning (disable it with
`silentWarn: true`). The `v-permission` directive cannot inject, so it can only read the permission source registered via `setAuthAdapter`; registering once at application initialization is enough:

```ts
import { setAuthAdapter, vPermission } from '@mengxi-ark/hooks'

setAuthAdapter({
	hasPermission: (code, mode = 'some') => {
		const codes = Array.isArray(code) ? code : [code]
		const granted = ['user:add', 'user:edit']
		const hits = codes.filter(item => granted.includes(item))
		return mode === 'every' ? hits.length === codes.length : hits.length > 0
	}
})
```

```ts
const app = createApp(App)

app.directive('permission', vPermission) // register the v-permission directive
```

```vue
<template>
	<!-- removes the element from the DOM when unauthorized (reinserted in place once permission is granted) -->
	<button v-permission="'user:add'" type="button">新增</button>
	<!-- the .disabled modifier: grays out instead of removing when unauthorized -->
	<button v-permission.disabled="'user:delete'" type="button">删除</button>
</template>
```

```vue
<script setup lang="ts">
import { useAuth } from '@mengxi-ark/hooks'

const { hasPermission } = useAuth()

hasPermission('user:add') // true
hasPermission(['user:add', 'user:delete'], 'every') // false: every mode requires all codes to match
</script>
```

## useI18n Example

```ts
import { MX_I18N_KEY, createI18n } from '@mengxi-ark/hooks'

const i18n = createI18n({
	locale: 'zh-CN',
	fallbackLocale: 'zh-CN',
	messages: {
		'zh-CN': { demo: { greeting: '你好，{name}！' } },
		'en-US': { demo: { greeting: 'Hello, {name}!' } }
	}
})

app.provide(MX_I18N_KEY, i18n)
```

```vue
<script setup lang="ts">
import { useI18n } from '@mengxi-ark/hooks'

const { t, locale, setLocale } = useI18n()
</script>

<template>
	<p>
		{{ t('demo.greeting', { name: '曦舟' }) }}
	</p>
	<button type="button" @click="setLocale('en-US')">English</button>
</template>
```

## useTable Example

Query parameter merging = extra filters + pagination (currentPage / pageSize) + sorting (sortField / sortOrder) + filters; data is fetched asynchronously from the business-injected source:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTable } from '@mengxi-ark/hooks'
import type { TableQueryParams, TableSourceResult } from '@mengxi-ark/hooks'

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
</script>

<template>
	<input v-model="keywordInput" type="text" placeholder="按姓名搜索" />
	<button :disabled="tableLoading" type="button" @click="search({ keyword: keywordInput })">查询 search()</button>
	<button :disabled="tableLoading" type="button" @click="reset()">重置 reset()</button>
	<table>
		<tbody>
			<tr v-for="row in dataSource" :key="row.id">
				<td>{{ row.id }}</td>
				<td>{{ row.name }}</td>
				<td>{{ row.dept }}</td>
			</tr>
		</tbody>
	</table>
	<button type="button" @click="pagination.onChange(pagination.current - 1, pagination.size)">上一页</button>
	<button type="button" @click="pagination.onChange(pagination.current + 1, pagination.size)">下一页</button>
</template>
```

Notes: the source returns `{ list, total }`; `search` returns to page 1 and queries with merged conditions; `pagination.onChange` follows the antdv onChange semantics and re-queries automatically on page change; `reset`
restores the default conditions, clears sorting and filters, and returns to page 1.

## Related Tutorials

- [Core Concepts](/en/guide/core-concepts): the common hooks conventions (the `(source, options?)` signature, automatic cleanup on unmount, switchable default behaviors, the three-level permission-source fallback);
- [Migration Guide](/en/guide/migration): replacing hand-written axios and pagination-state boilerplate with useRequest / useTable.
