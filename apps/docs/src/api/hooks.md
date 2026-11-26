# @mengxi-ark/hooks

通用组合式函数包：仅依赖 Vue 生态（peerDependencies：vue / pinia / vue-router），独立模式运行，安装即用。所有 hook 的 `options` 恒为对象且字段全部可选；卸载时自动清理（组件外调用跳过清理，不报错）。

## 适用场景

**何时用**：需要请求状态管理（loading / 竞态 / 取消 / 重试 / 缓存）用 useRequest；分页 / 排序 / 筛选的表格查询状态用 useTable；按钮与页面块的权限判断用 useAuth + v-permission；轻量 token 存取与刷新调度用 useSession；文案国际化用 useI18n；表单回显 / 重置 / 校验封装用 useForm。

**何时不用**：需要 UI 形态的查询区 / 表格（交给 [components](/api/searchform)，hooks 只管状态）；需要在 hook 内写死业务接口地址或字典（请求实例与数据源一律由业务注入）；路由跳转逻辑（hook 不劫持路由原生 API，守卫交给业务或基座注册）。

```bash
pnpm add @mengxi-ark/hooks
```

## Hook 概览

| Hook | 签名 | 核心 options | 返回值 |
| --- | --- | --- | --- |
| useRequest | `useRequest<T, P>(source: (params: P) => Promise<T>, options?: UseRequestOptions<T, P>)` | `immediate`（默认 true）、`cacheKey`（默认不缓存）、`retry`（count / interval / backoff）、`onSuccess`、`onError` | `data / error / loading / run / cancel / refresh / retry` |
| useAuth | `useAuth(adapter?: AuthAdapter, options?: UseAuthOptions)` | `silentWarn`（降级警告，默认 false） | `hasPermission(code, mode?)`；配套 `setAuthAdapter`、`vPermission` 指令 |
| useSession | `useSession(options?: UseSessionOptions)` | `storage`（localStorage / cookie）、`autoRefreshInterval`（默认 0）、`refreshFn`、`onSessionExpired` | `token / getToken / setToken / clearToken / startAutoRefresh / stopAutoRefresh` |
| useI18n | `useI18n(instance?: I18nInstance)` | 经 `createI18n({ messages, locale?, fallbackLocale? })` 创建实例后 `app.provide(MX_I18N_KEY, instance)` | `locale / t / setLocale`；未探测到实例时降级为默认实例（t 返回 key） |
| useTable | `useTable<T, P>(source: (params: TableQueryParams<P>) => Promise<TableSourceResult<T>>, options?: UseTableOptions<P>)` | `defaultParams`、`pageSize`（默认 10）、`immediate`（默认 true） | `dataSource / loading / error / pagination / sort / filters / run / search / reset` |
| useForm | `useForm<T extends Record<string, unknown>>(options?: UseFormOptions<T>)` | `initialValues`、`rules` | `values / errors / setFieldsValue / getFieldValue / resetFields / validate` |

## useRequest 示例

内置竞态保护（旧响应丢弃）、取消与重试；请求实例由业务注入，hook 不绑定任何后端字段：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRequest } from '@mengxi-ark/hooks';

interface MockUser {
  id: number;
  name: string;
  role: string;
}

const shouldFail = ref(false);

function fetchUser(): Promise<MockUser> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail.value) {
        reject(new Error('模拟请求失败：网络异常'));
        return;
      }
      resolve({ id: 1, name: '曦舟', role: '前端框架' });
    }, 500);
  });
}

const { data, error, loading, run, cancel, retry } = useRequest(fetchUser);

const requestErrorMessage = computed(() =>
  error.value instanceof Error ? error.value.message : String(error.value ?? ''),
);
</script>

<template>
  <p v-if="loading">
    请求中…
  </p>
  <p v-else-if="error">
    请求失败：{{ requestErrorMessage }}
  </p>
  <p v-else-if="data">
    请求成功：{{ data.name }}（{{ data.role }}）
  </p>
  <button :disabled="loading" type="button" @click="retry()">
    重试 retry()
  </button>
</template>
```

失败自动重试：`useRequest(fetchUser, { retry: { count: 2, interval: 1000, backoff: true } })`。

## useAuth + v-permission 示例

权限判断降级链：显式传入 adapter → inject 探测 → `setAuthAdapter` 模块级注册源 → 安全默认（`hasPermission` 恒为 false）并警告一次（`silentWarn: true` 可关）。
`v-permission` 指令无法 inject，只能读取 `setAuthAdapter` 注册的权限源，应用初始化时注册一次即可：

```ts
import { setAuthAdapter, vPermission } from '@mengxi-ark/hooks';

