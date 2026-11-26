---
'@mengxi-ark/runtime': minor
---

M3 中台基座：runtime 从占位壳落地为真实实现——createArkRuntime（Vue 插件 + 实例句柄二合一，install 装配上下文 provide / 模块路由 / beforeEach 守卫包装 / Layout 挂载 / onAppInit 队列）、五 service（tabService 三种 openMode / menuService / moduleRegistryService / sessionService 过期广播 + token 刷新调度 / contextService MX_RUNTIME_CONTEXT_KEY 下发）、内置可替换工作台 Layout（ArkWorkbenchLayout，UI 依赖收敛于 layout/），附 services 全量单测 39 用例与 demo-platform 中台示例工程、VitePress 中台进阶板块。
