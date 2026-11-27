/**
 * @mengxi-ark/runtime 类型契约。
 *
 * - RuntimeContext 扩展 biz-components 的探测契约 MxRuntimeContext（上层 import 下层类型合法），
 *   字段增删按破坏性变更走 Major 并附迁移说明（规范 §9.2.2）；
 * - ModuleDefinition 只含声明式字段，模块包不 import runtime 内部实现，仅依赖本文件类型；
 * - 生命周期钩子 onAppInit / onBeforeRouteChange / onSessionExpired 可注册多个，按注册顺序执行。
 */
import type { App, Component, Ref } from 'vue'
import type { RouteLocationNormalized, RouteLocationRaw, RouteRecordRaw, Router } from 'vue-router'
import type { MxRuntimeContext } from '@mengxi-ark/biz-components'

/** runtime 全局上下文：扩展 biz-components 探测契约（MxRuntimeContext），基座可追加字段 */
export interface RuntimeContext extends MxRuntimeContext {
	/** 应用标题（内置工作台 Layout Logo 区展示） */
	appName?: string
}

/** 应用初始化钩子（install 后按注册顺序执行） */
export type AppInitHook = () => void | Promise<void>

/**
 * 路由前置钩子：按注册顺序执行，任一返回 false 阻断本次跳转。
 * 经 router.beforeEach 包装注册，不重写 router 原生 API。
 */
export type BeforeRouteHook = (to: RouteLocationNormalized, from: RouteLocationNormalized) => boolean | void | Promise<boolean | void>

/** 会话过期钩子（登出决策交给业务或 runtime 注册方，hook 自身不跳转路由） */
export type SessionExpiredHook = () => void

/** 模块级生命周期（并入全局钩子队列） */
export interface ModuleLifecycle {
	onAppInit?: AppInitHook
	onBeforeRouteChange?: BeforeRouteHook
}

/** 模块声明式定义（registerModule 注册中心的最小契约） */
export interface ModuleDefinition {
	/** 模块唯一标识（重复注册抛错） */
	id: string
	/** 模块路由（经 router.addRoute 注册） */
	routes?: RouteRecordRaw[]
	/** 模块菜单（汇入 menuService 菜单树） */
	menus?: MenuItem[]
	/** 模块权限码（合并去重汇入全局上下文 permissions） */
	permissions?: string[]
	/** 模块级生命周期钩子 */
	lifecycle?: ModuleLifecycle
}

/** 菜单项（menuService 菜单树节点；叶子菜单可带 path 供点击跳转） */
export interface MenuItem {
	key: string
	title: string
	/** 点击跳转的路由路径（叶子菜单） */
	path?: string
	/** 菜单图标组件 */
	icon?: Component
	children?: MenuItem[]
}

/** Tab 工作台页签 */
export interface TabItem {
	/** 页签标识（'tab' 模式为路由 fullPath；'current' 模式沿用当前页签 key） */
	key: string
	/** 页签对应路由（激活时 router.push 目标） */
	route: RouteLocationRaw
	title: string
	/** 是否可关闭，默认 true；首页页签传 false */
	closable?: boolean
}

/** 弹窗打开载荷（openMode 'dialog'：业务组件直传，非路由挂载，见任务文档 Q2） */
export interface DialogPayload {
	title: string
	component: Component
	/** 透传给业务组件的 props */
	props?: Record<string, unknown>
	width?: number | string
}

/** 弹窗实例（内置 Layout 内以 MxDialog 渲染） */
export interface DialogItem extends DialogPayload {
	key: string
}

/** Tab 打开策略 */
export type TabOpenMode = 'tab' | 'dialog' | 'current'

export interface TabOpenOptions {
	/** 打开策略：'tab' 新页签（默认）/ 'current' 当前页签内跳转 / 'dialog' 弹窗承载 */
	openMode?: TabOpenMode
	/** 页签标题（缺省回退路由 meta.title → name → path） */
	title?: string
}

