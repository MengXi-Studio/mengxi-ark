# Lov 值集选择器

`@mengxi-ark/biz-components` 双模式组件：封装「弹窗表格选择」交互范式，不绑定后端固定字段。行数据 `label` / `value` 由 `fieldNames` 映射，行 key 从 `fieldNames.value` 取。

## 适用场景

**何时用**：值集 / 主数据选择（用户、部门、组织、字典项等）——接口模式弹窗表格选，静态值集下拉直选；省市区等级联选择（cascadeSource）；需要防抖搜索 + 分页的标准选择器；同一组件要在「有基座 / 无基座」两种环境复用。

**何时不用**：选项固定且数量极少（两三个按钮 / radio 更直接）；需要在弹窗内做复杂多步操作（Lov 弹窗只做选择，复杂交互手写 SFC + Dialog）；树形层级选择（适配器提供 TreeSelect 原子能力，业务组合使用）。

```bash
pnpm add @mengxi-ark/biz-components
```

## 两种运行模式

| 模式         | 触发条件                                                            | 数据来源                                              |
| ------------ | ------------------------------------------------------------------- | ----------------------------------------------------- |
| 静态值集模式 | 有 `lovCode` 且命中上下文 / props 的值集缓存，或直接传 `lovOptions` | 下拉直选（Select），不弹窗                            |
| 远程接口模式 | 有 `lovApi`（props）或上下文 `lovListApi`                           | 弹窗表格 + 关键字搜索 + 分页，keyword 输入 300ms 防抖 |

解析优先级：**上下文 → props → 独立空态**。基座未安装或上下文丢失时自动切独立模式（console.warn 一次），不抛异常。

接口约定：入参 `{ keyword, currentPage, pageSize, ...params }`；返回 `LovRow[]`（不分页）或 `{ list, total }`（分页）。

## 示例一：独立模式（不需要任何基座）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Lov } from '@mengxi-ark/biz-components'
import type { LovOption, LovRow } from '@mengxi-ark/biz-components'

const value = ref<string | number | null>(null)
const selectedOptions = ref<LovOption[]>([])

interface UserRow {
	code: string
	name: string
}

// 接口模式：返回 { list, total } 即分页，返回数组即不分页
const userLovApi = async (params: Record<string, unknown>) => {
	const rows: UserRow[] = [
		{ code: 'U01', name: '用户1' },
		{ code: 'U02', name: '用户2' }
	]
	const keyword = String(params.keyword ?? '').trim()
	const matched = keyword ? rows.filter(row => row.name.includes(keyword)) : rows
	const start = ((Number(params.currentPage) || 1) - 1) * (Number(params.pageSize) || 10)
	return { list: matched.slice(start, start + Number(params.pageSize || 10)), total: matched.length }
}

// 静态值集模式： lovCode + lovCache（或 lovOptions）
const genderOptions: LovOption[] = [
	{ label: '男', value: '1' },
	{ label: '女', value: '2' }
]
</script>

<template>
	<!-- 接口模式：弹窗表格选择 -->
	<Lov v-model="value" :lov-api="userLovApi" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择用户" @change="(_v, options) => (selectedOptions = options)" />
	<p>选中：{{ selectedOptions.map(o => o.label).join('、') }}</p>

	<!-- 静态值集模式：下拉直选 -->
	<Lov v-model="gender" lov-code="GENDER" :lov-options="genderOptions" />
</template>
```

`params` 变化时自动防抖重新请求：`<Lov v-model="value" :lov-api="userLovApi" :params="{ orgId }" />`。

## 示例二：基座联动模式（inject 探测 runtime 上下文）

Lov 不 import runtime，只通过 `MX_RUNTIME_CONTEXT_KEY` inject 探测；探测成功自动复用上下文的 `lovListApi` / 值集缓存。以下用 mock provide 演示（runtime 基座安装后由 contextService 下发同一契约）：

```vue
<script setup lang="ts">
import { provide } from 'vue'
import { Lov, MX_RUNTIME_CONTEXT_KEY } from '@mengxi-ark/biz-components'
import type { LovOption, LovRow } from '@mengxi-ark/biz-components'
import type { MxRuntimeContext } from '@mengxi-ark/biz-components'

