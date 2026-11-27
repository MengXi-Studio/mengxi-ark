/**
 * 示例模块：模块包只依赖 @mengxi-ark/runtime 的 ModuleDefinition 类型（声明式字段），
 * 不 import runtime 内部实现。
 */
import { HomeOutlined, SettingOutlined } from '@ant-design/icons-vue'
import type { ModuleDefinition } from '@mengxi-ark/runtime'

export const systemModule: ModuleDefinition = {
	id: 'system',
	routes: [
		{
			path: '/home',
			name: 'home',
			component: () => import('../views/HomePage.vue'),
			meta: { title: '首页' }
		},
		{
			path: '/system/users',
			name: 'system-users',
			component: () => import('../views/UserManagePage.vue'),
			meta: { title: '用户管理' }
		}
	],
	menus: [
		// 菜单项：key / title 必填，叶子菜单带 path 供点击跳转（页签打开），icon 可选
		{
			key: 'home',
			title: '首页',
			path: '/home',
			icon: HomeOutlined
		},
		{
			key: 'system',
			title: '系统管理',
			icon: SettingOutlined,
			children: [{ key: 'system-users', title: '用户管理', path: '/system/users' }]
		}
	],
	permissions: ['system:user:view']
}
