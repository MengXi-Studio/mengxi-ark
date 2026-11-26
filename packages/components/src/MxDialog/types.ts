/**
 * MxDialog 模态框 Props / Emits / Slots 契约（UI 适配器 Modal 能力的统一壳）。
 */
export interface MxDialogProps {
	/** 是否可见（v-model:open） */
	open?: boolean
	/** 标题 */
	title?: string
	/** 宽度 */
	width?: number | string
	/** 是否显示底部按钮区（false 隐藏；footer 插槽优先） */
	footer?: boolean
	/** 点击遮罩是否关闭 */
	maskClosable?: boolean
	/** 关闭时销毁内容 */
	destroyOnClose?: boolean
}

export interface MxDialogEmits {
	(e: 'update:open', open: boolean): void
	/** 点击确定 */
	(e: 'ok'): void
	/** 点击取消 / 遮罩 / 关闭按钮 */
	(e: 'cancel'): void
}

export interface MxDialogSlots {
	default?: () => unknown
	/** 自定义底部区域 */
	footer?: () => unknown
}
