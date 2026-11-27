/**
 * @mengxi-ark/runtime —— 中台基座（实施方案 §3.6 / §9）。
 *
 * - createArkRuntime：Vue 插件 + 实例句柄二合一（任务文档 Q1）：
 *   app.use(runtime) 完成装配（上下文 provide / 模块路由 / beforeEach 守卫包装 / Layout 挂载 / onAppInit 队列），
 *   同时持有 registerModule 等命令式 API（模块包延迟注册场景）；
 * - 五个纯逻辑 service：tabService / menuService / moduleRegistryService / sessionService / contextService；
 * - 不修改 Vue / Router 底层原型，路由守卫仅经 router.beforeEach 包装注册；
 * - 内置工作台 Layout 可经 options.layout 替换，UI 依赖（ant-design-vue）收敛于 layout/。
 */
import type { App } from 'vue'
import ArkWorkbenchLayout from './layout'
import { ARK_LAYOUT_COMPONENT_NAME, ARK_LAYOUT_OPTIONS_KEY, ARK_RUNTIME_KEY } from './key'
import { createContextService } from './services/contextService'
import { createMenuService } from './services/menuService'
import { createModuleRegistry } from './services/moduleRegistryService'
import { createSessionService } from './services/sessionService'
import { createTabService } from './services/tabService'
import type { AppInitHook, ArkRuntime, ArkRuntimeOptions, BeforeRouteHook, ModuleDefinition, SessionExpiredHook } from './types'

export { ARK_LAYOUT_COMPONENT_NAME, ARK_LAYOUT_OPTIONS_KEY, ARK_RUNTIME_KEY }

// —— services（纯逻辑，可独立组合使用） ——
export { createModuleRegistry } from './services/moduleRegistryService'
export { createMenuService, findMenuItem, flattenMenuItems } from './services/menuService'
export { createTabService } from './services/tabService'
export { createSessionService, DEFAULT_TOKEN_REFRESH_INTERVAL_MS } from './services/sessionService'
export { createContextService, provideContext } from './services/contextService'

// —— 内置 Layout ——
export { ArkWorkbenchLayout } from './layout'

export type {
	AppInitHook,
	ArkLayoutOptions,
	ArkRuntime,
	ArkRuntimeOptions,
	BeforeRouteHook,
	ContextService,
	DialogItem,
	DialogPayload,
	MenuItem,
	MenuService,
	ModuleDefinition,
	ModuleLifecycle,
	ModuleRegistry,
	RuntimeContext,
	SessionExpiredHook,
	SessionService,
	TabContextMenuItem,
	TabContextMenuConfig,
	TabItem,
	TabOpenMode,
	TabOpenOptions,
	TabService,
	TokenGetter,
	TokenRefreshOptions,
	UserMenuItem
} from './types'

/** 包版本常量（M0 包壳遗留，保持兼容） */
export const MENGXI_ARK_VERSION = '0.0.0'

/**
 * 创建中台基座运行时（Vue 插件 + 命令式 API 二合一）。
 *
 * 基座联动说明：install 后全局上下文经 MX_RUNTIME_CONTEXT_KEY 下发，
 * biz-components 组件 inject 探测命中即复用基座值集缓存 / 用户信息 / 权限，
 * 缺失字段自动回退同名 props（独立模式），无需业务显式切换。
 *
 * @param options 路由 / 上下文 / 初始模块 / 自定义 Layout / 品牌（logo、headerActions）/ 首页页签 / 会话过期钩子
 * @returns ArkRuntime 实例（app.use(runtime) 装配；runtime.registerModule 延迟注册模块）
 *
 * @example
 * const runtime = createArkRuntime({ router, context: { user, permissions, lovCache }, modules: [systemModule] });
 * app.use(router);
 * app.use(runtime);
 */
