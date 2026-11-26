/**
 * Lov 双模式数据源解析（上下文探测与 props 兜底装配）。
 *
 * 解析优先级（规范 §6.3.4）：
 * 1. 基座上下文命中 → 复用（lovCache 值集静态模式 / lovListApi 接口模式）；
 * 2. 缺失 → 回退同名 props（lovCache / lovOptions / lovApi）；
 * 3. 都无 → 独立空态（组件侧 warn 一次，不抛异常）。
 */
import type { LovListApi, LovOption, LovProps } from './types'
import type { MxRuntimeContext } from '../context/types'

/** 数据源形态：static 静态值集（下拉直选） / remote 远程接口（弹窗表格选择） */
export type LovMode = 'static' | 'remote'

export interface LovSourceResolution {
	mode: LovMode
	/** 数据源是否来自基座上下文（true = 基座联动模式） */
	fromContext: boolean
	/** 静态选项（mode === 'static' 时生效） */
	staticOptions: LovOption[]
	/** 远程接口（mode === 'remote' 时生效） */
	api?: LovListApi
}

const EMPTY_RESOLUTION: LovSourceResolution = { mode: 'static', fromContext: false, staticOptions: [] }

/**
 * 解析 Lov 数据源。
 */
export function resolveLovSource(ctx: MxRuntimeContext | null, props: LovProps): LovSourceResolution {
	// —— 值集编码静态命中：context.lovCache → props.lovCache → props.lovOptions ——
	if (props.lovCode) {
		const contextOptions = ctx?.lovCache?.[props.lovCode]
		if (contextOptions) {
			return { mode: 'static', fromContext: true, staticOptions: contextOptions }
		}
		const propsCacheOptions = props.lovCache?.[props.lovCode]
		if (propsCacheOptions) {
			return { mode: 'static', fromContext: false, staticOptions: propsCacheOptions }
		}
		if (props.lovOptions) {
			return { mode: 'static', fromContext: false, staticOptions: props.lovOptions }
		}
	} else if (props.lovOptions) {
		return { mode: 'static', fromContext: false, staticOptions: props.lovOptions }
	}

	// —— 远程接口：context.lovListApi → props.lovApi ——
	if (ctx?.lovListApi) {
		return { mode: 'remote', fromContext: true, staticOptions: [], api: ctx.lovListApi as LovListApi }
	}
	if (props.lovApi) {
		return { mode: 'remote', fromContext: false, staticOptions: [], api: props.lovApi }
	}

	return EMPTY_RESOLUTION
}
