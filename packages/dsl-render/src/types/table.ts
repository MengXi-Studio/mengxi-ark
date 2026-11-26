/**
 * TableSchema —— 表格 Schema（TableRenderer 渲染）。
 *
 * mode = 'table'（默认）：只读增强表格，组合 components EnhanceTable，数据外部驱动；
 * mode = 'document'：可编辑单据表格，组合 biz-components DocumentTable，
 * save 事件抛全量单据数据（不自带提交请求），权限走 DocumentTable 自身探测 / props 兜底。
 */
import type { MxColumn, MxSize } from '@mengxi-ark/components'
import type { DocCellRule } from '@mengxi-ark/biz-components'

/** 表格列 Schema（统一列结构 + document 模式单元格编辑能力） */
export interface TableColumnSchema extends MxColumn {
	/** document 模式：该列是否可编辑（函数形态按行数据判定，行级粒度） */
	editable?: boolean | ((row: Record<string, unknown>) => boolean)
	/** document 模式：编辑器类型，默认 'input' */
	editorType?: 'input' | 'select'
	/** document 模式：editorType === 'select' 时的选项 */
	editorOptions?: Array<{ label: string; value: string | number; disabled?: boolean }>
	/** document 模式：该列校验规则 */
	rules?: DocCellRule[]
	/** document 模式：列级权限码（some 语义） */
	permissionCode?: string | string[]
}

/** 表格 Schema */
export interface TableSchema {
	/** Schema 类别标识 */
	kind: 'table'
	/** 列配置（必填） */
	columns: TableColumnSchema[]
	/** 渲染模式：'table' 只读增强表格（默认）/' document' 可编辑单据 */
	mode?: 'table' | 'document'
	/** 行 key 字段名，默认 'id' */
	rowKey?: string
	/** 尺寸语义（sm | md | lg） */
	size?: MxSize
	/** 空状态描述文案（table 模式），默认「暂无数据」 */
	emptyText?: string
	/** document 模式：是否展示「新增行」按钮，默认 true */
	addable?: boolean
	/** document 模式：是否展示「删除行」按钮，默认 true */
	deletable?: boolean
	/** document 模式：是否展示「保存」按钮，默认 true */
	savable?: boolean
	/** document 模式：新增行按钮文案，默认「新增行」 */
	addText?: string
	/** document 模式：保存按钮文案，默认「保存」 */
	saveText?: string
	/** document 模式：权限码列表（props 兜底，上下文命中优先） */
	permissions?: string[]
}