export function createArkRuntime(options: ArkRuntimeOptions): ArkRuntime {
	const { router, context, modules = [], layout } = options
	const layoutOptions = { logo: options.logo, headerActions: options.headerActions, user: options.user, userMenu: options.userMenu, tabContextMenu: options.tabContextMenu, collapsible: options.collapsible }
	const registry = createModuleRegistry()
	const menuService = createMenuService()
	const sessionService = createSessionService()
	const contextService = createContextService(context)

	const appInitHooks: AppInitHook[] = []
	const beforeRouteHooks: BeforeRouteHook[] = []
	let guardInstalled = false
	let installed = false

	/** 路由守卫：包装 onBeforeRouteChange 队列，按注册顺序执行，任一返回 false 阻断（禁止重写原生 API） */
	function ensureGuard(): void {
		if (guardInstalled) return
		guardInstalled = true
		router.beforeEach(async (to, from) => {
			for (const hook of beforeRouteHooks) {
				const result = await hook(to, from)
				if (result === false) return false
			}
		})
	}

	function runAppInitHook(hook: AppInitHook): void {
		if (!installed) {
			appInitHooks.push(hook)
			return
		}
		// install 之后注册 / 延迟注册模块的 onAppInit：立即执行
		void (async () => {
			try {
				await hook()
			} catch (error) {
				console.error('[@mengxi-ark/runtime] onAppInit 执行异常', error)
			}
		})()
	}

	/** 注册模块：路由 addRoute、菜单汇入、权限合并去重、生命周期并入全局队列 */
	function registerModule(module: ModuleDefinition): void {
		registry.register(module)
		for (const route of module.routes ?? []) router.addRoute(route)
		if (module.menus?.length) menuService.addMenu(module.menus)
		if (module.permissions?.length) contextService.mergePermissions(module.permissions)
		if (module.lifecycle?.onAppInit) runAppInitHook(module.lifecycle.onAppInit)
		if (module.lifecycle?.onBeforeRouteChange) beforeRouteHooks.push(module.lifecycle.onBeforeRouteChange)
	}

	for (const module of modules) registerModule(module)
	// 首页页签经 router.resolve 解析 fullPath，须在模块路由注册之后创建（避免路由未匹配告警）
	const tabService = createTabService(router, { homeTab: options.homeTab })
	if (options.onSessionExpired) sessionService.onExpired(options.onSessionExpired)

	const runtime: ArkRuntime = {
		tabService,
		menuService,
		sessionService,
		context: contextService.context,
		registerModule,
		onAppInit: runAppInitHook,
		onBeforeRouteChange(hook: BeforeRouteHook): void {
			beforeRouteHooks.push(hook)
			ensureGuard()
		},
		onSessionExpired(hook: SessionExpiredHook): void {
			sessionService.onExpired(hook)
		},
		install(app: App): void {
			if (installed) {
				console.warn('[@mengxi-ark/runtime] install 重复调用已忽略')
				return
			}
			installed = true
			// ① 全局上下文下发（MX_RUNTIME_CONTEXT_KEY，供业务组件 inject 探测）
			contextService.provide(app)
			// ② runtime 句柄下发（Layout inject 获取 tabService / menuService）
			app.provide(ARK_RUNTIME_KEY, runtime)
			// ③ 挂载工作台 Layout（可替换：options.layout 覆盖内置实现），品牌配置经 ARK_LAYOUT_OPTIONS_KEY 下发
			app.provide(ARK_LAYOUT_OPTIONS_KEY, layoutOptions)
			app.component(ARK_LAYOUT_COMPONENT_NAME, layout ?? ArkWorkbenchLayout)
			// ④ 路由守卫包装
			ensureGuard()
			// ⑤ onAppInit 队列按注册顺序执行
			void (async () => {
				for (const hook of appInitHooks.splice(0)) {
					try {
						await hook()
					} catch (error) {
						console.error('[@mengxi-ark/runtime] onAppInit 执行异常', error)
					}
				}
			})()
		}
	}

	return runtime
}
