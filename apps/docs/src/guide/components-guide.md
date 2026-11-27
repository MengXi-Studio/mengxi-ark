# 组件实战：五步渐进

本章用五个逐步叠加的步骤，带你从最简 props 用法一路走到基座联动。全部示例从可运行的 `apps/demo-light` / `apps/demo-platform` 工程提炼，复制即可运行；示例样式只引用 `--mx-*`
token。前置知识：[核心概念](/guide/core-concepts)。

每一步都遵循同一原则：**props 驱动优先，插槽兜底**——可配置项一律走 props，插槽只用于 props 覆盖不了的定制场景。

> **样式引入**：组件布局样式随包独立 css 产物（Vite lib mode 抽离，不自动注入），使用组件前需在应用入口引入一次：
>
> ```ts
> import '@mengxi-ark/components/style.css'
> import '@mengxi-ark/biz-components/style.css' // 使用 Lov / DocumentTable 时引入
> ```

## 第 1 步：最简用法（props 驱动 + 静态数据）

不接后端、不写请求，两个组件各传最少 props 即可渲染完整查询区与表格。SearchForm 内部自维护表单值，只需监听 `search` / `reset` 事件取值；EnhanceTable 直接吃静态数组。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SearchForm, EnhanceTable } from '@mengxi-ark/components'
import type { SearchField, MxColumn } from '@mengxi-ark/components'

const fields: SearchField[] = [
	{ name: 'keyword', label: '关键字', type: 'input', placeholder: '按姓名搜索' },
	{
		name: 'status',
		label: '状态',
		type: 'select',
		options: [
			{ label: '启用', value: '1' },
			{ label: '停用', value: '0' }
		]
	}
]

const columns: MxColumn[] = [
	{ dataIndex: 'id', title: '编号' },
	{ dataIndex: 'name', title: '姓名' },
	{ dataIndex: 'status', title: '状态' }
]

const dataSource = ref([
	{ id: 1, name: '曦舟', status: '启用' },
	{ id: 2, name: '梦曦', status: '停用' }
])

function handleSearch(values: Record<string, unknown>): void {
	console.log(values) // 未填项为 undefined，业务自行过滤
}
</script>

<template>
	<SearchForm :fields="fields" @search="handleSearch" />
	<EnhanceTable :columns="columns" :data-source="dataSource" />
</template>
```

**效果**：渲染一行查询字段 + 查询 / 重置按钮（字段数超过 3 个自动出现「展开 / 收起」），下方是带统一空状态（EmptyState）的表格。全程没有绑定任何 UI 库 API——`size` / `loading` 等通用 props 语义全库一致。

## 第 2 步：插槽自定义（props 覆盖不了的定制）

props 先行，插槽兜底。三类最常用插槽：

- `EnhanceTable` 的 `toolbar`（表格上方工具区）与 `bodyCell`（单元格自定义渲染，作用域 `{ column, record, index }`）；
- `SearchForm` 的 `extra`（额外自定义字段区域，渲染在按钮之前）。

```vue
<script setup lang="ts">
import { EnhanceTable } from '@mengxi-ark/components'
import type { MxColumn } from '@mengxi-ark/components'

const columns: MxColumn[] = [
	{ dataIndex: 'id', title: '编号' },
	{ dataIndex: 'name', title: '姓名' },
	{ dataIndex: 'status', title: '状态' }
]

const dataSource = [
	{ id: 1, name: '曦舟', status: '1' },
	{ id: 2, name: '梦曦', status: '0' }
]
</script>

<template>
	<EnhanceTable :columns="columns" :data-source="dataSource">
		<template #toolbar>
			<button class="demo-btn" type="button">新增</button>
			<span class="demo-hint">工具栏与查询区配合使用</span>
		</template>
		<template #bodyCell="{ column, record }">
			<span v-if="column.dataIndex === 'status'" class="demo-tag" :class="record.status === '1' ? 'is-on' : 'is-off'">
				{{ record.status === '1' ? '启用' : '停用' }}
			</span>
			<template v-else>{{ record[column.dataIndex] }}</template>
		</template>
	</EnhanceTable>
</template>

<style scoped>
.demo-btn {
	padding: 0 var(--mx-spacing-md);
	border: 1px solid var(--mx-color-border-base);
	border-radius: var(--mx-radius-base);
	color: var(--mx-color-text-primary);
	background: var(--mx-color-bg-container);
}

.demo-hint {
	margin-left: var(--mx-spacing-sm);
	color: var(--mx-color-text-secondary);
}

.demo-tag {
	display: inline-block;
	padding: 0 var(--mx-spacing-sm);
	border-radius: var(--mx-radius-round);
}

.demo-tag.is-on {
	color: var(--mx-color-success);
	background: var(--mx-color-bg-hover);
}

