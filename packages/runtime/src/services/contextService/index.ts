/**
 * 上下文服务（纯逻辑）：以 biz-components 的 MX_RUNTIME_CONTEXT_KEY 下发响应式全局上下文。
 * 业务组件 inject 探测命中走基座联动；缺失字段回退同名 props（探测契约见 biz-components）。
 */
import { reactive } from 'vue'
import type { App } from 'vue'
import { MX_RUNTIME_CONTEXT_KEY } from '@mengxi-ark/biz-components'
import type { ContextService, RuntimeContext } from '../../types'

/**
 * 创建上下文服务。
 *
 * @param context 基座全局上下文（会被 reactive 化；模块 permissions 经 mergePermissions 并入）
 */
export function createContextService(context: RuntimeContext): ContextService {
	const reactiveContext = reactive(context) as RuntimeContext

	function provide(app: App): void {
		app.provide(MX_RUNTIME_CONTEXT_KEY, reactiveContext)
	}

	function mergePermissions(permissions: string[]): void {
		const existing = reactiveContext.permissions ?? (reactiveContext.permissions = [])
		for (const code of permissions) {
			if (!existing.includes(code)) existing.push(code)
		}
	}

	return { context: reactiveContext, provide, mergePermissions }
}

/**
 * 便捷下发：直接 app.provide(MX_RUNTIME_CONTEXT_KEY, reactive(context))。
 * 已用 createArkRuntime 的场景无需手动调用（install 内部完成）。
 */
export function provideContext(app: App, context: RuntimeContext): void {
	app.provide(MX_RUNTIME_CONTEXT_KEY, reactive(context))
}
