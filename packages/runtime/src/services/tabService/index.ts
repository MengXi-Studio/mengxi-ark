/**
 * Tab 工作台服务（纯逻辑）：页签的打开 / 关闭 / 激活与弹窗栈管理。
 * UI 渲染由内置 Layout 或业务自定义 Layout 消费 tabs / activeKey / dialogs 完成。
 *
 * 打开策略（任务文档 Q2）：
 * - 'tab'（默认）：router.push + 新页签（同 fullPath 幂等合并）；
 * - 'current'：router.replace，当前页签原地更新 route / title（key 不变，页签栏稳定）；
 * - 'dialog'：目标须为 DialogPayload（业务组件直传，非路由挂载），
 *   误传路由目标时告警并降级为 'tab'。
 */
import { ref } from 'vue'
import type { RouteLocationRaw, Router } from 'vue-router'
import type { DialogItem, DialogPayload, TabItem, TabOpenOptions, TabService } from '../../types'

export interface CreateTabServiceOptions {
	/** 首页页签（closable false，不可关闭） */
	homeTab?: { route: RouteLocationRaw; title: string }
}

/** 路由目标的页签标题回退链：options.title → meta.title → route name → fullPath */
function resolveTitle(fullPath: string, meta: Record<string, unknown> | undefined, options?: TabOpenOptions): string {
	if (options?.title) return options.title
	const metaTitle = meta && typeof meta.title === 'string' ? meta.title : undefined
	return metaTitle ?? fullPath
}

function isDialogPayload(target: RouteLocationRaw | DialogPayload): target is DialogPayload {
	return typeof target === 'object' && target !== null && 'component' in target
}

/**
 * 创建 Tab 工作台服务。
 *
 * @param router 路由实例（open / activate / close 的导航副作用基于 router.push / replace）
 * @param options 配置项（homeTab 等）
 */
export function createTabService(router: Router, options: CreateTabServiceOptions = {}): TabService {
	const tabs = ref<TabItem[]>([])
	const activeKey = ref('')
	const dialogs = ref<DialogItem[]>([])
	const refreshTick = ref(0)
	let dialogSeq = 0

	if (options.homeTab) {
		const key = router.resolve(options.homeTab.route).fullPath
		tabs.value.push({ key, route: options.homeTab.route, title: options.homeTab.title, closable: false })
		activeKey.value = key
	}

	function upsertTab(key: string, route: RouteLocationRaw, title: string): void {
		const index = tabs.value.findIndex(tab => tab.key === key)
		if (index >= 0) {
			const existing = tabs.value[index]
			tabs.value.splice(index, 1, { ...existing, route, title })
		} else {
			tabs.value.push({ key, route, title, closable: true })
		}
		activeKey.value = key
	}

	function open(target: RouteLocationRaw | DialogPayload, tabOptions?: TabOpenOptions): void {
		if (isDialogPayload(target)) {
			openDialog(target)
			return
		}
		const openMode = tabOptions?.openMode === 'dialog' ? 'tab' : (tabOptions?.openMode ?? 'tab')
		if (tabOptions?.openMode === 'dialog') {
			console.warn('[@mengxi-ark/runtime] openMode "dialog" 需要 DialogPayload（业务组件直传），已降级为 "tab"')
		}
		const resolved = router.resolve(target)
		if (openMode === 'current' && activeKey.value) {
			// 当前页签内跳转：路由 replace，页签原地更新（key 保持稳定）
			const index = tabs.value.findIndex(tab => tab.key === activeKey.value)
			if (index >= 0) {
				const existing = tabs.value[index]
				tabs.value.splice(index, 1, { ...existing, route: target, title: resolveTitle(resolved.fullPath, resolved.meta, tabOptions) })
			}
			void router.replace(target)
			return
		}
		upsertTab(resolved.fullPath, target, resolveTitle(resolved.fullPath, resolved.meta, tabOptions))
		void router.push(target)
	}

	function close(key: string): void {
		const index = tabs.value.findIndex(tab => tab.key === key)
		if (index < 0) return
		if (tabs.value[index].closable === false) {
			console.warn(`[@mengxi-ark/runtime] 页签 "${key}" 不可关闭（closable: false）`)
			return
		}
		tabs.value.splice(index, 1)
		if (activeKey.value !== key) return
		// 关闭激活页签：优先激活左侧相邻，其次右侧，无剩余页签则清空
		const neighbor = tabs.value[Math.max(0, index - 1)] ?? tabs.value[index]
		if (neighbor) {
			activeKey.value = neighbor.key
			void router.push(neighbor.route)
		} else {
			activeKey.value = ''
		}
	}

	function activate(key: string): void {
		const tab = tabs.value.find(item => item.key === key)
		if (!tab || activeKey.value === key) return
		activeKey.value = key
		void router.push(tab.route)
	}

	/** 批量关闭：仅保留不可关闭页签与 keepKeys 命中页签；激活页签被关时回退到锚点页签 */
	function closeMany(keepKeys: Set<string>, anchorKey: string): void {
		const kept = tabs.value.filter(tab => tab.closable === false || keepKeys.has(tab.key))
		const activeClosed = activeKey.value !== '' && !kept.some(tab => tab.key === activeKey.value)
		tabs.value = kept
		if (!activeClosed) return
		const fallback = kept.find(tab => keepKeys.has(tab.key) && tab.key === anchorKey) ?? kept[kept.length - 1]
		if (fallback) {
			activeKey.value = fallback.key
			void router.push(fallback.route)
		} else {
			activeKey.value = ''
		}
	}

	function closeLeft(key: string): void {
		const index = tabs.value.findIndex(tab => tab.key === key)
		if (index <= 0) return
		closeMany(new Set(tabs.value.slice(index).map(tab => tab.key)), key)
	}

	function closeRight(key: string): void {
		const index = tabs.value.findIndex(tab => tab.key === key)
		if (index < 0 || index === tabs.value.length - 1) return
		closeMany(new Set(tabs.value.slice(0, index + 1).map(tab => tab.key)), key)
	}

	function closeOther(key: string): void {
		if (!tabs.value.some(tab => tab.key === key)) return
		closeMany(new Set([key]), key)
	}

	function refresh(key: string): void {
		if (!tabs.value.some(tab => tab.key === key)) return
		if (activeKey.value !== key) activate(key)
		refreshTick.value += 1
	}

	function openDialog(payload: DialogPayload): void {
		dialogSeq += 1
		dialogs.value.push({ key: `ark-dialog-${dialogSeq}`, ...payload })
	}

	function closeDialog(key: string): void {
		const index = dialogs.value.findIndex(item => item.key === key)
		if (index >= 0) dialogs.value.splice(index, 1)
	}

	return { tabs, activeKey, dialogs, refreshTick, open, close, closeLeft, closeRight, closeOther, refresh, activate, closeDialog }
}
