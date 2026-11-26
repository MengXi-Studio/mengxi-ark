/**
 * runtime 全局上下文契约（biz-components 的 inject 探测目标）。
 *
 * M3 runtime 经 provide(MX_RUNTIME_CONTEXT_KEY, ctx) 下发；本类型定义即探测契约，
 * 字段增删按破坏性变更走 Major 并附迁移说明（规范 §9.2.2）。
 * biz-components 禁止 import @mengxi-ark/runtime，仅通过本契约探测。
 */
import type { LovOption } from '../Lov/types'

export interface MxUserInfo {
	id?: string | number
	name?: string
	[key: string]: unknown
}

export interface MxTenantInfo {
	id?: string | number
	name?: string
	[key: string]: unknown
}

export interface MxOrgInfo {
	id?: string | number
	name?: string
	[key: string]: unknown
}

export interface MxRuntimeContext {
	/** 当前用户 */
	user?: MxUserInfo
	/** 当前租户 */
	tenant?: MxTenantInfo
	/** 当前组织 */
	org?: MxOrgInfo
	/** 权限码列表 */
	permissions?: string[]
	/**
	 * Lov 值集列表接口。
	 * props 兜底：Lov 组件的 lovApi prop（上下文命中优先，缺失回退同名 props）。
	 */
	lovListApi?: (params: Record<string, unknown>) => Promise<Record<string, unknown>[] | { list: Record<string, unknown>[]; total: number }>
	/**
	 * 值集缓存：key 同值集编码。
	 * props 兜底：Lov 组件的 lovCache prop（同名对应）。
	 */
	lovCache?: Record<string, LovOption[]>
}
