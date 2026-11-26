import { createApp } from 'vue';
import { createArkRuntime } from '@mengxi-ark/runtime';
import '@mengxi-ark/theme';
import '@mengxi-ark/runtime/style.css';
import 'ant-design-vue/dist/reset.css';
import App from './App.vue';
import { router } from './router';
import { systemModule } from './modules/systemModule';
import { bizModule } from './modules/bizModule';
import { createMockLovApi } from './mock-api';

const router$ = router;

// createArkRuntime：Vue 插件 + 实例句柄二合一（模块路由在其内部即注册，早于首次导航）
const runtime = createArkRuntime({
  router: router$,
  context: {
    appName: '曦舟中台示例',
    user: { id: 1, name: '基座用户' },
    tenant: { id: 1, name: '梦曦工作室' },
    permissions: ['base:view'],
    lovListApi: createMockLovApi(),
    lovCache: {
      STATUS: [
        { label: '启用', value: '1' },
        { label: '停用', value: '0' },
      ],
      GENDER: [
        { label: '男', value: 'M' },
        { label: '女', value: 'F' },
      ],
    },
  },
  modules: [systemModule, bizModule],
  homeTab: { route: '/system/users', title: '用户管理' },
  onSessionExpired: () => {
    // 登出决策由基座注册方决定（hook 自身不跳转路由）
    console.warn('[demo-platform] 会话已过期，可在此跳转登录页');
  },
});

const app = createApp(App);
app.use(router$);
app.use(runtime);
app.mount('#app');