// 基座场景：runtime.install() 内部 provide；此处 mock 等价上下文
const mockContext: MxRuntimeContext = {
	user: { id: 1, name: '曦舟' },
	permissions: ['user:add'],
	lovListApi: async (params: Record<string, unknown>): Promise<LovRow[]> => {
		// 上下文 lovListApi 通常不接收分页，返回全量数组（Lov 内部不分页直选或自行截取）
		return [
			{ key: '1', label: '启用' },
			{ key: '0', label: '停用' }
		]
	},
	lovCache: {
		GENDER: [
			{ label: '男', value: '1' },
			{ label: '女', value: '2' }
		] as LovOption[]
	}
}

provide(MX_RUNTIME_CONTEXT_KEY, mockContext)

const status = ref<string | number | null>(null)
const gender = ref<string | number | null>(null)

// props 兜底：上下文 lovCache 未含 STATUS 时生效
const statusLovApi = async (params: Record<string, unknown>): Promise<LovRow[]> => {
	return [
		{ key: '1', label: '启用' },
		{ key: '0', label: '停用' }
	]
}
</script>

<template>
	<!-- 命中上下文 lovCache['GENDER']，静态下拉直选 -->
	<Lov v-model="gender" lov-code="GENDER" />
	<!-- 上下文无该值集缓存时回退 lovApi props -->
	<Lov v-model="status" lov-code="STATUS" :lov-api="statusLovApi" :field-names="{ label: 'label', value: 'key' }" />
</template>
```

上下文丢失（基座未安装 / 字段缺失）自动降级：`lovListApi` 缺失时回退 `lovApi` props，都缺失则渲染空态并警告一次。与 demo-light「Lov 基座联动」面板的降级切换开关行为一致。

## 示例三：级联用法（cascadeSource）

级联不引入容器组件：子 Lov 同时绑两处——`:params="{ parentId: 父值 }"`（既有防抖重查，子随父刷新）+ `:cascade-source="父值"`（父值变化清空子值 / 父空禁用）。级联深度与布局由宿主模板自由组合。

两条默认行为：

1. **父值任何变化（含被清空）即清空子值**，`change` 同步抛空选项，防脏数据；
2. **父级为空（传 `null` 或空数组）时子触发器禁用**，防无效请求。未传（`undefined`）视为未启用级联，不影响既有用法。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Lov } from '@mengxi-ark/biz-components'

const province = ref<string | null>(null)
const city = ref<string | null>(null)

const regionApi = async (params: Record<string, unknown>) => {
	// 带 parentId 时返回该省的市级列表；parentId 为 null 返回空；不带时返回省级
	const rows = params.parentId ? REGIONS.filter(r => r.parentId === params.parentId) : REGIONS.filter(r => r.parentId === null)
	return rows
}
const REGIONS = [
	{ code: 'ZJ', name: '浙江省', parentId: null },
	{ code: 'HZ', name: '杭州市', parentId: 'ZJ' },
	{ code: 'NB', name: '宁波市', parentId: 'ZJ' }
]
</script>

<template>
	<Lov v-model="province" :lov-api="regionApi" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择省份" />
	<!-- 子级：params 驱动数据刷新 + cascadeSource 驱动清空与禁用 -->
	<Lov v-model="city" :lov-api="regionApi" :params="{ parentId: province }" :cascade-source="province" :field-names="{ label: 'name', value: 'code' }" placeholder="请选择城市" />
</template>
```

基座联动模式下同样适用：值集编码模式（`lovCode`）的子级 Lov 直接绑 `:cascade-source` 即可获得相同语义，数据源仍走上下文。

## 示例四：弹窗自定义（columns 覆盖 + bodyCell 单元格渲染）

弹窗表格默认渲染「名称 / 编码」两列。`columns` prop 可整体覆盖弹窗列（列结构同 `MxColumn`）；`bodyCell` 作用域槽（`{ column, record, index }`）可自定义单元格渲染。仅远程接口模式生效。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Lov } from '@mengxi-ark/biz-components'
import type { MxColumn } from '@mengxi-ark/components'

