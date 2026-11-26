/**
 * Lov 值集选择器 Props / Emits 契约（双模式：独立模式 / 基座联动模式）。
 *
 * - 独立模式：lovApi + params（接口模式）或 lovOptions / lovCache[lovCode]（静态值集模式），组件内部自请求；
 * - 基座联动模式：inject 探测 MX_RUNTIME_CONTEXT_KEY，复用上下文 lovListApi / 值集缓存，不 import runtime；
 * - 上下文字段全部支持 props 兜底：lovListApi ↔ lovApi、lovCache ↔ lovCache。
 */
import type { MxColumn, MxSize } from '@mengxi-ark/components'

/** Lov 行数据（不绑定后端固定字段，label/value 由 fieldNames 映射） */
export type LovRow = Record<string, unknown>

/**
 * Lov 列表接口约定：
 * 入参为查询参数（交互约定字段：keyword 关键字、currentPage / pageSize 分页）；
 * 返回全量数组（不分页）或 { list, total } 分页结构。
 */
export type LovListApi = (params: Record<string, unknown>) => Promise<LovRow[] | { list: LovRow[]; total: number }>

/** 归一化后的选项结构 */
export interface LovOption {
	label: string
	value: string | number
	disabled?: boolean
}

/** 行数据 → label / value 的字段映射 */
export interface LovFieldNames {
	/** 展示文本字段名，默认 'label' */
	label: string
	/** 取值字段名，默认 'value' */
	value: string
}

export interface LovProps {
	/** 选中值（单选为 key，multiple 为 key 数组；v-model） */
	modelValue?: string | number | Array<string | number> | null
	/** 值集编码（基座值集缓存 / props.lovCache 的 key） */
	lovCode?: string
	/** 独立模式接口（基座联动模式下优先复用上下文 lovListApi） */
	lovApi?: LovListApi
	/** 接口模式查询参数（变化时防抖重新请求） */
	params?: Record<string, unknown>
	/** 静态值集缓存 props 兜底：key 同值集编码 */
	lovCache?: Record<string, LovOption[]>
	/** 静态选项列表 props 兜底（lovCode 未命中缓存时生效） */
	lovOptions?: LovOption[]
	/** 行数据字段映射，默认 { label: 'label', value: 'value' } */
	fieldNames?: LovFieldNames
	/** 是否多选 */
	multiple?: boolean
	size?: MxSize
	placeholder?: string
	disabled?: boolean
	/** 只读（不弹出选择框） */
	readonly?: boolean
	/** 是否可清除，默认 true */
	allowClear?: boolean
	/** 弹窗标题，默认「请选择」 */
	popupTitle?: string
	/** 弹窗表格每页条数，默认 10 */
	pageSize?: number
	/**
	 * 级联父级当前值：任何变化时清空自身选中值（change 同步抛空选项）；
	 * 传 null 或空数组视为父级为空 → 触发器禁用（防无效请求）；未传（undefined）视为未启用级联。
	 * 级联深度与布局由宿主模板组合。
	 */
	cascadeSource?: string | number | Array<string | number> | null
	/** 弹窗表格列配置（覆盖默认「名称 / 编码」两列；列结构同 MxColumn），仅远程接口模式生效 */
	columns?: MxColumn[]
}

export interface LovEmits {
	(e: 'update:modelValue', value: string | number | Array<string | number> | null): void
	/** 选中值变更：抛出归一化后的选项（单选为单项数组） */
	(e: 'change', value: string | number | Array<string | number> | null, options: LovOption[]): void
}

export interface LovSlots {
	/** 触发器展示区自定义 */
	default?: () => unknown
	/** 弹窗表格单元格自定义渲染（作用域 { column, record, index }；仅远程接口模式生效） */
	bodyCell?: (binding: { column: { dataIndex: string; title: string }; record: LovRow; index: number }) => unknown
}
