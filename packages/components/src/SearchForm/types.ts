/**
 * SearchForm 高级查询区 Props / Emits / Slots 契约。
 * 值采集组件：内部维护表单值，search / reset 事件抛给上层（配合 hooks useTable 使用）。
 */
import type { MxSelectOption, MxSize } from '../adapter/types'

/** 查询字段类型 */
export type SearchFieldType = 'input' | 'select' | 'dateRange'

/** 查询字段配置 */
export interface SearchField {
	/** 字段名（search 事件 values 的 key） */
	name: string
	/** 字段标签 */
	label: string
	/** 控件类型 */
	type: SearchFieldType
	/** select 类型的选项 */
	options?: MxSelectOption[]
	/** 占位提示 */
	placeholder?: string
	/** 初始值（reset 恢复的基准） */
	initialValue?: unknown
	/** 控件宽度 */
	width?: number | string
	disabled?: boolean
}

export interface SearchFormProps {
	/** 查询字段配置（必填） */
	fields: SearchField[]
	/** 尺寸语义（sm | md | lg） */
	size?: MxSize
	/** 是否支持折叠展开（字段数超过 defaultCollapsedCount 时生效），默认 true */
	collapsible?: boolean
	/** 折叠时展示的字段数，默认 3 */
	defaultCollapsedCount?: number
	/** 查询按钮 loading */
	loading?: boolean
	/** 查询按钮文案，默认「查询」 */
	searchText?: string
	/** 重置按钮文案，默认「重置」 */
	resetText?: string
}

export interface SearchFormEmits {
	/** 点击查询：values 为当前表单值（未填项为 undefined） */
	(e: 'search', values: Record<string, unknown>): void
	/** 点击重置（恢复各字段 initialValue） */
	(e: 'reset'): void
}

export interface SearchFormSlots {
	/** 额外自定义字段区域（渲染在按钮之前） */
	extra?: () => unknown
}
