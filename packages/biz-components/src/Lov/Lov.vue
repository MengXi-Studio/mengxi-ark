<template>
	<!-- 静态值集模式：下拉直选 -->
	<component
		:is="adapter.Select"
		v-if="source.mode === 'static'"
		:model-value="modelProxy"
		:options="staticOptions"
		:size="size"
		:placeholder="placeholder"
		:disabled="cascadeDisabled"
		:allow-clear="allowClear"
		:multiple="multiple"
		@update:model-value="emitValue" />

	<!-- 远程接口模式：触发器 + 弹窗表格选择 -->
	<div v-else class="mx-lov">
		<div
			class="mx-lov__trigger"
			:class="[size ? `mx-lov__trigger--${size}` : '', { 'mx-lov__trigger--disabled': cascadeDisabled || readonly }]"
			role="combobox"
			:aria-disabled="cascadeDisabled || readonly"
			@click="openDialog">
			<slot>
				<span class="mx-lov__text" :class="{ 'mx-lov__text--placeholder': !displayText }">
					{{ displayText || placeholder }}
				</span>
				<span v-if="allowClear && !cascadeDisabled && !readonly && displayText" class="mx-lov__clear" aria-label="清空" @click.stop="handleClear">×</span>
			</slot>
		</div>

		<MxDialog v-model:open="dialogOpen" :title="popupTitle" :width="720" @ok="handleConfirm" @cancel="dialogOpen = false">
			<div class="mx-lov__search">
				<component :is="adapter.Input" v-model="keyword" :size="size" placeholder="输入关键字搜索" allow-clear />
				<component :is="adapter.Button" type="primary" :size="size" @click="searchNow">搜索</component>
			</div>
			<component
				:is="adapter.DataTable"
				:columns="dialogColumns"
				:data-source="dialogRows"
				:row-key="fieldNames.value"
				:loading="dialogLoading"
				:size="size"
				:pagination="dialogPagination"
				:row-selection="dialogRowSelection"
				@page-change="handlePageChange"
				@row-click="handleDialogRowClick">
				<template v-if="$slots.bodyCell" #bodyCell="binding">
					<slot name="bodyCell" v-bind="binding" />
				</template>
				<template #empty>
					<EmptyState description="暂无数据" />
				</template>
			</component>
		</MxDialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { EmptyState, MxDialog, useUiAdapter } from '@mengxi-ark/components'
import type { MxColumn, MxPaginationState, MxRowSelection } from '@mengxi-ark/components'
import { useRequest } from '@mengxi-ark/hooks'
import { useRuntimeContext } from '../context/resolve'
import { resolveLovSource } from './adapter'
import type { LovEmits, LovFieldNames, LovOption, LovProps, LovRow } from './types'

const props = withDefaults(defineProps<LovProps>(), {
	modelValue: null,
	lovCode: undefined,
	lovApi: undefined,
	params: undefined,
	lovCache: undefined,
	lovOptions: undefined,
	fieldNames: undefined,
	multiple: false,
	size: 'md',
	placeholder: '请选择',
	disabled: false,
	readonly: false,
	allowClear: true,
	popupTitle: '请选择',
	pageSize: 10,
	cascadeSource: undefined,
	columns: undefined
})

const emit = defineEmits<LovEmits>()

const adapter = useUiAdapter()

/** 基座上下文探测（缺失自动降级独立模式，不抛异常） */
const ctx = useRuntimeContext()

/** 数据源解析：上下文命中 → props 兜底 → 独立空态 */
const source = computed(() => resolveLovSource(ctx, props))

if (source.value.mode === 'static' && source.value.staticOptions.length === 0 && !source.value.api) {
	console.warn(
		'[mengxi-ark/Lov] 未探测到基座上下文，且未配置 lovApi / lovOptions / lovCache / lovCode，' + 'Lov 将以空选项独立运行（独立模式降级，不抛异常）。可通过 provide(MX_RUNTIME_CONTEXT_KEY) 或同名 props 配置数据源。'
	)
}

const fieldNames = computed<LovFieldNames>(() => ({
	label: props.fieldNames?.label ?? 'label',
	value: props.fieldNames?.value ?? 'value'
}))

const staticOptions = computed<LovOption[]>(() => source.value.staticOptions)

// —— 值双向绑定（v-model：update:modelValue + change 同步抛出） ——
const modelProxy = computed<string | number | Array<string | number> | null>(() => props.modelValue ?? (props.multiple ? [] : null))

/** 归一化单行数据 → LovOption（不绑定后端固定字段，label/value 由 fieldNames 映射；disabled 仅在为真时携带） */
function normalizeRow(row: LovRow): LovOption {
	const option: LovOption = {
		label: String(row[fieldNames.value.label] ?? ''),
		value: row[fieldNames.value.value] as string | number
	}
	if (row.disabled === true) option.disabled = true
	return option
}

/** 依据取值反查归一化选项（change 事件载荷） */
function resolveOptions(values: Array<string | number>): LovOption[] {
	if (source.value.mode === 'static') {
		return staticOptions.value.filter(option => values.includes(option.value))
	}
	return values.map(value => optionsCache.get(String(value))).filter((option): option is LovOption => option !== undefined)
}

function emitValue(value: string | number | Array<string | number> | null | undefined): void {
	const normalized = value === undefined || (Array.isArray(value) && value.length === 0 && !props.multiple) ? null : value
	const values = Array.isArray(normalized) ? normalized : normalized === null ? [] : [normalized]
	emit('update:modelValue', normalized)
	emit('change', normalized, resolveOptions(values))
}