/**
 * Tab 工作台服务（纯逻辑，UI 由内置 Layout 或业务自行渲染）。
 *
 * - open：'tab' → router.push + 新页签；'current' → router.replace 且当前页签原地更新；
 *   'dialog' → 目标须为 DialogPayload（业务组件直传），传路由目标时告警并降级为 'tab'；
 * - close：关闭后激活相邻页签；closable 为 false 的首页页签不可关闭；
 * - activate：激活页签并跳转其路由。
 */
export interface TabService {
	readonly tabs: Ref<TabItem[]>
	readonly activeKey: Ref<string>
	readonly dialogs: Ref<DialogItem[]>
	/** 页签刷新信号计数：refresh() 递增，Layout 以此作为 router-view 重挂载依据 */
	readonly refreshTick: Ref<number>
	open(target: RouteLocationRaw | DialogPayload, options?: TabOpenOptions): void
	close(key: string): void
	/** 关闭左侧所有可关闭页签（目标页签与不可关闭页签保留） */
	closeLeft(key: string): void
	/** 关闭右侧所有可关闭页签（目标页签与不可关闭页签保留） */
	closeRight(key: string): void
	/** 关闭除目标页签外的所有可关闭页签 */
	closeOther(key: string): void
	/** 刷新页签：非激活页签先激活再递增 refreshTick 触发重挂载 */
	refresh(key: string): void
	activate(key: string): void
	closeDialog(key: string): void
}

/**
 * 菜单服务：聚合各模块 menus + 手动 addMenu，输出响应式树供 Layout 渲染。
 */
export interface MenuService {
	readonly menus: Ref<MenuItem[]>
	/** 新增菜单（同 key 覆盖）；传 parentKey 时插入指定父节点的 children */
	addMenu(items: MenuItem | MenuItem[], options?: { parentKey?: string }): void
	removeMenu(key: string): void
}

/** token 刷新取值器：返回有效 token；返回空值或抛错视为刷新失败（广播 expired 并停止调度） */
export type TokenGetter = () => Promise<string | null | undefined> | string | null | undefined

export interface TokenRefreshOptions {
	/** 刷新间隔毫秒数，默认 5 分钟 */
	intervalMs?: number
}

/**
 * 会话服务：过期回调广播 + 轻量 token 定时刷新调度器（任务文档 Q4）。
 * 自身不持有 token，也不跳转路由。
 */
export interface SessionService {
	onExpired(hook: SessionExpiredHook): void
	/** 业务探测到会话过期时手动广播（触发全部 onExpired 钩子） */
	notifyExpired(): void
	startTokenRefresh(getToken: TokenGetter, options?: TokenRefreshOptions): void
	stopTokenRefresh(): void
}

/**
 * 上下文服务：以 biz-components 的 MX_RUNTIME_CONTEXT_KEY 下发响应式上下文，
 * 供业务组件 inject 探测（探测命中走基座联动，缺失字段回退 props 兜底）。
 */
export interface ContextService {
	readonly context: RuntimeContext
	provide(app: App): void
	/** 合并模块声明的权限码（去重） */
	mergePermissions(permissions: string[]): void
}

/**
 * 模块注册中心：仅做声明式字段的登记与聚合，不做路由/菜单副作用（由 createArkRuntime 调度）。
 */
export interface ModuleRegistry {
	register(module: ModuleDefinition): void
	get(id: string): ModuleDefinition | undefined
	list(): ModuleDefinition[]
	collectRoutes(): RouteRecordRaw[]
	collectMenus(): MenuItem[]
	collectPermissions(): string[]
	collectAppInitHooks(): AppInitHook[]
	collectBeforeRouteHooks(): BeforeRouteHook[]
}

