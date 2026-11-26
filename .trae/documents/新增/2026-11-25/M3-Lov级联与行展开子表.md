# Lov 级联 + DocumentTable 行展开子表 实施方案

## 需求

处理 M2 任务文档遗留 TODO 1：**Lov 级联**（M2 时明确「级联 Lov、自定义模板插槽复杂定制放在后续的 M3 实现」）与 **DocumentTable 行展开子表**（「行展开子表、单元格级粒度权限放在后续的 M3 实现」）。本任务只做这两项，**不做**自定义模板插槽复杂定制与单元格级粒度权限。

## 需求分析

- **涉及包**：`packages/components`（adapter 统一契约扩展 expand 语义：types.ts / antdv.ts / element-plus.ts / stub-adapter.ts；EnhanceTable 透传）；`packages/biz-components`（Lov 级联 props；DocumentTable 透传展开槽）；`apps/demo-light`（两处演示）；`apps/docs`（lov.md / documenttable.md 补示例）；changesets 登记。
- **依赖边界**：components 层做通用 expand 契约（不感知 DocumentTable）；biz-components 只消费契约，无新增 import 方向；biz-components 对 runtime 仍仅 inject 探测。
- **UI 适配层**：expand 差异收敛在适配器——antdv 原生 expandedRowKeys / #expandedRowRender 槽；EP 需适配器内部追加 `type="expand"` 的 el-table-column + `expand-row-keys` 受控；两套实现同步落地，缺一视为未完成。
- **现有基础**：Lov 远程接口模式已有 `params` 变化 300ms 防抖重查（级联的「子随父刷新」天然成立，缺的只是「父值变化清空子值」与「父空禁用」语义）；DataTable 契约已有 bodyCell / empty 槽与 rowDblclick 事件，无 expand。

## 伪代码设计

### 1. Lov 级联（ Lov props 扩展，不新增组件）

```ts
// packages/biz-components/src/Lov/types.ts 增量
export interface LovProps {
  // ... 既有 props 不变
  /** 级联父级当前值：变化时清空自身选中值；为空（null/undefined/[]）时触发器禁用 */
  cascadeSource?: string | number | Array<string | number> | null;
}
// Lov.vue 增量（伪代码）
watch(() => props.cascadeSource, (val, old) => {
  if (val !== old) emit('update:modelValue', null); // 清空自身（change 同步抛空选项）
});
const cascadeDisabled = computed(() =>
  props.disabled || isEmptyCascade(props.cascadeSource)); // null / undefined / 空数组视为空
```

宿主用法（两级联）：父 Lov 正常绑定；子 Lov 同时绑 `:params="{ parentId: parentValue }"`（既有防抖重查）+ `:cascade-source="parentValue"`（清空 + 禁用语义）。

### 2. 统一契约 expand 语义（components 适配器层）

```ts
// packages/components/src/adapter/types.ts 增量
// DataTable 统一契约增加：
// props: expandedRowKeys?: Array<string | number> | undefined  （受控展开；undefined = 非受控不渲染展开列）
// emits: update:expandedRowKeys(keys)
// slots: expandedRow({ record, index })  —— 通用作用域槽，子表由业务在槽内组合
// antdv 实现：expandedRowKeys 透传 + expandedRowsChange → emit；#expandedRowRender 槽转发
// EP 实现：适配器内部插入 type="expand" 列（内容渲染 expandedRow 槽）；expand-row-keys 受控 + expand-change → emit
```

### 3. EnhanceTable / DocumentTable 透传

- EnhanceTable：props 增加 `expandedRowKeys`、emits 增加 `update:expandedRowKeys`、slots 增加 `expandedRow`（原样转发给适配器 DataTable）。
- DocumentTable：同上透传（展开行内嵌子 DocumentTable / EnhanceTable 由业务在槽内组合，**不做**一键子表模板）。

### 4. demo / docs / 测试

- demo-light：Lov 面板加「省 → 市」两级级联演示（mock api 按 parentId 过滤）；DocumentTable 面板加行展开子表演示（展开行内嵌迷你 DocumentTable）。
- docs：lov.md 补「级联用法」节、documenttable.md 补「行展开子表」节（附 API 表增量）。
- 单测：Lov cascadeSource 变化清空 / 父空禁用 / 不影响独立模式；EnhanceTable expandedRow 槽透传（stub 渲染标记）；DocumentTable 展开槽透传。
- changeset：components / biz-components 均 minor。