setAuthAdapter({
  hasPermission: (code, mode = 'some') => {
    const codes = Array.isArray(code) ? code : [code];
    const granted = ['user:add', 'user:edit'];
    const hits = codes.filter((item) => granted.includes(item));
    return mode === 'every' ? hits.length === codes.length : hits.length > 0;
  },
});
```

```ts
const app = createApp(App);

app.directive('permission', vPermission); // 注册 v-permission 指令
```

```vue
<template>
  <!-- 无权限时从 DOM 移除元素（权限恢复后自动插回原位） -->
  <button v-permission="'user:add'" type="button">
    新增
  </button>
  <!-- .disabled 修饰符：无权限时置灰而非移除 -->
  <button v-permission.disabled="'user:delete'" type="button">
    删除
  </button>
</template>
```

```vue
<script setup lang="ts">
import { useAuth } from '@mengxi-ark/hooks';

const { hasPermission } = useAuth();

hasPermission('user:add'); // true
hasPermission(['user:add', 'user:delete'], 'every'); // false：every 模式需全部满足
</script>
```

## useI18n 示例

```ts
import { MX_I18N_KEY, createI18n } from '@mengxi-ark/hooks';

const i18n = createI18n({
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': { demo: { greeting: '你好，{name}！' } },
    'en-US': { demo: { greeting: 'Hello, {name}!' } },
  },
});

app.provide(MX_I18N_KEY, i18n);
```

```vue
<script setup lang="ts">
import { useI18n } from '@mengxi-ark/hooks';

const { t, locale, setLocale } = useI18n();
</script>

<template>
  <p>
    {{ t('demo.greeting', { name: '曦舟' }) }}
  </p>
  <button type="button" @click="setLocale('en-US')">
    English
  </button>
</template>
```

## useTable 示例

查询参数合并 = 额外查询条件 + 分页（currentPage / pageSize）+ 排序（sortField / sortOrder）+ 筛选（filters）；数据由业务注入的 source 异步获取：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTable } from '@mengxi-ark/hooks';
import type { TableQueryParams, TableSourceResult } from '@mengxi-ark/hooks';

interface UserRow {
  id: number;
  name: string;
  dept: string;
}

type UserQuery = { keyword: string };

const tableRows: UserRow[] = Array.from({ length: 23 }, (_, index) => ({
  id: index + 1,
  name: `成员 ${index + 1}`,
  dept: index % 2 === 0 ? '平台组' : '工具组',
}));

function fetchUserPage(params: TableQueryParams<UserQuery>): Promise<TableSourceResult<UserRow>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const keyword = params.keyword.trim();
      const matched =
        keyword === '' ? tableRows : tableRows.filter((row) => row.name.includes(keyword));
      const start = (params.currentPage - 1) * params.pageSize;
      resolve({
        list: matched.slice(start, start + params.pageSize),
        total: matched.length,
      });
    }, 300);
  });
}

const { dataSource, loading: tableLoading, pagination, search, reset } = useTable(fetchUserPage, {
  defaultParams: { keyword: '' },
});

const keywordInput = ref('');
</script>

<template>
  <input v-model="keywordInput" type="text" placeholder="按姓名搜索" />
  <button :disabled="tableLoading" type="button" @click="search({ keyword: keywordInput })">
    查询 search()
  </button>
  <button :disabled="tableLoading" type="button" @click="reset()">
    重置 reset()
  </button>
  <table>
    <tbody>
      <tr v-for="row in dataSource" :key="row.id">
        <td>{{ row.id }}</td>
        <td>{{ row.name }}</td>
        <td>{{ row.dept }}</td>
      </tr>
    </tbody>
  </table>
  <button type="button" @click="pagination.onChange(pagination.current - 1, pagination.size)">
    上一页
  </button>
  <button type="button" @click="pagination.onChange(pagination.current + 1, pagination.size)">
    下一页
  </button>
</template>
```

说明：source 返回 `{ list, total }`；`search` 回到第 1 页并合并条件查询；`pagination.onChange` 为 antdv onChange 语义，翻页自动重新查询；`reset` 恢复默认条件、清空排序筛选并回到第 1 页。

## 相关教程

- [核心概念](/guide/core-concepts)：hooks 通用约定（`(source, options?)` 签名、卸载自动清理、默认行为可关闭、权限源三级降级）；
- [迁移指南](/guide/migration)：用 useRequest / useTable 替代手写 axios 与分页状态样板。
