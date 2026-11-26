# 全局上下文与双模式降级

runtime 经 `provide(MX_RUNTIME_CONTEXT_KEY, reactive(context))` 下发全局上下文；biz-components 组件 `inject` 探测同一键（`MX_RUNTIME_CONTEXT_KEY`，与 runtime **零 import 耦合**，仅共享契约类型）。这条契约同时兼容两种运行形态：

## 上下文字段与 props 兜底对应

| 上下文字段 | 组件 props 兜底 | 说明 |
| --- | --- | --- |
| `user` / `tenant` / `org` | — | 业务可直接 `useRuntimeContext()` 读取 |
| `permissions` | `permissions`（DocumentTable） | 权限源；上下文命中优先，缺失回退 props |
| `lovListApi` | `lovApi`（Lov） | 值集列表接口 |
| `lovCache` | `lovCache`（Lov） | 静态值集缓存（key 同值集编码） |

## 三级数据源解析

以 Lov 为例（DocumentTable 权限源同规则）：

1. **基座联动**：`lovCode` 命中 `context.lovCache` → 直接复用静态值集；
2. **基座接口联动**：缓存未命中 → 复用 `context.lovListApi`（防抖搜索 + 分页）；
3. **独立模式降级**：上下文缺失字段 → 回退同名 props（`lovApi` / `lovOptions` / `lovCache`）；全部缺失 → 空数据源空态，**不抛致命异常**。

组件内 `useRuntimeContext()` 探测失败返回 `undefined`，业务可据此判断当前形态。

## 降级切换验证

`apps/demo-platform` 的「降级切换演示」页在真实基座下回归该契约：开关控制子树 `provide(MX_RUNTIME_CONTEXT_KEY, {})`（模拟上下文丢失），观察：

- 子树内无 props 兜底的 Lov → 无数据源（独立模式空态）；
- 子树内传 `lovApi` props 的 Lov → 自动切独立模式正常自请求；
- 子树外 Lov → 不受影响，继续基座联动。

## 契约稳定性

- 探测键 `MX_RUNTIME_CONTEXT_KEY` 与字段集（`MxRuntimeContext`）由 biz-components 定义、runtime 扩展（`RuntimeContext` 增加 `appName` 等基座字段）；
- 上下文字段增删按破坏性变更走 **Major** 并附迁移说明；
- 未安装 runtime 时一切组件按独立模式工作，runtime 是纯增量依赖。