.demo-tag.is-off {
	color: var(--mx-color-text-secondary);
	background: var(--mx-color-bg-layout);
}
</style>
```

**效果**：工具栏出现在表格上方；状态列渲染为彩色标签，其余列保持默认文本渲染。`bodyCell` 未命中的列**必须**渲染默认内容（即 `record` 中以 `column.dataIndex` 取值的文本），否则该列会变空白。

## 第 3 步：Lov 独立模式（api + params 自请求）

Lov 是双模式业务组件。独立模式不依赖任何基座：传 `lovApi`（弹窗表格选择）或 `lovOptions`（静态下拉直选），组件内部自行请求。

- 接口约定：入参 `{ keyword, currentPage, pageSize, ...params }`；返回 `LovRow[]`（不分页）或 `{ list, total }`（分页）；
- `params` 变化时自动 300ms 防抖重新请求；
- 行数据 `label` / `value` 由 `fieldNames` 映射，不绑定后端固定字段。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Lov } from '@mengxi-ark/biz-components'
import type { MxColumn } from '@mengxi-ark/components'

const userId = ref<string | null>(null)
const selectedLabels = ref<string[]>([])

const USERS = [
	{ code: 'U01', name: '张三', status: '1' },
	{ code: 'U02', name: '李四', status: '0' },
	{ code: 'U03', name: '王五', status: '1' }
]

// 返回 { list, total } 即分页弹窗；返回数组即不分页
const userLovApi = async (params: Record<string, unknown>) => {
	const keyword = String(params.keyword ?? '').trim()
	const matched = keyword ? USERS.filter(row => row.name.includes(keyword)) : USERS
	const current = Number(params.currentPage) || 1
	const size = Number(params.pageSize) || 10
	return { list: matched.slice((current - 1) * size, current * size), total: matched.length }
}

// 级联：省 → 市。子级同时绑 params（数据刷新）与 cascadeSource（清空 / 禁用）
const province = ref<string | null>(null)
const city = ref<string | null>(null)

const REGIONS = [
	{ code: 'ZJ', name: '浙江省', parentId: null },
	{ code: 'HZ', name: '杭州市', parentId: 'ZJ' },
	{ code: 'NB', name: '宁波市', parentId: 'ZJ' }
]

const regionApi = async (params: Record<string, unknown>) => {
	return params.parentId === undefined ? REGIONS.filter(row => row.parentId === null) : REGIONS.filter(row => row.parentId === params.parentId)
}

// 弹窗自定义列
const popupColumns: MxColumn[] = [
	{ dataIndex: 'name', title: '用户名称' },
	{ dataIndex: 'status', title: '状态' }
]

function handleChange(_value: unknown, options: Array<{ label: string }>): void {
	selectedLabels.value = options.map(option => option.label)
}
</script>

<template>
	<!-- 接口模式：弹窗表格 + 防抖搜索 + 分页；columns 覆盖默认弹窗列，bodyCell 自定义单元格 -->
	<Lov v-model="userId" :lov-api="userLovApi" :field-names="{ label: 'name', value: 'code' }" :columns="popupColumns" placeholder="请选择用户" @change="handleChange">
		<template #bodyCell="{ column, record }">
			<template v-if="column.dataIndex === 'status'">
				<span class="demo-tag" :class="record.status === '1' ? 'is-on' : 'is-off'">
					{{ record.status === '1' ? '在职' : '离职' }}
				</span>
			</template>
			<template v-else>{{ record[column.dataIndex] }}</template>
		</template>
	</Lov>
	<p>选中：{{ selectedLabels.join('、') || '无' }}</p>

	<!-- 级联：父值任何变化清空子值；父级为空时子触发器禁用 -->
	<Lov v-model="province" :lov-api="regionApi" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择省份" />
	<Lov v-model="city" :lov-api="regionApi" :params="{ parentId: province }" :cascade-source="province" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择城市" />
</template>

<style scoped>
.demo-tag {
	display: inline-block;
	padding: 0 var(--mx-spacing-sm);
	border-radius: var(--mx-radius-round);
}

.demo-tag.is-on {
	color: var(--mx-color-success);
	background: var(--mx-color-bg-hover);
}

.demo-tag.is-off {
	color: var(--mx-color-text-secondary);
	background: var(--mx-color-bg-layout);
}
</style>
```

**效果**：接口模式点击输入框弹出表格选择弹窗（keyword 输入 300ms 防抖查询，弹窗列显示「用户名称 / 状态」）；级联场景先选省份，城市弹窗只查该省数据，切换省份后城市自动清空、省份清空后城市触发器禁用。`change`
事件抛出归一化选项（单选为单项数组），业务无需再反查行数据。

## 第 4 步：DocumentTable 行编辑（save 抛全量）

DocumentTable 在 EnhanceTable 能力之上叠加行编辑状态与字段校验。关键契约：**save 事件抛全量单据数据，组件不自带提交请求**（提交由业务在 `@save` 中自行处理）。

三层单元格可编辑性控制（全部函数化 / 声明式，逐列配置）：

1. **列级 `permissionCode`**（some 语义命中任一即可）：无权限单元格渲染只读文本，不隐藏列；
2. **列级 `editable` 函数化**：`boolean | (row) => boolean` 按行数据判定行级粒度；
3. **校验联动**：无权限 / 不可编辑的单元格自动跳过必填校验，防「必填列无权限 → 永远无法保存」死锁。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DocumentTable } from '@mengxi-ark/biz-components'
import type { DocColumn } from '@mengxi-ark/biz-components'