const value = ref<string | null>(null)

const userApi = async () => USERS
const USERS = [
	{ code: 'U01', name: '张三', status: '1' },
	{ code: 'U02', name: '李四', status: '0' }
]

// 覆盖弹窗列：显示状态列而非编码列
const popupColumns: MxColumn[] = [
	{ dataIndex: 'name', title: '用户名称' },
	{ dataIndex: 'status', title: '状态' }
]
</script>

<template>
	<Lov v-model="value" :lov-api="userApi" :columns="popupColumns" :field-names="{ label: 'name', value: 'code' }">
		<template #bodyCell="{ column, record }">
			<template v-if="column.dataIndex === 'status'">
				<span :class="record.status === '1' ? 'is-on' : 'is-off'">
					{{ record.status === '1' ? '在职' : '离职' }}
				</span>
			</template>
			<template v-else>{{ record[column.dataIndex] }}</template>
		</template>
	</Lov>
</template>
```

触发器区已有默认插槽可整体替换展示内容（如「已选 3 项」徽标形式）；弹窗标题走 `popupTitle` prop。

## API

### LovProps

| 属性          | 类型                                               | 默认值                               | 说明                                                                                            |
| ------------- | -------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| modelValue    | `string \| number \| (string \| number)[] \| null` | `null`                               | 选中值（单选为 key，multiple 为 key 数组），v-model                                             |
| lovCode       | `string`                                           | —                                    | 值集编码（上下文 / props.lovCache 的 key）                                                      |
| lovApi        | `LovListApi`                                       | —                                    | 独立模式接口（上下文 lovListApi 优先）                                                          |
| params        | `Record<string, unknown>`                          | —                                    | 接口模式查询参数（变化时 300ms 防抖重查）                                                       |
| lovCache      | `Record<string, LovOption[]>`                      | —                                    | 静态值集缓存 props 兜底                                                                         |
| lovOptions    | `LovOption[]`                                      | —                                    | 静态选项 props 兜底（lovCode 未命中缓存时生效）                                                 |
| fieldNames    | `{ label: string; value: string }`                 | `{ label: 'label', value: 'value' }` | 行数据字段映射                                                                                  |
| multiple      | `boolean`                                          | `false`                              | 是否多选                                                                                        |
| size          | `'sm' \| 'md' \| 'lg'`                             | `'md'`                               | 尺寸语义                                                                                        |
| placeholder   | `string`                                           | `'请选择'`                           | 占位提示                                                                                        |
| disabled      | `boolean`                                          | `false`                              | 是否禁用                                                                                        |
| readonly      | `boolean`                                          | `false`                              | 只读（不弹出选择框）                                                                            |
| allowClear    | `boolean`                                          | `true`                               | 是否可清除                                                                                      |
| popupTitle    | `string`                                           | `'请选择'`                           | 弹窗标题                                                                                        |
| pageSize      | `number`                                           | `10`                                 | 弹窗表格每页条数                                                                                |
| cascadeSource | `string \| number \| (string \| number)[] \| null` | —                                    | 级联父级当前值：任何变化清空自身；传 null / 空数组视为父级为空 → 触发器禁用；未传视为未启用级联 |
| columns       | `MxColumn[]`                                       | 名称 / 编码两列                      | 弹窗表格列配置（覆盖默认列，仅远程接口模式生效）                                                |

### Events

| 事件              | 载荷                            | 说明                                             |
| ----------------- | ------------------------------- | ------------------------------------------------ |
| update:modelValue | `(value)`                       | v-model                                          |
| change            | `(value, options: LovOption[])` | 选中值变更，抛出归一化后的选项（单选为单项数组） |

### Slots

| 插槽     | 说明                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| default  | 触发器展示区自定义                                                                 |
| bodyCell | 弹窗表格单元格自定义渲染（作用域 `{ column, record, index }`，仅远程接口模式生效） |

## 相关教程

- [组件实战](/guide/components-guide)：第 3 步演示独立模式（api + params / cascadeSource 级联 / 弹窗自定义），第 5 步演示基座联动与降级差异。
