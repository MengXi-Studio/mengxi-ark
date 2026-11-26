# Lov 弹窗自定义 + DocumentTable 单元格级权限 实施方案

## 需求

处理 M2 / M3 任务文档最后两项遗留 TODO：

1. **Lov 自定义模板插槽复杂定制**——当前远程模式弹窗表格列硬编码为「名称 / 编码」两列，无单元格自定义能力；触发器已有默认插槽，保持不动。
2. **DocumentTable 单元格级粒度权限**——当前可编辑粒度仅到「列级布尔 editable」，需要支持单元格（行 × 列）级权限控制。

本任务只做这两项，**不做**：Lov 弹窗搜索区/标题的自定义插槽（标题已有 popupTitle prop、搜索行为固定）、DocumentTable 行级增删按钮的权限控制。

## 需求分析

- **涉及包**：仅 `packages/biz-components`（Lov props/slots 增量；DocumentTable 列契约与权限源增量）；`apps/demo-light` 两处演示；`apps/docs` lov.md / documenttable.md 各补示例节；单测；changesets 登记。
- **依赖边界**：components 层零改动（Lov 弹窗用的 DataTable bodyCell 槽 M3 已就绪；适配器无需扩展）；biz-components 权限源经既有 `useRuntimeContext()` 探测 `permissions` 字段（上下文契约 `MxRuntimeContext.permissions` 已存在），**禁止 import runtime**。
- **双模式契约**：权限字段全部支持 props 兜底——上下文 `permissions` ↔ DocumentTable props `permissions` 同名对应；上下文与 props 都缺失时自动降级（降级行为见疑问 Q3）。
- **现有基础**：
  - Lov：弹窗 DataTable 已支持 bodyCell 槽转发机制（M3 落地），仅 Lov 未向外暴露；`dialogColumns` 为硬编码 computed。
  - DocumentTable：`isEditableColumn` 仅查列级布尔；`validateRows`（adapter.ts）按列必填规则校验全量行。

## 伪代码设计

### 1. Lov 弹窗自定义（props 驱动优先，插槽兜底）

```ts
// packages/biz-components/src/Lov/types.ts 增量
export interface LovProps {
  // ... 既有 props 不变
  /** 弹窗表格列配置（覆盖默认「名称 / 编码」两列；列结构同 MxColumn） */
  columns?: MxColumn[];
}
// slots 增量（LovSlots 新建导出）
export interface LovSlots {
  /** 触发器自定义内容（既有默认插槽，显式声明） */
  default?: () => unknown;
  /** 弹窗表格单元格自定义渲染（作用域 { column, record, index }） */
  bodyCell?: (binding: { column: { dataIndex: string; title: string }; record: LovRow; index: number }) => unknown;
}
```

```ts
// Lov.vue 增量（伪代码）
const dialogColumns = computed<MxColumn[]>(() => props.columns ?? [
  { dataIndex: fieldNames.value.label, title: '名称' },
  { dataIndex: fieldNames.value.value, title: '编码' },
]);
// 弹窗 DataTable 增加 bodyCell 槽转发：
// <template v-if="$slots.bodyCell" #bodyCell="binding"><slot name="bodyCell" v-bind="binding" /></template>
```

### 2. DocumentTable 单元格级权限

```ts
// packages/biz-components/src/DocumentTable/types.ts 增量
export interface DocColumn {
  // ... 既有字段不变
  /** 列可编辑：布尔（列级）或函数（行级粒度，按行数据判定该行此列是否可编辑） */
  editable?: boolean | ((row: Record<string, unknown>) => boolean);
  /** 列级权限码：配置后需命中权限源才可编辑（编辑态渲染编辑器，否则渲染只读文本） */
  permissionCode?: string | string[];
}

export interface DocumentTableProps {
  // ... 既有 props 不变
  /** 权限码列表（props 兜底，与上下文 permissions 同名对应；上下文命中优先） */
  permissions?: string[];
}
```

