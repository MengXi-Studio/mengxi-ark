import { createApp, defineComponent, inject } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MX_RUNTIME_CONTEXT_KEY } from '@mengxi-ark/biz-components'
import { ARK_LAYOUT_COMPONENT_NAME, ARK_RUNTIME_KEY, createArkRuntime } from '../index'
import type { RuntimeContext } from '../types'

const Empty = defineComponent({ template: '<div />' })

function createTestRouter(): Router {
	return createRouter({
		history: createMemoryHistory(),
		routes: [{ path: '/', component: Empty }]
	})
}

function flushAsync(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0))
}

describe('createArkRuntime', () => {
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => undefined)
	})
	afterEach(() => {
		vi.restoreAllMocks()
	})

	function createRuntime() {
		const initOrder: string[] = []
		const router = createTestRouter()
		const runtime = createArkRuntime({
			router,
			context: {
				appName: '测试中台',
				user: { name: '基座用户' },
				permissions: ['base:view'],
				lovCache: { STATUS: [{ label: '启用', value: '1' }] }
			} satisfies RuntimeContext,
			modules: [
				{
					id: 'system',
					routes: [{ path: '/system/users', component: Empty, meta: { title: '用户管理' } }],
					menus: [{ key: 'system-users', title: '用户管理', path: '/system/users' }],
					permissions: ['system:user:view', 'base:view'],
					lifecycle: {
						onAppInit: () => {
							initOrder.push('module')
						}
					}
				}
			],
			homeTab: { route: '/', title: '首页' },
			onSessionExpired: () => {
				initOrder.push('expired')
			}
		})
		runtime.onAppInit(() => {
			initOrder.push('runtime')
		})
		return { router, runtime, initOrder }
	}

	it('install：上下文经 MX_RUNTIME_CONTEXT_KEY 下发（模块 permissions 合并去重）', () => {
		const { runtime } = createRuntime()
		const app = createApp(Empty)
		app.use(runtime)

		const injected = app.runWithContext(() => inject(MX_RUNTIME_CONTEXT_KEY)) as RuntimeContext | undefined
		expect(injected?.appName).toBe('测试中台')
		expect(injected?.permissions).toEqual(['base:view', 'system:user:view'])
		expect(runtime.context.permissions).toEqual(['base:view', 'system:user:view'])
	})

	it('install：runtime 句柄与 Layout 全局组件注册', () => {
		const { runtime } = createRuntime()
		const app = createApp(Empty)
		app.use(runtime)

		expect(app.runWithContext(() => inject(ARK_RUNTIME_KEY))).toBe(runtime)
		expect(app.component(ARK_LAYOUT_COMPONENT_NAME)).toBeTruthy()
	})

	it('install：模块路由经 addRoute 注册，菜单汇入 menuService，首页页签初始化', async () => {
		const { router, runtime } = createRuntime()
		const app = createApp(Empty)
		app.use(runtime)
		await router.push('/system/users')

		expect(router.resolve('/system/users').matched).toHaveLength(1)
		expect(runtime.menuService.menus.value.map(m => m.key)).toEqual(['system-users'])
		expect(runtime.tabService.tabs.value[0]).toMatchObject({ key: '/', title: '首页', closable: false })
	})

	it('install：onAppInit 队列按注册顺序执行（模块 lifecycle 在前）', async () => {
		const { initOrder, runtime } = createRuntime()
		const app = createApp(Empty)
		app.use(runtime)
		await flushAsync()

		expect(initOrder).toEqual(['module', 'runtime'])
		// install 后注册的 onAppInit 立即执行
		runtime.onAppInit(() => {
			initOrder.push('late')
		})
		await flushAsync()
		expect(initOrder).toEqual(['module', 'runtime', 'late'])
	})

	it('onBeforeRouteChange：任一钩子返回 false 阻断跳转', async () => {
		const { router, runtime } = createRuntime()
		runtime.onBeforeRouteChange(() => false)
		const app = createApp(Empty)
		app.use(runtime)
		await router.push('/')

		await router.push('/system/users')
		expect(router.currentRoute.value.fullPath).toBe('/')
	})

	it('onBeforeRouteChange：钩子按注册顺序执行，返回 true 继续', async () => {
		const { router, runtime } = createRuntime()
		const order: string[] = []
		runtime.onBeforeRouteChange(() => {
			order.push('first')
		})
		runtime.onBeforeRouteChange(() => {
			order.push('second')
			return true
		})
		const app = createApp(Empty)
		app.use(runtime)
		await router.push('/')
		order.length = 0 // 初始导航已触发钩子，清空后仅观测目标跳转

		await router.push('/system/users')
		expect(order).toEqual(['first', 'second'])
		expect(router.currentRoute.value.fullPath).toBe('/system/users')
	})

	it('registerModule：延迟注册模块（路由 / 菜单 / 权限 / 重复 id）', async () => {
		const { router, runtime, initOrder } = createRuntime()
		const app = createApp(Empty)
		app.use(runtime)
		await flushAsync()
		initOrder.length = 0

		runtime.registerModule({
			id: 'biz',
			routes: [{ path: '/biz/orders', component: Empty, meta: { title: '单据' } }],
			menus: [{ key: 'biz-orders', title: '单据管理', path: '/biz/orders' }],
			permissions: ['biz:order:view'],
			lifecycle: {
				onAppInit: () => {
					initOrder.push('biz')
				}
			}
		})
		await flushAsync()

		expect(router.resolve('/biz/orders').matched).toHaveLength(1)
		expect(runtime.menuService.menus.value.map(m => m.key)).toEqual(['system-users', 'biz-orders'])
		expect(runtime.context.permissions).toContain('biz:order:view')
		// install 后注册的模块 onAppInit 立即执行
		expect(initOrder).toEqual(['biz'])
		expect(() => runtime.registerModule({ id: 'system' })).toThrowError(/重复注册/)
	})

	it('onSessionExpired：快捷钩子与 sessionService.notifyExpired 联动', () => {
		const { runtime, initOrder } = createRuntime()
		expect(initOrder).toEqual([])

		runtime.sessionService.notifyExpired()
		expect(initOrder).toEqual(['expired'])
	})

	it('install：重复调用告警并忽略', () => {
		const { runtime } = createRuntime()
		const app = createApp(Empty)
		app.use(runtime)
		// Vue 的 app.use 会拦截重复插件，直接再调 install 验证 runtime 自身防重入
		runtime.install(app)

		expect(vi.mocked(console.warn)).toHaveBeenCalledWith(expect.stringContaining('install 重复调用已忽略'))
	})
})
