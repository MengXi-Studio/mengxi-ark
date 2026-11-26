/**
 * QuerySchema —— 查询区 Schema（QueryRenderer 渲染）。
 *
 * 查询区为自渲染行内布局：字段经组件映射表解析，`visible` 基于当前查询值实时联动；
 * search / reset 事件抛给上层业务（渲染器不自带请求逻辑，配合 hooks useTable 使用）。
 */
import type { MxSelectOption } from '@mengxi-ark/components'

/** 查询字段 Schema */
export interface QueryFieldSchema {
	/** 组件类型（映射表 key：'input' | 'select' | 'dateRange' 等） */
	type: string
	/** 字段名（search 事件 values 的 key） */
	field: string
	/** 字段标签 */
	label?: string
	/** select 类型的选项 */
	options?: MxSelectOption[]
	/** 占位提示 */
	placeholder?: string
	/** 初始值（reset 恢复的基准） */
	initialValue?: unknown
	/** 控件宽度 */
	width?: number | string
	disabled?: boolean
	/** 联动显隐：返回 false 时该字段不渲染（values 为当前查询值） */
	visible?: (values: Record<string, unknown>) => boolean
	/** 透传给映射组件的 props */
	props?: Record<string, unknown>
}

/** 查询区 Schema */
export interface QuerySchema {
	/** Schema 类别标识 */
	kind: 'query'
	/** 查询字段配置（必填） */
	fields: QueryFieldSchema[]
	/** 查询按钮文案，默认「查询」 */
	searchText?: string
	/** 重置按钮文案，默认「重置」 */
	resetText?: string
	/** 查询按钮 loading */
	loading?: boolean
}
