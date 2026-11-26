/**
 * MxUpload 上传 Props / Emits / Slots 契约（UI 适配器 Upload 能力的统一壳）。
 * fileList 以 antdv UploadFile 语义为基准（MxUploadItem）。
 */
import type { MxUploadItem } from '../adapter/types'

export interface MxUploadProps {
	/** 上传地址 */
	action?: string
	/** 接受的文件类型 */
	accept?: string
	/** 是否支持多选 */
	multiple?: boolean
	/** 最大上传数量 */
	maxCount?: number
	disabled?: boolean
	/** 文件列表（v-model:fileList） */
	fileList?: MxUploadItem[]
}

export interface MxUploadEmits {
	(e: 'update:fileList', fileList: MxUploadItem[]): void
}

export interface MxUploadSlots {
	/** 触发上传的区域（默认渲染「上传文件」按钮） */
	default?: () => unknown
}
