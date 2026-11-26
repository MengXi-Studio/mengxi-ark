# Migration Guide

Three migration paths: moving native antdv / Element Plus projects onto MengXi Ark components, replacing hand-written boilerplate with hooks, and upgrading between beta.x versions. Before the official v1.0.0 release, all
breaking changes and migration steps are governed by the [release announcements in Discussions](https://github.com/MengXi-Studio/mengxi-ark/discussions).

## Migrating Native antdv / Element Plus Projects

### Aligned Common Prop Semantics

MengXi Ark component prop semantics (naming, types, defaults) align with the same-named components of the underlying UI libraries, minimizing migration effort:

| Common Prop | MengXi Ark Semantics               | Relation to UI Libraries                                                                                                                 |
| ----------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `size`      | `'sm' \| 'md' \| 'lg'`             | One unified three-level semantic, mapped to UI-library sizes through the adapter (antdv's large/default/small, EP's large/default/small) |
| `disabled`  | `boolean`                          | Same name, same meaning — carry over directly                                                                                            |
| `loading`   | `boolean`                          | Same name, same meaning; consistent across buttons / tables / query areas                                                                |
| `readonly`  | `boolean`                          | Same name, same meaning (a readonly Lov never opens the popup)                                                                           |
| `v-model`   | `modelValue` + `update:modelValue` | The Vue 3 standard convention, same as the UI libraries                                                                                  |

Two differences to note for table components: column config is unified as `MxColumn` (antdv's `dataIndex` and EP's `prop` both become `dataIndex`); pagination state is unified as `MxPaginationState`
(`current / size / total` + `onChange`), produced by [useTable](/en/api/hooks) instead of being hand-written.

### Adapter Choice & Injection

Component files never couple to any UI library directly; UI differences converge in the adapter layer. The default adapter is Ant Design Vue — inject the Element Plus adapter once and it takes effect globally:

```ts
import { createApp } from 'vue'
import { UI_ADAPTER_KEY, createElementPlusAdapter } from '@mengxi-ark/components'
import App from './App.vue'

const app = createApp(App)
app.provide(UI_ADAPTER_KEY, createElementPlusAdapter())
app.mount('#app')
```

> `UI_ADAPTER_KEY` / `createAntdvAdapter` / `createElementPlusAdapter` are all exported from the `@mengxi-ark/components` main entry; when using the Element Plus adapter you must install the `element-plus` dependency
> yourself. The base (runtime) also delivers the adapter via `UI_ADAPTER_KEY` — the business never needs to inject it twice.

### Mapping Between `--mx-*` and `--ant-*` / `--el-*`

The `adapters/antdv.scss` and `element-plus.scss` of `@mengxi-ark/theme` **map** UI-library variables **onto** `--mx-*` tokens (direction: UI-library variable values reference `--mx-*`), keeping visuals consistent:

```scss
/* theme/src/adapters/antdv.scss (excerpt) */
:root {
	--ant-primary-color: var(--mx-color-primary);
	--ant-success-color: var(--mx-color-success);
	--ant-text-color: var(--mx-color-text-primary);
	--ant-border-radius-base: var(--mx-radius-base);
}
```

Migration target: progressively replace hardcoded color values in your own stylesheets with semantic `var(--mx-*)` tokens; brand re-coloring only needs to override `--mx-color-primary` in one place, affecting both
UI-library and MengXi Ark components at once. UI-library variables not mapped in the adapters must not be consumed directly.

## Replacing Hand-Written Boilerplate with hooks

### useRequest Replaces Hand-Written axios loading / cancel / retry

Typical pre-migration boilerplate (repeated on every page that fetches):

```ts
// before migration: hand-written loading + race protection + cancel + retry
const loading = ref(false)
let seq = 0
async function fetchUser(id: number) {
	const current = ++seq // hand-written race protection
	loading.value = true
	try {
		const res = await axios.get(`/api/users/${id}`)
		if (current === seq) data.value = res.data // stale responses are discarded
	} catch (e) {
		// hand-written retry...
	} finally {
		loading.value = false
	}
}
```

After migration, one declarative call — race protection / cancel / retry / cleanup on unmount are all built in:

```ts
import { useRequest } from '@mengxi-ark/hooks'

const { data, loading, run, cancel, refresh, retry } = useRequest((id: number) => axios.get(`/api/users/${id}`).then(res => res.data), { retry: { count: 2, interval: 1000, backoff: true } })
```

Migration notes: the business still owns the request instance (axios / fetch wrapper) — the hook only takes over state and side effects; `immediate: false` disables the automatic first query; caching is enabled only with
an explicit `cacheKey` (no caching by default).

### useTable Replaces Hand-Written Pagination & Sorting State

Before migration you typically maintain six refs yourself — `current / pageSize / total / sortField / sortOrder / filters` — and merge them into request parameters by hand. After migration, state merging and reset are
all built in:

```ts
import { useTable } from '@mengxi-ark/hooks'

const { dataSource, loading, pagination, sort, filters, run, search, reset } = useTable(fetchUserPage, {
	defaultParams: { keyword: '' }
})
```

- The source receives the merged parameters: extra query conditions + `currentPage / pageSize` + `sortField / sortOrder` + `filters`, and returns `{ list, total }`;
- `search` returns to page 1 and queries with merged conditions; `reset` restores the default conditions, clears sorting and filters, and returns to page 1;
- The `pagination` structure feeds straight into the `pagination` prop of [EnhanceTable](/en/api/enhancetable), closing the loop with the `@page-change` event.

For a complete runnable example, see the [hooks API docs](/en/api/hooks) and `apps/demo-light/src/demos/HooksDemo.vue`.

## Upgrading from beta.x

- **Distribution**: beta versions (`1.0.0-beta.x`) ship under the npm `beta` dist-tag: `pnpm add @mengxi-ark/utils@beta`;
- **Beta-period API tweaks**: small API adjustments (renamed props, narrowed types, etc.) are allowed during the beta; every adjustment appears in the corresponding
  [release announcement in Discussions](https://github.com/MengXi-Studio/mengxi-ark/discussions) together with its migration steps;
- **Breaking-change conventions**: changes touching token defaults (theme), context fields (runtime), or breaking prop adjustments (components) are marked with `!` in the version and carry a `BREAKING CHANGE` note in the
  announcement footer;
- **Pre-release watch**: before the official `v1.0.0`, the announcement will list every breaking change since the beta plus a one-time migration checklist — subscribing to the "Release Notes" category of Discussions is
  recommended;
- **Context contract**: if your business consumes `MxRuntimeContext` fields directly, note that adding or removing contract fields is handled as a Major with a migration guide (see [Global Context](/en/platform/context)
  for details).

## Related References

- [Introduction](/en/guide/introduction): the full background of the layered architecture and design trade-offs;
- [API Reference](/en/api/utils): check the exported APIs one by one as you land the migration.
