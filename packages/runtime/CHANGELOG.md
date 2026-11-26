# @mengxi-ark/runtime

## 1.0.0-beta.0

- v1.0.0-beta 公测首发（M0–M4 全量落地，npm dist-tag `beta`）。
- createArkRuntime：Vue 插件 + 实例句柄二合一，install 装配上下文 provide / 模块路由 / beforeEach 守卫包装 / Layout 挂载 / onAppInit 队列；生命周期钩子 onAppInit / onBeforeRouteChange / onSessionExpired。
- 五 service：tabService（新页签 / 当前页 / 业务弹窗三种 openMode）、menuService、moduleRegistryService、sessionService（过期广播 + token 刷新调度）、contextService（MX_RUNTIME_CONTEXT_KEY 下发 + 权限合并）。
- 内置可替换工作台 Layout（ArkWorkbenchLayout），UI 依赖收敛于 layout/。