// —— 级联语义（cascadeSource）：父值任何变化清空自身；父值为空时禁用触发器 ——
// 未传（undefined）视为未启用级联，不影响既有用法；传 null / 空数组视为父级为空 → 禁用
const cascadeEmpty = computed(() => {
	const source = props.cascadeSource
	return source === null || (Array.isArray(source) && source.length === 0)
})

const cascadeDisabled = computed(() => props.disabled || (props.cascadeSource !== undefined && cascadeEmpty.value))

/** 自身当前是否有选中值（用于避免父值未变语义下的无效清空 emit） */
function hasOwnValue(): boolean {
	return Array.isArray(props.modelValue) ? props.modelValue.length > 0 : props.modelValue !== null && props.modelValue !== undefined
}

// 父值任何变化（含被清空）即清空自身选中值，防脏数据；change 同步抛空选项
watch(
	() => props.cascadeSource,
	(val, old) => {
		if (val === old) return
		if (hasOwnValue()) emitValue(null)
	}
)

// —— 远程接口模式：弹窗表格（useRequest 自请求，params / keyword 变化防抖触发） ——
const DEBOUNCE_INTERVAL = 300

const dialogOpen = ref(false)
const keyword = ref('')
const page = reactive({ current: 1, size: props.pageSize })
const optionsCache = reactive(new Map<string, LovOption>())

const pendingSingle = ref<string | number | null>(null)
const pendingKeys = ref<Array<string | number>>([])

const request = useRequest<LovRow[] | { list: LovRow[]; total: number }, void>(
	() => {
		const merged: Record<string, unknown> = {
			...props.params,
			keyword: keyword.value,
			currentPage: page.current,
			pageSize: page.size
		}
		return source.value.api!(merged)
	},
	{ immediate: false }
)

const dialogRows = computed<LovRow[]>(() => {
	const data = request.data.value
	if (!data) return []
	return Array.isArray(data) ? data : data.list
})

const dialogLoading = computed(() => request.loading.value)

const dialogTotal = computed(() => {
	const data = request.data.value
	if (!data) return 0
	return Array.isArray(data) ? data.length : data.total
})

/** 接口返回 { list, total } 时启用分页；返回数组时视为全量数据，不分页 */
const dialogPagination = computed<MxPaginationState | false>(() => (request.data.value !== null && !Array.isArray(request.data.value) ? { current: page.current, size: page.size, total: dialogTotal.value } : false))

/** 弹窗表格列：columns prop 覆盖，默认「名称 / 编码」两列（fieldNames 映射） */
const dialogColumns = computed<MxColumn[]>(
	() =>
		props.columns ?? [
			{ dataIndex: fieldNames.value.label, title: '名称' },
			{ dataIndex: fieldNames.value.value, title: '编码' }
		]
)

const dialogRowSelection = computed<MxRowSelection | false>(() => {
	if (!props.multiple) return false
	return {
		selectedRowKeys: pendingKeys.value,
		onChange: (keys, rows) => {
			pendingKeys.value = keys
			for (const row of rows) {
				const option = normalizeRow(row)
				optionsCache.set(String(option.value), option)
			}
		}
	}
})

// 弹窗数据回填 → 归一化选项写入缓存（供触发器回显与 change 事件载荷使用）
watch(dialogRows, rows => {
	for (const row of rows) {
		const option = normalizeRow(row)
		optionsCache.set(String(option.value), option)
	}
})

function runSearch(): void {
	if (!source.value.api) return
	void request.run()
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined

function debouncedSearch(): void {
	if (debounceTimer !== undefined) clearTimeout(debounceTimer)
	debounceTimer = setTimeout(() => {
		page.current = 1
		runSearch()
	}, DEBOUNCE_INTERVAL)
}

// params / keyword 变化防抖重新请求（独立模式自请求契约）
watch(keyword, () => debouncedSearch())
watch(
	() => props.params,
	() => debouncedSearch(),
	{ deep: true }
)

onBeforeUnmount(() => {
	if (debounceTimer !== undefined) clearTimeout(debounceTimer)
})

function openDialog(): void {
	if (cascadeDisabled.value || props.readonly) return
	dialogOpen.value = true
	if (props.multiple) {
		pendingKeys.value = Array.isArray(props.modelValue) ? [...props.modelValue] : []
	} else {
		pendingSingle.value = props.modelValue === null || props.modelValue === undefined || typeof props.modelValue === 'object' ? null : props.modelValue
	}
	runSearch()
}

function searchNow(): void {
	if (debounceTimer !== undefined) clearTimeout(debounceTimer)
	page.current = 1
	runSearch()
}

function handlePageChange(current: number, size: number): void {
	page.current = current
	page.size = size
	runSearch()
}

function handleDialogRowClick(record: LovRow): void {
	if (props.multiple) return
	const option = normalizeRow(record)
	pendingSingle.value = option.value
	optionsCache.set(String(option.value), option)
}

function handleConfirm(): void {
	emitValue(props.multiple ? [...pendingKeys.value] : pendingSingle.value)
	dialogOpen.value = false
}

function handleClear(): void {
	emitValue(null)
}

/** 触发器回显文案（远程模式下选中值未在已拉取数据中时降级展示原始值） */
const displayText = computed(() => {
	const values = props.multiple ? (Array.isArray(props.modelValue) ? props.modelValue : []) : props.modelValue === null || props.modelValue === undefined ? [] : [props.modelValue]
	if (values.length === 0) return ''
	return values.map(value => optionsCache.get(String(value))?.label ?? String(value)).join('、')
})

// 挂载后自请求一次（独立模式契约：label 回显数据预热；基座联动模式同样生效）
onMounted(() => {
	if (source.value.mode === 'remote') {
		runSearch()
	}
})
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