## 疑问清单

### Q1 级联实现形态（影响：Lov API 面貌）
建议 **Lov props 扩展**（`cascadeSource` 单 prop：变化清空自身 + 父空禁用），不新增 LovCascade 容器组件、不做多级编排组件——级联深度与布局交给宿主模板组合（扩展优先原则）。是否认可？
回答：认可。

### Q2 级联清空策略（影响：Lov 内部 watch 行为默认值）
- 父值**任何变化**（含被清空）都清空子值（推荐，防脏数据）；
- 父值为空时子触发器**禁用**（推荐，防无效请求）。
两条默认行为是否都认可？或某条改为可选配置（如 `cascadeClearOn?: 'any' | 'null'`）？
回答：认可。

### Q3 行展开契约形态（影响：统一契约 + 两 UI 库实现）
建议**通用作用域槽** `expandedRow({ record, index })` + 受控 `expandedRowKeys`（v-model），**不做**「一键子表模板」——子表内容（嵌 DocumentTable / EnhanceTable / 任意内容）由业务在槽内组合。是否认可？非受控展开（仅槽、不管 keys）是否也需要支持？
回答：认可。

### Q4 交付范围确认（影响：工作量边界）
demo-light 两处演示 + lov.md / documenttable.md 各补示例节 + 单测三项 + changeset 双包 minor，确认？
回答：确认。

## 实施记录

### 方案落地形态（与伪代码设计的差异说明）

1. **cascadeSource 的 undefined 语义**：伪代码中「null / undefined / 空数组视为空（父空禁用）」在实现时发现与向后兼容冲突——Vue 中「未传 prop」与「宿主绑定了 undefined」不可区分，若 undefined 视为父空则所有未配置级联的既有 Lov 用法都会被禁用（首次测试即暴露：Lov 远程模式既有用例因 cascadeDisabled 恒真而失败）。最终语义定为：**undefined = 未启用级联（不禁用、不清空）；传 null 或空数组 = 父级为空（禁用 + 变化清空）**。宿主绑定 ref 时建议以 null 初始化父值。已同步 lov.md 文档与 types.ts JSDoc。
2. **清空 emit 加了空值守卫**：伪代码 watch 中无条件 emit null；实现改为仅当自身当前有选中值时才 emit，避免宿主无值时的多余 update:modelValue / change 事件（配套单测「父值变化但自身无选中值时不产生多余 emit」）。
3. **expand 启用条件**：适配器层统一为 `expandedRowKeys !== undefined && expandedRow 槽存在` 才渲染展开列（antdv / EP / stub 三实现一致）；仅传槽不传 keys 不启用，与任务文档「undefined = 非受控不渲染展开列」一致。
4. **EP expandRowKeys 的 key 类型**：EP 的 row-key 经适配器已归一为字符串返回值，故 expand-row-keys 以 `map(String)` 匹配，统一契约的 number key 不受影响。
5. 其余（Lov 单 prop 扩展、通用作用域槽契约、EnhanceTable / DocumentTable 透传、demo / docs / changeset 范围）均按伪代码与 Q1–Q4 结论落地。

### 变更文件清单

**packages/components**
- `src/adapter/types.ts`：UiAdapter.DataTable 契约注释增加行展开受控语义。
- `src/adapter/antdv.ts`：AntdvDataTable 增加 expandedRowKeys prop / update:expandedRowKeys emit / expandedRow→expandedRowRender 槽映射。
- `src/adapter/element-plus.ts`：EpDataTable 增加 expand 支持（内部插入 type="expand" 列渲染 expandedRow 槽 + expand-row-keys 受控 + expand-change 回抛）。
- `src/adapter/__tests__/stub-adapter.ts`：StubDataTable 支持 expandedRow 槽渲染（标记类 `stub-datatable__expanded--<index>`）。
- `src/EnhanceTable/types.ts` + `src/EnhanceTable/EnhanceTable.vue`：透传 expandedRowKeys / update:expandedRowKeys / expandedRow 槽。
- `src/__tests__/components.spec.ts`：EnhanceTable 展开槽透传 + 未传 keys 不渲染 2 个用例。