```ts
// DocumentTable.vue 增量（伪代码）
// 权限源解析：上下文探测 → props 兜底 → 都缺失 = 无权限源
const permissionSource = computed<string[] | null>(
  () => ctx?.permissions ?? props.permissions ?? null,
);
const hasPermission = (code: string | string[] | undefined): boolean => {
  if (!code) return true;                       // 未配置 permissionCode 的列不受影响
  if (permissionSource.value === null) return permissionMissingFallback(); // 降级策略见 Q3
  const codes = Array.isArray(code) ? code : [code];
  return codes.some((c) => permissionSource.value!.includes(c)); // some 语义对齐 useAuth
};

// 单元格粒度判定（编辑器渲染条件收敛到一个函数）
const isCellEditable = (row, dataIndex) =>
  isEditableColumn(dataIndex) && hasPermission(columnOf(dataIndex)?.permissionCode)
  && resolveEditable(columnOf(dataIndex)?.editable, row); // 函数形态传 row

// validateRows 校验增量：无权限单元格跳过必填校验（防「必填列无权限 → 永远无法保存」死锁），
// adapter.ts validateRows 增加可选入参 skip?: (row, dataIndex) => boolean（见 Q4）
```

**依赖流向示意**：`useRuntimeContext()`（既有 inject 探测）→ 权限源 → `hasPermission` → `isCellEditable` → 编辑器渲染分支；components / hooks / runtime 零改动。

### 3. demo / docs / 测试

- demo-light：Lov 面板加「自定义弹窗列 + 单元格渲染」演示（如状态 Tag）；DocumentTable 面板加「单元格权限」演示（mock 基座上下文 permissions 控制部分列只读）。
- docs：lov.md 补「弹窗自定义」节、documenttable.md 补「单元格级权限」节（API 表增量 + 双模式示例）。
- 单测：Lov columns 覆盖默认列 / bodyCell 槽透传；DocumentTable 权限命中可编辑 / 无权限只读 / editable 函数形态 / 无权限列跳过必填校验。
- changeset：biz-components minor。

## 疑问清单

### Q1 Lov 自定义范围确认（影响：Lov API 面貌）
建议范围 = **columns prop（弹窗列覆盖）+ bodyCell 槽（单元格自定义）**；触发器已有默认插槽不动；弹窗标题已有 popupTitle prop、搜索区行为固定不提供插槽。是否认可？
回答：认可（2026-11-26 用户口头确认「按这个方案开始实现」，AI 转记）。

### Q2 单元格权限 API 形态确认（影响：DocColumn 契约）
建议三层组合：列级 `permissionCode`（命中任一权限码即可编辑，some 语义对齐 useAuth）+ 列级 `editable` 升级为 `boolean | ((row) => boolean)`（行级粒度由宿主函数判定）+ 权限源「上下文探测 → props.permissions 兜底」。无权限单元格**渲染只读文本**（不隐藏列），内容可用既有 bodyCell 槽定制。是否认可？
回答：认可（2026-11-26 用户口头确认「按这个方案开始实现」，AI 转记）。

### Q3 权限源缺失时的降级策略（影响：独立模式行为）
配置了 `permissionCode` 但上下文与 props 都未提供权限源时：
- 方案 a（推荐）：`console.warn` 一次并**视为有权限**（编辑开放）——独立模式不做权限拦截，避免配置遗漏导致业务不可编辑；
- 方案 b：视为无权限，单元格只读。
选哪个？
回答：方案 a（2026-11-26 用户口头确认「按这个方案开始实现」，AI 转记）。

### Q4 无权限单元格与必填校验的死锁处理（影响：validateRows）
若某必填列对当前用户无编辑权限，正常校验会导致「永远无法保存」。建议 validateRows 增加可选 `skip` 入参，跳过无权限单元格的必填校验。是否认可？
回答：认可（2026-11-26 用户口头确认「按这个方案开始实现」，AI 转记）。

### Q5 交付范围确认（影响：工作量边界）
demo-light 两处演示 + lov.md / documenttable.md 各补示例节 + 上述单测 + changeset（biz-components minor），确认？
回答：确认（2026-11-26 用户口头确认「按这个方案开始实现」，AI 转记）。

## 实施记录

### 方案落地形态（与伪代码设计的差异说明）

