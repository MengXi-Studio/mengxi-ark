import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { createModuleRegistry } from '../index'
import type { ModuleDefinition } from '../../../types'

const Empty = defineComponent({ template: '<div />' })

function makeModule(id: string, extra: Partial<ModuleDefinition> = {}): ModuleDefinition {
	return { id, ...extra }
}

describe('moduleRegistryService', () => {
	it('register / get / list：登记与查询', () => {
		const registry = createModuleRegistry()
		registry.register(makeModule('a', { permissions: ['a:view'] }))
		registry.register(makeModule('b'))

		expect(registry.get('a')?.id).toBe('a')
		expect(registry.get('missing')).toBeUndefined()
		expect(registry.list().map(m => m.id)).toEqual(['a', 'b'])
	})

	it('register：重复 id 抛出 Error', () => {
		const registry = createModuleRegistry()
		registry.register(makeModule('a'))
		expect(() => registry.register(makeModule('a'))).toThrowError(/重复注册/)
	})

	it('collectRoutes / collectMenus：跨模块聚合', () => {
		const registry = createModuleRegistry()
		registry.register(makeModule('a', { routes: [{ path: '/a', component: Empty }], menus: [{ key: 'a', title: 'A' }] }))
		registry.register(makeModule('b', { menus: [{ key: 'b', title: 'B' }] }))

		expect(registry.collectRoutes().map(r => r.path)).toEqual(['/a'])
		expect(registry.collectMenus().map(m => m.key)).toEqual(['a', 'b'])
	})

	it('collectPermissions：合并去重', () => {
		const registry = createModuleRegistry()
		registry.register(makeModule('a', { permissions: ['a:view', 'common:view'] }))
		registry.register(makeModule('b', { permissions: ['b:view', 'common:view'] }))

		expect(registry.collectPermissions()).toEqual(['a:view', 'common:view', 'b:view'])
	})

	it('collectAppInitHooks / collectBeforeRouteHooks：仅收集已声明的钩子', () => {
		const registry = createModuleRegistry()
		const onAppInit = () => undefined
		const onBeforeRouteChange = () => undefined
		registry.register(makeModule('a', { lifecycle: { onAppInit, onBeforeRouteChange } }))
		registry.register(makeModule('b', { lifecycle: { onAppInit } }))
		registry.register(makeModule('c'))

		expect(registry.collectAppInitHooks()).toEqual([onAppInit, onAppInit])
		expect(registry.collectBeforeRouteHooks()).toEqual([onBeforeRouteChange])
	})
})