const columns: DocColumn[] = [
	{ dataIndex: 'name', title: '物料名称', editable: true, rules: [{ required: true, message: '物料名称不能为空' }] },
	// 数量列需 doc:edit:count 权限才可编辑（some 语义）
	{ dataIndex: 'count', title: '数量', editable: true, permissionCode: 'doc:edit:count', rules: [{ required: true }] },
	{
		dataIndex: 'unit',
		title: '单位',
		editable: true,
		editorType: 'select',
		editorOptions: [
			{ label: '件', value: 'PCS' },
			{ label: '箱', value: 'BOX' }
		],
		rules: [{ required: true, message: '单位不能为空' }]
	},
	// 行级粒度：仅「未锁定」行可编辑备注
	{ dataIndex: 'remark', title: '备注', editable: row => !row.locked }
]

// 独立模式：permissions props 兜底；基座联动模式下上下文 permissions 命中优先，无需此 prop
const permissions = ref(['doc:edit:count'])

const rows = ref<Array<Record<string, unknown>>>([
	{ id: 'd1', name: '机架服务器', count: 2, unit: 'BOX', remark: '', locked: false },
	{ id: 'd2', name: '网线', count: 10, unit: 'PCS', remark: '', locked: true }
])

function handleSave(allRows: Array<Record<string, unknown>>): void {
	// 全量单据数据交给业务提交（组件不自带请求）
	void submitDoc(allRows)
}

async function submitDoc(allRows: Array<Record<string, unknown>>): Promise<void> {
	console.log('提交单据：', allRows)
}
</script>

<template>
	<DocumentTable v-model="rows" :columns="columns" :permissions="permissions" row-key="id" @save="handleSave" />
</template>
```

**效果**：双击行或点「编辑」进入编辑态，名称为输入框、单位为下拉；无 `doc:edit:count`
权限时数量列渲染只读文本且保存时跳过其必填校验；锁定行（`locked: true`）的备注列不可编辑。校验失败时 save 被阻断（console.warn 一次）、错误文案行内标红，全部通过后才 emit
`save`。工具栏自带「新增行 / 删除行 / 保存」按钮（`addable` / `deletable` / `savable` 可关）。

## 第 5 步：基座联动（inject 自动接管）

前四步全部是独立模式。当项目安装了 `@mengxi-ark/runtime` 基座（详见 [中台进阶](/platform/)），组件经 `inject` 探测 `MX_RUNTIME_CONTEXT_KEY` 上下文后自动接管数据源，**业务代码一行不改**。基座安装后由 contextService
`provide` 上下文；以下用 mock provide 演示同一契约：

```vue
<script setup lang="ts">
import { provide, ref } from 'vue'
import { Lov, MX_RUNTIME_CONTEXT_KEY } from '@mengxi-ark/biz-components'
import type { MxRuntimeContext } from '@mengxi-ark/biz-components'

// 真实基座场景：runtime.install() 内部完成 provide；此处 mock 等价上下文
const context: MxRuntimeContext = {
	user: { id: 1, name: '曦舟' },
	permissions: ['doc:edit:count'],
	lovCache: {
		STATUS: [
			{ label: '启用', value: '1' },
			{ label: '停用', value: '0' }
		]
	},
	lovListApi: async () => [
		{ key: '1', label: '启用' },
		{ key: '0', label: '停用' }
	]
}

provide(MX_RUNTIME_CONTEXT_KEY, context)

const gender = ref<string | null>(null)
const status = ref<string | null>(null)
</script>

<template>
	<!-- lovCode 命中上下文 lovCache['STATUS']：静态下拉直选，不弹窗 -->
	<Lov v-model="gender" lov-code="STATUS" />
</template>
```

**与独立模式的差异点**：

| 维度       | 独立模式                                   | 基座联动模式                                       |
| ---------- | ------------------------------------------ | -------------------------------------------------- |
| 数据源     | `lovApi` / `lovOptions` / `lovCache` props | 上下文 `lovListApi` / `lovCache`（props 同名兜底） |
| 权限源     | `permissions` props（DocumentTable）       | 上下文 `permissions` 命中优先                      |
| 触发条件   | 传 props 即生效                            | `inject` 探测命中 `MX_RUNTIME_CONTEXT_KEY`         |
| 上下文丢失 | —                                          | 自动回退同名 props → 独立空态，不抛致命异常        |

真实基座下的运行验证见 `apps/demo-platform` 的「降级切换演示」页；上下文字段与 props 的对应关系详见 [全局上下文与双模式降级](/platform/context)。

## 相关参考

- [SearchForm API](/api/searchform) · [EnhanceTable API](/api/enhancetable)（第 1 / 2 步）
- [Lov API](/api/lov)（第 3 / 5 步） · [DocumentTable API](/api/documenttable)（第 4 步）
- 配合 hooks：[useTable](/api/hooks) 让第 1 步的静态数据升级为真实分页查询，参考 [SearchForm 文档示例二](/api/searchform)。