export interface ArkRuntimeOptions {
	/** Tab 工作台与路由守卫基于该 router */
	router: Router
	/** 全局上下文（经 MX_RUNTIME_CONTEXT_KEY 下发给业务组件探测） */
	context: RuntimeContext
	/** 初始模块（也可安装后 runtime.registerModule 延迟注册） */
	modules?: ModuleDefinition[]
	/** 自定义工作台 Layout（不传用内置 ArkWorkbenchLayout） */
	layout?: Component
	/** 品牌 logo：图片地址渲染 <img>，或自定义组件；不传降级为 appName 首字方块（内置 Layout） */
	logo?: string | Component
	/** 头部右侧操作区组件（退出登录 / 消息铃铛等，渲染在内置 Layout header-actions 区） */
	headerActions?: Component
	/** 自定义用户区组件（如头像 + 下拉菜单：个人中心 / 退出登录）；传后替换内置头像 + 用户名渲染 */
	user?: Component
	/** 声明式用户菜单：保留内置头像 + 用户名，点击弹出下拉菜单（user 自定义组件存在时忽略本项） */
	userMenu?: { items: UserMenuItem[]; onClick?: (key: string) => void }
	/** 页签右键菜单配置：内置 刷新 / 关闭左侧 / 右侧 / 其他，可追加自定义项 */
	tabContextMenu?: TabContextMenuConfig
	/** 是否显示侧栏折叠条（默认 true；传 false 隐藏左下折叠条并禁用收起） */
	collapsible?: boolean
	/** 首页页签（不可关闭；不传则无首页页签） */
	homeTab?: { route: RouteLocationRaw; title: string }
	/** 会话过期快捷钩子（等价 runtime.onSessionExpired） */
	onSessionExpired?: SessionExpiredHook
}

/** 内置 Layout 的品牌配置（经 ARK_LAYOUT_OPTIONS_KEY 下发，install 时由 options.logo / options.headerActions 装配） */
export interface ArkLayoutOptions {
	logo?: string | Component
	headerActions?: Component
	user?: Component
	userMenu?: { items: UserMenuItem[]; onClick?: (key: string) => void }
	tabContextMenu?: TabContextMenuConfig
	collapsible?: boolean
}

/** 页签右键菜单自定义项（options.tabContextMenu.items，渲染在内置项之后） */
export interface TabContextMenuItem {
	/** 菜单项 key（onClick 回调入参） */
	key: string
	/** 菜单文案 */
	label: string
	/** 菜单图标组件 */
	icon?: Component
	/** 是否禁用 */
	disabled?: boolean
	/** 是否与前面项之间显示分隔线 */
	divided?: boolean
}

/** 页签右键菜单配置 */
export interface TabContextMenuConfig {
	/** 是否包含内置项（刷新 / 关闭左侧 / 关闭右侧 / 关闭其他），默认 true；传 false 仅渲染自定义项 */
	builtin?: boolean
	/** 追加的自定义菜单项（渲染在内置项之后，自动加分隔线） */
	items?: TabContextMenuItem[]
	/** 自定义项点击回调（itemKey 为菜单项 key，tabKey 为右键目标页签 key） */
	onClick?: (itemKey: string, tabKey: string) => void
}

/** 声明式用户菜单项（options.userMenu） */
export interface UserMenuItem {
	/** 菜单 key（onClick 回调入参） */
	key: string
	/** 菜单文案 */
	label: string
	/** 菜单图标组件 */
	icon?: Component
	/** 是否与前一项之间显示分隔线 */
	divided?: boolean
}

/** createArkRuntime 返回的实例句柄（Vue 插件 + 命令式 API 二合一，见任务文档 Q1） */
export interface ArkRuntime {
	readonly tabService: TabService
	readonly menuService: MenuService
	readonly sessionService: SessionService
	/** 响应式全局上下文（合并模块 permissions 后的引用） */
	readonly context: RuntimeContext
	registerModule(module: ModuleDefinition): void
	onAppInit(hook: AppInitHook): void
	onBeforeRouteChange(hook: BeforeRouteHook): void
	onSessionExpired(hook: SessionExpiredHook): void
	/**
	 * Vue 插件安装：① 上下文 provide ② 注册 runtime 自身与 Layout 全局组件
	 * ③ router.beforeEach 守卫包装 ④ 按注册顺序执行 onAppInit 队列。
	 */
	install(app: App): void
}
