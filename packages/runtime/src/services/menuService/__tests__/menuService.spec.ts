import { describe, expect, it, vi } from 'vitest'
import { createMenuService, findMenuItem, flattenMenuItems } from '../index'

describe('menuService', () => {
	it('addMenu：顶层新增与响应式更新', () => {
		const service = createMenuService()
		service.addMenu({ key: 'a', title: 'A' })
		service.addMenu([
			{ key: 'b', title: 'B' },
			{ key: 'c', title: 'C' }
		])

		expect(service.menus.value.map(m => m.key)).toEqual(['a', 'b', 'c'])
	})

	it('addMenu：同 key 覆盖（后注册替换先注册）', () => {
		const service = createMenuService()
		service.addMenu({ key: 'a', title: '旧标题' })
		service.addMenu({ key: 'a', title: '新标题' })

		expect(service.menus.value).toHaveLength(1)
		expect(service.menus.value[0].title).toBe('新标题')
	})

	it('addMenu：parentKey 嵌套挂载', () => {
		const service = createMenuService()
		service.addMenu({ key: 'system', title: '系统管理' })
		service.addMenu([{ key: 'system-user', title: '用户管理', path: '/system/users' }], { parentKey: 'system' })
		service.addMenu([{ key: 'system-role', title: '角色管理' }], { parentKey: 'system' })

		const parent = service.menus.value[0]
		expect(parent.children?.map(m => m.key)).toEqual(['system-user', 'system-role'])
	})

	it('addMenu：parentKey 嵌套下同 key 覆盖', () => {
		const service = createMenuService()
		service.addMenu({ key: 'system', title: '系统管理' })
		service.addMenu({ key: 'system-user', title: '旧' }, { parentKey: 'system' })
		service.addMenu({ key: 'system-user', title: '新' }, { parentKey: 'system' })

		expect(service.menus.value[0].children).toHaveLength(1)
		expect(service.menus.value[0].children?.[0].title).toBe('新')
	})

	it('addMenu：父节点不存在时告警并忽略', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
		const service = createMenuService()
		service.addMenu({ key: 'orphan', title: '孤儿' }, { parentKey: 'no-such-parent' })

		expect(service.menus.value).toHaveLength(0)
		expect(warnSpy).toHaveBeenCalledTimes(1)
		warnSpy.mockRestore()
	})

	it('removeMenu：顶层与嵌套删除', () => {
		const service = createMenuService()
		service.addMenu({ key: 'system', title: '系统管理' })
		service.addMenu({ key: 'system-user', title: '用户管理' }, { parentKey: 'system' })
		service.addMenu({ key: 'biz', title: '业务' })

		service.removeMenu('system-user')
		expect(service.menus.value[0].children).toHaveLength(0)

		service.removeMenu('biz')
		expect(service.menus.value.map(m => m.key)).toEqual(['system'])

		service.removeMenu('no-such')
		expect(service.menus.value).toHaveLength(1)
	})

	it('findMenuItem / flattenMenuItems：深度查找与拍平', () => {
		const service = createMenuService()
		service.addMenu({ key: 'system', title: '系统管理' })
		service.addMenu({ key: 'system-user', title: '用户管理', path: '/system/users' }, { parentKey: 'system' })

		expect(findMenuItem(service.menus.value, 'system-user')?.path).toBe('/system/users')
		expect(findMenuItem(service.menus.value, 'missing')).toBeUndefined()
		expect(flattenMenuItems(service.menus.value).map(m => m.key)).toEqual(['system', 'system-user'])
	})
})