1. **LovSlots 已存在**：M2 落地时 types.ts 已导出 `LovSlots`（default 触发器插槽），本次仅增量添加 `bodyCell`；Lov.vue 未用 `defineSlots`（与 EnhanceTable 等组件一致，插槽类型契约由 types.ts 承载）。
2. **validateRows skip 落到调用侧**：`skip` 入参实现为「不可编辑单元格跳过」（`!isCellEditable(row, dataIndex)`），同时覆盖 permissionCode 无权限与 editable 函数返回 false 两种情况；`defineExpose.validate` 与 handleSave 使用同一 skip 口径。
3. **isEditableColumn 已删除**：原列级布尔判定函数被 `isCellEditable` 收敛取代（无其他调用点），避免双轨判定。
4. **权限源判定顺序**：`ctx?.permissions ?? props.permissions ?? null`——上下文探测命中优先（即使值比 props 少），与 Lov 的 lovListApi 优先级口径一致。
5. **demo 权限演示采用 props 兜底 + 勾选切换**：勾选 = `['doc:edit:count']`（命中可编辑），取消 = `[]`（权限源存在但不含 code → 只读），避免「权限源缺失降级」分支污染 demo console（该分支由单测覆盖）。

### 变更文件清单

**packages/biz-components**
- `src/Lov/types.ts`：LovProps 增加 `columns?: MxColumn[]`；LovSlots 增加 `bodyCell`。
- `src/Lov/Lov.vue`：`dialogColumns` 改为 props.columns 覆盖默认两列；弹窗 DataTable 增加 bodyCell 槽转发。
- `src/DocumentTable/types.ts`：头部注释更新；DocColumn 的 `editable` 升级为 `boolean | ((row) => boolean)`、新增 `permissionCode?: string | string[]`；DocumentTableProps 新增 `permissions?: string[]`。
- `src/DocumentTable/adapter.ts`：validateRows 增加可选 `skip` 入参（JSDoc 说明防死锁语义）。
- `src/DocumentTable/DocumentTable.vue`：删除 isEditableColumn；新增权限源解析 / hasPermission（缺失 warn 一次降级为有权限）/ isCellEditable；编辑器渲染与 validateRows skip 收敛到 isCellEditable。
- `src/Lov/__tests__/Lov.spec.ts`：新增「弹窗自定义」3 用例（默认两列 / columns 覆盖 / bodyCell 透传含作用域 record）。
- `src/DocumentTable/__tests__/DocumentTable.spec.ts`：新增「单元格级权限」6 用例（降级 warn / props 命中与未命中 / 上下文探测优先 some 语义 / editable 函数形态 / 无权限必填跳过 / validateRows skip 纯函数）。

**apps/demo-light**
- `src/demos/ComponentsDemo.vue`：Lov 面板增加「弹窗自定义」演示（columns 覆盖 + 状态列 bodyCell 标签）；DocumentTable 面板增加单元格权限演示（勾选切换 permissions，数量列 permissionCode）；新增 `lovCustomValue` ref 与状态标签样式（全部引用 --mx-* token）。

**apps/docs**
- `packages/lov.md`：新增「示例四：弹窗自定义」节 + LovProps 表补 columns + Slots 表补 bodyCell。
- `packages/documenttable.md`：新增「示例四：单元格级粒度权限」节 + Props 表补 permissions + 列配置表更新 editable 签名与 permissionCode。

**根目录**
- `.changeset/m4-lov-popup-custom-cell-permission.md`：biz-components minor 登记。

### 验证方式与结果

| 验证项 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 单元测试 | `pnpm turbo run test typecheck --filter=@mengxi-ark/biz-components` | 37 用例全部通过（Lov 20 + DocumentTable 17，本次新增 9） |
| 类型检查 | `pnpm turbo run typecheck` | 7/7 包通过 |
| 构建 | `pnpm turbo run build --filter=@mengxi-ark/biz-components`、demo-light build、docs build | ESM + .d.ts 完整；VitePress 死链检查通过 |
| 依赖门禁 | `pnpm deps:check && pnpm peer:check` | 均通过（85 文件） |
| 浏览器运行验证（demo-light） | browser_use 子代理实测 | Lov 弹窗自定义 3 项 PASS（自定义列头 / 状态彩色标签 / 弹窗关闭）；单元格权限 3 项 PASS（勾选可编辑 / 取消只读 / 恢复可编辑）；console 无 error |

**过程中修复**：demo 新增面板漏定义 `lovCustomValue` ref 导致 Vue warn，已补（typecheck/build 复过）。

### 遗留 TODO

无（M2 → M4 全部遗留 TODO 已闭环；组件层后续按 Roadmap 推进新能力）。
