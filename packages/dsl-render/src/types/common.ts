/**
 * DSL Schema 公共类型（规范 §10：Schema 强 TS 类型，禁止 any 直传渲染器）。
 *
 * 联动 / 校验采用函数式声明（任务文档 Q3）：结构保持 JSON 形态，
 * `visible` / `rules.validator` 为 TS 增强能力，无法纯 JSON 序列化。
 */
import type { MxSelectOption, MxSize } from '@mengxi-ark/components'

/** 默认校验失败提示（required 未指定 message 时） */
export const DEFAULT_RULE_MESSAGE = '该字段不能为空'

/** 字段校验规则 */
export interface FieldRule {
	/** 是否必填（undefined / null / 空串视为未填） */
	required?: boolean
	/** 校验失败提示，默认「该字段不能为空」 */
	message?: string
	/** 自定义校验：返回错误文案，null / undefined 表示通过 */
	validator?: (value: unknown, values: Record<string, unknown>) => string | null
}

/** 字段 Schema 公共字段（FormRenderer 通用） */
export interface FieldSchemaBase {
	/** 组件类型（组件映射表 key，如 'input' | 'select' | 'lov'） */
	type: string
	/** 绑定字段名（values 的 key） */
	field: string
	/** 字段标签，缺省展示 field */
	label?: string
	/** 占位提示 */
	placeholder?: string
	/** 尺寸语义（sm | md | lg），缺省回退 Schema 级 size */
	size?: MxSize
	/** 初始值 */
	defaultValue?: unknown
	/** 禁用 */
	disabled?: boolean
	/** 只读 */
	readonly?: boolean
	/** 联动显隐：返回 false 时该字段不渲染（values 为当前表单值） */
	visible?: (values: Record<string, unknown>) => boolean
	/** 校验规则（submit 前统一执行） */
	rules?: FieldRule[]
	/** select 类字段的选项（FormRenderer 直传映射组件） */
	options?: MxSelectOption[]
	/** 透传给映射组件的 props */
	props?: Record<string, unknown>
}

/** Schema 类别 */
export type SchemaKind = 'query' | 'form' | 'table'

/** Schema 结构校验结果 */
export interface ValidationResult {
	/** 是否通过 */
	valid: boolean
	/** 错误清单（路径形如 fields[2].type） */
	errors: string[]
}

/** 判断是否为普通对象（排除 null / 数组） */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}
