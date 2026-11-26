import type { InjectionKey } from 'vue'
import type { ArkRuntime } from './types'

/**
 * ArkRuntime 实例注入键：install 时经 app.provide 下发，
 * 内置 Layout（或业务自定义 Layout）inject 获取 tabService / menuService / context。
 */
export const ARK_RUNTIME_KEY: InjectionKey<ArkRuntime> = Symbol('ARK_RUNTIME_KEY')

/** 内置 Layout 注册的全局组件名（业务 App.vue 直接写 <ArkWorkbenchLayout />） */
export const ARK_LAYOUT_COMPONENT_NAME = 'ArkWorkbenchLayout'
