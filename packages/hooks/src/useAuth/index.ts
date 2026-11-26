/**
 * useAuth —— 权限判断 hook 与 v-permission 指令（独立模式运行，不依赖 runtime / Pinia）。
 *
 * useAuth 降级链：显式传入 adapter → inject 探测（MX_AUTH_ADAPTER_KEY）→ setAuthAdapter
 * 模块级注册源 → 安全默认（hasPermission 恒为 false）并 console.warn 一次（silentWarn 可关）。
 * v-permission 指令运行于渲染周期之外、无法 inject，仅读取 setAuthAdapter 注册的模块级权限源。
 */
import { getCurrentInstance, inject } from 'vue'
import type { Directive, InjectionKey } from 'vue'

/** 权限判断模式：some 任一满足即通过，every 全部满足才通过 */
export type PermissionMode = 'some' | 'every'

/** 权限码：单个或列表 */
export type PermissionCode = string | string[]

/**
 * 权限适配器：由业务、Pinia store 或 runtime 提供。
 */
export interface AuthAdapter {
	/**
	 * 判断是否拥有权限。
	 * @param code - 权限码（单个或列表）
	 * @param mode - 判断模式，默认 some
	 */
	hasPermission: (code: PermissionCode, mode?: PermissionMode) => boolean
}

/**
 * inject key：基座或业务通过 app.provide(MX_AUTH_ADAPTER_KEY, adapter) 下发权限源。
 */
export const MX_AUTH_ADAPTER_KEY: InjectionKey<AuthAdapter> = Symbol('MX_AUTH_ADAPTER_KEY')

/** 默认权限判断模式：some */
const DEFAULT_PERMISSION_MODE: PermissionMode = 'some'
/** 默认开启降级警告（silentWarn: false） */
const DEFAULT_SILENT_WARN = false

/** 模块级权限源：供 v-permission 指令（无法 inject）与非组件环境使用 */
let moduleAuthAdapter: AuthAdapter | undefined
/** 指令侧「未注册权限源」警告只输出一次的标记 */
let moduleAdapterWarned = false

/**
 * 注册 / 清除模块级权限源（覆盖式）。
 *
 * v-permission 指令只能读取本注册源，应用或基座初始化时调用一次即可；传 undefined 可清除。
 * @param adapter - 权限适配器，传 undefined 清除
 */
export function setAuthAdapter(adapter?: AuthAdapter): void {
	moduleAuthAdapter = adapter
}

/**
 * useAuth 配置项。
 */
export interface UseAuthOptions {
	/** 降级（未找到权限源）时是否静默不警告，默认 false（每次调用警告一次） */
	silentWarn?: boolean
}

/**
 * useAuth 返回值。
 */
export interface UseAuthResult {
	/**
	 * 权限判断。
	 * @param code - 权限码（单个或列表）
	 * @param mode - 判断模式，默认 some
	 * @returns 是否拥有权限；未找到权限源时恒为 false
	 */
	hasPermission: (code: PermissionCode, mode?: PermissionMode) => boolean
}

/**
 * 权限判断 hook。
 *
 * 独立模式：未传入 adapter 且未探测到注入 / 模块级权限源时，hasPermission 恒为 false。
 * 基座联动模式：runtime 经 app.provide(MX_AUTH_ADAPTER_KEY) 或 setAuthAdapter 下发权限源后自动复用。
 *
 * @param adapter - 显式权限适配器（最高优先级，可不传）
 * @param options - 配置项，全部可选
 * @returns hasPermission 判断函数
 */
