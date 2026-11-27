/**
 * 示例模块一：系统管理（用户管理页，演示 Lov 基座联动取上下文值集 / 接口）。
 * 模块包只依赖 @mengxi-ark/runtime 的 ModuleDefinition 类型（声明式字段），不 import 内部实现。
 */
import { SettingOutlined } from '@ant-design/icons-vue'
import type { ModuleDefinition } from '@mengxi-ark/runtime'

export const systemModule: ModuleDefinition = {
	id: 'system',
	routes: [
		{
			path: '/system/users',
			name: 'system-users',
			component: () => import('../views/UserManagePage.vue'),
			meta: { title: '用户管理' }
		}
	],
	menus: [
		{
			key: 'system',
			title: '系统管理',
			icon: SettingOutlined,
			children: [{ key: 'system-users', title: '用户管理', path: '/system/users' }]
		}
	],
	permissions: ['system:user:view']
}
