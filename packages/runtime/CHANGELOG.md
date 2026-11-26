# @mengxi-ark/runtime

## 1.0.0-beta.0

### Major Changes

- v1.0.0-beta 公测首发：M0–M4 全量落地。utils（四类纯函数）/ theme（--mx-* Design Token + 暗色）/ hooks（useRequest / useTable / useForm 等）/ components（适配器 + 九组件）/ biz-components（Lov / DocumentTable 双模式）/ runtime（createArkRuntime + 五 service + 内置工作台 Layout）/ dsl-render（Schema 三件套 + validateSchema + 三渲染器 + 13 项映射表）/ cli（create-mengxi-ark 双模板 + 分档 .trae/rules）。

### Minor Changes

- 3b85078: M3 中台基座：runtime 从占位壳落地为真实实现——createArkRuntime（Vue 插件 + 实例句柄二合一，install 装配上下文 provide / 模块路由 / beforeEach 守卫包装 / Layout 挂载 / onAppInit 队列）、五 service（tabService 三种 openMode / menuService / moduleRegistryService / sessionService 过期广播 + token 刷新调度 / contextService MX_RUNTIME_CONTEXT_KEY 下发）、内置可替换工作台 Layout（ArkWorkbenchLayout，UI 依赖收敛于 layout/），附 services 全量单测 39 用例与 demo-platform 中台示例工程、VitePress 中台进阶板块。

### Patch Changes

- Updated dependencies [dc251b9]
- Updated dependencies [dc251b9]
- Updated dependencies [dc251b9]
- Updated dependencies [dc251b9]
- Updated dependencies
  - @mengxi-ark/components@1.0.0-beta.0
  - @mengxi-ark/biz-components@1.0.0-beta.0
