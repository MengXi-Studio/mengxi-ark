/**
 * UI 适配器注入与默认解析（规范 §6.3）。
 *
 * 解析顺序：inject(UI_ADAPTER_KEY) 显式注入 → 默认适配器（Ant Design Vue，懒加载单例）。
 * 默认适配器内部对 UI 库组件全部走动态 import，未安装 ant-design-vue 时仅在使用
 * 适配器能力的组件渲染时才会触发加载，纯展示件（EmptyState 等）不受影响。
 */
import { inject } from 'vue';
import { createAntdvAdapter } from './antdv';
import { UI_ADAPTER_KEY } from './types';
import type { UiAdapter } from './types';

export { UI_ADAPTER_KEY };

let defaultAdapter: UiAdapter | undefined;

/**
 * 获取默认适配器（Ant Design Vue 懒加载单例）。
 */
export function getDefaultAdapter(): UiAdapter {
  defaultAdapter ??= createAntdvAdapter();
  return defaultAdapter;
}

/**
 * 组件内取 UI 适配器：优先 inject 显式注入，未注入回退默认适配器。
 *
 * 基座联动说明：业务或基座可经 `app.provide(UI_ADAPTER_KEY, adapter)` 全局替换 UI 库实现，
 * 例如注入 createElementPlusAdapter() 切换到 Element Plus。
 */
export function useUiAdapter(): UiAdapter {
  const injected = inject<UiAdapter | undefined>(UI_ADAPTER_KEY, undefined);
  return injected ?? getDefaultAdapter();
}
