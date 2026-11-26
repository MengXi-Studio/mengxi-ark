/**
 * 示例模块二：业务（单据页，演示 DocumentTable 基座权限源 + 降级切换演示页）。
 */
import type { ModuleDefinition } from '@mengxi-ark/runtime';

export const bizModule: ModuleDefinition = {
  id: 'biz',
  routes: [
    {
      path: '/biz/orders',
      name: 'biz-orders',
      component: () => import('../views/OrderListPage.vue'),
      meta: { title: '单据管理' },
    },
    {
      path: '/biz/context-fallback',
      name: 'biz-context-fallback',
      component: () => import('../views/ContextFallbackDemo.vue'),
      meta: { title: '降级切换演示' },
    },
    {
      path: '/biz/dsl',
      name: 'biz-dsl',
      component: () => import('../views/DslDemoPage.vue'),
      meta: { title: 'DSL 渲染演示' },
    },
  ],
  menus: [
    {
      key: 'biz',
      title: '业务管理',
      children: [
        { key: 'biz-orders', title: '单据管理', path: '/biz/orders' },
        { key: 'biz-context-fallback', title: '降级切换演示', path: '/biz/context-fallback' },
        { key: 'biz-dsl', title: 'DSL 渲染演示', path: '/biz/dsl' },
      ],
    },
  ],
  permissions: ['biz:order:view', 'biz:order:edit'],
};
