# 迁移指南

三份迁移路径：从原生 antdv / Element Plus 项目迁移到曦舟组件、用 hooks 替代手写样板、以及 beta.x 版本间升级。正式 v1.0.0 发布前的全部 breaking 变更与迁移方式以 [Discussions 版本公告](https://github.com/MengXi-Studio/mengxi-ark/discussions)为准。

## 从原生 antdv / Element Plus 项目迁移

### 通用 props 语义对齐

曦舟组件的 props 语义（命名、类型、默认值）对齐底层 UI 库同名组件，迁移心智成本最低：

| 通用 props | 曦舟语义 | 与 UI 库的关系 |
| --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | 统一三档语义，经适配器映射到 UI 库尺寸（antdv 的 large/default/small、EP 的 large/default/small） |
| `disabled` | `boolean` | 同名同义，直接平移 |
| `loading` | `boolean` | 同名同义，按钮 / 表格 / 查询区一致 |
| `readonly` | `boolean` | 同名同义（Lov 只读不弹窗） |
| `v-model` | `modelValue` + `update:modelValue` | Vue 3 标准约定，与 UI 库一致 |

表格类组件注意两处差异：列配置统一为 `MxColumn`（antdv 的 `dataIndex` 与 EP 的 `prop` 统一为 `dataIndex`）；分页状态统一为 `MxPaginationState`（`current / size / total` + `onChange`），由 [useTable](/api/hooks) 产出，不再手写。

### 适配器选择与注入方式

组件文件不直接耦合任何 UI 库，UI 差异收敛在适配层。默认适配器为 Ant Design Vue，使用 Element Plus 时注入一次即可全局生效：

```ts
import { createApp } from 'vue';
import { UI_ADAPTER_KEY, createElementPlusAdapter } from '@mengxi-ark/components';
import App from './App.vue';

const app = createApp(App);
app.provide(UI_ADAPTER_KEY, createElementPlusAdapter());
app.mount('#app');
```

> `UI_ADAPTER_KEY` / `createAntdvAdapter` / `createElementPlusAdapter` 均为 `@mengxi-ark/components` 主入口导出；使用 Element Plus 适配器时需自行安装 `element-plus` 依赖。基座（runtime）同样经 `UI_ADAPTER_KEY` 下发适配器，无需业务重复注入。

### `--mx-*` 与 `--ant-*` / `--el-*` 的映射关系

`@mengxi-ark/theme` 的 `adapters/antdv.scss` 与 `element-plus.scss` 把 UI 库变量**映射到** `--mx-*` token（方向：UI 库变量取值引用 `--mx-*`），保证视觉一致：

```scss
/* theme/src/adapters/antdv.scss（节选） */
:root {
  --ant-primary-color: var(--mx-color-primary);
  --ant-success-color: var(--mx-color-success);
  --ant-text-color: var(--mx-color-text-primary);
  --ant-border-radius-base: var(--mx-radius-base);
}
```

迁移落点：业务自有样式表中的硬编码色值逐步替换为 `var(--mx-*)` 语义 token；品牌换色只需覆盖 `--mx-color-primary` 一处，UI 库组件与曦舟组件同时生效。未在 adapters 中映射的 UI 库变量不得直接消费。

## 用 hooks 替代手写样板

### useRequest 替代手写 axios loading / 取消 / 重试

典型迁移前样板（每个请求页都要重复一遍）：

```ts
// 迁移前：手写 loading + 竞态 + 取消 + 重试
const loading = ref(false);
let seq = 0;
async function fetchUser(id: number) {
  const current = ++seq;          // 手写竞态保护
  loading.value = true;
  try {
    const res = await axios.get(`/api/users/${id}`);
    if (current === seq) data.value = res.data;  // 旧响应丢弃
  } catch (e) {
    // 手写重试……
  } finally {
    loading.value = false;
  }
}
```

迁移后一行声明，竞态保护 / 取消 / 重试 / 卸载清理全部内置：

```ts
import { useRequest } from '@mengxi-ark/hooks';

const { data, loading, run, cancel, refresh, retry } = useRequest(
  (id: number) => axios.get(`/api/users/${id}`).then((res) => res.data),
  { retry: { count: 2, interval: 1000, backoff: true } },
);
```

迁移要点：请求实例（axios / fetch 封装）仍由业务持有，hook 只接管状态与副作用；`immediate: false` 可关闭自动首查；显式 `cacheKey` 才启用缓存，默认不缓存。

### useTable 替代手写分页排序状态

迁移前通常需要自维护 `current / pageSize / total / sortField / sortOrder / filters` 六个 ref，并手工合并进请求参数。迁移后状态合并与重置全部内置：

```ts
import { useTable } from '@mengxi-ark/hooks';

const { dataSource, loading, pagination, sort, filters, run, search, reset } = useTable(fetchUserPage, {
  defaultParams: { keyword: '' },
});
```

- source 接收合并后的参数：额外查询条件 + `currentPage / pageSize` + `sortField / sortOrder` + `filters`，返回 `{ list, total }`；
- `search` 回到第 1 页并合并条件查询；`reset` 恢复默认条件、清空排序筛选并回到第 1 页；
- `pagination` 结构直接传给 [EnhanceTable](/api/enhancetable) 的 `pagination` prop，与 `@page-change` 事件闭环。

完整可运行示例见 [hooks API 文档](/api/hooks)与 `apps/demo-light/src/demos/HooksDemo.vue`。

## 从 beta.x 升级

- **分发方式**：Beta 版本（`1.0.0-beta.x`）经 npm `beta` dist-tag 分发：`pnpm add @mengxi-ark/utils@beta`；
- **Beta 期 API 微调**：beta 期间允许小范围 API 调整（重命名 prop、收窄类型等），每次调整都会出现在对应 Release 的 [Discussions 版本公告](https://github.com/MengXi-Studio/mengxi-ark/discussions)中，并附迁移方式；
- **破坏性变更约定**：涉及 token 默认值（theme）、上下文字段增删（runtime）、props 破坏性调整（组件）的变更，版本号带 `!` 标记并在公告 footer 附 `BREAKING CHANGE` 说明；
- **正式版前哨**：正式 `v1.0.0` 发布前会在公告中列明自 beta 以来的全部 breaking 变更与一次性迁移清单，建议订阅 Discussions 的「版本公告」分类；
- **上下文契约**：若业务直接消费 `MxRuntimeContext` 字段，注意该契约字段增删按 Major 处理并附迁移说明（详见 [全局上下文](/platform/context)）。

## 相关参考

- [介绍](/guide/introduction)：分层架构与设计取舍的完整背景；
- [API 手册](/api/utils)：迁移落地时逐项核对导出 API。