export function useAuth(adapter?: AuthAdapter, options: UseAuthOptions = {}): UseAuthResult {
	const silentWarn = options.silentWarn ?? DEFAULT_SILENT_WARN
	let resolved = adapter
	if (!resolved && getCurrentInstance()) {
		resolved = inject(MX_AUTH_ADAPTER_KEY, undefined)
	}
	if (!resolved) {
		resolved = moduleAuthAdapter
	}
	if (!resolved && !silentWarn) {
		console.warn('[mengxi-ark/useAuth] 未找到权限适配器，hasPermission 将始终返回 false。可通过参数传入 adapter、app.provide(MX_AUTH_ADAPTER_KEY) 或 setAuthAdapter() 注册权限源；设置 options.silentWarn 可关闭本警告。')
	}
	const finalResolved = resolved
	return {
		hasPermission(code, mode = DEFAULT_PERMISSION_MODE) {
			if (!finalResolved) return false
			return finalResolved.hasPermission(code, mode)
		}
	}
}

/** 每个元素的指令状态：占位注释节点 + disabled 属性是否由本指令写入 */
interface PermissionBindingState {
	/** 无权限移除元素时留下的占位注释节点，权限恢复后据此插回原位 */
	placeholder: Comment | null
	/** disabled 属性是否由本指令写入（只移除自己写入的属性） */
	disabledApplied: boolean
}

const permissionStateMap = new WeakMap<HTMLElement, PermissionBindingState>()

function warnDirectiveNoAdapter(): void {
	if (!moduleAdapterWarned) {
		moduleAdapterWarned = true
		console.warn('[mengxi-ark/v-permission] 未注册权限源，所有元素视为无权限。请先调用 setAuthAdapter() 注册权限适配器。')
	}
}

function restoreElement(el: HTMLElement, state: PermissionBindingState): void {
	const placeholder = state.placeholder
	if (placeholder && placeholder.parentNode) {
		const parent = placeholder.parentNode
		parent.insertBefore(el, placeholder)
		parent.removeChild(placeholder)
		state.placeholder = null
	}
}

function removeElement(el: HTMLElement, state: PermissionBindingState): void {
	const parent = el.parentNode
	if (!state.placeholder && parent) {
		const placeholder = document.createComment(' v-permission ')
		parent.insertBefore(placeholder, el)
		parent.removeChild(el)
		state.placeholder = placeholder
	}
}

function applyPermission(el: HTMLElement, value: PermissionCode, disabledMode: boolean): void {
	let state = permissionStateMap.get(el)
	if (!state) {
		state = { placeholder: null, disabledApplied: false }
		permissionStateMap.set(el, state)
	}
	let granted = false
	if (moduleAuthAdapter) {
		granted = moduleAuthAdapter.hasPermission(value, DEFAULT_PERMISSION_MODE)
	} else {
		warnDirectiveNoAdapter()
	}
	if (granted) {
		restoreElement(el, state)
		if (state.disabledApplied) {
			el.removeAttribute('disabled')
			state.disabledApplied = false
		}
		return
	}
	if (disabledMode) {
		// disabled 模式：不移除元素，仅置灰
		restoreElement(el, state)
		el.setAttribute('disabled', '')
		state.disabledApplied = true
		return
	}
	// 默认模式：移除元素（留占位注释，权限恢复后插回原位）
	if (state.disabledApplied) {
		el.removeAttribute('disabled')
		state.disabledApplied = false
	}
	removeElement(el, state)
}

/**
 * v-permission 指令：无权限时从 DOM 移除元素（removeChild），权限恢复后自动插回原位；
 * 使用 v-permission.disabled 修饰符时改为设置 disabled 属性置灰而不移除。
 * updated 钩子随组件重渲染重新判断，响应权限源变化。
 *
 * 权限源通过 setAuthAdapter() 注册（指令运行于渲染周期之外，无法 inject）。
 */
export const vPermission: Directive<HTMLElement, PermissionCode> = {
	mounted(el, binding) {
		applyPermission(el, binding.value, binding.modifiers.disabled === true)
	},
	updated(el, binding) {
		applyPermission(el, binding.value, binding.modifiers.disabled === true)
	},
	unmounted(el) {
		permissionStateMap.delete(el)
	}
}
