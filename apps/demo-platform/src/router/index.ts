import { createRouter, createWebHashHistory } from 'vue-router';
import { systemModule } from '../modules/systemModule';
import { bizModule } from '../modules/bizModule';

// 模块路由由 createArkRuntime 经 registerModule 注册（createArkRuntime 调用时即 addRoute，
// 早于 app.use(router) 的首次导航，无需在此重复声明）
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', redirect: '/system/users' }],
});