**packages/biz-components**
- `src/Lov/types.ts`：LovProps 增加 cascadeSource。
- `src/Lov/Lov.vue`：watch(cascadeSource) 清空自身 + cascadeDisabled 禁用（静态下拉 / 触发器 / 清除按钮三处收敛）。
- `src/Lov/__tests__/Lov.spec.ts`：级联 5 个用例（父空禁用 / 变化清空 / 空值守卫 / 远程触发器禁用 / 不影响独立模式）。
- `src/DocumentTable/types.ts` + `src/DocumentTable/DocumentTable.vue`：透传 expandedRowKeys / update:expandedRowKeys / expandedRow 槽。
- `src/DocumentTable/__tests__/DocumentTable.spec.ts`：展开槽透传 + 未传 keys 不渲染 2 个用例。
- `src/__tests__/stub-adapter.ts`：与 components 侧同步扩展 StubDataTable。

**apps/demo-light**
- `src/demos/mock-api.ts`：新增 createMockRegionLovApi（省市级联 mock，带 parentId 过滤）。
- `src/demos/ComponentsDemo.vue`：Lov 面板增加省→市级联演示；DocumentTable 面板增加行展开子表演示（expandedRow 槽内嵌只读子单据表）。

**apps/docs**
- `packages/lov.md`：新增「示例三：级联用法」节 + LovProps 表补 cascadeSource。
- `packages/documenttable.md`：新增「示例三：行展开子表」节 + Props / Events / Slots 表补展开契约。

**根目录**
- `.changeset/m3-lov-cascade-row-expand.md`：双包 minor 登记。

### 验证方式与结果

| 验证项 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 单元测试 | `pnpm turbo run test --filter=@mengxi-ark/components --filter=@mengxi-ark/biz-components` | 54 用例全部通过（components 26 + biz-components 28） |
| 类型检查 | `pnpm turbo run typecheck` | 7/7 包通过 |
| 构建 | `pnpm turbo run build --filter=components --filter=biz-components` 及 demo-light / docs | ESM + .d.ts 产物完整，全部通过 |
| 依赖门禁 | `pnpm deps:check && pnpm peer:check` | 均通过（85 文件，无反向 import） |
| docs 构建 | `pnpm --filter docs build` | VitePress 构建通过（含死链检查） |
| 浏览器运行验证（demo-light） | browser_use 子代理实测 | Lov 级联 3 项 PASS（初始父空禁用 / 选省后启用 / 切省清空城市）；DocumentTable 行展开 3 项 PASS（d1 默认展开含子表 / d2 折叠可展开 / 无功能报错） |

已知非阻断项：antdv 库自身在「expandedRowRender 内嵌套 Table」场景会打印 deprecation warning（`expandedRowRender should not use with nested Table` / `expandIconColumnIndex is deprecated`），为 antdv 库内部行为，非本次变更引入的功能错误，无运行时影响。

### 追加修复：antdv 展开槽 deprecation warning（同日）

- **根因定位**（读 antdv 4.2.6 源码）：两条告警同根源——数据行的 `children` 数组字段被 antdv 当作树形嵌套数据（`expandType='nest'`）：① vc-table 检查 `record[childrenColumnName]` 为数组且存在 expandedRowRender 时告警「should not use with nested Table」；② expandType 为 nest 时 wrapper 强制 `expandIconColumnIndex=0`，useColumns 判 `>= 0` 告警「expandIconColumnIndex is deprecated」。
- **修复**：`AntdvDataTable` 启用行展开时传哑键 `childrenColumnName: '__mx_expand_no_nesting'`，禁用 antdv 树形嵌套语义——统一契约的行展开仅由受控 `expandedRowKeys` 驱动，契约层面本就不提供树形表格，此为正确语义而非规避手段。EP 无此告警，无需对应实现（antdv 库内部 dev warning 的收敛属适配器层职责）。
- **验证**：components typecheck + build 通过；demo 浏览器实测——行展开/折叠切换 4 次，console 无任何 warning / error（此前 4 条告警全部消除），展开内容渲染正常。
- **登记**：`.changeset/m3-antdv-expand-warning-fix.md`（components patch）。

### 遗留 TODO

- 单元格级粒度权限（M2 遗留 TODO 2，规划后续里程碑）。
- Lov 自定义模板插槽复杂定制（M2 遗留 TODO 3，规划后续里程碑）。
