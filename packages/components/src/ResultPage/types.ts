/**
 * ResultPage 结果页 Props / Slots 契约。
 * 纯展示件：不依赖任何 UI 库，样式仅引用 --mx-* token。
 */
export type ResultPageStatus = 'success' | 'error' | 'warning' | 'info'

export interface ResultPageProps {
	/** 结果状态 */
	status?: ResultPageStatus
	/** 主标题 */
	title?: string
	/** 副标题（补充说明） */
	subTitle?: string
}

export interface ResultPageSlots {
	/** 顶部自定义图示（默认按 status 渲染符号圆形） */
	default?: () => unknown
	/** 操作区（返回 / 继续等按钮） */
	extra?: () => unknown
}
