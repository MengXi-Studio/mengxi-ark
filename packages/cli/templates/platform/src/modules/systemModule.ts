/**
 * 示例模块：模块包只依赖 @mengxi-ark/runtime 的 ModuleDefinition 类型（声明式字段），
 * 不 import runtime 内部实现。
 */
import type { ModuleDefinition } from '@mengxi-ark/runtime';

export const systemModule: ModuleDefinition = {
  id: 'system',
  routes: [
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/HomePage.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/system/users',
      name: 'system-users',
      component: () => import('../views/UserManagePage.vue'),
      meta: { title: '用户管理' },
    },
  ],
  menus: [
    {
      key: 'home',
      title: '首页',
      path: '/home',
    },
    {
      key: 'system',
      title: '系统管理',
      children: [{ key: 'system-users', title: '用户管理', path: '/system/users' }],
    },
  ],
  permissions: ['system:user:view'],
};
